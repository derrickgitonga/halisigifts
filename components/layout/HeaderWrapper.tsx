import { prisma } from "@/lib/prisma";
import Header from "./Header";

export const revalidate = 60;

const DEFAULT_NAV_CATEGORIES = [
  { id: "nav-1", name: "Men's Watches", slug: "watches-men", navLabel: "Men's Watches" },
  { id: "nav-2", name: "Ladies' Watches", slug: "watches-ladies", navLabel: "Ladies' Watches" },
  { id: "nav-3", name: "Smart Watches", slug: "smart-watches", navLabel: "Smart Watches" },
  { id: "nav-4", name: "Perfumes", slug: "perfumes-fragrances", navLabel: "Perfumes" },
  { id: "nav-5", name: "Gift Sets", slug: "valentines-gift-sets", navLabel: "Gift Sets" },
  { id: "nav-6", name: "Jewellery", slug: "jewellery", navLabel: "Jewellery" },
];

async function getNavCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { showInNav: true },
      orderBy: [{ navOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, navLabel: true },
    });
    return categories.length > 0 ? categories : DEFAULT_NAV_CATEGORIES;
  } catch {
    return DEFAULT_NAV_CATEGORIES;
  }
}

export default async function HeaderWrapper({
  cartCount,
}: {
  cartCount?: number;
}) {
  const navCategories = await getNavCategories();
  return <Header cartCount={cartCount} navCategories={navCategories} />;
}
