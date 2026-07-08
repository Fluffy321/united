import { shouldUseSupabase, supabase } from '@/api/supabaseClient';
import { createCommunity, createUserCommunity, deleteUserCommunity, filterCommunity, filterUserCommunity, getCommunity, listCommunity, updateCommunity, updateUserCommunity } from '@/services/entityServices';

export const communitiesService = {
  listCommunities(sort = '-follower_count', limit = 100) {
    return listCommunity(sort, limit);
  },
  filterCommunities(filter = {}, sort = '-follower_count', limit = 100) {
    return filterCommunity(filter, sort, limit);
  },
  getCommunity(id) {
    return getCommunity(id);
  },
  createCommunity(payload) {
    return createCommunity(payload);
  },
  updateCommunity(id, patch) {
    return updateCommunity(id, patch);
  },
  listMemberships(filter = {}, sort = '-created_date', limit = 100) {
    return filterUserCommunity(filter, sort, limit);
  },
  joinCommunity(payload) {
    return createUserCommunity(payload);
  },
  updateMembership(id, patch) {
    return updateUserCommunity(id, patch);
  },
  leaveCommunity(id) {
    return deleteUserCommunity(id);
  },
  // Invite-code lookup for the /join page. invite_links reads are RLS-scoped to
  // inviters/managers (migration 20260701200000), so the lookup goes through a
  // SECURITY DEFINER RPC. Returns { status: 'active'|'expired'|'not_found', invite?, community? }.
  async getInviteLinkByCode(code) {
    if (!shouldUseSupabase || !supabase) return { status: 'not_found' };
    const { data, error } = await supabase.rpc('get_invite_link_by_code', { p_code: code });
    if (error) throw error;
    return data || { status: 'not_found' };
  },
  // Batch check for the Communities list page: which of the current user's
  // joined communities have new posts/events since their last visit?
  // Backed by the SECURITY DEFINER RPC in migration 20260519100000.
  // Returns an array of community id uuids.
  async getCommunitiesWithNewActivity() {
    if (!shouldUseSupabase || !supabase) return [];
    const { data, error } = await supabase.rpc('get_communities_with_new_activity');
    if (error) throw error;
    // setof uuid serializes as an array of strings; normalize object rows just in case.
    return (data || []).map(row => (row && typeof row === 'object') ? Object.values(row)[0] : row);
  },
};

export default communitiesService;
