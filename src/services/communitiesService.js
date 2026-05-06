import dataService from './dataService';

export const communitiesService = {
  listCommunities(sort = '-follower_count', limit = 100) {
    return dataService.entities.Community.list(sort, limit);
  },
  filterCommunities(filter = {}, sort = '-follower_count', limit = 100) {
    return dataService.entities.Community.filter(filter, sort, limit);
  },
  getCommunity(id) {
    return dataService.entities.Community.get(id);
  },
  createCommunity(payload) {
    return dataService.entities.Community.create(payload);
  },
  updateCommunity(id, patch) {
    return dataService.entities.Community.update(id, patch);
  },
  listMemberships(filter = {}, sort = '-created_date', limit = 100) {
    return dataService.entities.UserCommunity.filter(filter, sort, limit);
  },
  joinCommunity(payload) {
    return dataService.entities.UserCommunity.create(payload);
  },
  updateMembership(id, patch) {
    return dataService.entities.UserCommunity.update(id, patch);
  },
  leaveCommunity(id) {
    return dataService.entities.UserCommunity.delete(id);
  },
};

export default communitiesService;
