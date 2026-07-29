// app/api/stack/calculation/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET() {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  // Get the userId from the session
  const userId = authCheck.session?.user?.id;
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      companyAddresses,
      deliverySetup1,
      deliverySetup2,
      processingRules,
      discountRules,
      currencies,
      customerAddresses,
    ] = await Promise.all([
      prisma.companyAddress.findMany({
        where: { isActive: true },
        select: { address: true, longitude: true, latitude: true },
      }),
      prisma.deliverySetup1.findMany({
        select: { miles: true, pricePerMile: true },
      }),
      prisma.deliverySetup2.findMany({
        select: { quantity: true, multiplier: true },
      }),
      prisma.processingRule.findMany({
        select: { id: true, name: true, multiplier: true },
      }),
      prisma.discountRule.findMany({
        where: { active: true },
        select: { id: true, code: true, type: true, percentage: true, capNaira: true },
      }),
      prisma.currency.findMany({
        select: { id: true, code: true, multiplier: true },
      }),
      // Only the logged-in user’s addresses
      prisma.customerAddress.findMany({
        where: { userId },
        select: { id: true, label: true, longitude: true, latitude: true, isDefault: true },
      }),
    ]);

    return NextResponse.json({
      companyAddresses,
      deliverySetups1: deliverySetup1,
      deliverySetups2: deliverySetup2,
      processingRules,
      discountRules,
      currencies,
      customerAddresses,
    });
  } catch (error) {
    console.error('Calculation stack fetch error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}