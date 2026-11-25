export function slugifyVariant(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface QuickCheckoutParams {
  productName: string;
  productSlug?: string;
  price: number;
  variantName?: string;
}

export function getQuickWhatsAppCheckoutUrl(params: QuickCheckoutParams): string {
  const storePhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "254729596165";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

  const lines: string[] = [];
  lines.push("Hi Halisi Gifts, I want to quickly order:");
  lines.push(`• Product: ${params.productName}`);

  if (params.variantName) {
    lines.push(`• Option: ${params.variantName}`);
  }

  lines.push(`• Price: KES ${params.price.toLocaleString()}`);

  if (params.productSlug) {
    const variantQuery = params.variantName ? `?variant=${slugifyVariant(params.variantName)}` : "";
    lines.push(`Link: ${siteUrl}/product/${params.productSlug}${variantQuery}`);
  }

  lines.push("Please confirm availability and help me complete my order.");

  const message = lines.join("\n");
  return `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
}
