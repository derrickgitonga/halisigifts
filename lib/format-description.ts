export type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "feature"; label: string; value: string }
  | { type: "bullet"; text: string }
  | { type: "paragraph"; text: string };

export interface TextSegment {
  text: string;
  bold: boolean;
}

const SECTION_HEADINGS = [
  "Key Features",
  "Product Features",
  "Features",
  "Specifications",
  "Technical Specifications",
  "What's Included",
  "What’s Included",
  "Package Includes",
  "In The Box",
  "Highlights",
  "Product Details",
  "Details",
  "Fragrance Notes",
  "Scent Notes",
  "Notes",
  "Why You'll Love It",
  "Why You’ll Love It",
  "Design & Build",
  "Care Instructions",
];

const KEYWORD_PATTERN = new RegExp(
  "\\b(" +
    [
      "Japanese quartz movement",
      "Swiss quartz movement",
      "quartz movement",
      "automatic movement",
      "electronic movement",
      "stainless steel",
      "deployment clasp",
      "butterfly clasp",
      "mesh metal strap",
      "metal link bracelet",
      "link bracelet",
      "silicone strap",
      "leather strap",
      "cushion-shaped",
      "barrel-shaped",
      "tonneau case",
      "date window",
      "calendar window",
      "chronograph",
      "moon phase",
      "dual-display",
      "dual time",
      "LED digital display",
      "digital display",
      "luminous hands",
      "glowing hands",
      "Roman numeral",
      "stick hour markers",
      "crystal accents",
      "pave crystal",
      "water-resistant",
      "water resistant",
      "scratch-resistant",
      "mineral glass",
      "sapphire glass",
      "voice calling",
      "Bluetooth calling",
      "heart rate",
      "AMOLED display",
      "HD display",
      "smart notifications",
      "Eau de Parfum",
      "Eau de Toilette",
      "Arabian perfume",
      "long-lasting",
      "gift set",
      "gift box",
      "gift hamper",
      "100% original",
      "100% authentic",
      "\\d+\\s?ml",
      "\\d+\\s?ATM",
      "\\d+\\s?BAR",
      "IP6[78]",
    ].join("|") +
    ")\\b",
  "gi"
);

function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function preprocessRawText(raw: string): string {
  let text = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\r\n?/g, "\n")
    .trim();

  // Split jammed section headings (e.g. "...milestone.What’s Included..." or "...outfit.Key Features:")
  const headingAlternation = SECTION_HEADINGS.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ).join("|");
  text = text.replace(
    new RegExp(`([.!?])\\s*(${headingAlternation})(:?)\\s*`, "gi"),
    "$1\n\n$2$3\n"
  );

  // Split heading followed directly by capitalized text without newline (e.g. "What’s IncludedChic square...")
  text = text.replace(
    new RegExp(`(^|\\n)(${headingAlternation})(:?)(?=[A-Z])`, "g"),
    "$1$2$3\n"
  );

  // Split jammed "Label: Value" features directly after sentence punctuation (e.g. "...styles.Dial Layout: Features...")
  text = text.replace(
    /([.!?])([A-Z][A-Za-z0-9 &/'()-]{1,28}:)\s+/g,
    "$1\n$2 "
  );

  // Normalize inline bullet separators like " • " into new lines when there are multiple
  if ((text.match(/\s•\s/g) || []).length >= 2) {
    text = text.replace(/\s*•\s*/g, "\n• ");
  }

  return text;
}

function isHeadingLine(line: string): boolean {
  const clean = line.replace(/:$/, "").trim();
  if (SECTION_HEADINGS.some((h) => h.toLowerCase() === clean.toLowerCase())) {
    return true;
  }
  // Short standalone heading ending with ":" (e.g., "Voice Calling Features:")
  if (
    line.endsWith(":") &&
    clean.length >= 4 &&
    clean.length <= 36 &&
    clean.split(/\s+/).length <= 5 &&
    /^[A-Z]/.test(clean)
  ) {
    return true;
  }
  return false;
}

function splitLongParagraph(text: string): string[] {
  if (text.length < 320) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  if (!sentences || sentences.length < 4) return [text];
  const mid = Math.ceil(sentences.length / 2);
  return [
    sentences.slice(0, mid).join("").trim(),
    sentences.slice(mid).join("").trim(),
  ].filter(Boolean);
}

export function parseProductDescription(raw: string): DescriptionBlock[] {
  if (!raw || !raw.trim()) return [];

  const normalized = preprocessRawText(raw);
  const rawLines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: DescriptionBlock[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const bulletStripped = line.replace(/^[•\-*✓✔▪◦]+\s*/, "").trim();
    const isBulletPrefixed = bulletStripped !== line;

    if (isHeadingLine(bulletStripped)) {
      blocks.push({
        type: "heading",
        text: bulletStripped.replace(/:$/, "").trim(),
      });
      continue;
    }

    // Match "Label: Value" feature items (e.g., "Case Shape: A distinctive cushion-shaped...")
    const featureMatch = bulletStripped.match(
      /^([A-Z][A-Za-z0-9 &/'()-]{1,32}):\s+(.+)$/
    );
    if (featureMatch) {
      const label = featureMatch[1].trim();
      const value = featureMatch[2].trim();
      if (label.split(/\s+/).length <= 5) {
        blocks.push({ type: "feature", label, value });
        continue;
      }
    }

    if (isBulletPrefixed) {
      blocks.push({ type: "bullet", text: capitalizeFirst(bulletStripped) });
      continue;
    }

    const formatted = i === 0 ? capitalizeFirst(line) : line;
    for (const para of splitLongParagraph(formatted)) {
      blocks.push({ type: "paragraph", text: para });
    }
  }

  return blocks;
}

export function highlightKeywords(text: string): TextSegment[] {
  if (!text) return [];
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  KEYWORD_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = KEYWORD_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[0], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  return segments.length > 0 ? segments : [{ text, bold: false }];
}
