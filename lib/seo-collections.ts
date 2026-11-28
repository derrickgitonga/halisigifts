import type { Metadata } from "next";
import type { FaqItem } from "@/lib/seo-schemas";
import type { ShopCatalog, ShopCategory, ShopProduct } from "@/lib/home-catalog";

export type SeoCollectionGroup = "brand" | "style" | "recipient" | "occasion" | "budget";

export interface SeoCollectionConfig {
  slug: string;
  path: string;
  group: SeoCollectionGroup;
  shortLabel: string;
  title: string;
  metaDescription: string;
  h1: string;
  keywords: string[];
  answerHeading: string;
  answerCapsule: string;
  comparisonTitle: string;
  comparisonColumns: string[];
  comparisonRows: string[][];
  faqs: FaqItem[];
  relatedSlugs: string[];
  filter: (product: ShopProduct, categorySlug: string) => boolean;
}

const MEN_WATCH_SLUGS = new Set([
  "watches-men-analogue",
  "watches-men-digital",
  "men-s-watches",
  "watches-men",
  "mens-watches",
]);

const LADIES_WATCH_SLUGS = new Set([
  "watches-ladies-analogue",
  "watches-ladies-digital",
  "ladies-watches",
  "watches-ladies",
]);

const ALL_WATCH_SLUGS = new Set([
  ...MEN_WATCH_SLUGS,
  ...LADIES_WATCH_SLUGS,
  "watches-couple-sets",
  "smart-watches",
  "analogue-watches",
  "digital-watches",
]);

const GIFT_SLUGS = new Set([
  "valentines-gift-sets",
  "mothers-day-gift-sets",
  "perfumes-fragrances",
  "jewellery",
  "accessories-gift-boxes",
  "gifts-accessories",
  "bags-purses",
  "watches-couple-sets",
]);

function nameMatches(product: ShopProduct, patterns: string[]): boolean {
  const lower = product.name.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

export const SEO_COLLECTIONS: SeoCollectionConfig[] = [
  {
    slug: "poedagar-watches-kenya",
    path: "/collections/poedagar-watches-kenya",
    group: "brand",
    shortLabel: "Poedagar Watches",
    title: "Original Poedagar Watches in Kenya | KES 2,350+",
    metaDescription:
      "Shop 100% original Poedagar watches in Kenya at Halisi Gifts from KES 2,350. Waterproof quartz, leather, and stainless steel models with fast Nairobi delivery.",
    h1: "Original Poedagar Watches in Kenya",
    keywords: [
      "Poedagar watches Kenya",
      "original Poedagar watch Nairobi",
      "Poedagar watch price in Kenya",
      "Halisi Gifts Poedagar",
    ],
    answerHeading: "Original Poedagar Watch Prices in Kenya",
    answerCapsule:
      "Halisi Gifts stocks 59 original Poedagar watches in Kenya priced between KES 2,350 and KES 7,550. Every Poedagar timepiece includes luminous hands, 30M daily water resistance, a presentation gift box, and Safaricom M-Pesa checkout with same-day Nairobi delivery or flat KES 250 countrywide shipping.",
    comparisonTitle: "Popular Poedagar Watch Styles at Halisi Gifts",
    comparisonColumns: ["Style", "Strap Material", "Typical Price (KES)", "Best For"],
    comparisonRows: [
      ["Poedagar Executive Steel", "316L Stainless Steel", "KES 2,850 to KES 4,800", "Office wear and formal gifting"],
      ["Poedagar Classic Leather", "Genuine Leather", "KES 2,350 to KES 3,850", "Daily smart-casual wear"],
      ["Poedagar Chronograph", "Steel or Silicone", "KES 3,800 to KES 7,550", "Birthdays and milestones"],
      ["Poedagar Ladies Dress", "Mesh or Steel", "KES 2,650 to KES 4,200", "Anniversaries and everyday elegance"],
    ],
    faqs: [
      {
        question: "How much is an original Poedagar watch in Kenya?",
        answer:
          "Original Poedagar watches at Halisi Gifts range from KES 2,350 for classic leather strap models up to KES 7,550 for multi-function stainless steel chronographs.",
      },
      {
        question: "Are Poedagar watches waterproof?",
        answer:
          "Original Poedagar watches are 30M (3ATM) water resistant, making them safe for hand washing, light rain, and daily splashes. Avoid hot showers or deep swimming.",
      },
      {
        question: "Do Poedagar watches come with a gift box and warranty?",
        answer:
          "Yes. Every Poedagar watch ordered from Halisi Gifts arrives in an original presentation box with free gift wrapping and our 7-day exchange and authenticity guarantee.",
      },
      {
        question: "How fast is delivery for Poedagar watches in Nairobi and upcountry?",
        answer:
          "Nairobi orders qualify for same-day rider delivery, while deliveries to Mombasa, Kisumu, Nakuru, Eldoret, and other counties take 24 to 48 hours at a flat KES 250 rate.",
      },
    ],
    relatedSlugs: [
      "curren-watches-kenya",
      "olevs-watches-kenya",
      "mens-watches-kenya",
      "gifts-under-5000-kes",
    ],
    filter: (p) => nameMatches(p, ["poedagar"]),
  },
  {
    slug: "curren-watches-kenya",
    path: "/collections/curren-watches-kenya",
    group: "brand",
    shortLabel: "Curren Watches",
    title: "Original Curren Watches in Kenya | KES 2,610+",
    metaDescription:
      "Buy authentic Curren chronograph, leather, and stainless steel watches in Kenya from KES 2,610. Free gift wrapping and fast same-day delivery in Nairobi.",
    h1: "Original Curren Watches in Kenya",
    keywords: [
      "Curren watches Kenya",
      "Curren chronograph watch Nairobi",
      "Curren watch price Kenya",
      "original Curren watch",
    ],
    answerHeading: "Why Choose Original Curren Watches in Kenya?",
    answerCapsule:
      "Halisi Gifts carries 34 authentic Curren watches in Kenya ranging from KES 2,610 to KES 5,000. Known for bold chronograph dials, durable quartz movements, and comfortable leather or alloy bracelets, every Curren order includes free gift packaging and flat KES 250 delivery across Kenya.",
    comparisonTitle: "Curren Watch Series Comparison (KES)",
    comparisonColumns: ["Series", "Key Feature", "Price Range (KES)", "Occasion"],
    comparisonRows: [
      ["Curren Leather Dress", "Date window & stitched leather", "KES 2,610 to KES 3,450", "Workwear & everyday gifting"],
      ["Curren Chronograph", "Working sub-dials & stopwatch", "KES 3,450 to KES 4,800", "Birthdays & graduations"],
      ["Curren Full Steel", "Brushed stainless bracelet", "KES 3,200 to KES 5,000", "Corporate & formal wear"],
    ],
    faqs: [
      {
        question: "What is the price of Curren watches in Kenya?",
        answer:
          "Original Curren watches at Halisi Gifts cost between KES 2,610 and KES 5,000 depending on whether you choose a minimalist leather dress watch or a full stainless steel chronograph.",
      },
      {
        question: "Do all Curren sub-dials work?",
        answer:
          "Yes, on Curren chronograph models stocked at Halisi Gifts, the stopwatch sub-dials and date window are fully functional and powered by a precision quartz movement.",
      },
      {
        question: "Can I add custom engraving to a Curren watch?",
        answer:
          "Yes. You can add custom caseback or clasp engraving for KES 200 at checkout to personalize your Curren watch as a birthday or anniversary gift.",
      },
      {
        question: "How do I pay for a Curren watch online?",
        answer:
          "You can pay securely via Safaricom M-Pesa, card, or select our delivery payment options directly on halisigifts.com.",
      },
    ],
    relatedSlugs: [
      "poedagar-watches-kenya",
      "naviforce-watches-kenya",
      "leather-strap-watches-kenya",
      "gifts-for-him",
    ],
    filter: (p) => nameMatches(p, ["curren"]),
  },
  {
    slug: "olevs-watches-kenya",
    path: "/collections/olevs-watches-kenya",
    group: "brand",
    shortLabel: "Olevs Watches",
    title: "Original Olevs Watches in Kenya | KES 2,350+",
    metaDescription:
      "Shop original Olevs quartz and automatic-style watches in Kenya at Halisi Gifts from KES 2,350. Free gift box, custom engraving, and same-day Nairobi delivery.",
    h1: "Original Olevs Watches in Kenya",
    keywords: [
      "Olevs watches Kenya",
      "Olevs watch Nairobi",
      "Olevs watch price in Kenya",
      "original Olevs watches",
    ],
    answerHeading: "Original Olevs Watches Available in Kenya",
    answerCapsule:
      "Halisi Gifts stocks 31 genuine Olevs watches for men and women priced from KES 2,350 to KES 5,350. Olevs timepieces combine scratch-resistant coated glass, day-date displays, and refined gold or silver finishes, backed by our authenticity guarantee and flat KES 250 nationwide Kenya delivery.",
    comparisonTitle: "Olevs Watch Collection Overview",
    comparisonColumns: ["Category", "Design Highlight", "Price Range (KES)", "Ideal Recipient"],
    comparisonRows: [
      ["Olevs Men's Day-Date", "Fluted bezel & luminous dial", "KES 2,850 to KES 4,950", "Professionals & executives"],
      ["Olevs Ladies Ceramic & Steel", "Slim bracelet & crystal markers", "KES 2,350 to KES 4,200", "Partners & mothers"],
      ["Olevs Moonphase & Chrono", "Multi-dial luxury aesthetic", "KES 3,800 to KES 5,350", "Anniversary & milestone gifts"],
    ],
    faqs: [
      {
        question: "How much do original Olevs watches cost in Kenya?",
        answer:
          "At Halisi Gifts, original Olevs watches range from KES 2,350 to KES 5,350, including a branded presentation box and free gift wrapping.",
      },
      {
        question: "Are Olevs watches good quality for everyday wear?",
        answer:
          "Yes. Olevs watches use accurate quartz movements, durable stainless steel or genuine leather straps, and 30M splash resistance suited to daily wear in Nairobi and across Kenya.",
      },
      {
        question: "Do you stock Olevs watches for both men and women?",
        answer:
          "Yes, our Olevs collection covers men's day-date and chronograph models alongside slim ladies' dress watches in gold, rose gold, and silver tones.",
      },
      {
        question: "How long does delivery take outside Nairobi?",
        answer:
          "Tracked courier delivery to Mombasa, Kisumu, Nakuru, Eldoret, Thika, and all 47 counties takes 24 to 48 hours for a flat fee of KES 250.",
      },
    ],
    relatedSlugs: [
      "poedagar-watches-kenya",
      "wwoor-watches-kenya",
      "stainless-steel-watches-kenya",
      "luxury-watch-gifts-kenya",
    ],
    filter: (p) => nameMatches(p, ["olevs"]),
  },
  {
    slug: "crrju-watches-kenya",
    path: "/collections/crrju-watches-kenya",
    group: "brand",
    shortLabel: "CRRJU Watches",
    title: "Original CRRJU Watches in Kenya | Minimalist & Chrono",
    metaDescription:
      "Explore 23 original CRRJU minimalist mesh and chronograph watches in Kenya from KES 2,650 at Halisi Gifts. Fast Nairobi delivery and free gift wrapping.",
    h1: "Original CRRJU Watches in Kenya",
    keywords: [
      "CRRJU watches Kenya",
      "CRRJU minimalist watch Nairobi",
      "CRRJU watch price Kenya",
      "original CRRJU watches",
    ],
    answerHeading: "Original CRRJU Minimalist & Chronograph Watches",
    answerCapsule:
      "Halisi Gifts offers 23 original CRRJU watches in Kenya priced between KES 2,650 and KES 5,350. CRRJU is celebrated for ultra-slim minimalist cases, breathable stainless steel mesh bands, and clean chronograph dials that transition effortlessly from Nairobi offices to weekend dinners.",
    comparisonTitle: "CRRJU Models Compared in KES",
    comparisonColumns: ["Model Type", "Strap Option", "Price Range (KES)", "Wrist Feel"],
    comparisonRows: [
      ["CRRJU Ultra-Slim Mesh", "Stainless steel Milanese mesh", "KES 2,650 to KES 3,600", "Lightweight and slim"],
      ["CRRJU Minimalist Leather", "Smooth leather strap", "KES 2,650 to KES 3,500", "Classic dress fit"],
      ["CRRJU Sport Chronograph", "Solid link steel or leather", "KES 3,800 to KES 5,350", "Substantial modern presence"],
    ],
    faqs: [
      {
        question: "What is the price range for CRRJU watches in Kenya?",
        answer:
          "Original CRRJU watches at Halisi Gifts start at KES 2,650 and go up to KES 5,350 for full chronograph stainless steel editions.",
      },
      {
        question: "Are CRRJU watches suitable for smaller wrists?",
        answer:
          "Yes. CRRJU minimalist models feature slim profiles and adjustable mesh clasps that fit small and medium wrists comfortably without needing link removal.",
      },
      {
        question: "Are CRRJU watches original at Halisi Gifts?",
        answer:
          "Every CRRJU watch we sell is 100% authentic, inspected before dispatch, and covered by our 7-day exchange guarantee.",
      },
      {
        question: "Can I order a CRRJU watch as a surprise gift?",
        answer:
          "Yes. Add your recipient's details and a personalized gift note at checkout, and we will deliver it gift-wrapped anywhere in Kenya.",
      },
    ],
    relatedSlugs: [
      "poedagar-watches-kenya",
      "wwoor-watches-kenya",
      "mens-watches-kenya",
      "graduation-gifts-kenya",
    ],
    filter: (p) => nameMatches(p, ["crrju"]),
  },
  {
    slug: "casio-watches-kenya",
    path: "/collections/casio-watches-kenya",
    group: "brand",
    shortLabel: "Casio Watches",
    title: "Original Casio Watches in Kenya | KES 950 to 14,750",
    metaDescription:
      "Shop verified original Casio, G-Shock, Edifice, and Vintage digital watches in Kenya at Halisi Gifts from KES 950. Same-day Nairobi delivery.",
    h1: "Original Casio Watches in Kenya",
    keywords: [
      "Casio watches Kenya",
      "original Casio watch Nairobi",
      "Casio vintage watch price Kenya",
      "Casio Edifice Kenya",
    ],
    answerHeading: "Verified Original Casio Watches in Nairobi & Kenya",
    answerCapsule:
      "Halisi Gifts stocks 19 verified original Casio watches in Kenya from KES 950 to KES 14,750, spanning iconic Casio Vintage digital watches, classic analogue dress pieces, and rugged sport models. Every Casio ships with free gift packaging, M-Pesa checkout, and flat KES 250 nationwide delivery.",
    comparisonTitle: "Casio Watch Lines Available in Kenya",
    comparisonColumns: ["Casio Line", "Movement", "Price Range (KES)", "Best For"],
    comparisonRows: [
      ["Casio Classic Digital", "Quartz Digital with LED", "KES 950 to KES 3,500", "Retro daily wear & students"],
      ["Casio MTP / LTP Analogue", "Japanese Quartz Analogue", "KES 3,500 to KES 8,500", "Office, church & formal wear"],
      ["Casio Edifice & Sport", "Chronograph / Dual-Time", "KES 8,500 to KES 14,750", "Executives & collectors"],
    ],
    faqs: [
      {
        question: "How much is an original Casio watch in Kenya?",
        answer:
          "Original Casio watches at Halisi Gifts start from KES 950 for classic digital models and reach KES 14,750 for premium Edifice and stainless steel series.",
      },
      {
        question: "How can I tell my Casio watch is original?",
        answer:
          "Original Casio watches feature crisp caseback engraving, clean dial printing, responsive pushers, and accurate module alignment. Halisi Gifts guarantees 100% authenticity on every watch.",
      },
      {
        question: "Do Casio watches come with a battery installed?",
        answer:
          "Yes, every Casio watch is tested before dispatch and arrives running with a fresh long-life Japanese battery.",
      },
      {
        question: "Do you deliver Casio watches outside Nairobi?",
        answer:
          "Yes. We deliver to Mombasa, Kisumu, Nakuru, Eldoret, Nyeri, and all 47 Kenyan counties within 24 to 48 hours for KES 250.",
      },
    ],
    relatedSlugs: [
      "skmei-watches-kenya",
      "stainless-steel-watches-kenya",
      "luxury-watch-gifts-kenya",
      "gifts-under-5000-kes",
    ],
    filter: (p) => nameMatches(p, ["casio", "g-shock", "gshock", "edifice"]),
  },
  {
    slug: "wwoor-watches-kenya",
    path: "/collections/wwoor-watches-kenya",
    group: "brand",
    shortLabel: "WWOOR Watches",
    title: "Original WWOOR Watches in Kenya | KES 2,850+",
    metaDescription:
      "Shop original WWOOR square, diamond-accent, and stainless steel dress watches in Kenya from KES 2,850 at Halisi Gifts. Same-day Nairobi delivery.",
    h1: "Original WWOOR Watches in Kenya",
    keywords: [
      "WWOOR watches Kenya",
      "WWOOR watch Nairobi",
      "WWOOR watch price Kenya",
      "WWOOR ladies and mens watches",
    ],
    answerHeading: "Original WWOOR Dress Watches at Halisi Gifts",
    answerCapsule:
      "Halisi Gifts carries 17 original WWOOR watches in Kenya priced between KES 2,850 and KES 6,750. WWOOR is prized for sleek rectangular dress dials, polished gold and silver steel bracelets, and reliable Japanese quartz movements, delivered gift-wrapped anywhere in Kenya for KES 250.",
    comparisonTitle: "WWOOR Watch Styles in Stock",
    comparisonColumns: ["Design", "Case Shape", "Price Range (KES)", "Style Note"],
    comparisonRows: [
      ["WWOOR Classic Round Steel", "Round 40mm", "KES 2,850 to KES 4,200", "Clean boardroom look"],
      ["WWOOR Square & Tank", "Rectangular", "KES 3,200 to KES 5,200", "Distinctive statement dress watch"],
      ["WWOOR Luxury Gold & Ladies", "Slim Steel / Crystal", "KES 3,400 to KES 6,750", "Evening wear & anniversaries"],
    ],
    faqs: [
      {
        question: "How much are WWOOR watches in Kenya?",
        answer:
          "Original WWOOR watches at Halisi Gifts cost between KES 2,850 and KES 6,750 depending on the case finish and bracelet style.",
      },
      {
        question: "Are WWOOR watches water resistant?",
        answer:
          "Yes, WWOOR watches carry 30M daily water resistance, protecting them against rain and handwashing.",
      },
      {
        question: "Can I gift-wrap a WWOOR watch for a birthday?",
        answer:
          "Yes. Free luxury gift wrapping is included with every WWOOR order, and optional caseback engraving is available for KES 200.",
      },
      {
        question: "Do you offer same-day delivery in Nairobi?",
        answer:
          "Yes, orders placed within Nairobi qualify for same-day rider delivery directly to your office or home.",
      },
    ],
    relatedSlugs: [
      "olevs-watches-kenya",
      "crrju-watches-kenya",
      "womens-watches-nairobi",
      "anniversary-gifts-nairobi",
    ],
    filter: (p) => nameMatches(p, ["wwoor"]),
  },
  {
    slug: "skmei-watches-kenya",
    path: "/collections/skmei-watches-kenya",
    group: "brand",
    shortLabel: "Skmei Watches",
    title: "Original Skmei Watches in Kenya | Digital & Sport",
    metaDescription:
      "Buy original Skmei digital, dual-time, and waterproof sport watches in Kenya from KES 2,700 at Halisi Gifts. Fast Nairobi and countrywide delivery.",
    h1: "Original Skmei Watches in Kenya",
    keywords: [
      "Skmei watches Kenya",
      "Skmei digital watch Nairobi",
      "Skmei waterproof watch Kenya",
      "Skmei watch price Kenya",
    ],
    answerHeading: "Original Skmei Sport & Digital Watches in Kenya",
    answerCapsule:
      "Halisi Gifts stocks 15 authentic Skmei watches in Kenya from KES 2,700 to KES 4,800. Built for active lifestyles, Skmei timepieces feature shock-resistant cases, EL backlights, alarms, and 50M water resistance, backed by M-Pesa checkout and flat KES 250 nationwide Kenya shipping.",
    comparisonTitle: "Skmei Watch Features at a Glance",
    comparisonColumns: ["Type", "Core Features", "Price Range (KES)", "Best Use"],
    comparisonRows: [
      ["Skmei Digital Sport", "50M water resistant, alarm, backlight", "KES 2,700 to KES 3,600", "Gym, travel & everyday durability"],
      ["Skmei Dual-Time Ana-Digi", "Analogue hands + digital display", "KES 3,200 to KES 4,800", "Outdoor work & weekend wear"],
      ["Skmei Stainless Digital", "Steel bracelet, world time", "KES 2,950 to KES 4,500", "Smart-casual daily wear"],
    ],
    faqs: [
      {
        question: "What is the price of an original Skmei watch in Kenya?",
        answer:
          "Original Skmei watches at Halisi Gifts are priced from KES 2,700 to KES 4,800 with a gift box included.",
      },
      {
        question: "Are Skmei watches waterproof?",
        answer:
          "Most Skmei digital and sport watches are rated 50M (5ATM) water resistant, handling rain, handwashing, and light swimming. Avoid pressing buttons underwater.",
      },
      {
        question: "Are Skmei watches durable for daily active wear?",
        answer:
          "Yes. Skmei uses impact-resistant resin or steel cases and high-visibility LED displays designed for rugged daily use.",
      },
      {
        question: "How do I track my Skmei order in Kenya?",
        answer:
          "Once your order is confirmed, you receive an order reference number that you can track live on halisigifts.com/track-order.",
      },
    ],
    relatedSlugs: [
      "casio-watches-kenya",
      "naviforce-watches-kenya",
      "mens-watches-kenya",
      "gifts-under-5000-kes",
    ],
    filter: (p) => nameMatches(p, ["skmei"]),
  },
  {
    slug: "naviforce-watches-kenya",
    path: "/collections/naviforce-watches-kenya",
    group: "brand",
    shortLabel: "Naviforce Watches",
    title: "Original Naviforce Watches in Kenya | KES 3,200+",
    metaDescription:
      "Shop original Naviforce dual-time, chronograph, and leather watches in Kenya from KES 3,200 at Halisi Gifts. Free gift packaging and fast Kenya delivery.",
    h1: "Original Naviforce Watches in Kenya",
    keywords: [
      "Naviforce watches Kenya",
      "Naviforce dual time watch Nairobi",
      "Naviforce watch price Kenya",
      "original Naviforce watch",
    ],
    answerHeading: "Original Naviforce Dual-Time & Chronograph Watches",
    answerCapsule:
      "Halisi Gifts carries 14 genuine Naviforce watches in Kenya priced between KES 3,200 and KES 4,950. Engineered with Japanese quartz movements, hardened mineral glass, and bold military-inspired dual-time or chronograph layouts, every Naviforce ships gift-ready across Kenya for KES 250.",
    comparisonTitle: "Naviforce Watch Styles Compared",
    comparisonColumns: ["Style", "Movement", "Price Range (KES)", "Strap"],
    comparisonRows: [
      ["Naviforce Dual-Time", "Analogue + Digital LED", "KES 3,450 to KES 4,950", "Leather or Stainless Steel"],
      ["Naviforce Chronograph", "Quartz Stopwatch + Date", "KES 3,200 to KES 4,600", "Genuine Leather"],
      ["Naviforce Full Metal", "Quartz Day-Date", "KES 3,600 to KES 4,850", "316L Stainless Steel"],
    ],
    faqs: [
      {
        question: "How much is an original Naviforce watch in Kenya?",
        answer:
          "Original Naviforce watches at Halisi Gifts range from KES 3,200 to KES 4,950, complete with an original gift box and warranty.",
      },
      {
        question: "What makes Naviforce watches popular in Kenya?",
        answer:
          "Naviforce watches combine rugged aviation-inspired styling, dual-time functionality, luminous hands, and reliable Japanese quartz movements at an accessible mid-range KES price.",
      },
      {
        question: "Are Naviforce leather straps durable?",
        answer:
          "Yes. Naviforce uses stitched leather straps with stainless steel buckles built for daily comfort in warm climates.",
      },
      {
        question: "Can I pay on delivery in Nairobi?",
        answer:
          "Yes. We support Safaricom M-Pesa, card payments, and flexible delivery payment options across Nairobi.",
      },
    ],
    relatedSlugs: [
      "curren-watches-kenya",
      "skmei-watches-kenya",
      "leather-strap-watches-kenya",
      "gifts-for-him",
    ],
    filter: (p) => nameMatches(p, ["naviforce"]),
  },
  {
    slug: "mens-watches-kenya",
    path: "/collections/mens-watches-kenya",
    group: "style",
    shortLabel: "Men's Watches",
    title: "Original Men's Watches in Kenya | 240+ Models",
    metaDescription:
      "Browse 240+ original men's watches in Kenya from KES 950 to KES 25,750 at Halisi Gifts. Poedagar, Curren, Casio, Olevs, and Naviforce with fast delivery.",
    h1: "Original Men's Watches in Kenya",
    keywords: [
      "men's watches Kenya",
      "original watches for men Nairobi",
      "best men's watches Kenya",
      "men's wristwatches price in Kenya",
    ],
    answerHeading: "Original Men's Watches Across Every Kenyan Budget",
    answerCapsule:
      "Halisi Gifts offers over 240 original men's watches in Kenya starting from KES 950 up to KES 25,750, including analogue dress watches, chronographs, digital sport models, and leather or stainless steel bracelets. Every timepiece is 100% authentic with free gift wrapping and flat KES 250 nationwide delivery.",
    comparisonTitle: "Men's Watch Guide by Style and Budget",
    comparisonColumns: ["Watch Category", "Top Brands", "Price Range (KES)", "Best Occasion"],
    comparisonRows: [
      ["Executive Steel Analogue", "Poedagar, Olevs, Seiko", "KES 2,850 to KES 12,500", "Office, weddings & promotions"],
      ["Classic Leather Dress", "Curren, CRRJU, Naviforce", "KES 2,350 to KES 5,500", "Birthdays & daily wear"],
      ["Sport & Digital", "Casio, Skmei, Naviforce", "KES 950 to KES 8,500", "Active wear & travel"],
      ["Luxury & Collector", "Casio Edifice, Seiko, Tissot-style", "KES 5,000 to KES 25,750", "Milestone & VIP gifting"],
    ],
    faqs: [
      {
        question: "Where can I buy original men's watches in Nairobi?",
        answer:
          "Halisi Gifts (halisigifts.com) stocks over 240 verified original men's watches from Poedagar, Curren, Olevs, CRRJU, Casio, Naviforce, Skmei, and Seiko with same-day Nairobi delivery.",
      },
      {
        question: "What is a good budget for a quality men's watch in Kenya?",
        answer:
          "You can get an original everyday watch from KES 2,350 to KES 5,000, while premium chronographs and collector Japanese models sit between KES 5,000 and KES 25,750.",
      },
      {
        question: "Can I engrave a men's watch before delivery?",
        answer:
          "Yes. Custom laser engraving on the caseback or gift box costs KES 200 and can be added directly at checkout.",
      },
      {
        question: "Do men's watches come in a gift box?",
        answer:
          "Yes, every watch ships in a protective presentation box with complimentary gift wrapping ready to hand over.",
      },
    ],
    relatedSlugs: [
      "poedagar-watches-kenya",
      "curren-watches-kenya",
      "leather-strap-watches-kenya",
      "gifts-for-him",
    ],
    filter: (p, catSlug) => MEN_WATCH_SLUGS.has(catSlug),
  },
  {
    slug: "womens-watches-nairobi",
    path: "/collections/womens-watches-nairobi",
    group: "style",
    shortLabel: "Women's Watches",
    title: "Original Women's Watches in Nairobi & Kenya",
    metaDescription:
      "Shop 100+ original ladies' watches in Nairobi and Kenya from KES 1,650 at Halisi Gifts. Rose gold, bracelet, and minimalist styles with free gift box.",
    h1: "Original Women's Watches in Nairobi & Kenya",
    keywords: [
      "women's watches Nairobi",
      "ladies watches Kenya",
      "original women's watches Kenya",
      "ladies bracelet watches Nairobi",
    ],
    answerHeading: "Original Ladies' Watches in Nairobi & Countrywide",
    answerCapsule:
      "Halisi Gifts curates 100+ original women's watches in Nairobi and across Kenya priced from KES 1,650 to KES 6,750. Choose from rose gold mesh bands, petite crystal-accented dress watches, and bracelet gift sets by Olevs, Hannah Martin, Poedagar, and WWOOR with same-day Nairobi delivery.",
    comparisonTitle: "Women's Watch Styles at Halisi Gifts",
    comparisonColumns: ["Style", "Popular Finish", "Price Range (KES)", "Wrist Size Fit"],
    comparisonRows: [
      ["Minimalist Mesh & Leather", "Rose gold, silver, black", "KES 1,650 to KES 3,650", "Petite & small wrists (28mm to 34mm)"],
      ["Crystal & Bracelet Watch", "Gold & two-tone steel", "KES 2,650 to KES 4,800", "Formal events & anniversaries"],
      ["Ladies Watch + Jewellery Set", "Matching bangle or necklace", "KES 3,200 to KES 6,750", "Birthdays, Mother's Day & Valentine's"],
    ],
    faqs: [
      {
        question: "How much are original ladies' watches in Nairobi?",
        answer:
          "Original women's watches at Halisi Gifts start from KES 1,650 for minimalist Hannah Martin models and reach KES 6,750 for luxury steel and bracelet gift sets.",
      },
      {
        question: "Which watch size is best for a small female wrist?",
        answer:
          "Case diameters between 26mm and 34mm with slim mesh or delicate link bracelets look balanced and comfortable on smaller wrists.",
      },
      {
        question: "Do women's watches fade or tarnish?",
        answer:
          "Our original stainless steel and quality-plated ladies' watches resist everyday tarnishing when kept away from direct perfume sprays and harsh chemicals.",
      },
      {
        question: "Can I pair a ladies' watch with perfume or jewellery?",
        answer:
          "Yes. Add an original Arabian perfume or non-tarnish jewellery piece to your cart and we will pack them together in complimentary gift wrapping.",
      },
    ],
    relatedSlugs: [
      "olevs-watches-kenya",
      "wwoor-watches-kenya",
      "couple-watches-kenya",
      "gifts-for-her",
    ],
    filter: (p, catSlug) => LADIES_WATCH_SLUGS.has(catSlug),
  },
  {
    slug: "couple-watches-kenya",
    path: "/collections/couple-watches-kenya",
    group: "style",
    shortLabel: "Couple Watches",
    title: "Couple Watch Sets in Kenya | His & Hers Gifts",
    metaDescription:
      "Shop matching his and hers couple watch sets in Kenya from KES 1,650 to KES 8,550 at Halisi Gifts. Custom engraving and same-day Nairobi delivery.",
    h1: "Matching Couple Watch Sets in Kenya",
    keywords: [
      "couple watches Kenya",
      "his and hers watches Nairobi",
      "matching couple watch sets Kenya",
      "anniversary couple watches",
    ],
    answerHeading: "His & Hers Couple Watch Sets in Kenya",
    answerCapsule:
      "Halisi Gifts offers 19 original his-and-hers couple watch sets in Kenya priced from KES 1,650 to KES 8,550. Each matching pair arrives in a coordinated presentation box with free luxury gift wrapping, optional KES 200 custom engraving, and same-day Nairobi delivery or flat KES 250 countrywide shipping.",
    comparisonTitle: "Couple Watch Set Options in KES",
    comparisonColumns: ["Pair Type", "Strap Style", "Price Range (KES)", "Best Occasion"],
    comparisonRows: [
      ["Classic Leather Couple Set", "Matching brown or black leather", "KES 1,650 to KES 4,200", "Dating milestones & Valentine's"],
      ["Two-Tone Gold & Silver Pair", "Stainless steel link bracelet", "KES 4,200 to KES 6,800", "Engagements & weddings"],
      ["Luxury Executive Couple Set", "Premium quartz steel pairs", "KES 6,500 to KES 8,550", "Anniversaries & bridal gifts"],
    ],
    faqs: [
      {
        question: "Are both watches included in the couple watch price?",
        answer:
          "Yes, every listing in our Couple Watch Sets collection includes both the men's and ladies' matching watches in a gift-ready box.",
      },
      {
        question: "Can you engrave our initials or wedding date on both watches?",
        answer:
          "Yes. Custom engraving is available for KES 200 per item so you can add initials, names, or a special anniversary date.",
      },
      {
        question: "How fast can couple watches be delivered in Nairobi?",
        answer:
          "Orders within Nairobi are delivered the same day by rider, and nationwide courier orders arrive within 24 to 48 hours for KES 250.",
      },
      {
        question: "What if one strap needs sizing?",
        answer:
          "Leather and mesh couple watches adjust instantly on the wrist, while steel link bracelets can be resized easily at any watch technician in minutes.",
      },
    ],
    relatedSlugs: [
      "anniversary-gifts-nairobi",
      "mens-watches-kenya",
      "womens-watches-nairobi",
      "gifts-under-10000-kes",
    ],
    filter: (p, catSlug) =>
      catSlug === "watches-couple-sets" || nameMatches(p, ["couple", "his & hers", "his and hers"]),
  },
  {
    slug: "leather-strap-watches-kenya",
    path: "/collections/leather-strap-watches-kenya",
    group: "style",
    shortLabel: "Leather Strap Watches",
    title: "Leather Strap Watches in Kenya | Men & Women",
    metaDescription:
      "Shop 70+ original leather strap watches in Kenya at Halisi Gifts from KES 1,650. Classic brown, black, and blue leather watches with fast Nairobi delivery.",
    h1: "Original Leather Strap Watches in Kenya",
    keywords: [
      "leather strap watches Kenya",
      "leather watches Nairobi",
      "brown leather watch Kenya",
      "men's leather wristwatch Kenya",
    ],
    answerHeading: "Original Leather Strap Watches in Kenya",
    answerCapsule:
      "Halisi Gifts stocks over 70 original leather strap watches in Kenya from KES 1,650 to KES 9,250 across Curren, Poedagar, Naviforce, Olevs, and CRRJU. Soft, breathable, and immediately comfortable on the wrist, every leather watch ships in a gift box with flat KES 250 Kenya delivery.",
    comparisonTitle: "Leather Strap Watch Styles in Stock",
    comparisonColumns: ["Leather Color", "Dial Pairings", "Price Range (KES)", "Wardrobe Match"],
    comparisonRows: [
      ["Classic Black Leather", "Silver, black, or gold dial", "KES 1,650 to KES 5,500", "Formal suits & office attire"],
      ["Rich Brown / Tan Leather", "Blue, white, or cream dial", "KES 2,350 to KES 5,350", "Smart-casual & weekend wear"],
      ["Chronograph Leather", "Multi-dial sport-dress", "KES 3,200 to KES 7,550", "Gifts for men & graduates"],
    ],
    faqs: [
      {
        question: "Are leather strap watches comfortable in Nairobi's climate?",
        answer:
          "Yes. Quality leather straps mold naturally to your wrist, feel lighter than full metal bracelets, and suit both office wear and evening outings.",
      },
      {
        question: "How much do leather strap watches cost at Halisi Gifts?",
        answer:
          "Original leather strap watches start from KES 1,650 for minimalist models and average between KES 2,500 and KES 5,000 for chronographs.",
      },
      {
        question: "How do I care for a leather watch strap?",
        answer:
          "Wipe the strap gently with a dry cloth after heavy wear and avoid soaking it in water so the leather stays supple for years.",
      },
      {
        question: "Do leather strap watches come with free gift packaging?",
        answer:
          "Yes, every watch includes a presentation box and complimentary gift wrapping.",
      },
    ],
    relatedSlugs: [
      "stainless-steel-watches-kenya",
      "curren-watches-kenya",
      "naviforce-watches-kenya",
      "gifts-for-him",
    ],
    filter: (p, catSlug) => ALL_WATCH_SLUGS.has(catSlug) && nameMatches(p, ["leather"]),
  },
  {
    slug: "stainless-steel-watches-kenya",
    path: "/collections/stainless-steel-watches-kenya",
    group: "style",
    shortLabel: "Stainless Steel Watches",
    title: "Stainless Steel Watches in Kenya | 150+ Models",
    metaDescription:
      "Shop 150+ original stainless steel watches in Kenya at Halisi Gifts from KES 2,350. Silver, gold, and two-tone metal bracelet watches with fast delivery.",
    h1: "Original Stainless Steel Watches in Kenya",
    keywords: [
      "stainless steel watches Kenya",
      "metal strap watches Nairobi",
      "gold and silver watches Kenya",
      "waterproof steel watches Kenya",
    ],
    answerHeading: "Original Stainless Steel Watches in Kenya",
    answerCapsule:
      "Halisi Gifts offers over 150 original stainless steel watches in Kenya priced from KES 2,350 to KES 25,750. Built with corrosion-resistant steel bracelets in silver, gold, black, and two-tone finishes from Poedagar, Olevs, Casio, WWOOR, and Seiko, every order ships nationwide for a flat KES 250.",
    comparisonTitle: "Stainless Steel Watch Finishes Available",
    comparisonColumns: ["Finish", "Popular Brands", "Price Range (KES)", "Best For"],
    comparisonRows: [
      ["Silver Stainless Steel", "Poedagar, Casio, Seiko", "KES 2,350 to KES 14,750", "Everyday corporate & versatile wear"],
      ["Gold & Two-Tone Steel", "Olevs, WWOOR, Poedagar", "KES 2,850 to KES 8,550", "Weddings, celebrations & statements"],
      ["Matte Black / Mesh Steel", "CRRJU, Curren, Skmei", "KES 2,650 to KES 5,500", "Modern minimalist & smart-casual"],
    ],
    faqs: [
      {
        question: "Why choose a stainless steel watch over a leather watch?",
        answer:
          "Stainless steel bracelets resist sweat, humidity, and daily wear better than leather, making them ideal for long-term everyday use and warm coastal cities like Mombasa.",
      },
      {
        question: "What is the price of stainless steel watches in Kenya?",
        answer:
          "At Halisi Gifts, original stainless steel watches start at KES 2,350, with most bestsellers between KES 2,850 and KES 6,500.",
      },
      {
        question: "Can stainless steel watch straps be adjusted?",
        answer:
          "Yes. Link bracelets can be shortened by removing pins, and Milanese mesh straps adjust smoothly at the clasp.",
      },
      {
        question: "Do you offer engraving on stainless steel watches?",
        answer:
          "Yes, stainless steel casebacks and clasps engrave cleanly for KES 200 per watch.",
      },
    ],
    relatedSlugs: [
      "poedagar-watches-kenya",
      "olevs-watches-kenya",
      "casio-watches-kenya",
      "luxury-watch-gifts-kenya",
    ],
    filter: (p, catSlug) =>
      ALL_WATCH_SLUGS.has(catSlug) &&
      nameMatches(p, ["steel", "stainless", "metal", "chain", "mesh", "silver", "gold"]),
  },
  {
    slug: "gifts-for-him",
    path: "/gifts-for-him",
    group: "recipient",
    shortLabel: "Gifts for Him",
    title: "Best Gifts for Him in Kenya | Watches & Perfumes",
    metaDescription:
      "Shop curated gifts for him in Kenya at Halisi Gifts from KES 1,150. Original men's watches, Arabian perfumes, and gift sets with free wrapping and Nairobi delivery.",
    h1: "Curated Gifts for Him in Kenya",
    keywords: [
      "gifts for him Kenya",
      "birthday gifts for boyfriend Nairobi",
      "gifts for men Kenya",
      "watch gifts for him Nairobi",
    ],
    answerHeading: "Best Gifts for Him in Nairobi & Kenya",
    answerCapsule:
      "Halisi Gifts curates over 280 original gifts for him in Kenya from KES 1,150 to KES 25,750, including executive Poedagar, Curren, and Casio watches, long-lasting Lattafa Arabian perfumes, and engraved gift sets. Every order includes free luxury wrapping and same-day Nairobi delivery.",
    comparisonTitle: "Top Gift Ideas for Him by Budget (KES)",
    comparisonColumns: ["Gift Idea", "Recommended Pick", "Budget (KES)", "Personalization"],
    comparisonRows: [
      ["Original Arabian Perfume", "Lattafa / Armaf Eau de Parfum", "KES 1,350 to KES 3,800", "Free gift wrap & note card"],
      ["Classic Leather or Steel Watch", "Poedagar, Curren, or CRRJU", "KES 2,350 to KES 5,000", "KES 200 custom engraving"],
      ["Watch + Perfume Combo", "Executive watch + 100ml EDP", "KES 4,500 to KES 8,500", "Luxury hamper box"],
      ["Collector Timepiece", "Casio Edifice or Seiko", "KES 6,000 to KES 25,750", "Engraved caseback"],
    ],
    faqs: [
      {
        question: "What are the best birthday gifts for a man in Kenya?",
        answer:
          "Original wristwatches, long-lasting Arabian Eau de Parfum fragrances, and personalized engraved watch-and-box sets are the most popular birthday gifts for men at Halisi Gifts.",
      },
      {
        question: "Can you deliver a surprise gift for him directly to his office in Nairobi?",
        answer:
          "Yes. Provide his delivery address and phone number at checkout along with your gift message, and our Nairobi rider will deliver it gift-wrapped the same day.",
      },
      {
        question: "How much should I spend on a quality gift for him?",
        answer:
          "You can pick an authentic Arabian perfume or watch from KES 1,500 to KES 5,000, or build an executive watch-and-perfume gift set between KES 5,000 and KES 10,000.",
      },
      {
        question: "Is gift wrapping charged extra?",
        answer:
          "No. Complimentary luxury gift packaging is included with every order at Halisi Gifts.",
      },
    ],
    relatedSlugs: [
      "mens-watches-kenya",
      "birthday-gifts-kenya",
      "gifts-under-5000-kes",
      "luxury-watch-gifts-kenya",
    ],
    filter: (p, catSlug) =>
      MEN_WATCH_SLUGS.has(catSlug) ||
      catSlug === "perfumes-fragrances" ||
      catSlug === "smart-watches" ||
      catSlug === "valentines-gift-sets",
  },
  {
    slug: "gifts-for-her",
    path: "/gifts-for-her",
    group: "recipient",
    shortLabel: "Gifts for Her",
    title: "Best Gifts for Her in Kenya | Watches & Sets",
    metaDescription:
      "Discover thoughtful gifts for her in Kenya from KES 1,150 at Halisi Gifts. Ladies' watches, Arabian perfumes, jewellery, and gift boxes with fast Nairobi delivery.",
    h1: "Thoughtful Gifts for Her in Kenya",
    keywords: [
      "gifts for her Kenya",
      "gifts for girlfriend Nairobi",
      "birthday gifts for women Kenya",
      "ladies watch gift sets Nairobi",
    ],
    answerHeading: "Best Gifts for Her in Nairobi & Kenya",
    answerCapsule:
      "Halisi Gifts features 180+ original gifts for her in Kenya starting at KES 1,150, spanning rose-gold ladies' watches, non-tarnish jewellery, original Arabian perfumes, and curated Valentine's and Mother's Day hampers. Every order includes free gift wrapping and flat KES 250 nationwide delivery.",
    comparisonTitle: "Popular Gifts for Her by Style (KES)",
    comparisonColumns: ["Gift Category", "Highlights", "Price Range (KES)", "Best Occasion"],
    comparisonRows: [
      ["Ladies' Dress Watch", "Olevs, Hannah Martin, WWOOR", "KES 1,650 to KES 6,750", "Birthdays & graduations"],
      ["Arabian Perfumes", "Sweet, floral & oud EDPs", "KES 1,150 to KES 3,800", "Everyday appreciation"],
      ["Curated Gift Sets", "Watch + bracelet or perfume box", "KES 2,800 to KES 7,750", "Anniversaries & Mother's Day"],
      ["Fine Jewellery", "Non-tarnish bangles & necklaces", "KES 550 to KES 4,800", "Thoughtful add-on gifts"],
    ],
    faqs: [
      {
        question: "What are the best gifts for a girlfriend or wife in Nairobi?",
        answer:
          "Rose gold or two-tone ladies' watches, matching watch-and-jewellery gift sets, and long-lasting Arabian perfumes are top customer favorites at Halisi Gifts.",
      },
      {
        question: "Do gifts for her come ready to present?",
        answer:
          "Yes. Every order is packaged in a neat gift box with complimentary gift wrapping so it arrives ready to surprise her.",
      },
      {
        question: "Can I add a custom engraved message on a ladies' watch?",
        answer:
          "Yes, custom watch engraving is KES 200 and adds a lasting personal touch to any birthday or anniversary gift.",
      },
      {
        question: "How fast can you deliver a gift for her in Nairobi?",
        answer:
          "Same-day rider delivery is available across Nairobi, and upcountry courier orders arrive within 24 to 48 hours for KES 250.",
      },
    ],
    relatedSlugs: [
      "womens-watches-nairobi",
      "anniversary-gifts-nairobi",
      "birthday-gifts-kenya",
      "gifts-under-5000-kes",
    ],
    filter: (p, catSlug) =>
      LADIES_WATCH_SLUGS.has(catSlug) ||
      catSlug === "jewellery" ||
      catSlug === "perfumes-fragrances" ||
      catSlug === "mothers-day-gift-sets" ||
      catSlug === "valentines-gift-sets" ||
      catSlug === "bags-purses",
  },
  {
    slug: "birthday-gifts-kenya",
    path: "/birthday-gifts-kenya",
    group: "occasion",
    shortLabel: "Birthday Gifts",
    title: "Birthday Gifts in Kenya | Same-Day Nairobi Delivery",
    metaDescription:
      "Order original birthday gifts in Kenya at Halisi Gifts from KES 1,150. Watches, perfumes, smartwatches, and hampers with free wrapping and same-day Nairobi delivery.",
    h1: "Original Birthday Gifts in Kenya",
    keywords: [
      "birthday gifts Kenya",
      "same day birthday gift delivery Nairobi",
      "birthday gift ideas Nairobi",
      "online gift shop Kenya",
    ],
    answerHeading: "Same-Day Birthday Gift Delivery in Nairobi & Kenya",
    answerCapsule:
      "Halisi Gifts makes birthday gifting effortless with 400+ in-stock original watches, perfumes, smartwatches, and ready-to-gift hampers starting at KES 1,150. Enjoy complimentary gift wrapping, optional KES 200 engraving, Safaricom M-Pesa checkout, and same-day delivery in Nairobi or flat KES 250 shipping countrywide.",
    comparisonTitle: "Birthday Gift Picks by Relationship",
    comparisonColumns: ["Recipient", "Top Gift Pick", "Typical Budget (KES)", "Delivery Speed"],
    comparisonRows: [
      ["Partner / Spouse", "Engraved watch or couple set", "KES 3,500 to KES 8,550", "Same-day in Nairobi"],
      ["Best Friend / Sibling", "Arabian perfume or smartwatch", "KES 1,800 to KES 4,800", "Same-day Nairobi / 24-48h KE"],
      ["Parent / Mentor", "Classic steel watch or gift set", "KES 3,200 to KES 7,500", "Same-day Nairobi / 24-48h KE"],
      ["Colleague", "Minimalist watch or gift box", "KES 1,500 to KES 3,500", "Same-day Nairobi"],
    ],
    faqs: [
      {
        question: "Can I get same-day birthday gift delivery in Nairobi?",
        answer:
          "Yes. Order before late afternoon and our Nairobi delivery team will dispatch your wrapped birthday gift the same day.",
      },
      {
        question: "Can I order a birthday gift from abroad for someone in Kenya?",
        answer:
          "Yes. Many diaspora customers order online at halisigifts.com and have us deliver gift-wrapped watches and perfumes to loved ones across all 47 Kenyan counties.",
      },
      {
        question: "Do birthday gifts include a gift box and ribbon?",
        answer:
          "Yes, free luxury gift packaging is included on every order at Halisi Gifts.",
      },
      {
        question: "What if I am not sure what size to pick?",
        answer:
          "Perfumes, gift sets, leather watches, and mesh-strap watches require no sizing guesswork and make stress-free birthday gifts.",
      },
    ],
    relatedSlugs: [
      "gifts-for-him",
      "gifts-for-her",
      "gifts-under-2000-kes",
      "gifts-under-5000-kes",
    ],
    filter: (p, catSlug) =>
      GIFT_SLUGS.has(catSlug) ||
      ALL_WATCH_SLUGS.has(catSlug),
  },
  {
    slug: "anniversary-gifts-nairobi",
    path: "/anniversary-gifts-nairobi",
    group: "occasion",
    shortLabel: "Anniversary Gifts",
    title: "Anniversary Gifts in Nairobi & Kenya | Halisi Gifts",
    metaDescription:
      "Celebrate with original anniversary gifts in Nairobi from Halisi Gifts. Matching couple watches, engraved timepieces, and luxury gift sets delivered fast.",
    h1: "Meaningful Anniversary Gifts in Nairobi & Kenya",
    keywords: [
      "anniversary gifts Nairobi",
      "anniversary gifts Kenya",
      "couple watch anniversary gift Kenya",
      "engraved watch gift Nairobi",
    ],
    answerHeading: "Romantic Anniversary Gifts Delivered in Nairobi",
    answerCapsule:
      "Halisi Gifts specializes in lasting anniversary gifts in Nairobi and across Kenya, led by matching his-and-hers couple watch sets (KES 1,650 to KES 8,550), luxury engraved watches, and curated perfume hampers. Add KES 200 custom engraving and enjoy free gift wrapping with same-day Nairobi delivery.",
    comparisonTitle: "Anniversary Gift Ideas in KES",
    comparisonColumns: ["Anniversary Gift", "Why It Works", "Price Range (KES)", "Extra Touch"],
    comparisonRows: [
      ["His & Hers Couple Watches", "Matching keepsake you both wear", "KES 1,650 to KES 8,550", "Engrave your anniversary date"],
      ["Luxury Watch + Perfume Set", "Complete signature presentation", "KES 4,500 to KES 9,500", "Free luxury hamper wrap"],
      ["Executive Solo Watch", "Timeless daily reminder", "KES 3,500 to KES 14,750", "Caseback inscription (KES 200)"],
    ],
    faqs: [
      {
        question: "What is the most popular anniversary gift in Nairobi?",
        answer:
          "Matching couple watch sets and custom-engraved stainless steel watches are our bestselling anniversary gifts because they are practical, personal, and built to last.",
      },
      {
        question: "Can you engrave our anniversary date on the watch?",
        answer:
          "Yes. Add your short inscription or date at checkout for KES 200 per item.",
      },
      {
        question: "How fast can you deliver an anniversary gift in Nairobi?",
        answer:
          "We offer same-day rider delivery across Nairobi and 24 to 48 hour tracked courier shipping countrywide for KES 250.",
      },
      {
        question: "Are the perfumes and watches in your gift sets original?",
        answer:
          "Yes. Halisi means authentic in Swahili, and every watch and fragrance is 100% genuine.",
      },
    ],
    relatedSlugs: [
      "couple-watches-kenya",
      "gifts-for-her",
      "gifts-for-him",
      "luxury-watch-gifts-kenya",
    ],
    filter: (p, catSlug) =>
      catSlug === "watches-couple-sets" ||
      catSlug === "valentines-gift-sets" ||
      catSlug === "perfumes-fragrances" ||
      catSlug === "jewellery" ||
      (ALL_WATCH_SLUGS.has(catSlug) && p.price >= 3500),
  },
  {
    slug: "graduation-gifts-kenya",
    path: "/graduation-gifts-kenya",
    group: "occasion",
    shortLabel: "Graduation Gifts",
    title: "Graduation Gifts in Kenya | Watches & Keepsakes",
    metaDescription:
      "Celebrate a graduate with original watches, smartwatches, and gift sets in Kenya from KES 1,650 at Halisi Gifts. Custom engraving and same-day Nairobi delivery.",
    h1: "Original Graduation Gifts in Kenya",
    keywords: [
      "graduation gifts Kenya",
      "graduation watch gift Nairobi",
      "university graduation gift ideas Kenya",
      "engraved graduation watch Kenya",
    ],
    answerHeading: "Timeless Graduation Gift Ideas in Kenya",
    answerCapsule:
      "A classic wristwatch marks a graduate's transition into their career. Halisi Gifts stocks original career-ready dress watches, Bluetooth smartwatches, and perfume gift sets from KES 1,650 to KES 14,750, complete with KES 200 custom engraving, free gift wrapping, and flat KES 250 nationwide Kenya delivery.",
    comparisonTitle: "Graduation Gift Recommendations (KES)",
    comparisonColumns: ["Graduate Style", "Best Gift Choice", "Price Range (KES)", "Engraving Idea"],
    comparisonRows: [
      ["Corporate / Law / Finance", "Classic steel or leather dress watch", "KES 2,850 to KES 8,500", "Class of 2026 + Initials"],
      ["Tech / Creative", "Bluetooth smartwatch or minimalist mesh", "KES 2,650 to KES 6,150", "Name on gift box"],
      ["Ladies' Graduation", "Slim rose-gold watch + perfume set", "KES 2,650 to KES 6,500", "Short milestone date"],
    ],
    faqs: [
      {
        question: "Why is a watch the best graduation gift in Kenya?",
        answer:
          "An original wristwatch is both a lasting keepsake and an everyday confidence booster for job interviews and a graduate's first workplace.",
      },
      {
        question: "Can I engrave the graduate's name or graduation year?",
        answer:
          "Yes. Custom laser engraving costs KES 200 per watch and turns any timepiece into a permanent keepsake.",
      },
      {
        question: "What is a good budget for a university graduation gift?",
        answer:
          "Most graduation shoppers spend between KES 2,500 and KES 6,000 for an original Poedagar, Curren, Olevs, CRRJU, or Casio watch with gift wrapping included.",
      },
      {
        question: "Do you deliver graduation gifts outside Nairobi?",
        answer:
          "Yes. We ship countrywide to Eldoret, Nakuru, Kisumu, Mombasa, Juja, and all 47 counties for a flat KES 250.",
      },
    ],
    relatedSlugs: [
      "crrju-watches-kenya",
      "casio-watches-kenya",
      "gifts-under-5000-kes",
      "corporate-gifts-nairobi",
    ],
    filter: (p, catSlug) =>
      ALL_WATCH_SLUGS.has(catSlug) || catSlug === "perfumes-fragrances" || catSlug === "accessories-gift-boxes",
  },
  {
    slug: "corporate-gifts-nairobi",
    path: "/corporate-gifts-nairobi",
    group: "occasion",
    shortLabel: "Corporate Gifts",
    title: "Corporate & Executive Gifts in Nairobi | Halisi",
    metaDescription:
      "Order original executive watches, engraved gift boxes, and corporate gifts in Nairobi at Halisi Gifts. Bulk discounts, M-Pesa invoicing, and fast delivery.",
    h1: "Corporate & Executive Gifts in Nairobi",
    keywords: [
      "corporate gifts Nairobi",
      "executive gift sets Kenya",
      "branded watch corporate gifts Nairobi",
      "employee appreciation gifts Kenya",
    ],
    answerHeading: "Executive & Corporate Gifting Solutions in Nairobi",
    answerCapsule:
      "Halisi Gifts supplies Kenyan businesses with original executive watches, presentation gift boxes, and signature fragrances starting from KES 2,000 per recipient. We offer custom KES 200 laser engraving for employee awards or client milestones, uniform luxury packaging, and reliable same-day dispatch across Nairobi.",
    comparisonTitle: "Corporate Gifting Tiers in Nairobi (KES)",
    comparisonColumns: ["Tier", "Recommended Items", "Unit Budget (KES)", "Ideal Use Case"],
    comparisonRows: [
      ["Staff Appreciation", "Minimalist watches or gift boxes", "KES 2,000 to KES 3,500", "Team milestones & end-of-year"],
      ["Client Appreciation", "Executive Poedagar / Olevs watches", "KES 3,500 to KES 6,000", "Key accounts & partners"],
      ["VIP & Boardroom", "Casio Edifice, Seiko, luxury sets", "KES 6,500 to KES 25,750", "Retirements & executive awards"],
    ],
    faqs: [
      {
        question: "Can Halisi Gifts engrave company names or employee initials on watches?",
        answer:
          "Yes. We provide clean laser engraving on watch casebacks, clasps, and gift boxes at KES 200 per item, with custom quotes for larger corporate orders.",
      },
      {
        question: "How do I place a bulk corporate gift order in Nairobi?",
        answer:
          "Browse models here or message our team on WhatsApp (+254729596165) with your quantity, target KES budget per unit, and delivery date for a fast tailored quote.",
      },
      {
        question: "Are corporate gifts individually gift-wrapped?",
        answer:
          "Yes. Every item is packed in its presentation box with uniform luxury wrapping ready for boardroom handover.",
      },
      {
        question: "How fast can corporate gifts be delivered in Nairobi?",
        answer:
          "In-stock orders can be dispatched the same day within Nairobi, while bulk engraved orders typically take 24 to 48 hours.",
      },
    ],
    relatedSlugs: [
      "luxury-watch-gifts-kenya",
      "stainless-steel-watches-kenya",
      "poedagar-watches-kenya",
      "gifts-under-10000-kes",
    ],
    filter: (p, catSlug) =>
      (ALL_WATCH_SLUGS.has(catSlug) && p.price >= 2800) ||
      catSlug === "accessories-gift-boxes" ||
      catSlug === "perfumes-fragrances",
  },
  {
    slug: "gifts-under-2000-kes",
    path: "/gifts-under-2000-kes",
    group: "budget",
    shortLabel: "Gifts Under KES 2,000",
    title: "Best Gifts Under KES 2,000 in Kenya | Halisi Gifts",
    metaDescription:
      "Shop 50+ original gifts under KES 2,000 in Kenya at Halisi Gifts. Authentic watches, Arabian perfumes, jewellery, and gift boxes with fast Nairobi delivery.",
    h1: "Original Gifts Under KES 2,000 in Kenya",
    keywords: [
      "gifts under 2000 Kenya",
      "affordable gifts Nairobi",
      "watches under 2000 KES",
      "perfumes under 2000 Kenya",
    ],
    answerHeading: "Best Original Gifts Under KES 2,000 in Kenya",
    answerCapsule:
      "Halisi Gifts stocks over 50 authentic gifts under KES 2,000 in Kenya, including original Casio and Hannah Martin watches, genuine Lattafa Arabian perfumes, non-tarnish jewellery, and presentation gift boxes. Every affordable gift still includes free wrapping and flat KES 250 nationwide Kenya shipping.",
    comparisonTitle: "What You Can Buy Under KES 2,000",
    comparisonColumns: ["Category", "Starting Price (KES)", "Best Picks", "Gift Wrap"],
    comparisonRows: [
      ["Original Watches", "KES 950", "Casio digital & minimalist ladies' watches", "Included free"],
      ["Arabian Perfumes", "KES 1,150", "Lattafa & Eau de Parfum favourites", "Included free"],
      ["Jewellery & Accessories", "KES 550", "Bracelets, earrings & watch boxes", "Included free"],
      ["Couple & Mini Gift Sets", "KES 1,250", "Compact ready-to-gift bundles", "Included free"],
    ],
    faqs: [
      {
        question: "Can I really get an original watch under KES 2,000 in Kenya?",
        answer:
          "Yes. Halisi Gifts stocks authentic Casio digital models, minimalist ladies' watches, and starter gift sets starting from KES 950 to KES 2,000.",
      },
      {
        question: "Are perfumes under KES 2,000 original?",
        answer:
          "Yes, every Arabian fragrance we stock is 100% original and sealed.",
      },
      {
        question: "Is gift wrapping free on orders under KES 2,000?",
        answer:
          "Yes. Complimentary gift wrapping is included regardless of order value.",
      },
      {
        question: "How much is delivery for items under KES 2,000?",
        answer:
          "Standard delivery is a flat KES 250 anywhere in Kenya, with same-day dispatch in Nairobi.",
      },
    ],
    relatedSlugs: [
      "gifts-under-5000-kes",
      "birthday-gifts-kenya",
      "gifts-for-her",
      "gifts-for-him",
    ],
    filter: (p) => p.price <= 2000,
  },
  {
    slug: "gifts-under-5000-kes",
    path: "/gifts-under-5000-kes",
    group: "budget",
    shortLabel: "Gifts Under KES 5,000",
    title: "Best Gifts Under KES 5,000 in Kenya | 490+ Picks",
    metaDescription:
      "Browse 490+ original gifts under KES 5,000 in Kenya at Halisi Gifts. Poedagar, Curren, Olevs, CRRJU watches, perfumes, and gift sets with fast delivery.",
    h1: "Best Original Gifts Under KES 5,000 in Kenya",
    keywords: [
      "gifts under 5000 Kenya",
      "watches under 5000 KES Nairobi",
      "best watch gifts under 5000 Kenya",
      "affordable luxury gifts Nairobi",
    ],
    answerHeading: "Top Original Gifts Under KES 5,000 in Kenya",
    answerCapsule:
      "With 490+ active products under KES 5,000, this is Halisi Gifts' most popular Kenyan gifting tier. Shop original Poedagar, Curren, Olevs, CRRJU, Skmei, and Naviforce watches, smartwatches, and Arabian perfumes, all backed by our authenticity guarantee, free gift wrapping, and flat KES 250 nationwide delivery.",
    comparisonTitle: "Best Value Gifts Under KES 5,000",
    comparisonColumns: ["Gift Type", "Top Brands", "Typical Price (KES)", "Why Buyers Love It"],
    comparisonRows: [
      ["Men's Executive Watches", "Poedagar, Curren, Olevs, CRRJU", "KES 2,350 to KES 4,950", "Luxury look with reliable quartz accuracy"],
      ["Ladies' Dress Watches", "Olevs, WWOOR, Hannah Martin", "KES 1,650 to KES 4,800", "Gift-boxed and ready to wear"],
      ["Bluetooth Smartwatches", "Colmi, Kalobee, Ultra sets", "KES 2,650 to KES 4,800", "Multi-strap tech value"],
      ["Perfumes & Gift Sets", "Lattafa, Armaf, curated boxes", "KES 1,150 to KES 4,800", "Zero sizing guesswork"],
    ],
    faqs: [
      {
        question: "Which original watch brands can I buy under KES 5,000 in Kenya?",
        answer:
          "Under KES 5,000, you can choose from original Poedagar, Curren, Olevs, CRRJU, Naviforce, Skmei, WWOOR, Lige, Hannah Martin, and classic Casio models.",
      },
      {
        question: "Can I add engraving and stay under KES 5,000?",
        answer:
          "Yes. With most watches priced between KES 2,650 and KES 4,500, adding KES 200 custom engraving and KES 250 delivery still keeps your total under KES 5,000.",
      },
      {
        question: "Do orders under KES 5,000 qualify for same-day Nairobi delivery?",
        answer:
          "Yes. Same-day rider delivery in Nairobi and 24 to 48 hour countrywide courier shipping apply to all orders.",
      },
      {
        question: "What payment options are available?",
        answer:
          "You can pay with Safaricom M-Pesa, debit/credit card, or our flexible delivery payment options.",
      },
    ],
    relatedSlugs: [
      "gifts-under-2000-kes",
      "gifts-under-10000-kes",
      "poedagar-watches-kenya",
      "curren-watches-kenya",
    ],
    filter: (p) => p.price <= 5000,
  },
  {
    slug: "gifts-under-10000-kes",
    path: "/gifts-under-10000-kes",
    group: "budget",
    shortLabel: "Gifts Under KES 10,000",
    title: "Best Gifts Under KES 10,000 in Kenya | Halisi Gifts",
    metaDescription:
      "Explore 540+ original watches, couple sets, perfumes, and luxury hampers under KES 10,000 in Kenya at Halisi Gifts. Free gift wrapping and fast delivery.",
    h1: "Premium Gifts Under KES 10,000 in Kenya",
    keywords: [
      "gifts under 10000 Kenya",
      "best watches under 10000 KES Kenya",
      "luxury gifts under 10000 Nairobi",
      "couple watch sets under 10000",
    ],
    answerHeading: "Best Watch & Gift Picks Under KES 10,000 in Kenya",
    answerCapsule:
      "Halisi Gifts offers over 540 original watches, couple watch sets, smartwatches, and curated hampers under KES 10,000 in Kenya. From Seiko and Casio stainless steel models to matching his-and-hers sets, every order includes complimentary gift packaging and flat KES 250 shipping across all 47 counties.",
    comparisonTitle: "Standout Gifts Between KES 5,000 and KES 10,000",
    comparisonColumns: ["Category", "Featured Models", "Price Range (KES)", "Best Occasion"],
    comparisonRows: [
      ["Japanese & Premium Watches", "Seiko, Casio, Poedagar Chrono", "KES 4,800 to KES 9,250", "Promotions & 30th/40th birthdays"],
      ["His & Hers Couple Sets", "Coordinated steel & leather pairs", "KES 4,200 to KES 8,550", "Weddings & anniversaries"],
      ["Deluxe Gift Hampers", "Watch + perfume + box bundles", "KES 5,000 to KES 9,500", "Valentine's & Mother's Day"],
    ],
    faqs: [
      {
        question: "What are the best men's watches under KES 10,000 in Kenya?",
        answer:
          "Top choices under KES 10,000 include Seiko dress watches, Casio stainless steel models, Poedagar chronographs, and Olevs executive day-date watches.",
      },
      {
        question: "Can I build a custom gift bundle under KES 10,000?",
        answer:
          "Yes. Combine any watch with an original Arabian perfume and custom KES 200 engraving in your cart, and we will wrap everything together as one presentation hamper.",
      },
      {
        question: "Are all items under KES 10,000 covered by a return policy?",
        answer:
          "Yes. Every order carries our 7-day exchange policy and 100% authenticity guarantee.",
      },
      {
        question: "How fast is countrywide delivery in Kenya?",
        answer:
          "Nairobi orders arrive the same day, while Mombasa, Kisumu, Nakuru, Eldoret, and upcountry parcels arrive within 24 to 48 hours for KES 250.",
      },
    ],
    relatedSlugs: [
      "luxury-watch-gifts-kenya",
      "gifts-under-5000-kes",
      "couple-watches-kenya",
      "corporate-gifts-nairobi",
    ],
    filter: (p) => p.price <= 10000,
  },
  {
    slug: "luxury-watch-gifts-kenya",
    path: "/luxury-watch-gifts-kenya",
    group: "budget",
    shortLabel: "Luxury Watch Gifts",
    title: "Luxury Watch Gifts in Kenya | KES 5,000+",
    metaDescription:
      "Shop 60+ premium and luxury watch gifts in Kenya from KES 5,000 to KES 25,750 at Halisi Gifts. Seiko, Casio Edifice, Poedagar, and couple sets with engraving.",
    h1: "Luxury Watch Gifts in Kenya",
    keywords: [
      "luxury watch gifts Kenya",
      "premium watches Nairobi",
      "executive watches Kenya",
      "Seiko and Casio watches Nairobi",
    ],
    answerHeading: "Premium & Luxury Watch Gifts in Nairobi & Kenya",
    answerCapsule:
      "Halisi Gifts curates 60+ premium and luxury watch gifts in Kenya priced from KES 5,000 to KES 25,750. Featuring Seiko, Casio Edifice, top-tier Poedagar chronographs, and luxury couple sets, every timepiece includes complimentary presentation wrapping, optional KES 200 engraving, and secure nationwide Kenya delivery.",
    comparisonTitle: "Luxury Watch Gift Tiers (KES 5,000+)",
    comparisonColumns: ["Tier", "Standout Brands", "Price Range (KES)", "Milestone Match"],
    comparisonRows: [
      ["Executive Chronograph", "Poedagar, Olevs, WWOOR", "KES 5,000 to KES 7,550", "Promotions & executive birthdays"],
      ["Matching Luxury Pairs", "Premium His & Hers Sets", "KES 5,500 to KES 8,550", "Weddings & milestone anniversaries"],
      ["Collector Japanese & Heritage", "Seiko, Casio Edifice, Luxury Steel", "KES 7,500 to KES 25,750", "VIP, retirement & boardroom gifts"],
    ],
    faqs: [
      {
        question: "How much do luxury watch gifts cost at Halisi Gifts?",
        answer:
          "Our luxury watch gift tier starts at KES 5,000 and extends to KES 25,750 for collector-grade stainless steel and chronograph models.",
      },
      {
        question: "Do luxury watch gifts come with authenticity assurance?",
        answer:
          "Yes. Every timepiece is verified 100% genuine before dispatch and backed by our 7-day exchange guarantee.",
      },
      {
        question: "Is custom watch engraving recommended for luxury gifts?",
        answer:
          "Yes. Adding initials, a name, or a milestone date for KES 200 elevates a luxury watch into a one-of-a-kind heirloom gift.",
      },
      {
        question: "How are high-value watches delivered safely across Kenya?",
        answer:
          "Nairobi orders are hand-delivered by trusted riders the same day, and upcountry parcels ship via tracked courier within 24 to 48 hours.",
      },
    ],
    relatedSlugs: [
      "casio-watches-kenya",
      "stainless-steel-watches-kenya",
      "corporate-gifts-nairobi",
      "anniversary-gifts-nairobi",
    ],
    filter: (p, catSlug) => ALL_WATCH_SLUGS.has(catSlug) && p.price >= 5000,
  },
];

const COLLECTION_BY_SLUG = new Map<string, SeoCollectionConfig>(
  SEO_COLLECTIONS.map((c) => [c.slug, c])
);

export function getSeoCollectionBySlug(slug: string): SeoCollectionConfig | undefined {
  return COLLECTION_BY_SLUG.get(slug);
}

export function getCollectionSubpathSlugs(): string[] {
  return SEO_COLLECTIONS.filter((c) => c.path.startsWith("/collections/")).map((c) => c.slug);
}

export function filterCatalogForSeoCollection(
  catalog: ShopCatalog,
  config: SeoCollectionConfig
): { products: ShopProduct[]; categories: ShopCategory[] } {
  const slugById = Object.fromEntries(catalog.categories.map((c) => [c.id, c.slug]));
  const products = catalog.products.filter((p) => config.filter(p, slugById[p.categoryId] ?? ""));
  const usedIds = new Set(products.map((p) => p.categoryId));
  const categories = catalog.categories.filter((c) => usedIds.has(c.id));
  return { products, categories };
}

export function buildSeoCollectionMetadata(config: SeoCollectionConfig): Metadata {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
  const fullUrl = `${siteUrl}${config.path}`;
  const ogImage = `${siteUrl}/videos/hero-poster.jpg`;

  return {
    title: config.title,
    description: config.metaDescription,
    keywords: config.keywords,
    alternates: {
      canonical: config.path,
    },
    openGraph: {
      title: `${config.title} | Halisi Gifts`,
      description: config.metaDescription,
      url: fullUrl,
      siteName: "Halisi Gifts",
      locale: "en_KE",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${config.h1} - Halisi Gifts Kenya`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${config.title} | Halisi Gifts`,
      description: config.metaDescription,
      images: [ogImage],
    },
  };
}
