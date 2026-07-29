// app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';
import { calculateMilesDistance } from '@/lib/utils/geo';
import { determineSubOrderPrice, determineDeliveryFee, applyDiscountRule } from '@/lib/utils/order-helpers';
import { Prisma } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { id, role } = authCheck.session.user as any;
  const { orderId } = await params;

  try {
    const order = await prisma.order.findFirst({
      where: role === 'customer' ? { id: orderId, userId: id } : { id: orderId },
      include: {
        user: { select: { name: true } },
        deliveryGroups: {
          include: {
            subOrders: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const response: any = {
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      currency: order.currencyCode,
      phoneNumber: order.phoneNumber,
      paymentDate: order.paymentDate,
      totalServiceAmount: order.totalserviceamount,
      totalPickDeliveryFee: order.totalpickdeliveryfee,
      totalReturnDeliveryFee: order.totalreturndeliveryfee,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      netAmount: order.netamount,
      deliveryGroups: order.deliveryGroups.map((dg) => ({
        id: dg.id,
        deliveryMode: dg.deliveryMode,
        processingRuleName: dg.processingRuleName,
        pickdeliveryfee: dg.pickdeliveryfee,
        returndeliveryfee: dg.returndeliveryfee,
        pickdeliverycode: dg.pickdeliverycode,
        returndeliverycode: dg.returndeliverycode,
        status: dg.status,
        pickLocation: dg.pickLocation,
        returnLocation: dg.returnLocation,
        subOrders: dg.subOrders.map((so) => ({
          name: so.subOrderName,
          quantity: so.quantity,
          finalPrice: so.finalPrice,
        })),
      })),
    };

    if (role === 'admin' || role === 'super_admin') {
      response.customerName = order.user?.name || null;
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------
// PUT handler
// ----------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { id: userId, role } = authCheck.session.user as any;
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { orderId } = await params;

  try {
    // 1. Load existing order with all relations
    const existingOrder = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        deliveryGroups: {
          include: {
            subOrders: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      currencyCode,
      discountRuleCode,
      discountAmount,
      deliveryGroups: incomingGroups,
    } = body;

    // ---------- 2. CURRENCY CHANGE ----------
    let activeCurrencyCode = existingOrder.currencyCode;
    if (currencyCode && currencyCode !== existingOrder.currencyCode) {
      const newCurrency = await prisma.currency.findUnique({ where: { code: currencyCode } });
      if (!newCurrency) {
        return NextResponse.json({ message: 'Invalid currency code' }, { status: 400 });
      }
      const oldCurrency = await prisma.currency.findUnique({ where: { code: existingOrder.currencyCode } });
      if (!oldCurrency) {
        return NextResponse.json({ message: 'Current currency record missing' }, { status: 500 });
      }

      const ratio = new Prisma.Decimal(newCurrency.multiplier)
        .div(new Prisma.Decimal(oldCurrency.multiplier))
        .toNumber();

      const convert = (val: Prisma.Decimal | null) =>
        val !== null ? new Prisma.Decimal(val).times(ratio) : null;

      existingOrder.totalAmount = convert(existingOrder.totalAmount);
      existingOrder.totalpickdeliveryfee = convert(existingOrder.totalpickdeliveryfee);
      existingOrder.totalreturndeliveryfee = convert(existingOrder.totalreturndeliveryfee);
      existingOrder.totalserviceamount = convert(existingOrder.totalserviceamount);
      existingOrder.discountAmount = convert(existingOrder.discountAmount);
      existingOrder.netamount = convert(existingOrder.netamount);

      for (const dg of existingOrder.deliveryGroups) {
        for (const so of dg.subOrders) {
          so.finalPrice = convert(so.finalPrice);
        }
        dg.pickdeliveryfee = convert(dg.pickdeliveryfee) ?? new Prisma.Decimal(0);
        dg.returndeliveryfee = convert(dg.returndeliveryfee) ?? new Prisma.Decimal(0);
      }

      activeCurrencyCode = newCurrency.code;
    }

    // ---------- 3. PROCESS DELIVERY GROUPS ----------
    if (incomingGroups !== undefined) {
      // Collect current customer addresses
      const customerAddresses = await prisma.customerAddress.findMany({
        where: { userId: existingOrder.userId },
        select: { id: true },
      });
      const currentAddressIds = new Set(customerAddresses.map(a => a.id));

      // Also allow addresses that were already used in this order (even if deleted)
      const legacyAddressIds = new Set<string>();
      for (const dg of existingOrder.deliveryGroups) {
        if (dg.pickAddressId) legacyAddressIds.add(dg.pickAddressId);
        if (dg.returnAddressId) legacyAddressIds.add(dg.returnAddressId);
      }
      const allowedAddressIds = new Set([...currentAddressIds, ...legacyAddressIds]);

      const companyAddress = await prisma.companyAddress.findUnique({
        where: { id: existingOrder.companyAddressId ?? '' },
      });

      const existingGroupsMap = new Map(existingOrder.deliveryGroups.map(g => [g.id, g]));
      const updatedGroups: any[] = [];

      for (const ig of incomingGroups) {
        if (!ig.deliveryMode || !ig.processingRuleId) {
          return NextResponse.json(
            { message: 'Each delivery group must have deliveryMode and processingRuleId' },
            { status: 400 }
          );
        }
        if (ig.pickAddressId && !allowedAddressIds.has(ig.pickAddressId)) {
          return NextResponse.json({ message: 'Invalid pickAddressId' }, { status: 400 });
        }
        if (ig.returnAddressId && !allowedAddressIds.has(ig.returnAddressId)) {
          return NextResponse.json({ message: 'Invalid returnAddressId' }, { status: 400 });
        }

        let group: any;
        const existingGroup = ig.id ? existingGroupsMap.get(ig.id) : undefined;

        if (existingGroup) {
          group = {
            ...existingGroup,
            deliveryMode: ig.deliveryMode,
            processingRuleId: ig.processingRuleId,
            pickAddressId: ig.pickAddressId ?? null,
            returnAddressId: ig.returnAddressId ?? null,
          };

          const incomingSubOrders = ig.subOrders || [];
          if (incomingSubOrders.length === 0) {
            return NextResponse.json(
              { message: 'Each delivery group must have at least one suborder' },
              { status: 400 }
            );
          }

          const existingSubOrdersMap = new Map(group.subOrders.map((so: any) => [so.id, so]));
          const newSubOrders = [];
          for (const iso of incomingSubOrders) {
            const existingSubOrder = iso.id ? existingSubOrdersMap.get(iso.id) : undefined;
            const prepared = await prepareSubOrder(
              iso,
              existingSubOrder,
              group.processingRuleId,
              activeCurrencyCode,
            );
            newSubOrders.push(prepared);
          }
          group.subOrders = newSubOrders;
        } else {
          // New group
          if (!ig.subOrders || ig.subOrders.length === 0) {
            return NextResponse.json(
              { message: 'New delivery group must include at least one suborder' },
              { status: 400 }
            );
          }

          group = {
            id: generateGroupId(orderId),
            deliveryMode: ig.deliveryMode,
            processingRuleId: ig.processingRuleId,
            processingRuleName: null,
            pickAddressId: ig.pickAddressId ?? null,
            returnAddressId: ig.returnAddressId ?? null,
            pickLocation: null,
            returnLocation: null,
            miles: null,
            pickdeliveryfee: new Prisma.Decimal(0),
            returndeliveryfee: new Prisma.Decimal(0),
            groupNumber: 0,
            status: null,
            pickdeliverycode: null,
            returndeliverycode: null,
            subOrders: [] as any[],
          };

          for (const iso of ig.subOrders) {
            const prepared = await prepareSubOrder(
              iso,
              undefined,
              group.processingRuleId,
              activeCurrencyCode,
            );
            group.subOrders.push(prepared);
          }
        }

        const procRule = await prisma.processingRule.findUnique({ where: { id: group.processingRuleId } });
        group.processingRuleName = procRule?.name ?? null;

        updatedGroups.push(group);
      }

      (existingOrder as any).deliveryGroups = updatedGroups;
    }

    // ---------- 4. RECALCULATE DELIVERY FEES ----------
    const companyAddress = await prisma.companyAddress.findUnique({
      where: { id: existingOrder.companyAddressId ?? '' },
    });

    const deliverySetups1 = await prisma.deliverySetup1.findMany();
    const deliverySetups2 = await prisma.deliverySetup2.findMany();
    const mappedSetups1 = deliverySetups1.map(s => ({ miles: s.miles, pricePerMile: Number(s.pricePerMile) }));
    const mappedSetups2 = deliverySetups2.map(s => ({ quantity: s.quantity, multiplier: Number(s.multiplier) }));

    const currency = await prisma.currency.findUnique({ where: { code: activeCurrencyCode } });
    const currMult = Number(currency?.multiplier ?? 1);

    for (const dg of existingOrder.deliveryGroups) {
      const subOrders = dg.subOrders;
      const totalQuantity = subOrders.reduce((sum, so) => sum + so.quantity, 0);
      let pickFee = new Prisma.Decimal(0);
      let returnFee = new Prisma.Decimal(0);
      let miles = 0;

      if (dg.deliveryMode !== 'none') {
        if (dg.deliveryMode === 'both' || dg.deliveryMode === 'pick') {
          pickFee = await computeDeliveryFee(
            dg.pickAddressId,
            companyAddress,
            totalQuantity,
            currMult,
            mappedSetups1,
            mappedSetups2,
            dg.pickdeliveryfee ? Number(dg.pickdeliveryfee) : undefined,
            subOrders.reduce((s, so) => s + ((so as any).oldQuantity ?? so.quantity), 0),
          );
          if (dg.pickAddressId && companyAddress) {
            const addr = await prisma.customerAddress.findUnique({ where: { id: dg.pickAddressId } });
            if (addr) {
              miles += calculateMilesDistance(
                companyAddress.latitude, companyAddress.longitude,
                addr.latitude, addr.longitude,
              );
              dg.pickLocation = addr.address;
            }
          }
        }
        if (dg.deliveryMode === 'both' || dg.deliveryMode === 'return') {
          returnFee = await computeDeliveryFee(
            dg.returnAddressId,
            companyAddress,
            totalQuantity,
            currMult,
            mappedSetups1,
            mappedSetups2,
            dg.returndeliveryfee ? Number(dg.returndeliveryfee) : undefined,
            subOrders.reduce((s, so) => s + ((so as any).oldQuantity ?? so.quantity), 0),
          );
          if (dg.returnAddressId && companyAddress) {
            const addr = await prisma.customerAddress.findUnique({ where: { id: dg.returnAddressId } });
            if (addr) {
              miles += calculateMilesDistance(
                companyAddress.latitude, companyAddress.longitude,
                addr.latitude, addr.longitude,
              );
              dg.returnLocation = addr.address;
            }
          }
        }
      }

      dg.miles = dg.deliveryMode === 'none' ? null : miles;
      dg.pickdeliveryfee = pickFee;
      dg.returndeliveryfee = returnFee;
    }

    // ---------- 5. AGGREGATE TOTALS ----------
    let totalPickFee = new Prisma.Decimal(0);
    let totalReturnFee = new Prisma.Decimal(0);
    let totalServiceAmount = new Prisma.Decimal(0);
    for (const dg of existingOrder.deliveryGroups) {
      totalPickFee = totalPickFee.plus(dg.pickdeliveryfee ?? 0);
      totalReturnFee = totalReturnFee.plus(dg.returndeliveryfee ?? 0);
      for (const so of dg.subOrders) {
        totalServiceAmount = totalServiceAmount.plus(so.finalPrice ?? 0);
      }
    }
    const totalAmount = totalServiceAmount.plus(totalPickFee).plus(totalReturnFee);

    existingOrder.totalpickdeliveryfee = totalPickFee;
    existingOrder.totalreturndeliveryfee = totalReturnFee;
    existingOrder.totalserviceamount = totalServiceAmount;
    existingOrder.totalAmount = totalAmount;

    // ---------- 6. DISCOUNT HANDLING ----------
    if ('discountRuleCode' in body && discountRuleCode === null) {
      // Explicitly cleared: remove discount completely
      existingOrder.discountRuleId = null;
      existingOrder.discountRuleCode = null;
      existingOrder.discountAmount = new Prisma.Decimal(0);
      existingOrder.netamount = totalAmount;
    } else if (discountRuleCode) {
      // New or updated discount code
      const rule = await prisma.discountRule.findUnique({ where: { code: discountRuleCode, active: true } });
      if (!rule) {
        return NextResponse.json({ message: 'Invalid or inactive discount code' }, { status: 400 });
      }
      const deduction = applyDiscountRule({
        discountType: rule.type,
        percentage: Number(rule.percentage),
        capInNgn: rule.capNaira ? Number(rule.capNaira) : null,
        currencyMultiplier: currMult,
        currentServicesTotal: totalServiceAmount.toNumber(),
        currentPickDeliveryTotal: totalPickFee.toNumber(),
        currentReturnDeliveryTotal: totalReturnFee.toNumber(),
      });
      const totalDiscount = new Prisma.Decimal(
        deduction.servicesDiscount + deduction.pickDeliveryDiscount + deduction.returnDeliveryDiscount
      );
      existingOrder.discountRuleId = rule.id;
      existingOrder.discountRuleCode = rule.code;
      existingOrder.discountAmount = totalDiscount;
      existingOrder.netamount = totalAmount.minus(totalDiscount);
    } else if (discountAmount !== undefined) {
      // Direct discount amount edit – clear rule linkage
      existingOrder.discountRuleId = null;
      existingOrder.discountRuleCode = null;
      existingOrder.discountAmount = new Prisma.Decimal(discountAmount);
      existingOrder.netamount = totalAmount.minus(discountAmount);
    } else if (existingOrder.discountRuleId) {
      // Reapply existing rule
      const rule = await prisma.discountRule.findUnique({ where: { id: existingOrder.discountRuleId } });
      if (rule) {
        const deduction = applyDiscountRule({
          discountType: rule.type,
          percentage: Number(rule.percentage),
          capInNgn: rule.capNaira ? Number(rule.capNaira) : null,
          currencyMultiplier: currMult,
          currentServicesTotal: totalServiceAmount.toNumber(),
          currentPickDeliveryTotal: totalPickFee.toNumber(),
          currentReturnDeliveryTotal: totalReturnFee.toNumber(),
        });
        const totalDiscount = new Prisma.Decimal(
          deduction.servicesDiscount + deduction.pickDeliveryDiscount + deduction.returnDeliveryDiscount
        );
        existingOrder.discountAmount = totalDiscount;
        existingOrder.netamount = totalAmount.minus(totalDiscount);
      }
    } else {
      // Keep previous discount, recalc net
      existingOrder.netamount = totalAmount.minus(existingOrder.discountAmount ?? 0);
    }

    // ---------- 7. PERSIST TO DATABASE ----------
    let groupNumber = 1;
    for (const dg of existingOrder.deliveryGroups) {
      dg.groupNumber = groupNumber++;
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (incomingGroups !== undefined) {
        const incomingIds = new Set(
          incomingGroups.filter((g: any) => g.id).map((g: any) => g.id)
        );
        const existingIds = existingOrder.deliveryGroups.map(g => g.id);
        for (const gId of existingIds) {
          if (!incomingIds.has(gId)) {
            await tx.deliveryGroup.delete({ where: { id: gId } });
          }
        }

        await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            deliveryGroups: { deleteMany: {} },
          },
        });
      }

      const groupsCreateData = existingOrder.deliveryGroups.map((dg) => ({
        id: dg.id,
        deliveryMode: dg.deliveryMode,
        processingRuleId: dg.processingRuleId,
        processingRuleName: dg.processingRuleName,
        pickAddressId: dg.pickAddressId,
        pickLocation: dg.pickLocation,
        returnAddressId: dg.returnAddressId,
        returnLocation: dg.returnLocation,
        miles: dg.miles,
        pickdeliveryfee: dg.pickdeliveryfee,
        returndeliveryfee: dg.returndeliveryfee,
        groupNumber: dg.groupNumber,
        status: dg.status,
        pickdeliverycode: dg.pickdeliverycode,
        returndeliverycode: dg.returndeliverycode,
        subOrders: {
          create: dg.subOrders.map((so: any) => ({
            clothId: so.clothId || null,
            variantId: so.variantId || null,
            clothPartialServiceId: so.clothPartialServiceId || null,
            variantPartialServiceId: so.variantPartialServiceId || null,
            quantity: so.quantity,
            finalPrice: so.finalPrice,
            subOrderName: so.subOrderName,
            status: so.status,
          })),
        },
      }));

      const result = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          currencyCode: activeCurrencyCode,
          totalAmount: existingOrder.totalAmount,
          totalpickdeliveryfee: existingOrder.totalpickdeliveryfee,
          totalreturndeliveryfee: existingOrder.totalreturndeliveryfee,
          totalserviceamount: existingOrder.totalserviceamount,
          discountAmount: existingOrder.discountAmount,
          netamount: existingOrder.netamount,
          discountRuleId: existingOrder.discountRuleId,
          discountRuleCode: existingOrder.discountRuleCode,
          deliveryGroups: {
            create: groupsCreateData,
          },
        },
        include: {
          deliveryGroups: {
            include: {
              subOrders: true,
            },
          },
        },
      });

      return result;
    });

    // ---------- 8. FORMAT RESPONSE ----------
    const response: any = {
      id: updatedOrder.id,
      createdAt: updatedOrder.createdAt,
      status: updatedOrder.status,
      currency: updatedOrder.currencyCode,
      phoneNumber: updatedOrder.phoneNumber,
      totalServiceAmount: updatedOrder.totalserviceamount,
      totalPickDeliveryFee: updatedOrder.totalpickdeliveryfee,
      totalReturnDeliveryFee: updatedOrder.totalreturndeliveryfee,
      totalAmount: updatedOrder.totalAmount,
      discountAmount: updatedOrder.discountAmount,
      netAmount: updatedOrder.netamount,
      deliveryGroups: updatedOrder.deliveryGroups.map((dg) => ({
        id: dg.id,
        deliveryMode: dg.deliveryMode,
        processingRuleName: dg.processingRuleName,
        pickdeliveryfee: dg.pickdeliveryfee,
        returndeliveryfee: dg.returndeliveryfee,
        pickdeliverycode: dg.pickdeliverycode,
        returndeliverycode: dg.returndeliverycode,
        status: dg.status,
        pickLocation: dg.pickLocation,
        returnLocation: dg.returnLocation,
        subOrders: dg.subOrders.map((so) => ({
          name: so.subOrderName,
          quantity: so.quantity,
          finalPrice: so.finalPrice,
        })),
      })),
    };

    if (role === 'admin' || role === 'super_admin') {
      const user = await prisma.user.findUnique({ where: { id: updatedOrder.userId }, select: { name: true } });
      response.customerName = user?.name || null;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

/** Generate a unique id for a new delivery group */
function generateGroupId(orderId: string): string {
  return `${orderId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Prepare a suborder (new or existing) for a delivery group.
 * Handles missing product/processing rule gracefully.
 */
async function prepareSubOrder(
  incoming: any,
  existing: any,
  processingRuleId: string,
  currencyCode: string,
) {
  const clothId = incoming.clothId ?? existing?.clothId ?? null;
  const variantId = incoming.variantId ?? existing?.variantId ?? null;
  const clothPartialServiceId = incoming.clothPartialServiceId ?? existing?.clothPartialServiceId ?? null;
  const variantPartialServiceId = incoming.variantPartialServiceId ?? existing?.variantPartialServiceId ?? null;

  if (!clothId && !variantId && !clothPartialServiceId && !variantPartialServiceId) {
    throw new Error('Suborder must reference a product (cloth, variant, or partial service)');
  }

  const quantity = incoming.quantity ?? existing?.quantity;
  if (!quantity || quantity < 1) {
    throw new Error('Suborder quantity must be positive');
  }

  // Lookup product price
  let basePriceNgn: number | null = null;
  let productName = '';
  if (variantId) {
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: { cloth: true },
    });
    if (variant) {
      basePriceNgn = variant.isPriceNull ? null : Number(variant.price);
      productName = `${variant.cloth.name} - ${variant.name}`;
    }
  } else if (clothId) {
    const cloth = await prisma.cloth.findUnique({ where: { id: clothId } });
    if (cloth) {
      basePriceNgn = cloth.isPriceNull ? null : Number(cloth.basePrice);
      productName = cloth.name;
    }
  } else if (clothPartialServiceId) {
    const ps = await prisma.clothPartialService.findUnique({
      where: { id: clothPartialServiceId },
      include: { cloth: true },
    });
    if (ps) {
      basePriceNgn = Number(ps.price);
      productName = `${ps.cloth.name} (${ps.name})`;
    }
  } else if (variantPartialServiceId) {
    const ps = await prisma.variantPartialService.findUnique({
      where: { id: variantPartialServiceId },
      include: { variant: { include: { cloth: true } } },
    });
    if (ps) {
      basePriceNgn = Number(ps.price);
      productName = `${ps.variant.cloth.name} - ${ps.variant.name} (${ps.name})`;
    }
  }

  // Processing multiplier (0 if rule deleted)
  let processingMultiplier = 0;
  const procRule = await prisma.processingRule.findUnique({ where: { id: processingRuleId } });
  if (procRule) {
    processingMultiplier = Number(procRule.multiplier);
  }

  const currency = await prisma.currency.findUnique({ where: { code: currencyCode } });
  const currMult = Number(currency?.multiplier ?? 1);

  let finalPrice: number | null = null;
  if (incoming.finalPrice !== undefined) {
    finalPrice = incoming.finalPrice;
  } else if (basePriceNgn !== null && procRule) {
    const result = determineSubOrderPrice({
      basePriceNgn,
      processingMultiplier,
      quantity,
      currencyMultiplier: currMult,
    });
    finalPrice = result.isSpecial ? null : result.finalPrice;
  } else if (existing) {
    if (existing.finalPrice && existing.quantity) {
      // Scale existing final price proportionally to new quantity
      finalPrice = (Number(existing.finalPrice) / existing.quantity) * quantity;
    } else {
      throw new Error('Cannot determine final price; please provide finalPrice explicitly');
    }
  } else {
    throw new Error('Missing product price and no existing suborder to scale from; finalPrice must be provided');
  }

  if (finalPrice === null) {
    throw new Error('finalPrice is required for this suborder (no product price available)');
  }

  return {
    id: existing?.id,
    clothId,
    variantId,
    clothPartialServiceId,
    variantPartialServiceId,
    quantity,
    finalPrice: new Prisma.Decimal(finalPrice),
    subOrderName: productName || existing?.subOrderName || '',
    status: existing?.status,
    oldQuantity: existing?.quantity,   // temporary, not persisted
  };
}

/**
 * Compute delivery fee, falling back to proportional scaling if address missing.
 */
async function computeDeliveryFee(
  addressId: string | null,
  companyAddress: any,
  totalQuantity: number,
  currMult: number,
  setups1: any[],
  setups2: any[],
  existingFee?: number,
  oldTotalQuantity?: number,
): Promise<Prisma.Decimal> {
  if (!addressId || !companyAddress) return new Prisma.Decimal(0);

  const address = await prisma.customerAddress.findUnique({ where: { id: addressId } });
  if (!address) {
    // Address deleted – scale existing fee
    if (existingFee !== undefined && oldTotalQuantity && oldTotalQuantity > 0) {
      return new Prisma.Decimal((existingFee / oldTotalQuantity) * totalQuantity);
    }
    return new Prisma.Decimal(0);
  }

  const miles = calculateMilesDistance(
    companyAddress.latitude, companyAddress.longitude,
    address.latitude, address.longitude,
  );

  const fee = determineDeliveryFee({
    miles,
    totalQuantity,
    deliverySetups1: setups1,
    deliverySetups2: setups2,
    currencyMultiplier: currMult,
  });

  return new Prisma.Decimal(fee);
}
