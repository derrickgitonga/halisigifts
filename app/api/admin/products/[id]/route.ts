import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getUniqueProductSlug, getUniqueVariantSku } from "@/lib/slug";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const dataToUpdate: Prisma.ProductUpdateInput = {};

    if (body.name !== undefined) {
      dataToUpdate.name = body.name.trim();
      if (body.slug !== undefined || body.name !== existing.name) {
        dataToUpdate.slug = await getUniqueProductSlug(prisma, body.slug || body.name, id);
      }
    } else if (body.slug !== undefined) {
      dataToUpdate.slug = await getUniqueProductSlug(prisma, body.slug, id);
    }
    if (body.description !== undefined) dataToUpdate.description = body.description.trim();
    if (body.price !== undefined) {
      const num = parseFloat(body.price);
      if (!isNaN(num)) dataToUpdate.price = new Prisma.Decimal(num.toFixed(2));
    }
    if (body.compareAtPrice !== undefined) {
      if (body.compareAtPrice === null || body.compareAtPrice === "") {
        dataToUpdate.compareAtPrice = null;
      } else {
        const num = parseFloat(body.compareAtPrice);
        if (!isNaN(num)) dataToUpdate.compareAtPrice = new Prisma.Decimal(num.toFixed(2));
      }
    }
    if (body.stock !== undefined) {
      const num = parseInt(body.stock, 10);
      if (!isNaN(num)) dataToUpdate.stock = Math.max(0, num);
    }
    if (body.isNew !== undefined) dataToUpdate.isNew = Boolean(body.isNew);
    if (body.isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(body.isFeatured);
    if (body.isHotDeal !== undefined) dataToUpdate.isHotDeal = Boolean(body.isHotDeal);
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);
    if (body.statusNote !== undefined) dataToUpdate.statusNote = body.statusNote ? body.statusNote.trim() : null;
    if (body.categoryId !== undefined) {
      dataToUpdate.category = { connect: { id: body.categoryId } };
    }
    if (body.images !== undefined && Array.isArray(body.images)) {
      dataToUpdate.images = body.images.filter((img: string) => img && img.trim().length > 0);
    }

    if (body.variants !== undefined && Array.isArray(body.variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      const validVariants = body.variants.filter((v: any) => v.name && v.name.trim().length > 0);
      if (validVariants.length > 0) {
        const productSku = existing.sku;
        const variantCreates = [];
        for (const v of validVariants) {
          const vSku = await getUniqueVariantSku(prisma, productSku, v.name.trim());
          variantCreates.push({
            name: v.name.trim(),
            image: v.image ? v.image.trim() : (body.images?.[0] || existing.images[0] || null),
            priceModifier: new Prisma.Decimal(parseFloat(v.priceModifier || "0") || 0),
            stock: parseInt(v.stock || String(body.stock ?? existing.stock), 10) || 0,
            sku: vSku,
          });
        }
        dataToUpdate.variants = {
          create: variantCreates,
        };
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath(`/product/${updated.slug}`, "page");
      revalidatePath("/category/[slug]", "page");
      revalidatePath("/search", "page");
      revalidatePath("/admin", "page");
    } catch {
      // Ignore in non-production builds
    }

    return NextResponse.json({
      success: true,
      product: {
        ...updated,
        price: Number(updated.price),
        compareAtPrice: updated.compareAtPrice ? Number(updated.compareAtPrice) : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath(`/product/${existing.slug}`, "page");
      revalidatePath("/category/[slug]", "page");
      revalidatePath("/search", "page");
      revalidatePath("/admin", "page");
    } catch {
      // Ignore in non-production builds
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
