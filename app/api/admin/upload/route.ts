import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { randomBytes } from "crypto";

// Resolved at runtime so the bundler doesn't try to trace the uploads folder at build time
const PUBLIC_DIR = process.env.PUBLIC_ASSETS_DIR || "public";
const UPLOAD_SUBDIR = process.env.PRODUCT_UPLOAD_DIR || "products";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 10;

/**
 * Identify the image type from the file's first bytes. The browser-supplied
 * name and MIME type are not trusted. SVG, HTML and other script-capable
 * formats are rejected because uploads are served from this site's origin.
 */
function detectImageExtension(buf: Buffer): string | null {
  const ascii = (start: number, end: number) => buf.subarray(start, end).toString("latin1");
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return ".gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return ".webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return ".avif";
  return null;
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const formData = await req.formData();

    let candidateEntries = formData.getAll("file");
    if (candidateEntries.length === 0) candidateEntries = formData.getAll("files");
    if (candidateEntries.length === 0) candidateEntries = formData.getAll("image");
    if (candidateEntries.length === 0) candidateEntries = formData.getAll("images");
    if (candidateEntries.length === 0) {
      candidateEntries = Array.from(formData.values());
    }

    const files: File[] = candidateEntries.filter(
      (entry): entry is File =>
        typeof entry !== "string" &&
        typeof (entry as any).arrayBuffer === "function" &&
        (entry as any).size > 0
    );

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image files provided for upload" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { success: false, error: `Upload at most ${MAX_FILES_PER_REQUEST} images at a time` },
        { status: 400 }
      );
    }

    const cwd = process.cwd();
    const isStandalone = cwd.includes(".next");
    const rootDir = isStandalone ? path.resolve(cwd, "..", "..") : cwd;

    const uploadDirs = [
      path.join(/*turbopackIgnore: true*/ rootDir, PUBLIC_DIR, UPLOAD_SUBDIR),
    ];
    if (isStandalone) {
      uploadDirs.push(path.join(/*turbopackIgnore: true*/ cwd, PUBLIC_DIR, UPLOAD_SUBDIR));
    }

    for (const dir of uploadDirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File "${file.name}" exceeds the 10MB upload limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
          },
          { status: 400 }
        );
      }

      const rawBuffer = Buffer.from(await file.arrayBuffer());
      const finalExt = detectImageExtension(rawBuffer);
      if (!finalExt) {
        return NextResponse.json(
          {
            success: false,
            error: `"${file.name}" is not a supported image. Upload JPG, PNG, WEBP, AVIF or GIF.`,
          },
          { status: 400 }
        );
      }

      let buffer: Buffer = rawBuffer;
      if (finalExt !== ".gif") {
        try {
          const img = sharp(rawBuffer, { failOn: "none" })
            .rotate()
            .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true });
          const optimized =
            finalExt === ".png"
              ? await img.png({ quality: 80, compressionLevel: 9, palette: true }).toBuffer()
              : finalExt === ".webp"
              ? await img.webp({ quality: 78 }).toBuffer()
              : await img.jpeg({ quality: 78, mozjpeg: true, progressive: true }).toBuffer();
          if (optimized.length > 0 && optimized.length < rawBuffer.length) {
            buffer = optimized;
          }
        } catch {
          buffer = rawBuffer;
        }
      }
      const originalExt = path.extname(file.name || "");

      const baseName = path.basename(file.name || "product", originalExt);
      const cleanBase = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const uniqueName = `${cleanBase || "product"}-${Date.now()}-${randomBytes(4).toString("hex")}${finalExt}`;

      // Write to primary public/products folder
      const primaryDir = path.join(/*turbopackIgnore: true*/ rootDir, PUBLIC_DIR, UPLOAD_SUBDIR);
      await fs.mkdir(primaryDir, { recursive: true });
      await fs.writeFile(path.join(primaryDir, uniqueName), buffer);

      // Attempt auxiliary write to standalone directory if present, ignoring secondary permission errors
      if (isStandalone) {
        try {
          const standaloneDir = path.join(/*turbopackIgnore: true*/ cwd, PUBLIC_DIR, UPLOAD_SUBDIR);
          await fs.mkdir(standaloneDir, { recursive: true });
          await fs.writeFile(path.join(standaloneDir, uniqueName), buffer);
        } catch {
          // Primary write succeeded; ignore standalone directory permission errors
        }
      }

      uploadedUrls.push(`/products/${uniqueName}`);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
