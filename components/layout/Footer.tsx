import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white/80 w-full py-8 md:py-10 border-t border-black/15">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          
          {/* Column 1: Store Details & Contact */}
          <div className="col-span-2 md:col-span-1 space-y-2.5">
            <Link href="/" className="inline-block">
              <Image
                src="/halisi-logo.png"
                alt="Halisi Gifts Shop"
                width={140}
                height={48}
                className="h-10 md:h-12 w-auto object-contain brightness-110"
              />
            </Link>
            <p className="text-xs text-white/60">
              Open Mon – Sat: 8:00 AM – 7:30 PM
            </p>
            <div className="pt-1 flex items-center gap-2">
              <a
                href="https://wa.me/254729596165"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>WhatsApp: +254729596165</span>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-span-1 flex flex-col space-y-1.5 text-xs sm:text-sm">
            <span className="text-xs font-bold text-white uppercase tracking-wider mb-1 text-gold">
              Collections
            </span>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/category/watches-men">
              Men&apos;s Watches
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/category/watches-ladies">
              Ladies&apos; Watches
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/category/smart-watches">
              Smart Watches
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/category/perfumes-fragrances">
              Perfumes
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/category/valentines-gift-sets">
              Gift Sets
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/category/jewellery">
              Fine Jewellery
            </Link>
          </div>

          {/* Column 3: Customer Care */}
          <div className="col-span-1 flex flex-col space-y-1.5 text-xs sm:text-sm">
            <span className="text-xs font-bold text-white uppercase tracking-wider mb-1 text-gold">
              Customer Care
            </span>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/track-order">
              Track Your Order
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/shipping-returns">
              Delivery Info
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/shipping-returns#returns">
              Return Policy
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/privacy-policy">
              Privacy Policy
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/store-locator">
              Store Location
            </Link>
            <Link className="text-white/70 hover:text-gold transition-colors py-0.5" href="/contact">
              Contact Us
            </Link>
          </div>

          {/* Column 4: Payment & Location */}
          <div className="col-span-2 md:col-span-1 space-y-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider mb-1 block text-gold">
              Payment &amp; Delivery
            </span>
            <p className="text-xs text-white/60 leading-relaxed">
              Lipa na M-Pesa, Cards, and Cash on Delivery in Nairobi CBD.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="px-2 py-0.5 bg-white/10 text-emerald-300 rounded text-[11px] font-medium border border-emerald-400/20">
                M-Pesa
              </span>
              <span className="px-2 py-0.5 bg-white/10 text-white rounded text-[11px] font-medium border border-white/15">
                Cards
              </span>
              <span className="px-2 py-0.5 bg-white/10 text-gold rounded text-[11px] font-medium border border-gold/20">
                Same-Day Nairobi Delivery
              </span>
            </div>
            <div className="pt-1">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Accra+Trade+Centre+Building,+Accra+Road,+Nairobi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gold hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span className="underline underline-offset-2">Find us on Google Maps</span>
              </a>
            </div>
          </div>

        </div>

        {/* Compact Bottom Bar */}
        <div className="w-full mt-6 pt-4 border-t border-white/10 text-xs text-white/40 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Halisi Gifts Shop. All Rights Reserved.</span>
          <div className="flex items-center gap-3">
            <Link href="/privacy-policy" className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link href="/shipping-returns" className="hover:text-gold transition-colors">
              Delivery Information
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
