import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import TrackOrderView from "./TrackOrderView";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the status of your Halisi Gifts Shop order using your order number and phone number.",
  alternates: { canonical: "/track-order" },
  robots: { index: true, follow: true },
};

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="w-full flex-grow">
        <div className="border-b border-black/[0.06]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-10 pb-8 md:pt-14 md:pb-10">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-3">
              Order status
            </span>
            <h1 className="font-heading text-3xl md:text-4xl text-black">Track your order</h1>
            <p className="mt-3 text-sm md:text-base text-black/60 max-w-xl">
              Enter the order number from your confirmation and the phone number or email you used at checkout.
            </p>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
          <Suspense fallback={null}>
            <TrackOrderView />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
