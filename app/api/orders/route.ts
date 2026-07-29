// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';
import { calculateMilesDistance } from '@/lib/utils/geo';
import { determineSubOrderPrice, determineDeliveryFee, applyDiscountRule } from '@/lib/utils/order-helpers';

export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { id, role } = authCheck.session.user as any;

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const search = url.searchParams.get('search'); // new
  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  let whereClause: any = {};

  // Date filter
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = end;
    }
  }

  // Customer search filter (name or email)
  if (search) {
    whereClause.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  // Role‑based visibility
  if (type === 'customer') {
    whereClause.userId = id;
  } else {
    if (role === 'superadmin') {
      // show all orders
    } else {
      // admin – restrict to their workplaces
      const userWithWorkplaces = await prisma.user.findUnique({
        where: { id },
        select: { workplaces: { select: { id: true } } },
      });

      const workplaceIds = userWithWorkplaces?.workplaces.map(w => w.id) || [];

      if (workplaceIds.length === 0) {
        return NextResponse.json({
          orders: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0,
        });
      }
      whereClause.companyAddressId = { in: workplaceIds };
    }
  }

  try {
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        select: {
          id: true,
          createdAt: true,
          status: true,
          currencyCode: true,
          netamount: true,
          user: {          // include customer details
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const formatted = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      currency: order.currencyCode,
      netAmount: order.netamount,
      customerName: order.user?.name || null,
      customerEmail: order.user?.email || null,
    }));

    return NextResponse.json({
      orders: formatted,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;
  const user = authCheck.session.user as any;
  
  try {
    const { 
      phoneNumber, currencyId, customerAddressId, discountRuleCode, cartItems 
    } = await req.json();
    if (!phoneNumber || !currencyId || !cartItems || !cartItems.length) {
      return NextResponse.json({ message: 'Missing required checkout order payloads' }, { status: 400 });
    }

    const currency = await prisma.currency.findUnique({ where: { id: currencyId } });
    if (!currency) {
      return NextResponse.json({ message: 'Invalid transactional core matrix currency metadata links' }, { status: 400 });
    }

    const defaultCustomerAddress = await prisma.customerAddress.findFirst({
      where: { userId: user.id, isDefault: true }
    });

    const activeCompanyAddresses = await prisma.companyAddress.findMany({ where: { isActive: true } });
    if (!activeCompanyAddresses.length) {
      return NextResponse.json({ message: 'No active company deployment centers found' }, { status: 400 });
    }

    let activeCompanyAddress = activeCompanyAddresses[0];

    if (defaultCustomerAddress) {
      let shortestDistance = Infinity;
      for (const address of activeCompanyAddresses) {
        const distance = calculateMilesDistance(
          defaultCustomerAddress.latitude,
          defaultCustomerAddress.longitude,
          address.latitude,
          address.longitude
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          activeCompanyAddress = address;
        }
      }
    }

    const currMult = Number(currency.multiplier);

    let customerPrefix = user.email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toLowerCase();
    const existingPrefix = await prisma.customerOrderSequence.findUnique({ where: { customerPrefix } });
    if (existingPrefix) {
      const uniqueCounter = await prisma.customerOrderSequence.count();
      customerPrefix = `${customerPrefix}${String(uniqueCounter).padStart(3, '0')}`;
    }
    await prisma.customerOrderSequence.upsert({
      where: { customerPrefix },
      update: { lastOrderNumber: { increment: 1 } },
      create: { customerPrefix, lastOrderNumber: 1 }
    });
    const counter = await prisma.orderNumberCounter.upsert({
      where: { customerId: user.id },
      update: { currentNthOrder: { increment: 1 } },
      create: { customerId: user.id, currentNthOrder: 1 },
    });
    const formattedNth = String(counter.currentNthOrder).padStart(4, '0');
    const customOrderId = `${customerPrefix}-${formattedNth}`;

    const parsedSubOrders: any[] = [];
    let containsSpecialOrder = false;
    for (const item of cartItems) {
      const procRule = await prisma.processingRule.findUnique({ where: { id: item.processingRuleId } });
      if (!procRule) return NextResponse.json({ message: 'Invalid processing rule specification' }, { status: 400 });

      let basePriceNgn: number | null = null;
      let calculatedName = '';

      if (item.type === 'cloth' && !item.variantId && !item.clothPartialServiceId && !item.variantPartialServiceId) {
        const target = await prisma.cloth.findUnique({ where: { id: item.clothId } });
        basePriceNgn = target?.basePrice ? Number(target.basePrice) : null;
        calculatedName = target?.name || '';
      } else if (item.type === 'variant' && !item.clothPartialServiceId && !item.variantPartialServiceId) {
        const target = await prisma.variant.findUnique({ where: { id: item.variantId }, include: { cloth: true } });
        basePriceNgn = target?.price ? Number(target.price) : null;
        calculatedName = `${target?.cloth.name} - ${target?.name}`;
      } else if (item.type === 'clothPartialService') {
        const target = await prisma.clothPartialService.findUnique({ where: { id: item.clothPartialServiceId }, include: { cloth: true } });
        basePriceNgn = target ? Number(target.price) : null;
        calculatedName = `${target?.cloth.name} (${target?.name})`;
      } else if (item.type === 'variantPartialService') {
        const target = await prisma.variantPartialService.findUnique({ where: { id: item.variantPartialServiceId }, include: { variant: { include: { cloth: true } } } });
        basePriceNgn = target ? Number(target.price) : null;
        calculatedName = `${target?.variant.cloth.name} - ${target?.variant.name} (${target?.name})`;
      }

      const { finalPrice, isSpecial } = determineSubOrderPrice({
        basePriceNgn,
        processingMultiplier: Number(procRule.multiplier),
        quantity: item.quantity,
        currencyMultiplier: currMult,
      });
      if (isSpecial) containsSpecialOrder = true;

      parsedSubOrders.push({
        clothId: item.clothId || null,
        variantId: item.variantId || null,
        clothPartialServiceId: item.clothPartialServiceId || null,
        variantPartialServiceId: item.variantPartialServiceId || null,
        processingRuleId: item.processingRuleId,
        processingRuleName: procRule.name,
        quantity: item.quantity,
        finalPrice: isSpecial ? null : finalPrice,
        deliveryMode: item.deliveryMode || 'none', 
        pickAddressId: item.pickAddressId || customerAddressId || defaultCustomerAddress?.id || null,
        returnAddressId: item.returnAddressId || customerAddressId || defaultCustomerAddress?.id || null,
        name: calculatedName,
      });
    }

    const trackingGroupsMap = new Map<string, any[]>();
    for (const sub of parsedSubOrders) {
      let key = '';
      if (sub.deliveryMode === 'none') {
        key = `none-no_address-${sub.processingRuleId}`;
      } else if (sub.deliveryMode === 'both') {
        key = `both-${sub.pickAddressId}-${sub.returnAddressId}-${sub.processingRuleId}`;
      } else {
        const targetedAddressId = sub.deliveryMode === 'pick' ? sub.pickAddressId : sub.returnAddressId;
        key = `${sub.deliveryMode}-${targetedAddressId}-${sub.processingRuleId}`;
      }

      if (!trackingGroupsMap.has(key)) trackingGroupsMap.set(key, []);
      trackingGroupsMap.get(key)!.push(sub);
    }

    const deliverySetups1 = await prisma.deliverySetup1.findMany();
    const deliverySetups2 = await prisma.deliverySetup2.findMany();
    const mappedSetups1 = deliverySetups1.map((s) => ({ miles: s.miles, pricePerMile: Number(s.pricePerMile) }));
    const mappedSetups2 = deliverySetups2.map((s) => ({ quantity: s.quantity, multiplier: Number(s.multiplier) }));

    const createdGroupsPayload: any[] = [];
    let accumulatedTotalPickFee = 0;
    let accumulatedTotalReturnFee = 0;
    let groupSequenceCounter = 1;

    for (const [key, subsUnderGroup] of trackingGroupsMap.entries()) {
      const parts = key.split('-');
      const mode = parts[0];
      
      let totalMiles = 0;
      let pickdeliveryfee = 0;
      let returndeliveryfee = 0;
      let pickAddressId: string | null = null;
      let returnAddressId: string | null = null;
      let pickLocation: string | null = null;
      let returnLocation: string | null = null;
      
      const totalQuantityInGroup = subsUnderGroup.reduce((sum, sub) => sum + sub.quantity, 0);
      if (mode !== 'none') {
        if (mode === 'both') {
          pickAddressId = parts[1] !== 'null' ? parts[1] : null;
          returnAddressId = parts[2] !== 'null' ? parts[2] : null;
          
          if (pickAddressId) {
            const pickAddr = await prisma.customerAddress.findUnique({ where: { id: pickAddressId } });
            if (pickAddr) {
              pickLocation = pickAddr.address;
              const pMiles = calculateMilesDistance(activeCompanyAddress.latitude, activeCompanyAddress.longitude, pickAddr.latitude, pickAddr.longitude);
              totalMiles += pMiles;
              pickdeliveryfee = determineDeliveryFee({ miles: pMiles, totalQuantity: totalQuantityInGroup, deliverySetups1: mappedSetups1, deliverySetups2: mappedSetups2, currencyMultiplier: currMult });
            }
          }
          if (returnAddressId) {
            const returnAddr = await prisma.customerAddress.findUnique({ where: { id: returnAddressId } });
            if (returnAddr) {
              returnLocation = returnAddr.address;
              const rMiles = calculateMilesDistance(activeCompanyAddress.latitude, activeCompanyAddress.longitude, returnAddr.latitude, returnAddr.longitude);
              totalMiles += rMiles;
              returndeliveryfee = determineDeliveryFee({ miles: rMiles, totalQuantity: totalQuantityInGroup, deliverySetups1: mappedSetups1, deliverySetups2: mappedSetups2, currencyMultiplier: currMult });
            }
          }
        } else {
          const specificAddrId = parts[1];
          if (mode === 'pick') pickAddressId = specificAddrId;
          if (mode === 'return') returnAddressId = specificAddrId;
          const targetAddr = await prisma.customerAddress.findUnique({ where: { id: specificAddrId } });
          if (targetAddr) {
            const loc = targetAddr.address;
            totalMiles = calculateMilesDistance(activeCompanyAddress.latitude, activeCompanyAddress.longitude, targetAddr.latitude, targetAddr.longitude);
            const calculatedFee = determineDeliveryFee({ miles: totalMiles, totalQuantity: totalQuantityInGroup, deliverySetups1: mappedSetups1, deliverySetups2: mappedSetups2, currencyMultiplier: currMult });
            if (mode === 'pick') {
              pickLocation = loc;
              pickdeliveryfee = calculatedFee;
            }
            if (mode === 'return') {
              returnLocation = loc;
              returndeliveryfee = calculatedFee;
            }
          }
        }
        accumulatedTotalPickFee += pickdeliveryfee;
        accumulatedTotalReturnFee += returndeliveryfee;
      }

      const groupPayload: any = {
        id: `${customOrderId}-${String(groupSequenceCounter).padStart(3, '0')}`,
        deliveryMode: mode,
        processingRuleId: subsUnderGroup[0].processingRuleId,
        processingRuleName: subsUnderGroup[0].processingRuleName,
        miles: mode === 'none' ? null : totalMiles,
        pickdeliveryfee,
        returndeliveryfee,
        groupNumber: groupSequenceCounter++,
        pickLocation: pickLocation,
        returnLocation: returnLocation,
        pickAddressId: pickAddressId,
        returnAddressId: returnAddressId,
        subOrders: subsUnderGroup,
      };

      createdGroupsPayload.push(groupPayload);
    }

    let totalserviceamount: number | null = containsSpecialOrder ? null : parsedSubOrders.reduce((sum, s) => sum + (s.finalPrice || 0), 0);
    let orderPickFee = accumulatedTotalPickFee;
    let orderReturnFee = accumulatedTotalReturnFee;
    
    const initialTotalAmount = containsSpecialOrder || totalserviceamount === null 
      ? null 
      : (orderPickFee + orderReturnFee + totalserviceamount);

    let totalDiscountSubtracted = 0;
    let linkedDiscountId: string | null = null;
    let linkedDiscountCode: string | null = null;

    if (discountRuleCode) {
      const coupon = await prisma.discountRule.findUnique({ where: { code: discountRuleCode, active: true } });
      if (coupon) {
        linkedDiscountId = coupon.id;
        linkedDiscountCode = coupon.code;
        const deductions = applyDiscountRule({
          discountType: coupon.type,
          percentage: Number(coupon.percentage),
          capInNgn: coupon.capNaira ? Number(coupon.capNaira) : null,
          currencyMultiplier: currMult,
          currentServicesTotal: totalserviceamount || 0,
          currentPickDeliveryTotal: orderPickFee,
          currentReturnDeliveryTotal: orderReturnFee,
        });
        
        totalDiscountSubtracted = deductions.servicesDiscount + deductions.pickDeliveryDiscount + deductions.returnDeliveryDiscount;

        if (totalserviceamount !== null) totalserviceamount -= deductions.servicesDiscount;
        orderPickFee -= deductions.pickDeliveryDiscount;
        orderReturnFee -= deductions.returnDeliveryDiscount;
      }
    }

    const netamount = initialTotalAmount !== null && totalDiscountSubtracted !== null
      ? initialTotalAmount - totalDiscountSubtracted
      : null;

    await prisma.order.create({
      data: {
        id: customOrderId,
        userId: user.id,
        phoneNumber,
        currencyCode: currency.code,
        totalAmount: initialTotalAmount,
        totalpickdeliveryfee: orderPickFee,
        totalreturndeliveryfee: orderReturnFee,
        totalserviceamount,
        netamount,
        discountAmount: containsSpecialOrder ? null : totalDiscountSubtracted,
        status: 'Received',
        discountRuleId: linkedDiscountId,
        discountRuleCode: linkedDiscountCode,
        companyAddressId: activeCompanyAddress.id, 

        deliveryGroups: {
          create: createdGroupsPayload.map(g => ({
            id: g.id,
            deliveryMode: g.deliveryMode,
            processingRuleId: g.processingRuleId,
            processingRuleName: g.processingRuleName,
            pickAddressId: g.pickAddressId,
            pickLocation: g.pickLocation,
            returnAddressId: g.returnAddressId,
            returnLocation: g.returnLocation,
            miles: g.miles,
            pickdeliveryfee: g.pickdeliveryfee,
            returndeliveryfee: g.returndeliveryfee,
            groupNumber: g.groupNumber,
            subOrders: {
              create: g.subOrders.map((s: any) => ({
                clothId: s.clothId,
                variantId: s.variantId,
                clothPartialServiceId: s.clothPartialServiceId,
                variantPartialServiceId: s.variantPartialServiceId,
                quantity: s.quantity,
                finalPrice: s.finalPrice,
                subOrderName: s.name,
              }))
            }
          }))
        }
      }
    });

    const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'superadmin'] } } });
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.id,
        title: 'New Pipeline Order Placed',
        message: `Order reference code: ${customOrderId} is waiting system allocation routing patterns.`,
        type: containsSpecialOrder ? 'special_order' : 'new_order',
        orderId: customOrderId,
      }))
    });
    
    await prisma.companyNotification.create({
      data: {
        title: containsSpecialOrder ? 'Special Attention Order Logged' : 'New Incoming Order Pipeline',
        message: `Order ${customOrderId} received. ${containsSpecialOrder ? 'Contains elements requiring manual price validation.' : 'Standard process line open.'}`,
        type: containsSpecialOrder ? 'special_order' : 'new_order',
        orderId: customOrderId,
        companyAddressId: activeCompanyAddress.id, 
      }
    });

    return NextResponse.json(
      { message: 'Order created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error processing order structure' },
      { status: 500 }
    );
  }
}