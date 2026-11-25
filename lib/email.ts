import { Resend } from "resend";

export type ReminderTier = 1 | 2 | 3;

export interface CartSessionWithItems {
  id: string;
  email: string | null;
  customerName: string | null;
  recoveryToken: string | null;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number | string | { toString(): string };
      compareAtPrice?: number | string | { toString(): string } | null;
      images: string[];
    };
  }>;
}

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}
const FROM_EMAIL = process.env.FROM_EMAIL || "Halisi Gifts <orders@halisigifts.com>";
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.NEXTAUTH_URL || "https://halisigifts.com").replace(/\/+$/, "");

function getTierCopy(tier: ReminderTier, customerName?: string | null) {
  const greeting = customerName ? `Hello ${customerName},` : "Hello,";

  if (tier === 1) {
    return {
      subject: "You left something timeless in your cart - Halisi Gifts",
      headline: "Did you forget something special?",
      subhead: `${greeting} We noticed you left some exquisite items in your Halisi shopping cart. They are safely reserved for you.`,
      ctaText: "Complete Your Order",
      discountBadge: null,
    };
  }

  if (tier === 2) {
    return {
      subject: "Your cart misses you - Halisi Gifts",
      headline: "Your cart misses you",
      subhead: `${greeting} Your lovely chosen items are still saved safely in your cart, waiting just for you. Whenever you are ready, we would be delighted to pack and deliver them to your doorstep.`,
      ctaText: "Return to Your Cart",
      discountBadge: "Saved with Care for You",
    };
  }

  return {
    subject: "We kept your special items safe: your cart misses you - Halisi Gifts",
    headline: "Your cart misses you",
    subhead: `${greeting} We wanted to gently check in with you one last time. Your selected pieces are still waiting for you in your cart. Whenever you are ready to treat yourself or someone special, we are here to make your delivery smooth and effortless.`,
    ctaText: "Complete Your Order",
    discountBadge: "Reserved for You",
  };
}

export function generateAbandonedCartHtml(
  session: CartSessionWithItems,
  tier: ReminderTier
): string {
  const { headline, subhead, ctaText, discountBadge } = getTierCopy(tier, session.customerName);
  const recoveryUrl = `${BASE_URL}/cart/recover?token=${session.recoveryToken}`;

  const itemsHtml = session.items
    .map((item) => {
      const p = item.product;
      const rawPrice = Number(p.price) || 0;
      const formattedPrice = `KES ${rawPrice.toLocaleString()}`;
      const img = p.images?.[0] || `${BASE_URL}/halisi-logo.png`;
      const fullImgUrl = img.startsWith("http") ? img : `${BASE_URL}${img}`;

      return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #E5E7EB;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="72" style="vertical-align: middle;">
                <img src="${fullImgUrl}" alt="${p.name}" width="64" height="64" style="display: block; border-radius: 8px; object-fit: contain; background-color: #F9FAFB; border: 1px solid #F3F4F6;" />
              </td>
              <td style="vertical-align: middle; padding-left: 16px;">
                <div style="font-family: 'Times New Roman', serif; font-size: 15px; font-weight: 600; color: #111827; line-height: 20px;">
                  ${p.name}
                </div>
                <div style="font-size: 13px; color: #6B7280; margin-top: 4px;">
                  Qty: ${item.quantity} &times; ${formattedPrice}
                </div>
              </td>
              <td align="right" style="vertical-align: middle; font-size: 15px; font-weight: 600; color: #111827;">
                KES ${(rawPrice * item.quantity).toLocaleString()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      `;
    })
    .join("");

  const subtotal = session.items.reduce(
    (acc, it) => acc + (Number(it.product.price) || 0) * it.quantity,
    0
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halisi Gifts</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Logo -->
          <tr>
            <td align="center" style="background-color: #FFFFFF; padding: 32px 24px 20px 24px; border-bottom: 1px solid #F3F4F6;">
              <img src="${BASE_URL}/halisi-logo.png" alt="Halisi Gifts" width="160" style="display: block; max-height: 48px; object-fit: contain;" />
            </td>
          </tr>

          <!-- Banner / Copy -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              ${
                discountBadge
                  ? `<div style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px;">${discountBadge}</div>`
                  : ""
              }
              <h1 style="font-family: 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">
                ${headline}
              </h1>
              <p style="font-size: 15px; color: #4B5563; line-height: 24px; margin: 0;">
                ${subhead}
              </p>
            </td>
          </tr>

          <!-- Cart Items Box -->
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                ${itemsHtml}
              </table>
              <div style="text-align: right; padding: 16px 0; font-size: 16px; font-weight: 700; color: #111827;">
                Total: KES ${subtotal.toLocaleString()}
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 12px 32px 36px 32px;">
              <a href="${recoveryUrl}" target="_blank" style="display: inline-block; background-color: #C5A049; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 36px; border-radius: 8px; box-shadow: 0 2px 4px rgba(197, 160, 73, 0.3);">
                ${ctaText} &rarr;
              </a>
              <p style="font-size: 12px; color: #9CA3AF; margin-top: 16px;">
                Button not working? Copy and paste this link in your browser:<br/>
                <a href="${recoveryUrl}" style="color: #C5A049; word-break: break-all;">${recoveryUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="font-size: 12px; color: #6B7280; margin: 0 0 6px 0;">
                Halisi Gifts Shop - Luxury &amp; Timeless Essentials
              </p>
              <p style="font-size: 11px; color: #9CA3AF; margin: 0;">
                You received this email because you started an order on our store.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendAbandonedCartEmail(
  session: CartSessionWithItems,
  tier: ReminderTier
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!session.email) {
    return { success: false, error: "Cart session has no email" };
  }

  const { subject } = getTierCopy(tier, session.customerName);
  const html = generateAbandonedCartHtml(session, tier);

  const resend = getResendClient();
  if (!resend) {
    console.log(`[Email Mock - Resend key not set] Tier ${tier} reminder to ${session.email}`);
    console.log(`[Subject]: ${subject}`);
    console.log(`[Recovery URL]: ${BASE_URL}/cart/recover?token=${session.recoveryToken}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: session.email,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { success: false, error: message };
  }
}

export function generatePasswordResetHtml(params: {
  name?: string | null;
  resetUrl: string;
}): string {
  const greeting = params.name ? `Hello ${params.name},` : "Hello,";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Halisi Gifts</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <tr>
            <td align="center" style="background-color: #FFFFFF; padding: 32px 24px 20px 24px; border-bottom: 1px solid #F3F4F6;">
              <img src="${BASE_URL}/halisi-logo.png" alt="Halisi Gifts" width="160" style="display: block; max-height: 48px; object-fit: contain;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px;">
                Admin Portal Security
              </div>
              <h1 style="font-family: 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">
                Password Reset Request
              </h1>
              <p style="font-size: 15px; color: #4B5563; line-height: 24px; margin: 0 0 16px 0;">
                ${greeting} We received a request to reset the password for your Halisi Gifts administrator account.
              </p>
              <p style="font-size: 14px; color: #6B7280; line-height: 22px; margin: 0;">
                Click the button below to set a new password. This link is valid for 60 minutes and can only be used once.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 12px 32px 32px 32px;">
              <a href="${params.resetUrl}" target="_blank" style="display: inline-block; background-color: #C5A049; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 36px; border-radius: 8px; box-shadow: 0 2px 4px rgba(197, 160, 73, 0.3);">
                Reset Password &rarr;
              </a>
              <p style="font-size: 12px; color: #9CA3AF; margin-top: 20px; line-height: 18px;">
                Button not working? Copy and paste this link in your browser:<br/>
                <a href="${params.resetUrl}" style="color: #C5A049; word-break: break-all;">${params.resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="font-size: 12px; color: #6B7280; margin: 0 0 6px 0;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
              <p style="font-size: 11px; color: #9CA3AF; margin: 0;">
                Halisi Gifts Shop &bull; Admin Security Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name?: string | null;
  resetUrl: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = "Reset Your Password - Halisi Gifts Admin";
  const html = generatePasswordResetHtml(params);

  const resend = getResendClient();
  if (!resend) {
    console.log(`[Email Mock - Resend key not set] Password reset for ${params.email}`);
    console.log(`[Reset URL]: ${params.resetUrl}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { success: false, error: message };
  }
}

export async function sendAdminAbandonedCartAlert(_params: {
  sentCount: number;
  byTier: { tier1: number; tier2: number; tier3: number };
  details: Array<{
    email: string;
    tier: ReminderTier;
    status: string;
    cartSessionId: string;
  }>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return { success: true };
}

