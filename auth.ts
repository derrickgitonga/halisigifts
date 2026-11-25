import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { checkRateLimit } from "@/lib/rate-limit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_LIMIT_PER_ACCOUNT = 5;
const LOGIN_LIMIT_PER_IP = 20;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        // Brute-force protection: per account and per client IP
        const clientIp =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          "unknown";
        const window = { windowMs: LOGIN_WINDOW_MS };
        const byAccount = checkRateLimit(`login:acct:${email}`, { ...window, limit: LOGIN_LIMIT_PER_ACCOUNT });
        const byIp = checkRateLimit(`login:ip:${clientIp}`, { ...window, limit: LOGIN_LIMIT_PER_IP });
        if (!byAccount.allowed || !byIp.allowed) {
          console.warn(`[auth] login rate limit hit for ${email} from ${clientIp}`);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (user.role !== "ADMIN") {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
