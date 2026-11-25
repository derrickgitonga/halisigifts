export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

declare global {
  interface Window {
    __halisiMetaPixelId?: string;
    fbq?: (
      action: string,
      eventNameOrPixelId: string,
      paramsOrEventName?: Record<string, unknown> | string,
      optionsOrParams?: { eventID?: string } | Record<string, unknown>
    ) => void;
    _fbq?: unknown;
  }
}

export const getMetaPixelId = () =>
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  (typeof window !== "undefined" ? window.__halisiMetaPixelId : "") ||
  "";

export function hasConsent(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const consent = localStorage.getItem("halisi_cookie_consent");
    return consent !== "declined";
  } catch {
    return true;
  }
}

export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId?: string
) {
  if (typeof window === "undefined" || !getMetaPixelId()) return;
  if (!hasConsent()) return;

  if (typeof window.fbq === "function") {
    if (eventId) {
      window.fbq("track", eventName, params, { eventID: eventId });
    } else {
      window.fbq("track", eventName, params);
    }
  }
}

export function trackPageView(eventId?: string) {
  if (typeof window === "undefined" || !getMetaPixelId()) return;
  if (!hasConsent()) return;

  if (typeof window.fbq === "function") {
    if (eventId) {
      window.fbq("track", "PageView", {}, { eventID: eventId });
    } else {
      window.fbq("track", "PageView");
    }
  }
}
