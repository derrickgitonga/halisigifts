"use client";

import { useWishlist, type SavedProduct } from "@/lib/shopper-lists";

interface WishlistButtonProps {
  product: SavedProduct;
  /** "icon" = round icon for cards, "full" = labelled button for product pages */
  variant?: "icon" | "full";
  className?: string;
}

export default function WishlistButton({ product, variant = "icon", className = "" }: WishlistButtonProps) {
  const { has, toggle } = useWishlist();
  const saved = has(product.id);
  const label = saved ? "Remove from wishlist" : "Save to wishlist";

  const icon = (
    <span
      className="material-symbols-outlined text-[20px]"
      style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
      aria-hidden
    >
      favorite
    </span>
  );

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(product)}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center gap-2 border px-5 py-3 text-sm font-semibold transition-colors ${
          saved
            ? "border-gold text-gold bg-gold/5"
            : "border-black/15 text-black/75 hover:border-black hover:text-black"
        } ${className}`}
      >
        {icon}
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      aria-pressed={saved}
      title={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${
        saved ? "bg-gold text-white" : "bg-white text-black hover:bg-gold hover:text-white"
      } ${className}`}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}
