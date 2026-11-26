import { formatCustomerFirstName } from "@/lib/crm";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://halisigifts.com"
).replace(/\/+$/, "");

export interface AttachedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

export function toAbsoluteImageUrl(
  imagePath?: string | null,
  baseUrl = BASE_URL
): string {
  if (!imagePath) return `${baseUrl}/halisi-logo.png`;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const clean = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${baseUrl}${clean}`;
}

export function personalizeMarketingMessage(
  template: string,
  customerName?: string | null
): string {
  const firstName = formatCustomerFirstName(customerName, "Valued Customer");
  const fullName = customerName?.trim() || "Valued Customer";

  return template
    .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
    .replace(/\{\{\s*name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*fullName\s*\}\}/gi, fullName);
}

export function buildMarketingEmailHtml(params: {
  customerName?: string | null;
  rawMessage: string;
  products: AttachedProduct[];
  unsubscribeToken: string;
}): string {
  const personalizedMessage = personalizeMarketingMessage(
    params.rawMessage,
    params.customerName
  );

  const formattedParagraphs = personalizedMessage
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">${p.replace(
          /\n/g,
          "<br/>"
        )}</p>`
    )
    .join("");

  const unsubscribeUrl = `${BASE_URL}/api/crm/unsubscribe?token=${params.unsubscribeToken}`;

  const productCardsHtml = params.products
    .map((p) => {
      const productUrl = `${BASE_URL}/product/${p.slug}`;
      const imageUrl = toAbsoluteImageUrl(p.images[0]);
      const priceFormatted = Number(p.price).toLocaleString("en-KE");

      return `
<!--[if mso]>
<td width="180" valign="top" style="padding: 6px;">
<![endif]-->
<div class="product-grid-card" style="display: inline-block; vertical-align: top; width: 176px; margin: 6px; text-align: center; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background-color: #ffffff; box-sizing: border-box;">
  <a href="${productUrl}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
    <div style="width: 100%; height: 150px; background-color: #f9fafb; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
      <img src="${imageUrl}" alt="${p.name}" width="150" height="150" style="width: 100%; height: 150px; object-fit: cover; display: block; border: 0;" />
    </div>
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; color: #111827; line-height: 1.35; height: 36px; overflow: hidden; margin-bottom: 6px;">
      ${p.name}
    </div>
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #266e00; margin-bottom: 10px;">
      KES ${priceFormatted}
    </div>
    <div style="display: block; background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 10px; border-radius: 4px; text-align: center;">
      View Product
    </div>
  </a>
</div>
<!--[if mso]>
</td>
<![endif]-->`;
    })
    .join("");

  const showcaseHtml =
    params.products.length > 0
      ? `
    <div style="margin: 28px 0 20px 0;">
      <div style="border-top: 1px solid #f3f4f6; margin-bottom: 22px;"></div>

      <div style="text-align: center; margin-bottom: 18px;">
        <h3 style="font-family: Georgia, serif; font-size: 16px; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
          Featured Collections
        </h3>
      </div>

      <div class="product-grid-container" style="text-align: center; font-size: 0; padding: 0 0 10px 0;">
        <!--[if mso]>
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
        <tr>
        <![endif]-->
        ${productCardsHtml}
        <!--[if mso]>
        </tr>
        </table>
        <![endif]-->
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${BASE_URL}" target="_blank" style="display: inline-block; background-color: #266e00; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 11px 26px; border-radius: 6px; text-decoration: none;">
          Explore Complete Catalog
        </a>
      </div>
    </div>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Halisi Gifts Shop</title>
  <style>
    @media only screen and (max-width: 600px) {
      .product-grid-card {
        width: 44% !important;
        min-width: 136px !important;
        margin: 5px 2% !important;
        display: inline-block !important;
      }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 24px 12px;">
  <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <div style="background-color: #000000; padding: 24px; text-align: center;">
      <a href="${BASE_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
        <span style="font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase;">
          Halisi Gifts Shop
        </span>
      </a>
      <div style="color: #bbf7d0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">
        Original Luxury Watches, Perfumes &amp; Curated Gifts
      </div>
    </div>

    <div style="padding: 32px 24px;">
      ${formattedParagraphs}
      ${showcaseHtml}
    </div>

    <div style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 12px; line-height: 1.5;">
      <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
        Halisi Gifts Shop Kenya
      </div>
      <div style="margin-bottom: 8px;">
        Same-Day Nairobi Delivery &amp; Nationwide Shipping<br/>
        WhatsApp / Call: +254 729 596 165
      </div>
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <a href="${unsubscribeUrl}" target="_blank" style="color: #9ca3af; text-decoration: underline;">
          Unsubscribe from marketing emails
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
