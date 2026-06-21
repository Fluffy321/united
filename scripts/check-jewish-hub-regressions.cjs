#!/usr/bin/env node
/**
 * check-jewish-hub-regressions.cjs
 *
 * Guards against two specific Jewish Hub bugs that have already shipped to
 * production once each:
 *
 *   1. Passing `ref={...}` to <SefariaAttribution>. `ref` is a reserved React
 *      prop on function components and throws React error #290 at render,
 *      crashing every reader (Tanakh/Parsha/Tehillim/Siddur). The prop must
 *      be named `sefariaRef`.
 *
 *   2. Rendering <DailyJewishHome /> on a Jewish Hub sub-page. It must render
 *      ONLY on the main Jewish Hub home (src/pages/JewishHub.jsx via
 *      JewishContentHub.jsx) — never on Tehillim/Parsha/Tanakh/Siddur/
 *      Shiurim/DailyLearning/DivreiTorah/Settings.
 *
 * Exits with code 1 if either regresses, so it can run in CI / pre-build.
 *
 * Usage:   node scripts/check-jewish-hub-regressions.cjs
 * npm:     npm run check-jewish-hub
 */

const fs = require('fs');
const path = require('path');

const jewishDir = path.join(__dirname, '../src/components/jewish');
const errors = [];

// Pages allowed to render DailyJewishHome — only the main Jewish Hub home.
const ALLOWED_DAILY_JEWISH_HOME_FILES = new Set(['JewishContentHub.jsx', 'DailyJewishHome.jsx']);

const files = fs.readdirSync(jewishDir).filter((f) => f.endsWith('.jsx'));

for (const file of files) {
  const fullPath = path.join(jewishDir, file);
  const src = fs.readFileSync(fullPath, 'utf8');

  // Check 1: ref={...} passed directly to SefariaAttribution.
  const sefariaBlockRegex = /<SefariaAttribution\b[^>]*?\/?>/gs;
  let m;
  while ((m = sefariaBlockRegex.exec(src)) !== null) {
    const block = m[0];
    if (/\bref\s*=\s*\{/.test(block)) {
      const line = src.slice(0, m.index).split('\n').length;
      errors.push(
        `${file}:${line} — <SefariaAttribution> is passed a \`ref\` prop. ` +
        `\`ref\` is reserved on function components and crashes the reader (React error #290). ` +
        `Use \`sefariaRef\` instead.`
      );
    }
  }

  // Check 2: DailyJewishHome rendered outside the allowed home page.
  if (!ALLOWED_DAILY_JEWISH_HOME_FILES.has(file) && /<DailyJewishHome\b/.test(src)) {
    errors.push(
      `${file} — renders <DailyJewishHome />. That component must render ONLY on the ` +
      `main Jewish Hub home page (JewishContentHub.jsx), not on sub-pages.`
    );
  }
}

if (errors.length === 0) {
  console.log(`✅  No Jewish Hub regressions found (checked ${files.length} files).\n`);
  process.exit(0);
} else {
  console.error(`\n❌  ${errors.length} Jewish Hub regression(s) found:\n`);
  errors.forEach((e) => console.error(`    ${e}\n`));
  process.exit(1);
}
