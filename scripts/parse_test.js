const fs = require('fs');
const path = require('path');

const lines = JSON.parse(fs.readFileSync('temp_docx/extracted_productss_paragraphs.json', 'utf8'));

const productBlocks = [];
let current = null;

function isProductHeader(line) {
  if (/(?:kes|ksh)\s*[\d,]+/i.test(line)) {
    if (/brand labels/i.test(line) && /sticker/i.test(line)) return false;
    return true;
  }
  return false;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  if (isProductHeader(line)) {
    if (current) productBlocks.push(current);
    current = { header: line, lines: [], index: i };
  } else {
    if (current) {
      current.lines.push(line);
    } else {
      console.log('Unattached line before first product:', line);
    }
  }
}
if (current) productBlocks.push(current);

console.log('Total product blocks found:', productBlocks.length);
productBlocks.forEach((p, idx) => {
  console.log(`[${idx + 1}] ${p.header} (${p.lines.length} lines)`);
});
