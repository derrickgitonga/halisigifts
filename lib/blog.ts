import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const DEFAULT_BLOG_COVER = "/videos/hero-poster.jpg";

export function extractFirstImageFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export function resolveBlogCoverImage(
  coverImage?: string | null,
  content?: string | null
): string {
  if (coverImage && coverImage.trim()) {
    return coverImage.trim();
  }
  const extracted = extractFirstImageFromHtml(content);
  if (extracted) {
    return extracted;
  }
  return DEFAULT_BLOG_COVER;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string;
  tags: string[];
  published: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export async function getPublishedBlogPosts(): Promise<BlogPostSummary[]> {
  try {
    const res = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        author: true,
        tags: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      coverImage: resolveBlogCoverImage(p.coverImage, p.content),
      author: p.author,
      tags: p.tags,
      published: p.published,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });
    if (!post || !post.published) return null;
    return {
      ...post,
      coverImage: resolveBlogCoverImage(post.coverImage, post.content),
    };
  } catch {
    return null;
  }
}

export async function getRelatedBlogPosts(currentSlug: string, limit = 3): Promise<BlogPostSummary[]> {
  const allPosts = await getPublishedBlogPosts();
  return allPosts.filter((p) => p.slug !== currentSlug).slice(0, limit);
}

export async function invalidateBlogCache() {
  try {
    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");
    revalidatePath("/sitemap.xml");
  } catch {
    // Ignore when called outside of Next request context
  }
}
