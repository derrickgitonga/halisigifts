import { notFound } from "next/navigation";
import CollectionLandingPage from "@/components/seo/CollectionLandingPage";
import { buildSeoCollectionMetadata, getSeoCollectionBySlug } from "@/lib/seo-collections";

export const revalidate = 300;

const config = getSeoCollectionBySlug("graduation-gifts-kenya")!;

export const metadata = buildSeoCollectionMetadata(config);

export default function GraduationGiftsKenyaPage() {
  if (!config) notFound();
  return <CollectionLandingPage config={config} />;
}
