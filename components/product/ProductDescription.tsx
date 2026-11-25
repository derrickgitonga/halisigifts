import {
  parseProductDescription,
  highlightKeywords,
  type DescriptionBlock,
} from "@/lib/format-description";

function RichText({ text }: { text: string }) {
  const segments = highlightKeywords(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-semibold text-black">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

type GroupedSection =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: Array<Extract<DescriptionBlock, { type: "feature" | "bullet" }>> };

function groupBlocks(blocks: DescriptionBlock[]): GroupedSection[] {
  const sections: GroupedSection[] = [];

  for (const block of blocks) {
    if (block.type === "heading") {
      sections.push({ kind: "heading", text: block.text });
    } else if (block.type === "paragraph") {
      sections.push({ kind: "paragraph", text: block.text });
    } else {
      const prev = sections[sections.length - 1];
      if (prev && prev.kind === "list") {
        prev.items.push(block);
      } else {
        sections.push({ kind: "list", items: [block] });
      }
    }
  }

  return sections;
}

export default function ProductDescription({ description }: { description: string }) {
  const blocks = parseProductDescription(description);
  if (blocks.length === 0) return null;

  const sections = groupBlocks(blocks);

  return (
    <div className="space-y-3.5 text-sm md:text-[15px] text-black/75 leading-relaxed">
      {sections.map((section, idx) => {
        if (section.kind === "heading") {
          return (
            <h3
              key={idx}
              className="text-xs uppercase tracking-[0.14em] font-bold text-black pt-2 first:pt-0"
            >
              {section.text}
            </h3>
          );
        }

        if (section.kind === "paragraph") {
          return (
            <p key={idx}>
              <RichText text={section.text} />
            </p>
          );
        }

        return (
          <ul key={idx} className="space-y-2.5 pl-0.5">
            {section.items.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-start gap-2.5">
                <span
                  className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {item.type === "feature" ? (
                    <>
                      <strong className="font-semibold text-black">{item.label}:</strong>{" "}
                      <RichText text={item.value} />
                    </>
                  ) : (
                    <RichText text={item.text} />
                  )}
                </span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
