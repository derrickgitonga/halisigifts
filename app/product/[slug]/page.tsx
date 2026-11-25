import { cache } from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import ProductInteractiveDetail from "@/components/product/ProductInteractiveDetail";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

import { getRelatedProducts, RecommendedProduct } from "@/lib/recommendations";
import JsonLd from "@/components/seo/JsonLd";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import { findDumpProduct, getShopCatalog, type ShopProduct } from "@/lib/home-catalog";
import ProductCard from "@/components/product/ProductCard";
import { getProductSchema, getBreadcrumbSchema, getProductFaqSchema, getFaqSchema } from "@/lib/seo-schemas";
import { getCategoryFaqs } from "@/lib/category-faqs";
import CategoryFaqAccordion from "@/components/seo/CategoryFaqAccordion";

export const revalidate = 300;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

const getProductBySlug = cache(async (slugOrId: string) => {
  try {
    const raw = decodeURIComponent(slugOrId).trim();
    if (!raw) return null;

    const includeOptions = {
      category: true,
      variants: true,
      reviews: {
        include: { user: true },
        orderBy: { createdAt: "desc" as const },
      },
    };

    // 1. Try exact slug match
    let product = await prisma.product.findUnique({
      where: { slug: raw },
      include: includeOptions,
    });
    if (product) return product;

    // 2. Try exact ID match
    product = await prisma.product.findUnique({
      where: { id: raw },
      include: includeOptions,
    });
    if (product) return product;

    // 3. Try case-insensitive slug match
    product = await prisma.product.findFirst({
      where: { slug: { equals: raw, mode: "insensitive" } },
      include: includeOptions,
    });
    if (product) return product;

    // 4. Try base slug match (e.g. casio-gold-1 -> casio-gold)
    const cleanSlug = raw.replace(/-\d+$/, "").replace(/[^a-zA-Z0-9\s-]/g, "");
    if (cleanSlug && cleanSlug !== raw) {
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: { startsWith: cleanSlug, mode: "insensitive" } },
            { name: { contains: cleanSlug.replace(/-/g, " "), mode: "insensitive" } },
          ],
        },
        include: includeOptions,
      });
      if (product) return product;
    }

    // 5. Try keyword match on product title (e.g. casio gold)
    const words = raw.split(/[-_\s]+/).filter((w) => w.length > 2);
    if (words.length > 0) {
      product = await prisma.product.findFirst({
        where: {
          OR: words.map((w) => ({
            name: { contains: w, mode: "insensitive" as const },
          })),
        },
        include: includeOptions,
      });
      if (product) return product;
    }

    return null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product =
      (await getProductBySlug(slug)) ??
      (findDumpProduct(slug) as Awaited<ReturnType<typeof getProductBySlug>>);

    if (!product) {
      return {
        title: "Product Not Found | Halisi Gifts Shop",
      };
    }

    const formattedPrice = `KSh ${Math.round(Number(product.price)).toLocaleString("en-KE")}`;
    const title = `${product.name} (${formattedPrice} in Kenya)`;
    const cleanRawDesc = (product.description || "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
    const shortSnippet = cleanRawDesc.length > 95 ? `${cleanRawDesc.slice(0, 92).trim()}...` : cleanRawDesc;
    const description = shortSnippet
      ? `Buy original ${product.name} for ${formattedPrice} at Halisi Gifts Nairobi. ${shortSnippet} KSh 250 Kenya delivery.`
      : `Buy 100% original ${product.name} for ${formattedPrice} at Halisi Gifts Shop Nairobi. Free gift packaging and KSh 250 delivery across Kenya.`;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
    const canonicalPath = `/product/${product.slug}`;
    const rawImage = product.images[0] || "/halisi-logo.png";
    const imageUrl = rawImage.startsWith("http")
      ? rawImage
      : `${siteUrl}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`;

    return {
      title,
      description,
      keywords: [
        product.name,
        `${product.name} price in Kenya`,
        `${product.name} Nairobi`,
        product.category?.name || "Original Watches Kenya",
        "Halisi Gifts Shop",
        "Original Watches Nairobi",
      ],
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: `${title} | Halisi Gifts Shop`,
        description,
        url: canonicalPath,
        siteName: "Halisi Gifts Shop",
        locale: "en_KE",
        type: "website",
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: `${product.name} - Halisi Gifts Shop Kenya`,
          },
        ],
      },
      other: {
        "product:price:amount": Number(product.price).toFixed(2),
        "product:price:currency": "KES",
        "product:availability": product.stock > 0 ? "in stock" : "out of stock",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Halisi Gifts Shop`,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: "Halisi Gifts Shop",
    };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product = null;
  let relatedProducts: RecommendedProduct[] = [];

  try {
    product = await getProductBySlug(slug);

    if (product && !product.isActive) {
      product = null;
    }

    if (product) {
      relatedProducts = await getRelatedProducts(product.id, 4);
    }
  } catch {
    // Database query catch
  }

  // Database offline: use the last catalogue export before falling back to a placeholder
  if (!product) {
    product = findDumpProduct(slug) as typeof product;
  }

  if (!product) {
    product = {
      id: "sample-product-id",
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      slug,
      description:
        "Crafted with exquisite detail, this luxury timepiece represents the pinnacle of watchmaking engineering and timeless style.",
      price: 1250,
      compareAtPrice: 1400,
      stock: 10,
      sku: "MWB-LUX-999",
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD-y4P4F7psrKx9QfP-e3uED0qMGeFj9oFds-KSQiNbo9PI0w2LaBPfXyaUMHmYq3_LLNcYphjbvLbJH9rM8EoXPZd0Jt7w5XowIOjb2WbbA94fFKICfkvKmgkdKvm9DNXPxx9LtCcmAAypY2NTFVYOHJWrBgJaU0yzhZEKdxvPAnAXtjigs2pjzqYIVFhKMHMHrInb7ZTHdYmxqWdwqCS0IeohFGo9_dLkfHI9zIHn8l1-5YVT45gU",
      ],
      category: { name: "Watches", slug: "analogue-watches" },
      variants: [
        { id: "v1", name: "Leather Strap (Brown)", image: null, priceModifier: 0, sku: "MWB-LUX-999-V1", stock: 5 },
        { id: "v2", name: "Steel Mesh Bracelet", image: null, priceModifier: 50, sku: "MWB-LUX-999-V2", stock: 5 },
      ],
      reviews: [],
    };
  }

  // Related products: use the recommender, or same-category picks from the catalogue when offline
  const catalog = await getShopCatalog();
  const byId = new Map(catalog.products.map((p) => [p.id, p]));
  let related: ShopProduct[] = relatedProducts
    .map((r) => byId.get(r.id))
    .filter((p): p is ShopProduct => Boolean(p));
  if (related.length === 0) {
    const current = byId.get(product.id);
    related = current
      ? catalog.products.filter((p) => p.categoryId === current.categoryId && p.id !== current.id).slice(0, 4)
      : [];
  }

  const currentPrice = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;

  const productSchema = getProductSchema({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: currentPrice,
    compareAtPrice,
    images: product.images,
    stock: product.stock,
    sku: product.sku,
    category: product.category,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: product.category.name, url: `/category/${product.category.slug}` },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  const categoryFaqs = getCategoryFaqs(product.category.slug, product.category.name);
  const productFaqItems = getProductFaqSchema({
    name: product.name,
    price: currentPrice,
    stock: product.stock,
    categoryName: product.category.name,
  }).mainEntity.map((q) => ({
    question: q.name,
    answer: q.acceptedAnswer.text,
  }));
  const productFaqSchema = getFaqSchema([...productFaqItems, ...categoryFaqs]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLd schema={productSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={productFaqSchema} />
      <Header />
      <main className="w-full flex-grow max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-md">
        <div className="flex items-center gap-2 text-sm text-black/60 mb-8 font-label-sm uppercase tracking-wider">
          <Link href="/" className="hover:text-gold">
            Home
          </Link>
          <span>/</span>
          <Link href={`/category/${product.category.slug}`} className="hover:text-gold">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-black font-semibold">{product.name}</span>
        </div>

        <ProductInteractiveDetail
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            priceMin: product.priceMin ? Number(product.priceMin) : null,
            priceMax: product.priceMax ? Number(product.priceMax) : null,
            stock: product.stock,
            images: product.images,
            category: product.category,
            variants: product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              image: v.image,
              priceModifier: Number(v.priceModifier),
              sku: v.sku,
              stock: v.stock,
            })),
          }}
        />

        {related.length > 0 && (
          <section className="border-t border-black/10 pt-12 mt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-heading text-2xl md:text-3xl text-black mb-8">
              You may also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        <RecentlyViewed excludeId={product.id} className="border-t border-black/10 pt-12 mt-12" />

        <CategoryFaqAccordion
          categoryName={product.category.name}
          faqs={categoryFaqs}
          className="border-t border-black/10 pt-12 mt-12"
        />
      </main>
      <Footer />
    </div>
  );
}
