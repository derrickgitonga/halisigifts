import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getUniqueProductSlug, getUniqueVariantSku } from "@/lib/slug";

function generateSku(categoryName: string): string {
  const prefix = categoryName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase() || "GEN";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MW-${prefix}-${randomSuffix}`;
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("category") || "";
    const section = searchParams.get("section") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const rawLimit = searchParams.get("limit") || "50";
    const limit =
      rawLimit === "all"
        ? 10000
        : Math.max(1, Math.min(1000, parseInt(rawLimit, 10) || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (section === "new_arrivals") {
      where.isNew = true;
      where.isActive = true;
    } else if (section === "hot_deals") {
      where.isHotDeal = true;
      where.isActive = true;
    } else if (section === "featured") {
      where.isFeatured = true;
      where.isActive = true;
    } else if (section === "inactive") {
      where.isActive = false;
    } else if (section === "out_of_stock") {
      where.stock = { lte: 0 };
    }

    const [
      products,
      totalCount,
      statsNew,
      statsHot,
      statsFeatured,
      statsInactive,
      statsOutOfStock,
      totalProducts,
      abandonedTotal,
      recoveredCount,
      tier1Sent,
      tier2Sent,
      tier3Sent,
      recoveredOrders,
    ] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            select: { id: true, name: true, stock: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: { isNew: true, isActive: true } }),
      prisma.product.count({ where: { isHotDeal: true, isActive: true } }),
      prisma.product.count({ where: { isFeatured: true, isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.product.count({ where: { stock: { lte: 0 } } }),
      prisma.product.count(),
      // Abandoned cart analytics
      prisma.cartSession.count({ where: { status: "ABANDONED" } }),
      prisma.cartSession.count({ where: { status: "RECOVERED" } }),
      prisma.cartSession.count({ where: { reminderCount: { gte: 1 } } }),
      prisma.cartSession.count({ where: { reminderCount: { gte: 2 } } }),
      prisma.cartSession.count({ where: { reminderCount: { gte: 3 } } }),
      prisma.cartSession.findMany({
        where: { status: "RECOVERED", orderId: { not: null } },
        include: { order: { select: { total: true } } },
      }),
    ]);

    const recoveredRevenue = recoveredOrders.reduce(
      (acc, s) => acc + (s.order ? Number(s.order.total) : 0),
      0
    );

    const totalEligibleForRecovery = abandonedTotal + recoveredCount;
    const recoveryRate =
      totalEligibleForRecovery > 0
        ? Math.round((recoveredCount / totalEligibleForRecovery) * 100)
        : 0;

    const formattedProducts = products.map((p) => ({
      ...p,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      priceMin: p.priceMin ? Number(p.priceMin) : null,
      priceMax: p.priceMax ? Number(p.priceMax) : null,
    }));

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        total: totalProducts,
        newArrivals: statsNew,
        hotDeals: statsHot,
        featured: statsFeatured,
        inactive: statsInactive,
        outOfStock: statsOutOfStock,
      },
      abandonedCartAnalytics: {
        totalAbandoned: abandonedTotal,
        recoveredCarts: recoveredCount,
        recoveredRevenue,
        recoveryRate,
        emailsSent: {
          tier1: tier1Sent,
          tier2: tier2Sent,
          tier3: tier3Sent,
          total: tier1Sent,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const {
      name,
      slug: customSlug,
      description,
      price,
      compareAtPrice,
      categoryId,
      images,
      stock,
      sku: customSku,
      isNew = false,
      isFeatured = false,
      isHotDeal = false,
      isActive = true,
      statusNote,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Category selection is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Selected category does not exist" },
        { status: 400 }
      );
    }

    const uniqueSlug = await getUniqueProductSlug(prisma, customSlug || name);

    let sku = (customSku || "").trim();
    if (!sku) {
      sku = generateSku(category.name);
      while (await prisma.product.findUnique({ where: { sku } })) {
        sku = generateSku(category.name);
      }
    } else {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: "A product with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    const validImages = Array.isArray(images)
      ? images.map((img: string) => img.trim()).filter((img: string) => img.length > 0)
      : [];

    if (validImages.length === 0) {
      validImages.push("/logo.png");
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json(
        { success: false, error: "Valid product price is required" },
        { status: 400 }
      );
    }

    const numCompareAtPrice =
      compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== ""
        ? parseFloat(compareAtPrice)
        : null;

    const numStock = parseInt(stock || "0", 10);
    const variantsList = Array.isArray(body.variants)
      ? body.variants.filter((v: any) => v.name && v.name.trim().length > 0)
      : [];

    const variantCreates = [];
    for (const v of variantsList) {
      const vSku = await getUniqueVariantSku(prisma, sku, v.name.trim());
      variantCreates.push({
        name: v.name.trim(),
        image: v.image ? v.image.trim() : validImages[0],
        priceModifier: new Prisma.Decimal(parseFloat(v.priceModifier || "0") || 0),
        stock: parseInt(v.stock || String(numStock), 10) || 0,
        sku: vSku,
      });
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        description: (description || "").trim(),
        price: new Prisma.Decimal(numPrice.toFixed(2)),
        compareAtPrice:
          numCompareAtPrice !== null ? new Prisma.Decimal(numCompareAtPrice.toFixed(2)) : null,
        categoryId,
        images: validImages,
        stock: isNaN(numStock) ? 0 : Math.max(0, numStock),
        sku,
        isNew: Boolean(isNew),
        isFeatured: Boolean(isFeatured),
        isHotDeal: Boolean(isHotDeal),
        isActive: Boolean(isActive),
        statusNote: statusNote ? statusNote.trim() : null,
        variants: {
          create: variantCreates,
        },
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
      },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath(`/product/${newProduct.slug}`, "page");
      revalidatePath("/category/[slug]", "page");
      revalidatePath("/search", "page");
      revalidatePath("/admin", "page");
    } catch {
      // Ignore in non-production builds
    }

    return NextResponse.json({
      success: true,
      product: {
        ...newProduct,
        price: Number(newProduct.price),
        compareAtPrice: newProduct.compareAtPrice ? Number(newProduct.compareAtPrice) : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
