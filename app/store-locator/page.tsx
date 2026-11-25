import type { Metadata } from "next";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { getStoreSchema } from "@/lib/seo-schemas";

export const metadata: Metadata = {
  title: "Shop Location & Directions | Halisi Gifts Shop Nairobi CBD",
  description:
    "Visit our physical store in Nairobi CBD at Accra Trade Centre Building, 2nd Floor, Shop SF21 on Accra Road. Open Monday to Saturday 8:30 AM - 7:00 PM.",
  alternates: {
    canonical: "/store-locator",
  },
};

export default function StoreLocatorPage() {
  const storeSchema = getStoreSchema();
  const stores = [
    {
      city: "Nairobi Store",
      address: "Nairobi, Accra road, Accra trade center Building, 2nd floor, Shop SF21",
      hours: "Mon - Sat: 8:30 AM - 7:00 PM | Sun: Closed",
      phone: "Call/WhatsApp: +254729596165",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Accra+Trade+Centre+Building,+Accra+Road,+Nairobi",
      embedUrl: "https://maps.google.com/maps?q=Accra+Trade+Centre+Building,+Accra+Road,+Nairobi,+Kenya&t=&z=16&ie=UTF8&iwloc=&output=embed",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLd schema={storeSchema} />
      <Header />
      <main className="w-full flex-grow max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg space-y-8">
        <h1 className="font-display-lg text-3xl md:text-display-lg text-black text-center">Shop Location</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            {stores.map((st, i) => (
              <div key={i} className="bg-white p-6 border border-black/10 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-gold">
                  <span className="material-symbols-outlined text-2xl">storefront</span>
                  <h2 className="font-headline-md text-headline-md text-black">{st.city}</h2>
                </div>

                <div className="space-y-3 text-sm text-black/80">
                  <a
                    href={st.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 font-medium text-black hover:text-gold transition-colors group"
                  >
                    <span className="material-symbols-outlined text-gold text-lg mt-0.5 shrink-0 group-hover:scale-110 transition-transform">location_on</span>
                    <span className="underline underline-offset-2 decoration-black/30 group-hover:decoration-gold">{st.address}</span>
                  </a>
                  <p className="flex items-center gap-2.5 text-black/60">
                    <span className="material-symbols-outlined text-black/40 text-lg shrink-0">schedule</span>
                    <span>{st.hours}</span>
                  </p>
                  <p className="flex items-center gap-2.5 font-semibold text-black">
                    <span className="material-symbols-outlined text-gold text-lg shrink-0">call</span>
                    <span>{st.phone}</span>
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={st.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full bg-gold text-white font-label-md px-5 py-3 rounded-lg hover:bg-black transition-colors duration-200 font-semibold text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">pin_drop</span>
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-7 bg-white p-2 border border-black/10 rounded-xl overflow-hidden shadow-sm min-h-[380px] h-full flex flex-col">
            <div className="w-full h-full min-h-[360px] rounded-lg overflow-hidden relative">
              <iframe
                title="Halisi Gifts Shop Location Map"
                src="https://maps.google.com/maps?q=Accra+Trade+Centre+Building,+Accra+Road,+Nairobi,+Kenya&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "360px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
