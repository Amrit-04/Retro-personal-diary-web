/**
 * Turns dropped-in source art into the files the app actually requests.
 *
 *   node scripts/optimize-assets.mjs
 *
 * Sources live in public/xp-inbox/ (gitignored — it holds copyrighted files that
 * must not be committed). Everything this writes lands in public/, and public/xp/
 * for the shell art. The script is idempotent: run it again after adding files.
 *
 * Budgets come from the build brief: desktop wallpaper 80 KB, phone wallpaper 40 KB,
 * startup sound 40 KB, entry thumbnails 8 KB. Anything over budget is reported, not
 * silently accepted.
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const INBOX = join(ROOT, 'public', 'xp-inbox');
const SRC = join(ROOT, 'assets-src');
const PUBLIC = join(ROOT, 'public');
const XP = join(PUBLIC, 'xp');
const KB = 1024;

/** name -> { src, out, width, height, crop, maxBytes } */
const JOBS = [
  {
    src: 'wallpaper',
    out: join(PUBLIC, 'wallpaper.webp'),
    // 1440 wide rather than 1600: the extra pixels cost more than they give back
    // inside an 80 kB budget, and the desktop tiles the image anyway.
    width: 1440,
    height: 810,
    maxBytes: 80 * KB,
  },
  {
    src: 'wallpaper',
    out: join(PUBLIC, 'wallpaper-mobile.webp'),
    width: 720,
    height: 1280,
    // Hold the crop window a little above centre so the hill keeps its shape.
    crop: { x: 0.5, y: 0.3 },
    maxBytes: 40 * KB,
  },
];

/** Look in assets-src first (our own art, committed), then the gitignored inbox. */
function findSource(name) {
  for (const dir of [SRC, INBOX]) {
    if (!existsSync(dir)) continue;
    for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
      const candidate = join(dir, `${name}.${ext}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** Encode, then walk quality down until the file fits its budget. */
async function encodeToBudget(input, job) {
  const meta = await sharp(input, { failOn: 'none' }).metadata();
  let pipeline = sharp(input, { failOn: 'none' });

  if (job.crop) {
    // A phone is taller than wide, so take a window at the output ratio and slide
    // it to the anchor point: x/y are fractions of the available slack, not pixels.
    const ratio = job.width / job.height;
    let width = meta.width;
    let height = Math.round(width * ratio);
    if (height > meta.height) {
      height = meta.height;
      width = Math.round(height / ratio);
    }
    const clamp = (v, max) => Math.max(0, Math.min(1, v)) * max;
    pipeline = pipeline.extract({
      left: Math.round(clamp(job.crop.x, meta.width - width)),
      top: Math.round(clamp(job.crop.y, meta.height - height)),
      width,
      height,
    });
  }
  pipeline = pipeline.resize(job.width, job.height, { fit: 'cover' });

  for (let quality = 80; quality >= 24; quality -= 2) {
    const buf = await pipeline.clone().webp({ quality, effort: 6 }).toBuffer();
    if (buf.length <= job.maxBytes || quality === 24) {
      writeFileSync(job.out, buf);
      return { buf, quality };
    }
  }
  throw new Error('unreachable');
}

async function run() {
  const report = [];

  for (const job of JOBS) {
    const source = findSource(job.src);
    if (!source) {
      report.push({ file: job.out, note: `no ${job.src}.* in assets-src or public/xp-inbox — skipped` });
      continue;
    }
    const { buf, quality } = await encodeToBudget(source, job);
    report.push({
      file: job.out,
      bytes: buf.length,
      max: job.maxBytes,
      note: `from ${job.src} at q${quality}`,
    });
  }

  mkdirSync(XP, { recursive: true });
  const iconDir = join(INBOX, 'icons');
  if (existsSync(iconDir)) {
    // One sheet per icon size keeps the shell down to two image requests (§12).
    for (const size of [24, 32, 48]) {
      const names = readdirSync(iconDir).filter((n) => /\.(png|jpg|jpeg|webp)$/i.test(n));
      if (!names.length) continue;
      const composites = [];
      for (const [i, name] of names.entries()) {
        const data = await sharp(join(iconDir, name)).resize(size, size, { fit: 'contain' }).png().toBuffer();
        composites.push({ input: data, left: (i % 8) * size, top: Math.floor(i / 8) * size });
      }
      const cols = Math.min(names.length, 8);
      const rows = Math.ceil(names.length / 8);
      const out = join(XP, `icons-${size}.png`);
      await sharp({
        create: { width: cols * size, height: rows * size, channels: 4, background: '#0000' },
      })
        .composite(composites)
        .png({ palette: true, quality: 90, effort: 8 })
        .toFile(out);
      report.push({ file: out, note: `${names.length} icons, index order = filename order` });
    }
  } else {
    report.push({ file: join(XP, 'icons-*.png'), note: 'no public/xp-inbox/icons — skipped' });
  }

  for (const name of ['startup.mp3']) {
    const file = join(PUBLIC, name);
    report.push({
      file,
      bytes: existsSync(file) ? statSync(file).size : null,
      max: 40 * KB,
      note: existsSync(file) ? 'copied in by hand, checked against budget' : 'missing',
    });
  }

  let over = 0;
  for (const row of report) {
    const size = row.bytes == null ? '—' : `${(row.bytes / KB).toFixed(1)} kB`;
    const max = row.max ? `${(row.max / KB).toFixed(0)} kB` : '';
    const flag = row.bytes && row.max && row.bytes > row.max ? '  OVER BUDGET' : '';
    if (flag) over++;
    const rel = row.file.replace(ROOT + '/', '');
    console.log(`${size.padStart(9)}  ${max.padEnd(7)} ${rel}${flag || `   (${row.note})`}`);
  }
  console.log(over ? `\n${over} file(s) over budget.` : '\nAll present files are within budget.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
