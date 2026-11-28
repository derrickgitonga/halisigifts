import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CollectionLandingPage from "@/components/seo/CollectionLandingPage";
import {
  buildSeoCollectionMetadata,
  getCollectionSubpathSlugs,
  getSeoCollectionBySlug,
} from "@/lib/seo-collections";

export const revalidate = 300;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getCollectionSubpathSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getSeoCollectionBySlug(slug);
  if (!config || !config.path.startsWith("/collections/")) {
    return { title: "Collection Not Found | Halisi Gifts" };
  }
  return buildSeoCollectionMetadata(config);
}

export default async function CollectionSlugPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const config = getSeoCollectionBySlug(slug);
  if (!config || !config.path.startsWith("/collections/")) {
    notFound();
  }
  return <CollectionLandingPage config={config} />;
}
