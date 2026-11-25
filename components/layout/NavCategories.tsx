import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

async function getNavCategories() {
  try {
    return await prisma.category.findMany({
      where: { showInNav: true },
      orderBy: [{ navOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, navLabel: true },
    });
  } catch {
    return [];
  }
}

export async function NavCategoriesDesktop() {
  const categories = await getNavCategories();
  return (
    <>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          className="text-black/80 hover:text-gold transition-colors duration-300 scale-95 hover:scale-100"
          href={`/category/${cat.slug}`}
        >
          {cat.navLabel || cat.name}
        </Link>
      ))}
    </>
  );
}

export async function NavCategoriesMobile({
  onClose,
}: {
  onClose?: string;
}) {
  const categories = await getNavCategories();
  return (
    <>
      {categories.map((cat, idx) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          data-close-menu={onClose}
          className={`text-black/80 hover:text-black py-2.5 ${
            idx < categories.length - 1 ? "border-b border-black/5" : ""
          }`}
        >
          {cat.navLabel || cat.name}
        </Link>
      ))}
    </>
  );
}
