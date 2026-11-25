"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import {
  imageSrc,
  recordRecentlyViewed,
  useRecentlyViewed,
  type SavedProduct,
} from "@/lib/shopper-lists";

/** Drop on a product page to add it to the shopper's recently-viewed list. */
export function TrackRecentlyViewed({ product }: { product: SavedProduct }) {
  useEffect(() => {
    if (product.id === "sample-product-id") return;
    recordRecentlyViewed(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  return null;
}

/** Horizontal strip of recently viewed products (hides itself when empty). */
export default function RecentlyViewed({
  excludeId,
  title = "Recently viewed",
  className = "",
}: {
  excludeId?: string;
  title?: string;
  className?: string;
}) {
  const items = useRecentlyViewed().filter((p) => p.id !== excludeId).slice(0, 8);
  if (items.length === 0) return null;

  return (
    <section className={className} aria-label={title}>
      <h2 className="font-heading text-xl md:text-2xl text-black mb-5">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin]">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            className="group snap-start shrink-0 w-36 sm:w-44 bg-white border border-black/[0.08] hover:border-black/15 transition-colors"
          >
            <div className="relative aspect-[4/5] bg-[#EEF1F4] overflow-hidden">
              {p.image && (
                <Image
                  src={imageSrc(p.image)}
                  alt={p.name}
                  fill
                  sizes="176px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="p-3">
              <p className="text-xs text-black line-clamp-2 leading-snug group-hover:text-gold transition-colors">
                {p.name}
              </p>
              <p className="text-sm font-bold text-black mt-1 tabular-nums">{formatCurrency(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
