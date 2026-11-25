import type { Metadata } from "next";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About Us | Halisi Gifts Shop Nairobi Kenya",
  description:
    "Learn about Halisi Gifts Shop, Kenya's trusted retailer of luxury watches, precision timepieces, and executive gifts based in Nairobi CBD.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="w-full flex-grow max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg space-y-8">
        <h1 className="font-display-lg text-3xl md:text-display-lg text-black text-center">About Halisi Gifts Shop</h1>
        <p className="font-body-lg text-black/80 leading-relaxed text-center max-w-2xl mx-auto">
          Founded in Nairobi, Kenya, Halisi Gifts Shop is dedicated to offering curated luxury timepieces, high-grade analogue & digital watches, and premium executive gift sets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-black/10">
          <div className="bg-white p-6 border border-black/10 rounded-lg space-y-3">
            <h2 className="font-headline-md text-headline-md text-black">Our Philosophy</h2>
            <p className="font-body-md text-black/70">
              We believe a watch is more than a tool to measure hours; it is an emblem of personal milestone, precision craft, and lasting heritage.
            </p>
          </div>
          <div className="bg-white p-6 border border-black/10 rounded-lg space-y-3" id="sustainability">
            <h2 className="font-headline-md text-headline-md text-black">Sustainability</h2>
            <p className="font-body-md text-black/70">
              We prioritize ethically sourced materials, recyclable wooden collector boxes, and long-lasting mechanical repairability to minimize environmental impact.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
