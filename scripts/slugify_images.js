const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'public', 'PRODUCTS');
const destDir = path.join(process.cwd(), 'public', 'products');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => !fs.statSync(path.join(srcDir, f)).isDirectory());

function slugifyImageName(filename) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);

  let slug = base
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[_]/g, '-')
    .replace(/[#*]/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[\(\)]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug}${ext}`;
}

const mapping = [];
const slugCounts = new Map();

files.forEach(file => {
  let slugName = slugifyImageName(file);

  // Ensure unique target filename if any conflict
  if (slugCounts.has(slugName)) {
    const count = slugCounts.get(slugName) + 1;
    slugCounts.set(slugName, count);
    const ext = path.extname(slugName);
    const base = path.basename(slugName, ext);
    slugName = `${base}-${count}${ext}`;
  } else {
    slugCounts.set(slugName, 1);
  }

  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, slugName);

  fs.copyFileSync(srcPath, destPath);

  mapping.push({
    originalFile: file,
    slugifiedFile: slugName,
    url: `/products/${slugName}`,
    sizeBytes: fs.statSync(destPath).size
  });
});

console.log(`Successfully slugified and copied ${mapping.length} images to /public/products/`);
fs.writeFileSync('temp_docx/image_slug_audit_map.json', JSON.stringify(mapping, null, 2));

// Quick sample print
console.log('Sample mappings:');
mapping.slice(0, 10).forEach(m => console.log(`${m.originalFile} -> ${m.url}`));
