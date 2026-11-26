import { normalizeKenyanPhone, formatCustomerFirstName } from "@/lib/crm";
import { type AttachedProduct } from "@/lib/email-marketing";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://halisigifts.com"
).replace(/\/+$/, "");

export function formatWhatsAppCampaignMessage(params: {
  customerName?: string | null;
  message: string;
  products: AttachedProduct[];
}): string {
  const firstName = formatCustomerFirstName(params.customerName, "there");
  const personalized = params.message
    .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
    .replace(/\{\{\s*name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*fullName\s*\}\}/gi, params.customerName?.trim() || "there");

  let productBlock = "";
  if (params.products.length > 0) {
    productBlock =
      "\n\n*Featured Collections:*\n" +
      params.products
        .map((p, idx) => {
          const priceFormatted = Number(p.price).toLocaleString("en-KE");
          return `${idx + 1}. *${p.name}* (KES ${priceFormatted})\n${BASE_URL}/product/${p.slug}`;
        })
        .join("\n\n");
  }

  const footer = `\n\n_Halisi Gifts Shop Kenya | WhatsApp: +254729596165_`;
  return `${personalized}${productBlock}${footer}`.trim();
}

export function buildWhatsAppDirectUrl(phone: string, text: string): string | null {
  const normalized = normalizeKenyanPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export interface WhatsAppBroadcastContact {
  id: string;
  name: string;
  phone: string;
}

export function generateWhatsAppBroadcastCsv(params: {
  contacts: WhatsAppBroadcastContact[];
  message: string;
  products: AttachedProduct[];
}): string {
  const header = `"Contact ID","Name","Phone","DirectWhatsAppUrl","FormattedMessage"\n`;
  const rows = params.contacts.map((c) => {
    const formatted = formatWhatsAppCampaignMessage({
      customerName: c.name,
      message: params.message,
      products: params.products,
    });
    const url = buildWhatsAppDirectUrl(c.phone, formatted) || "";
    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

    return [
      escapeCsv(c.id),
      escapeCsv(c.name),
      escapeCsv(c.phone),
      escapeCsv(url),
      escapeCsv(formatted),
    ].join(",");
  });

  return header + rows.join("\n");
}
