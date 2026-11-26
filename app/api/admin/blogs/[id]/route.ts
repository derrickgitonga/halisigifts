import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";
import { getUniqueBlogSlug } from "@/lib/slug";
import { invalidateBlogCache } from "@/lib/blog";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const authCheck = await requireAdminSession();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch blog post";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authCheck = await requireAdminSession();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { id } = await params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const title = (body.title || "").trim() || existing.title;
    const content = (body.content || "").trim() || existing.content;

    let slug = existing.slug;
    if (body.slug && body.slug.trim() !== existing.slug) {
      slug = await getUniqueBlogSlug(prisma, body.slug, id);
    } else if (body.title && body.title.trim() !== existing.title && !body.slug) {
      slug = await getUniqueBlogSlug(prisma, body.title, id);
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.map((t: string) => t.trim()).filter(Boolean)
      : typeof body.tags === "string"
      ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : existing.tags;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: body.excerpt !== undefined ? (body.excerpt ? body.excerpt.trim() : null) : existing.excerpt,
        content,
        coverImage:
          body.coverImage !== undefined
            ? body.coverImage
              ? body.coverImage.trim()
              : content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || null
            : existing.coverImage || content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || null,
        author: body.author ? body.author.trim() : existing.author,
        tags,
        published: body.published !== undefined ? Boolean(body.published) : existing.published,
      },
    });

    await invalidateBlogCache();

    return NextResponse.json({ success: true, post: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update blog post";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return PUT(req, { params });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const authCheck = await requireAdminSession();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });

    await invalidateBlogCache();

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete blog post";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
