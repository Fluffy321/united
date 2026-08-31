import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./MitzvahCircle.jsx', import.meta.url), 'utf8');

describe('Help publishing entry points', () => {
  it('sends public needs and offers through Smart Publisher', () => {
    expect(source).toContain("navigate('/Publish?type=help_need')");
    expect(source).toContain("navigate('/Publish?type=help_offer')");
  });
});
