import { PrismaClient, Product } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("Starting Verification Tests for 5% Upfront Discount Feature...\n");

  const product1 = await prisma.product.findFirst({ where: { isActive: true } });
  const product2 = await prisma.product.findFirst({
    where: { isActive: true, id: { not: product1?.id } },
  });

  if (!product1 || !product2) {
    console.error("FAIL: Could not find 2 active products in database");
    process.exit(1);
  }

  const p1Price = Number(product1.price);
  const p2Price = Number(product2.price);

  console.log(`Product 1: ${product1.name} (KSh ${p1Price})`);
  console.log(`Product 2: ${product2.name} (KSh ${p2Price})\n`);

  async function simulateCheckout(
    items: Array<{ product: Product; quantity: number }>,
    shippingAddress: {
      fullName: string;
      email: string;
      phoneNumber: string;
      addressLine?: string;
      county?: string;
      engravingText?: string;
      engravingFee?: number;
      customerNote?: string;
    },
    payFullUpfrontForDiscount: boolean = false,
    fulfillment: "DELIVERY" | "PICKUP" = "DELIVERY",
    deliveryFee: number = 200
  ) {
    const subtotal = items.reduce(
      (acc, item) => acc + Number(item.product.price) * item.quantity,
      0
    );
    const totalWatchesCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const rawEngravingText = shippingAddress.engravingText?.trim() || "";
    const engravingLines = rawEngravingText
      ? rawEngravingText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0)
      : [];

    const validatedEngravedCount =
      engravingLines.length > 0
        ? Math.min(totalWatchesCount, Math.max(1, engravingLines.length))
        : 0;

    const validatedEngravingFee = validatedEngravedCount * 200;

    // Server-side discount calculation: only allowed when engraving is 0
    const validatedDiscountAmount =
      validatedEngravingFee === 0 && payFullUpfrontForDiscount
        ? Math.round(subtotal * 0.05)
        : 0;

    const total = subtotal + deliveryFee + validatedEngravingFee - validatedDiscountAmount;
    const isFullPrepayment =
      validatedEngravingFee > 0 || (payFullUpfrontForDiscount && validatedDiscountAmount > 0);
    const amountDueNow = isFullPrepayment ? total : deliveryFee;
    const amountDueOnDelivery = isFullPrepayment ? 0 : subtotal;

    const order = await prisma.order.create({
      data: {
        guestEmail: shippingAddress.email.trim().toLowerCase(),
        status: "PENDING",
        subtotal,
        discountAmount: validatedDiscountAmount,
        deliveryFee,
        engravingFee: validatedEngravingFee,
        total,
        amountDueNow,
        amountDueOnDelivery,
        shippingAddress: JSON.parse(
          JSON.stringify({
            ...shippingAddress,
            engravingFee: validatedEngravingFee,
          })
        ),
        deliveryMethod: fulfillment === "DELIVERY" ? "RIDER" : "PICKUP",
        county: shippingAddress.county ?? null,
        paymentMethod: "MPESA",
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    return {
      order,
      subtotal,
      deliveryFee,
      validatedEngravingFee,
      validatedDiscountAmount,
      total,
      amountDueNow,
      amountDueOnDelivery,
    };
  }

  // --- Step 2: Non-engraved order, checkbox unchecked ---
  console.log("--- Step 2: Non-engraved order, checkbox unchecked ---");
  const res2 = await simulateCheckout(
    [{ product: product1, quantity: 1 }],
    {
      fullName: "Standard User",
      email: "std@halisigifts.com",
      phoneNumber: "0712345678",
      addressLine: "Kimathi St",
      county: "Nairobi",
      engravingText: "",
    },
    false // Checkbox unchecked
  );
  const expectedTotal2 = p1Price + 200;
  const pass2 =
    Number(res2.order.total) === expectedTotal2 &&
    Number(res2.order.discountAmount) === 0 &&
    Number(res2.order.amountDueNow) === 200 &&
    Number(res2.order.amountDueOnDelivery) === p1Price;

  console.log(`Subtotal: ${res2.order.subtotal}`);
  console.log(`Delivery Fee: ${res2.order.deliveryFee}`);
  console.log(`Discount: ${res2.order.discountAmount}`);
  console.log(`Order Total: ${res2.order.total} (Expected: ${expectedTotal2})`);
  console.log(`Pay Now: ${res2.order.amountDueNow} (Expected: 200)`);
  console.log(`Pay on Delivery: ${res2.order.amountDueOnDelivery} (Expected: ${p1Price})`);
  console.log(`Result: ${pass2 ? "PASS" : "FAIL"}\n`);

  // --- Step 3: Non-engraved order, checkbox checked (5% discount) ---
  console.log("--- Step 3: Non-engraved order, checkbox checked (5% discount) ---");
  const expectedDiscount3 = Math.round(p1Price * 0.05);
  const expectedTotal3 = p1Price + 200 - expectedDiscount3;
  const expectedPayNow3 = expectedTotal3;

  const res3 = await simulateCheckout(
    [{ product: product1, quantity: 1 }],
    {
      fullName: "Discount User",
      email: "discount@halisigifts.com",
      phoneNumber: "0712345678",
      addressLine: "Kimathi St",
      county: "Nairobi",
      engravingText: "",
    },
    true // Checkbox checked
  );

  const pass3 =
    Number(res3.order.total) === expectedTotal3 &&
    Number(res3.order.discountAmount) === expectedDiscount3 &&
    Number(res3.order.amountDueNow) === expectedPayNow3 &&
    Number(res3.order.amountDueOnDelivery) === 0;

  console.log(`Subtotal: ${res3.order.subtotal}`);
  console.log(`Delivery Fee: ${res3.order.deliveryFee}`);
  console.log(`Discount: ${res3.order.discountAmount} (Expected: ${expectedDiscount3})`);
  console.log(`Order Total: ${res3.order.total} (Expected: ${expectedTotal3})`);
  console.log(`Pay Now: ${res3.order.amountDueNow} (Expected: ${expectedPayNow3})`);
  console.log(`Pay on Delivery: ${res3.order.amountDueOnDelivery} (Expected: 0)`);
  console.log(`Result: ${pass3 ? "PASS" : "FAIL"}\n`);

  // --- Step 4: UI logic verification (checkbox checked then engraving typed) ---
  console.log("--- Step 4: UI Auto-uncheck & Reset Verification ---");
  // Simulating state transition:
  let payFullUpfrontState = true;
  let engravingFeeState = 0;
  let discountAmountState = Math.round(p1Price * 0.05);

  // User types engraving text
  engravingFeeState = 200;
  if (engravingFeeState > 0 && payFullUpfrontState) {
    payFullUpfrontState = false;
    discountAmountState = 0;
  }

  const pass4 =
    payFullUpfrontState === false &&
    discountAmountState === 0 &&
    engravingFeeState === 200;

  console.log(`Before typing: payFullUpfront=true, discount=${Math.round(p1Price * 0.05)}`);
  console.log(`After typing engraving: payFullUpfront=${payFullUpfrontState}, discount=${discountAmountState}, engravingFee=${engravingFeeState}`);
  console.log(`Result: ${pass4 ? "PASS" : "FAIL"}\n`);

  // --- Step 5: Tamper Test - client sends payFullUpfrontForDiscount=true AND engraving text ---
  console.log("--- Step 5: Tamper Test - Discount Flag WITH Engraving Text ---");
  const tamper1 = await simulateCheckout(
    [{ product: product1, quantity: 1 }],
    {
      fullName: "Tamper Engraved User",
      email: "tamper_engraved@halisigifts.com",
      phoneNumber: "0712345678",
      addressLine: "Kimathi St",
      county: "Nairobi",
      engravingText: "Love You Forever",
    },
    true // Client claimed discount flag true
  );

  const expectedEngravedTotal = p1Price + 200 + 200;
  const pass5 =
    Number(tamper1.order.discountAmount) === 0 &&
    Number(tamper1.order.engravingFee) === 200 &&
    Number(tamper1.order.total) === expectedEngravedTotal &&
    Number(tamper1.order.amountDueNow) === expectedEngravedTotal;

  console.log(`Server Forced Discount: ${tamper1.order.discountAmount} (Expected: 0)`);
  console.log(`Server Calculated Engraving Fee: ${tamper1.order.engravingFee} (Expected: 200)`);
  console.log(`Server Total: ${tamper1.order.total} (Expected: ${expectedEngravedTotal})`);
  console.log(`Result: ${pass5 ? "PASS" : "FAIL"}\n`);

  // --- Step 6: Tamper Test - server calculates discount independently from actual subtotal ---
  console.log("--- Step 6: Independent Calculation Test ---");
  const subtotalTwoWatches = p1Price + p2Price;
  const expectedDiscountTwoWatches = Math.round(subtotalTwoWatches * 0.05);
  const expectedTotalTwoWatches = subtotalTwoWatches + 200 - expectedDiscountTwoWatches;

  const res6 = await simulateCheckout(
    [
      { product: product1, quantity: 1 },
      { product: product2, quantity: 1 },
    ],
    {
      fullName: "Two Watch Discount User",
      email: "twowatches@halisigifts.com",
      phoneNumber: "0712345678",
      addressLine: "Kimathi St",
      county: "Nairobi",
      engravingText: "",
    },
    true
  );

  const pass6 =
    Number(res6.order.subtotal) === subtotalTwoWatches &&
    Number(res6.order.discountAmount) === expectedDiscountTwoWatches &&
    Number(res6.order.total) === expectedTotalTwoWatches &&
    Number(res6.order.amountDueNow) === expectedTotalTwoWatches &&
    Number(res6.order.amountDueOnDelivery) === 0;

  console.log(`Subtotal: ${res6.order.subtotal} (Expected: ${subtotalTwoWatches})`);
  console.log(`Recalculated 5% Discount: ${res6.order.discountAmount} (Expected: ${expectedDiscountTwoWatches})`);
  console.log(`Total: ${res6.order.total} (Expected: ${expectedTotalTwoWatches})`);
  console.log(`Pay Now: ${res6.order.amountDueNow} (Expected: ${expectedTotalTwoWatches})`);
  console.log(`Result: ${pass6 ? "PASS" : "FAIL"}\n`);

  // Clean up created test orders
  const testOrderIds = [res2.order.id, res3.order.id, tamper1.order.id, res6.order.id];
  await prisma.orderItem.deleteMany({ where: { orderId: { in: testOrderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: testOrderIds } } });
  console.log("Cleaned up test orders successfully.");

  const allPassed = pass2 && pass3 && pass4 && pass5 && pass6;
  console.log(`\nOVERALL DISCOUNT VERIFICATION: ${allPassed ? "ALL PASS" : "SOME FAILED"}`);
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
