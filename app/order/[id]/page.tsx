import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { displayOrderNumber } from "@/lib/order-tracking";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import OrderPurchaseTracker from "@/components/analytics/OrderPurchaseTracker";
import { getWhatsAppOrderUrl } from "@/lib/whatsapp-order";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: OrderPageProps) {
  const { id } = await params;

  let order = null;
  try {
    order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  } catch {
    // Database query catch
  }

  const orderNo = displayOrderNumber({ id, orderNumber: order?.orderNumber });

  const shippingAddress = (order?.shippingAddress as {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    addressLine?: string;
    county?: string;
    engravingText?: string;
    engravingFee?: number;
    customerNote?: string;
    mpesaTransactionCode?: string;
  }) || {
    fullName: "Customer",
    email: "customer@example.com",
    addressLine: "Nairobi, Kenya",
  };

  const subtotal = order ? Number(order.subtotal) : 0;
  const discountAmount = order ? Number(order.discountAmount || 0) : 0;
  const deliveryFee = order?.deliveryFee ?? 0;
  const engravingFee = order?.engravingFee ?? 0;
  const total = order ? Number(order.total) : 0;
  const amountDueNow = order ? Number(order.amountDueNow) : deliveryFee;
  const amountDueOnDelivery = order ? Number(order.amountDueOnDelivery) : subtotal;

  const contentIds = order?.items?.map((it) => it.productId) || [];
  const numItems = order?.items?.reduce((acc, it) => acc + it.quantity, 0) || 0;

  const whatsappUrl = getWhatsAppOrderUrl({
    orderId: id,
    fullName: shippingAddress.fullName || "Customer",
    phoneNumber: shippingAddress.phoneNumber || "",
    email: shippingAddress.email || "",
    fulfillment: order?.deliveryMethod === "PICKUP" ? "PICKUP" : "DELIVERY",
    county: shippingAddress.county,
    addressLine: shippingAddress.addressLine,
    items: (order?.items || []).map((it) => ({
      name: it.product.name,
      slug: it.product.slug,
      variantName: it.variantName || undefined,
      quantity: it.quantity,
      price: Number(it.priceAtPurchase),
    })),
    subtotal,
    deliveryFee,
    engravingText: shippingAddress.engravingText,
    engravingFee,
    discountAmount,
    total,
    paymentMethod: order?.paymentMethod || "MPESA",
    mpesaTransactionCode: shippingAddress.mpesaTransactionCode,
    customerNote: shippingAddress.customerNote,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OrderPurchaseTracker
        orderId={id}
        total={total}
        contentIds={contentIds}
        numItems={numItems}
      />
      <Header />
      <main className="w-full flex-grow max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <div className="bg-white border border-black/10 rounded-xl p-8 md:p-12 space-y-6">
          <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>

          <h1 className="font-display-lg text-2xl sm:text-3xl md:text-display-lg text-black">
            Order Placed Successfully!
          </h1>
          <p className="font-body-lg text-black/70 max-w-lg mx-auto">
            Thank you for shopping with Halisi Gifts Shop. Your order number is{" "}
            <span className="font-semibold text-black font-mono">{orderNo}</span>
          </p>
          <p className="text-xs text-black/45 -mt-3 break-all">Full order ID: {id}</p>

          <Link
            href={`/track-order?order=${encodeURIComponent(orderNo)}`}
            className="inline-flex items-center gap-2 rounded-full border border-black/15 hover:border-black px-5 py-2.5 text-xs font-semibold text-black transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>
              local_shipping
            </span>
            Track this order
          </Link>

          <div className="border-t border-black/10 pt-6 text-left space-y-4">
            <h2 className="font-headline-md text-headline-md">Order Items</h2>
            <div className="divide-y divide-black/10">
              {order?.items?.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 relative bg-black/5 rounded overflow-hidden">
                      <Image
                        src={item.product.images[0] || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-black">
                        {item.product.name}
                        {item.variantName && (
                          <span className="text-gold font-normal ml-1">({item.variantName})</span>
                        )}
                      </p>
                      <p className="text-black/50 text-xs">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-label-md text-gold">
                    {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-black/10 pt-4 space-y-2 text-sm text-black/80">
              <div className="flex justify-between">
                <span>Watch Subtotal</span>
                <span className="font-semibold text-black">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}</span>
              </div>
              {engravingFee > 0 && (
                <div className="flex justify-between">
                  <span>Custom Engraving</span>
                  <span className="text-gold font-semibold">{formatCurrency(engravingFee)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Discount (5% off watch price)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-black/10 pt-3 flex justify-between text-base font-bold">
              <span>Order Total</span>
              <span className="text-gold text-lg">{formatCurrency(total)}</span>
            </div>

            <div className="bg-black/[0.03] border border-black/10 rounded-lg p-4 space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-black font-label-sm">
                Payment Breakdown
              </p>

              {amountDueOnDelivery === 0 ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm font-semibold text-gold">
                    <span>Pay Now (Online)</span>
                    <span>{formatCurrency(amountDueNow)}</span>
                  </div>
                  <p className="text-black/60 text-[11px] pt-1">
                    {engravingFee > 0
                      ? "Full payment required for custom engraved orders."
                      : "Full payment with 5% discount applied."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-medium text-black">
                    <span>Pay Now (Delivery Fee)</span>
                    <span className="font-semibold text-gold">{formatCurrency(amountDueNow)}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium text-black">
                    <span>Pay on Delivery (Watch Price)</span>
                    <span className="font-semibold">{formatCurrency(amountDueOnDelivery)}</span>
                  </div>
                  <p className="text-black/60 text-[11px] pt-1">
                    Watch price collected as cash on delivery.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-black/10 pt-6 text-left space-y-2 text-sm text-black/80">
            <h3 className="font-bold text-black uppercase tracking-wider text-xs font-label-sm">
              Fulfillment & Contact Details
            </h3>
            <p>{shippingAddress.fullName}</p>
            {shippingAddress.addressLine ? (
              <p>{shippingAddress.addressLine}, {shippingAddress.county}</p>
            ) : null}
            <p>{shippingAddress.email} | {shippingAddress.phoneNumber}</p>
            {shippingAddress.engravingText && (
              <div className="pt-2 text-black">
                <span className="font-semibold text-gold block mb-1">Custom Engraving:</span>
                <p className="whitespace-pre-line text-sm bg-black/[0.02] p-3 rounded border border-black/10">
                  {shippingAddress.engravingText}
                </p>
              </div>
            )}
            {shippingAddress.customerNote && (
              <div className="pt-1 text-black/80">
                <span className="font-semibold">Note to Seller: </span>
                <span>{shippingAddress.customerNote}</span>
              </div>
            )}
            {shippingAddress.mpesaTransactionCode && (
              <div className="pt-1 text-black/80">
                <span className="font-semibold text-[#008744]">M-Pesa Confirmation: </span>
                <span className="font-mono bg-green-50 px-2 py-0.5 rounded border border-green-200 text-black">
                  {shippingAddress.mpesaTransactionCode}
                </span>
              </div>
            )}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-label-md px-8 py-3.5 rounded-lg font-semibold transition-all shadow-md"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.016 4.015-1.099zm11.238-7.904c.307.153.498.249.563.356.064.108.064.623-.15 1.229-.214.607-.757 1.157-1.42 1.341-.662.183-1.405.074-2.883-.51-1.478-.584-2.73-1.636-3.83-2.737-1.1-1.101-2.153-2.353-2.737-3.831-.584-1.478-.693-2.221-.51-2.883.184-.663.734-1.206 1.341-1.42.606-.214 1.121-.214 1.229-.15.107.065.203.256.356.563.153.307.562 1.374.611 1.478.049.104.064.225.008.356-.056.131-.118.214-.241.356s-.25.236-.356.356c-.106.121-.225.251-.097.472.128.221.569.939 1.222 1.592.839.839 1.547 1.258 1.768 1.386.221.128.351.109.472-.017.12-.126.518-.601.656-.807.138-.206.275-.172.463-.103z" />
              </svg>
              <span>Send Order to WhatsApp</span>
            </a>

            <Link
              href="/"
              className="w-full sm:w-auto inline-block bg-gold text-white font-label-md px-8 py-3.5 rounded-lg hover:bg-black transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
