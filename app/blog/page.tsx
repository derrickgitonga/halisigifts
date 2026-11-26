import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import { getPublishedBlogPosts, type BlogPostSummary } from "@/lib/blog";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gift Guides, Watch Care & Style Journal | Halisi Gifts Shop Kenya",
  description:
    "Discover luxury watch buying guides, perfume styling tips, and thoughtful gift ideas from Halisi Gifts Shop Kenya.",
  openGraph: {
    title: "Gift Guides & Style Journal | Halisi Gifts Shop Kenya",
    description:
      "Curated watch guides, fragrance advice, and thoughtful gift inspiration from Halisi Gifts Shop Kenya.",
    url: "https://halisigifts.com/blog",
    siteName: "Halisi Gifts Shop",
    locale: "en_KE",
    type: "website",
  },
};

export default async function BlogIndexPage() {
  let posts: BlogPostSummary[] = [];
  try {
    posts = await getPublishedBlogPosts();
  } catch {
    posts = [];
  }
  const safePosts = Array.isArray(posts) ? posts : [];
  const featuredPost = safePosts[0] || null;
  const remainingPosts = safePosts.slice(1);

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Halisi Gifts Shop Journal",
    description: "Gift guides, luxury watch care, and fragrance inspiration in Kenya",
    url: "https://halisigifts.com/blog",
    publisher: {
      "@type": "Organization",
      name: "Halisi Gifts Shop",
      url: "https://halisigifts.com",
      logo: "https://halisigifts.com/halisi-logo.png",
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B1C1C] flex flex-col font-sans">
      <JsonLd schema={blogSchema} />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <span className="text-xs font-bold tracking-widest text-[#266e00] uppercase">
            Inspiration &amp; Guides
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1B1C1C] mt-2 mb-4 tracking-tight">
            The Halisi Gift Journal
          </h1>
          <p className="text-sm md:text-base text-black/70 leading-relaxed">
            Curated watch guides, signature fragrance tips, and thoughtful gift ideas for every milestone.
          </p>
        </div>

        {safePosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/10 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#266e00]/10 flex items-center justify-center text-[#266e00]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-xl font-serif font-bold text-black mb-2">New Guides Coming Soon</h2>
            <p className="text-xs text-black/60 mb-6">
              Our team is curating helpful gift guides and watch styling tips for you. Check back shortly or browse our current catalog.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#266e00] text-white text-xs font-semibold rounded-xl hover:bg-[#1b4f00] transition-colors"
            >
              Explore Shop
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {featuredPost && (
              <div className="bg-white rounded-3xl border border-black/10 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-full min-h-[300px] overflow-hidden bg-gray-100">
                    <Image
                      src={featuredPost.coverImage || "/videos/hero-poster.jpg"}
                      alt={featuredPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider text-[#266e00] rounded-full shadow-sm">
                        Featured Guide
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-black/50">
                        <span>{featuredPost.author}</span>
                        <span>•</span>
                        <span>
                          {new Date(featuredPost.createdAt).toLocaleDateString("en-KE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-black group-hover:text-[#266e00] transition-colors leading-tight">
                        <Link href={`/blog/${featuredPost.slug}`}>
                          {featuredPost.title}
                        </Link>
                      </h2>

                      {featuredPost.excerpt && (
                        <p className="text-sm text-black/70 leading-relaxed line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}

                      {featuredPost.tags && featuredPost.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-2">
                          {featuredPost.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] font-medium bg-black/5 text-black/70 px-2.5 py-0.5 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-6 mt-6 border-t border-black/10 flex items-center justify-between">
                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-bold text-[#266e00] group-hover:translate-x-1 transition-transform"
                      >
                        <span>Read Full Guide</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {remainingPosts.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-bold text-black">Latest Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {remainingPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                    >
                      <Link
                        href={`/blog/${post.slug}`}
                        className="relative h-48 sm:h-56 w-full block overflow-hidden bg-gray-100"
                      >
                        <Image
                          src={post.coverImage || "/videos/hero-poster.jpg"}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </Link>

                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-black/50">
                            <span>
                              {new Date(post.createdAt).toLocaleDateString("en-KE", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span>{post.author}</span>
                          </div>

                          <h3 className="font-serif font-bold text-lg text-black group-hover:text-[#266e00] transition-colors leading-snug line-clamp-2">
                            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                          </h3>

                          {post.excerpt && (
                            <p className="text-xs text-black/65 line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                          <div className="flex items-center gap-1 overflow-hidden">
                            {post.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-black/5 text-black/60 px-2 py-0.5 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-xs font-bold text-[#266e00] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                          >
                            Read More
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
