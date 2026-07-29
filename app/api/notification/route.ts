//app/api/notification/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(true); // customer, admin, superadmin
  if (authCheck.error) return authCheck.error;

  const session = authCheck.session!;
  // Ensure user is present
  if (!session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;

  try {
    // Database-level pagination: counts + skip/take
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });
    const readCount = await prisma.notification.count({
      where: { userId, read: true },
    });
    const total = unreadCount + readCount;
    const offset = (page - 1) * limit;

    let items: any[] = [];

    // Combined ordering: unread (newest first) → read (oldest first)
    if (offset < unreadCount) {
      const unreadTake = Math.min(limit, unreadCount - offset);
      const unreadItems = await prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: unreadTake,
        select: { id: true, title: true, message: true, orderId: true, type: true },
      });
      items.push(...unreadItems);

      const remaining = limit - unreadItems.length;
      if (remaining > 0) {
        const readItems = await prisma.notification.findMany({
          where: { userId, read: true },
          orderBy: { createdAt: 'asc' },
          skip: 0,
          take: remaining,
          select: { id: true, title: true, message: true, orderId: true, type: true },
        });
        items.push(...readItems);
      }
    } else {
      const readSkip = offset - unreadCount;
      const readItems = await prisma.notification.findMany({
        where: { userId, read: true },
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