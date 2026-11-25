"use client";

import { useState, useEffect, useMemo } from "react";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import { resolveDelivery, type Fulfillment, type DeliveryResolution } from "@/lib/delivery";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  images: string[];
}

export interface CartItemData {
  id: string;
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
  product: CartProduct;
}

export type DeliveryState = {
  fulfillment: Fulfillment;
  county: string | null;
  paymentMethod: "MPESA" | "CARD" | "CASH_ON_DELIVERY";
  addressLine: string;
  engravingText: string;
  engravingFee: number;
  customerNote: string;
  resolution: DeliveryResolution;
};

type Props = {
  cartItems?: CartItemData[];
  onChange: (state: DeliveryState) => void;
};

interface WatchSlot {
  key: string;
  label: string;
}

const inputClass =
  "w-full bg-white border border-black/20 rounded p-3 text-base focus:outline-none focus:border-gold";

const labelClass = "block text-xs font-label-md uppercase tracking-wider mb-2";

export default function CheckoutDelivery({ cartItems = [], onChange }: Props) {
  const [fulfillment, setFulfillment] = useState<Fulfillment>("DELIVERY");
  const [county, setCounty] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CARD" | "CASH_ON_DELIVERY">("MPESA");
  const [addressLine, setAddressLine] = useState("");
  const [engravings, setEngravings] = useState<Record<string, string>>({});
  const [customerNote, setCustomerNote] = useState("");

  const watchSlots: WatchSlot[] = useMemo(() => {
    if (cartItems.length === 0) {
      return [{ key: "default-0", label: "Custom Engraving" }];
    }
    return cartItems.flatMap((item) => {
      return Array.from({ length: item.quantity }, (_, i) => ({
        key: `${item.id}-${i}`,
        label: item.quantity > 1 ? `${item.product.name} (Watch ${i + 1})` : item.product.name,
      }));
    });
  }, [cartItems]);

  const activeEngravings = useMemo(() => {
    return watchSlots
      .map((slot) => ({
        key: slot.key,
        label: slot.label,
        text: (engravings[slot.key] || "").trim(),
      }))
      .filter((slot) => slot.text.length > 0);
  }, [watchSlots, engravings]);

  const engravingFee = activeEngravings.length * 200;

  const combinedEngravingText = useMemo(() => {
    if (activeEngravings.length === 0) return "";
    if (activeEngravings.length === 1 && watchSlots.length === 1) {
      return activeEngravings[0].text;
    }
    return activeEngravings.map((s) => `${s.label}: ${s.text}`).join("\n");
  }, [activeEngravings, watchSlots.length]);

  const emit = (
    nextFulfillment: Fulfillment,
    nextCounty: string | null,
    nextPayment: "MPESA" | "CARD" | "CASH_ON_DELIVERY",
    nextAddressLine: string = addressLine,
    nextEngravingText: string = combinedEngravingText,
    nextEngravingFee: number = engravingFee,
    nextNote: string = customerNote
  ) => {
    const resolution = resolveDelivery(nextCounty, nextFulfillment);
    let finalPayment = nextPayment;
    if (nextFulfillment === "DELIVERY" && nextPayment !== "MPESA") {
      finalPayment = "MPESA";
      setPaymentMethod("MPESA");
    }

    onChange({
      fulfillment: nextFulfillment,
      county: nextCounty,
      paymentMethod: finalPayment,
      addressLine: nextAddressLine,
      engravingText: nextEngravingText,
      engravingFee: nextEngravingFee,
      customerNote: nextNote,
      resolution,
    });
  };

  useEffect(() => {
    emit(
      fulfillment,
      county,
      paymentMethod,
      addressLine,
      combinedEngravingText,
      engravingFee,
      customerNote
    );
  }, [combinedEngravingText, engravingFee]);

  const handleFulfillment = (next: Fulfillment) => {
    setFulfillment(next);
    const nextCounty = next === "PICKUP" ? null : county;
    const nextPayment = next === "DELIVERY" ? "MPESA" : paymentMethod;
    if (next === "DELIVERY" && paymentMethod !== "MPESA") {
      setPaymentMethod("MPESA");
    }
    emit(next, nextCounty, nextPayment);
  };

  const handleCounty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value || null;
    setCounty(next);
    emit(fulfillment, next, paymentMethod);
  };

  const handlePayment = (next: "MPESA" | "CARD" | "CASH_ON_DELIVERY") => {
    setPaymentMethod(next);
    emit(fulfillment, county, next);
  };

  const handleAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setAddressLine(next);
    emit(fulfillment, county, paymentMethod, next);
  };

  const handleSlotEngravingChange = (slotIndex: number, text: string) => {
    setEngravings((prev) => {
      const updated = { ...prev };
      const currentKey = watchSlots[slotIndex].key;

      if (!text.trim()) {
        delete updated[currentKey];
        for (let j = slotIndex + 1; j < watchSlots.length; j++) {
          delete updated[watchSlots[j].key];
        }
      } else {
        updated[currentKey] = text;
      }
      return updated;
    });
  };

  const handleCustomerNote = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setCustomerNote(next);
    emit(
      fulfillment,
      county,
      paymentMethod,
      addressLine,
      combinedEngravingText,
      engravingFee,
      next
    );
  };

  const resolution = resolveDelivery(county, fulfillment);

  return (
    <div className="space-y-8">
      {/* Custom Engraving & Message Section */}
      <div className="bg-white border border-black/10 rounded-lg p-6 space-y-6">
        <div className="border border-black/10 rounded-lg p-5 bg-black/[0.02] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm uppercase tracking-wider text-black">
                Custom Engraving
              </h3>
              <p className="text-xs text-black/60 mt-0.5">
                Add custom names, initials, dates, or personal messages. KSh 200 per watch.
              </p>
            </div>
            {engravingFee > 0 && (
              <span className="text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded">
                +KSh {engravingFee}
              </span>
            )}
          </div>

          <div className="space-y-4 pt-1">
            {watchSlots.map((slot, index) => {
              const isVisible =
                index === 0 ||
                Boolean(engravings[watchSlots[index - 1]?.key]?.trim());

              if (!isVisible) return null;

              const slotText = engravings[slot.key] || "";
              const isFilled = slotText.trim().length > 0;

              return (
                <div
                  key={slot.key}
                  className="p-3.5 bg-white border border-black/10 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-black">
                      {slot.label} Engraving{" "}
                      <span className="text-black/40 font-normal">(optional)</span>
                    </label>
                    {isFilled && (
                      <span className="text-gold font-medium">+KSh 200</span>
                    )}
                  </div>

                  <textarea
                    value={slotText}
                    onChange={(e) => handleSlotEngravingChange(index, e.target.value)}
                    rows={2}
                    placeholder={`e.g. Names, dates, initials, or special words for ${slot.label}...`}
                    className={`${inputClass} text-sm resize-none`}
                  />

                  {isFilled && index < watchSlots.length - 1 && (
                    <p className="text-xs text-green-700">
                      Next watch engraving unlocked below.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {engravingFee > 0 && (
            <div className="text-xs text-gold font-semibold pt-1 border-t border-black/10 flex justify-between">
              <span>Total Engraving:</span>
              <span>+KSh {engravingFee} ({activeEngravings.length} item{activeEngravings.length > 1 ? "s" : ""} engraved)</span>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>
            Message to Seller <span className="normal-case text-black/40 font-normal tracking-normal">(optional)</span>
          </label>
          <textarea
            value={customerNote}
            onChange={handleCustomerNote}
            rows={2}
            placeholder="e.g. Gift wrap preferences, delivery instructions, or special requests..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Fulfillment Section */}
      <div className="bg-white border border-black/10 rounded-lg p-6 space-y-6">
        <h2 className="font-headline-md text-headline-md border-b border-black/10 pb-4">
          Fulfillment
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleFulfillment("DELIVERY")}
            className={`p-4 rounded-lg border text-left transition-colors duration-200 ${
              fulfillment === "DELIVERY"
                ? "border-gold bg-gold/5"
                : "border-black/15 hover:border-black/30"
            }`}
          >
            <p className="font-semibold text-sm">Delivery</p>
            <p className="text-xs text-black/50 mt-0.5">KSh 250</p>
          </button>

          <button
            type="button"
            onClick={() => handleFulfillment("PICKUP")}
            className={`p-4 rounded-lg border text-left transition-colors duration-200 ${
              fulfillment === "PICKUP"
                ? "border-gold bg-gold/5"
                : "border-black/15 hover:border-black/30"
            }`}
          >
            <p className="font-semibold text-sm">Pickup at shop</p>
            <p className="text-xs text-black/50 mt-0.5">Free</p>
          </button>
        </div>

        {fulfillment === "PICKUP" && (
          <div className="text-sm text-black/70 space-y-1">
            <p className="font-medium text-black">
              Accra Road, Accra Trade Centre Building, 2nd Floor, Shop SF21
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Accra+Trade+Centre+Building,+Accra+Road,+Nairobi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gold hover:underline font-semibold text-xs"
            >
              <span className="material-symbols-outlined text-sm">pin_drop</span>
              <span>View Map Pin & Directions</span>
            </a>
          </div>
        )}

        {fulfillment === "DELIVERY" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>County</label>
              <select
                value={county ?? ""}
                onChange={handleCounty}
                required
                className={inputClass}
              >
                <option value="" disabled>
                  Select your county
                </option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {county && (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                {resolution.deliveryMethod === "RIDER" ? (
                  <span>
                    Rider delivery:{" "}
                    <span className="font-semibold">KSh {resolution.fee}</span>
                  </span>
                ) : (
                  <span>
                    Courier:{" "}
                    <span className="font-semibold">KSh {resolution.fee}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <label className={labelClass}>Payment Method</label>

          {fulfillment === "DELIVERY" ? (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="MPESA"
                checked={paymentMethod === "MPESA"}
                onChange={() => handlePayment("MPESA")}
                className="accent-gold"
              />
              <span className="text-sm font-medium">M-Pesa</span>
            </label>
          ) : (
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="MPESA"
                  checked={paymentMethod === "MPESA"}
                  onChange={() => handlePayment("MPESA")}
                  className="accent-gold"
                />
                <span className="text-sm font-medium">M-Pesa</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH_ON_DELIVERY"
                  checked={paymentMethod === "CASH_ON_DELIVERY"}
                  onChange={() => handlePayment("CASH_ON_DELIVERY")}
                  className="accent-gold"
                />
                <span className="text-sm font-medium">Cash / Pay at Shop</span>
              </label>
            </div>
          )}
        </div>

        {fulfillment === "DELIVERY" && (
          <div>
            <label className={labelClass}>Physical Delivery Address / Building / Street</label>
            <input
              type="text"
              name="addressLine"
              required
              value={addressLine}
              onChange={handleAddress}
              placeholder="e.g. Westlands, Kimathi Street, House 4B"
              className={inputClass}
            />
          </div>
        )}
      </div>
    </div>
  );
}
