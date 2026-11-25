import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import MinimalHero from "@/components/home/MinimalHero";
import ShopCatalog from "@/components/home/ShopCatalog";
import FaqSection from "@/components/home/FaqSection";
import { getShopCatalog, rotateCatalogForWindow } from "@/lib/home-catalog";

export const revalidate = 300;

export default async function HomePage() {
  const { products, categories } = await getShopCatalog();
  const rotatedProducts = rotateCatalogForWindow(products);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9]">
      <Header />

      <main className="w-full flex-grow">
        {/* 1. Minimal hero */}
        <MinimalHero />

        {/* 2. Shop — filters + product grid (the main event) */}
        <ShopCatalog products={rotatedProducts} categories={categories} />

        {/* 3. FAQ */}
        <div className="border-t border-black/[0.06]">
          <FaqSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
