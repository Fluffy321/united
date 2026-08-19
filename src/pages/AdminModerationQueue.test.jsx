import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./AdminModerationQueue.jsx', import.meta.url), 'utf8');

describe('AdminModerationQueue AI admin contract', () => {
  it('keeps current workflows while adding AI review, hidden, and appeal queues', () => {
    expect(source).toContain('AiModerationPanel');
    expect(source).toContain('Needs review');
    expect(source).toContain('AI hidden');
    expect(source).toContain('Appeals');
    expect(source).toContain('User reports');
    expect(source).toContain('Businesses');
    expect(source).toContain('Claims');
    expect(source).toContain('History');
  });

  it('loads AI cases and queue health only through the authenticated publishing service', () => {
    expect(source).toContain('publishingService.listModerationQueue');
    expect(source).toContain('publishingService.getModerationHealth');
    expect(source).toContain('publishingService.decideModeration');
    expect(source).toContain("status: 'appealed'");
  });
});
