import { describe, it, expect } from "vitest";
import { parseProductDescription, highlightKeywords } from "@/lib/format-description";

describe("Product Description Formatter", () => {
  it("splits jammed Key Features labels and capitalizes intro paragraph", () => {
    const raw = `a minimalist analog timepiece designed with a retro-contemporary aesthetic.

Key Features
Case Shape: A distinctive cushion-shaped (rounded square) case that bridges vintage and modern styles.Dial Layout: Features a clean, uncluttered display with sleek, metallic stick hour markers and three slender hands (hours, minutes, and seconds).Complication: A small, circular date window is conveniently located at the 3 o'clock position.Movement: Powered by a reliable, battery-operated Japanese quartz movement for precise timekeeping.Band: Equipped with a classic metal link bracelet secured by a deployment clasp.`;

    const blocks = parseProductDescription(raw);

    expect(blocks[0]).toEqual({
      type: "paragraph",
      text: "A minimalist analog timepiece designed with a retro-contemporary aesthetic.",
    });
    expect(blocks[1]).toEqual({ type: "heading", text: "Key Features" });

    const features = blocks.filter((b) => b.type === "feature");
    expect(features.map((f) => f.label)).toEqual([
      "Case Shape",
      "Dial Layout",
      "Complication",
      "Movement",
      "Band",
    ]);
  });

  it("strips zero-width spaces and parses bullet headings cleanly", () => {
    const raw = `Make a statement.\n\u200BKey Features:\n\u200BBrand: Poedagar\n• Water resistant up to 3 ATM`;
    const blocks = parseProductDescription(raw);

    expect(blocks[1]).toEqual({ type: "heading", text: "Key Features" });
    expect(blocks[2]).toEqual({ type: "feature", label: "Brand", value: "Poedagar" });
    expect(blocks[3]).toEqual({ type: "bullet", text: "Water resistant up to 3 ATM" });
  });

  it("highlights key product terms in bold", () => {
    const segments = highlightKeywords(
      "Powered by a Japanese quartz movement with a metal link bracelet and deployment clasp."
    );
    const boldTexts = segments.filter((s) => s.bold).map((s) => s.text);

    expect(boldTexts).toContain("Japanese quartz movement");
    expect(boldTexts).toContain("metal link bracelet");
    expect(boldTexts).toContain("deployment clasp");
  });
});
