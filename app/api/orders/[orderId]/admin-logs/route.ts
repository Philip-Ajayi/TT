// app/api/orders/[orderId]/admin-logs/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }  // 👈 params is now a Promise
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { orderId } = await params;   // 👈 unwrap the Promise

    const logs = await prisma.adminLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    // Collect unique adminIds to fetch related users
    const adminIds = [...new Set(logs.map((log) => log.adminId).filter(Boolean))];

    const admins = adminIds.length
      ? await prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: {
            id: true,
            name: true,
            workplaces: {
              select: { address: true },
            },
          },
        })
      : [];

    const adminMap = new Map(admins.map((a) => [a.id, a]));

    const formattedLogs = logs.map((log) => {
      const admin = adminMap.get(log.adminId);
      return {
        adminName: admin?.name ?? log.adminName,
        workplace: admin?.workplaces.map((w) => w.address) ?? [],
        action: log.action,
        details: log.details,
      };
    });

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}