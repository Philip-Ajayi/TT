// app/api/dashboard/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    // Use raw query for efficient sorting by paid order count
    const users = await prisma.$queryRaw<any[]>`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u."createdAt",
        COALESCE(p.paid_count, 0)::int AS "paidCount"
      FROM "User" u
      LEFT JOIN (
        SELECT "userId", COUNT(*)::int AS paid_count
        FROM "Order"
        WHERE "paymentDate" IS NOT NULL
        GROUP BY "userId"
      ) p ON u.id = p."userId"
      WHERE (
        ${search} = '' OR
        u.name ILIKE ${'%' + search + '%'} OR
        u.email ILIKE ${'%' + search + '%'}
      )
      ORDER BY "paidCount" DESC, u.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count total matching users for pagination
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "User" u
      LEFT JOIN (
        SELECT "userId", COUNT(*) AS paid_count
        FROM "Order"
        WHERE "paymentDate" IS NOT NULL
        GROUP BY "userId"
      ) p ON u.id = p."userId"
      WHERE (
        ${search} = '' OR
        u.name ILIKE ${'%' + search + '%'} OR
        u.email ILIKE ${'%' + search + '%'}
      )
    `;
    const totalCount = Number(countResult[0].count);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}