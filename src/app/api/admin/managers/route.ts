import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for all managers (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get status filter from query params if present
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Fetch managers with optional status filter
    const managers = await prisma.manager.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(managers);
  } catch (error: any) {
    console.error("Error retrieving managers:", error);
    return NextResponse.json(
      { message: `Error retrieving managers: ${error.message}` },
      { status: 500 }
    );
  }
}
