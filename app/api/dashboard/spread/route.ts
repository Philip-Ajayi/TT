// app/api/dashboard/spread/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  // Build parameterised date conditions
  const paymentDateCondition = startDate || endDate
    ? Prisma.sql`AND o."paymentDate" >= ${startDate ? new Date(startDate) : new Date('1900-01-01')} AND o."paymentDate" <= ${endDate ? new Date(endDate) : new Date('2100-01-01')}`
    : Prisma.empty;

  const expenseDateCondition = startDate || endDate
    ? Prisma.sql`AND e."createdAt" >= ${startDate ? new Date(startDate) : new Date('1900-01-01')} AND e."createdAt" <= ${endDate ? new Date(endDate) : new Date('2100-01-01')}`
    : Prisma.empty;

  try {
    // Combined list with pagination
    const transactions = await prisma.$queryRaw<any[]>`
      SELECT * FROM (
        SELECT
          'payment' AS type,
          o.id,
          o."userId" AS "userId",
          u.name AS "userName",
          o.netamount AS amount,
          o."currencyCode" AS "currencyCode",
          o."paymentDate" AS date
        FROM "Order" o
        JOIN "User" u ON o."userId" = u.id
        WHERE o."paymentDate" IS NOT NULL ${paymentDateCondition}
        UNION ALL
        SELECT
          'expense' AS type,
          e.id,
          e.creator AS "adminId",
          e.category AS "category",
          e."Amount" AS amount,
          e."currencyCode" AS "currencyCode",
          e."createdAt" AS date
        FROM "Expense" e
        WHERE 1=1 ${expenseDateCondition}
      ) combined
      ORDER BY date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count total rows for pagination
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM (
        SELECT o.id FROM "Order" o WHERE o."paymentDate" IS NOT NULL ${paymentDateCondition}
        UNION ALL
        SELECT e.id FROM "Expense" e WHERE 1=1 ${expenseDateCondition}
      ) combined
    `;
    const totalCount = Number(countResult[0].count);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Dashboard spread error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}