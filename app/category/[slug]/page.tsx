import { cache } from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ShopCatalog from "@/components/home/ShopCatalog";
import OutOfStockNotice from "@/components/product/OutOfStockNotice";
import { filterCatalogForCategory, getShopCatalog } from "@/lib/home-catalog";
import JsonLd from "@/components/seo/JsonLd";
import CategoryFaqAccordion from "@/components/seo/CategoryFaqAccordion";
import { getCollectionSchema, getBreadcrumbSchema } from "@/lib/seo-schemas";
import { getCategoryFaqs } from "@/lib/category-faqs";

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true },
    });
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

const getCategoryBySlug = cache(async (slug: string) => {
  try {
    return await prisma.category.findUnique({
      where: { slug },
    });
  } catch {
    return null;
  }
});

function getCategoryMetaTitle(slug: string, rawName?: string): string {
  if (rawName) return rawName;
  const map: Record<string, string> = {
    "watches-men-analogue": "Men's Analogue Watches",
    "watches-men-digital": "Men's Digital Watches",
    "watches-ladies-analogue": "Ladies Analogue Watches",
    "watches-ladies-digital": "Ladies Digital Watches",
    "watches-men": "Men's Watches",
    "watches-ladies": "Ladies Watches",
    "smart-watches": "Smart Watches & Wearables",
    "perfumes-fragrances": "Perfumes & Fragrances",
    "jewellery": "Jewellery & Accessories",
    "accessories-gift-boxes": "Watch Care & Gift Boxes",
  };
  return map[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

  let categoryName = getCategoryMetaTitle(slug);
  let description = `Shop original ${categoryName} in Kenya at Halisi Gifts Shop. Fast Nairobi CBD pickup & countrywide delivery.`;

  try {
    const category = await getCategoryBySlug(slug);
    if (category) {
      categoryName = getCategoryMetaTitle(slug, category.name);
      if (category.description) {
        description = category.description;
      }
    }
  } catch {
    // Fallback
  }

  const title = `${categoryName} in Kenya`;

  return {
    title,
    description,
    keywords: [
      `${categoryName} Kenya`,
      `${categoryName} Nairobi`,
      `Buy ${categoryName} online Kenya`,
      "Halisi Gifts Shop",
    ],
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: `${title} | Halisi Gifts Shop`,
      description,
      url: `/category/${slug}`,
      siteName: "Halisi Gifts Shop",
      locale: "en_KE",
      type: "website",
      images: [
        {
          url: `${siteUrl}/hero-bg.jpg`,
          width: 1200,
          height: 630,
          alt: `${categoryName} - Halisi Gifts Shop Kenya`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Halisi Gifts Shop`,
      description,
      images: [`${siteUrl}/hero-bg.jpg`],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [category, catalog] = await Promise.all([getCategoryBySlug(slug), getShopCatalog()]);
  const listing = filterCatalogForCategory(catalog, slug, category);

  const categoryTitle = listing.title || getCategoryMetaTitle(slug);
  const description =
    listing.description || "Explore curated luxury collections and fine gifts.";

  const collectionSchema = getCollectionSchema(
    {
      name: categoryTitle,
      slug,
      description,
    },
    listing.products
  );

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: categoryTitle, url: `/category/${slug}` },
  ]);
  const categoryFaqs = getCategoryFaqs(slug, categoryTitle);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLd schema={collectionSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <Header />
      <main className="w-full flex-grow">
        <div className="border-b border-black/[0.06]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-10 pb-8 md:pt-14 md:pb-10">
            <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.15em] text-black/50 mb-4">
              <Link href="/" className="hover:text-gold">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-black">{categoryTitle}</span>
            </nav>
            <h1 className="font-heading text-3xl md:text-4xl text-black">{categoryTitle}</h1>
            <p className="mt-3 text-sm md:text-base text-black/60 max-w-2xl">{description}</p>
          </div>
        </div>

        {listing.products.length === 0 ? (
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
            <OutOfStockNotice
              message={`Everything in ${categoryTitle} is sold out right now. New stock arrives regularly. Message us and we'll let you know as soon as it lands.`}
              whatsappText={`Hi Halisi Gifts, your ${categoryTitle} section shows out of stock. When will new stock arrive?`}
              browseHref="/#shop"
            />
          </div>
        ) : (
          <ShopCatalog products={listing.products} categories={listing.categories} />
        )}

        <div className="border-t border-black/[0.06]">
          <CategoryFaqAccordion
            categoryName={categoryTitle}
            faqs={categoryFaqs}
            includeSchema
            className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
