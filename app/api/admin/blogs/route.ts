import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";
import { getUniqueBlogSlug } from "@/lib/slug";
import { invalidateBlogCache } from "@/lib/blog";

export async function GET(req: NextRequest) {
  const authCheck = await requireAdminSession();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().slice(0, 80);
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status === "published") {
      where.published = true;
    } else if (status === "draft") {
      where.published = false;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total, publishedCount, draftCount] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.blogPost.count({ where: { published: false } }),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      stats: { total, published: publishedCount, drafts: draftCount },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load blog posts";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireAdminSession();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const body = await req.json();
    const title = (body.title || "").trim();
    const content = (body.content || "").trim();

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Blog post title is required" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Blog content is required" },
        { status: 400 }
      );
    }

    const slug = await getUniqueBlogSlug(prisma, body.slug || title);
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t: string) => t.trim()).filter(Boolean)
      : typeof body.tags === "string"
      ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const extractedCover = content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || null;
    const coverImage = body.coverImage ? body.coverImage.trim() : extractedCover;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: body.excerpt ? body.excerpt.trim() : null,
        content,
        coverImage,
        author: body.author?.trim() || "Halisi Gifts Shop",
        tags,
        published: Boolean(body.published),
      },
    });

    await invalidateBlogCache();

    return NextResponse.json({ success: true, post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create blog post";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
