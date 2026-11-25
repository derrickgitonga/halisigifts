"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/meta-pixel";
import { useWishlist } from "@/lib/shopper-lists";

interface NavCategory {
  id: string;
  name: string;
  slug: string;
  navLabel: string | null;
}

interface HeaderProps {
  cartCount?: number;
  navCategories?: NavCategory[];
}

const HEADER_PROMISES = [
  "100% certified genuine",
  "Same-day Nairobi CBD dispatch",
  "Free gift packaging",
];

export default function Header({ cartCount = 0, navCategories = [] }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [count, setCount] = useState(cartCount);
  const [prevCartCount, setPrevCartCount] = useState(cartCount);
  const { items: wishlist } = useWishlist();

  // Reset to the server-provided count whenever it changes
  if (cartCount !== prevCartCount) {
    setPrevCartCount(cartCount);
    setCount(cartCount);
  }

  useEffect(() => {
    const handleCountUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      if (typeof customEvent.detail?.count === "number") {
        setCount(customEvent.detail.count);
      }
    };
    window.addEventListener("cart-count-updated", handleCountUpdate);
    return () => window.removeEventListener("cart-count-updated", handleCountUpdate);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      trackEvent("Search", { search_string: query });
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  const renderAnnouncementItems = (duplicate = false) => (
    <>
      {HEADER_PROMISES.map((promise) => (
        <span key={promise} className="inline-flex items-center gap-2 uppercase tracking-[0.13em] font-medium text-[10.5px] sm:text-[11px]">
          <span className="w-1 h-1 rounded-full bg-white/80 shrink-0" aria-hidden />
          <span>{promise}</span>
        </span>
      ))}
      <span className="text-white/40" aria-hidden>•</span>
      <Link
        href="/track-order"
        tabIndex={duplicate ? -1 : undefined}
        className="text-white/90 hover:text-white transition-colors"
      >
        Track order
      </Link>
      <span className="text-white/40" aria-hidden>•</span>
      <Link
        href="/store-locator"
        tabIndex={duplicate ? -1 : undefined}
        className="text-white/90 hover:text-white transition-colors"
      >
        Accra Trade Centre, 2nd Flr SF21
      </Link>
      <span className="text-white/40" aria-hidden>•</span>
      <a
        href="https://wa.me/254729596165?text=Hello%20Halisi%20Gifts%2C%20I%20would%20like%20to%20inquire%20about%20your%20collection."
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={duplicate ? -1 : undefined}
        className="font-semibold hover:text-white transition-colors"
      >
        WhatsApp +254729596165
      </a>
      <span className="text-white/40" aria-hidden>•</span>
    </>
  );

  return (
    <header className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/[0.08]">
      <div className="w-full bg-gold text-white text-[11px] sm:text-xs tracking-wide py-2 overflow-hidden select-none">
        <div className="flex animate-continuous-marquee hover:[animation-play-state:paused] items-center">
          <div className="flex items-center shrink-0 space-x-6 sm:space-x-10 pr-6 sm:pr-10 whitespace-nowrap">
            {renderAnnouncementItems(false)}
            {renderAnnouncementItems(true)}
          </div>
          <div
            className="flex items-center shrink-0 space-x-6 sm:space-x-10 pr-6 sm:pr-10 whitespace-nowrap"
            aria-hidden="true"
          >
            {renderAnnouncementItems(true)}
            {renderAnnouncementItems(true)}
          </div>
        </div>
      </div>

      {/* Main Luxury Navigation Bar */}
      <nav className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-2 md:py-3 flex items-center justify-between gap-2 md:gap-6">
        {/* Brand Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="block group">
            <Image
              alt="Halisi Gifts Shop Logo"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
              src="/halisi-logo.png"
              width={160}
              height={56}
              priority
            />
          </Link>
        </div>

        {/* Compact Mobile Search Bar */}
        <div className="flex-1 min-w-0 max-w-[220px] sm:max-w-[280px] md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <input
              type="search"
              placeholder="Search gifts, watches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-black/15 pl-3 pr-9 py-1.5 text-base sm:text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-gold transition-all"
            />
            <button
              type="submit"
              className="absolute right-1 text-black/60 hover:text-gold flex items-center justify-center p-1.5 min-w-[30px] min-h-[30px]"
              aria-label="Search"
            >
              <span className="material-symbols-outlined text-base">search</span>
            </button>
          </form>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-[11px] lg:text-xs uppercase tracking-[0.14em] font-semibold">
          {navCategories.map((cat) => (
            <Link
              key={cat.id}
              className="relative text-black/75 hover:text-black transition-colors duration-200 py-1 group/nav"
              href={`/category/${cat.slug}`}
            >
              <span>{cat.navLabel || cat.name}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold transition-all duration-300 group-hover/nav:w-full" />
            </Link>
          ))}
        </div>

        {/* Desktop Search, WhatsApp Concierge, and Cart Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Desktop Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden md:flex text-black/70 hover:text-black hover:bg-black/5 rounded-full transition-colors duration-200 p-2 items-center justify-center"
            title="Search Products"
            aria-label="Search Products"
          >
            <span className="material-symbols-outlined text-xl">search</span>
          </button>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="text-black/80 hover:text-black hover:bg-black/5 rounded-full transition-colors duration-200 relative flex items-center justify-center p-2"
            title="Wishlist"
            aria-label={`Wishlist${wishlist.length ? `, ${wishlist.length} saved` : ""}`}
          >
            <span className="material-symbols-outlined text-2xl">favorite</span>
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gold text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Icon with Gold Badge */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-cart-drawer"))}
            className="text-black/80 hover:text-black hover:bg-black/5 rounded-full transition-colors duration-200 relative flex items-center justify-center p-2"
            title="Shopping Cart"
            aria-label="Shopping Cart"
          >
            <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Menu Icon */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-black/75 hover:text-black p-2 -mr-1 flex items-center justify-center"
            title="Navigation Menu"
            aria-label="Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation Menu */}
      {menuOpen && (
        <div className="md:hidden w-full bg-white border-b border-black/10 py-4 px-margin-mobile flex flex-col space-y-2 text-xs uppercase tracking-[0.12em] shadow-xl">
          {navCategories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              onClick={() => setMenuOpen(false)}
              className={`text-black/85 hover:text-gold py-2.5 font-medium flex items-center justify-between ${
                idx < navCategories.length - 1 ? "border-b border-black/5" : ""
              }`}
            >
              <span>{cat.navLabel || cat.name}</span>
              <span className="material-symbols-outlined text-sm text-black/40">chevron_right</span>
            </Link>
          ))}

          <Link
            href="/track-order"
            onClick={() => setMenuOpen(false)}
            className="text-black/85 hover:text-gold py-2.5 font-medium flex items-center justify-between border-t border-black/5"
          >
            <span>Track your order</span>
            <span className="material-symbols-outlined text-sm text-black/40">local_shipping</span>
          </Link>

          {/* Physical Store Box in Mobile Drawer */}
          <div className="mt-3 p-4 bg-[#F8FAF9] border border-black/10 space-y-1.5 normal-case tracking-normal">
            <div className="flex items-center gap-1.5 text-black font-semibold text-xs">
              <span className="material-symbols-outlined text-gold text-base">location_on</span>
              <span>Accra Trade Centre, 2nd Flr SF21</span>
            </div>
            <p className="text-[11px] text-black/60 leading-tight">
              Accra Road, Nairobi CBD. Open Mon–Sat 8:00 AM – 7:30 PM.
            </p>
            <div className="pt-1 flex gap-2">
              <a
                href="tel:+254729596165"
                className="flex-1 py-2.5 text-center bg-black text-white text-xs font-semibold hover:bg-gold transition-colors"
              >
                Call: +254729596165
              </a>
              <a
                href="https://wa.me/254729596165"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 text-center bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20bd5a] transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Desktop Search Bar */}
      {searchOpen && (
        <div className="hidden md:block w-full bg-[#F8FAF9] border-b border-black/10 py-3.5 px-margin-mobile md:px-margin-desktop">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-container-max mx-auto flex items-center gap-3"
          >
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search luxury timepieces, Arabian ouds, curated gift hampers, jewellery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-black/20 pl-11 pr-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-gold transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="bg-black text-white px-7 py-3 hover:bg-gold transition-colors text-xs uppercase tracking-[0.14em] font-semibold"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2 text-black/50 hover:text-black rounded-lg transition-colors"
              title="Close search"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
