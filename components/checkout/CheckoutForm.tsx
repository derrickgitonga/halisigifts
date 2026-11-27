"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CheckoutDelivery, {
  type DeliveryState,
  type CartItemData,
} from "./CheckoutDelivery";
import { resolveDelivery } from "@/lib/delivery";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/lib/meta-pixel";
import { trackTikTokEvent, identifyTikTokUser } from "@/lib/tiktok-pixel";
import { getWhatsAppOrderUrl } from "@/lib/whatsapp-order";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cartLoading, setCartLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [payFullUpfrontForDiscount, setPayFullUpfrontForDiscount] = useState(false);
  const [showDiscountRemovedNotice, setShowDiscountRemovedNotice] = useState(false);
  const [stkModal, setStkModal] = useState<{
    orderId: string;
    orderNumber: string;
    amount: number;
    phone: string;
    state: "waiting" | "paid" | "failed";
    message: string;
    receipt?: string | null;
  } | null>(null);
  const [retryingStk, setRetryingStk] = useState(false);
  const hasTrackedCheckoutRef = useRef(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    city: "",
  });

  const [delivery, setDelivery] = useState<DeliveryState>({
    fulfillment: "DELIVERY",
    county: null,
    paymentMethod: "MPESA",
    addressLine: "",
    engravingText: "",
    engravingFee: 0,
    customerNote: "",
    resolution: resolveDelivery(null, "DELIVERY"),
  });

  const lastIdentifiedEmailRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setCartItems(data.items);

        if (data.items.length > 0 && !hasTrackedCheckoutRef.current) {
          hasTrackedCheckoutRef.current = true;
          const subtotalVal = data.items.reduce(
            (acc: number, it: CartItemData) => acc + Number(it.product.price) * it.quantity,
            0
          );
          const totalQty = data.items.reduce(
            (acc: number, it: CartItemData) => acc + it.quantity,
            0
          );
          trackEvent("InitiateCheckout", {
            content_ids: data.items.map((it: CartItemData) => it.product.id),
            content_type: "product",
            value: subtotalVal,
            currency: "KES",
            num_items: totalQty,
          });

          trackTikTokEvent("InitiateCheckout", {
            contents: data.items.map((it: CartItemData) => ({
              content_id: it.product.id,
              content_name: it.product.name,
              content_type: "product",
              quantity: it.quantity,
              price: Number(it.product.price),
            })),
            value: subtotalVal,
            currency: "KES",
            num_items: totalQty,
          });
        }
      }
    } catch {
      // Cart fetch fail handled by empty check
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    window.addEventListener("cart-updated", fetchCart);
    return () => window.removeEventListener("cart-updated", fetchCart);
  }, [fetchCart]);

  useEffect(() => {
    if (delivery.engravingFee > 0 && payFullUpfrontForDiscount) {
      setPayFullUpfrontForDiscount(false);
      setShowDiscountRemovedNotice(true);
      const timer = setTimeout(() => setShowDiscountRemovedNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [delivery.engravingFee, payFullUpfrontForDiscount]);

  const captureCartEmail = useCallback(async (emailToCapture: string, nameToCapture?: string) => {
    const cleanEmail = emailToCapture.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) return;
    if (lastIdentifiedEmailRef.current === cleanEmail) return;

    lastIdentifiedEmailRef.current = cleanEmail;
    try {
      await fetch("/api/cart/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          customerName: nameToCapture?.trim() || undefined,
        }),
      });
    } catch {
      // Background capture failure ignored
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "email") {
        const clean = value.trim();
        if (EMAIL_REGEX.test(clean)) {
          captureCartEmail(clean, updated.fullName);
        }

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          if (EMAIL_REGEX.test(clean)) {
            captureCartEmail(clean, updated.fullName);
          }
        }, 800);
      } else if (name === "fullName" && formData.email) {
        if (EMAIL_REGEX.test(formData.email.trim())) {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            captureCartEmail(formData.email.trim(), value);
          }, 800);
        }
      }

      return updated;
    });
  };

  const handleEmailBlur = () => {
    if (formData.email && EMAIL_REGEX.test(formData.email.trim())) {
      captureCartEmail(formData.email.trim(), formData.fullName);
      identifyTikTokUser({
        email: formData.email,
        phone: formData.phoneNumber,
        name: formData.fullName,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!stkModal || stkModal.state !== "waiting") return;
    let attempts = 0;
    const maxAttempts = 30;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/payments/payhero/status?orderId=${encodeURIComponent(stkModal.orderId)}`);
        const data = await res.json();
        if (data.paid || data.status === "PAID") {
          clearInterval(timer);
          setStkModal((prev) =>
            prev
              ? {
                  ...prev,
                  state: "paid",
                  receipt: data.receipt || null,
                  message: "Payment received. Redirecting to your order confirmation...",
                }
              : null
          );
          setTimeout(() => {
            router.push(`/order/${stkModal.orderId}`);
          }, 1800);
          return;
        }
        if (data.status === "FAILED") {
          clearInterval(timer);
          setStkModal((prev) =>
            prev
              ? {
                  ...prev,
                  state: "failed",
                  message: "The M-Pesa prompt was cancelled or failed. You can resend the prompt below.",
                }
              : null
          );
          return;
        }
      } catch {
        // Keep polling until maxAttempts
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        setStkModal((prev) =>
          prev
            ? {
                ...prev,
                state: "failed",
                message: "Still waiting for confirmation. If you already paid, continue to your order page or resend the prompt.",
              }
            : null
        );
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [stkModal, router]);

  const handleResendStk = async () => {
    if (!stkModal) return;
    setRetryingStk(true);
    try {
      const res = await fetch("/api/payments/payhero/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: stkModal.orderId, phoneNumber: stkModal.phone }),
      });
      const data = await res.json();
      if (data.alreadyPaid) {
        router.push(`/order/${stkModal.orderId}`);
        return;
      }
      if (data.success) {
        setStkModal((prev) =>
          prev
            ? {
                ...prev,
                state: "waiting",
                message: "M-Pesa PIN prompt resent to your phone. Enter your PIN to complete payment.",
              }
            : null
        );
      } else {
        setStkModal((prev) =>
          prev ? { ...prev, state: "failed", message: data.error || "Could not resend prompt." } : null
        );
      }
    } catch {
      setStkModal((prev) =>
        prev ? { ...prev, state: "failed", message: "Network error while resending prompt." } : null
      );
    } finally {
      setRetryingStk(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setErrorMsg("Your cart is empty. Please add items before checking out.");
      return;
    }

    identifyTikTokUser({
      email: formData.email,
      phone: formData.phoneNumber,
      name: formData.fullName,
    });

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            ...formData,
            addressLine: delivery.addressLine,
            engravingText: delivery.engravingText,
            engravingFee: delivery.engravingFee,
            customerNote: delivery.customerNote,
          },
          phoneNumber: formData.phoneNumber,
          fulfillment: delivery.fulfillment,
          county: delivery.county,
          paymentMethod: delivery.paymentMethod,
          payFullUpfrontForDiscount: !isEngraved && payFullUpfrontForDiscount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new Event("cart-updated"));

        if (delivery.paymentMethod === "MPESA" && amountDueNow > 0) {
          try {
            const stkRes = await fetch("/api/payments/payhero/stk-push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                phoneNumber: formData.phoneNumber,
              }),
            });
            const stkData = await stkRes.json();

            if (stkData.success && !stkData.alreadyPaid) {
              setStkModal({
                orderId: data.orderId,
                orderNumber: data.orderNumberDisplay || data.orderId,
                amount: stkData.amount || amountDueNow,
                phone: formData.phoneNumber,
                state: "waiting",
                message:
                  stkData.message ||
                  "M-Pesa PIN prompt sent to your phone. Enter your PIN to complete payment.",
              });
              return;
            }
          } catch {
            // Fall through to order confirmation if STK trigger fails
          }
        }

        const whatsappUrl = getWhatsAppOrderUrl({
          orderId: data.orderId,
          orderNumber: data.orderNumberDisplay,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          fulfillment: delivery.fulfillment,
          county: delivery.county,
          addressLine: delivery.addressLine,
          items: cartItems.map((it) => ({
            name: it.product.name,
            slug: it.product.slug,
            variantName: it.variantName || undefined,
            quantity: it.quantity,
            price: Number(it.product.price),
          })),
          subtotal,
          deliveryFee,
          engravingText: delivery.engravingText,
          engravingFee: delivery.engravingFee,
          discountAmount,
          total: orderTotal,
          paymentMethod: delivery.paymentMethod,
          customerNote: delivery.customerNote,
        });

        // Open WhatsApp in a new tab with the structured order details
        window.open(whatsappUrl, "_blank");

        // Navigate to the order confirmation page
        router.push(`/order/${data.orderId}`);
      } else {
        setErrorMsg(data.error || "Failed to process checkout");
      }
    } catch {
      setErrorMsg("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce(
    (acc, it) => acc + Number(it.product.price) * it.quantity,
    0
  );
  const deliveryFee = delivery.resolution.fee;
  const engravingFee = delivery.engravingFee;
  const isEngraved = engravingFee > 0;

  const discountAmount = (!isEngraved && payFullUpfrontForDiscount) ? Math.round(subtotal * 0.05) : 0;
  const orderTotal = subtotal + deliveryFee + engravingFee - discountAmount;

  const isFullPrepayment = isEngraved || (payFullUpfrontForDiscount && discountAmount > 0);
  const amountDueNow = isFullPrepayment ? orderTotal : deliveryFee;
  const amountDueOnDelivery = isFullPrepayment ? 0 : subtotal;

  if (!cartLoading && cartItems.length === 0) {
    return (
      <div className="bg-white border border-black/10 rounded-xl p-12 text-center max-w-lg mx-auto space-y-6">
        <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto text-black/50">
          <span className="material-symbols-outlined text-3xl">shopping_bag</span>
        </div>
        <div className="space-y-2">
          <h2 className="font-display-lg text-2xl text-black">Your Cart is Empty</h2>
          <p className="text-black/60 text-sm">
            Discover our timeless collection of watches and add items to your cart before checking out.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block bg-gold text-white font-label-md px-8 py-3.5 rounded-lg hover:bg-black transition-colors"
        >
          Explore Watches
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <div className="bg-white border border-black/10 rounded-lg p-6 space-y-4">
          <h2 className="font-headline-md text-headline-md border-b border-black/10 pb-4">
            Shipping Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-md uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-white border border-black/20 rounded p-3 text-base focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-label-md uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                placeholder="john@example.com"
                className="w-full bg-white border border-black/20 rounded p-3 text-base focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-label-md uppercase tracking-wider mb-2">
              Contact Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="0712345678 or 254712345678"
              className="w-full bg-white border border-black/20 rounded p-3 text-base focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        <CheckoutDelivery cartItems={cartItems} onChange={setDelivery} />
      </div>

      <div className="bg-white border border-black/10 rounded-lg p-6 h-fit space-y-6">
        <h2 className="font-headline-md text-headline-md border-b border-black/10 pb-4">
          Checkout Summary
        </h2>

        {/* Cart items preview */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-black/5">
          {cartItems.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 relative bg-black/5 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product.images?.[0] || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-black truncate text-xs sm:text-sm">
                    {item.product.name}
                    {item.variantName && (
                      <span className="text-gold font-normal ml-1">({item.variantName})</span>
                    )}
                  </p>
                  <p className="text-black/50 text-xs">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-semibold text-black text-xs sm:text-sm whitespace-nowrap">
                {formatCurrency(Number(item.product.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Subtotal, delivery, engraving, and discount */}
        <div className="text-sm space-y-2 text-black/80 border-t border-black/10 pt-4">
          <p className="flex justify-between">
            <span>Watch Subtotal</span>
            <span className="font-semibold text-black">{formatCurrency(subtotal)}</span>
          </p>

          <p className="flex justify-between">
            <span>Delivery Fee</span>
            {deliveryFee === 0 ? (
              <span className="text-green-700 font-semibold">Free</span>
            ) : (
              <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
            )}
          </p>

          {isEngraved && (
            <p className="flex justify-between">
              <span>Custom Engraving</span>
              <span className="font-semibold text-gold">{formatCurrency(engravingFee)}</span>
            </p>
          )}

          {!isEngraved && payFullUpfrontForDiscount && discountAmount > 0 && (
            <p className="flex justify-between text-green-700 font-medium">
              <span>Discount (5% off watch price)</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </p>
          )}
        </div>

        {isEngraved ? (
          <>
            {showDiscountRemovedNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs">
                Discount removed: engraved orders require full price payment.
              </div>
            )}

            <div className="border-t border-black/10 pt-3 flex justify-between items-baseline text-sm text-black/70">
              <span>Order Total</span>
              <span className="font-semibold text-black">{formatCurrency(orderTotal)}</span>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-xs uppercase tracking-wider text-black font-label-sm">
                  Pay Now
                </span>
                <span className="text-xl font-bold text-gold">
                  {formatCurrency(amountDueNow)}
                </span>
              </div>
              <p className="text-black/60 text-xs leading-relaxed">
                Full online payment required for custom engraved orders.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-black/10 bg-black/[0.01] hover:bg-black/[0.03] cursor-pointer transition-colors text-xs text-black">
              <input
                type="checkbox"
                checked={payFullUpfrontForDiscount}
                onChange={(e) => setPayFullUpfrontForDiscount(e.target.checked)}
                className="mt-0.5 accent-gold h-4 w-4 rounded"
              />
              <div className="space-y-0.5">
                <p className="font-semibold text-black">
                  Pay full price now and get 5% off the watch price
                </p>
                {payFullUpfrontForDiscount ? (
                  <p className="text-black/60 text-[11px] leading-relaxed">
                    You will pay <span className="font-semibold text-gold">{formatCurrency(amountDueNow)}</span> now (5% off {formatCurrency(subtotal)} watch price included) instead of paying on delivery.
                  </p>
                ) : (
                  <p className="text-black/50 text-[11px] leading-relaxed">
                    Save {formatCurrency(Math.round(subtotal * 0.05))} by paying the full order online today.
                  </p>
                )}
              </div>
            </label>

            {payFullUpfrontForDiscount ? (
              <>
                <div className="border-t border-black/10 pt-2 flex justify-between items-baseline text-sm text-black/70">
                  <span>Order Total</span>
                  <span className="font-semibold text-black">{formatCurrency(orderTotal)}</span>
                </div>

                <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-xs uppercase tracking-wider text-black font-label-sm">
                      Pay Now
                    </span>
                    <span className="text-xl font-bold text-gold">
                      {formatCurrency(amountDueNow)}
                    </span>
                  </div>
                  <p className="text-black/60 text-xs leading-relaxed">
                    Full payment with 5% discount applied. Nothing due on delivery.
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-black/[0.03] border border-black/10 rounded-lg p-4 space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-xs uppercase tracking-wider text-black font-label-sm">
                    Pay Now
                  </span>
                  <span className="text-xl font-bold text-gold">
                    {deliveryFee === 0 ? "Free" : formatCurrency(amountDueNow)}
                  </span>
                </div>
                <p className="text-black/70 text-xs leading-relaxed">
                  Pay <span className="text-[#00A651] font-semibold">{formatCurrency(subtotal)}</span> (watch price) with M-Pesa when your order is delivered.
                </p>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || cartItems.length === 0}
          className="w-full bg-gold text-white font-label-md py-4 rounded-lg hover:bg-black transition-colors duration-300 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>

        <p className="text-center text-xs text-black/60 leading-relaxed pt-1">
          By placing your order, you agree to our{" "}
          <Link href="/shipping-returns" className="text-gold hover:underline font-medium">
            Delivery & Returns Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="text-gold hover:underline font-medium">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {stkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-black/15 text-center space-y-5">
            <div
              className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                stkModal.state === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : stkModal.state === "failed"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[#266e00]/10 text-[#266e00]"
              }`}
            >
              <span className="material-symbols-outlined text-3xl">
                {stkModal.state === "paid"
                  ? "check_circle"
                  : stkModal.state === "failed"
                  ? "error"
                  : "smartphone"}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-black/50">
                Order {stkModal.orderNumber}
              </p>
              <h3 className="font-heading text-xl font-bold text-black">
                {stkModal.state === "paid"
                  ? "M-Pesa Payment Confirmed"
                  : stkModal.state === "failed"
                  ? "M-Pesa Prompt Not Completed"
                  : "Check Your Phone for M-Pesa"}
              </h3>
              <p className="text-sm font-semibold text-[#266e00]">
                {formatCurrency(stkModal.amount)} &middot; {stkModal.phone}
              </p>
              <p className="text-xs text-black/70 leading-relaxed pt-1">{stkModal.message}</p>
              {stkModal.receipt && (
                <p className="text-xs font-mono font-bold text-emerald-700 pt-1">
                  Receipt: {stkModal.receipt}
                </p>
              )}
            </div>

            {stkModal.state === "waiting" && (
              <div className="flex items-center justify-center gap-2 text-xs text-black/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Waiting for M-Pesa confirmation...</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {stkModal.state === "failed" && (
                <button
                  type="button"
                  disabled={retryingStk}
                  onClick={handleResendStk}
                  className="w-full bg-[#266e00] hover:bg-black text-white text-xs uppercase tracking-wider font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {retryingStk ? "Sending Prompt..." : "Resend M-Pesa Prompt"}
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push(`/order/${stkModal.orderId}`)}
                className="w-full border border-black/20 hover:border-black text-black text-xs uppercase tracking-wider font-semibold py-3 rounded-lg transition-colors"
              >
                Continue to Order Page
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
