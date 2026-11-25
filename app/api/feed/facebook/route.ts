import { GET as getMetaFeed } from "@/app/api/meta-feed/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return getMetaFeed();
}
