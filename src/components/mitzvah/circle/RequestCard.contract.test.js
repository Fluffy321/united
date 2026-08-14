import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.resolve(testDirectory, 'RequestCard.jsx'), 'utf8');

describe('public help offer safety', () => {
  it('never turns a public offer into a private response flow', () => {
    expect(source).toContain("request.direction !== 'offer'");
  });
});
