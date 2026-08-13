import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profile = readFileSync(new URL('./Profile.jsx', import.meta.url), 'utf8');
const header = readFileSync(new URL('../components/profile/ModernProfileHeader.jsx', import.meta.url), 'utf8');
const stats = readFileSync(new URL('../components/profile/ModernStatsRow.jsx', import.meta.url), 'utf8');
const actions = readFileSync(new URL('../components/profile/ModernActionButtons.jsx', import.meta.url), 'utf8');
const posts = readFileSync(new URL('../components/profile/RecentPostsSection.jsx', import.meta.url), 'utf8');
const progressUrl = new URL('../components/profile/ProfileProgressSection.jsx', import.meta.url);

describe('Profile iPhone hierarchy', () => {
  it('puts identity and activity before private progress', () => {
    const identity = profile.indexOf('data-testid="profile-identity"');
    const recentPosts = profile.indexOf('data-testid="profile-recent-posts"');
    const communities = profile.indexOf('data-testid="profile-communities"');
    const progress = profile.indexOf('data-testid="profile-progress"');

    expect(identity).toBeGreaterThan(-1);
    expect(recentPosts).toBeGreaterThan(identity);
    expect(communities).toBeGreaterThan(recentPosts);
    expect(progress).toBeGreaterThan(communities);
    expect(profile).toContain('isOwnProfile && (');
  });

  it('keeps the existing relationship actions connected', () => {
    expect(profile).toContain('onSendRequest={handleSendRequest}');
    expect(profile).toContain('onCancelRequest={handleCancelRequest}');
    expect(profile).toContain('onAcceptRequest={handleAcceptRequest}');
    expect(profile).toContain('onDeclineRequest={handleDeclineRequest}');
    expect(profile).toContain('onRemoveFriend={handleRemoveFriend}');
    expect(actions).toContain('onMessage');
    expect(actions).toContain('onReport');
    expect(actions).toContain('onBlock');
  });

  it('uses a compact cover-free identity and stats row', () => {
    expect(header).not.toContain('FALLBACK_COVER_IMAGE');
    expect(header).not.toContain('PATTERN_OVERLAY');
    expect(header).not.toContain('h-[112px]');
    expect(header).toContain('min-h-20');
    expect(stats).toContain('Friends');
    expect(stats).toContain('Communities');
    expect(stats).toContain('Posts');
    expect(stats).toContain('Impact');
    expect(stats).not.toContain('getNextTier');
    expect(stats).toContain('min-h-11');
    expect(actions).toContain('Edit Profile');
    expect(actions).toContain('Find friends');
  });

  it('keeps owner tools in a closed accessible progress disclosure', () => {
    const progress = readFileSync(progressUrl, 'utf8');
    expect(progress).toContain('useState(false)');
    expect(progress).toContain('aria-expanded={open}');
    expect(progress).toContain("open &&");
    expect(progress).toContain('Your progress');
  });

  it('only offers the empty-profile post action to the owner', () => {
    expect(posts).toContain('isOwnProfile && (');
    expect(posts).toContain('Write your first post');
  });
});
