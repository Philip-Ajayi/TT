//app/api/notification/admin/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(false); // admin/superadmin only
  if (authCheck.error) return authCheck.error;
  const session = authCheck.session!;
  const user = session.user as any;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  // 1. Build company filter based on role
  let companyFilter: any = {};

  if (user.role === 'admin') {
    // Fetch the admin's workplaces (company addresses)
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { workplaces: { select: { id: true } } },
    });

    if (!adminUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const workplaceIds = adminUser.workplaces.map((w) => w.id);

    // If admin has no workplaces, return empty result immediately
    if (workplaceIds.length === 0) {
      return NextResponse.json({
        notifications: [],
        page,
        limit,
        total: 0,
      });
    }

    companyFilter = { companyAddressId: { in: workplaceIds } };
  }
  // superadmin sees everything → companyFilter remains empty

  try {
    // 2. Counts for pagination calculations
    const unreadCount = await prisma.companyNotification.count({
      where: { ...companyFilter, read: false },
    });
    const readCount = await prisma.companyNotification.count({
      where: { ...companyFilter, read: true },
    });
    const total = unreadCount + readCount;

    const offset = (page - 1) * limit;
    let items: any[] = [];

    // 3. Fetch according to combined ordering:
    //    unread (newest first) → then read (oldest first)
    if (offset < unreadCount) {
      // Part of this page comes from unread
      const unreadTake = Math.min(limit, unreadCount - offset);
      const unreadItems = await prisma.companyNotification.findMany({
        where: { ...companyFilter, read: false },
        orderBy: { createdAt: 'desc' },          // newest first
        skip: offset,
        take: unreadTake,
        select: { id: true, title: true, message: true, orderId: true, type: true },
      });
      items.push(...unreadItems);

      const remaining = limit - unreadItems.length;
      if (remaining > 0) {
        // Fill the rest of the page with read notifications
        const readItems = await prisma.companyNotification.findMany({
          where: { ...companyFilter, read: true },
          orderBy: { createdAt: 'asc' },         // oldest first
          skip: 0,
          take: remaining,
          select: { id: true, title: true, message: true, orderId: true, type: true },
        });
        items.push(...readItems);
      }
    } else {
      // Entire page comes from read notifications
      const readSkip = offset - unreadCount;
      const readItems = await prisma.companyNotification.findMany({
        where: { ...companyFilter, read: true },
        orderBy: { createdAt: 'asc' },
        skip: readSkip,
        take: limit,
        select: { id: true, title: true, message: true, orderId: true, type: true },
      });
      items = readItems;
    }

    return NextResponse.json({ notifications: items, page, limit, total });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}