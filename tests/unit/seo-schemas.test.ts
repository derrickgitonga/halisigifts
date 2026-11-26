import { describe, it, expect } from "vitest";
import {
  getWebSiteSchema,
  getStoreSchema,
  getProductSchema,
  getBreadcrumbSchema,
  getFaqSchema,
  getProductFaqSchema,
  getCollectionSchema,
} from "@/lib/seo-schemas";

describe("AEO, SEO and GEO Schema.org Generators", () => {
  it("generates valid WebSite Schema with SearchAction", () => {
    const schema = getWebSiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.name).toBe("Halisi Gifts Shop");
    expect(schema.url).toBe("https://halisigifts.com");
    expect(schema.potentialAction["@type"]).toBe("SearchAction");
    expect(schema.potentialAction.target.urlTemplate).toContain("/search?q=");
  });

  it("generates valid JewelryStore / LocalBusiness Schema for GEO grounding", () => {
    const store = getStoreSchema();
    expect(store["@type"]).toBe("JewelryStore");
    expect(store.name).toBe("Halisi Gifts Shop");
    expect(store.legalName).toBe("Halisi Gifts Shop");
    expect(store.address.streetAddress).toContain("Accra Trade Centre");
    expect(store.address.addressLocality).toBe("Nairobi");
    expect(store.address.addressCountry).toBe("KE");
    expect(store.geo.latitude).toBeCloseTo(-1.2829);
    expect(store.telephone).toBe("+254729596165");
    expect(store.paymentAccepted).toContain("M-Pesa");
  });

  it("generates valid Product Schema with offers and shipping details", () => {
    const product = getProductSchema({
      id: "prod-123",
      name: "Curren Chronograph Leather Watch",
      slug: "curren-chronograph-leather-watch",
      description: "Authentic luxury chronograph watch with genuine leather strap.",
      price: 3200,
      compareAtPrice: 3800,
      images: ["/products/curren-1.jpg"],
      stock: 10,
      sku: "CRN-9020",
      category: { name: "Men's Watches" },
    });

    expect(product["@type"]).toBe("Product");
    expect(product.name).toBe("Curren Chronograph Leather Watch");
    expect(product.sku).toBe("CRN-9020");
    expect(product.offers.price).toBe(3200);
    expect(product.offers.priceCurrency).toBe("KES");
    expect(product.offers.availability).toBe("https://schema.org/InStock");
    expect(product.offers.shippingDetails.shippingDestination.addressCountry).toBe("KE");
  });

  it("generates valid BreadcrumbList Schema", () => {
    const breadcrumbs = getBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Men's Watches", url: "/category/watches-men" },
      { name: "Curren Chrono", url: "/product/curren-chrono" },
    ]);

    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement).toHaveLength(3);
    expect(breadcrumbs.itemListElement[0].position).toBe(1);
    expect(breadcrumbs.itemListElement[2].name).toBe("Curren Chrono");
  });

  it("generates valid FAQPage Schema for AEO", () => {
    const faqs = getFaqSchema([
      {
        question: "Where is Halisi Gifts Shop located?",
        answer: "We are located at Accra Trade Centre Building, 2nd Floor, Shop SF21 in Nairobi CBD.",
      },
    ]);

    expect(faqs["@type"]).toBe("FAQPage");
    expect(faqs.mainEntity).toHaveLength(1);
    expect(faqs.mainEntity[0].name).toBe("Where is Halisi Gifts Shop located?");
    expect(faqs.mainEntity[0].acceptedAnswer.text).toContain("Accra Trade Centre");
  });

  it("generates valid CollectionPage Schema with ItemList and Product FAQ Schema", () => {
    const collection = getCollectionSchema(
      {
        name: "Men's Analogue Watches",
        slug: "watches-men-analogue",
        description: "Explore genuine men's analogue watches.",
      },
      [{ name: "Casio Edifice", slug: "casio-edifice", price: 3200 }]
    );

    expect(collection["@type"]).toBe("CollectionPage");
    expect(collection.url).toContain("/category/watches-men-analogue");
    expect(collection.mainEntity?.["@type"]).toBe("ItemList");
    expect(collection.mainEntity?.numberOfItems).toBe(1);

    const productFaq = getProductFaqSchema({
      name: "Casio Edifice",
      price: 3200,
      stock: 5,
    });
    expect(productFaq["@type"]).toBe("FAQPage");
    expect(productFaq.mainEntity).toHaveLength(3);
    expect(productFaq.mainEntity[0].acceptedAnswer.text).toContain("KSh 3,200");
    expect(productFaq.mainEntity[2].acceptedAnswer.text).toContain("KSh 250");
  });
});
