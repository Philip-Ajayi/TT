// app/api/stack/order-edit/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { orderId } = await params;

    // 1–5: Static lists (companyAddresses removed – we’ll fetch the order’s one later)
    const [
      rawDeliverySetup1,
      rawDeliverySetup2,
      rawProcessingRules,
      rawDiscountRules,
      rawCurrencies,
    ] = await Promise.all([
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
        select: {
          id: true,
          code: true,
          type: true,
          percentage: true,
          capNaira: true,
        },
      }),
      prisma.currency.findMany({
        select: { id: true, code: true, multiplier: true },
      }),
    ]);

    const deliverySetup1 = rawDeliverySetup1.map((d) => ({
      miles: d.miles,
      pricePerMile: d.pricePerMile.toNumber(),
    }));
    const deliverySetup2 = rawDeliverySetup2.map((d) => ({
      quantity: d.quantity,
      multiplier: d.multiplier.toNumber(),
    }));
    const processingRules = rawProcessingRules.map((r) => ({
      id: r.id,
      name: r.name,
      multiplier: r.multiplier.toNumber(),
    }));
    const discountRules = rawDiscountRules.map((r) => ({
      id: r.id,
      code: r.code,
      type: r.type,
      percentage: r.percentage.toNumber(),
      capNaira: r.capNaira ? r.capNaira.toNumber() : null,
    }));
    const currencies = rawCurrencies.map((c) => ({
      id: c.id,
      code: c.code,
      multiplier: c.multiplier.toNumber(),
    }));

    // Fetch order – include the assigned company address directly
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        userId: true,
        netamount: true,
        totalserviceamount: true,
        totalreturndeliveryfee: true,
        totalpickdeliveryfee: true,
        discountAmount: true,
        discountRuleId: true,
        discountRuleCode: true,
        currencyCode: true,
        companyAddressId: true,
        companyAddress: {
          select: { address: true, longitude: true, latitude: true },
        },
        deliveryGroups: {
          select: {
            id: true,
            processingRuleId: true,
            processingRuleName: true,
            pickAddressId: true,
            pickLocation: true,
            returnAddressId: true,
            returnLocation: true,
            miles: true,
            deliveryMode: true,
            pickdeliveryfee: true,
            returndeliveryfee: true,
            subOrders: {
              select: {
                id: true,
                clothId: true,
                variantId: true,
                clothPartialServiceId: true,
                variantPartialServiceId: true,
                subOrderName: true,
                quantity: true,
                finalPrice: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Build companyAddresses array – only the one from the order (or empty)
    const companyAddresses = order.companyAddress ? [order.companyAddress] : [];

    // 7. Customer addresses for the order's user
    const customerAddresses = await prisma.customerAddress.findMany({
      where: { userId: order.userId },
      select: {
        id: true,
        label: true,
        address: true, 
        longitude: true,
        latitude: true,
        isDefault: true,
      },
    });

    // Map delivery groups with restored IDs and new fields
    const deliveryGroups = order.deliveryGroups.map((dg) => ({
      id: dg.id,
      processingRuleId: dg.processingRuleId,
      processingRuleName: dg.processingRuleName || '',
      pickAddressId: dg.pickAddressId,
      pickLocation: dg.pickLocation || '',
      returnAddressId: dg.returnAddressId,
      returnLocation: dg.returnLocation || '',
      miles: dg.miles ?? 0,
      deliveryMode: dg.deliveryMode || '',
      pickdeliveryfee: dg.pickdeliveryfee ? dg.pickdeliveryfee.toNumber() : 0,
      returndeliveryfee: dg.returndeliveryfee
        ? dg.returndeliveryfee.toNumber()
        : 0,
      subOrders: dg.subOrders.map((so) => ({
        id: so.id,
        clothId: so.clothId || null,
        variantId: so.variantId || null,
        clothPartialServiceId: so.clothPartialServiceId || null,
        variantPartialServiceId: so.variantPartialServiceId || null,
        name: so.subOrderName || '',
        quantity: so.quantity,
        finalPrice: so.finalPrice ? so.finalPrice.toNumber() : 0,
      })),
    }));

    const orderResponse = {
      netamount: order.netamount ? order.netamount.toNumber() : 0,
      totalserviceamount: order.totalserviceamount
        ? order.totalserviceamount.toNumber()
        : 0,
      totalreturndeliveryfee: order.totalreturndeliveryfee
        ? order.totalreturndeliveryfee.toNumber()
        : 0,
      totalpickdeliveryfee: order.totalpickdeliveryfee
        ? order.totalpickdeliveryfee.toNumber()
        : 0,
      discountAmount: order.discountAmount
        ? order.discountAmount.toNumber()
        : 0,
      discountRuleId: order.discountRuleId,
      discountRuleCode: order.discountRuleCode || '',
      currencyCode: order.currencyCode || '',
      companyAddressId: order.companyAddressId,
      deliveryGroups,
    };

    return NextResponse.json({
      companyAddresses, // now contains 0 or 1 item – the order’s own company address
      deliverySetup1,
      deliverySetup2,
      processingRules,
      discountRules,
      currencies,
      customerAddresses,
      order: orderResponse,
    });
  } catch (error) {
    console.error('Error in order-edit stack API:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
