import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface RecommendedProduct {
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

const KNOWN_BRANDS = [
  "MICHAEL KORS",
  "MK",
  "DANIEL WELLINGTON",
  "DW",
  "OPK",
  "PRO 9",
  "D18",
  "CURREN",
  "WWOOR",
  "GEDI",
  "NAVIFORCE",
  "CASIO",
  "CITIZEN",
  "ORUSS",
  "CRRJU",
  "CHAXIGO",
  "TISSOT",
  "PATEK PHILIPPE",
  "PATEK",
  "FOSSIL",
  "ROLEX",
  "SABR",
  "MEGIR",
  "HUBLOT",
  "AUDEMARS PIGUET",
  "CARTIER",
  "OLEVS",
  "LIGE",
  "POEDAGAR",
  "OCHSTIN",
  "SKMEI",
  "FOXBOX",
  "ZEPPELIN",
  "COLMI",
  "DOUFIT",
  "GENEVA",
  "ZEAL",
  "MINIFOCUS",
  "BENYAR",
  "BINBOND",
  "BOBO BIRD",
  "HANNAH MARTIN",
  "LATTAFA",
  "ASAD",
  "YARA",
  "KHAMRAH",
  "FAKHAR",
  "ARMAF",
  "CLUB DE NUIT",
  "AFNAN",
  "GISSAH",
  "KHADLAJ",
  "HARAMAIN",
  "AMBER OUD",
  "LAVERNE",
  "AZZARO",
  "HAWAS",
  "AMEERAT AL ARAB",
  "FRENCH AVENUE",
  "AL WATANIAH",
];

export function extractBrand(productName: string): string | null {
  const upper = productName.toUpperCase();
  for (const brand of KNOWN_BRANDS) {
    const regex = new RegExp(`\\b${brand}\\b`, "i");
    if (regex.test(upper)) {
      return brand;
    }
  }

  // Fallback: take the first word if it looks like a brand name
  const firstWord = productName.trim().split(/\s+/)[0];
  if (firstWord && firstWord.length > 2 && !["THE", "FOR", "SET", "MEN", "LADIES", "NEW", "VERY"].includes(firstWord.toUpperCase())) {
    return firstWord;
  }

  return null;
}

const WATCH_CATEGORY_SLUGS = [
  "watches-men",
  "watches-ladies",
  "watches-couple-sets",
  "smart-watches",
  "analogue-watches",
  "digital-watches",
  "mens-watches",
  "ladies-watches",
  "couple-unisex-watch-sets",
];

const GIFT_SET_SLUGS = [
  "valentines-gift-sets",
  "mothers-day-gift-sets",
  "gift-packs-sets",
  "gifts-accessories",
];

async function fetchRelatedProductsUncached(
  productId: string,
  limit: number = 4
): Promise<RecommendedProduct[]> {
  try {
    const current = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!current) {
      return [];
    }

    const currentPrice = Number(current.price);
    const minPriceBand = Math.max(0, currentPrice * 0.7);
    const maxPriceBand = currentPrice * 1.3;
    const currentBrand = extractBrand(current.name);

    const collectedMap = new Map<string, RecommendedProduct>();

    function addProducts(products: any[]) {
      for (const p of products) {
        if (p.id !== productId && p.isActive && !collectedMap.has(p.id)) {
          collectedMap.set(p.id, {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            images: p.images,
            category: p.category ? { name: p.category.name, slug: p.category.slug } : undefined,
          });
          if (collectedMap.size >= limit) return true;
        }
      }
      return false;
    }

    // Priority 1: Same category + similar price band (±30%)
    const p1 = await prisma.product.findMany({
      where: {
        categoryId: current.categoryId,
        isActive: true,
        id: { not: productId },
        price: { gte: minPriceBand, lte: maxPriceBand },
      },
      include: { category: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    if (addProducts(p1)) return Array.from(collectedMap.values()).slice(0, limit);

    // Priority 2: Same brand/product family
    if (currentBrand) {
      const p2 = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { not: productId },
          name: { contains: currentBrand, mode: "insensitive" },
        },
        include: { category: true },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      if (addProducts(p2)) return Array.from(collectedMap.values()).slice(0, limit);
    }

    // Priority 3: Same category, any price
    const p3 = await prisma.product.findMany({
      where: {
        categoryId: current.categoryId,
        isActive: true,
        id: { not: productId },
      },
      include: { category: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    if (addProducts(p3)) return Array.from(collectedMap.values()).slice(0, limit);

    // Priority 4: Same broader taxonomy group
    let broaderSlugs: string[] = [];
    if (WATCH_CATEGORY_SLUGS.includes(current.category.slug)) {
      broaderSlugs = WATCH_CATEGORY_SLUGS;
    } else if (GIFT_SET_SLUGS.includes(current.category.slug)) {
      broaderSlugs = GIFT_SET_SLUGS;
    }

    if (broaderSlugs.length > 0) {
      const p4 = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { not: productId },
          category: { slug: { in: broaderSlugs } },
        },
        include: { category: true },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      if (addProducts(p4)) return Array.from(collectedMap.values()).slice(0, limit);
    }

    // Priority 5: Featured active products
    const p5 = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        isFeatured: true,
      },
      include: { category: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    addProducts(p5);

    return Array.from(collectedMap.values()).slice(0, limit);
  } catch {
    return [];
  }
}

export const getRelatedProducts = (productId: string, limit: number = 4) =>
  unstable_cache(
    async () => fetchRelatedProductsUncached(productId, limit),
    [`related-products-${productId}-${limit}`],
    { revalidate: 300, tags: ["products"] }
  )();

export interface SearchResultPayload {
  query: string;
  exactMatches: RecommendedProduct[];
  fallbackMatches: RecommendedProduct[];
  isFallback: boolean;
  total: number;
}

export function resolveCategorySlugsFromQuery(query: string): string[] {
  const q = query.trim().toLowerCase();

  // 1. Smart Watches
  if (q.includes("smart") || q.includes("fitness")) {
    return ["smart-watches"];
  }

  // 2. Digital Watches
  if (q.includes("digital") || q.includes("electronic")) {
    return ["digital-watches"];
  }

  // 3. Men's Watches
  if (
    q.includes("men") ||
    q.includes("mens") ||
    q.includes("men's") ||
    q.includes("gent") ||
    q.includes("gents") ||
    q.includes("male")
  ) {
    return ["watches-men", "mens-watches"];
  }

  // 4. Ladies' Watches
  if (
    q.includes("ladies") ||
    q.includes("ladies'") ||
    q.includes("women") ||
    q.includes("womens") ||
    q.includes("women's") ||
    q.includes("female")
  ) {
    return ["watches-ladies", "ladies-watches"];
  }

  // 5. Couple / Unisex Watch Sets
  if (
    q.includes("couple") ||
    q.includes("couples") ||
    q.includes("unisex") ||
    q.includes("matching") ||
    q.includes("pair") ||
    q.includes("pairs")
  ) {
    return ["watches-couple-sets", "couple-unisex-watch-sets"];
  }

  // 6. Analogue Watches / General Watches
  if (
    q.includes("analogue") ||
    q.includes("analog") ||
    q.includes("classic") ||
    q.includes("watch") ||
    q.includes("timepiece")
  ) {
    return [
      "watches-men",
      "watches-ladies",
      "watches-couple-sets",
      "analogue-watches",
      "mens-watches",
      "ladies-watches",
      "couple-unisex-watch-sets",
    ];
  }

  // 7. Perfumes & Fragrances
  if (
    q.includes("perfume") ||
    q.includes("fragrance") ||
    q.includes("oud") ||
    q.includes("cologne") ||
    q.includes("scent") ||
    q.includes("arabian")
  ) {
    return ["perfumes-fragrances"];
  }

  // 8. Fine Jewellery
  if (
    q.includes("jewel") ||
    q.includes("necklace") ||
    q.includes("bracelet") ||
    q.includes("earring") ||
    q.includes("ring") ||
    q.includes("chain") ||
    q.includes("pendant")
  ) {
    return ["jewellery", "jewellery-accessories"];
  }

  // 9. Gift Sets
  if (
    q.includes("gift") ||
    q.includes("valentin") ||
    q.includes("mother") ||
    q.includes("hamper") ||
    q.includes("pack") ||
    q.includes("present")
  ) {
    return [
      "valentines-gift-sets",
      "mothers-day-gift-sets",
      "gift-packs-sets",
      "gifts-accessories",
    ];
  }

  // 10. Accessories & Boxes
  if (q.includes("box") || q.includes("organizer") || q.includes("display")) {
    return ["accessories-gift-boxes", "watch-care-display"];
  }

  // 11. Bags & Purses
  if (q.includes("bag") || q.includes("purse") || q.includes("handbag")) {
    return ["bags-purses"];
  }

  return [];
}

async function fetchSmartSearchResultsUncached(
  query: string,
  limit: number = 200
): Promise<SearchResultPayload> {
  const trimmed = query.trim();
  if (!trimmed) {
    // If empty query, show top featured
    const featured = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { category: true },
      take: 24,
    });
    const mapped = featured.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      images: p.images,
      category: { name: p.category.name, slug: p.category.slug },
    }));
    return {
      query: "",
      exactMatches: [],
      fallbackMatches: mapped,
      isFallback: true,
      total: 0,
    };
  }

  // 1. Check if the query refers to a specific brand
  const detectedBrand = extractBrand(trimmed);

  // 2. If NO specific brand is searched, check for category intent
  if (!detectedBrand) {
    const categorySlugs = resolveCategorySlugsFromQuery(trimmed);
    if (categorySlugs.length > 0) {
      const categoryProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          category: { slug: { in: categorySlugs } },
        },
        include: { category: true },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      if (categoryProducts.length > 0) {
        const exactMatches: RecommendedProduct[] = categoryProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          images: p.images,
          category: { name: p.category.name, slug: p.category.slug },
        }));

        return {
          query: trimmed,
          exactMatches,
          fallbackMatches: [],
          isFallback: false,
          total: exactMatches.length,
        };
      }
    }
  }

  // 3. Brand or Keyword search across name, description, category
  const searchConditions: any[] = [
    { name: { contains: trimmed, mode: "insensitive" } },
    { description: { contains: trimmed, mode: "insensitive" } },
    { category: { name: { contains: trimmed, mode: "insensitive" } } },
  ];

  if (detectedBrand) {
    searchConditions.push({ name: { contains: detectedBrand, mode: "insensitive" } });
  }

  const exact = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: searchConditions,
    },
    include: { category: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const exactMatches: RecommendedProduct[] = exact.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    images: p.images,
    category: { name: p.category.name, slug: p.category.slug },
  }));

  const FALLBACK_THRESHOLD = 1;

  if (exactMatches.length >= FALLBACK_THRESHOLD) {
    return {
      query: trimmed,
      exactMatches,
      fallbackMatches: [],
      isFallback: false,
      total: exactMatches.length,
    };
  }

  // 4. Fallback when 0 matches
  const fallbackMap = new Map<string, RecommendedProduct>();
  const exactIds = new Set(exactMatches.map((m) => m.id));

  function addFallback(items: any[]) {
    for (const item of items) {
      if (!exactIds.has(item.id) && item.isActive && !fallbackMap.has(item.id)) {
        fallbackMap.set(item.id, {
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: Number(item.price),
          compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
          images: item.images,
          category: item.category ? { name: item.category.name, slug: item.category.slug } : undefined,
        });
        if (fallbackMap.size >= 12) return true;
      }
    }
    return false;
  }

  const categorySlugs = resolveCategorySlugsFromQuery(trimmed);
  if (categorySlugs.length > 0) {
    const catProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        category: { slug: { in: categorySlugs } },
      },
      include: { category: true },
      take: 12,
      orderBy: { createdAt: "desc" },
    });
    addFallback(catProducts);
  }

  if (fallbackMap.size < 12) {
    const featured = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [{ isFeatured: true }, { isHotDeal: true }],
      },
      include: { category: true },
      take: 12,
      orderBy: { createdAt: "desc" },
    });
    addFallback(featured);
  }

  const fallbackMatches = Array.from(fallbackMap.values()).slice(0, 12);

  return {
    query: trimmed,
    exactMatches,
    fallbackMatches,
    isFallback: true,
    total: exactMatches.length,
  };
}

export const getSmartSearchResults = (query: string, limit: number = 200) => {
  const normalizedKey = query.trim().toLowerCase();
  return unstable_cache(
    async () => fetchSmartSearchResultsUncached(query, limit),
    [`search-results-${normalizedKey}-${limit}`],
    { revalidate: 300, tags: ["products"] }
  )();
};

async function fetchCartRecommendationsUncached(
  cartProductIds: string[] = [],
  limit: number = 4
): Promise<RecommendedProduct[]> {
  try {
    const excludedIds = new Set(cartProductIds);
    const collectedMap = new Map<string, RecommendedProduct>();

    function addRecs(items: any[]) {
      for (const item of items) {
        if (!excludedIds.has(item.id) && item.isActive && !collectedMap.has(item.id)) {
          collectedMap.set(item.id, {
            id: item.id,
            name: item.name,
            slug: item.slug,
            price: Number(item.price),
            compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
            images: item.images,
            category: item.category ? { name: item.category.name, slug: item.category.slug } : undefined,
          });
          if (collectedMap.size >= limit) return true;
        }
      }
      return false;
    }

    if (cartProductIds.length > 0) {
      // Find what categories are currently in cart
      const cartProducts = await prisma.product.findMany({
        where: { id: { in: cartProductIds } },
        include: { category: true },
      });

      const inCartCatSlugs = new Set(cartProducts.map((p) => p.category.slug));
      const hasWatch = cartProducts.some((p) => WATCH_CATEGORY_SLUGS.includes(p.category.slug));
      const hasFragrance = inCartCatSlugs.has("perfumes-fragrances");
      const hasGiftSet = cartProducts.some((p) => GIFT_SET_SLUGS.includes(p.category.slug));

      // 1. If customer has a watch in cart, suggest watch presentation boxes or complementary perfumes
      if (hasWatch) {
        const boxAndPerfumes = await prisma.product.findMany({
          where: {
            isActive: true,
            id: { notIn: cartProductIds },
            category: { slug: { in: ["accessories-gift-boxes", "perfumes-fragrances"] } },
          },
          include: { category: true },
          take: limit,
          orderBy: { createdAt: "desc" },
        });
        if (addRecs(boxAndPerfumes)) return Array.from(collectedMap.values()).slice(0, limit);
      }

      // 2. If customer has perfume or gift set in cart, suggest luxury timepieces or jewellery
      if (hasFragrance || hasGiftSet) {
        const watchesAndJewels = await prisma.product.findMany({
          where: {
            isActive: true,
            id: { notIn: cartProductIds },
            category: { slug: { in: ["watches-men", "watches-ladies", "jewellery"] } },
          },
          include: { category: true },
          take: limit,
          orderBy: { createdAt: "desc" },
        });
        if (addRecs(watchesAndJewels)) return Array.from(collectedMap.values()).slice(0, limit);
      }
    }

    // 3. Fallback: top active featured / popular picks
    const fallback = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: cartProductIds },
        isFeatured: true,
      },
      include: { category: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    addRecs(fallback);

    return Array.from(collectedMap.values()).slice(0, limit);
  } catch {
    return [];
  }
}

export const getCartRecommendations = (cartProductIds: string[] = [], limit: number = 4) => {
  const sortedKey = [...cartProductIds].sort().join(",");
  return unstable_cache(
    async () => fetchCartRecommendationsUncached(cartProductIds, limit),
    [`cart-recs-${sortedKey}-${limit}`],
    { revalidate: 300, tags: ["products"] }
  )();
};
