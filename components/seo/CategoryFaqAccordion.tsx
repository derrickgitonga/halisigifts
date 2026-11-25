"use client";

import { useState } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { getFaqSchema, type FaqItem } from "@/lib/seo-schemas";

interface CategoryFaqAccordionProps {
  categoryName: string;
  faqs: FaqItem[];
  includeSchema?: boolean;
  className?: string;
}

export default function CategoryFaqAccordion({
  categoryName,
  faqs,
  includeSchema = false,
  className = "",
}: CategoryFaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) return null;

  return (
    <section
      aria-labelledby="category-faq-heading"
      className={className}
    >
      {includeSchema && <JsonLd schema={getFaqSchema(faqs)} />}
      <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] gap-6 md:gap-12">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-2">
            FAQ
          </span>
          <h2
            id="category-faq-heading"
            className="font-heading text-xl md:text-2xl text-black leading-snug"
          >
            {categoryName} in Kenya
          </h2>
          <p className="text-xs text-black/55 mt-2 leading-relaxed">
            Common questions about our {categoryName.toLowerCase()} collection, delivery, and
            authenticity.{" "}
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
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-3.5 text-left flex justify-between items-center gap-4 group focus:outline-none focus-visible:text-gold"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm text-black group-hover:text-gold transition-colors">
                    {faq.question}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[18px] text-black/40 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  >
                    add
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-4 pr-8 text-[13px] text-black/65 leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
