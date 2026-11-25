import crypto from "crypto";

export interface TikTokUserData {
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  ttp?: string | null;
}

export interface TikTokContentItem {
  content_id: string;
  content_type?: string;
  content_name?: string;
  quantity?: number;
  price?: number;
}

export interface TikTokCustomProperties {
  value?: number;
  currency?: string;
  contents?: TikTokContentItem[];
  order_id?: string;
  description?: string;
  [key: string]: unknown;
}

export interface SendTikTokEventParams {
  eventName: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "PlaceAnOrder" | "CompletePayment" | "CompleteRegistration" | string;
  eventId?: string;
  eventSourceUrl?: string;
  userData?: TikTokUserData;
  properties?: TikTokCustomProperties;
  testEventCode?: string;
}

function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeAndHashEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return hashSha256(normalized);
}

function normalizeAndHashPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  }
  return hashSha256(digits);
}

export async function sendTikTokEvent(params: SendTikTokEventParams) {
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return { success: false, reason: "Missing NEXT_PUBLIC_TIKTOK_PIXEL_ID or TIKTOK_EVENTS_API_ACCESS_TOKEN" };
  }

  const userPayload: Record<string, unknown> = {};

  if (params.userData?.email) {
    userPayload.email = normalizeAndHashEmail(params.userData.email);
  }

  if (params.userData?.phone) {
    userPayload.phone = normalizeAndHashPhone(params.userData.phone);
  }

  if (params.userData?.clientIp) {
    userPayload.ip = params.userData.clientIp;
  }

  if (params.userData?.userAgent) {
    userPayload.user_agent = params.userData.userAgent;
  }

  if (params.userData?.ttp) {
    userPayload.ttp = params.userData.ttp;
  }

  const eventPayload: Record<string, unknown> = {
    event: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    user: userPayload,
    properties: params.properties || {},
  };

  if (params.eventId) {
    eventPayload.event_id = params.eventId;
  }

  if (params.eventSourceUrl) {
    eventPayload.page = {
      url: params.eventSourceUrl,
    };
  }

  const requestBody: Record<string, unknown> = {
    event_source: "web",
    event_source_id: pixelId,
    data: [eventPayload],
  };

  const testEventCode = params.testEventCode || process.env.TIKTOK_TEST_EVENT_CODE;
  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
  }

  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      console.error("[TikTok Events API Error]:", data);
    }
    return { success: res.ok && data.code === 0, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "TikTok Events API Network Error";
    console.error("[TikTok Events API Error] Request failed:", message);
    return { success: false, error: message };
  }
}
