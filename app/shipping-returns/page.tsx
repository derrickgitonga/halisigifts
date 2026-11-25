import type { Metadata } from "next";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Delivery & Returns Policy | Halisi Gifts Shop Kenya",
  description:
    "Information on same-day Nairobi rider dispatch, countrywide parcel delivery across Kenya, and our 3-day return policy at Halisi Gifts Shop.",
  alternates: {
    canonical: "/shipping-returns",
  },
};

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="w-full flex-grow max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg space-y-8">
        <h1 className="font-display-lg text-3xl md:text-display-lg text-black text-center">Shipping & Returns</h1>

        <div className="bg-white p-8 border border-black/10 rounded-lg space-y-6 text-sm text-black/80 leading-relaxed">
          <div>
            <h2 className="font-headline-md text-headline-md text-gold mb-2">Kenya Delivery Policy</h2>
            <p>
              We offer delivery across Kenya at a flat rate of KSh 250, or free pickup at our shop (Accra Road, Accra Trade Centre Building, 2nd Floor, Shop SF21). Deliveries within Nairobi are completed within 24 hours.
            </p>
          </div>

          <div id="returns">
            <h2 className="font-headline-md text-headline-md text-gold mb-2">3-Day Return Policy</h2>
            <p>
              To qualify for a refund or replacement, products must be returned within 3 days of receipt in their original, unused condition with all tags attached. In case tags are removed, or the watch/item is damaged, goods cannot be returned.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
