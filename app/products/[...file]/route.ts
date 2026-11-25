import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const PUBLIC_DIR = process.env.PUBLIC_ASSETS_DIR || "public";
const IMAGE_SUBDIRS = (process.env.PRODUCT_IMAGE_DIRS || "products,PRODUCTS,product,PRODUCTSs").split(",");

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".pjpeg": "image/jpeg",
  ".pjp": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string[] }> }
) {
  try {
    const { file } = await params;
    if (!file || file.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const sanitizedSegments = file
      .map((segment) => path.basename(segment.trim()))
      .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..");

    if (sanitizedSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const relativePath = sanitizedSegments.join(path.sep);
    const cwd = process.cwd();
    const isStandalone = cwd.includes(".next");
    const rootDir = isStandalone ? path.resolve(cwd, "..", "..") : cwd;

    // Built from runtime values so the bundler does not try to trace (and bundle)
    // every image in these folders at build time.
    const searchDirs = [cwd, rootDir].flatMap((base) =>
      [...IMAGE_SUBDIRS, ""].map((sub) => path.join(/*turbopackIgnore: true*/ base, PUBLIC_DIR, sub))
    );

    let targetBuffer: Buffer | null = null;
    let targetExt = "";

    for (const dir of searchDirs) {
      const resolvedDir = path.resolve(dir);
      const fullPath = path.resolve(dir, relativePath);

      if (!fullPath.startsWith(resolvedDir)) {
        continue;
      }

      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          targetBuffer = await fs.readFile(fullPath);
          targetExt = path.extname(fullPath).toLowerCase();
          break;
        }
      } catch {
        // Continue searching next directory
      }
    }

    if (!targetBuffer) {
      const isImageExtension = Object.keys(MIME_MAP).some((ext) =>
        relativePath.toLowerCase().endsWith(ext)
      );
      if (!isImageExtension) {
        const redirectUrl = new URL(`/product/${sanitizedSegments.join("/")}`, req.url);
        return NextResponse.redirect(redirectUrl, 307);
      }
      return new NextResponse("Image Not Found", { status: 404 });
    }

    const contentType = MIME_MAP[targetExt] || "image/jpeg";

    return new NextResponse(new Uint8Array(targetBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // Images never need to run scripts; this neutralises script inside SVGs
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
