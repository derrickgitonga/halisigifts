"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { getQuickWhatsAppCheckoutUrl } from "@/lib/whatsapp-checkout";
import { imageSrc } from "@/lib/shopper-lists";
import AddToCartButton from "@/components/product/AddToCartButton";
import WishlistButton from "@/components/product/WishlistButton";
import type { ShopProduct } from "@/lib/home-catalog";

const LOW_STOCK_THRESHOLD = 5;

export default function ProductCard({
  product,
  priority = false,
}: {
  product: ShopProduct;
  priority?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;
  const lowStock = product.inStock && product.stock <= LOW_STOCK_THRESHOLD;
  const whatsappUrl = getQuickWhatsAppCheckoutUrl({
    productName: product.name,
    productSlug: product.slug,
    price: product.price,
  });
  const saved = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
  };

  return (
    <article className={`group bg-white border border-black/[0.08] hover:border-black/15 hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col${priority ? "" : " cv-auto"}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#EEF1F4]">
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0"
        >
          {product.image && !broken ? (
            <Image
              src={imageSrc(product.image)}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setBroken(true)}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-heading text-black/25 text-sm">
              Halisi Gifts
            </span>
          )}
        </Link>

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {discount > 0 && (
            <span className="bg-black text-white text-[10px] font-semibold tracking-wider px-2 py-1">
              −{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-white text-black text-[10px] font-semibold uppercase tracking-wider px-2 py-1">
              New
            </span>
          )}
        </div>

        {/* Wishlist — always visible so it works on touch screens */}
        <div className="absolute top-2.5 right-2.5">
          <WishlistButton product={saved} className="!w-9 !h-9 !shadow-sm" />
        </div>

        {!product.inStock ? (
          <span className="absolute bottom-3 left-3 bg-white/90 text-black/60 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 pointer-events-none">
            Sold out
          </span>
        ) : (
          lowStock && (
            <span className="absolute bottom-3 left-3 bg-[#FFEC40] text-black text-[10px] font-semibold uppercase tracking-wider px-2 py-1 pointer-events-none">
              Only {product.stock} left
            </span>
          )
        )}

        {/* Hover actions (desktop) */}
        <div className="absolute inset-x-0 bottom-4 hidden md:flex justify-center gap-2.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-all duration-300">
          <Link
            href={`/product/${product.slug}`}
            title="View details"
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:bg-gold hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden>
              visibility
            </span>
            <span className="sr-only">View {product.name}</span>
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Order on WhatsApp"
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:bg-[#25D366] hover:text-white transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-[18px] h-[18px]"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 01-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 012.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0012.04.75C5.8.75.72 5.83.72 12.07c0 2 .52 3.94 1.51 5.65L.62 23.25l5.66-1.48a11.3 11.3 0 005.75 1.47h.01c6.24 0 11.32-5.08 11.32-11.32 0-3.02-1.18-5.86-3.29-7.88z" />
            </svg>
            <span className="sr-only">Order {product.name} on WhatsApp</span>
          </a>
        </div>
      </div>

      <div className="px-3.5 pt-4 pb-3.5 md:px-5 md:pt-5 md:pb-4 flex flex-col gap-1.5 flex-grow">
        {product.brand && (
          <span className="text-[10px] uppercase tracking-[0.15em] text-black/45">
            {product.brand}
          </span>
        )}
        <h3 className="font-heading text-[15px] md:text-base text-black leading-snug line-clamp-2">
          <Link
            href={`/product/${product.slug}`}
            className="hover:text-gold transition-colors"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto pt-1 flex items-baseline gap-2">
          <span className="text-base md:text-lg font-bold text-black tabular-nums">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-black/40 line-through tabular-nums">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Quick add */}
        <div className="pt-3">
          {!product.inStock ? (
            <span className="block w-full text-center border border-black/10 text-black/40 text-[11px] uppercase tracking-[0.12em] font-semibold py-2.5">
              Sold out
            </span>
          ) : product.hasVariants ? (
            <Link
              href={`/product/${product.slug}`}
              className="block w-full text-center border border-black/80 text-black text-[11px] uppercase tracking-[0.12em] font-semibold py-2.5 hover:bg-black hover:text-white transition-colors"
            >
              Choose options
            </Link>
          ) : (
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              price={product.price}
              label="Add to cart"
              className="w-full bg-black text-white text-[11px] uppercase tracking-[0.12em] font-semibold py-2.5 hover:bg-gold transition-colors flex items-center justify-center gap-1.5 [&>.material-symbols-outlined]:!text-base"
            />
          )}
        </div>
      </div>
    </article>
  );
}
