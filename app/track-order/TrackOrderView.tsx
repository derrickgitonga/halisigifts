"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import type { TrackedOrder } from "@/lib/order-tracking";

const STORE_WHATSAPP = "254729596165";

type Step = { label: string; detail: string; icon: string };

function stepsFor(order: TrackedOrder): Step[] {
  const pickup = order.deliveryMethod === "PICKUP";
  return [
    { label: "Order placed", detail: "We've received your order", icon: "receipt_long" },
    { label: "Confirmed", detail: "Payment checked and order being prepared", icon: "inventory_2" },
    pickup
      ? { label: "Ready for pickup", detail: "Accra Trade Centre, 2nd Flr SF21", icon: "storefront" }
      : {
          label: "On the way",
          detail: order.deliveryMethod === "RIDER" ? "With our rider" : "Handed to the courier",
          icon: "local_shipping",
        },
    pickup
      ? { label: "Collected", detail: "Enjoy your purchase", icon: "check_circle" }
      : { label: "Delivered", detail: "Enjoy your purchase", icon: "check_circle" },
  ];
}

function currentStepIndex(status: TrackedOrder["status"]): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "PROCESSING":
    case "PAID":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return -1;
  }
}

const dateFmt = new Intl.DateTimeFormat("en-KE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const DELIVERY_LABEL: Record<TrackedOrder["deliveryMethod"], string> = {
  PICKUP: "Shop pickup (Nairobi CBD)",
  RIDER: "Rider delivery",
  COURIER: "Courier delivery",
};

const PAYMENT_LABEL: Record<string, string> = {
  MPESA: "M-Pesa",
  CARD: "Card",
  CASH_ON_DELIVERY: "Cash on pickup",
};

function OrderResult({ order }: { order: TrackedOrder }) {
  const steps = stepsFor(order);
  const current = currentStepIndex(order.status);
  const cancelled = order.status === "CANCELLED";
  const waText = `Hi Halisi Gifts, I'd like an update on order ${order.reference}.`;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">Order</p>
          <p className="font-heading text-2xl md:text-3xl text-black">{order.reference}</p>
          <p className="text-sm text-black/60 mt-1">Placed {dateFmt.format(new Date(order.placedAt))}</p>
        </div>
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.15em] px-3 py-1.5 ${
            cancelled
              ? "bg-black/5 text-black/60"
              : order.status === "DELIVERED"
                ? "bg-gold text-white"
                : "bg-gold/10 text-gold"
          }`}
        >
          {cancelled ? "Cancelled" : steps[Math.max(0, current)].label}
        </span>
      </div>

      {/* Progress */}
      {cancelled ? (
        <div className="border border-black/10 bg-white p-5 text-sm text-black/70">
          This order was cancelled. If you weren&apos;t expecting this, please{" "}
          <a
            href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-4"
          >
            message us on WhatsApp
          </a>
          .
        </div>
      ) : (
        <ol className="grid gap-0 md:grid-cols-4 border border-black/10 bg-white">
          {steps.map((step, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li
                key={step.label}
                className={`relative flex md:flex-col items-start gap-4 md:gap-3 p-5 ${
                  i > 0 ? "border-t md:border-t-0 md:border-l border-black/10" : ""
                }`}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    done || active ? "bg-gold text-white" : "bg-black/5 text-black/30"
                  } ${active ? "ring-4 ring-gold/15" : ""}`}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden>
                    {done ? "check" : step.icon}
                  </span>
                </span>
                <div>
                  <p className={`text-sm font-semibold ${done || active ? "text-black" : "text-black/40"}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${done || active ? "text-black/60" : "text-black/30"}`}>
                    {i === 0
                      ? dateFmt.format(new Date(order.placedAt))
                      : active
                        ? `${step.detail} · updated ${dateFmt.format(new Date(order.updatedAt))}`
                        : step.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="border border-black/10 bg-white">
          <h2 className="font-heading text-lg text-black px-5 pt-5 pb-3">Items</h2>
          <ul className="divide-y divide-black/[0.08] border-t border-black/[0.08]">
            {order.items.map((it, idx) => (
              <li key={idx} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <Link href={`/product/${it.slug}`} className="text-sm text-black hover:text-gold line-clamp-2">
                    {it.name}
                  </Link>
                  <p className="text-xs text-black/50 mt-0.5">
                    Qty {it.quantity}
                    {it.variantName ? ` · ${it.variantName}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-black tabular-nums shrink-0">
                  {formatCurrency(it.price * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="border border-black/10 bg-white p-5 h-fit space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-black/60">Delivery</span>
            <span className="text-black text-right">
              {DELIVERY_LABEL[order.deliveryMethod]}
              {order.county && order.deliveryMethod !== "PICKUP" ? ` · ${order.county}` : ""}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-black/60">Payment</span>
            <span className="text-black">{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-black/10 pt-3">
            <span className="text-black font-semibold">Total</span>
            <span className="text-black font-bold tabular-nums">{formatCurrency(order.total)}</span>
          </div>
          {order.amountDueOnDelivery > 0 && !cancelled && order.status !== "DELIVERED" && (
            <div className="flex justify-between gap-4 text-black/70">
              <span>Balance on delivery</span>
              <span className="tabular-nums">{formatCurrency(order.amountDueOnDelivery)}</span>
            </div>
          )}
          <a
            href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold py-2.5 transition-colors"
          >
            Questions? WhatsApp us
          </a>
        </aside>
      </div>
    </div>
  );
}

export default function TrackOrderView() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState(searchParams.get("order") ?? "");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; offline?: boolean } | null>(null);
  const [result, setResult] = useState<TrackedOrder | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, contact }),
      });
      const data = await res.json();
      if (data.success) setResult(data.order);
      else setError({ message: data.error || "Something went wrong.", offline: data.offline });
    } catch {
      setError({ message: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const waText = `Hi Halisi Gifts, I'd like an update on my order${order.trim() ? ` #${order.trim().replace(/^#/, "")}` : ""}.`;

  return (
    <div className="space-y-10">
      <form
        onSubmit={submit}
        className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end max-w-4xl"
        aria-describedby={error ? "track-error" : undefined}
      >
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-black/70 mb-1.5">
            Order number
          </span>
          <input
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            required
            autoComplete="off"
            placeholder="e.g. HG-10001"
            className="w-full border border-black/15 bg-white px-4 py-3 text-sm focus:outline-none focus:border-gold uppercase placeholder:normal-case"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-black/70 mb-1.5">
            Phone or email
          </span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            autoComplete="tel"
            placeholder="0712 345 678 or you@example.com"
            className="w-full border border-black/15 bg-white px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black text-white text-xs uppercase tracking-[0.14em] font-semibold px-8 py-3.5 hover:bg-gold transition-colors disabled:opacity-60"
        >
          {loading ? "Checking…" : "Track order"}
        </button>
      </form>

      {error && (
        <div id="track-error" role="alert" className="max-w-4xl border border-black/10 bg-white p-5 text-sm text-black/75">
          <p>{error.message}</p>
          <a
            href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-gold font-semibold underline underline-offset-4"
          >
            Ask us on WhatsApp instead
          </a>
        </div>
      )}

      {result && <OrderResult order={result} />}

      {!result && !error && (
        <p className="text-xs text-black/50 max-w-xl">
          Your order number (like HG-10001) is on your order confirmation page, in your confirmation email and in the
          WhatsApp message sent when you ordered.
        </p>
      )}
    </div>
  );
}
