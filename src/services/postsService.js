import dataService from './dataService';
import { ACTIVITY_KIND, normalizeUnifiedActivity } from '@/lib/productInfrastructure';
import { createReaction, createUnifiedPost, deleteComment, deleteReaction, deleteUnifiedPost, filterComment, filterReaction, filterUnifiedPost, getUnifiedPost, listUnifiedPost, updateComment, updateUnifiedPost } from '@/services/entityServices';

export const postsService = {
  listPosts(sort = '-created_date', limit = 100) {
    return listUnifiedPost(sort, limit);
  },
  filterPosts(filter = {}, sort = '-created_date', limit = 100) {
    return filterUnifiedPost(filter, sort, limit);
  },
  getPost(id) {
    return getUnifiedPost(id);
  },
  createPost(payload) {
    return createUnifiedPost(normalizeUnifiedActivity(payload));
  },
  createCommunityPost(payload) {
    return createUnifiedPost(normalizeUnifiedActivity(payload, { kind: ACTIVITY_KIND.COMMUNITY_POST }));
  },
  createMapPost(payload) {
    return createUnifiedPost(normalizeUnifiedActivity({ ...payload, post_to_map: true }, { kind: ACTIVITY_KIND.MAP_POST }));
  },
  createMarketplaceListing(payload) {
    return createUnifiedPost(normalizeUnifiedActivity(payload, { kind: ACTIVITY_KIND.MARKETPLACE_LISTING }));
  },
  createMitzvahRequestPost(payload) {
    return createUnifiedPost(normalizeUnifiedActivity(payload, { kind: ACTIVITY_KIND.MITZVAH_REQUEST }));
  },
  updatePost(id, patch) {
    return updateUnifiedPost(id, patch);
  },
  deletePost(id) {
    return deleteUnifiedPost(id);
  },
  listComments(postId, sort = 'created_date', limit = 100) {
    return filterComment({ post_id: postId }, sort, limit);
  },
  createComment(payload) {
    return dataService.functions.invoke('createFeedReply', {
      ...payload,
      parent_comment_id: payload.parent_comment_id || payload.reply_to_comment_id || null,
      reply_to_comment_id: payload.reply_to_comment_id || payload.parent_comment_id || null,
    }).then((response) => response.data);
  },
  updateComment(id, patch) {
    return updateComment(id, patch);
  },
  deleteComment(id) {
    return deleteComment(id);
  },
  listReactions(postId, limit = 100) {
    return filterReaction({ post_id: postId }, '-created_date', limit);
  },
  listUserReactions(postId, userId, limit = 100) {
    return filterReaction({ post_id: postId, user_id: userId }, undefined, limit);
  },
  createReaction(payload) {
    return createReaction(payload);
  },
  deleteReaction(id) {
    return deleteReaction(id);
  },
  search(payload) {
    return dataService.functions.invoke('universalSearch', payload);
  },
};

export default postsService;
