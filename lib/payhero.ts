const PAYHERO_BASE_URL = (
  process.env.PAYHERO_BASE_URL || "https://backend.payhero.co.ke/api/v2"
).replace(/\/+$/, "");

export function getPayHeroAuthHeader(): string | null {
  const directToken = process.env.PAYHERO_AUTH_TOKEN?.trim();
  if (directToken) {
    return directToken.startsWith("Basic ") ? directToken : `Basic ${directToken}`;
  }

  const username = process.env.PAYHERO_API_USERNAME?.trim();
  const password = process.env.PAYHERO_API_PASSWORD?.trim();
  if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
    return `Basic ${encoded}`;
  }

  return null;
}

export function getPayHeroChannelId(): number | null {
  const raw = process.env.PAYHERO_CHANNEL_ID?.trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function isPayHeroConfigured(): boolean {
  return Boolean(getPayHeroAuthHeader() && getPayHeroChannelId());
}

export function normalizePayHeroPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if ((digits.startsWith("07") || digits.startsWith("01")) && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `254${digits}`;
  }
  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }
  return null;
}

export interface PayHeroStkPushParams {
  amount: number;
  phoneNumber: string;
  externalReference: string;
  customerName?: string;
  callbackUrl: string;
}

export interface PayHeroStkPushResult {
  success: boolean;
  reference?: string;
  checkoutRequestId?: string;
  status?: string;
  error?: string;
}

export async function initiatePayHeroStkPush(
  params: PayHeroStkPushParams
): Promise<PayHeroStkPushResult> {
  const authHeader = getPayHeroAuthHeader();
  const channelId = getPayHeroChannelId();

  if (!authHeader || !channelId) {
    return { success: false, error: "PayHero credentials are not configured" };
  }

  const normalizedPhone = normalizePayHeroPhone(params.phoneNumber);
  if (!normalizedPhone) {
    return { success: false, error: "Invalid Kenyan M-Pesa phone number" };
  }

  const intAmount = Math.max(1, Math.round(params.amount));

  try {
    const res = await fetch(`${PAYHERO_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: intAmount,
        phone_number: normalizedPhone,
        channel_id: channelId,
        provider: "m-pesa",
        external_reference: params.externalReference,
        customer_name: params.customerName?.trim() || "Halisi Gifts Customer",
        callback_url: params.callbackUrl,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      return {
        success: false,
        error: data.message || data.error || data.error_message || `PayHero error (${res.status})`,
      };
    }

    return {
      success: true,
      reference: data.reference || data.CheckoutRequestID || params.externalReference,
      checkoutRequestId: data.CheckoutRequestID || data.checkout_request_id || undefined,
      status: data.status || "QUEUED",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to reach PayHero API";
    return { success: false, error: msg };
  }
}

export interface PayHeroTransactionStatusResult {
  success: boolean;
  status?: string;
  mpesaReceiptNumber?: string;
  providerReference?: string;
  error?: string;
}

export async function fetchPayHeroTransactionStatus(
  reference: string
): Promise<PayHeroTransactionStatusResult> {
  const authHeader = getPayHeroAuthHeader();
  if (!authHeader) {
    return { success: false, error: "PayHero not configured" };
  }

  try {
    const url = `${PAYHERO_BASE_URL}/transaction-status?reference=${encodeURIComponent(reference)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: authHeader },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || `Status check failed (${res.status})` };
    }

    return {
      success: true,
      status: String(data.status || data.Status || "").toUpperCase(),
      mpesaReceiptNumber:
        data.provider_reference || data.MpesaReceiptNumber || data.mpesa_receipt_number || undefined,
      providerReference: data.provider_reference || undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PayHero status check failed";
    return { success: false, error: msg };
  }
}

export interface ParsedPayHeroCallback {
  isSuccess: boolean;
  resultCode: number | null;
  status: string;
  externalReference: string | null;
  checkoutRequestId: string | null;
  mpesaReceiptNumber: string | null;
  amount: number | null;
  phone: string | null;
  resultDesc: string | null;
}

export function parsePayHeroCallback(payload: unknown): ParsedPayHeroCallback {
  const root = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const inner = (
    root.response && typeof root.response === "object" ? root.response : root
  ) as Record<string, unknown>;

  const rawResultCode = inner.ResultCode ?? inner.result_code;
  const resultCode =
    typeof rawResultCode === "number"
      ? rawResultCode
      : typeof rawResultCode === "string" && rawResultCode.trim() !== ""
      ? Number(rawResultCode)
      : null;

  const statusStr = String(inner.Status || inner.status || "").trim();
  const isSuccess =
    resultCode === 0 ||
    statusStr.toLowerCase() === "success" ||
    statusStr.toLowerCase() === "completed";

  const rawAmount = inner.Amount ?? inner.amount;
  const amount =
    typeof rawAmount === "number"
      ? rawAmount
      : typeof rawAmount === "string" && rawAmount.trim() !== ""
      ? Number(rawAmount)
      : null;

  return {
    isSuccess,
    resultCode: Number.isFinite(resultCode) ? resultCode : null,
    status: statusStr || (isSuccess ? "Success" : "Failed"),
    externalReference:
      typeof inner.ExternalReference === "string"
        ? inner.ExternalReference.trim()
        : typeof inner.external_reference === "string"
        ? inner.external_reference.trim()
        : null,
    checkoutRequestId:
      typeof inner.CheckoutRequestID === "string"
        ? inner.CheckoutRequestID.trim()
        : typeof inner.checkout_request_id === "string"
        ? inner.checkout_request_id.trim()
        : null,
    mpesaReceiptNumber:
      typeof inner.MpesaReceiptNumber === "string" && inner.MpesaReceiptNumber.trim()
        ? inner.MpesaReceiptNumber.trim()
        : typeof inner.mpesa_receipt_number === "string" && inner.mpesa_receipt_number.trim()
        ? inner.mpesa_receipt_number.trim()
        : null,
    amount: amount !== null && Number.isFinite(amount) ? amount : null,
    phone:
      typeof inner.Phone === "string"
        ? inner.Phone.trim()
        : typeof inner.phone === "string"
        ? inner.phone.trim()
        : null,
    resultDesc:
      typeof inner.ResultDesc === "string"
        ? inner.ResultDesc.trim()
        : typeof inner.result_desc === "string"
        ? inner.result_desc.trim()
        : null,
  };
}
