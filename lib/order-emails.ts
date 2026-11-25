import { Resend } from "resend";
import { displayOrderNumber } from "@/lib/order-tracking";

/* ------------------------------------------------------------------ *
 * Transactional order emails (Resend)
 *  - Order confirmation → customer
 *  - New order alert    → shop (ORDER_ALERT_EMAIL)
 *  - Status updates     → customer (confirmed / shipped / delivered / cancelled)
 *
 * Without RESEND_API_KEY the emails are logged instead of sent, so local
 * development and tests never send real mail.
 * ------------------------------------------------------------------ */

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}
const FROM_EMAIL = process.env.FROM_EMAIL || "Halisi Gifts <orders@halisigifts.com>";
const ALERT_EMAIL = process.env.ORDER_ALERT_EMAIL || process.env.ADMIN_EMAIL || "";
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

const STORE = {
  name: "Halisi Gifts Shop",
  tillNumber: "8223592",
  tillName: "Time Crew Ventures",
  whatsapp: "254729596165",
  whatsappDisplay: "+254729596165",
  address: "Accra Trade Centre, 2nd Floor, Shop SF21, Accra Road, Nairobi CBD",
  green: "#266e00",
};

/* ---------------- types ---------------- */

export type EmailOrderStatus = "PENDING" | "PROCESSING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface EmailOrder {
  id: string;
  orderNumber?: number | null;
  status: EmailOrderStatus;
  createdAt: Date;
  deliveryMethod: "PICKUP" | "RIDER" | "COURIER";
  county: string | null;
  paymentMethod: "MPESA" | "CARD" | "CASH_ON_DELIVERY" | string;
  subtotal: number;
  deliveryFee: number;
  engravingFee: number;
  discountAmount: number;
  total: number;
  amountDueNow: number;
  amountDueOnDelivery: number;
  guestEmail: string | null;
  shippingAddress: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    addressLine?: string;
    city?: string;
    engravingText?: string;
    mpesaTransactionCode?: string;
    customerNote?: string;
  };
  items: Array<{ name: string; slug: string; variantName: string | null; quantity: number; price: number }>;
}

/* ---------------- helpers ---------------- */

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;

function customerEmail(order: EmailOrder): string | null {
  const email = (order.shippingAddress.email || order.guestEmail || "").trim();
  return email.includes("@") ? email : null;
}

function firstName(order: EmailOrder): string {
  return (order.shippingAddress.fullName || "").trim().split(/\s+/)[0] || "there";
}

function trackUrl(order: EmailOrder): string {
  return `${BASE_URL}/track-order?order=${encodeURIComponent(displayOrderNumber(order))}`;
}

function deliveryLabel(order: EmailOrder): string {
  if (order.deliveryMethod === "PICKUP") return "Shop pickup (Nairobi CBD)";
  const how = order.deliveryMethod === "RIDER" ? "Rider delivery" : "Courier delivery";
  return order.county ? `${how}, ${order.county}` : how;
}

function paymentLabel(method: string): string {
  return method === "MPESA" ? "M-Pesa" : method === "CARD" ? "Card" : "Cash at pickup";
}

/* ---------------- layout ---------------- */

function button(href: string, label: string, color = "#111111") {
  return `<a href="${esc(href)}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.04em;padding:12px 26px;border-radius:999px;">${esc(label)}</a>`;
}

function layout(params: { preheader: string; badge: string; title: string; intro: string; body: string }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAF9;font-family:Montserrat,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111111;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(params.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAF9;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #E5E7EB;">
  <tr><td align="center" style="padding:28px 24px 20px;border-bottom:1px solid #F1F1F1;">
    <img src="${BASE_URL}/halisi-logo.png" alt="Halisi Gifts" width="150" style="display:block;max-height:46px;">
  </td></tr>
  <tr><td style="padding:32px 32px 8px;text-align:center;">
    <div style="display:inline-block;background:${STORE.green};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:5px 12px;">${esc(params.badge)}</div>
    <h1 style="font-family:Marcellus,Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.3;margin:16px 0 10px;">${esc(params.title)}</h1>
    <p style="font-size:15px;line-height:24px;color:#4B5563;margin:0;">${params.intro}</p>
  </td></tr>
  <tr><td style="padding:24px 32px 8px;">${params.body}</td></tr>
  <tr><td style="padding:28px 32px 32px;border-top:1px solid #F1F1F1;text-align:center;font-size:12px;line-height:20px;color:#6B7280;">
    Questions? WhatsApp us on <a href="https://wa.me/${STORE.whatsapp}" style="color:${STORE.green};">${STORE.whatsappDisplay}</a><br>
    ${esc(STORE.name)} · ${esc(STORE.address)}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function itemsTable(order: EmailOrder) {
  const rows = order.items
    .map(
      (it) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #F1F1F1;font-size:14px;">
        <a href="${BASE_URL}/product/${esc(it.slug)}" style="color:#111111;text-decoration:none;">${esc(it.name)}</a>
        <div style="font-size:12px;color:#6B7280;">Qty ${it.quantity}${it.variantName ? ` · ${esc(it.variantName)}` : ""}</div>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #F1F1F1;font-size:14px;white-space:nowrap;">${ksh(it.price * it.quantity)}</td>
    </tr>`
    )
    .join("");

  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-size:14px;color:${strong ? "#111111" : "#4B5563"};${strong ? "font-weight:700;" : ""}">${label}</td><td align="right" style="padding:4px 0;font-size:14px;${strong ? "font-weight:700;" : ""}">${value}</td></tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    ${line("Subtotal", ksh(order.subtotal))}
    ${order.deliveryFee ? line("Delivery", ksh(order.deliveryFee)) : ""}
    ${order.engravingFee ? line("Engraving", ksh(order.engravingFee)) : ""}
    ${order.discountAmount ? line("Discount", `− ${ksh(order.discountAmount)}`) : ""}
    ${line("Total", ksh(order.total), true)}
  </table>`;
}

function detailsBlock(order: EmailOrder) {
  const a = order.shippingAddress;
  const where =
    order.deliveryMethod === "PICKUP"
      ? esc(STORE.address)
      : [a.addressLine, a.city, order.county].filter(Boolean).map(esc).join(", ");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#F8FAF9;">
    <tr><td style="padding:16px 18px;font-size:13px;line-height:21px;color:#374151;">
      <strong>Order:</strong> ${esc(displayOrderNumber(order))}<br>
      <strong>Delivery:</strong> ${esc(deliveryLabel(order))}<br>
      ${where ? `<strong>${order.deliveryMethod === "PICKUP" ? "Pickup at" : "Deliver to"}:</strong> ${where}<br>` : ""}
      <strong>Payment:</strong> ${esc(paymentLabel(order.paymentMethod))}
      ${a.engravingText ? `<br><strong>Engraving:</strong> ${esc(a.engravingText)}` : ""}
    </td></tr>
  </table>`;
}

function paymentBlock(order: EmailOrder) {
  if (order.paymentMethod !== "MPESA" || order.amountDueNow <= 0) {
    return order.amountDueOnDelivery > 0
      ? `<p style="font-size:14px;line-height:22px;color:#374151;margin:20px 0 0;">Balance of <strong>${ksh(order.amountDueOnDelivery)}</strong> is payable on ${order.deliveryMethod === "PICKUP" ? "pickup" : "delivery"}.</p>`
      : "";
  }
  const code = order.shippingAddress.mpesaTransactionCode?.trim();
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid ${STORE.green};">
    <tr><td style="padding:16px 18px;font-size:14px;line-height:22px;color:#111111;">
      <strong style="color:${STORE.green};">Payment: Lipa na M-Pesa</strong><br>
      ${
        code
          ? `We received your M-Pesa code <strong>${esc(code)}</strong> and will confirm the payment shortly.`
          : `Pay <strong>${ksh(order.amountDueNow)}</strong> to Buy Goods Till <strong>${STORE.tillNumber}</strong> (${esc(STORE.tillName)}), then send us the confirmation code on WhatsApp.`
      }
      ${order.amountDueOnDelivery > 0 ? `<br>Balance on ${order.deliveryMethod === "PICKUP" ? "pickup" : "delivery"}: <strong>${ksh(order.amountDueOnDelivery)}</strong>` : ""}
    </td></tr>
  </table>`;
}

/* ---------------- templates ---------------- */

export function buildOrderConfirmationEmail(order: EmailOrder) {
  const number = displayOrderNumber(order);
  const subject = `Order ${number} received – Halisi Gifts`;
  const html = layout({
    preheader: `Thanks for your order ${number}. Here's your summary.`,
    badge: "Order received",
    title: `Thank you, ${firstName(order)}!`,
    intro: `We've received your order <strong>${esc(number)}</strong> and will confirm it shortly.`,
    body:
      itemsTable(order) +
      paymentBlock(order) +
      detailsBlock(order) +
      `<p style="text-align:center;margin:28px 0 8px;">${button(trackUrl(order), "Track your order", STORE.green)}</p>`,
  });
  return { subject, html };
}

export function buildNewOrderAlertEmail(order: EmailOrder) {
  const a = order.shippingAddress;
  const number = displayOrderNumber(order);
  const subject = `New order ${number} – ${ksh(order.total)} – ${a.fullName || "Customer"}`;
  const html = layout({
    preheader: `${a.fullName || "A customer"} placed order ${number}.`,
    badge: "New order",
    title: `${number} · ${ksh(order.total)}`,
    intro: `${esc(a.fullName || "Customer")} · <a href="tel:${esc(a.phoneNumber)}" style="color:${STORE.green};">${esc(a.phoneNumber)}</a> · ${esc(customerEmail(order) || "no email")}`,
    body:
      itemsTable(order) +
      detailsBlock(order) +
      (a.mpesaTransactionCode
        ? `<p style="font-size:14px;margin:16px 0 0;"><strong>M-Pesa code:</strong> ${esc(a.mpesaTransactionCode)} (verify before confirming)</p>`
        : "") +
      (a.customerNote ? `<p style="font-size:14px;margin:12px 0 0;"><strong>Note:</strong> ${esc(a.customerNote)}</p>` : "") +
      `<p style="text-align:center;margin:28px 0 8px;">${button(`${BASE_URL}/admin`, "Open admin")}</p>`,
  });
  return { subject, html };
}

const STATUS_COPY: Partial<
  Record<EmailOrderStatus, (o: EmailOrder) => { badge: string; title: string; intro: string }>
> = {
  PROCESSING: (o) => ({
    badge: "Confirmed",
    title: "Your order is confirmed",
    intro: `Good news, ${esc(firstName(o))}! We're preparing order <strong>${esc(displayOrderNumber(o))}</strong>.`,
  }),
  PAID: (o) => ({
    badge: "Payment received",
    title: "Payment received",
    intro: `Thanks, ${esc(firstName(o))}. We've received payment for order <strong>${esc(displayOrderNumber(o))}</strong> and are preparing it.`,
  }),
  SHIPPED: (o) =>
    o.deliveryMethod === "PICKUP"
      ? {
          badge: "Ready for pickup",
          title: "Your order is ready for pickup",
          intro: `Order <strong>${esc(displayOrderNumber(o))}</strong> is ready at our shop: ${esc(STORE.address)}. Open Mon–Sat, 8:00am – 7:30pm.`,
        }
      : {
          badge: "On the way",
          title: "Your order is on the way",
          intro: `Order <strong>${esc(displayOrderNumber(o))}</strong> has left our shop${o.deliveryMethod === "RIDER" ? " with our rider" : " with the courier"}. We'll be in touch if anything changes.`,
        },
  DELIVERED: (o) => ({
    badge: o.deliveryMethod === "PICKUP" ? "Collected" : "Delivered",
    title: "Enjoy your purchase!",
    intro: `Order <strong>${esc(displayOrderNumber(o))}</strong> is complete. Thank you for shopping with Halisi Gifts, ${esc(firstName(o))}.`,
  }),
  CANCELLED: (o) => ({
    badge: "Cancelled",
    title: "Your order has been cancelled",
    intro: `Order <strong>${esc(displayOrderNumber(o))}</strong> has been cancelled. If you weren't expecting this, please WhatsApp us on ${STORE.whatsappDisplay}.`,
  }),
};

export function buildOrderStatusEmail(order: EmailOrder) {
  const copy = STATUS_COPY[order.status]?.(order);
  if (!copy) return null;
  const subject = `${copy.title} – ${displayOrderNumber(order)}`;
  const html = layout({
    preheader: `${copy.title}. Order ${displayOrderNumber(order)}.`,
    badge: copy.badge,
    title: copy.title,
    intro: copy.intro,
    body:
      (order.status === "CANCELLED" ? "" : itemsTable(order)) +
      `<p style="text-align:center;margin:28px 0 8px;">${button(trackUrl(order), "View order status", STORE.green)}</p>`,
  });
  return { subject, html };
}

/* ---------------- sending ---------------- */

async function send(to: string, email: { subject: string; html: string }, tag: string) {
  const resend = getResendClient();
  if (!resend) {
    console.log(`[order-email:${tag}] (RESEND_API_KEY not set, not sent) to=${to} subject="${email.subject}"`);
    return { sent: false as const };
  }
  if (!FROM_EMAIL) {
    console.error(`[order-email:${tag}] FROM_EMAIL is not set; cannot send`);
    return { sent: false as const };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to: [to], subject: email.subject, html: email.html });
    if (error) {
      console.error(`[order-email:${tag}] Resend error`, error);
      return { sent: false as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error(`[order-email:${tag}] failed`, err);
    return { sent: false as const };
  }
}

/** Confirmation to the customer + alert to the shop. Never throws. */
export async function sendNewOrderEmails(order: EmailOrder) {
  const to = customerEmail(order);
  await Promise.all([
    to ? send(to, buildOrderConfirmationEmail(order), "confirmation") : Promise.resolve(),
    ALERT_EMAIL ? send(ALERT_EMAIL, buildNewOrderAlertEmail(order), "shop-alert") : Promise.resolve(),
  ]);
}

/** Status update to the customer (no email for PENDING). Never throws. */
export async function sendOrderStatusEmail(order: EmailOrder) {
  const to = customerEmail(order);
  const email = buildOrderStatusEmail(order);
  if (to && email) await send(to, email, `status-${order.status.toLowerCase()}`);
}

/** Shape a Prisma order (with items + product) for the email templates. */
export function toEmailOrder(order: {
  id: string;
  orderNumber?: number | null;
  status: string;
  createdAt: Date;
  deliveryMethod: string;
  county: string | null;
  paymentMethod: string;
  subtotal: unknown;
  deliveryFee: number;
  engravingFee: number;
  discountAmount: unknown;
  total: unknown;
  amountDueNow: unknown;
  amountDueOnDelivery: unknown;
  guestEmail: string | null;
  shippingAddress: unknown;
  items: Array<{
    quantity: number;
    priceAtPurchase: unknown;
    variantName: string | null;
    product: { name: string; slug: string };
  }>;
}): EmailOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as EmailOrderStatus,
    createdAt: order.createdAt,
    deliveryMethod: order.deliveryMethod as EmailOrder["deliveryMethod"],
    county: order.county,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    deliveryFee: order.deliveryFee,
    engravingFee: order.engravingFee,
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    amountDueNow: Number(order.amountDueNow),
    amountDueOnDelivery: Number(order.amountDueOnDelivery),
    guestEmail: order.guestEmail,
    shippingAddress: (order.shippingAddress ?? {}) as EmailOrder["shippingAddress"],
    items: order.items.map((it) => ({
      name: it.product.name,
      slug: it.product.slug,
      variantName: it.variantName,
      quantity: it.quantity,
      price: Number(it.priceAtPurchase),
    })),
  };
}
