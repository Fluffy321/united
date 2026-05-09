import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, ArrowRight, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import { dataService, postsService } from '@/services';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const INITIAL_COMMENT_COUNT = 5;

export default function CommentsSheet({ postId, postAuthorId, isOpen, onClose, currentUser, blockedIds = [] }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentLikes, setCommentLikes] = useState({}); // { commentId: { count, liked } }

  useEffect(() => {
    if (isOpen && postId) {
      setShowAll(false);
      setLoadError(false);
      loadComments();
    }
  }, [isOpen, postId]);

  const loadCommentLikes = async (loadedComments) => {
    if (!currentUser || loadedComments.length === 0) return;
    try {
      const ids = loadedComments.map(c => c.id);
      // Single read of all Like records, then group by comment ID in memory.
      // Like is always localStorage, so this is one JSON parse instead of N.
      const allLikes = await dataService.entities.Like.filter({}, null, 5000);
      const idSet = new Set(ids);
      const byComment = {};
      allLikes.filter(l => idSet.has(l.post_id)).forEach(l => {
        (byComment[l.post_id] ??= []).push(l);
      });
      const map = {};
      ids.forEach(id => {
        const likes = byComment[id] || [];
        map[id] = { count: likes.length, liked: likes.some(l => l.user_id === currentUser.id) };
      });
      setCommentLikes(map);
    } catch {
      // Non-critical — like counts stay empty rather than breaking the sheet.
    }
  };

  const loadComments = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const allComments = await postsService.listComments(postId, '-created_date');
      const filtered = allComments.filter(c => !blockedIds.includes(c.author_id));
      setComments(filtered);
      loadCommentLikes(filtered);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    const current = commentLikes[commentId] || { count: 0, liked: false };
    // Optimistic update
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: { count: current.liked ? current.count - 1 : current.count + 1, liked: !current.liked },
    }));
    try {
      if (current.liked) {
        const existing = await dataService.entities.Like.filter({ post_id: commentId, user_id: currentUser.id });
        if (existing[0]) await dataService.entities.Like.delete(existing[0].id);
      } else {
        await dataService.entities.Like.create({ post_id: commentId, user_id: currentUser.id });
      }
    } catch {
      // Revert the optimistic update so the displayed count stays accurate.
      setCommentLikes(prev => ({ ...prev, [commentId]: current }));
      toast.error('Could not update like. Please try again.');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    setPosting(true);
    try {
      const comment = await postsService.createComment({
        post_id: postId,
        author_id: currentUser.id,
        author_name: currentUser.full_name,
        author_avatar_url: currentUser.avatar_url,
        body: newComment.trim(),
        reply_to_comment_id: replyingTo,
      });

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setReplyingTo(null);

      // Send notification to post author
      if (postAuthorId !== currentUser.id) {
        await dataService.functions.invoke('sendNotificationOnComment', {
          post_id: postId,
          commenter_id: currentUser.id,
          commenter_name: currentUser.full_name,
          comment_body: newComment.trim(),
          post_author_id: postAuthorId,
        });
      }

      // Detect @mentions in comment body and notify each mentioned user
      const mentionMatches = newComment.trim().match(/@(\w+)/g);
      if (mentionMatches) {
        // Look up participants in this thread to resolve @name -> user_id
        const threadAuthors = comments.filter(c => c.author_id && c.author_id !== currentUser.id);
        for (const match of mentionMatches) {
          const mentionName = match.slice(1).toLowerCase();
          const mentioned = threadAuthors.find(c =>
            (c.author_name || '').toLowerCase().replace(/\s+/g, '').startsWith(mentionName)
          );
          if (mentioned?.author_id) {
            dataService.functions.invoke('notifyOnMention', {
              mentioned_user_id: mentioned.author_id,
              actor_id: currentUser.id,
              actor_name: currentUser.full_name || currentUser.display_name,
              post_id: postId,
              context_text: newComment.trim(),
            }).catch(() => {});
          }
        }
      }

      toast.success('Comment posted!');
    } catch (error) {
      toast.error('Failed to post comment');
    }
    setPosting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:right-0 md:top-0 md:h-screen md:w-96 md:shadow-lg">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-100 p-4 flex items-center justify-between">
        <h2 className="font-bold text-[16px] text-slate-900">Comments</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-[14px] font-semibold text-slate-600">Couldn't load comments</p>
            <p className="text-[12px] text-slate-400 mt-1 mb-4">Check your connection and try again.</p>
            <button
              onClick={loadComments}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-[14px] font-semibold text-slate-600">No comments yet</p>
            <p className="text-[12px] text-slate-400 mt-1">Be the first to start a discussion!</p>
          </div>
        ) : (
          <>
          {!showAll && comments.length > INITIAL_COMMENT_COUNT && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-[13px] font-semibold text-blue-600 py-2 hover:text-blue-700 transition-colors"
            >
              Show all {comments.length} comments
            </button>
          )}
          {(showAll ? comments : comments.slice(0, INITIAL_COMMENT_COUNT)).map(comment => {
            const repliedTo = comment.reply_to_comment_id ? comments.find(c => c.id === comment.reply_to_comment_id) : null;
            return (
              <div key={comment.id} className="space-y-2">
                {repliedTo && (
                  <div className="ml-4 pl-3 border-l-2 border-slate-200 text-[12px] text-slate-500 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-medium">{repliedTo.author_name}</span>
                  </div>
                )}
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <button
                      onClick={() => {
                        if (comment.author_id) navigate(`/PublicProfile?id=${comment.author_id}`);
                      }}
                      className="flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      {comment.author_avatar_url ? (
                        <img src={comment.author_avatar_url} alt="" className="w-6 h-6 rounded-full object-cover cursor-pointer" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 cursor-pointer">
                          {comment.author_name?.[0]}
                        </div>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => {
                          if (comment.author_id) navigate(`/PublicProfile?id=${comment.author_id}`);
                        }}
                        className="text-[13px] font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                      >
                        {comment.author_name}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 flex-shrink-0">
                      {formatDistanceToNow(parseISO(comment.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{comment.body}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center gap-1 text-[12px] font-semibold transition-colors ${
                        commentLikes[comment.id]?.liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${commentLikes[comment.id]?.liked ? 'fill-current' : ''}`} />
                      {commentLikes[comment.id]?.count > 0 && <span>{commentLikes[comment.id].count}</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {showAll && comments.length > INITIAL_COMMENT_COUNT && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full text-[12px] text-slate-400 py-2 hover:text-slate-600 transition-colors"
            >
              Show fewer
            </button>
          )}
          </>
        )}
      </div>

      {/* Reply Context */}
      {replyingTo && (
        <div className="flex-shrink-0 border-t border-slate-100 px-4 py-2 bg-blue-50 flex items-center justify-between">
          <p className="text-[12px] text-blue-700">
            Replying to <span className="font-semibold">{comments.find(c => c.id === replyingTo)?.author_name}</span>
          </p>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-blue-600 hover:text-blue-700 text-[12px] font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-slate-100 p-3 flex gap-2 bg-white">
        <input
          type="text"
          placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
              handlePostComment();
            }
          }}
          className="flex-1 bg-slate-100 border-0 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
        />
        <button
          onClick={handlePostComment}
          disabled={posting || !newComment.trim()}
          className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
