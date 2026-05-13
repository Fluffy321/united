import dataService from './dataService';

export const mitzvahService = {
  listRequests(filter = {}, sort = '-created_date', limit = 100) {
    return dataService.entities.MitzvahRequest.filter(filter, sort, limit);
  },
  createRequest(payload) {
    return dataService.entities.MitzvahRequest.create(payload);
  },
  updateRequest(id, patch) {
    return dataService.entities.MitzvahRequest.update(id, patch);
  },
  listOffers(filter = {}, sort = '-created_date', limit = 100) {
    return dataService.entities.HelpOffer.filter(filter, sort, limit);
  },
  createOffer(payload) {
    return dataService.entities.HelpOffer.create(payload);
  },
  updateOffer(id, patch) {
    return dataService.entities.HelpOffer.update(id, patch);
  },
  listRequestComments(filter = {}, sort = 'created_date', limit = 500) {
    return dataService.entities.MitzvahRequestComment.filter(filter, sort, limit);
  },
  createRequestComment(payload) {
    return dataService.entities.MitzvahRequestComment.create(payload);
  },
  listCompletions(filter = {}, sort = '-created_date', limit = 100) {
    return dataService.entities.MitzvahCompletion.filter(filter, sort, limit);
  },
  createCompletion(payload) {
    return dataService.entities.MitzvahCompletion.create(payload);
  },
  updateCompletion(id, patch) {
    return dataService.entities.MitzvahCompletion.update(id, patch);
  },
  listVerificationRequests(filter = {}, sort = '-created_date', limit = 100) {
    return dataService.entities.VerificationRequest.filter(filter, sort, limit);
  },
  createVerificationRequest(payload) {
    return dataService.entities.VerificationRequest.create(payload);
  },
  updateVerificationRequest(id, patch) {
    return dataService.entities.VerificationRequest.update(id, patch);
  },
  listChesedLogs(filter = {}, sort = '-date', limit = 200) {
    return dataService.entities.ChesedLog.filter(filter, sort, limit);
  },
  createChesedLog(payload) {
    return dataService.entities.ChesedLog.create(payload);
  },
  updateChesedLog(id, patch) {
    return dataService.entities.ChesedLog.update(id, patch);
  },
  deleteChesedLog(id) {
    return dataService.entities.ChesedLog.delete(id);
  },
};

export default mitzvahService;
