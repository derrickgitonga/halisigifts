import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(`crm-unsub:${getClientIp(req)}`, { limit: 20, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return new NextResponse(renderHtml("Too Many Requests", "Please wait a moment before trying again."), {
      status: 429,
      headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": String(rl.retryAfterSeconds) },
    });
  }
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(renderHtml("Invalid Request", "The unsubscribe link is invalid or missing."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const contact = await prisma.crmContact.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!contact) {
    return new NextResponse(
      renderHtml("Link Not Found", "We could not find an active subscription associated with this link."),
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  await prisma.crmContact.update({
    where: { id: contact.id },
    data: { isSubscribedEmail: false },
  });

  return new NextResponse(
    renderHtml(
      "Unsubscribed Successfully",
      `You have been removed from our marketing list. ${contact.email} will no longer receive promotional emails from Halisi Gifts Shop.`
    ),
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderHtml(title: string, message: string): string {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} | Halisi Gifts Shop</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8f9fa;
      color: #111827;
      margin: 0;
      padding: 40px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
    }
    .card {
      background: #ffffff;
      max-width: 480px;
      width: 100%;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .brand {
      font-family: Georgia, serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #111827;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #111827;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #4b5563;
      margin: 0 0 24px 0;
    }
    a.btn {
      display: inline-block;
      background-color: #000000;
      color: #ffffff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Halisi Gifts Shop</div>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    <a href="https://halisigifts.com" class="btn">Return to Store</a>
  </div>
</body>
</html>`;
}
