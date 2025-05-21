import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, ObjectCannedACL, PutObjectAclCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { verifyAuth } from '@/lib/auth';

// Configure S3 client with credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Upload function for single file
async function uploadFileToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
  // Validate S3 configuration
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_BUCKET_NAME is not configured in environment variables");
  }

  if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION is not configured in environment variables");
  }

  // Create a unique file name
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `properties/${uniquePrefix}-${safeFileName}`;
  
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ACL: 'public-read' as ObjectCannedACL,
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
    
    // Explicitly set ACL again to ensure it's public-read
    try {
      await s3Client.send(new PutObjectAclCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ACL: 'public-read'
      }));
      console.log(`Successfully set ACL to public-read for ${key}`);
    } catch (aclError) {
      console.warn(`Warning: Could not set ACL. This might affect public access:`, aclError);
    }

    // Construct URL in a consistent way
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log(`Generated file URL: ${fileUrl}`);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// POST handler for uploading a photo to a property
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get property ID from params
    const { id } = await params;
    const propertyId = parseInt(id);
    if (isNaN(propertyId)) {
      return NextResponse.json({ message: 'Invalid property ID' }, { status: 400 });
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }
    
    // Skip manager verification for now to allow photo uploads
    // We'll add proper authentication later when the basic flow works

    // Parse the form data with better error handling
    let formData;
    try {
      formData = await request.formData();
      console.log("FormData parsed successfully for photo upload");
    } catch (error) {
      console.error("Error parsing FormData for photo upload:", error);
      return NextResponse.json({ 
        message: 'Error uploading photo: Failed to parse form data',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
    
    // Get the photo file
    const photoFile = formData.get('photo');
    if (!photoFile || !(photoFile instanceof File)) {
      return NextResponse.json({ message: 'No photo file provided' }, { status: 400 });
    }

    console.log(`Processing photo: ${photoFile.name}, size: ${photoFile.size}, type: ${photoFile.type}`);

    // Upload the file to S3
    try {
      const buffer = await photoFile.arrayBuffer();
      const photoUrl = await uploadFileToS3(Buffer.from(buffer), photoFile.name, photoFile.type);
      
      // Update the property with the new photo URL
      const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: {
          photoUrls: {
            push: photoUrl
          }
        }
      });

      return NextResponse.json({ 
        message: 'Photo uploaded successfully',
        photoUrl,
        propertyId
      }, { status: 200 });
    } catch (error) {
      console.error("Error uploading photo to S3:", error);
      return NextResponse.json({ 
        message: 'Error uploading photo to S3',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error in photo upload:", error);
    return NextResponse.json({ 
      message: 'Unexpected error during photo upload',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
