import crypto from "crypto";

export interface CapiUserData {
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface CapiCustomData {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  num_items?: number;
  order_id?: string;
  [key: string]: unknown;
}

export interface SendCapiEventParams {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  userData?: CapiUserData;
  customData?: CapiCustomData;
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

export async function sendCapiEvent(params: SendCapiEventParams) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return { success: false, reason: "Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN" };
  }

  const userPayload: Record<string, unknown> = {};

  if (params.userData?.email) {
    userPayload.em = [normalizeAndHashEmail(params.userData.email)];
  }

  if (params.userData?.phone) {
    userPayload.ph = [normalizeAndHashPhone(params.userData.phone)];
  }

  if (params.userData?.clientIp) {
    userPayload.client_ip_address = params.userData.clientIp;
  }

  if (params.userData?.userAgent) {
    userPayload.client_user_agent = params.userData.userAgent;
  }

  if (params.userData?.fbp) {
    userPayload.fbp = params.userData.fbp;
  }

  if (params.userData?.fbc) {
    userPayload.fbc = params.userData.fbc;
  }

  const eventPayload: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: userPayload,
    custom_data: params.customData || {},
  };

  if (params.eventId) {
    eventPayload.event_id = params.eventId;
  }

  if (params.eventSourceUrl) {
    eventPayload.event_source_url = params.eventSourceUrl;
  }

  const requestBody: Record<string, unknown> = {
    data: [eventPayload],
  };

  const testEventCode = params.testEventCode || process.env.META_TEST_EVENT_CODE;
  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[Meta CAPI Error] Graph API returned error:", data);
    }
    return { success: res.ok, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "CAPI Network Error";
    console.error("[Meta CAPI Error] Network request failed:", message);
    return { success: false, error: message };
  }
}
