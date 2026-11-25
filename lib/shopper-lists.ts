"use client";

/**
 * Browser-only shopper lists (wishlist + recently viewed).
 * Stored in localStorage so they work for guests without accounts.
 */

import { useEffect, useState, useCallback } from "react";

export interface SavedProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

const WISHLIST_KEY = "halisi:wishlist";
const RECENT_KEY = "halisi:recently-viewed";
const RECENT_LIMIT = 12;
const CHANGE_EVENT = "halisi-lists-updated";

function read(key: string): SavedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(key: string, items: SavedProduct[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // storage full or blocked — lists are a nice-to-have
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

function useList(key: string) {
  const [items, setItems] = useState<SavedProduct[]>([]);

  useEffect(() => {
    const sync = () => setItems(read(key));
    sync();
    const onStorage = (e: StorageEvent) => e.key === key && sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  return items;
}

/* ---------- Wishlist ---------- */

export function useWishlist() {
  const items = useList(WISHLIST_KEY);

  const has = useCallback((id: string) => items.some((p) => p.id === id), [items]);

  const toggle = useCallback((product: SavedProduct) => {
    const current = read(WISHLIST_KEY);
    const exists = current.some((p) => p.id === product.id);
    write(
      WISHLIST_KEY,
      exists ? current.filter((p) => p.id !== product.id) : [product, ...current]
    );
  }, []);

  const remove = useCallback((id: string) => {
    write(WISHLIST_KEY, read(WISHLIST_KEY).filter((p) => p.id !== id));
  }, []);

  return { items, has, toggle, remove };
}

/* ---------- Recently viewed ---------- */

export function recordRecentlyViewed(product: SavedProduct) {
  const rest = read(RECENT_KEY).filter((p) => p.id !== product.id);
  write(RECENT_KEY, [product, ...rest].slice(0, RECENT_LIMIT));
}

export function useRecentlyViewed() {
  return useList(RECENT_KEY);
}

/* ---------- Shared ---------- */

/** Encode each path segment so filenames with spaces, # or () resolve. */
export function imageSrc(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return path
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(decodeURIComponent(seg)) : seg))
    .join("/");
}
