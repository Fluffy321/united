import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services', () => ({
  dataService: {
    entities: {
      UserCommunity: { filter: vi.fn() },
      Friendship: { filter: vi.fn() },
      User: { filter: vi.fn() },
    },
  },
}));

import { dataService } from '@/services';
import { shareCommunity, areConnections, canMessage } from '@/lib/messagingPermissions';

const { UserCommunity, Friendship, User } = dataService.entities;
const SENDER = { id: 'sender-id' };

beforeEach(() => vi.clearAllMocks());

// ── shareCommunity ─────────────────────────────────────────────────────────────

describe('shareCommunity', () => {
  it('returns true when the users share at least one community', async () => {
    UserCommunity.filter
      .mockResolvedValueOnce([{ community_id: 'c1' }, { community_id: 'c2' }])
      .mockResolvedValueOnce([{ community_id: 'c2' }, { community_id: 'c3' }]);
    expect(await shareCommunity('a', 'b')).toBe(true);
  });
  it('returns false when the users share no communities', async () => {
    UserCommunity.filter
      .mockResolvedValueOnce([{ community_id: 'c1' }])
      .mockResolvedValueOnce([{ community_id: 'c2' }]);
    expect(await shareCommunity('a', 'b')).toBe(false);
  });
  it('returns false when the sender has no memberships', async () => {
    UserCommunity.filter
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ community_id: 'c1' }]);
    expect(await shareCommunity('a', 'b')).toBe(false);
  });
  it('returns false when the recipient has no memberships', async () => {
    UserCommunity.filter
      .mockResolvedValueOnce([{ community_id: 'c1' }])
      .mockResolvedValueOnce([]);
    expect(await shareCommunity('a', 'b')).toBe(false);
  });
  it('fetches both users memberships in parallel', async () => {
    UserCommunity.filter
      .mockResolvedValueOnce([{ community_id: 'cx' }])
      .mockResolvedValueOnce([{ community_id: 'cx' }]);
    await shareCommunity('a', 'b');
    expect(UserCommunity.filter).toHaveBeenCalledTimes(2);
  });
});

// ── areConnections ─────────────────────────────────────────────────────────────

describe('areConnections', () => {
  it('returns true when a Friendship record exists', async () => {
    Friendship.filter.mockResolvedValue([{ user_id: 'a', friend_id: 'b' }]);
    expect(await areConnections('a', 'b')).toBe(true);
  });
  it('returns false when no connection exists', async () => {
    Friendship.filter.mockResolvedValue([]);
    expect(await areConnections('a', 'b')).toBe(false);
  });
  it('queries with the correct sender/recipient ids', async () => {
    Friendship.filter.mockResolvedValue([]);
    await areConnections('user-a', 'user-b');
    expect(Friendship.filter).toHaveBeenCalledWith({ user_id: 'user-a', friend_id: 'user-b' });
  });
});

// ── canMessage ─────────────────────────────────────────────────────────────────

describe('canMessage', () => {
  function mockRecipient(settings = {}) {
    User.filter.mockResolvedValue([{ id: 'recipient-id', message_settings: settings }]);
  }

  it('returns false when the recipient does not exist', async () => {
    User.filter.mockResolvedValue([]);
    expect(await canMessage(SENDER, 'ghost-id')).toEqual({ canMessage: false });
  });

  it('returns true when rule is "everyone"', async () => {
    mockRecipient({ allowMessagesFrom: 'everyone' });
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: true });
  });

  it('returns true when rule is "members"', async () => {
    mockRecipient({ allowMessagesFrom: 'members' });
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: true });
  });

  it('returns false when rule is "nobody"', async () => {
    mockRecipient({ allowMessagesFrom: 'nobody' });
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: false });
  });

  it('allows messaging via "communities" rule when users share a community', async () => {
    mockRecipient({ allowMessagesFrom: 'communities' });
    UserCommunity.filter
      .mockResolvedValueOnce([{ community_id: 'cx' }])
      .mockResolvedValueOnce([{ community_id: 'cx' }]);
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: true });
  });

  it('blocks messaging via "communities" rule when no shared community', async () => {
    mockRecipient({ allowMessagesFrom: 'communities' });
    UserCommunity.filter
      .mockResolvedValueOnce([{ community_id: 'c1' }])
      .mockResolvedValueOnce([{ community_id: 'c2' }]);
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: false });
  });

  it('allows messaging via "connections" rule when connected', async () => {
    mockRecipient({ allowMessagesFrom: 'connections' });
    Friendship.filter.mockResolvedValue([{ user_id: SENDER.id, friend_id: 'r' }]);
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: true });
  });

  it('blocks messaging via "connections" rule when not connected', async () => {
    mockRecipient({ allowMessagesFrom: 'connections' });
    Friendship.filter.mockResolvedValue([]);
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: false });
  });

  it('defaults to "communities" rule when no setting is present', async () => {
    mockRecipient({});
    UserCommunity.filter
      .mockResolvedValueOnce([{ community_id: 'cx' }])
      .mockResolvedValueOnce([{ community_id: 'cx' }]);
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: true });
  });

  it('supports snake_case allow_messages_from setting key', async () => {
    mockRecipient({ allow_messages_from: 'everyone' });
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: true });
  });

  it('returns false for an unrecognised rule string', async () => {
    mockRecipient({ allowMessagesFrom: 'admins_only' });
    expect(await canMessage(SENDER, 'r')).toEqual({ canMessage: false });
  });
});
