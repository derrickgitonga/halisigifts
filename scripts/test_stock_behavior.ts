import { prisma } from "../lib/prisma";
import { POST as checkoutPost } from "../app/api/checkout/route";
import { PATCH as adminPatch } from "../app/api/admin/products/[id]/route";
import { NextRequest } from "next/server";

async function runStockSimulation() {
  console.log("==================================================");
  console.log("SIMULATION 1: ORDER CREATION MUST NOT DECREMENT STOCK");
  console.log("==================================================");

  // 1. Pick a sample product
  const product = await prisma.product.findFirst({
    where: { isActive: true, stock: { gt: 5 } },
    include: { variants: true },
  });

  if (!product) {
    throw new Error("No active product found for test");
  }

  const initialStock = product.stock;
  console.log(`Product: "${product.name}" (ID: ${product.id})`);
  console.log(`Initial Product Stock: ${initialStock}`);

  // Create a cartItem in DB for test session
  const testSessionId = "test_stock_sim_session_" + Date.now();
  const cartItem = await prisma.cartItem.create({
    data: {
      sessionOrUserId: testSessionId,
      productId: product.id,
      quantity: 2,
    },
  });

  // Call POST /api/checkout with test cookie
  const checkoutPayload = {
    phoneNumber: "0712345678",
    fulfillment: "DELIVERY",
    county: "Nairobi",
    paymentMethod: "MPESA",
    payFullUpfrontForDiscount: false,
    shippingAddress: {
      fullName: "Test Customer Stock Verification",
      email: "stocktest@example.com",
      phoneNumber: "0712345678",
      addressLine: "Test Address 123",
      city: "Nairobi",
      county: "Nairobi",
    },
  };

  const req = new NextRequest("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `halisi_guest_session=${testSessionId}`,
    },
    body: JSON.stringify(checkoutPayload),
  });

  const res = await checkoutPost(req);
  const data = await res.json();

  console.log(`Checkout Response Status: ${res.status}, Success: ${data.success}, OrderId: ${data.orderId}, Error: ${data.error}`);

  // Query product stock immediately after order creation
  const productAfterOrder = await prisma.product.findUnique({
    where: { id: product.id },
  });

  const stockAfterOrder = productAfterOrder?.stock;
  console.log(`Product Stock After Order Creation: ${stockAfterOrder}`);
  console.log(`Is Stock Unchanged: ${initialStock === stockAfterOrder ? "YES (VERIFIED - NO DECREMENT)" : "NO (ERROR - DECREMENTED)"}`);

  if (initialStock !== stockAfterOrder) {
    throw new Error(`Stock decremented from ${initialStock} to ${stockAfterOrder}!`);
  }

  // Clean up test order
  if (data.orderId) {
    await prisma.orderItem.deleteMany({ where: { orderId: data.orderId } });
    await prisma.order.delete({ where: { id: data.orderId } });
    console.log(`Cleaned up test order ${data.orderId}`);
  }

  console.log("\n==================================================");
  console.log("SIMULATION 2: ADMIN MANUAL STOCK ADJUSTMENT");
  console.log("==================================================");

  // Admin manually updates stock to a new value (e.g. 42)
  const targetNewStock = 42;
  const adminReq = new NextRequest(`http://localhost:3000/api/admin/products/${product.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stock: targetNewStock,
    }),
  });

  const adminRes = await adminPatch(adminReq, { params: Promise.resolve({ id: product.id }) });
  const adminData = await adminRes.json();
  console.log(`Admin PATCH Response: Success: ${adminData.success}, Updated Stock: ${adminData.product?.stock}`);

  const productAfterAdmin = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`Database Confirmed Stock: ${productAfterAdmin?.stock}`);
  console.log(`Admin Update Verified: ${productAfterAdmin?.stock === targetNewStock ? "YES (VERIFIED)" : "NO (ERROR)"}`);

  // Restore original stock
  await prisma.product.update({
    where: { id: product.id },
    data: { stock: initialStock },
  });
  console.log(`Restored initial stock ${initialStock} to product "${product.name}".`);
}

runStockSimulation()
  .then(() => console.log("\nALL SIMULATIONS COMPLETED SUCCESSFULLY."))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
