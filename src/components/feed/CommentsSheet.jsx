import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Send, Loader2, MessageCircle, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import { dataService, postsService } from '@/services';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function CommentsSheet({
  post,
  postId,
  postAuthorId,
  isOpen,
  open,
  onClose,
  onOpenChange,
  currentUser,
  blockedIds = [],
  onCommentAdded,
}) {
  const resolvedPostId = postId || post?.id;
  const resolvedPostAuthorId = postAuthorId || post?.user_id;
  const sheetOpen = isOpen ?? open ?? false;
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentLikes, setCommentLikes] = useState({}); // { commentId: { count, liked } }
  const listRef = useRef(null);

  useEffect(() => {
    if (sheetOpen && resolvedPostId) {
      setLoadError(false);
      loadComments();
    }
  }, [sheetOpen, resolvedPostId]);

  useEffect(() => {
    if (!sheetOpen || !listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [comments.length, sheetOpen]);

  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

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
      const allComments = await postsService.listComments(resolvedPostId, 'created_date', 100);
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
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    
    setPosting(true);
    const body = newComment.trim();
    try {
      const comment = await postsService.createComment({
        post_id: resolvedPostId,
        author_id: currentUser.id,
        author_name: currentUser.display_name || currentUser.full_name || 'Community member',
        author_avatar_url: currentUser.avatar_url,
        body,
        parent_comment_id: replyingTo,
        reply_to_comment_id: replyingTo,
        client_context: {
          surface: 'feed_reply_sheet',
          source_post_id: resolvedPostId,
        },
      });

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setReplyingTo(null);
      onCommentAdded?.(comment);

      // Send notification to post author
      if (resolvedPostAuthorId !== currentUser.id) {
        await dataService.functions.invoke('sendNotificationOnComment', {
          post_id: resolvedPostId,
          commenter_id: currentUser.id,
          commenter_name: currentUser.full_name,
          comment_body: body,
          post_author_id: resolvedPostAuthorId,
        });
      }

      // Detect @mentions in comment body and notify each mentioned user
      const mentionMatches = body.match(/@(\w+)/g);
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
              post_id: resolvedPostId,
              context_text: body,
            }).catch(() => {});
          }
        }
      }

      toast.success('Reply sent');
    } catch (error) {
      toast.error('Failed to send reply');
    }
    setPosting(false);
  };

  const commentTree = useMemo(() => {
    const byId = new Map();
    const roots = [];
    comments.forEach((comment) => byId.set(comment.id, { ...comment, replies: [] }));
    byId.forEach((comment) => {
      const parentId = comment.parent_comment_id || comment.reply_to_comment_id;
      const parent = parentId ? byId.get(parentId) : null;
      if (parent) parent.replies.push(comment);
      else roots.push(comment);
    });
    return roots;
  }, [comments]);

  const renderComment = (comment, depth = 0) => {
    const repliedToId = comment.reply_to_comment_id || comment.parent_comment_id;
    const repliedTo = repliedToId ? comments.find(c => c.id === repliedToId) : null;
    const isMine = currentUser?.id && comment.author_id === currentUser.id;
    const maxDepth = Math.min(depth, 2);
    return (
      <div key={comment.id} className={depth > 0 ? 'ml-5 border-l border-slate-200 pl-3' : ''}>
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[84%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
            <div className={`rounded-2xl px-3 py-2.5 shadow-sm ${
              isMine
                ? 'rounded-br-md bg-blue-600 text-white'
                : 'rounded-bl-md bg-white text-slate-800'
            }`}>
              {repliedTo && depth === 0 && (
                <div className={`mb-2 rounded-xl border-l-2 px-2 py-1 text-[11px] ${
                  isMine ? 'border-white/40 bg-white/10 text-blue-50' : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}>
                  Replying to {repliedTo.author_name}: {repliedTo.body?.slice(0, 70)}
                </div>
              )}
              <div className="mb-1.5 flex items-center gap-2">
                {!isMine && (
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
                )}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => {
                      if (comment.author_id) navigate(`/PublicProfile?id=${comment.author_id}`);
                    }}
                    className={`text-left text-[12px] font-bold transition-colors ${isMine ? 'text-blue-50' : 'text-slate-900 hover:text-blue-600'}`}
                  >
                    {isMine ? 'You' : comment.author_name}
                  </button>
                </div>
                <p className={`flex-shrink-0 text-[10px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                  {formatDistanceToNow(parseISO(comment.created_date), { addSuffix: true })}
                </p>
              </div>
              <p className={`whitespace-pre-wrap text-[13px] leading-relaxed ${isMine ? 'text-white' : 'text-slate-700'}`}>{comment.body}</p>
            </div>
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
        {comment.replies?.length > 0 && (
          <div className={`mt-3 space-y-3 ${maxDepth >= 2 ? 'ml-0' : ''}`}>
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!sheetOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-white motion-soft-in md:inset-auto md:right-0 md:top-0 md:h-screen md:w-96 md:shadow-lg">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-[16px] text-slate-900">Replies</h2>
            <p className="text-[11px] font-semibold text-slate-400">Mini chat for this post</p>
          </div>
        </div>
        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Comments List */}
      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/70 p-4">
        {loading ? (
          <div className="motion-stagger space-y-3 py-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={`flex ${item % 2 ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[78%] rounded-2xl bg-white p-3 shadow-sm">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton mt-2 h-3 w-44 rounded" />
                  <div className="skeleton mt-2 h-3 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-[14px] font-semibold text-slate-600">Couldn't load replies</p>
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
          <div className="flex min-h-[55vh] flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-[14px] font-semibold text-slate-700">Start the thread</p>
            <p className="mt-1 max-w-[220px] text-[12px] leading-5 text-slate-400">Ask a follow-up, answer the post, or keep the conversation going.</p>
          </div>
        ) : (
          <div className="motion-stagger space-y-3">
            {commentTree.map((comment) => renderComment(comment))}
          </div>
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
      <div className="flex-shrink-0 border-t border-slate-100 bg-white p-3">
        <div className="flex gap-2">
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
          className="flex-1 bg-slate-100 border-0 rounded-2xl px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
        />
        <button
          onClick={handlePostComment}
          disabled={posting || !newComment.trim()}
          className="motion-press w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
        </div>
      </div>
    </div>
  );
}
