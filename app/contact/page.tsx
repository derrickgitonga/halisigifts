import type { Metadata } from "next";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contact Us & Shop Location | Halisi Gifts Shop Nairobi",
  description:
    "Get in touch with Halisi Gifts Shop. Visit our store at Accra Trade Centre Building, Accra Road, Nairobi CBD or call/WhatsApp +254729596165.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="w-full flex-grow max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg space-y-8">
        <h1 className="font-display-lg text-3xl md:text-display-lg text-black text-center">Contact Us</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 border border-black/10 rounded-lg space-y-4">
            <h2 className="font-headline-md text-headline-md text-black">Get in Touch</h2>
            <div className="space-y-3 text-sm text-black/80">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Accra+Trade+Centre+Building,+Accra+Road,+Nairobi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-gold transition-colors group"
              >
                <span className="material-symbols-outlined text-gold mt-0.5 group-hover:scale-110 transition-transform">location_on</span>
                <span className="underline underline-offset-2 decoration-black/30 group-hover:decoration-gold">Nairobi, Accra road, Accra trade center Building, 2nd floor, Shop SF21</span>
              </a>
              <p className="flex items-center gap-3">
                <span className="material-symbols-outlined text-black">call</span>
                <span>Call/WhatsApp: +254729596165</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="material-symbols-outlined text-black">mail</span>
                <span>info@halisigifts.com</span>
              </p>
            </div>

            <div className="pt-2">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Accra+Trade+Centre+Building,+Accra+Road,+Nairobi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-gold text-white font-label-md px-4 py-2.5 rounded-lg hover:bg-black transition-colors font-semibold text-xs uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-base">pin_drop</span>
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

          <form className="bg-white p-6 border border-black/10 rounded-lg space-y-4">
            <div>
              <label className="block text-xs font-label-md uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                className="w-full bg-white border border-black/20 rounded p-2.5 text-base focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-label-md uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full bg-white border border-black/20 rounded p-2.5 text-base focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-label-md uppercase tracking-wider mb-1">
                Message
              </label>
              <textarea
                rows={4}
                required
                className="w-full bg-white border border-black/20 rounded p-2.5 text-base focus:outline-none focus:border-gold"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gold text-white font-label-md py-3 rounded-lg hover:bg-black transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
