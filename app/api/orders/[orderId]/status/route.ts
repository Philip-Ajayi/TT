// app/api/orders/[orderId]/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// Define status hierarchy orders
const ORDER_STATUS_HIERARCHY = ['Received', 'Confirmed', 'Processing', 'Ready'];
const SUB_STATUS_HIERARCHY = ['Processing', 'Ready'];

// Helper to determine next status or handle null
function getNextStatus(
  current: string | null,
  target: 'order' | 'sub',
  direction?: 'next' | 'prev'
): string {
  const list = target === 'order' ? ORDER_STATUS_HIERARCHY : SUB_STATUS_HIERARCHY;

  if (!current) {
    return list[0]; // Start stage if null
  }

  const index = list.indexOf(current);
  if (index === -1) return list[0];

  if (direction === 'next') {
    return list[Math.min(index + 1, list.length - 1)];
  } else if (direction === 'prev') {
    return list[Math.max(index - 1, 0)];
  }
  return current;
}

// Generate random tracking code for return delivery
function generateReturnCode(): string {
  return 'RET-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }  // ✅ params is a Promise
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const adminUser = authCheck.session.user as any;
  const { orderId } = await params;   // ✅ await here – only once!

  try {
    const body = await req.json();
    const { targetType, targetId, direction, explicitStatus } = body;
    // targetType: 'order' | 'deliveryGroup' | 'subOrder'

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryGroups: {
          include: { subOrders: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Direct SubOrder Update
      if (targetType === 'subOrder') {
        const subOrder = await tx.subOrder.findUnique({ where: { id: targetId } });
        if (!subOrder) throw new Error('SubOrder not found');

        const newSubStatus =
          explicitStatus || getNextStatus(subOrder.status, 'sub', direction);

        await tx.subOrder.update({
          where: { id: targetId },
          data: { status: newSubStatus },
        });
      }

      // 2. Direct DeliveryGroup Update
      if (targetType === 'deliveryGroup') {
        const group = await tx.deliveryGroup.findUnique({ where: { id: targetId } });
        if (!group) throw new Error('DeliveryGroup not found');

        const newGroupStatus =
          explicitStatus || getNextStatus(group.status, 'sub', direction);

        // Update Delivery Group and propagate to all its suborders
        await tx.deliveryGroup.update({
          where: { id: targetId },
          data: { status: newGroupStatus },
        });

        await tx.subOrder.updateMany({
          where: { deliveryGroupId: targetId },
          data: { status: newGroupStatus },
        });
      }

      // 3. Direct Order Update
      if (targetType === 'order') {
        const newOrderStatus =
          explicitStatus || getNextStatus(order.status, 'order', direction);

        await tx.order.update({
          where: { id: orderId },
          data: { status: newOrderStatus },
        });

        // Propagate to delivery groups & suborders if applicable
        if (SUB_STATUS_HIERARCHY.includes(newOrderStatus)) {
          for (const dg of order.deliveryGroups) {
            await tx.deliveryGroup.update({
              where: { id: dg.id },
              data: { status: newOrderStatus },
            });
            await tx.subOrder.updateMany({
              where: { deliveryGroupId: dg.id },
              data: { status: newOrderStatus },
            });
          }
        }
      }

      // --- RECALCULATE INHERITED STATUSES ---
      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          deliveryGroups: {
            include: { subOrders: true },
          },
        },
      });

      if (!updatedOrder) return;

      // Rule C: Delivery Group inherits least status of suborders
      for (const dg of updatedOrder.deliveryGroups) {
        const validSubStatuses = dg.subOrders
          .map((so) => so.status)
          .filter((s): s is string => Boolean(s));

        if (
          validSubStatuses.length > 0 &&
          targetType !== 'deliveryGroup' &&
          targetType !== 'order'
        ) {
          const lowestSubStatus = SUB_STATUS_HIERARCHY.reduce((lowest, current) => {
            if (
              validSubStatuses.includes(current) &&
              SUB_STATUS_HIERARCHY.indexOf(current) <
                SUB_STATUS_HIERARCHY.indexOf(lowest)
            ) {
              return current;
            }
            return lowest;
          }, validSubStatuses[0]);

          await tx.deliveryGroup.update({
            where: { id: dg.id },
            data: { status: lowestSubStatus },
          });
        }
      }

      // Rule E: Order inherits least status of suborders and delivery groups
      if (targetType !== 'order') {
        const allDgStatuses = updatedOrder.deliveryGroups
          .map((dg) => dg.status)
          .filter((s): s is string => Boolean(s));

        if (allDgStatuses.length > 0) {
          const lowestDgStatus = SUB_STATUS_HIERARCHY.reduce((lowest, current) => {
            if (
              allDgStatuses.includes(current) &&
              SUB_STATUS_HIERARCHY.indexOf(current) <
                SUB_STATUS_HIERARCHY.indexOf(lowest)
            ) {
              return current;
            }
            return lowest;
          }, allDgStatuses[0]);

          await tx.order.update({
            where: { id: orderId },
            data: { status: lowestDgStatus },
          });
        }
      }

      // Rule G: Return Delivery Code Generation / Nullification
      const refreshedGroups = await tx.deliveryGroup.findMany({ where: { orderId } });
      for (const dg of refreshedGroups) {
        if (dg.returnLocation || dg.returnAddressId) {
          if (dg.status === 'Ready' && !dg.returndeliverycode) {
            await tx.deliveryGroup.update({
              where: { id: dg.id },
              data: { returndeliverycode: generateReturnCode() },
            });
          } else if (dg.status !== 'Ready' && dg.returndeliverycode) {
            await tx.deliveryGroup.update({
              where: { id: dg.id },
              data: { returndeliverycode: null },
            });
          }
        }
      }

      // Rule I: Admin log & Customer Notification
      await tx.adminLog.create({
        data: {
          adminId: adminUser.id,
          adminName: adminUser.name || 'Admin',
          orderId: orderId,
          action: 'STATUS_UPDATE',
          details: `Updated status target [${targetType}:${targetId || orderId}] with direction/status [${direction || explicitStatus}]`,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          title: 'Order Status Update',
          message: `Your order status has been updated.`,
          type: 'ORDER_UPDATE',
        },
      });
    });

    return NextResponse.json({ message: 'Status updated successfully' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}