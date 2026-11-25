import type { Metadata } from "next";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { getSmartSearchResults, type RecommendedProduct } from "@/lib/recommendations";
import { getShopCatalog, type ShopProduct } from "@/lib/home-catalog";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

function Grid({ products }: { products: ShopProduct[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const [searchData, catalog] = await Promise.all([
    getSmartSearchResults(query, 200).catch(() => null),
    getShopCatalog(),
  ]);

  // Enrich smart-search hits with stock / brand / variant info from the catalogue
  const byId = new Map(catalog.products.map((p) => [p.id, p]));
  const enrich = (list: RecommendedProduct[]) =>
    list.map((r) => byId.get(r.id)).filter((p): p is ShopProduct => Boolean(p));

  let exactMatches = enrich(searchData?.exactMatches ?? []);
  let fallbackMatches = enrich(searchData?.fallbackMatches ?? []);

  // Database offline: plain word match over the catalogue export
  if (!searchData) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    exactMatches = words.length
      ? catalog.products.filter((p) => words.every((w) => p.name.toLowerCase().includes(w)))
      : [];
    fallbackMatches = exactMatches.length ? [] : catalog.products.slice(0, 12);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="w-full flex-grow">
        <div className="border-b border-black/[0.06]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-10 pb-8 md:pt-14 md:pb-10">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-black/50 mb-3">Search</span>
            <h1 className="font-heading text-3xl md:text-4xl text-black">
              {query ? <>&ldquo;{query}&rdquo;</> : "Popular right now"}
            </h1>
            {query && (
              <p className="mt-3 text-sm md:text-base text-black/60">
                {exactMatches.length} {exactMatches.length === 1 ? "result" : "results"}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14 space-y-14">
          {exactMatches.length > 0 && <Grid products={exactMatches} />}

          {fallbackMatches.length > 0 && (
            <section>
              {query && exactMatches.length === 0 ? (
                <div className="mb-8 border border-dashed border-black/15 px-6 py-8 text-center">
                  <p className="font-heading text-lg text-black">No direct matches for &ldquo;{query}&rdquo;</p>
                  <p className="text-sm text-black/60 mt-2">
                    Try a brand like Lattafa or Curren, or{" "}
                    <Link href="/#shop" className="text-gold underline underline-offset-4">
                      browse everything
                    </Link>
                    . Here are some popular picks:
                  </p>
                </div>
              ) : (
                <h2 className="font-heading text-xl md:text-2xl text-black mb-6">You might also like</h2>
              )}
              <Grid products={fallbackMatches} />
            </section>
          )}

          {exactMatches.length === 0 && fallbackMatches.length === 0 && (
            <div className="border border-dashed border-black/15 py-20 text-center">
              <p className="font-heading text-lg text-black mb-4">Nothing found</p>
              <Link
                href="/#shop"
                className="inline-block bg-black text-white text-xs uppercase tracking-[0.15em] font-semibold px-7 py-3.5 hover:bg-gold transition-colors"
              >
                Browse all products
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
