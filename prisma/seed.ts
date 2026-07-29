// prisma/seed.ts
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

async function main() {
  console.log("🚀 Start seeding a robust database...");

  // ==========================================
  // 1. CLEANUP EXISTING DATA
  // ==========================================
  console.log("🧹 Deep cleaning database collections...");
  await prisma.companyNotification.deleteMany({});
  await prisma.adminLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.subOrder.deleteMany({});
  await prisma.deliveryGroup.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customerAddress.deleteMany({});
  await prisma.companyAddress.deleteMany({});
  await prisma.deliverySetup1.deleteMany({});
  await prisma.deliverySetup2.deleteMany({});
  await prisma.processingRule.deleteMany({});
  await prisma.discountRule.deleteMany({});
  await prisma.currency.deleteMany({});
  await prisma.variantPartialService.deleteMany({});
  await prisma.clothPartialService.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.cloth.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.customerOrderSequence.deleteMany({});
  await prisma.orderNumberCounter.deleteMany({});

  const hashedPassword = await bcrypt.hash("securePassword123", 10);
  const now = new Date();

  // ==========================================
  // 2. SEED USERS
  // ==========================================
  const superAdmin = await prisma.user.create({
    data: {
      name: "Chief Operations Officer",
      email: "superadmin@laundryapp.com",
      emailVerified: now,
      password: hashedPassword,
      role: "superadmin",
      adminApproved: true,
      accounts: {
        create: {
          type: "credentials",
          provider: "local",
          providerAccountId: "local-superadmin-001",
        },
      },
    },
  });
  const adminManager = await prisma.user.create({
    data: {
      name: "Lagos Hub Manager",
      email: "lagos.manager@laundryapp.com",
      emailVerified: now,
      password: hashedPassword,
      role: "admin",
      adminApproved: true,
    },
  });
  const customerA = await prisma.user.create({
    data: {
      name: "Babajide Kolawole",
      email: "jide@example.com",
      emailVerified: now,
      password: hashedPassword,
      role: "customer",
      adminApproved: false,
    },
  });
  const customerB = await prisma.user.create({
    data: {
      name: "Chioma Nwachukwu",
      email: "chioma@example.com",
      emailVerified: now,
      password: hashedPassword,
      role: "customer",
      adminApproved: false,
    },
  });

  // ==========================================
  // 3. ADDRESSES
  // ==========================================
  const hubIkoyi = await prisma.companyAddress.create({
    data: {
      address: "Plot 14, Kingsway Road, Ikoyi, Lagos, Nigeria",
      latitude: 6.4549,
      longitude: 3.4244,
      isActive: true,
    },
  });
  const hubLekki = await prisma.companyAddress.create({
    data: {
      address: "Block 5, Admiralty Way, Lekki Phase 1, Lagos",
      latitude: 6.4474,
      longitude: 3.4716,
      isActive: false,
    },
  });

  const addressA1 = await prisma.customerAddress.create({
    data: { userId: customerA.id, label: "Home (Primary)", address: "12 Joel Ogunnaike St, Ikeja GRA, Lagos", latitude: 6.5944, longitude: 3.3510, isDefault: true },
  });
  const addressA2 = await prisma.customerAddress.create({
    data: { userId: customerA.id, label: "Office", address: "Heritage Bank Place, Victoria Island, Lagos", latitude: 6.4281, longitude: 3.4219, isDefault: false },
  });
  const addressB1 = await prisma.customerAddress.create({
    data: { userId: customerB.id, label: "Apartment", address: "Block C4, Lekki Phase 1, Lagos", latitude: 6.4474, longitude: 3.4716, isDefault: true },
  });

  // ==========================================
  // 4. UTILITIES & RULES
  // ==========================================
  const ngn = await prisma.currency.create({ data: { code: "NGN", multiplier: 1.0000 } });
  const usd = await prisma.currency.create({ data: { code: "USD", multiplier: 0.0013 } });

  const discountWelcome = await prisma.discountRule.create({ data: { code: "WELCOME15", type: "cart", percentage: 15.00, capNaira: 3500.00, active: true } });
  const discountExpress = await prisma.discountRule.create({ data: { code: "FREESHIP", type: "delivery", percentage: 100.00, capNaira: 2500.00, active: true } });
  const discountServices = await prisma.discountRule.create({ data: { code: "SERVICE10", type: "services", percentage: 10.00, capNaira: 1500.00, active: true } });

  const procStandard = await prisma.processingRule.create({ data: { name: "Standard Delivery (3-5 Days)", multiplier: 1.0000 } });
  const procExpress = await prisma.processingRule.create({ data: { name: "24-Hour Express", multiplier: 1.4000 } });
  const procSameDay = await prisma.processingRule.create({ data: { name: "Same Day Flash", multiplier: 1.7500 } });

  await prisma.deliverySetup1.createMany({ data: [
    { miles: "1-5", pricePerMile: 250.00 },
    { miles: "6-15", pricePerMile: 400.00 },
    { miles: "16-30", pricePerMile: 600.00 },
  ]});
  await prisma.deliverySetup2.createMany({ data: [
    { quantity: "1-3", multiplier: 1.0 },
    { quantity: "4-7", multiplier: 0.85 },
    { quantity: "8-20", multiplier: 0.75 },
  ]});

  // ==========================================
  // 5. CATALOGUE
  // ==========================================
  const clothNative = await prisma.cloth.create({
    data: { name: "Premium Agbada / Kaftan", description: "Traditional heavy starching, laundering, or embroidery treatment options", basePrice: 5500.00, isPriceNull: false, imageUrl: "https://cdn.laundryapp.com/assets/native-attire.jpg" },
  });
  const serviceNativeStarch = await prisma.clothPartialService.create({
    data: { clothId: clothNative.id, name: "Extra Heavy Starching", price: 1500.00 },
  });

  const clothSuit = await prisma.cloth.create({
    data: { name: "Designer Suit", description: "Corporate standard dry cleaning using fabric protective agents", isPriceNull: true, imageUrl: "https://cdn.laundryapp.com/assets/suits.jpg",
      variants: { create: [
        { name: "2-Piece Suit Suite", price: 4500.00, isPriceNull: false },
        { name: "3-Piece Luxury Suit Suite", price: 6500.00, isPriceNull: false },
      ]}
    },
    include: { variants: true },
  });
  const variant2Piece = clothSuit.variants.find(v => v.name === "2-Piece Suit Suite")!;
  const variant3Piece = clothSuit.variants.find(v => v.name === "3-Piece Luxury Suit Suite")!;
  const serviceSuitStainRemoval = await prisma.variantPartialService.create({
    data: { variantId: variant3Piece.id, name: "Deep Chemical Stain Extractions", price: 2500.00 },
  });

  await prisma.cloth.create({
    data: { name: "Casual Button-Up Shirt", description: "Standard daily business casual shirt wash & press", basePrice: 1200.00, isPriceNull: false, imageUrl: "https://cdn.laundryapp.com/assets/shirts.jpg" },
  });

  const clothDuvet = await prisma.cloth.create({
    data: { name: "Luxury Duvet / Comforter", description: "Deep cleaning with hypoallergenic detergents", basePrice: 8000.00, isPriceNull: false },
  });
  const duvetPartial = await prisma.clothPartialService.create({
    data: { clothId: clothDuvet.id, name: "Anti-Allergen Treatment", price: 2000.00 },
  });

  const clothDress = await prisma.cloth.create({
    data: { name: "Evening Gown / Party Dress", description: "Delicate fabric care and steaming", isPriceNull: true, imageUrl: "https://cdn.laundryapp.com/assets/gowns.jpg",
      variants: { create: [
        { name: "Short Cocktail Dress", price: 3000.00, isPriceNull: false },
        { name: "Full-Length Gown", price: 5000.00, isPriceNull: false },
      ]}
    },
    include: { variants: true },
  });
  const variantShort = clothDress.variants.find(v => v.name === "Short Cocktail Dress")!;
  await prisma.variantPartialService.create({
    data: { variantId: variantShort.id, name: "Sequins & Beading Protection", price: 1000.00 },
  });

  // ==========================================
  // 6. COUNTERS
  // ==========================================
  await prisma.customerOrderSequence.create({ data: { customerPrefix: "BJK", lastOrderNumber: 3 } });
  await prisma.orderNumberCounter.create({ data: { customerId: customerA.id, currentNthOrder: 3 } });
  await prisma.customerOrderSequence.create({ data: { customerPrefix: "CHI", lastOrderNumber: 1 } });
  await prisma.orderNumberCounter.create({ data: { customerId: customerB.id, currentNthOrder: 1 } });

  // ==========================================
  // 7. ORDERS (aligned with new schema)
  // ==========================================
  const orderId1 = "BJK-2026-0001";
  await prisma.order.create({
    data: {
      id: orderId1,
      userId: customerA.id,
      phoneNumber: "+2348099887766",
      totalAmount: 14300.00,
      totalserviceamount: 14300.00,
      totalpickdeliveryfee: 2625.00,
      totalreturndeliveryfee: 0.00,
      discountAmount: 2145.00,
      netamount: 14780.00,
      currencyCode: ngn.code,
      discountRuleCode: discountWelcome.code,
      status: "received",
      companyAddressId: hubIkoyi.id,
      deliveryGroups: {
        create: {
          id: `${orderId1}-DG1`,
          deliveryMode: "pick",
          processingRuleId: procExpress.id,
          processingRuleName: procExpress.name,
          pickAddressId: addressA1.id,
          pickLocation: addressA1.address,
          miles: 10.5,
          pickdeliveryfee: 2625.00,
          returndeliveryfee: 0.00,
          groupNumber: 1,
          status: "pending",
          subOrders: {
            create: [
              {
                clothId: clothNative.id,
                clothPartialServiceId: serviceNativeStarch.id,
                quantity: 1,
                finalPrice: 9800.00,
                subOrderName: `${clothNative.name} (${serviceNativeStarch.name})`,
                status: "pending",
              },
              {
                clothId: clothSuit.id,
                variantId: variant2Piece.id,
                quantity: 1,
                finalPrice: 4500.00,
                subOrderName: `${clothSuit.name} - ${variant2Piece.name}`,
                status: "pending",
              },
            ],
          },
        },
      },
    },
  });

  const orderId2 = "BJK-2026-0002";
  await prisma.order.create({
    data: {
      id: orderId2,
      userId: customerA.id,
      phoneNumber: "+2348099887766",
      totalAmount: 9000.00,
      totalserviceamount: 9000.00,
      totalpickdeliveryfee: 0.00,
      totalreturndeliveryfee: 0.00,
      discountAmount: 0.00,
      netamount: 15750.00,
      currencyCode: ngn.code,
      discountRuleCode: discountExpress.code,
      status: "confirmed",
      companyAddressId: hubIkoyi.id,
      deliveryGroups: {
        create: {
          id: `${orderId2}-DG1`,
          deliveryMode: "return",
          processingRuleId: procSameDay.id,
          processingRuleName: procSameDay.name,
          returnAddressId: addressA2.id,
          returnLocation: addressA2.address,
          miles: 4.2,
          pickdeliveryfee: 0.00,
          returndeliveryfee: 0.00,
          groupNumber: 1,
          status: "processing",
          subOrders: {
            create: [
              {
                clothId: clothSuit.id,
                variantId: variant3Piece.id,
                variantPartialServiceId: serviceSuitStainRemoval.id,
                quantity: 1,
                finalPrice: 15750.00,
                subOrderName: `${clothSuit.name} - ${variant3Piece.name} (${serviceSuitStainRemoval.name})`,
                status: "processing",
              },
            ],
          },
        },
      },
    },
  });

  const orderId3 = "CHI-2026-0001";
  await prisma.order.create({
    data: {
      id: orderId3,
      userId: customerB.id,
      phoneNumber: "+2347065544332",
      totalAmount: 0,
      totalserviceamount: 10000.00,
      totalpickdeliveryfee: 0,
      totalreturndeliveryfee: 500.00,
      discountAmount: 500.00,
      netamount: 10000.00,
      currencyCode: ngn.code,
      discountRuleCode: discountServices.code,
      status: "paid",
      companyAddressId: hubIkoyi.id,
      deliveryGroups: {
        create: {
          id: `${orderId3}-DG1`,
          deliveryMode: "return",
          processingRuleId: procStandard.id,
          processingRuleName: procStandard.name,
          returnAddressId: addressB1.id,
          returnLocation: addressB1.address,
          miles: 3.2,
          pickdeliveryfee: 0.00,
          returndeliveryfee: 500.00,
          groupNumber: 1,
          status: "done",
          subOrders: {
            create: [
              {
                clothId: clothDress.id,
                variantId: variantShort.id,
                quantity: 2,
                finalPrice: 10000.00,
                subOrderName: `${clothDress.name} - ${variantShort.name}`,
                status: "done",
              },
            ],
          },
        },
      },
    },
  });

  const orderId4 = "BJK-2026-0003";
  await prisma.order.create({
    data: {
      id: orderId4,
      userId: customerA.id,
      phoneNumber: "+2348099887766",
      totalAmount: null,
      totalserviceamount: null,
      totalpickdeliveryfee: 0,
      totalreturndeliveryfee: 0,
      discountAmount: null,
      netamount: null,
      currencyCode: ngn.code,
      discountRuleCode: null,
      status: "received",
      companyAddressId: hubIkoyi.id,
      deliveryGroups: {
        create: {
          id: `${orderId4}-DG1`,
          deliveryMode: "none",
          processingRuleId: procExpress.id,
          processingRuleName: procExpress.name,
          miles: 0,
          pickdeliveryfee: 0,
          returndeliveryfee: 0,
          groupNumber: 1,
          status: "pending",
          subOrders: {
            create: [
              {
                clothId: clothDuvet.id,
                clothPartialServiceId: duvetPartial.id,
                quantity: 1,
                finalPrice: null,
                subOrderName: `${clothDuvet.name} (${duvetPartial.name})`,
                status: "pending",
              },
            ],
          },
        },
      },
    },
  });

  // ==========================================
  // 8. LOGS & NOTIFICATIONS
  // ==========================================
  await prisma.adminLog.create({
    data: {
      adminId: adminManager.id,
      adminName: adminManager.name,
      orderId: orderId1,
      action: "ALLOCATE_TO_WORKSHOP",
      targetId: orderId1,
      details: "Assigned order items to Mainland Laundry facility conveyor belt 3.",
    },
  });

  await prisma.companyNotification.createMany({
    data: [
      { title: "Urgent Priority Order Alert", message: `Same day flash timeline attached to Order ${orderId2}`, type: "new_order", orderId: orderId2, companyAddressId: hubIkoyi.id },
      { title: "Special Price Undetermined", message: `Order ${orderId4} requires manual price input before processing.`, type: "special_order", orderId: orderId4, companyAddressId: hubIkoyi.id },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: customerA.id, title: "Order Processed Successfully", message: "Your clothing bundle items have passed cleaning screening.", type: "order_status", orderId: orderId1, read: true },
      { userId: customerB.id, title: "Welcome Discount Ready!", message: "Use promo code WELCOME15 to slash your first logistics invoice total.", type: "promotional", read: false },
      { userId: customerA.id, title: "Special Order Waiting", message: "Your custom duvet treatment order is being reviewed.", type: "special_order", orderId: orderId4, read: false },
    ],
  });

  console.log("🏁 Database seeding execution successfully finalized!");
}

main()
  .catch((e) => {
    console.error("❌ Exception captured during seeding pipeline execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });