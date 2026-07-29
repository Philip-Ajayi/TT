//app/api/address/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// GET: Fetch all company addresses
export async function GET() {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  try {
    const addresses = await prisma.companyAddress.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new company address (superadmin only)
export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { role } = authCheck.session.user as any;
  if (role !== 'superadmin') {
    return NextResponse.json(
      { message: 'Forbidden: Superadmin privilege required' },
      { status: 403 }
    );
  }

  try {
    const { address, latitude, longitude, isActive } = await req.json();

    if (!address || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields: address, latitude, longitude' },
        { status: 400 }
      );
    }


    // Create the address – we don't need to store the result
    await prisma.companyAddress.create({
      data: {
        address: address.trim(),
        latitude,
        longitude,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(
      { message: 'Company address created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Address creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create address' },
      { status: 500 }
    );
  }
}