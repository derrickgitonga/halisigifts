import Link from "next/link";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import ShopCatalog from "@/components/home/ShopCatalog";
import OutOfStockNotice from "@/components/product/OutOfStockNotice";
import JsonLd from "@/components/seo/JsonLd";
import CategoryFaqAccordion from "@/components/seo/CategoryFaqAccordion";
import { getShopCatalog } from "@/lib/home-catalog";
import { getBreadcrumbSchema } from "@/lib/seo-schemas";
import {
  filterCatalogForSeoCollection,
  getSeoCollectionBySlug,
  type SeoCollectionConfig,
} from "@/lib/seo-collections";

interface CollectionLandingPageProps {
  config: SeoCollectionConfig;
}

function buildCollectionPageSchema(
  config: SeoCollectionConfig,
  products: Array<{ name: string; slug: string }>
) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
  const pageUrl = `${siteUrl}${config.path}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl,
    name: config.h1,
    description: config.metaDescription,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Halisi Gifts",
      url: siteUrl,
    },
    ...(products.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.slice(0, 30).map((p, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${siteUrl}/product/${p.slug}`,
              name: p.name,
            })),
          },
        }
      : {}),
  };
}

export default async function CollectionLandingPage({ config }: CollectionLandingPageProps) {
  const catalog = await getShopCatalog();
  const { products, categories } = filterCatalogForSeoCollection(catalog, config);

  const prices = products.map((p) => p.price).filter((n) => n > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  const isSubCollection = config.path.startsWith("/collections/");
  const breadcrumbs = isSubCollection
    ? [
        { name: "Home", url: "/" },
        { name: "Collections", url: "/#shop" },
        { name: config.shortLabel, url: config.path },
      ]
    : [
        { name: "Home", url: "/" },
        { name: config.shortLabel, url: config.path },
      ];

  const relatedCollections = config.relatedSlugs
    .map((slug) => getSeoCollectionBySlug(slug))
    .filter((item): item is SeoCollectionConfig => Boolean(item));

  const collectionSchema = buildCollectionPageSchema(config, products);
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLd schema={collectionSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <Header />

      <main className="w-full flex-grow">
        <section className="border-b border-black/[0.06]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-10 pb-8 md:pt-14 md:pb-10">
            <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.15em] text-black/50 mb-4">
              {breadcrumbs.map((crumb, idx) => (
                <span key={crumb.url}>
                  {idx > 0 && <span className="mx-2">/</span>}
                  {idx < breadcrumbs.length - 1 ? (
                    <Link href={crumb.url} className="hover:text-gold transition-colors">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className="text-black">{crumb.name}</span>
                  )}
                </span>
              ))}
            </nav>

            <h1 className="font-heading text-3xl md:text-4xl text-black">{config.h1}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-black/60">
              <span>{products.length} verified items in stock</span>
              {minPrice !== null && maxPrice !== null && (
                <span>
                  KES {Math.round(minPrice).toLocaleString("en-KE")} to KES{" "}
                  {Math.round(maxPrice).toLocaleString("en-KE")}
                </span>
              )}
              <span>Same-day Nairobi delivery &bull; Flat KES 250 countrywide</span>
            </div>

            <div className="mt-6 rounded-2xl border border-black/[0.08] bg-white p-5 md:p-6 max-w-4xl">
              <h2 className="font-heading text-base md:text-lg text-black mb-2">
                {config.answerHeading}
              </h2>
              <p className="text-sm text-black/75 leading-relaxed">{config.answerCapsule}</p>
            </div>
          </div>
        </section>

        {products.length === 0 ? (
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
            <OutOfStockNotice
              message={`Everything in ${config.shortLabel} is sold out right now. New stock arrives regularly. Message us and we will notify you as soon as it lands.`}
              whatsappText={`Hi Halisi Gifts, I am looking for ${config.shortLabel}. When will new stock arrive?`}
              browseHref="/#shop"
            />
          </div>
        ) : (
          <ShopCatalog products={products} categories={categories} />
        )}

        <section className="border-t border-black/[0.06] bg-white/60">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
            <h2 className="font-heading text-xl md:text-2xl text-black mb-5">
              {config.comparisonTitle}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    {config.comparisonColumns.map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-black/70"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {config.comparisonRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-black/[0.015] transition-colors">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-3 ${
                            cIdx === 0 ? "font-medium text-black" : "text-black/70"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {relatedCollections.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50 mb-3">
                  Explore Related Collections
                </h3>
                <div className="flex flex-wrap gap-2">
                  {relatedCollections.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={rel.path}
                      className="px-3.5 py-2 rounded-full border border-black/10 bg-white text-xs font-medium text-black/80 hover:border-gold hover:text-gold transition-colors"
                    >
                      {rel.shortLabel}
                    </Link>
                  ))}
                  <Link
                    href="/blog"
                    className="px-3.5 py-2 rounded-full border border-black/10 bg-white text-xs font-medium text-black/80 hover:border-gold hover:text-gold transition-colors"
                  >
                    Watch &amp; Gift Buying Guides
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="border-t border-black/[0.06]">
          <CategoryFaqAccordion
            categoryName={config.shortLabel}
            faqs={config.faqs}
            includeSchema
            className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
