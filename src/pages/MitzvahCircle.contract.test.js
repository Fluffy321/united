import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./MitzvahCircle.jsx', import.meta.url), 'utf8');
const quickView = readFileSync(new URL('../components/mitzvah/circle/QuickViewSheet.jsx', import.meta.url), 'utf8');

describe('Help public offer contract', () => {
  it('persists direction and connects both rail posting modes', () => {
    expect(source).toContain('direction: requestDirection');
    expect(source).toContain("onPostNeed={() => openRequestForm(null, 'need')}");
    expect(source).toContain("onPostOffer={() => openRequestForm(null, 'offer')}");
    expect(source).toContain('direction={requestDirection}');
    expect(source).toContain("if (request.direction === 'offer')");
  });

  it('does not invite a member to privately help someone already offering help', () => {
    expect(quickView).toContain("request.direction !== 'offer'");
    expect(quickView).toContain("request.direction === 'offer'");
  });
});
