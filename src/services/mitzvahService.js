import { createChesedLog, createHelpOffer, createMitzvahCompletion, createMitzvahRequest, createMitzvahRequestComment, createVerificationRequest, deleteChesedLog, deleteMitzvahRequest, filterChesedLog, filterHelpOffer, filterMitzvahCompletion, filterMitzvahRequest, filterMitzvahRequestComment, filterVerificationRequest, updateChesedLog, updateHelpOffer, updateMitzvahCompletion, updateMitzvahRequest, updateVerificationRequest } from '@/services/entityServices';

export const mitzvahService = {
  listRequests(filter = {}, sort = '-created_date', limit = 100) {
    return filterMitzvahRequest(filter, sort, limit);
  },
  createRequest(payload) {
    return createMitzvahRequest(payload);
  },
	  updateRequest(id, patch) {
	    return updateMitzvahRequest(id, patch);
	  },
	  deleteRequest(id) {
	    return deleteMitzvahRequest(id);
	  },
  listOffers(filter = {}, sort = '-created_date', limit = 100) {
    return filterHelpOffer(filter, sort, limit);
  },
  createOffer(payload) {
    return createHelpOffer(payload);
  },
  updateOffer(id, patch) {
    return updateHelpOffer(id, patch);
  },
  listRequestComments(filter = {}, sort = 'created_date', limit = 500) {
    return filterMitzvahRequestComment(filter, sort, limit);
  },
  createRequestComment(payload) {
    return createMitzvahRequestComment(payload);
  },
  listCompletions(filter = {}, sort = '-created_date', limit = 100) {
    return filterMitzvahCompletion(filter, sort, limit);
  },
  createCompletion(payload) {
    return createMitzvahCompletion(payload);
  },
  updateCompletion(id, patch) {
    return updateMitzvahCompletion(id, patch);
  },
  listVerificationRequests(filter = {}, sort = '-created_date', limit = 100) {
    return filterVerificationRequest(filter, sort, limit);
  },
  createVerificationRequest(payload) {
    return createVerificationRequest(payload);
  },
  updateVerificationRequest(id, patch) {
    return updateVerificationRequest(id, patch);
  },
  listChesedLogs(filter = {}, sort = '-date', limit = 200) {
    return filterChesedLog(filter, sort, limit);
  },
  createChesedLog(payload) {
    return createChesedLog(payload);
  },
  updateChesedLog(id, patch) {
    return updateChesedLog(id, patch);
  },
  deleteChesedLog(id) {
    return deleteChesedLog(id);
  },
};

export default mitzvahService;
