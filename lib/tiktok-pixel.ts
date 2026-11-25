export const getTikTokPixelId = () => process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "";
export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "";

declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    ttq?: {
      page: () => void;
      track: (
        eventName: string,
        params?: Record<string, unknown>,
        options?: { event_id?: string }
      ) => void;
      identify: (params: Record<string, unknown>) => void;
      load: (pixelId: string, options?: Record<string, unknown>) => void;
      [key: string]: unknown;
    };
  }
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const consent = localStorage.getItem("halisi_cookie_consent");
    return consent !== "declined";
  } catch {
    return true;
  }
}

export function identifyTikTokUser(userData: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}) {
  if (typeof window === "undefined" || !getTikTokPixelId()) return;
  if (!hasConsent()) return;

  if (typeof window.ttq?.identify === "function") {
    const payload: Record<string, unknown> = {};
    if (userData.email) payload.email = userData.email.trim().toLowerCase();
    if (userData.phone) {
      let digits = userData.phone.replace(/\D/g, "");
      if (digits.startsWith("0") && digits.length === 10) {
        digits = `254${digits.slice(1)}`;
      }
      payload.phone_number = digits;
    }
    if (userData.name) payload.external_id = userData.name.trim();

    if (Object.keys(payload).length > 0) {
      window.ttq.identify(payload);
    }
  }
}

export function trackTikTokEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId?: string
) {
  if (typeof window === "undefined" || !getTikTokPixelId()) return;
  if (!hasConsent()) return;

  if (typeof window.ttq?.track === "function") {
    if (eventId) {
      window.ttq.track(eventName, params, { event_id: eventId });
    } else {
      window.ttq.track(eventName, params);
    }
  }
}

export function trackTikTokPageView(eventId?: string) {
  if (typeof window === "undefined" || !getTikTokPixelId()) return;
  if (!hasConsent()) return;

  if (typeof window.ttq?.page === "function") {
    window.ttq.page();
  }
}
