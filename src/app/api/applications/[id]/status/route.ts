import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// PUT handler for updating application status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get application ID from URL params
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate status field
    if (!body.status || !['Pending', 'Approved', 'Denied'].includes(body.status)) {
      return NextResponse.json(
        { message: 'Invalid status. Must be Pending, Approved, or Denied' },
        { status: 400 }
      );
    }

    // Find the application
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        property: true
      }
    });

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    // Authorization check - only allow managers who own the property or admins to update
    if (
      authResult.userRole !== 'admin' && 
      application.property.managerCognitoId !== authResult.userId
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to update this application' },
        { status: 403 }
      );
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status: body.status },
      include: {
        property: {
          include: {
            location: true
          }
        },
        tenant: true
      }
    });

    // If application is approved, we could automatically create a lease here
    // This would depend on your business logic
    let lease = null;
    if (body.status === 'Approved') {
      // Check if a lease already exists for this application
      const existingLease = await prisma.lease.findFirst({
        where: {
          propertyId: application.propertyId,
          tenantCognitoId: application.tenantCognitoId,
          status: 'Active'
        }
      });

      // Only create a lease if one doesn't exist
      if (!existingLease) {
        lease = await prisma.lease.create({
          data: {
            propertyId: application.propertyId,
            tenantCognitoId: application.tenantCognitoId,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default to 1 year lease
            monthlyRent: application.property.price,
            status: 'Active',
            depositAmount: application.property.price // Default deposit equal to one month's rent
          }
        });
      } else {
        lease = existingLease;
      }
    }

    return NextResponse.json({
      ...updatedApplication,
      lease
    });
  } catch (err: any) {
    console.error("Error updating application status:", err);
    return NextResponse.json(
      { message: `Error updating application status: ${err.message}` },
      { status: 500 }
    );
  }
}
