import { notFound } from "next/navigation";
import CollectionLandingPage from "@/components/seo/CollectionLandingPage";
import { buildSeoCollectionMetadata, getSeoCollectionBySlug } from "@/lib/seo-collections";

export const revalidate = 300;

const config = getSeoCollectionBySlug("gifts-under-5000-kes")!;

export const metadata = buildSeoCollectionMetadata(config);

export default function GiftsUnder5000KesPage() {
  if (!config) notFound();
  return <CollectionLandingPage config={config} />;
}
