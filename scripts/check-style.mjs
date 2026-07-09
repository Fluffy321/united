#!/usr/bin/env node
/**
 * Style-guide ratchet check (STYLE_GUIDE.md enforcement).
 *
 * `bg-slate-950` is reserved for dark segment controls — primary CTAs must use
 * `bg-blue-600`. Because grep can't tell a segment control from a CTA, this is
 * a ratchet: the count may go DOWN but never UP. When you legitimately reduce
 * usage, lower BASELINE here in the same commit.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASELINE = 120; // occurrences of bg-slate-950 in src/**/*.jsx as of 2026-07-09

const PATTERN = /bg-slate-950/g;
const exts = new Set(['.jsx', '.js']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if ([...exts].some((ext) => name.endsWith(ext))) yield path;
  }
}

let total = 0;
const perFile = [];
for (const file of walk('src')) {
  const count = (readFileSync(file, 'utf8').match(PATTERN) || []).length;
  if (count > 0) {
    total += count;
    perFile.push([file, count]);
  }
}

if (total > BASELINE) {
  console.error(`✗ style check failed: ${total} bg-slate-950 occurrences (baseline ${BASELINE}).`);
  console.error('  Primary CTAs must use bg-blue-600 (STYLE_GUIDE.md). Top offenders:');
  for (const [file, count] of perFile.sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.error(`    ${count}\t${file}`);
  }
  process.exit(1);
}

console.log(`✓ style check passed: ${total} bg-slate-950 occurrences (baseline ${BASELINE}).`);
if (total < BASELINE) {
  console.log(`  Count dropped — lower BASELINE to ${total} in scripts/check-style.mjs to lock in the progress.`);
}
