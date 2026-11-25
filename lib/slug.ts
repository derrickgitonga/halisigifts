import { PrismaClient } from "@prisma/client";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugifyVariant(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getUniqueProductSlug(
  prisma: PrismaClient,
  baseNameOrSlug: string,
  excludeProductId?: string
): Promise<string> {
  const cleanBase = generateSlug(baseNameOrSlug) || `product-${Date.now()}`;
  let candidate = cleanBase;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || (excludeProductId && existing.id === excludeProductId)) {
      return candidate;
    }

    candidate = `${cleanBase}-${counter}`;
    counter++;
  }
}

export async function getUniqueVariantSku(
  prisma: PrismaClient,
  productSku: string,
  variantName: string
): Promise<string> {
  const cleanVariant = variantName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "VAR";
  let candidate = `${productSku}-${cleanVariant}`;
  let counter = 1;

  while (true) {
    const existing = await prisma.productVariant.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${productSku}-${cleanVariant}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    counter++;
    if (counter > 10) {
      return `${productSku}-${cleanVariant}-${Date.now()}`;
    }
  }
}
