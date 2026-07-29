// app/api/dashboard/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Admin only
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { userId } = await params;  // ← Await the promise
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Build optional date filters
  const orderCreatedFilter: any = {};
  if (startDate) orderCreatedFilter.gte = new Date(startDate);
  if (endDate) orderCreatedFilter.lte = new Date(endDate);

  const paymentDateFilter: any = {};
  if (startDate) paymentDateFilter.gte = new Date(startDate);
  if (endDate) paymentDateFilter.lte = new Date(endDate);

  try {
    const [
      totalOrders,
      revenueByCurrency,
      notReceivedOrders,
      readyOrders,
      notReceivedOrConfirmedOrders,
    ] = await Promise.all([
      // 1. Total orders for this user
      prisma.order.count({
        where: {
          userId,
          createdAt: orderCreatedFilter,
        },
      }),

      // 2. Sum of netamount per currency for paid orders
      prisma.order.groupBy({
        by: ['currencyCode'],
        where: {
          userId,
          paymentDate: {
            not: null,
            ...(Object.keys(paymentDateFilter).length ? paymentDateFilter : {}),
          },
        },
        _sum: { netamount: true },
      }).then(groups =>
        groups.reduce((acc, curr) => {
          acc[curr.currencyCode] = curr._sum.netamount?.toNumber() ?? 0;
          return acc;
        }, {} as Record<string, number>)
      ),

      // 3. Orders where status != 'Order received'
      prisma.order.count({
        where: {
          userId,
          status: { not: 'Order received' },
          createdAt: orderCreatedFilter,
        },
      }),

      // 4. Orders where status = 'Ready'
      prisma.order.count({
        where: {
          userId,
          status: 'Ready',
          createdAt: orderCreatedFilter,
        },
      }),

      // 5. Orders not in ['Order received', 'Confirmed']
      prisma.order.count({
        where: {
          userId,
          status: { notIn: ['Order received', 'Confirmed'] },
          createdAt: orderCreatedFilter,
        },
      }),
    ]);

    return NextResponse.json({
      userId,
      totalOrders,
      revenueByCurrency,
      notReceivedOrders,
      readyOrders,
      notReceivedOrConfirmedOrders,
    });
  } catch (error) {
    console.error('User dashboard (admin) error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}