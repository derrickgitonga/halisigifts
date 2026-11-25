"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { imageSrc } from "@/lib/shopper-lists";
import { formatCurrency } from "@/lib/utils";

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

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
        const total = data.items.reduce((acc: number, it: { quantity: number }) => acc + it.quantity, 0);
        window.dispatchEvent(new CustomEvent("cart-count-updated", { detail: { count: total } }));
      }
    } catch {
      // Ignore
    }
  }, []);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    setLoading(true);
    fetchCart().finally(() => setLoading(false));
  }, [fetchCart]);

  const closeDrawer = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOpen = () => openDrawer();
    const handleUpdate = () => fetchCart();

    window.addEventListener("open-cart-drawer", handleOpen);
    window.addEventListener("cart-updated", handleUpdate);

    // Initial cart load (state is only set after the request resolves)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();

    return () => {
      window.removeEventListener("open-cart-drawer", handleOpen);
      window.removeEventListener("cart-updated", handleUpdate);
    };
  }, [openDrawer, fetchCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleRemoveItem = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      const res = await fetch(`/api/cart?id=${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((it) => it.id !== itemId));
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch {
      // Ignore
    } finally {
      setDeletingId(null);
    }
  };

  const totalItemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = items.reduce((acc, it) => acc + Number(it.product.price) * it.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-screen sm:h-full max-h-[100dvh] w-full sm:w-[420px] max-w-full bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/10">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-black">shopping_bag</span>
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-gold/40">
                {totalItemCount}
              </span>
            </div>
            <h2 className="font-display-lg text-lg text-black tracking-tight">Your Cart</h2>
          </div>

          <button
            onClick={closeDrawer}
            className="p-2 text-black/60 hover:text-black hover:bg-black/5 rounded-full transition-colors flex items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label="Close Cart"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-black/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-black/50 gap-3">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-label-md">Loading your cart...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-black/20 mb-3">production_quantity_limits</span>
              <h3 className="font-display-lg text-base text-black mb-1">Your cart is empty</h3>
              <p className="text-xs text-black/60 mb-6 max-w-[240px]">
                Explore our catalog to find luxury timepieces, fragrances, and fine gifts.
              </p>
              <button
                onClick={closeDrawer}
                className="bg-black text-white text-xs font-label-md uppercase tracking-wider px-6 py-3 hover:bg-gold transition-colors font-semibold"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => {
              const itemTotal = Number(item.product.price) * item.quantity;
              const isDeleting = deletingId === item.id;
              return (
                <div key={item.id} className={`py-4 flex gap-3 transition-opacity ${isDeleting ? "opacity-40" : "opacity-100"}`}>
                  <div className="w-20 h-20 bg-black/5 overflow-hidden relative flex-shrink-0 border border-black/10">
                    <Image
                      src={imageSrc(item.product.images[0] || "/products/fallback.jpg")}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.product.slug}`}
                        onClick={closeDrawer}
                        className="font-body-md text-sm font-semibold text-black hover:text-gold transition-colors line-clamp-2 leading-snug"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isDeleting}
                        className="text-black/40 hover:text-red-600 p-2 transition-colors flex items-center justify-center hover:bg-red-50 min-w-[36px] min-h-[36px]"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>

                    <div className="text-xs text-black/70 font-label-md mt-1">
                      <span className="font-semibold text-black">
                        {item.quantity} × {formatCurrency(Number(item.product.price))}
                      </span>
                      <span className="text-black font-bold ml-1.5">
                        = {formatCurrency(itemTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-black/10 bg-black/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-black">Subtotal:</span>
              <span className="text-lg font-bold text-black font-label-md">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <p className="text-[11px] text-black/60 leading-tight text-center">
              Shipping and discounts calculated at checkout.
            </p>

            <div className="space-y-2 pt-2">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="w-full block text-center bg-black text-white text-xs font-label-md uppercase tracking-wider py-3 hover:bg-gold transition-colors font-semibold"
              >
                View Cart
              </Link>

              <button
                onClick={closeDrawer}
                className="w-full block text-center bg-black/5 hover:bg-black/10 text-black text-xs font-label-md uppercase tracking-wider py-3 transition-colors font-semibold"
              >
                Continue Shopping
              </button>

              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="w-full block text-center bg-gold text-white text-xs font-label-md uppercase tracking-wider py-3.5 hover:bg-black transition-colors font-bold shadow-md"
              >
                Checkout - {formatCurrency(subtotal)}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
