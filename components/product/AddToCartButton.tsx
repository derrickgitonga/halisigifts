"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/meta-pixel";
import { trackTikTokEvent } from "@/lib/tiktok-pixel";

interface AddToCartButtonProps {
  productId: string;
  productName?: string;
  variantId?: string;
  variantName?: string;
  price?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  productId,
  productName,
  variantId,
  variantName,
  price,
  className = "w-full bg-black text-white font-label-md py-4 rounded-lg hover:bg-gold transition-colors duration-300 flex items-center justify-center gap-2",
  label = "Add to Cart",
  disabled = false,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
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
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        window.dispatchEvent(new Event("cart-updated"));
        window.dispatchEvent(new Event("open-cart-drawer"));

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
      }
    } catch {
      // Fallback feedback
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || disabled}
      className={`${className} ${disabled ? "opacity-50 cursor-not-allowed bg-black/40 hover:bg-black/40" : ""}`}
    >
      <span className="material-symbols-outlined text-xl">
        {disabled ? "block" : added ? "check_circle" : "shopping_bag"}
      </span>
      {disabled ? "Out of Stock" : loading ? "Adding..." : added ? "Added to Cart!" : label}
    </button>
  );
}
