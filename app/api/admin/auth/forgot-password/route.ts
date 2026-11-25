import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimit = checkRateLimit(`forgot-pw:${clientIp}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = forgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const email = parseResult.data.email.trim().toLowerCase();

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol =
      req.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
    const requestOrigin = host ? `${protocol}://${host}` : "";

    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      requestOrigin ||
      process.env.NEXTAUTH_URL ||
      "https://halisigifts.com"
    ).replace(/\/+$/, "");

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (user && user.role === "ADMIN") {
        await prisma.passwordResetToken.deleteMany({
          where: { email },
        });

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

        await prisma.passwordResetToken.create({
          data: {
            email,
            tokenHash,
            expiresAt,
          },
        });

        const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;
        await sendPasswordResetEmail({
          email,
          name: user.name,
          resetUrl,
        });
      }
    } catch {
      // Catch any background email/database errors to prevent leaking admin existence via 500 status
    }

    return NextResponse.json({
      success: true,
      message: "If an administrator account with that email exists, a password reset link has been sent.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process password reset request. Please try again later." },
      { status: 500 }
    );
  }
}
