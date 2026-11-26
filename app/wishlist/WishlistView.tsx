"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { imageSrc, useWishlist } from "@/lib/shopper-lists";
import RecentlyViewed from "@/components/product/RecentlyViewed";

export default function WishlistView() {
  const { items, remove } = useWishlist();
  const router = useRouter();
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const handleCheckout = async (productId: string) => {
    setCheckingOutId(productId);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (typeof data?.count === "number") {
          window.dispatchEvent(new CustomEvent("cart-count-updated", { detail: { count: data.count } }));
        }
        router.push("/checkout");
      }
    } finally {
      setCheckingOutId(null);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl text-black">My wishlist</h1>
        <p className="text-sm text-black/60 mt-2">
          {items.length === 0
            ? "Items you save will appear here. They're kept on this device."
            : `${items.length} saved ${items.length === 1 ? "item" : "items"} · kept on this device`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-black/15 py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-black/25" aria-hidden>
            favorite
          </span>
          <p className="font-heading text-lg text-black mt-3 mb-5">Your wishlist is empty</p>
          <Link
            href="/#shop"
            className="inline-block bg-black text-white text-xs uppercase tracking-[0.15em] font-semibold px-7 py-3.5 hover:bg-gold transition-colors"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.08] border-y border-black/[0.08]">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-4 sm:gap-6 py-4">
              <Link
                href={`/product/${p.slug}`}
                className="relative w-20 h-24 sm:w-24 sm:h-28 shrink-0 bg-[#EEF1F4] overflow-hidden"
              >
                {p.image && (
                  <Image src={imageSrc(p.image)} alt={p.name} fill sizes="96px" className="object-cover" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${p.slug}`}
                  className="font-heading text-base text-black hover:text-gold line-clamp-2"
                >
                  {p.name}
                </Link>
                <p className="text-sm font-bold text-black mt-1 tabular-nums">{formatCurrency(p.price)}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <button
                  type="button"
                  disabled={checkingOutId === p.id}
                  onClick={() => handleCheckout(p.id)}
                  className="text-xs font-semibold uppercase tracking-wider bg-black text-white px-5 py-2.5 hover:bg-gold transition-colors whitespace-nowrap disabled:opacity-60"
                >
                  {checkingOutId === p.id ? "Processing..." : "Checkout"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="text-xs text-black/50 hover:text-black underline underline-offset-4 px-2 py-2"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RecentlyViewed className="mt-14" />
    </>
  );
}
