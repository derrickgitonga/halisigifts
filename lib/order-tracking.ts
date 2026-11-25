/** Shared helpers for customer order tracking (used by the API and the page). */

export type TrackedStatus = "PENDING" | "PROCESSING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface TrackedOrder {
  reference: string; // short, human-friendly order number
  status: TrackedStatus;
  placedAt: string;
  updatedAt: string;
  deliveryMethod: "PICKUP" | "RIDER" | "COURIER";
  county: string | null;
  paymentMethod: string;
  total: number;
  amountDueOnDelivery: number;
  items: Array<{ name: string; variantName: string | null; quantity: number; price: number; slug: string }>;
}

export const ORDER_NUMBER_PREFIX = "HG";

/** Customer-facing order number, e.g. 10001 → "HG-10001". */
export function formatOrderNumber(orderNumber: number): string {
  return `${ORDER_NUMBER_PREFIX}-${orderNumber}`;
}

/** Order number to show: the sequential number when known, else the legacy short ID. */
export function displayOrderNumber(order: { id: string; orderNumber?: number | null }): string {
  return order.orderNumber ? formatOrderNumber(order.orderNumber) : shortOrderRef(order.id);
}

/** Parses "HG-10001", "hg10001", "#10001" or "10001". Returns null for anything else. */
export function parseOrderNumber(input: string): number | null {
  const m = input.trim().replace(/^#/, "").match(/^(?:hg[-\s]?)?(\d{4,9})$/i);
  return m ? Number(m[1]) : null;
}

/** Legacy short reference (orders placed before sequential numbers): last 8 characters of the ID. */
export function shortOrderRef(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

/** Accepts "#ABCD1234", "abcd1234" or the full order ID. */
export function normaliseOrderRef(input: string): string {
  return input.trim().replace(/^#/, "").replace(/\s+/g, "").toLowerCase();
}

/** Compare Kenyan phone numbers regardless of 07…, 7…, 2547… or +254 7… formats. */
export function phonesMatch(a: string, b: string): boolean {
  const last9 = (v: string) => v.replace(/\D/g, "").slice(-9);
  const x = last9(a);
  const y = last9(b);
  return x.length === 9 && x === y;
}
