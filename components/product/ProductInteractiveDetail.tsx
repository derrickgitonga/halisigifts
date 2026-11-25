"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import AddToCartButton from "@/components/product/AddToCartButton";
import ProductDescription from "@/components/product/ProductDescription";
import BuyNowButton from "@/components/product/BuyNowButton";
import WhatsAppButton from "@/components/product/WhatsAppButton";
import WishlistButton from "@/components/product/WishlistButton";
import { TrackRecentlyViewed } from "@/components/product/RecentlyViewed";
import { imageSrc } from "@/lib/shopper-lists";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/lib/meta-pixel";
import { trackTikTokEvent } from "@/lib/tiktok-pixel";

export interface VariantData {
  id: string;
  name: string;
  image?: string | null;
  priceModifier: number;
  sku?: string;
  stock?: number;
}

export interface ProductData {
  id: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  stock: number;
  images: string[];
  category: { name: string; slug: string };
  variants: VariantData[];
}

function slugifyVariant(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ProductDetailContent({ product }: { product: ProductData }) {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const getInitialVariant = useCallback(() => {
    const rawParam = searchParams.get("variant");
    if (rawParam && product.variants.length > 0) {
      const variantParam = decodeURIComponent(rawParam).toLowerCase().trim();
      const match = product.variants.find(
        (v) =>
          v.id.toLowerCase() === variantParam ||
          slugifyVariant(v.name) === variantParam ||
          v.name.toLowerCase().trim() === variantParam
      );
      if (match) return match;
    }
    return product.variants.length > 0 ? product.variants[0] : null;
  }, [searchParams, product.variants]);

  const [selectedVariant, setSelectedVariant] = useState<VariantData | null>(getInitialVariant);

  const initialImage =
    selectedVariant?.image || product.images[0] || "/products/fallback.jpg";
  const [activeImage, setActiveImage] = useState<string>(initialImage);

  // Follow the ?variant= URL param when it changes (e.g. back/forward, shared links)
  const variantParam = searchParams.get("variant");
  const [prevVariantParam, setPrevVariantParam] = useState(variantParam);
  if (variantParam !== prevVariantParam) {
    setPrevVariantParam(variantParam);
    const matched = getInitialVariant();
    if (matched && matched.id !== selectedVariant?.id) {
      setSelectedVariant(matched);
      if (matched.image) {
        setActiveImage(matched.image);
      }
    }
  }

  const handleSelectVariant = (v: VariantData) => {
    setSelectedVariant(v);
    if (v.image) {
      setActiveImage(v.image);
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", slugifyVariant(v.name));
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const currentPrice = selectedVariant
    ? product.price + Number(selectedVariant.priceModifier)
    : product.price;

  useEffect(() => {
    trackEvent("ViewContent", {
      content_ids: [product.id],
      content_name: selectedVariant
        ? `${product.name} - ${selectedVariant.name}`
        : product.name,
      content_type: "product",
      value: currentPrice,
      currency: "KES",
      variant_id: selectedVariant?.id,
      variant_name: selectedVariant?.name,
    });

    trackTikTokEvent("ViewContent", {
      content_id: product.id,
      content_type: "product",
      content_name: selectedVariant
        ? `${product.name} - ${selectedVariant.name}`
        : product.name,
      value: currentPrice,
      currency: "KES",
      price: currentPrice,
    });
  }, [product.id, product.name, selectedVariant, currentPrice]);

  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const displayImages = product.images.length > 0 ? product.images : [initialImage];

  const isAvailable =
    selectedVariant && selectedVariant.stock !== undefined
      ? selectedVariant.stock > 0
      : product.stock > 0;

  const availableStock =
    selectedVariant && selectedVariant.stock !== undefined ? selectedVariant.stock : product.stock;
  const isLowStock = isAvailable && availableStock <= 5;

  // Show the mobile sticky bar when the main action buttons are off-screen
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // Lift the floating WhatsApp bubble above the bar while it is showing
  useEffect(() => {
    document.documentElement.style.setProperty("--sticky-bar-h", showStickyBar ? "72px" : "0px");
    return () => {
      document.documentElement.style.removeProperty("--sticky-bar-h");
    };
  }, [showStickyBar]);

  const savedProduct = {
    id: product.id,
    slug: product.slug ?? product.id,
    name: product.name,
    price: product.price,
    image: product.images[0] ?? null,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
      <TrackRecentlyViewed product={savedProduct} />

      {/* Mobile sticky buy bar: appears once the main buttons scroll away */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-black/10 px-4 py-3 flex items-center gap-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showStickyBar}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs text-black/60 truncate">{product.name}</p>
          <p className="text-base font-bold text-black tabular-nums">{formatCurrency(currentPrice)}</p>
        </div>
        <AddToCartButton
          productId={product.id}
          productName={product.name}
          variantId={selectedVariant?.id}
          variantName={selectedVariant?.name}
          price={currentPrice}
          disabled={!isAvailable}
          label="Add to cart"
          className="shrink-0 rounded-full bg-black text-white px-5 py-3 hover:bg-gold transition-colors flex items-center justify-center gap-1.5 text-xs uppercase tracking-[0.12em] font-semibold"
        />
      </div>
      {/* Product Gallery Section */}
      <div className="flex flex-col gap-4">
        <div className="w-full aspect-square bg-[#EEF1F4] overflow-hidden relative border border-black/[0.08]">
          <Image
            src={imageSrc(activeImage || displayImages[0])}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-all duration-300"
          />
        </div>

        {displayImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveImage(img);
                  const matchingVar = product.variants.find((v) => v.image === img);
                  if (matchingVar) {
                    handleSelectVariant(matchingVar);
                  }
                }}
                className={`relative w-20 h-20 overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeImage === img ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={imageSrc(img)} alt={`${product.name} thumbnail ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Details and Options */}
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-widest text-gold font-label-sm font-semibold">
              {product.category.name}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs text-black/60 hover:text-black flex items-center gap-1 px-2.5 py-1 border border-black/10 hover:border-black/30 transition-colors"
              title="Copy shareable product link"
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? "check" : "share"}
              </span>
              <span>{copied ? "Link Copied!" : "Share Link"}</span>
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 mt-2 mb-4">
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl text-black leading-tight">
              {product.name}
            </h1>
            <WishlistButton product={savedProduct} className="shrink-0 !shadow-none border border-black/10 mt-1" />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
            <p className="text-2xl text-black font-bold tabular-nums">
              {product.priceMin && product.priceMax ? (
                <span>
                  {formatCurrency(Number(product.priceMin))} - {formatCurrency(Number(product.priceMax))}
                </span>
              ) : (
                formatCurrency(currentPrice)
              )}
            </p>
            {compareAtPrice && (
              <p className="text-lg text-black/40 line-through">{formatCurrency(compareAtPrice)}</p>
            )}
            {isLowStock ? (
              <span className="text-[11px] bg-[#FFEC40] text-black px-2.5 py-1 font-semibold uppercase tracking-wider">
                Only {availableStock} left
              </span>
            ) : isAvailable ? (
              <span className="text-[11px] bg-gold/10 text-gold px-2.5 py-1 font-semibold uppercase tracking-wider">
                In Stock
              </span>
            ) : (
              <span className="text-[11px] bg-black/5 text-black/60 px-2.5 py-1 font-semibold uppercase tracking-wider">
                Out of Stock
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-label-md uppercase tracking-wider text-black/80 font-medium">
                  Select Option / Variant:{" "}
                  <span className="text-black font-semibold">{selectedVariant?.name}</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVariant(v)}
                      className={`px-4 py-2 border text-sm font-medium transition-all ${
                        isSelected
                          ? "border-black bg-black text-white"
                          : "border-black/20 text-black/80 hover:border-black"
                      }`}
                    >
                      {v.name}
                      {Number(v.priceModifier) !== 0 && (
                        <span className="ml-1 text-xs opacity-80">
                          ({Number(v.priceModifier) > 0 ? "+" : ""}
                          {formatCurrency(Number(v.priceModifier))})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div ref={actionsRef} className="space-y-2 mb-6 max-w-md">
            <div className="grid grid-cols-2 gap-2">
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                variantId={selectedVariant?.id}
                variantName={selectedVariant?.name}
                price={currentPrice}
                disabled={!isAvailable}
                className="w-full rounded-full bg-black text-white py-2.5 hover:bg-gold transition-colors duration-300 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-semibold [&>.material-symbols-outlined]:!text-base"
              />
              <BuyNowButton
                productId={product.id}
                productName={product.name}
                variantId={selectedVariant?.id}
                variantName={selectedVariant?.name}
                price={currentPrice}
                disabled={!isAvailable}
                className="w-full rounded-full bg-gold text-white py-2.5 hover:bg-black transition-colors duration-300 flex items-center justify-center text-[11px] uppercase tracking-[0.12em] font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <WhatsAppButton
                productName={product.name}
                productSlug={product.slug}
                price={currentPrice}
                variantName={selectedVariant?.name}
                variant="action"
                label="WhatsApp"
                className="w-full !rounded-full !shadow-none !py-2 !px-3 !gap-1.5 !text-xs [&>svg]:!w-4 [&>svg]:!h-4"
              />
              <a
                href="tel:+254729596165"
                className="w-full rounded-full border border-black/15 hover:border-black text-black py-2 transition-colors duration-300 flex items-center justify-center gap-1.5 text-xs font-semibold"
                title="Call to place your order: +254729596165"
              >
                <span className="material-symbols-outlined text-base" aria-hidden>
                  call
                </span>
                <span>Call to order</span>
              </a>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-b border-black/10 py-6 mb-6">
            <ProductDescription description={product.description} />
          </div>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 text-center text-[11px] sm:text-xs text-black/70 border-t border-black/10">
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-gold text-xl">local_shipping</span>
              <span>Fast Kenya Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-gold text-xl">verified</span>
              <span>100% Authentic</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-gold text-xl">lock</span>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductInteractiveDetail({ product }: { product: ProductData }) {
  return (
    <Suspense fallback={null}>
      <ProductDetailContent product={product} />
    </Suspense>
  );
}
