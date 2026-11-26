export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function getOrganizationSchema() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Halisi Gifts",
    alternateName: ["Halisi Gifts Shop", "Halisi Watches Kenya"],
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/halisi-logo.png`,
    },
    description:
      "Halisi Gifts is a verified Kenyan online gift shop and watch retailer offering 100% authentic wristwatches, smartwatches, original Arabian perfumes, and curated gift sets with same-day Nairobi delivery and flat KES 250 countrywide shipping across Kenya.",
    areaServed: "KE",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+254729596165",
      contactType: "customer service",
      areaServed: "KE",
      availableLanguage: ["en", "sw"],
    },
    sameAs: [
      "https://wa.me/254729596165",
    ],
  };
}

export function getWebSiteSchema() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Halisi Gifts Shop",
    alternateName: ["Halisi Gifts", "Halisi Watch Shop", "Halisi Watches Kenya"],
    url: siteUrl,
    description: "Official store for Halisi Gifts Shop in Kenya. Explore 100% original luxury analogue, digital, and smart watches, authentic Arabian & designer perfumes, executive gifts, custom engraving, and customized wrappings with secure and fast delivery across Kenya.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-KE",
  };
}

export function getStoreSchema() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    "@id": `${siteUrl}/#store`,
    name: "Halisi Gifts Shop",
    legalName: "Time Crew Ventures",
    alternateName: "Halisi Watches Kenya",
    description: "Premier destination in Nairobi, Kenya for 100% original luxury watches, authentic Arabian and designer perfumes, personalized custom watch engraving, executive gift sets, and customized gift wrappings with secure and fast delivery across Kenya.",
    url: siteUrl,
    telephone: "+254729596165",
    email: "info@halisigifts.com",
    priceRange: "KES 500 - KES 35,000",
    paymentAccepted: "Safaricom M-Pesa, Credit Card, Debit Card, Cash on Delivery",
    currenciesAccepted: "KES",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Accra Road, Accra Trade Centre Building, 2nd Floor, Shop SF21",
      addressLocality: "Nairobi",
      addressRegion: "Nairobi County",
      postalCode: "00100",
      addressCountry: "KE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -1.2829,
      longitude: 36.8276,
    },
    hasMap: "https://maps.google.com/?q=Accra+Trade+Centre+Building,+Accra+Road,+Nairobi,+Kenya",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "19:30",
      },
    ],
    areaServed: [
      {
        "@type": "Country",
        name: "Kenya",
      },
      {
        "@type": "City",
        name: "Nairobi",
      },
      {
        "@type": "City",
        name: "Mombasa",
      },
      {
        "@type": "City",
        name: "Kisumu",
      },
      {
        "@type": "City",
        name: "Nakuru",
      },
      {
        "@type": "City",
        name: "Eldoret",
      },
    ],
    knowsAbout: [
      "Luxury Watches",
      "Smart Watches",
      "Personalized Watch Engraving",
      "Customized Gift Wrappings",
      "Executive Gift Sets",
      "Arabian Perfumes",
      "Secure and Fast Delivery Across Kenya",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Halisi Gifts & Watch Services",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Gift Services",
          itemListElement: [
            {
              "@type": "Service",
              name: "Customized Gift Wrapping",
              description: "Halisi Gifts offers customized gift wrappings, luxury packaging, personalized ribbons, and presentation gift boxes for all products.",
            },
            {
              "@type": "Service",
              name: "Fast and Secure Delivery Across Kenya",
              description: "Halisi Gifts provides secure and fast delivery across Kenya, including same-day delivery in Nairobi and 24 to 48 hour tracked delivery countrywide.",
            },
            {
              "@type": "Service",
              name: "Custom Watch & Jewelry Engraving",
              description: "High-precision personalized engraving on watch casebacks, clasps, and executive gift items.",
            },
          ],
        },
      ],
    },
    subjectOf: [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Does Halisi Gifts offer customized wrappings?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, Halisi Gifts offers customized gift wrappings, luxury gift boxes, personalized message cards, and presentation ribbons for watches and executive gift sets.",
            },
          },
          {
            "@type": "Question",
            name: "Does Halisi Gifts offer secure and fast delivery across Kenya?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, Halisi Gifts provides secure and fast delivery across Kenya, featuring same-day door delivery in Nairobi and 24 to 48 hours tracked parcel delivery across all 47 counties.",
            },
          },
        ],
      },
    ],
    sameAs: [
      "https://wa.me/254729596165",
    ],
  };
}

export function getProductSchema(product: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  stock: number;
  sku?: string;
  category?: { name: string; [key: string]: unknown } | null;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
  const productUrl = `${siteUrl}/product/${product.slug}`;
  const images = product.images.map((img) =>
    img.startsWith("http") ? img : `${siteUrl}${img.startsWith("/") ? "" : "/"}${img}`
  );

  const knownBrands = [
    "Casio",
    "G-Shock",
    "Edifice",
    "Citizen",
    "Naviforce",
    "Curren",
    "Poedagar",
    "Olevs",
    "WWOOR",
    "CRRJU",
    "Skmei",
    "Chaxigo",
    "Kalobee",
    "Lige",
    "Foxbox",
    "Colmi",
    "Oraimo",
    "Carekiso",
    "Scottie",
    "Comely",
    "Ochstin",
    "Smael",
    "Sanda",
    "Nibosi",
    "Binbond",
    "Megir",
    "Mini Focus",
    "Hannah Martin",
    "Yazole",
    "Kademan",
    "Tag Heuer",
    "Rolex",
    "Omega",
    "Seiko",
    "Tissot",
    "Fossil",
    "Michael Kors",
    "Hublot",
    "Patek Philippe",
    "Audemars Piguet",
    "Rado",
    "Daniel Wellington",
    "Emporio Armani",
    "Tommy Hilfiger",
    "Calvin Klein",
    "Lacoste",
    "Guess",
    "Diesel",
    "Invicta",
    "Orient",
    "Timex",
    "Lattafa",
    "Armaf",
    "Afnan",
    "Mousuf",
    "Gissah",
    "Haramain",
    "Rasasi",
    "Maison Alhambra",
    "Swiss Arabian",
    "Fragrance World",
  ];

  const detectedBrand =
    knownBrands.find((b) => product.name.toLowerCase().includes(b.toLowerCase())) || "Halisi";

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    name: product.name,
    description: product.description,
    image: images.length > 0 ? images : [`${siteUrl}/products/fallback.jpg`],
    sku: product.sku || product.slug,
    mpn: product.sku || product.slug,
    category: product.category?.name || "Watches",
    brand: {
      "@type": "Brand",
      name: detectedBrand,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "28",
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "KES",
      price: product.price,
      priceValidUntil: nextYear.toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Halisi Gifts Shop",
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "KE",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnInStore",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "250",
          currency: "KES",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "KE",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "d",
          },
        },
      },
    },
  };
}

export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };
}

export function getFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getProductFaqSchema(product: {
  name: string;
  price: number;
  stock: number;
  categoryName?: string;
}) {
  const formattedPrice = `KSh ${Math.round(product.price).toLocaleString("en-KE")}`;
  const availabilityText =
    product.stock > 0
      ? "Yes, this item is currently in stock and ready for same-day Nairobi CBD dispatch."
      : "This item is temporarily out of stock. Contact us on WhatsApp (+254729596165) to reserve the next restock.";

  return getFaqSchema([
    {
      question: `How much is ${product.name} in Kenya?`,
      answer: `${product.name} is priced at ${formattedPrice} at Halisi Gifts Shop in Nairobi, Kenya, with free gift packaging included.`,
    },
    {
      question: `Is ${product.name} original and in stock at Halisi Gifts?`,
      answer: `Every item at Halisi Gifts Shop is 100% certified genuine. ${availabilityText}`,
    },
    {
      question: `How fast is delivery for ${product.name} across Kenya?`,
      answer: `Order online at halisigifts.com for flat KSh 250 delivery nationwide, with same-day dispatch in Nairobi and 24 to 48 hour courier delivery to Mombasa, Kisumu, Nakuru, Eldoret, and all 47 counties.`,
    },
  ]);
}

export function getCollectionSchema(
  category: {
    name: string;
    slug: string;
    description?: string | null;
  },
  products?: Array<{ name: string; slug: string; price: number; image?: string | null }>
) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
  const categoryUrl = `${siteUrl}/category/${category.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": categoryUrl,
    name: `${category.name} in Kenya | Halisi Gifts Shop`,
    description: category.description || `Browse original ${category.name} at Halisi Gifts Shop with fast delivery across Kenya.`,
    url: categoryUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Halisi Gifts Shop",
      url: siteUrl,
    },
    ...(products && products.length > 0
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
