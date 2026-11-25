"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { imageSrc } from "@/lib/shopper-lists";
import { formatCurrency } from "@/lib/utils";
import AddToCartButton from "@/components/product/AddToCartButton";

interface CartItemData {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    images: string[];
  };
}

interface RecommendedItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category?: {
    name: string;
    slug: string;
  };
}

export default function CartView() {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async (cartProductIds: string[]) => {
    try {
      const idsQuery = cartProductIds.join(",");
      const res = await fetch(`/api/cart/recommendations?ids=${encodeURIComponent(idsQuery)}&limit=4`);
      const data = await res.json();
      if (data.success && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      }
    } catch {
      // Fallback
    }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
        const productIds = data.items.map((it: CartItemData) => it.product.id);
        fetchRecommendations(productIds);
      } else {
        fetchRecommendations([]);
      }
    } catch {
      fetchRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [fetchRecommendations]);

  useEffect(() => {
    // Initial load; state is only set after the request resolves
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
    window.addEventListener("cart-updated", fetchCart);
    return () => window.removeEventListener("cart-updated", fetchCart);
  }, [fetchCart]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(itemId);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
        );
      }
    } catch {
      // Error handling
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart?id=${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch {
      // Error handling
    }
  };

  const subtotal = items.reduce((acc, item) => {
    return acc + Number(item.product.price) * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="py-20 text-center text-black/60 font-body-lg">
        Loading your shopping cart...
      </div>
    );
  }

  const renderRecommendationsStrip = () => {
    if (recommendations.length === 0) return null;

    return (
      <div className="mt-16 pt-12 border-t border-black/10">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-label-sm font-semibold mb-1 block">
            Complete Your Order
          </span>
          <h2 className="font-heading text-2xl md:text-3xl text-black">
            You Might Also Want to Add
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="group flex flex-col justify-between bg-white border border-black/[0.08] hover:border-black/15 p-3 transition-colors"
            >
              <div>
                <Link href={`/product/${rec.slug}`} className="block">
                  <div
                    className="w-full aspect-square bg-[#EEF1F4] overflow-hidden mb-3.5 relative"
                  >
                    <Image
                      src={imageSrc(rec.images[0] || "/products/fallback.jpg")}
                      alt={rec.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {rec.category && (
                      <span className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-label-sm px-2.5 py-0.5 rounded-full">
                        {rec.category.name}
                      </span>
                    )}
                  </div>
                </Link>

                <Link href={`/product/${rec.slug}`}>
                  <h3 className="font-body-md text-sm md:text-base text-black mb-1 group-hover:text-gold transition-colors font-medium line-clamp-1">
                    {rec.name}
                  </h3>
                </Link>

                <p className="font-label-md text-black font-bold text-sm md:text-base mb-3.5">
                  {formatCurrency(rec.price)}
                </p>
              </div>

              <AddToCartButton
                productId={rec.id}
                productName={rec.name}
                price={rec.price}
                className="w-full bg-black text-white text-xs font-label-md py-2.5 hover:bg-gold transition-colors flex items-center justify-center gap-1.5 font-semibold uppercase tracking-wider"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="space-y-12">
        <div className="text-center py-16 bg-white border border-black/10 p-8 max-w-xl mx-auto">
          <span className="material-symbols-outlined text-6xl text-gold mb-4">shopping_bag</span>
          <h2 className="font-display-lg text-2xl md:text-3xl mb-3 text-black">Your Cart is Empty</h2>
          <p className="font-body-md text-black/70 mb-8 text-sm md:text-base">
            Explore our exclusive collection of timepieces, Arabian fragrances, and luxury gift sets to add items to your cart.
          </p>
          <Link
            href="/"
            className="inline-block bg-gold text-white font-label-md px-8 py-3.5 hover:bg-black transition-colors uppercase tracking-wider font-semibold text-sm"
          >
            Explore Catalog
          </Link>
        </div>

        {renderRecommendationsStrip()}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 bg-white border border-black/10"
            >
              <div className="w-24 h-24 relative overflow-hidden bg-black/5 flex-shrink-0">
                <Image
                  src={imageSrc(item.product.images[0] || "/products/fallback.jpg")}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <Link
                  href={`/product/${item.product.slug}`}
                  className="font-body-lg text-black font-semibold hover:text-gold transition-colors line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <p className="font-label-md text-black font-bold mt-1">
                  {formatCurrency(item.product.price)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-black/20 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-3.5 py-2 text-black/70 hover:bg-black/5 transition-colors font-bold min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 font-semibold text-sm min-w-[32px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-3.5 py-2 text-black/70 hover:bg-black/5 transition-colors font-bold min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-700 hover:text-red-900 p-2.5 hover:bg-red-50 transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="bg-white border border-black/10 p-6 h-fit space-y-6">
          <h2 className="font-headline-md text-xl border-b border-black/10 pb-4 text-black">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-black/70">
              <span>Subtotal</span>
              <span className="font-semibold text-black">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-black/70">
              <span>Shop pickup</span>
              <span className="text-green-700 font-semibold">Free</span>
            </div>
          </div>

          <div className="border-t border-black/10 pt-4 flex justify-between font-label-md text-lg">
            <span className="font-bold">Total</span>
            <span className="text-black font-bold">{formatCurrency(subtotal)}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full bg-gold text-white text-center font-label-md py-4 hover:bg-black transition-colors duration-300 font-semibold uppercase tracking-wider text-sm"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>

      {renderRecommendationsStrip()}
    </div>
  );
}
