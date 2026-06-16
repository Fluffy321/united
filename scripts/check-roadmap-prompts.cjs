#!/usr/bin/env node
/**
 * check-roadmap-prompts.js
 *
 * Finds roadmap entries that are missing a `prompt` field but should have one.
 * Exits with code 1 if any are found so this can be used as a pre-commit check.
 *
 * Usage:   node scripts/check-roadmap-prompts.js
 * npm:     npm run check-prompts
 */

const fs = require('fs');
const path = require('path');

const roadmapPath = path.join(__dirname, '../internal/roadmap.js');
const src = fs.readFileSync(roadmapPath, 'utf8');

// Statuses that don't need prompts (done or dropped)
const SKIP_STATUSES = new Set(['SHIPPED', 'DROPPED']);

// Parse entries: split the file into blocks that start with { id: '...'
// and end at the next top-level }, in the ROADMAP array.
// Strategy: find every `id: '...'` occurrence, then scan the surrounding block.
const results = [];
const idRegex = /\n  \{\s*\n\s+id:\s*'([^']+)'/g;
let m;

while ((m = idRegex.exec(src)) !== null) {
  const id = m[1];
  const blockStart = m.index;

  // Find the closing `},` or `}` at the top-level indentation (two spaces)
  const afterStart = src.indexOf('\n  }', blockStart + 4);
  const block = afterStart !== -1 ? src.slice(blockStart, afterStart + 5) : src.slice(blockStart, blockStart + 3000);

  const statusMatch = block.match(/status:\s*STATUS\.(\w+)/);
  const titleMatch = block.match(/title:\s*'([^']+)'/);
  const hasPrompt = /\bprompt\s*:/.test(block);

  const status = statusMatch ? statusMatch[1] : 'UNKNOWN';
  const title = titleMatch ? titleMatch[1] : id;

  if (SKIP_STATUSES.has(status)) continue;

  results.push({ id, title, status, hasPrompt });
}

const missing = results.filter(r => !r.hasPrompt);

if (missing.length === 0) {
  console.log(`✅  All ${results.length} non-shipped roadmap entries have prompts.\n`);
  process.exit(0);
} else {
  console.error(`\n❌  ${missing.length} roadmap item(s) are missing a \`prompt\` field:\n`);
  missing.forEach(({ id, title, status }) => {
    console.error(`    [${status.padEnd(9)}] ${id}`);
    console.error(`               "${title}"\n`);
  });
  console.error(
    'Each entry that an AI agent can implement must include a `prompt` field.\n' +
    'See the PROMPT FIELD section at the top of internal/roadmap.js for the required format.\n' +
    'Omit only for items that are genuinely manual-only, and document why in `why`.\n'
  );
  process.exit(1);
}
