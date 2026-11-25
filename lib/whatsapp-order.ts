import { shortOrderRef } from "@/lib/order-tracking";
export interface WhatsAppOrderData {
  orderId: string;
  /** Customer-facing number, e.g. "HG-10001" */
  orderNumber?: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  fulfillment: "DELIVERY" | "PICKUP";
  county?: string | null;
  addressLine?: string;
  items: Array<{
    name: string;
    slug?: string;
    quantity: number;
    price: number;
    variantName?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  engravingText?: string;
  engravingFee?: number;
  discountAmount?: number;
  total: number;
  amountDueNow?: number;
  amountDueOnDelivery?: number;
  paymentMethod: string;
  mpesaTransactionCode?: string;
  customerNote?: string;
}

function slugifyVariant(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildWhatsAppOrderMessage(data: WhatsAppOrderData): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
  const lines: string[] = [];

  lines.push(`*NEW ORDER - HALISI GIFTS SHOP*`);
  const orderNo = data.orderNumber || shortOrderRef(data.orderId);
  lines.push(`Order No: ${orderNo}`);
  lines.push(`Order ID: #${data.orderId}`);
  lines.push(`Track: ${siteUrl}/track-order?order=${encodeURIComponent(orderNo)}`);
  lines.push(``);

  lines.push(`*Customer Details:*`);
  lines.push(`• Name: ${data.fullName}`);
  lines.push(`• Phone: ${data.phoneNumber}`);
  lines.push(`• Email: ${data.email}`);
  lines.push(``);

  lines.push(`*Delivery Details:*`);
  if (data.fulfillment === "DELIVERY") {
    lines.push(`• Fulfillment: Delivery`);
    if (data.county) lines.push(`• County: ${data.county}`);
    if (data.addressLine) lines.push(`• Address: ${data.addressLine}`);
  } else {
    lines.push(`• Fulfillment: Pickup at Shop (Free)`);
  }
  lines.push(``);

  lines.push(`*Order Items:*`);
  for (const item of data.items) {
    const itemTitle = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    lines.push(`• ${item.quantity}x ${itemTitle} - KES ${(item.price * item.quantity).toLocaleString()}`);
    if (item.slug) {
      const variantQuery = item.variantName ? `?variant=${slugifyVariant(item.variantName)}` : "";
      lines.push(`  Link: ${siteUrl}/product/${item.slug}${variantQuery}`);
    }
  }
  lines.push(``);

  if (data.engravingText) {
    lines.push(`*Custom Engraving:*`);
    lines.push(`"${data.engravingText}" (+KES ${(data.engravingFee || 0).toLocaleString()})`);
    lines.push(``);
  }

  lines.push(`*Payment Summary:*`);
  lines.push(`• Subtotal: KES ${data.subtotal.toLocaleString()}`);
  if (data.deliveryFee > 0) {
    lines.push(`• Delivery Fee: KES ${data.deliveryFee.toLocaleString()}`);
  } else {
    lines.push(`• Delivery: Free`);
  }
  if (data.discountAmount && data.discountAmount > 0) {
    lines.push(`• Discount: -KES ${data.discountAmount.toLocaleString()}`);
  }
  lines.push(`• Total: KES ${data.total.toLocaleString()}`);

  lines.push(`• Payment Method: ${data.paymentMethod === "MPESA" ? "Lipa na M-Pesa (Till 8223592)" : "Cash / Pay at Shop"}`);

  if (data.mpesaTransactionCode) {
    lines.push(`• M-Pesa Confirmation: ${data.mpesaTransactionCode}`);
  }
  lines.push(``);

  if (data.customerNote) {
    lines.push(`*Note to Seller:*`);
    lines.push(`"${data.customerNote}"`);
    lines.push(``);
  }

  lines.push(`Hi Halisi Gifts, I have placed my order above. Please confirm and let me know the delivery timeline. Thank you!`);

  return lines.join("\n");
}

export function getWhatsAppOrderUrl(data: WhatsAppOrderData): string {
  const storePhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "254729596165";
  const message = buildWhatsAppOrderMessage(data);
  return `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
}

export function getCustomerWhatsAppUrl(rawPhone: string, message: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  let formatted = digits;
  if (formatted.startsWith("0")) {
    formatted = `254${formatted.slice(1)}`;
  } else if (formatted.startsWith("+254")) {
    formatted = formatted.replace("+", "");
  } else if (!formatted.startsWith("254") && formatted.length === 9) {
    formatted = `254${formatted}`;
  }
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}
