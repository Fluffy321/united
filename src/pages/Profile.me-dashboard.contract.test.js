import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profile = readFileSync(new URL('./Profile.jsx', import.meta.url), 'utf8');
const progress = readFileSync(new URL('../components/profile/ProfileProgressSection.jsx', import.meta.url), 'utf8');

describe('Profile owner Me dashboard integration', () => {
  it('renders the approved owner dashboard in order', () => {
    const summary = profile.indexOf('<MeTodaySummary');
    const alerts = profile.indexOf('<MePersonalAlerts');
    const shortcuts = profile.indexOf('<MeShortcutGrid');
    const identity = profile.indexOf('<MeIdentityRow');
    expect(profile).toContain('isOwnProfile ? (');
    expect(summary).toBeGreaterThan(-1);
    expect(alerts).toBeGreaterThan(summary);
    expect(shortcuts).toBeGreaterThan(alerts);
    expect(identity).toBeGreaterThan(shortcuts);
  });

  it('loads private data only for the owner', () => {
    expect(profile).toContain('notificationsService.listForUser');
    expect(profile).toContain('getZmanim');
    expect(profile).toContain('getShabbatTimes');
    expect(profile).toContain('filterBookmark');
    expect(profile.match(/enabled: !!profileUser && isOwnProfile/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps every other-member relationship action connected', () => {
    expect(profile).toContain('<ModernProfileHeader');
    expect(profile).toContain('<ModernStatsRow');
    expect(profile).toContain('<ModernActionButtons');
    for (const prop of ['onSendRequest', 'onCancelRequest', 'onAcceptRequest', 'onDeclineRequest', 'onRemoveFriend']) {
      expect(profile).toContain(`${prop}={`);
    }
  });

  it('routes each personal shortcut to an existing destination', () => {
    expect(profile).toContain("navigate('/Communities')");
    expect(profile).toContain("navigate('/MitzvahCircle')");
    expect(profile).toContain("navigate('/Search?type=event')");
    expect(profile).toContain("navigate('/Notifications')");
    expect(profile).toContain("navigate('/JewishHub')");
  });

  it('lets Saved request the private disclosure to open', () => {
    expect(profile).toContain('setProgressOpenRequest');
    expect(profile).toContain('openRequest={progressOpenRequest}');
    expect(progress).toContain('openRequest');
    expect(progress).toContain('onOpenChange');
  });
});
