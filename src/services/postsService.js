import dataService from './dataService';

export const postsService = {
  listPosts(sort = '-created_date', limit = 100) {
    return dataService.entities.UnifiedPost.list(sort, limit);
  },
  filterPosts(filter = {}, sort = '-created_date', limit = 100) {
    return dataService.entities.UnifiedPost.filter(filter, sort, limit);
  },
  getPost(id) {
    return dataService.entities.UnifiedPost.get(id);
  },
  createPost(payload) {
    return dataService.entities.UnifiedPost.create(payload);
  },
  updatePost(id, patch) {
    return dataService.entities.UnifiedPost.update(id, patch);
  },
  deletePost(id) {
    return dataService.entities.UnifiedPost.delete(id);
  },
  listComments(postId, sort = 'created_date', limit = 100) {
    return dataService.entities.Comment.filter({ post_id: postId }, sort, limit);
  },
  createComment(payload) {
    return dataService.functions.invoke('createFeedReply', {
      ...payload,
      parent_comment_id: payload.parent_comment_id || payload.reply_to_comment_id || null,
      reply_to_comment_id: payload.reply_to_comment_id || payload.parent_comment_id || null,
    }).then((response) => response.data);
  },
  updateComment(id, patch) {
    return dataService.entities.Comment.update(id, patch);
  },
  deleteComment(id) {
    return dataService.entities.Comment.delete(id);
  },
  listReactions(postId, limit = 100) {
    return dataService.entities.Reaction.filter({ post_id: postId }, '-created_date', limit);
  },
  listUserReactions(postId, userId, limit = 100) {
    return dataService.entities.Reaction.filter({ post_id: postId, user_id: userId }, undefined, limit);
  },
  createReaction(payload) {
    return dataService.entities.Reaction.create(payload);
  },
  deleteReaction(id) {
    return dataService.entities.Reaction.delete(id);
  },
  search(payload) {
    return dataService.functions.invoke('universalSearch', payload);
  },
};

export default postsService;
