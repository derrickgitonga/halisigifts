import { prisma } from "@/lib/prisma";
import catalogDump from "@/data/catalog_dump.json";
import { extractBrand } from "@/lib/recommendations";

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  categoryId: string;
  inStock: boolean;
  stock: number;
  brand: string | null;
  hasVariants: boolean;
  isNew: boolean;
  createdAt: string;
}

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ShopCatalog {
  products: ShopProduct[];
  categories: ShopCategory[];
}

export type RawProduct = {
  id: string;
  name: string;
  slug: string;
  price: unknown;
  compareAtPrice: unknown;
  images: string[];
  categoryId: string;
  stock: number;
  isNew: boolean;
  isActive?: boolean;
  createdAt: Date | string;
  variants?: unknown[];
  _count?: { variants: number };
};

/** Brand names come back upper-case from extractBrand; show them in title case. */
function brandLabel(name: string): string | null {
  const raw = extractBrand(name);
  if (!raw) return null;
  const clean = raw.replace(/[^\p{L}\p{N}&' -]/gu, "").trim();
  if (clean.length < 2) return null;
  return clean
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

export function toShopProduct(p: RawProduct): ShopProduct {
  const compare = p.compareAtPrice != null ? Number(p.compareAtPrice) : null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    compareAtPrice: compare && compare > Number(p.price) ? compare : null,
    image: p.images?.[0] ?? null,
    categoryId: p.categoryId,
    inStock: p.stock > 0,
    stock: p.stock,
    brand: brandLabel(p.name),
    hasVariants: (p._count?.variants ?? p.variants?.length ?? 0) > 0,
    isNew: Boolean(p.isNew),
    createdAt: new Date(p.createdAt).toISOString(),
  };
}

/** Keep only categories that actually contain products. */
function withProducts(categories: ShopCategory[], products: ShopProduct[]) {
  const used = new Set(products.map((p) => p.categoryId));
  return categories.filter((c) => used.has(c.id));
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles and rotates products every `windowHours` (default 3h)
 * in non-overlapping `pageSize` slices so every product appears on the homepage
 * first page before any product repeats in the same cycle.
 */
export function rotateCatalogForWindow(
  products: ShopProduct[],
  nowMs: number = Date.now(),
  windowHours: number = 3,
  pageSize: number = 12
): ShopProduct[] {
  const n = products.length;
  if (n <= 1) return products;

  const windowMs = windowHours * 60 * 60 * 1000;
  const slot = Math.floor(nowMs / windowMs);
  const totalPages = Math.max(1, Math.ceil(n / pageSize));
  const cycle = Math.floor(slot / totalPages);
  const pageIndex = slot % totalPages;

  // Deterministic base order (sorted by id) so the cycle permutation stays stable
  const shuffled = [...products].sort((a, b) => a.id.localeCompare(b.id));
  const rand = mulberry32((cycle + 1) * 2654435761);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const offset = (pageIndex * pageSize) % n;
  return [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
}

/**
 * Loads every active product for the homepage shop grid.
 * Falls back to the last catalogue export (data/catalog_dump.json)
 * when the database is unreachable, so the storefront is never empty.
 */
export async function getShopCatalog(): Promise<ShopCatalog> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB_OFFLINE_OR_TIMEOUT")), 1500)
    );
    const query = Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          images: true,
          categoryId: true,
          stock: true,
          isNew: true,
          createdAt: true,
          _count: { select: { variants: true } },
        },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
    ]);
    const [rawProducts, categories] = await Promise.race([query, timeout]);
    const products = rawProducts.map(toShopProduct);
    return { products, categories: withProducts(categories, products) };
  } catch {
    const products = (catalogDump.products as unknown as RawProduct[])
      .filter((p) => p.isActive !== false)
      .map(toShopProduct)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const categories = (catalogDump.categories as ShopCategory[])
      .map(({ id, name, slug }) => ({ id, name, slug }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { products, categories: withProducts(categories, products) };
  }
}

type DumpProduct = (typeof catalogDump.products)[number];

/**
 * Offline fallback for the product page: find a product in the last
 * catalogue export by slug or id, shaped like the Prisma query result.
 */
export function findDumpProduct(slugOrId: string) {
  const key = decodeURIComponent(slugOrId).trim().toLowerCase();
  const p = (catalogDump.products as DumpProduct[]).find(
    (x) => x.isActive !== false && (x.slug.toLowerCase() === key || x.id === slugOrId)
  );
  if (!p) return null;
  const category = catalogDump.categories.find((c) => c.id === p.categoryId);
  return {
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    priceMin: p.priceMin != null ? Number(p.priceMin) : null,
    priceMax: p.priceMax != null ? Number(p.priceMax) : null,
    category: { name: category?.name ?? "Products", slug: category?.slug ?? "" },
    variants: (p.variants ?? []).map((v: Record<string, unknown>) => ({
      id: String(v.id),
      name: String(v.name),
      image: (v.image as string | null) ?? null,
      priceModifier: Number(v.priceModifier ?? 0),
      sku: (v.sku as string | null) ?? null,
      stock: Number(v.stock ?? 0),
    })),
    reviews: [] as unknown[],
  };
}

/* ---------------- Category pages ---------------- */

const DIGITAL_KEYWORDS = ["dual time", "worldtime", "world time", "azan", "digital", "illuminator", "led", "world-time"];

/** Virtual collections that span several real categories. */
const COLLECTIONS: Record<string, { name: string; description: string; slugs: string[] }> = {
  "watches-men": {
    name: "Men's Watches",
    description: "Explore all men's luxury analogue and digital timepieces.",
    slugs: ["watches-men", "watches-men-analogue", "watches-men-digital", "mens-watches"],
  },
  "watches-ladies": {
    name: "Ladies' Watches",
    description: "Explore all ladies' elegant analogue and digital timepieces.",
    slugs: ["watches-ladies", "watches-ladies-analogue", "watches-ladies-digital", "ladies-watches"],
  },
  "analogue-watches": {
    name: "Analogue Watches",
    description: "Classic analogue timepieces for men and women.",
    slugs: [
      "watches-men-analogue",
      "watches-ladies-analogue",
      "watches-couple-sets",
      "watches-men",
      "watches-ladies",
      "analogue-watches",
    ],
  },
  "digital-watches": {
    name: "Digital Watches",
    description: "Digital, dual-time and world-time watches.",
    slugs: ["watches-men-digital", "watches-ladies-digital", "digital-watches"],
  },
  "gifts-accessories": {
    name: "Gifts & Accessories",
    description: "Gift sets, fragrances, jewellery and accessories ready to give.",
    slugs: [
      "valentines-gift-sets",
      "mothers-day-gift-sets",
      "perfumes-fragrances",
      "jewellery",
      "accessories-gift-boxes",
      "gifts-accessories",
      "gift-packs-sets",
      "jewellery-accessories",
      "bags-purses",
      "watch-care-display",
    ],
  },
};
COLLECTIONS["mens-watches"] = COLLECTIONS["watches-men"];
COLLECTIONS["ladies-watches"] = COLLECTIONS["watches-ladies"];

const isDigital = (name: string) => {
  const lower = name.toLowerCase();
  return DIGITAL_KEYWORDS.some((kw) => lower.includes(kw));
};

export interface CategoryListing extends ShopCatalog {
  /** null when the slug matches neither a real category nor a collection */
  title: string | null;
  description: string | null;
}

/**
 * Products for a /category/[slug] page, applying the same collection rules
 * the page has always used (e.g. analogue vs digital by product name).
 */
export function filterCatalogForCategory(
  catalog: ShopCatalog,
  slug: string,
  realCategory?: { name: string; description?: string | null } | null
): CategoryListing {
  const slugById = Object.fromEntries(catalog.categories.map((c) => [c.id, c.slug]));
  const catSlug = (p: ShopProduct) => slugById[p.categoryId] ?? "";
  const collection = COLLECTIONS[slug];

  let products: ShopProduct[];
  if (slug === "digital-watches") {
    products = catalog.products.filter(
      (p) =>
        catSlug(p) !== "smart-watches" &&
        (collection.slugs.includes(catSlug(p)) || isDigital(p.name))
    );
  } else if (slug === "analogue-watches") {
    products = catalog.products.filter(
      (p) => collection.slugs.includes(catSlug(p)) && !isDigital(p.name)
    );
  } else if (collection) {
    products = catalog.products.filter((p) => collection.slugs.includes(catSlug(p)));
  } else {
    products = catalog.products.filter((p) => catSlug(p) === slug);
  }

  const dumpCategory = catalogDump.categories.find((c) => c.slug === slug);
  const title = realCategory?.name ?? collection?.name ?? dumpCategory?.name ?? null;
  const description =
    realCategory?.description ?? collection?.description ?? dumpCategory?.description ?? null;

  return { products, categories: withProducts(catalog.categories, products), title, description };
}
