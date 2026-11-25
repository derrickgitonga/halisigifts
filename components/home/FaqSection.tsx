"use client";

import { useState } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { getFaqSchema, FaqItem } from "@/lib/seo-schemas";

export const HOME_FAQS: FaqItem[] = [
  {
    question: "Where can I buy original luxury and everyday watches online in Kenya?",
    answer:
      "You can order 100% genuine luxury, analogue, digital, and smart watches directly on halisigifts.com with fast delivery anywhere in Kenya. Every timepiece is verified authentic and includes free gift packaging.",
  },
  {
    question: "Do you offer personalized custom watch engraving in Kenya?",
    answer:
      "Yes, Halisi Gifts Shop offers professional laser engraving on watch casebacks, dials, and gift boxes for KSh 200 per piece. You can customize watches with names, dates, initials, or heartfelt personal messages directly during online checkout.",
  },
  {
    question: "How fast is delivery across Nairobi and upcountry Kenya?",
    answer:
      "Orders placed on halisigifts.com enjoy same-day dispatch across Nairobi and 24 to 48 hour tracked courier delivery across all 47 counties in Kenya (Mombasa, Kisumu, Nakuru, Eldoret, Thika, and more) for a flat KSh 250 fee. Optional Nairobi CBD pickup is also available at checkout.",
  },
  {
    question: "What payment methods are supported at Halisi Gifts Shop?",
    answer:
      "We accept Safaricom M-Pesa, card payments, instant WhatsApp order verification, and cash on delivery or shop pickup in Nairobi CBD.",
  },
  {
    question: "Are your watches water resistant and battery backed?",
    answer:
      "Yes, all water-resistant analogue, digital, and dual-time models are clearly specified with depth ratings. Watches come equipped with factory-fresh batteries, original packaging, and user manuals.",
  },
  {
    question: "How do I follow up or track my order after checkout?",
    answer:
      "Use the Track Your Order page (halisigifts.com/track-order) with your order number and the phone number or email you used at checkout to see whether your order is confirmed, on the way or delivered. You can also WhatsApp us on +254729596165 for an update.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqSchema = getFaqSchema(HOME_FAQS);

  return (
    <section className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
      <JsonLd schema={faqSchema} />
      <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] gap-6 md:gap-12">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-2">FAQ</span>
          <h2 className="font-heading text-xl md:text-2xl text-black leading-snug">Questions, answered</h2>
          <p className="text-xs text-black/55 mt-2 leading-relaxed">
            More help?{" "}
            <a
              href="https://wa.me/254729596165"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline underline-offset-4"
            >
              WhatsApp us
            </a>
          </p>
        </div>

        <div className="divide-y divide-black/10 border-y border-black/10">
          {HOME_FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-3.5 text-left flex justify-between items-center gap-4 group focus:outline-none focus-visible:text-gold"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm text-black group-hover:text-gold transition-colors">{faq.question}</span>
                  <span
                    className={`material-symbols-outlined text-[18px] text-black/40 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  >
                    add
                  </span>
                </button>
                {isOpen && <p className="pb-4 pr-8 text-[13px] text-black/65 leading-relaxed">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
