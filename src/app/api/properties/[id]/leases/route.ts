import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get property ID from params
    const propertyId = parseInt(params.id);
    
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

    // Fetch all leases for this property
    const leases = await prisma.lease.findMany({
      where: { propertyId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            cognitoId: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(leases);
  } catch (error) {
    console.error('Error fetching property leases:', error);
    return NextResponse.json({ 
      message: 'Error fetching property leases',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
