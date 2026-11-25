import type { FaqItem } from "@/lib/seo-schemas";

export function getCategoryFaqs(categorySlug: string, categoryName: string): FaqItem[] {
  const slug = categorySlug.toLowerCase();
  const label = categoryName.trim() || "Gifts & Watches";

  if (slug.includes("smart-watch")) {
    return [
      {
        question: `Where can I buy original ${label} online in Kenya?`,
        answer: `Order 100% genuine ${label} directly on halisigifts.com with fast delivery anywhere in Kenya. Every smartwatch is tested before dispatch and ships in original packaging with charging accessories.`,
      },
      {
        question: `Do your ${label} work with both Android and iPhone (iOS)?`,
        answer: `Yes. Our Bluetooth calling smartwatches, AMOLED fitness trackers, and multi-strap Ultra combo sets pair seamlessly with both Android smartphones and Apple iPhones for calls, WhatsApp notifications, step tracking, and health monitoring.`,
      },
      {
        question: `What smartwatch brands and combo sets are available on halisigifts.com?`,
        answer: `Halisi Gifts stocks popular models including Colmi, Kalobee, Oraimo, and multi-strap Ultra combo smartwatch sets with interchangeable silicone, ocean, and metal bands at competitive KES prices.`,
      },
      {
        question: `How much is delivery for ${label} across Kenya?`,
        answer: `Delivery is a flat KSh 250 nationwide, with same-day dispatch in Nairobi and 24 to 48 hour tracked courier delivery to Mombasa, Kisumu, Nakuru, Eldoret, and all 47 counties.`,
      },
      {
        question: `Do ${label} come with free gift packaging?`,
        answer: `Yes, all online orders on halisigifts.com include complimentary gift packaging, ready for birthdays, graduations, or corporate gifting.`,
      },
    ];
  }

  if (slug.includes("perfume") || slug.includes("fragrance")) {
    return [
      {
        question: `Are the ${label} on halisigifts.com 100% original in Kenya?`,
        answer: `Yes. Halisi Gifts Shop only sells 100% authentic, factory-sealed Arabian and designer perfumes online in Kenya, including long-lasting Eau de Parfum fragrances from Lattafa, Armaf, Afnan, Mousuf, Gissah, and Al Haramain.`,
      },
      {
        question: `How long do Arabian Eau de Parfum fragrances last?`,
        answer: `Our authentic Arabian and oud perfumes feature high fragrance oil concentrations designed to last 8 to 12+ hours on skin and even longer on clothing, ideal for Kenya's climate.`,
      },
      {
        question: `Can I order ${label} as a wrapped gift online?`,
        answer: `Yes. Every perfume ordered on halisigifts.com includes free luxury gift packaging, and you can pair your fragrance with a watch, jewellery piece, or personalized message at checkout.`,
      },
      {
        question: `How fast is perfume delivery across Kenya?`,
        answer: `We offer same-day dispatch across Nairobi and 24 to 48 hour secure courier delivery to all 47 Kenyan counties for a flat KSh 250 fee.`,
      },
    ];
  }

  if (slug.includes("jewellery") || slug.includes("jewelry") || slug.includes("bag") || slug.includes("purse")) {
    return [
      {
        question: `Is the ${label} on halisigifts.com non-tarnish?`,
        answer: `Yes. Our curated ${label} collection features durable stainless steel, gold-plated, and crystal-accented necklaces, bracelets, earrings, and matching sets designed to resist tarnishing with everyday wear.`,
      },
      {
        question: `Where can I shop matching ${label} sets online in Kenya?`,
        answer: `Browse and order directly on halisigifts.com for ready-to-wear matching jewellery sets, pearl chokers, and elegant evening accessories delivered anywhere in Kenya.`,
      },
      {
        question: `Do ${label} orders include gift boxes and wrapping?`,
        answer: `Yes, every order on halisigifts.com includes complimentary gift packaging so it arrives ready for weddings, anniversaries, Valentine's Day, Mother's Day, or birthdays.`,
      },
      {
        question: `What is the delivery fee for ${label} across Kenya?`,
        answer: `Delivery is a flat KSh 250 countrywide with same-day Nairobi delivery and 1 to 2 business day courier delivery to Mombasa, Kisumu, Nakuru, Eldoret, and beyond.`,
      },
    ];
  }

  if (slug.includes("gift") || slug.includes("box") || slug.includes("hamper") || slug.includes("accessories")) {
    return [
      {
        question: `What is included in ${label} on halisigifts.com?`,
        answer: `Our ${label} feature curated combinations of original watches, authentic perfumes, jewellery, wallets, sunglasses, and luxury wooden or leather presentation boxes, all finished with free gift packaging.`,
      },
      {
        question: `Can I add custom engraving or a personal note when ordering online?`,
        answer: `Yes. During checkout on halisigifts.com, you can add precision laser engraving for KSh 200 per watch and include a complimentary personalized message for the recipient.`,
      },
      {
        question: `Do you offer same-day gift delivery in Nairobi and nationwide?`,
        answer: `Yes. We dispatch same-day deliveries across Nairobi and 24 to 48 hour courier parcels across all 47 counties in Kenya for a flat KSh 250 fee.`,
      },
      {
        question: `Do you handle corporate, anniversary, and birthday gift orders?`,
        answer: `Yes. Whether you need a single birthday hamper or bulk corporate gift sets in Kenya, order directly on halisigifts.com or message us on WhatsApp at +254729596165.`,
      },
    ];
  }

  if (slug.includes("ladies") || slug.includes("women")) {
    return [
      {
        question: `Where can I buy original ${label} online in Kenya?`,
        answer: `Shop 100% genuine ${label} directly on halisigifts.com, featuring gold, rose gold, silver, mesh, and leather wristwatches from Curren, Olevs, Casio, Poedagar, Scottie, and more with fast delivery across Kenya.`,
      },
      {
        question: `Are your ${label} water-resistant and equipped with reliable movement?`,
        answer: `Yes. Our ladies' timepieces use accurate Japanese quartz movement with factory-fresh batteries and everyday splash or water resistance as specified on each product page.`,
      },
      {
        question: `Can I personalize ${label} with custom engraving and gift wrapping?`,
        answer: `Yes. Free gift packaging is included on every watch ordered on halisigifts.com, and you can add custom laser engraving (names, dates, or initials) for KSh 200 at checkout.`,
      },
      {
        question: `How much is delivery for ${label} across Kenya?`,
        answer: `Delivery is a flat KSh 250 nationwide, with same-day dispatch in Nairobi and 24 to 48 hour tracked courier delivery across all 47 Kenyan counties.`,
      },
    ];
  }

  if (slug.includes("watch") || slug.includes("analogue") || slug.includes("digital")) {
    return [
      {
        question: `Where can I buy 100% original ${label} online in Kenya?`,
        answer: `Order genuine ${label} directly on halisigifts.com with fast nationwide delivery. We stock verified models from Casio, Poedagar, Curren, Naviforce, Olevs, Citizen, Lige, Skmei, Foxbox, and more.`,
      },
      {
        question: `Are ${label} on halisigifts.com water-resistant and original?`,
        answer: `Yes. Every timepiece is 100% certified genuine with reliable quartz or digital movement, factory-fresh batteries, original brand packaging, and clearly listed water-resistance ratings.`,
      },
      {
        question: `Do you offer custom watch engraving online in Kenya?`,
        answer: `Yes. Add precision laser engraving on watch casebacks and gift boxes for KSh 200 per watch during checkout on halisigifts.com, plus complimentary luxury gift packaging on all orders.`,
      },
      {
        question: `How fast is delivery for ${label} across Kenya?`,
        answer: `We provide same-day delivery within Nairobi and 24 to 48 hour tracked courier delivery to Mombasa, Kisumu, Nakuru, Eldoret, Thika, and all 47 counties for a flat KSh 250 fee.`,
      },
    ];
  }

  return [
    {
      question: `Where can I buy original ${label} online in Kenya?`,
      answer: `Order 100% genuine ${label} directly on halisigifts.com with fast, reliable delivery across Kenya.`,
    },
    {
      question: `Are all ${label} on halisigifts.com certified genuine?`,
      answer: `Yes. Every product in our ${label} collection is verified authentic, carefully inspected before dispatch, and backed by our 7-day exchange policy.`,
    },
    {
      question: `How much is delivery for ${label} across Kenya?`,
      answer: `Delivery is a flat KSh 250 nationwide, with same-day Nairobi dispatch and 24 to 48 hour courier delivery across all 47 Kenyan counties.`,
    },
    {
      question: `Do ${label} orders include free gift packaging?`,
      answer: `Yes. Complimentary gift packaging is included on all orders on halisigifts.com, with optional custom laser engraving available at checkout for KSh 200 per watch.`,
    },
  ];
}
