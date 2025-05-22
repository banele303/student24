import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Helper function to upload file to S3
async function uploadFileToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
  // Clean up the filename
  const cleanFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
  
  // Create a unique filename with timestamp to prevent overwriting
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000000);
  const fileName = `rooms/${timestamp}-${random}-${cleanFileName}`;
  
  try {
    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME || 'realstatee',
        Key: fileName,
        Body: file,
        ContentType: mimeType,
      },
    });

    // Wait for upload to complete
    await upload.done();
    console.log('Successfully uploaded file:', fileName);
    
    // No need to set ACL explicitly, it's often not allowed in modern S3 configurations
    // Instead, we can configure the bucket to allow public access through bucket policies
    console.log('Successfully set ACL to public-read for', fileName);
    
    // Generate the URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME || 'realstatee'}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${fileName}`;
    console.log('Generated file URL:', fileUrl);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

// Define interface for room data
interface RoomData {
  name: string;
  description: string;
  pricePerMonth: number;
  securityDeposit: number;
  squareFeet: number;
  beds: number;
  baths: number;
  roomType: string;
  capacity: number;
  isAvailable: boolean;
  availableFrom: Date | null;
  amenities: string[];
  features: string[];
  photoUrls: string[];
}

// POST handler for the create-room endpoint
// This is a specialized endpoint that handles room creation with JSON data
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get property ID from params
    const { id } = await params;
    const propertyId = parseInt(id);
    
    console.log('Request to create-room endpoint received for property ID:', propertyId);
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    // Process the request based on content type
    const contentType = request.headers.get('content-type') || '';
    console.log('Content type received:', contentType);
    
    let roomData: RoomData;
    
    // Handle the request based on content-type
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        console.log('FormData entries:', [...formData.entries()].map(([key]) => key).join(', '));
        
        if ([...formData.entries()].length === 0) {
          return NextResponse.json({ 
            message: 'Error creating room: Empty form data',
          }, { status: 400 });
        }
        
        // Extract room data from FormData
        roomData = {
          name: formData.get('name')?.toString() || '',
          description: formData.get('description')?.toString() || '',
          pricePerMonth: parseFloat(formData.get('pricePerMonth')?.toString() || '0'),
          securityDeposit: parseFloat(formData.get('securityDeposit')?.toString() || '0'),
          squareFeet: parseInt(formData.get('squareFeet')?.toString() || '0'),
          beds: parseInt(formData.get('beds')?.toString() || '1'),
          baths: parseFloat(formData.get('baths')?.toString() || '1'),
          roomType: formData.get('roomType')?.toString() || 'PRIVATE',
          capacity: parseInt(formData.get('capacity')?.toString() || '1'),
          isAvailable: formData.get('isAvailable') === 'true',
          availableFrom: formData.get('availableFrom') ? new Date(formData.get('availableFrom')?.toString() || '') : null,
          // Handle arrays
          amenities: processArrayField(formData.get('amenities')),
          features: processArrayField(formData.get('features')),
          photoUrls: [] as string[]
        };
        
        // Process photo uploads
        const photoUrls: string[] = [];
        
        // Try to get photos using both possible keys
        let photoEntries = formData.getAll('photos');
        console.log(`Found ${photoEntries.length} photos in FormData with key 'photos'`);
        
        // If no photos found with 'photos' key, try 'photo' key
        if (photoEntries.length === 0) {
          photoEntries = formData.getAll('photo');
          console.log(`Found ${photoEntries.length} photos in FormData with key 'photo'`);
        }
        
        // Also check if there are any entries with the key 'photoUrls'
        const photoUrlsEntries = formData.getAll('photoUrls');
        if (photoUrlsEntries.length > 0) {
          console.log(`Found ${photoUrlsEntries.length} entries with key 'photoUrls'`);
          
          // If they're files, add them to photoEntries
          for (const entry of photoUrlsEntries) {
            if (entry instanceof File) {
              photoEntries = [...photoEntries, entry];
            }
          }
        }
        
        // Now process all found photo entries
        if (photoEntries && photoEntries.length > 0) {
          console.log(`Processing ${photoEntries.length} photos for room`);
          
          // Upload each photo to S3
          for (const photoEntry of photoEntries) {
            try {
              if (photoEntry instanceof File) {
                console.log(`Processing photo as File: ${photoEntry.name}, size: ${photoEntry.size}, type: ${photoEntry.type}`);
                const photoBuffer = Buffer.from(await photoEntry.arrayBuffer());
                const photoUrl = await uploadFileToS3(photoBuffer, photoEntry.name, photoEntry.type);
                console.log('Successfully uploaded to S3, URL:', photoUrl);
                photoUrls.push(photoUrl);
              } else {
                console.log('Photo entry is not a File instance:', typeof photoEntry);
              }
            } catch (uploadError) {
              console.error('Error uploading photo:', uploadError);
            }
          }
        }
        
        // Log results of photo processing
        console.log(`Processed ${photoUrls.length} photos, URLs:`, photoUrls);
        
        // Add photoUrls to roomData
        roomData.photoUrls = photoUrls;
        
        console.log('FormData processed successfully');
      } catch (formError) {
        console.error('Error parsing FormData:', formError);
        return NextResponse.json({ 
          message: 'Error creating room: Invalid form data',
          error: formError instanceof Error ? formError.message : String(formError)
        }, { status: 400 });
      }
    } else if (contentType.includes('application/json')) {
      try {
        // For JSON content type, parse the request body as JSON
        const jsonData = await request.json();
        roomData = jsonData as RoomData;
        console.log('JSON data parsed successfully');
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        return NextResponse.json({ 
          message: 'Error creating room: Invalid JSON data',
          error: jsonError instanceof Error ? jsonError.message : String(jsonError)
        }, { status: 400 });
      }
    } else {
      // Unknown content type
      console.error('Unsupported content-type:', contentType);
      return NextResponse.json({ 
        message: `Error creating room: Unsupported content-type: ${contentType}`,
      }, { status: 400 });
    }
      
    // Check if we have valid room data
    if (!roomData || typeof roomData !== 'object') {
      return NextResponse.json({ 
        message: 'Error creating room: No valid room data provided',
      }, { status: 400 });
    }
      
      console.log('Room data processed:', roomData);
      
      // Create the room in the database
      const createdRoom = await prisma.room.create({
        data: {
          name: roomData.name,
          description: roomData.description || '',
          pricePerMonth: roomData.pricePerMonth,
          securityDeposit: roomData.securityDeposit || 0,
          squareFeet: roomData.squareFeet || 0,
          roomType: roomData.roomType || 'PRIVATE',
          capacity: roomData.capacity || 1,
          isAvailable: roomData.isAvailable === false ? false : true,
          propertyId: propertyId,
          amenities: Array.isArray(roomData.amenities) ? roomData.amenities : [],
          features: Array.isArray(roomData.features) ? roomData.features : [],
          photoUrls: Array.isArray(roomData.photoUrls) ? roomData.photoUrls : [],
          availableFrom: roomData.availableFrom ? new Date(roomData.availableFrom) : null,
          beds: roomData.beds || 1,
          baths: roomData.baths || 1,
        },
      });
      
      console.log('Room created successfully:', createdRoom);
      return NextResponse.json(createdRoom, { status: 201 });
  } catch (error) {
    console.error("Error in create-room endpoint:", error);
    return NextResponse.json({ 
      message: 'Error processing room creation request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to process array fields from FormData
function processArrayField(fieldValue: FormDataEntryValue | null): string[] {
  if (!fieldValue) return [];
  
  const valueStr = fieldValue.toString();
  if (!valueStr) return [];
  
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(valueStr);
    return Array.isArray(parsed) ? parsed : [valueStr];
  } catch {
    // If not valid JSON, treat as comma-separated string
    return valueStr.split(',').map(item => item.trim()).filter(Boolean);
  }
}
