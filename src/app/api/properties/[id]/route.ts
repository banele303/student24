import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { wktToGeoJSON } from '@terraformer/wkt';
import { S3Client, DeleteObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { verifyAuth } from '@/lib/auth';

// Using the shared Prisma client instance from @/lib/prisma

// Configure S3 client with credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper function to upload file to S3 (same as in the main properties route)
async function uploadFileToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
  // Implementation same as in properties/route.ts
  // Validate S3 configuration
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_BUCKET_NAME is not configured in environment variables");
  }

  if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION is not configured in environment variables");
  }

  // Create a more unique file name to prevent collisions
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `properties/${uniquePrefix}-${safeFileName}`;
  
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ACL: ObjectCannedACL.public_read,
    CacheControl: 'public, max-age=86400',
  };

  try {
    console.log(`Starting S3 upload for file: ${params.Key}`);
    
    // Use the Upload utility for better handling of large files
    const upload = new Upload({
      client: s3Client,
      params: params,
    });

    const result = await upload.done();
    console.log(`Successfully uploaded file: ${params.Key}`);

    // Construct URL in a consistent way
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log(`Generated file URL: ${fileUrl}`);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to delete a file from S3
async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // Implementation same as in properties/route.ts
  // Validate S3 configuration
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_BUCKET_NAME is not configured in environment variables");
  }

  try {
    // Extract the key from the URL
    const urlPath = new URL(fileUrl).pathname;
    const key = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted file: ${key}`);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// GET handler for a specific property
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = Number(paramId);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid property ID" }, { status: 400 });
    }
    
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        location: true,
      },
    });

    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const coordinates: { coordinates: string }[] =
      await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

    const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
    const longitude = geoJSON.coordinates[0];
    const latitude = geoJSON.coordinates[1];

    const propertyWithCoordinates = {
      ...property,
      location: {
        ...property.location,
        coordinates: {
          longitude,
          latitude,
        },
      },
    };
    
    return NextResponse.json(propertyWithCoordinates);
  } catch (err: any) {
    console.error("Error retrieving property:", err);
    return NextResponse.json(
      { message: `Error retrieving property: ${err.message}` },
      { status: 500 }
    );
  }
}

// PUT handler for updating a property
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['manager']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid property ID" }, { status: 400 });
    }
    
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!existingProperty) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    // Parse the form data
    const formData = await request.formData();
    console.log(`Updating property ${id}, request body:`, Object.fromEntries(formData.entries()));
    
    // Handle authorization check - ensure user can edit this property
    const managerCognitoId = formData.get('managerCognitoId') as string;
    if (managerCognitoId && managerCognitoId !== existingProperty.managerCognitoId) {
      const isAdmin = authResult.userRole === 'admin'; // Check if user is admin
      if (!isAdmin) {
        return NextResponse.json({ message: "Unauthorized to update this property" }, { status: 403 });
      }
    }

    // Extract location data
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const country = formData.get('country') as string;
    const postalCode = formData.get('postalCode') as string;

    // Get all files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith('photos')) {
        files.push(value);
      }
    }

    // Handle file uploads if any
    let photoUrls = existingProperty.photoUrls || [];
    
    if (files.length > 0) {
      try {
        // Upload new files
        const newPhotoUrls = await Promise.all(
          files.map(async file => {
            const buffer = await file.arrayBuffer();
            return uploadFileToS3(Buffer.from(buffer), file.name, file.type);
          })
        );
        
        // Replace or append photos based on request
        const replacePhotos = formData.get('replacePhotos') === 'true';
        if (replacePhotos) {
          // Delete existing photos from S3 if replace is specified
          if (photoUrls.length > 0) {
            try {
              await Promise.all(photoUrls.map((url: string) => deleteFileFromS3(url)));
              console.log('Successfully deleted old photos');
            } catch (deleteError) {
              console.error('Error deleting old photos:', deleteError);
              // Continue with the update even if deletion fails
            }
          }
          photoUrls = newPhotoUrls;
        } else {
          // Append new photos to existing ones
          photoUrls = [...photoUrls, ...newPhotoUrls];
        }
      } catch (uploadError) {
        console.error('Error uploading new photos:', uploadError);
        return NextResponse.json({ 
          message: `Error uploading photos: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}` 
        }, { status: 500 });
      }
    }

    // Update location if any location field is provided
    if (address || city || state || country || postalCode) {
      // Get existing location data
      const locationData = {
        address: address || existingProperty.location.address,
        city: city || existingProperty.location.city,
        state: state || existingProperty.location.state,
        country: country || existingProperty.location.country,
        postalCode: postalCode || existingProperty.location.postalCode,
      };
      
      // Update location
      await prisma.location.update({
        where: { id: existingProperty.location.id },
        data: locationData,
      });
    }

    // Extract and parse property data from form
    const propertyData: any = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'address' && key !== 'city' && key !== 'state' && 
          key !== 'country' && key !== 'postalCode' && 
          key !== 'managerCognitoId' && key !== 'replacePhotos' && 
          !key.startsWith('photos')) {
        propertyData[key] = value;
      }
    }

    // Update property with proper type handling
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        ...propertyData,
        photoUrls,
        // Parse array fields if present
        ...(propertyData.amenities && {
          amenities: Array.isArray(propertyData.amenities) 
            ? propertyData.amenities 
            : typeof propertyData.amenities === "string"
              ? propertyData.amenities.split(",")
              : undefined
        }),
        ...(propertyData.highlights && {
          highlights: Array.isArray(propertyData.highlights)
            ? propertyData.highlights
            : typeof propertyData.highlights === "string"
              ? propertyData.highlights.split(",")
              : undefined
        }),
        // Parse boolean fields if present
        ...(propertyData.isPetsAllowed !== undefined && {
          isPetsAllowed: propertyData.isPetsAllowed === "true"
        }),
        ...(propertyData.isParkingIncluded !== undefined && {
          isParkingIncluded: propertyData.isParkingIncluded === "true"
        }),
        // Parse numeric fields if present
        ...(propertyData.pricePerMonth !== undefined && {
          pricePerMonth: parseFloat(propertyData.pricePerMonth) || undefined
        }),
        ...(propertyData.securityDeposit !== undefined && {
          securityDeposit: parseFloat(propertyData.securityDeposit) || undefined
        }),
        ...(propertyData.applicationFee !== undefined && {
          applicationFee: parseFloat(propertyData.applicationFee) || undefined
        }),
        ...(propertyData.beds !== undefined && {
          beds: parseInt(propertyData.beds) || undefined
        }),
        ...(propertyData.baths !== undefined && {
          baths: parseFloat(propertyData.baths) || undefined
        }),
        ...(propertyData.squareFeet !== undefined && {
          squareFeet: parseInt(propertyData.squareFeet) || undefined
        }),
      },
      include: {
        location: true,
      },
    });

    // Fetch the updated location to get coordinates
    const updatedLocation = await prisma.$queryRaw<{ x: number, y: number }[]>`
      SELECT 
        ST_X(coordinates::geometry) as x,
        ST_Y(coordinates::geometry) as y
      FROM "Location"
      WHERE id = ${updatedProperty.location.id}
    `;

    // Add coordinates to the response
    const propertyWithCoordinates = {
      ...updatedProperty,
      location: {
        ...updatedProperty.location,
        coordinates: {
          latitude: updatedLocation[0]?.y,
          longitude: updatedLocation[0]?.x,
        },
      },
    };

    console.log("Property updated successfully:", propertyWithCoordinates);
    return NextResponse.json(propertyWithCoordinates);
  } catch (err: any) {
    console.error("Error updating property:", err);
    return NextResponse.json(
      { message: `Error updating property: ${err.message}` },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a property
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['manager']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid property ID" }, { status: 400 });
    }
    
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!existingProperty) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const managerCognitoId = searchParams.get('managerCognitoId');

    // Handle authorization check - ensure user can delete this property
    if (managerCognitoId && managerCognitoId !== existingProperty.managerCognitoId) {
      const isAdmin = authResult.userRole === 'admin'; // Check if user is admin
      if (!isAdmin) {
        return NextResponse.json({ message: "Unauthorized to delete this property" }, { status: 403 });
      }
    }

    // Delete photos from S3
    if (existingProperty.photoUrls && existingProperty.photoUrls.length > 0) {
      try {
        await Promise.all(existingProperty.photoUrls.map((url: string) => deleteFileFromS3(url)));
        console.log('Successfully deleted property photos');
      } catch (deleteError) {
        console.error('Error deleting property photos:', deleteError);
        // Continue with the deletion even if photo deletion fails
      }
    }

    // Delete property
    await prisma.property.delete({
      where: { id },
    });

    // Delete location
    await prisma.location.delete({
      where: { id: existingProperty.location.id },
    });

    return NextResponse.json({ message: "Property deleted successfully", id });
  } catch (err: any) {
    console.error("Error deleting property:", err);
    return NextResponse.json(
      { message: `Error deleting property: ${err.message}` },
      { status: 500 }
    );
  }
}
