import net from "node:net";
import { Prisma, PrismaClient } from "@prisma/client";

/* ------------------------------------------------------------------ *
 * Database reachability guard
 *
 * When Postgres is down, every Prisma call waits several seconds before
 * failing, and a single page makes several calls. We probe the database
 * port once (≈ms when up, ≤400ms when down), remember the answer for a
 * short while, and fail fast while it is unreachable so pages can drop
 * straight to their offline fallbacks.
 * ------------------------------------------------------------------ */

const OK_TTL_MS = 60_000; // re-check a healthy DB once a minute
const DOWN_TTL_MS = 10_000; // retry an unreachable DB every 10s
const PROBE_TIMEOUT_MS = 400;

type DbState = { reachable: boolean; checkedAt: number };

const globalForPrisma = globalThis as unknown as {
  prismaGuarded: PrismaClient | undefined;
  dbState: DbState | undefined;
  dbProbe: Promise<boolean> | undefined;
};

export class DatabaseOfflineError extends Error {
  constructor() {
    super("DATABASE_OFFLINE");
    this.name = "DatabaseOfflineError";
  }
}

/**
 * True when an error means "the database can't be reached". Checks by name, not
 * instanceof, because route bundles can each hold their own copy of this module.
 */
export function isDatabaseOfflineError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "DatabaseOfflineError" ||
    error.message === "DATABASE_OFFLINE" ||
    error.name === "PrismaClientInitializationError"
  );
}

function databaseAddress(): { host: string; port: number } | null {
  try {
    const url = new URL(process.env.DATABASE_URL || "");
    if (!url.protocol.startsWith("postgres")) return null;
    return { host: url.hostname, port: Number(url.port) || 5432 };
  } catch {
    return null;
  }
}

function probe(): Promise<boolean> {
  const address = databaseAddress();
  // Unknown/unsupported URL: don't guess, let Prisma try.
  if (!address) return Promise.resolve(true);

  return new Promise((resolve) => {
    const socket = net.createConnection(address);
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(PROBE_TIMEOUT_MS, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

function markDatabase(reachable: boolean) {
  globalForPrisma.dbState = { reachable, checkedAt: Date.now() };
}

export async function isDatabaseReachable(): Promise<boolean> {
  const state = globalForPrisma.dbState;
  if (state) {
    const ttl = state.reachable ? OK_TTL_MS : DOWN_TTL_MS;
    if (Date.now() - state.checkedAt < ttl) return state.reachable;
  }
  // Share one in-flight probe between concurrent queries
  globalForPrisma.dbProbe ??= probe().then((ok) => {
    markDatabase(ok);
    globalForPrisma.dbProbe = undefined;
    return ok;
  });
  return globalForPrisma.dbProbe;
}

function createClient(): PrismaClient {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  const guarded = base.$extends({
    query: {
      async $allOperations({ args, query }) {
        if (!(await isDatabaseReachable())) throw new DatabaseOfflineError();
        try {
          return await query(args);
        } catch (error) {
          // Connection lost mid-flight: stop sending queries until the next probe
          if (error instanceof Prisma.PrismaClientInitializationError) markDatabase(false);
          throw error;
        }
      },
    },
  });

  // Same API surface as PrismaClient; keeps existing type annotations working.
  return guarded as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prismaGuarded ?? createClient();

globalForPrisma.prismaGuarded = prisma;
