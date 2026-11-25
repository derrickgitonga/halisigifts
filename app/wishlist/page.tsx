import type { Metadata } from "next";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import WishlistView from "./WishlistView";

export const metadata: Metadata = {
  title: "My Wishlist",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="w-full flex-grow max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        <WishlistView />
      </main>
      <Footer />
    </div>
  );
}
