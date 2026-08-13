import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(`./${name}.jsx`, import.meta.url), 'utf8');

describe('Me dashboard component contracts', () => {
  it('keeps the daily summary calm and honest', () => {
    const source = read('MeTodaySummary');
    expect(source).toContain('Your JUnited today');
    expect(source).toContain('Next Jewish time');
    expect(source).toContain('Next plan');
    expect(source).toContain('Nothing planned yet');
    expect(source).toContain('Times unavailable');
    expect(source.match(/min-h-\[116px\]/g)?.length).toBe(2);
  });

  it('supports alert loading, error, empty, urgent, and unread states', () => {
    const source = read('MePersonalAlerts');
    expect(source).toContain('Personal alerts');
    expect(source).toContain("You're caught up");
    expect(source).toContain("Alerts couldn't load");
    expect(source).toContain('isUrgentPersonalAlert');
    expect(source).toContain('aria-label');
    expect(source).toContain('min-h-11');
  });

  it('exposes four useful existing destinations', () => {
    const source = read('MeShortcutGrid');
    for (const label of ['My communities', 'Saved', 'Help activity', 'Plans']) {
      expect(source).toContain(label);
    }
    expect(source).toContain("shortcuts.map");
    expect(source).toContain('min-h-[88px]');
  });

  it('keeps identity compact with one edit action', () => {
    const source = read('MeIdentityRow');
    expect(source).toContain('UserAvatar');
    expect(source).toContain('Edit');
    expect(source).toContain('min-h-11');
    expect(source).not.toContain('cover_url');
  });

  it('uses product icons instead of emoji controls', () => {
    const sources = ['MeTodaySummary', 'MePersonalAlerts', 'MeShortcutGrid', 'MeIdentityRow'].map(read).join('\n');
    expect(sources).not.toMatch(/[🚗💬👥🔔🔖🤝✦]/u);
  });
});
