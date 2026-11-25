"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import ProductCard from "@/components/product/ProductCard";
import OutOfStockNotice from "@/components/product/OutOfStockNotice";
import type { ShopCatalog } from "@/lib/home-catalog";

const PAGE_SIZE = 12;
const BRANDS_COLLAPSED = 8;

type SortKey = "default" | "newest" | "price-asc" | "price-desc" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  default: "Featured",
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name: A–Z",
};

/* ---------------- small UI pieces ---------------- */

function Checkbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer group">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span
          className="w-4 h-4 border border-black/20 flex items-center justify-center transition-colors peer-checked:bg-gold peer-checked:border-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold/40"
          aria-hidden
        >
          {checked && (
            <svg
              viewBox="0 0 12 12"
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2.5 6.5l2.5 2.5 4.5-5" />
            </svg>
          )}
        </span>
        <span className="text-sm text-black/75 group-hover:text-black transition-colors">
          {label}
        </span>
      </span>
      {count !== undefined && (
        <span className="text-xs text-black/45 tabular-nums">{count}</span>
      )}
    </label>
  );
}

function FilterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-black mb-3">
      {children}
    </h3>
  );
}

/* ---------------- URL <-> filter state ---------------- */

interface FilterState {
  query: string;
  cats: string[]; // category slugs
  brands: string[];
  min: number;
  max: number;
  inStock: boolean;
  outOfStock: boolean;
  onSale: boolean;
  sort: SortKey;
}

function readUrl(priceCeiling: number): Partial<FilterState> {
  const sp = new URLSearchParams(window.location.search);
  const list = (k: string) =>
    (sp.get(k) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const num = (k: string) => {
    const n = Number(sp.get(k));
    return Number.isFinite(n) && sp.get(k) !== null ? n : undefined;
  };
  const sort = sp.get("sort") as SortKey | null;
  const stock = list("stock");
  return {
    query: sp.get("q") || "",
    cats: list("cat"),
    brands: list("brand"),
    min: Math.max(0, num("min") ?? num("minPrice") ?? 0),
    max: Math.min(priceCeiling, num("max") ?? num("maxPrice") ?? priceCeiling),
    inStock: stock.includes("in"),
    outOfStock: stock.includes("out"),
    onSale: sp.get("sale") === "1",
    sort: sort && sort in SORT_LABELS ? sort : "default",
  };
}

function writeUrl(s: FilterState, priceCeiling: number) {
  const sp = new URLSearchParams(window.location.search);
  const set = (k: string, v: string | null) =>
    v ? sp.set(k, v) : sp.delete(k);
  set("q", s.query.trim() || null);
  set("cat", s.cats.join(",") || null);
  set("brand", s.brands.join(",") || null);
  set("min", s.min > 0 ? String(s.min) : null);
  set("max", s.max < priceCeiling ? String(s.max) : null);
  set(
    "stock",
    [s.inStock && "in", s.outOfStock && "out"].filter(Boolean).join(",") ||
      null,
  );
  set("sale", s.onSale ? "1" : null);
  set("sort", s.sort !== "default" ? s.sort : null);
  sp.delete("minPrice");
  sp.delete("maxPrice");
  const qs = sp.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  if (
    url !==
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  ) {
    window.history.replaceState(window.history.state, "", url);
  }
}

/* ---------------- main component ---------------- */

export default function ShopCatalog({ products, categories }: ShopCatalog) {
  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(0, ...products.map((p) => p.price)) / 500) * 500,
    [products],
  );

  const [query, setQuery] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(priceCeiling);
  const [stock, setStock] = useState<{ in: boolean; out: boolean }>({
    in: false,
    out: false,
  });
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("default");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const hydrated = useRef(false);

  // Restore filters from the URL once on load (shareable links)
  // (Runs after hydration so server and client render the same initial HTML.)
  useEffect(() => {
    const restore = () => {
      const s = readUrl(priceCeiling);
      const validCats = new Set(categories.map((c) => c.slug));
      setQuery(s.query ?? "");
      setSelectedCats((s.cats ?? []).filter((c) => validCats.has(c)));
      setSelectedBrands(s.brands ?? []);
      setMinPrice(s.min ?? 0);
      setMaxPrice(s.max ?? priceCeiling);
      setStock({ in: !!s.inStock, out: !!s.outOfStock });
      setOnSaleOnly(!!s.onSale);
      setSort(s.sort ?? "default");
      hydrated.current = true;
    };
    restore();
  }, [priceCeiling, categories]);

  // Keep the URL in sync as filters change
  useEffect(() => {
    if (!hydrated.current) return;
    writeUrl(
      {
        query,
        cats: selectedCats,
        brands: selectedBrands,
        min: minPrice,
        max: maxPrice,
        inStock: stock.in,
        outOfStock: stock.out,
        onSale: onSaleOnly,
        sort,
      },
      priceCeiling,
    );
  }, [
    query,
    selectedCats,
    selectedBrands,
    minPrice,
    maxPrice,
    stock,
    onSaleOnly,
    sort,
    priceCeiling,
  ]);

  const resetPaging = () => setVisible(PAGE_SIZE);

  const catIdBySlug = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c.id])),
    [categories],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products)
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    return counts;
  }, [products]);

  // Brands that appear on 2+ products, most common first
  const brands = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products)
      if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1;
    return Object.entries(counts)
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  const inStockCount = useMemo(
    () => products.filter((p) => p.inStock).length,
    [products],
  );
  const onSaleCount = useMemo(
    () => products.filter((p) => p.compareAtPrice).length,
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const catIds = selectedCats.map((s) => catIdBySlug[s]).filter(Boolean);
    const list = products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (catIds.length && !catIds.includes(p.categoryId)) return false;
      if (
        selectedBrands.length &&
        (!p.brand || !selectedBrands.includes(p.brand))
      )
        return false;
      if (p.price < minPrice || p.price > maxPrice) return false;
      if (stock.in !== stock.out) {
        if (stock.in && !p.inStock) return false;
        if (stock.out && p.inStock) return false;
      }
      if (onSaleOnly && !p.compareAtPrice) return false;
      return true;
    });
    switch (sort) {
      case "newest":
        return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [
    products,
    query,
    selectedCats,
    selectedBrands,
    catIdBySlug,
    minPrice,
    maxPrice,
    stock,
    onSaleOnly,
    sort,
  ]);

  // When nothing shows: how many items match the search/filters but are sold out?
  const soldOutMatches = useMemo(() => {
    if (filtered.length > 0) return 0;
    const q = query.trim().toLowerCase();
    const catIds = selectedCats.map((s) => catIdBySlug[s]).filter(Boolean);
    return products.filter(
      (p) =>
        !p.inStock &&
        (!q || p.name.toLowerCase().includes(q)) &&
        (!catIds.length || catIds.includes(p.categoryId)) &&
        (!selectedBrands.length || (p.brand && selectedBrands.includes(p.brand))) &&
        p.price >= minPrice &&
        p.price <= maxPrice &&
        (!onSaleOnly || p.compareAtPrice)
    ).length;
  }, [filtered.length, products, query, selectedCats, catIdBySlug, selectedBrands, minPrice, maxPrice, onSaleOnly]);

  const shown = filtered.slice(0, visible);
  const activeFilterCount =
    (query ? 1 : 0) +
    selectedCats.length +
    selectedBrands.length +
    (minPrice > 0 || maxPrice < priceCeiling ? 1 : 0) +
    (stock.in ? 1 : 0) +
    (stock.out ? 1 : 0) +
    (onSaleOnly ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setSelectedCats([]);
    setSelectedBrands([]);
    setMinPrice(0);
    setMaxPrice(priceCeiling);
    setStock({ in: false, out: false });
    setOnSaleOnly(false);
    resetPaging();
  };

  const toggleIn = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setter((cur) =>
      cur.includes(value) ? cur.filter((c) => c !== value) : [...cur, value],
    );
    resetPaging();
  };

  const visibleBrands = showAllBrands
    ? brands
    : brands.slice(0, BRANDS_COLLAPSED);

  const sidebar = (
    <div className="space-y-9">
      {/* Search */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            resetPaging();
          }}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full border border-black/15 bg-white pl-4 pr-10 py-3 text-base md:text-sm placeholder:text-black/40 focus:outline-none focus:border-gold"
        />
        <span
          className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-black/40 text-[20px]"
          aria-hidden
        >
          search
        </span>
      </div>

      {/* Categories (hidden when the list only spans one category) */}
      {categories.length > 1 && (
      <div>
        <FilterHeading>Categories</FilterHeading>
        <Checkbox
          checked={selectedCats.length === 0}
          onChange={() => {
            setSelectedCats([]);
            resetPaging();
          }}
          label="All categories"
          count={products.length}
        />
        {categories.map((c) => (
          <Checkbox
            key={c.id}
            checked={selectedCats.includes(c.slug)}
            onChange={() => toggleIn(setSelectedCats, c.slug)}
            label={c.name}
            count={categoryCounts[c.id] || 0}
          />
        ))}
      </div>
      )}

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <FilterHeading>Brand</FilterHeading>
          {visibleBrands.map((b) => (
            <Checkbox
              key={b.name}
              checked={selectedBrands.includes(b.name)}
              onChange={() => toggleIn(setSelectedBrands, b.name)}
              label={b.name}
              count={b.count}
            />
          ))}
          {brands.length > BRANDS_COLLAPSED && (
            <button
              type="button"
              onClick={() => setShowAllBrands((v) => !v)}
              className="mt-2 text-xs font-semibold text-gold hover:underline underline-offset-4"
            >
              {showAllBrands
                ? "Show fewer"
                : `Show all ${brands.length} brands`}
            </button>
          )}
        </div>
      )}

      {/* Price */}
      <div>
        <FilterHeading>Price</FilterHeading>
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">Minimum price</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={maxPrice}
              step={100}
              value={minPrice}
              onChange={(e) => {
                setMinPrice(Math.max(0, Number(e.target.value) || 0));
                resetPaging();
              }}
              className="w-full border border-black/15 bg-white px-3 py-2 text-base md:text-sm tabular-nums focus:outline-none focus:border-gold"
            />
          </label>
          <span className="text-black/40 text-sm">–</span>
          <label className="flex-1">
            <span className="sr-only">Maximum price</span>
            <input
              type="number"
              inputMode="numeric"
              min={minPrice}
              max={priceCeiling}
              step={100}
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value) || priceCeiling);
                resetPaging();
              }}
              className="w-full border border-black/15 bg-white px-3 py-2 text-base md:text-sm tabular-nums focus:outline-none focus:border-gold"
            />
          </label>
        </div>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={100}
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(Math.max(minPrice, Number(e.target.value)));
            resetPaging();
          }}
          aria-label="Maximum price"
          className="w-full mt-4 accent-[#266e00]"
        />
        <p className="text-sm text-black/60 mt-2">
          Range:{" "}
          <span className="font-semibold text-black">
            {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
          </span>
        </p>
      </div>

      {/* Availability */}
      <div>
        <FilterHeading>Availability</FilterHeading>
        <Checkbox
          checked={stock.in}
          onChange={() => {
            setStock((s) => ({ ...s, in: !s.in }));
            resetPaging();
          }}
          label="In stock"
          count={inStockCount}
        />
        <Checkbox
          checked={stock.out}
          onChange={() => {
            setStock((s) => ({ ...s, out: !s.out }));
            resetPaging();
          }}
          label="Out of stock"
          count={products.length - inStockCount}
        />
        <Checkbox
          checked={onSaleOnly}
          onChange={() => {
            setOnSaleOnly((v) => !v);
            resetPaging();
          }}
          label="On offer"
          count={onSaleCount}
        />
      </div>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs uppercase tracking-[0.15em] font-semibold text-black/60 hover:text-gold underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <section
      id="shop"
      className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16 scroll-mt-24"
    >
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block">{sidebar}</aside>

        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <p className="text-sm text-black/70">
              {filtered.length === 0
                ? "0 results"
                : `Showing 1–${shown.length} of ${filtered.length} results`}
            </p>
            <div className="flex items-center gap-2 max-w-full">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                className="lg:hidden inline-flex items-center gap-1.5 border border-black/15 bg-white px-3 py-2 text-sm shrink-0"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  aria-hidden
                >
                  tune
                </span>
                Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
              <label className="relative min-w-0">
                <span className="sr-only">Sort products</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="appearance-none border border-black/15 bg-white pl-3 pr-9 py-2 text-base md:text-sm focus:outline-none focus:border-gold cursor-pointer max-w-full"
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABELS[k]}
                    </option>
                  ))}
                </select>
                <span
                  className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-black/60"
                  aria-hidden
                >
                  expand_more
                </span>
              </label>
            </div>
          </div>

          {/* Sidebar — mobile, collapsible */}
          {filtersOpen && (
            <div className="lg:hidden mb-8 border border-black/10 bg-white p-5">
              {sidebar}
            </div>
          )}

          {/* Grid */}
          {filtered.length === 0 ? (
            <OutOfStockNotice
              message={
                soldOutMatches > 0
                  ? `${soldOutMatches} ${soldOutMatches === 1 ? "item matches" : "items match"}, but ${
                      soldOutMatches === 1 ? "it's" : "they're"
                    } sold out right now. We restock often. Message us and we'll reserve one for you.`
                  : "We don't have anything matching these filters in stock right now. Tell us what you're looking for and we'll check our next delivery."
              }
              whatsappText={`Hi Halisi Gifts, I'm looking for${
                query.trim() ? ` "${query.trim()}"` : ""
              }${selectedBrands.length ? ` (${selectedBrands.join(", ")})` : ""} but it shows out of stock on your website. When will it be available?`}
              onClear={activeFilterCount > 0 ? clearAll : undefined}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
              {shown.map((p, index) => (
                <ProductCard key={p.id} product={p} priority={index < 4} />
              ))}
            </div>
          )}

          {visible < filtered.length && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="w-48 h-[2px] bg-black/10">
                <div
                  className="h-full bg-gold transition-all"
                  style={{
                    width: `${(shown.length / filtered.length) * 100}%`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="border border-black text-black text-xs uppercase tracking-[0.15em] font-semibold px-8 py-3.5 hover:bg-black hover:text-white transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
