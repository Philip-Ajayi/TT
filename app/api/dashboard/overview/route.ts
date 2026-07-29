// app/api/dashboard/overview/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

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

  const expenseCreatedFilter: any = {};
  if (startDate) expenseCreatedFilter.gte = new Date(startDate);
  if (endDate) expenseCreatedFilter.lte = new Date(endDate);

  try {
    const [
      uniqueUsers,
      revenueByCurrency,
      notReceivedOrders,
      readyOrders,
      notReceivedOrConfirmedOrders,
      totalOrders,
      expenditureByCurrency,
    ] = await Promise.all([
      // 1. Unique users with at least one order
      prisma.order.groupBy({
        by: ['userId'],
        where: { createdAt: orderCreatedFilter },
      }).then(groups => groups.length),

      // 2. Sum of netamount per currencyCode for paid orders
      prisma.order.groupBy({
        by: ['currencyCode'],
        where: {
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

      // 3. Orders not 'Order received'
      prisma.order.count({
        where: {
          status: { not: 'Received' },
          createdAt: orderCreatedFilter,
        },
      }),

      // 4. Orders 'Ready'
      prisma.order.count({
        where: {
          status: 'Ready',
          createdAt: orderCreatedFilter,
        },
      }),

      // 5. Orders not in 'Order received' or 'Confirmed'
      prisma.order.count({
        where: {
          status: { notIn: ['Received', 'Confirmed'] },
          createdAt: orderCreatedFilter,
        },
      }),

      // 6. Total number of orders
      prisma.order.count({
        where: { createdAt: orderCreatedFilter },
      }),

      // 7. Sum of Amount per currencyCode for expenses
      prisma.expense.groupBy({
        by: ['currencyCode'],
        where: { createdAt: expenseCreatedFilter },
        _sum: { Amount: true },
      }).then(groups =>
        groups.reduce((acc, curr) => {
          acc[curr.currencyCode] = curr._sum.Amount?.toNumber() ?? 0;
          return acc;
        }, {} as Record<string, number>)
      ),
    ]);

    return NextResponse.json({
      uniqueUsers,
      revenueByCurrency,
      notReceivedOrders,
      readyOrders,
      notReceivedOrConfirmedOrders,
      totalOrders,
      expenditureByCurrency,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}