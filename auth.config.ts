import type { NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";

/** Secrets that have appeared in this repo (examples/defaults). Never valid in production. */
const KNOWN_PUBLIC_SECRETS = new Set([
  "halisi-gifts-super-secret-key-change-in-production",
  "halisi-super-secret-key-change-in-production",
  "mawimbi-gifts-super-secret-key-change-in-production",
  "mawimbi-super-secret-key-change-in-production",
]);

function resolveAuthSecret(): string | undefined {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.NEXT_AUTH_SECRET;
  const isBuildStep = process.env.NEXT_PHASE === "phase-production-build";
  if (isProduction && !isBuildStep) {
    if (!secret || secret.length < 32 || KNOWN_PUBLIC_SECRETS.has(secret)) {
      throw new Error(
        "AUTH_SECRET is missing, too short (<32 chars) or a published example value. " +
          "Generate one with `npx auth secret` and set it in the server environment."
      );
    }
  }
  return secret;
}

export const authConfig: NextAuthConfig = {
  secret: resolveAuthSecret(),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // admin sessions expire after 12 hours
    updateAge: 60 * 60, // refresh the token at most hourly while active
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        maxAge: 12 * 60 * 60,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  providers: [],
};
