"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/meta-pixel";
import { trackTikTokEvent } from "@/lib/tiktok-pixel";

interface BuyNowButtonProps {
  productId: string;
  productName?: string;
  variantId?: string;
  variantName?: string;
  price?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export default function BuyNowButton({
  productId,
  productName,
  variantId,
  variantName,
  price,
  className = "w-full bg-gold text-white font-label-md py-3.5 sm:py-4 rounded-lg hover:bg-black transition-colors duration-300 flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold shadow-sm",
  label = "Buy Now",
  disabled = false,
}: BuyNowButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBuyNow = async () => {
    if (disabled || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: 1,
          variantId: variantId || undefined,
          variantName: variantName || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new Event("cart-updated"));

        const itemPrice = price ?? (data.item?.product?.price ? Number(data.item.product.price) : undefined);
        const resolvedName = variantName && productName ? `${productName} - ${variantName}` : productName;

        trackEvent("AddToCart", {
          content_ids: [productId],
          content_name: resolvedName,
          content_type: "product",
          value: itemPrice,
          currency: "KES",
          variant_id: variantId,
          variant_name: variantName,
        });

        trackTikTokEvent("AddToCart", {
          content_id: productId,
          content_name: resolvedName,
          content_type: "product",
          quantity: 1,
          value: itemPrice,
          currency: "KES",
          price: itemPrice,
        });

        trackEvent("InitiateCheckout", {
          content_ids: [productId],
          content_name: resolvedName,
          content_type: "product",
          value: itemPrice,
          currency: "KES",
        });

        trackTikTokEvent("InitiateCheckout", {
          content_id: productId,
          content_name: resolvedName,
          content_type: "product",
          quantity: 1,
          value: itemPrice,
          currency: "KES",
          price: itemPrice,
        });

        router.push("/checkout");
      } else {
        router.push("/checkout");
      }
    } catch {
      router.push("/checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBuyNow}
      disabled={loading || disabled}
      className={`${className} ${disabled ? "opacity-50 cursor-not-allowed bg-black/40 hover:bg-black/40" : ""}`}
    >
      {disabled ? "Out of Stock" : loading ? "Processing..." : label}
    </button>
  );
}
