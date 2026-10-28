#!/usr/bin/env node
/**
 * Reports raw and gzipped bytes for every emitted asset, and the critical path
 * (index.html + its inlined CSS + the entry chunk + entry CSS) against the
 * ~25 KB gzipped budget in the build brief. Dev-only; nothing here ships.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(full);
  }
}

walk(dist);

const gz = (file) => gzipSync(readFileSync(file)).length;
const kb = (bytes) => (bytes / 1024).toFixed(1).padStart(6);

console.log('asset'.padEnd(52), 'raw', 'gzip');
let critical = 0;

for (const file of files.sort()) {
  const rel = file.slice(dist.length + 1).replace(/\\/g, '/');
  const raw = statSync(file).size;
  const zip = gz(file);
  console.log(rel.padEnd(52), kb(raw), kb(zip));

  const isEntryJs = /assets\/index[^/]*\.js$/.test(rel);
  const isEntryCss = /assets\/index[^/]*\.css$/.test(rel);
  const isLazyChunk = /assets\/(?!index)[^/]*\.js$/.test(rel);
  if (rel === 'index.html' || isEntryJs || isEntryCss) critical += zip;
  if (isLazyChunk) console.log('   ^ lazy chunk, not on the critical path');
}

console.log('\ncritical path (HTML + entry CSS + entry JS), gzipped:', (critical / 1024).toFixed(1) + ' KB');
console.log('budget: 25 KB  ->', critical / 1024 <= 25 ? 'WITHIN BUDGET' : 'OVER BUDGET');
