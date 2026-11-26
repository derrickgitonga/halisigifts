import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import { getBlogPostBySlug, getPublishedBlogPosts, getRelatedBlogPosts } from "@/lib/blog";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 300;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const posts = await getPublishedBlogPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
      return {
        title: "Article Not Found | Halisi Gifts Shop",
      };
    }

    const title = `${post.title} | Halisi Gifts Shop Kenya`;
    const description =
      post.excerpt ||
      "Read this curated gift guide and watch inspiration from Halisi Gifts Shop Kenya.";
    const url = `https://halisigifts.com/blog/${post.slug}`;
    const images = post.coverImage ? [post.coverImage] : ["https://halisigifts.com/halisi-logo.png"];

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        siteName: "Halisi Gifts Shop",
        locale: "en_KE",
        type: "article",
        publishedTime: new Date(post.createdAt).toISOString(),
        modifiedTime: new Date(post.updatedAt).toISOString(),
        authors: [post.author || "Halisi Gifts Shop"],
        images,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
    };
  } catch {
    return {
      title: "Gift Journal | Halisi Gifts Shop Kenya",
      description: "Explore curated gift guides and watch inspiration from Halisi Gifts Shop Kenya.",
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  let post = null;
  try {
    post = await getBlogPostBySlug(slug);
  } catch {
    post = null;
  }

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(post.slug, 3);

  const wordCount = post.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.coverImage || "https://halisigifts.com/halisi-logo.png",
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    author: {
      "@type": "Organization",
      name: post.author || "Halisi Gifts Shop",
      url: "https://halisigifts.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Halisi Gifts Shop",
      logo: {
        "@type": "ImageObject",
        url: "https://halisigifts.com/halisi-logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://halisigifts.com/blog/${post.slug}`,
    },
  };

  const shareText = encodeURIComponent(
    `Check out this gift guide: "${post.title}" on Halisi Gifts Shop: https://halisigifts.com/blog/${post.slug}`
  );
  const whatsappShareUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B1C1C] flex flex-col font-sans">
      <JsonLd schema={articleSchema} />
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav className="flex items-center gap-2 text-xs text-black/50 mb-6">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-black transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-black/80 truncate max-w-xs">{post.title}</span>
        </nav>

        <header className="space-y-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap text-xs text-black/60">
            <span className="px-3 py-1 bg-[#266e00]/10 text-[#266e00] font-bold uppercase tracking-wider rounded-full text-[10px]">
              Gift Guide
            </span>
            <span>•</span>
            <time dateTime={new Date(post.createdAt).toISOString()}>
              {new Date(post.createdAt).toLocaleDateString("en-KE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span>•</span>
            <span>{readingTime} min read</span>
            <span>•</span>
            <span className="font-medium text-black">{post.author}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1B1C1C] tracking-tight leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base sm:text-lg text-black/75 leading-relaxed font-normal pt-1">
              {post.excerpt}
            </p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-black/5 text-black/70 px-2.5 py-1 rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="relative w-full h-64 sm:h-96 md:h-[420px] rounded-3xl overflow-hidden mb-10 shadow-sm border border-black/10 bg-gray-100">
          <Image
            src={post.coverImage || "/videos/hero-poster.jpg"}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>

        <article className="bg-white p-6 sm:p-10 md:p-12 rounded-3xl border border-black/10 shadow-sm">
          <div
            className="blog-article-content text-black/90 text-sm sm:text-base leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-12 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-black">
                Found this helpful?
              </p>
              <p className="text-xs text-black/60 mt-0.5">
                Share this guide with friends or family on WhatsApp.
              </p>
            </div>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share on WhatsApp</span>
            </a>
          </div>
        </article>

        <div className="mt-10 bg-gradient-to-r from-gray-900 to-black text-white p-8 sm:p-10 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-white">
              Discover Original Watches &amp; Curated Gifts
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 max-w-lg">
              Explore our collection of certified genuine timepieces, luxury perfumes, and gift sets with free gift packaging and fast delivery across Kenya.
            </p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-[#266e00] hover:bg-[#1b4f00] text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm"
          >
            Shop All Collections
          </Link>
        </div>

        {relatedPosts.length > 0 && (
          <section className="mt-14 space-y-6">
            <h2 className="font-serif font-bold text-2xl text-[#1B1C1C]">
              More Gift Inspiration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <article
                  key={rel.id}
                  className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <Link
                    href={`/blog/${rel.slug}`}
                    className="relative h-40 w-full block overflow-hidden bg-gray-100"
                  >
                    {rel.coverImage ? (
                      <Image
                        src={rel.coverImage}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Halisi Gifts Shop
                      </div>
                    )}
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <h3 className="font-serif font-bold text-sm text-black group-hover:text-[#266e00] transition-colors line-clamp-2">
                      <Link href={`/blog/${rel.slug}`}>{rel.title}</Link>
                    </h3>
                    <div className="text-[11px] text-black/50">
                      {new Date(rel.createdAt).toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
