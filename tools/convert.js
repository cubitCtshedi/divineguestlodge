// Generate .avif and .webp siblings for every .jpg / .jpeg under the listed
// folders. Skips a target if it already exists (so it's safe to re-run).
//
// Usage:  npm run convert
// Output: e.g. /images/gallery/foo.jpg → foo.avif + foo.webp next to it.

const path = require('path');
const fs   = require('fs/promises');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..', 'images');
const TARGET_FOLDERS = ['gallery', 'experience', 'about', 'deluxeRoom', 'familyRoom'];
const SOURCE_EXT = /\.(jpe?g)$/i;

// Quality settings tuned for hotel photography — visually transparent at these
// settings on the existing site's deluxeRoom/familyRoom variants.
const AVIF_OPTS = { quality: 55, effort: 6 };
const WEBP_OPTS = { quality: 78, effort: 5 };
// Cap at sensible delivery resolution so 4000px source files don't ship as-is.
const MAX_WIDTH = 1800;

async function* walk(dir){
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function exists(p){
  try { await fs.access(p); return true; } catch { return false; }
}

async function fileSize(p){
  const s = await fs.stat(p);
  return s.size;
}

function fmtKB(bytes){ return (bytes / 1024).toFixed(0) + 'K'; }

async function convertOne(src){
  const dir = path.dirname(src);
  const base = path.basename(src).replace(SOURCE_EXT, '');
  const avifOut = path.join(dir, base + '.avif');
  const webpOut = path.join(dir, base + '.webp');

  const srcSize = await fileSize(src);
  const tasks = [];

  if (!(await exists(avifOut))) {
    tasks.push(
      sharp(src)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .avif(AVIF_OPTS)
        .toFile(avifOut)
        .then(async () => `  avif: ${fmtKB(await fileSize(avifOut))}`)
    );
  } else {
    tasks.push(Promise.resolve('  avif: skipped (exists)'));
  }

  if (!(await exists(webpOut))) {
    tasks.push(
      sharp(src)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp(WEBP_OPTS)
        .toFile(webpOut)
        .then(async () => `  webp: ${fmtKB(await fileSize(webpOut))}`)
    );
  } else {
    tasks.push(Promise.resolve('  webp: skipped (exists)'));
  }

  const lines = await Promise.all(tasks);
  console.log(`${path.relative(ROOT, src)}  (${fmtKB(srcSize)})`);
  for (const l of lines) console.log(l);
}

(async () => {
  for (const folder of TARGET_FOLDERS) {
    const root = path.join(ROOT, folder);
    if (!(await exists(root))) {
      console.log(`(skipping missing folder: ${folder})`);
      continue;
    }
    for await (const f of walk(root)) {
      if (SOURCE_EXT.test(f)) {
        try { await convertOne(f); }
        catch (err) { console.error(`! failed: ${f}\n  ${err.message}`); }
      }
    }
  }
})();
