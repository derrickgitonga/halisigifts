import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit, clearAllRateLimits } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import crypto from "crypto";

describe("Admin Authentication & Security Utilities", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe("In-Memory Rate Limiter", () => {
    it("allows requests within the configured limit", () => {
      const key = "test-ip-1";
      const opts = { limit: 3, windowMs: 10000 };

      const res1 = checkRateLimit(key, opts);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit(key, opts);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit(key, opts);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it("blocks requests exceeding the configured limit", () => {
      const key = "test-ip-2";
      const opts = { limit: 2, windowMs: 10000 };

      checkRateLimit(key, opts);
      checkRateLimit(key, opts);

      const blocked = checkRateLimit(key, opts);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("resets rate limit for a specific key", () => {
      const key = "test-ip-3";
      const opts = { limit: 1, windowMs: 10000 };

      checkRateLimit(key, opts);
      const blocked = checkRateLimit(key, opts);
      expect(blocked.allowed).toBe(false);

      resetRateLimit(key);
      const allowedAfterReset = checkRateLimit(key, opts);
      expect(allowedAfterReset.allowed).toBe(true);
    });
  });

  describe("Token Hashing & Verification", () => {
    it("generates deterministic SHA-256 token hashes", () => {
      const rawToken = "5f4dcc3b5aa765d61d8327deb882cf99";
      const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      const actualHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
      expect(actualHash).toBe(expectedHash);
      expect(actualHash).toHaveLength(64);
    });

    it("generates different hashes for different tokens", () => {
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");

      const hash1 = crypto.createHash("sha256").update(token1).digest("hex");
      const hash2 = crypto.createHash("sha256").update(token2).digest("hex");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Password Hashing with bcryptjs", () => {
    it("hashes and validates passwords matching existing schema standards", async () => {
      const plainPassword = "AdminSecurePassword2026!";
      const hash = await bcrypt.hash(plainPassword, 10);

      expect(hash).toMatch(/^\$2[aby]?\$/);

      const isMatch = await bcrypt.compare(plainPassword, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare("WrongPassword123", hash);
      expect(isWrongMatch).toBe(false);
    });
  });
});
