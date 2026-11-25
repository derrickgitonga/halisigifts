import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Auth is covered separately; treat the caller as a signed-in admin by default
const requireAdminMock = vi.fn(async () => null as Response | null);
vi.mock("@/lib/admin-auth", () => ({ requireAdmin: () => requireAdminMock() }));

import { POST } from "@/app/api/admin/upload/route";
import { GET } from "@/app/products/[...file]/route";
import fs from "fs";
import path from "path";

describe("Admin Image Upload & Dynamic Serving Suite", () => {
  it("rejects non-image file uploads", async () => {
    const formData = new FormData();
    const mockFile = new File(["dummy text content"], "document.pdf", {
      type: "application/pdf",
    });
    formData.append("file", mockFile);

    const req = new NextRequest("http://localhost:3000/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("not a supported image");
  });

  it("rejects SVG uploads even when labelled as an image", async () => {
    const formData = new FormData();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    formData.append("file", new File([svg], "logo.svg", { type: "image/svg+xml" }));
    const req = new NextRequest("http://localhost:3000/api/admin/upload", { method: "POST", body: formData });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects a non-image renamed to .jpg", async () => {
    const formData = new FormData();
    formData.append("file", new File(["<html><script>x</script></html>"], "photo.jpg", { type: "image/jpeg" }));
    const req = new NextRequest("http://localhost:3000/api/admin/upload", { method: "POST", body: formData });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("refuses uploads from non-admins", async () => {
    const { NextResponse } = await import("next/server");
    requireAdminMock.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 })
    );
    const formData = new FormData();
    formData.append("file", new File([new Uint8Array(16)], "a.png"));
    const req = new NextRequest("http://localhost:3000/api/admin/upload", { method: "POST", body: formData });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("accepts real JPEG (.jfif) and WEBP files, naming them by their actual type", async () => {
    const formData = new FormData();
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0]);
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
    ]);
    const mockJfif = new File([jpegBytes], "gold-watch.jfif", { type: "image/jpeg" });
    const mockWebp = new File([webpBytes], "smartwatch-black.webp", { type: "image/webp" });

    formData.append("file", mockJfif);
    formData.append("file", mockWebp);

    const req = new NextRequest("http://localhost:3000/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.urls)).toBe(true);
    expect(data.urls.length).toBe(2);
    expect(data.urls[0]).toMatch(/^\/products\/gold-watch-.*\.jpg$/);
    expect(data.urls[1]).toMatch(/^\/products\/smartwatch-black-.*\.webp$/);

    // Clean up test uploaded files
    for (const url of data.urls) {
      const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  it("serves images via the dynamic products route handler", async () => {
    // Create a temporary test image in public/products
    const testDir = path.join(process.cwd(), "public", "products");
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    const testFileName = `test-color-variant-${Date.now()}.png`;
    const testFilePath = path.join(testDir, testFileName);
    fs.writeFileSync(testFilePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const req = new NextRequest(`http://localhost:3000/products/${testFileName}`);
    const res = await GET(req, { params: Promise.resolve({ file: [testFileName] }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("public");

    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it("returns 404 for nonexistent images in dynamic products route", async () => {
    const req = new NextRequest("http://localhost:3000/products/nonexistent-variant-photo.jpg");
    const res = await GET(req, { params: Promise.resolve({ file: ["nonexistent-variant-photo.jpg"] }) });

    expect(res.status).toBe(404);
  });
});
