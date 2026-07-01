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
};

export default communitiesService;
