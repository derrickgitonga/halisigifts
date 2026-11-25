import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { convertMawimbiToHalisiPrice } from "@/lib/halisi-pricing";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

function secureCompare(a: string | null, b: string | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function toDecimal(value: unknown, fallback = 0): Prisma.Decimal {
  const num = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  const safe = Number.isFinite(num) && num >= 0 ? num : fallback;
  return new Prisma.Decimal(safe.toFixed(2));
}

async function ensureLocalImage(imagePath: string, mawimbiBaseUrl: string) {
  if (!imagePath || !imagePath.startsWith("/products/")) return;
  const filename = path.basename(imagePath);
  const cwd = process.cwd();
  const isStandalone = cwd.includes(".next");
  const rootDir = isStandalone ? path.resolve(cwd, "..", "..") : cwd;
  const primaryDest = path.join(/*turbopackIgnore: true*/ rootDir, "public", "products", filename);

  try {
    await fs.access(primaryDest);
    return;
  } catch {
    // Download missing product image from Mawimbi Gifts
  }

  try {
    const remoteUrl = `${mawimbiBaseUrl.replace(/\/+$/, "")}/products/${encodeURIComponent(filename)}`;
    const res = await fetch(remoteUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return;

    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(primaryDest), { recursive: true });
    await fs.writeFile(primaryDest, buffer);

    if (isStandalone) {
      try {
        const standaloneDest = path.join(/*turbopackIgnore: true*/ cwd, "public", "products", filename);
        await fs.mkdir(path.dirname(standaloneDest), { recursive: true });
        await fs.writeFile(standaloneDest, buffer);
      } catch {
        // Primary write succeeded
      }
    }
  } catch (err) {
    console.error(`[HalisiSync] Failed to download image ${filename} from Mawimbi:`, err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-sync-secret");
    const expectedSecret = process.env.SYNC_SECRET_KEY;

    if (!expectedSecret || !secureCompare(secret, expectedSecret)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action = "upsert", product } = body;

    if (!product || !product.slug) {
      return NextResponse.json(
        { success: false, error: "Product payload with slug is required" },
        { status: 400 }
      );
    }

    if (action === "delete") {
      await prisma.product.deleteMany({ where: { slug: product.slug } });
      try {
        revalidatePath("/", "layout");
        revalidatePath(`/product/${product.slug}`, "page");
        revalidatePath("/category/[slug]", "page");
        revalidatePath("/search", "page");
      } catch {}
      return NextResponse.json({ success: true, message: `Product ${product.slug} deleted` });
    }

    const categorySlug = String(product.categorySlug || "uncategorized").trim();
    let category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      const generatedName =
        product.categoryName?.trim() ||
        categorySlug
          .split("-")
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");

      category = await prisma.category.create({
        data: {
          name: generatedName,
          slug: categorySlug,
          showInNav: false,
        },
      });
    }

    const mawimbiBaseUrl = process.env.MAWIMBI_BASE_URL || "https://www.mawimbigifts.com";
    const imagesToDownload: string[] = Array.isArray(product.images) ? [...product.images] : [];
    if (Array.isArray(product.variants)) {
      for (const v of product.variants) {
        if (v?.image) imagesToDownload.push(v.image);
      }
    }

    await Promise.all(imagesToDownload.map((img) => ensureLocalImage(img, mawimbiBaseUrl)));

    const halisiPrice = convertMawimbiToHalisiPrice(product.price);
    const price = toDecimal(halisiPrice);

    let compareAtPrice: Prisma.Decimal | null = null;
    if (product.compareAtPrice !== undefined && product.compareAtPrice !== null && Number(product.compareAtPrice) > 0) {
      const convertedCompare = convertMawimbiToHalisiPrice(Number(product.compareAtPrice));
      if (convertedCompare > halisiPrice) {
        compareAtPrice = toDecimal(convertedCompare);
      }
    }

    const priceMin =
      product.priceMin !== undefined && product.priceMin !== null && Number(product.priceMin) > 0
        ? toDecimal(convertMawimbiToHalisiPrice(Number(product.priceMin)))
        : null;
    const priceMax =
      product.priceMax !== undefined && product.priceMax !== null && Number(product.priceMax) > 0
        ? toDecimal(convertMawimbiToHalisiPrice(Number(product.priceMax)))
        : null;
    const stock = Math.max(0, parseInt(String(product.stock ?? "0"), 10) || 0);
    const images = Array.isArray(product.images) ? product.images : [];

    const existingBySlug = await prisma.product.findUnique({ where: { slug: product.slug } });
    const existingBySku = !existingBySlug && product.sku
      ? await prisma.product.findUnique({ where: { sku: product.sku } })
      : null;

    const target = existingBySlug || existingBySku;
    const savedProduct = target
      ? await prisma.product.update({
          where: { id: target.id },
          data: {
            name: product.name,
            slug: product.slug,
            description: product.description || "",
            price,
            compareAtPrice,
            priceMin,
            priceMax,
            categoryId: category.id,
            images,
            stock,
            isNew: Boolean(product.isNew),
            isFeatured: Boolean(product.isFeatured),
            isHotDeal: Boolean(product.isHotDeal),
            isActive: product.isActive !== undefined ? Boolean(product.isActive) : true,
            statusNote: product.statusNote || null,
          },
        })
      : await prisma.product.create({
          data: {
            ...(product.id ? { id: product.id } : {}),
            name: product.name,
            slug: product.slug,
            description: product.description || "",
            price,
            compareAtPrice,
            priceMin,
            priceMax,
            categoryId: category.id,
            images,
            stock,
            sku: product.sku || `HAL-${Date.now()}`,
            isNew: Boolean(product.isNew),
            isFeatured: Boolean(product.isFeatured),
            isHotDeal: Boolean(product.isHotDeal),
            isActive: product.isActive !== undefined ? Boolean(product.isActive) : true,
            statusNote: product.statusNote || null,
          },
        });

    if (Array.isArray(product.variants)) {
      for (const v of product.variants) {
        if (!v?.sku || !v?.name) continue;
        await prisma.productVariant.upsert({
          where: { sku: v.sku },
          create: {
            productId: savedProduct.id,
            name: v.name,
            image: v.image || null,
            priceModifier: toDecimal(v.priceModifier, 0),
            stock: Math.max(0, parseInt(String(v.stock ?? "0"), 10) || 0),
            sku: v.sku,
          },
          update: {
            productId: savedProduct.id,
            name: v.name,
            image: v.image || null,
            priceModifier: toDecimal(v.priceModifier, 0),
            stock: Math.max(0, parseInt(String(v.stock ?? "0"), 10) || 0),
          },
        });
      }
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath(`/product/${savedProduct.slug}`, "page");
      revalidatePath("/category/[slug]", "page");
      revalidatePath("/search", "page");
    } catch {}

    return NextResponse.json({
      success: true,
      product: {
        id: savedProduct.id,
        slug: savedProduct.slug,
        price: Number(savedProduct.price),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("[HalisiSync] Sync error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
