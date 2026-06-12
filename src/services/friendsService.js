import { supabase, shouldUseSupabase } from '@/api/supabaseClient';
import { notificationsService } from './notificationsService';

// Relationship statuses returned by getRelationship()
export const FRIEND_STATUS = {
  NONE:             'none',
  PENDING_SENT:     'pending_sent',
  PENDING_RECEIVED: 'pending_received',
  FRIENDS:          'friends',
};

async function callRpc(name, params) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  return data;
}

const PUBLIC_PROFILE_SELECT = 'id, display_name, avatar_url, username, city';

async function loadPublicProfileMap(userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from('public_profiles')
    .select(PUBLIC_PROFILE_SELECT)
    .in('id', ids);

  if (error) throw error;

  return new Map((data || []).map(profile => [profile.id, profile]));
}

export const friendsService = {
  // ── Read ──────────────────────────────────────────────────────────────────

  /** Full relationship state between two users. */
  async getRelationship(currentUserId, otherUserId) {
    if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
      return { status: FRIEND_STATUS.NONE, requestId: null };
    }
    if (!shouldUseSupabase) return { status: FRIEND_STATUS.NONE, requestId: null };

    // Check accepted friendship
    const { data: fs } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('friend_id', otherUserId)
      .maybeSingle();

    if (fs) return { status: FRIEND_STATUS.FRIENDS, requestId: null };

    // Check pending requests in both directions
    const { data: reqs } = await supabase
      .from('friend_requests')
      .select('id, requester_id, recipient_id, status')
      .or(`and(requester_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
      .eq('status', 'pending');

    if (reqs && reqs.length > 0) {
      const req = reqs[0];
      if (req.requester_id === currentUserId) {
        return { status: FRIEND_STATUS.PENDING_SENT, requestId: req.id };
      }
      return { status: FRIEND_STATUS.PENDING_RECEIVED, requestId: req.id };
    }

    return { status: FRIEND_STATUS.NONE, requestId: null };
  },

  /** All accepted friends of userId with profile data. */
  async listFriends(userId) {
    if (!userId || !shouldUseSupabase) return [];
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, friend_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const profiles = await loadPublicProfileMap((data || []).map(row => row.friend_id));
      return (data || []).map(row => ({
        ...row,
        friend: profiles.get(row.friend_id) || null,
      }));
    } catch {
      return [];
    }
  },

  /** Count of accepted friends. */
  async count(userId) {
    if (!userId || !shouldUseSupabase) return 0;
    const { count, error } = await supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) return 0;
    return count ?? 0;
  },

  /** Incoming pending requests (I am the recipient). Includes requester profile. */
  async getIncomingRequests(userId) {
    if (!userId || !shouldUseSupabase) return [];
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id, requester_id, created_at')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const profiles = await loadPublicProfileMap((data || []).map(row => row.requester_id));
      return (data || []).map(row => ({
        ...row,
        requester: profiles.get(row.requester_id) || null,
      }));
    } catch {
      return [];
    }
  },

  /** Outgoing pending requests (I am the requester). Includes recipient profile. */
  async getOutgoingRequests(userId) {
    if (!userId || !shouldUseSupabase) return [];
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id, recipient_id, created_at')
        .eq('requester_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const profiles = await loadPublicProfileMap((data || []).map(row => row.recipient_id));
      return (data || []).map(row => ({
        ...row,
        recipient: profiles.get(row.recipient_id) || null,
      }));
    } catch {
      return [];
    }
  },

  // ── Mutations (all via SECURITY DEFINER RPCs) ─────────────────────────────

  async sendRequest(currentUser, recipientUser) {
    if (!shouldUseSupabase) return { status: FRIEND_STATUS.PENDING_SENT };
    const result = await callRpc('send_friend_request', { p_recipient_id: recipientUser.id });
    if (result?.error) throw new Error(result.error);

    // Notify the recipient
    if (result.status === 'pending') {
      notificationsService.create({
        userId:   recipientUser.id,
        actorId:  currentUser.id,
        type:     'friend_request_received',
        title:    'Friend request',
        body:     `${currentUser.display_name || currentUser.full_name || 'Someone'} sent you a friend request.`,
        linkUrl:  `/Profile?id=${currentUser.id}`,
        data:     { requestId: result.request_id },
      }).catch(() => {});
    }

    return result;
  },

  async acceptRequest(requestId, currentUser, requesterUser) {
    if (!shouldUseSupabase) return;
    const result = await callRpc('accept_friend_request', { p_request_id: requestId });
    if (result?.error) throw new Error(result.error);

    // Notify the requester that their request was accepted
    if (requesterUser?.id) {
      notificationsService.create({
        userId:   requesterUser.id,
        actorId:  currentUser.id,
        type:     'friend_request_accepted',
        title:    'Friend request accepted',
        body:     `${currentUser.display_name || currentUser.full_name || 'Someone'} accepted your friend request.`,
        linkUrl:  `/Profile?id=${currentUser.id}`,
        data:     {},
      }).catch(() => {});
    }

    return result;
  },

  async declineRequest(requestId) {
    if (!shouldUseSupabase) return;
    const result = await callRpc('decline_friend_request', { p_request_id: requestId });
    if (result?.error) throw new Error(result.error);
    return result;
  },

  async cancelRequest(requestId) {
    if (!shouldUseSupabase) return;
    const result = await callRpc('cancel_friend_request', { p_request_id: requestId });
    if (result?.error) throw new Error(result.error);
    return result;
  },

  async removeFriend(currentUserId, friendUserId) {
    if (!shouldUseSupabase) return;
    const result = await callRpc('remove_friendship', { p_friend_id: friendUserId });
    if (result?.error) throw new Error(result.error);
    return result;
  },

  // Legacy compatibility shim (used by messagingPermissions.js)
  async isFriend(userId, friendId) {
    if (!userId || !friendId || !shouldUseSupabase) return false;
    const { data } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', friendId)
      .maybeSingle();
    return !!data;
  },
};

export default friendsService;
