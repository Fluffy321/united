import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Settings.jsx', import.meta.url), 'utf8');

describe('Settings Brief integration contract', () => {
  it('opens sections from query state and mounts Brief preferences in Notifications', () => {
    expect(source).toContain('useSearchParams');
    expect(source).toContain('const [searchParams, setSearchParams] = useSearchParams()');
    expect(source).toContain('handleSectionChange');
    expect(source).toContain('onClick={() => handleSectionChange(id)}');
    expect(source).toContain('<BriefPreferencesSettings currentUser={currentUser} />');
  });
});
