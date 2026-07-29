//app\api\customer\address\route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// Simulated basic in-memory window-based rate limiting cache block
const rateLimitCache = new Map<string, { timestamp: number; count: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userData = rateLimitCache.get(userId);

  if (!userData) {
    rateLimitCache.set(userId, { timestamp: now, count: 1 });
    return false;
  }

  if (now - userData.timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitCache.set(userId, { timestamp: now, count: 1 });
    return false;
  }

  userData.count++;
  return userData.count > MAX_REQUESTS_PER_WINDOW;
}

// GET: List all registered shipping addresses for current session holder
export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { id: userId } = authCheck.session.user as any;

  try {
    const addresses = await prisma.customerAddress.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
      select: { id: true, label: true, address: true },
    });
    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new parsed geographical delivery destination profile
export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const currentUserId = (authCheck.session.user as any).id;

  if (isRateLimited(currentUserId)) {
    return NextResponse.json(
      { message: 'Too many operations requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  try {
    const { label, address, latitude, longitude, isDefault } = await req.json();

    if (!address || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: 'Missing structural geocoding verification coordinates' },
        { status: 400 }
      );
    }

    // Determine default status:
    // If explicitly set to true, unset other defaults, then set this one true.
    // If set to false, keep false.
    // If not provided, treat as false unless it's the user's first address.
    let finalIsDefault = isDefault === true;

    if (finalIsDefault) {
      // Un-default all other addresses for this user
      await prisma.customerAddress.updateMany({
        where: { userId: currentUserId },
        data: { isDefault: false },
      });
    }

    // If isDefault is not provided and this is the first address, make it default
    if (isDefault === undefined) {
      const existingAddressesCount = await prisma.customerAddress.count({
        where: { userId: currentUserId },
      });
      if (existingAddressesCount === 0) {
        finalIsDefault = true;
      }
    }

    // Create the new address
    await prisma.customerAddress.create({
      data: {
        userId: currentUserId,
        label: label?.trim() || null, // optional
        address: address.trim(),
        latitude,
        longitude,
        isDefault: finalIsDefault,
      },
    });

    return NextResponse.json({ message: 'Address created successfully' });
  } catch (error) {
    console.error('Address creation error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove specified destination node profile from address catalog
export async function DELETE(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const currentUserId = (authCheck.session.user as any).id;

  try {
    const { url } = req;
    const { searchParams } = new URL(url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ message: 'Target Address entry identifier key parameter required' }, { status: 400 });
    }

    const addressRecord = await prisma.customerAddress.findUnique({
      where: { id: addressId },
    });

    if (!addressRecord) {
      return NextResponse.json({ message: 'Address entry context record target not found' }, { status: 404 });
    }

    if (addressRecord.userId !== currentUserId) {
      return NextResponse.json({ message: 'Forbidden access scope modification' }, { status: 403 });
    }

    await prisma.customerAddress.delete({
      where: { id: addressId },
    });

    // If default node was deleted, reassign default label token to remaining primary index if possible
    if (addressRecord.isDefault) {
      const remainingNode = await prisma.customerAddress.findFirst({
        where: { userId: currentUserId },
      });
      if (remainingNode) {
        await prisma.customerAddress.update({
          where: { id: remainingNode.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ message: 'Address destination book entry dropped successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}