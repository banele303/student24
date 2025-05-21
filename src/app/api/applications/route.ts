import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for applications with filtering
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    
    // Build the query
    const query: any = {
      where: {},
      include: {
        property: {
          include: {
            location: true
          }
        },
        tenant: true
      },
      orderBy: {
        applicationDate: 'desc'
      }
    };
    
    // Filter by user type and ID
    if (userId && userType) {
      if (userType === 'tenant') {
        query.where.tenantCognitoId = userId;
        
        // Tenants can only see their own applications
        if (authResult.userRole !== 'admin' && authResult.userId !== userId) {
          return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
      } else if (userType === 'manager') {
        // For managers, we need to find applications for properties they manage
        query.where.property = {
          managerCognitoId: userId
        };
        
        // Managers can only see applications for their properties
        if (authResult.userRole !== 'admin' && authResult.userId !== userId) {
          return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
      }
    }
    
    // Filter by application status
    if (status && status !== 'all') {
      query.where.status = status;
    }
    
    // Filter by property
    if (propertyId) {
      query.where.propertyId = parseInt(propertyId);
    }
    
    // Get applications
    const applications = await prisma.application.findMany(query);
    
    return NextResponse.json(applications);
  } catch (err: any) {
    console.error("Error retrieving applications:", err);
    return NextResponse.json(
      { message: `Error retrieving applications: ${err.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating a new application
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Safely parse the request body with error handling
    let body;
    try {
      // Clone the request to ensure we can read the body
      const clonedRequest = request.clone();
      const contentType = request.headers.get('content-type');
      
      // Check if content type is JSON
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        return NextResponse.json({ 
          message: 'Invalid content type. Expected application/json' 
        }, { status: 400 });
      }
      
      // Get the text first to validate it's not empty
      const text = await clonedRequest.text();
      console.log('Request body text:', text);
      
      if (!text || text.trim() === '') {
        return NextResponse.json({
          message: 'Empty request body'
        }, { status: 400 });
      }
      
      // Parse the JSON
      body = JSON.parse(text);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({
        message: `Failed to parse request body: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 400 });
    }
    
    // Validate required fields
    if (!body.propertyId || !body.tenantCognitoId) {
      return NextResponse.json(
        { message: 'Missing required fields: propertyId and tenantCognitoId are required' },
        { status: 400 }
      );
    }
    
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId: body.tenantCognitoId }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: parseInt(body.propertyId) }
    });
    
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Create the application
    const application = await prisma.application.create({
      data: {
        propertyId: parseInt(body.propertyId),
        tenantCognitoId: body.tenantCognitoId,
        applicationDate: new Date(),
        status: 'Pending',
        name: body.name || tenant.name,
        email: body.email || tenant.email,
        phoneNumber: body.phoneNumber || tenant.phoneNumber,
        message: body.message || ''
      },
      include: {
        property: {
          include: {
            location: true
          }
        },
        tenant: true
      }
    });
    
    return NextResponse.json(application, { status: 201 });
  } catch (err: any) {
    console.error("Error creating application:", err);
    return NextResponse.json(
      { message: `Error creating application: ${err.message}` },
      { status: 500 }
    );
  }
}
