import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, MessageCircle, AlertCircle, RefreshCw, Flag } from 'lucide-react';
import { dataService, notificationsService, postsService } from '@/services';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ReportModal from '@/components/common/ReportModal';

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
  const resolvedPostId    = postId    || post?.id;
  const resolvedAuthorId  = postAuthorId || post?.user_id;
  const sheetOpen = isOpen ?? open ?? false;

  const navigate   = useNavigate();
  const inputRef   = useRef(null);
  const listRef    = useRef(null);

  const [comments,    setComments]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadError,   setLoadError]   = useState(false);
  const [newComment,  setNewComment]  = useState('');
  const [posting,     setPosting]     = useState(false);
  const [replyingTo,  setReplyingTo]  = useState(null);
  const [reportTarget, setReportTarget] = useState(null);

  // Load comments whenever sheet opens
  useEffect(() => {
    if (sheetOpen && resolvedPostId) {
      setLoadError(false);
      loadComments();
    }
    if (!sheetOpen) {
      setComments([]);
      setNewComment('');
      setReplyingTo(null);
    }
  }, [sheetOpen, resolvedPostId]);

  // Focus composer when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 180);
      return () => clearTimeout(t);
    }
  }, [sheetOpen]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (!sheetOpen || !listRef.current || comments.length === 0) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [comments.length, sheetOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const handleClose = useCallback(() => {
    onClose?.();
    onOpenChange?.(false);
  }, [onClose, onOpenChange]);

  // Close on Escape
  useEffect(() => {
    if (!sheetOpen) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [sheetOpen, handleClose]);

  const loadComments = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const all      = await postsService.listComments(resolvedPostId, 'created_date', 100);
      const filtered = all.filter(c => !blockedIds.includes(c.author_id));
      setComments(filtered);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }

    setPosting(true);
    const body = newComment.trim();
    try {
      const comment = await postsService.createComment({
        post_id:              resolvedPostId,
        author_id:            currentUser.id,
        author_name:          currentUser.display_name || currentUser.full_name || 'Community member',
        author_avatar_url:    currentUser.avatar_url,
        body,
        parent_comment_id:    replyingTo,
        reply_to_comment_id:  replyingTo,
        client_context: {
          surface:         'feed_reply_sheet',
          source_post_id:  resolvedPostId,
        },
      });

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setReplyingTo(null);
      onCommentAdded?.(comment);

      // Notify post author
      if (resolvedAuthorId && resolvedAuthorId !== currentUser.id) {
        notificationsService.notifyPostCommented({
          posterId:        resolvedAuthorId,
          commenterId:     currentUser.id,
          commenterName:   currentUser.display_name || currentUser.full_name,
          commenterAvatarUrl: currentUser.avatar_url,
          postId:          resolvedPostId,
          preview:         body.slice(0, 90),
        }).catch(() => {});
      }

      // Notify parent comment author
      if (replyingTo) {
        const parent = comments.find(c => c.id === replyingTo);
        if (parent?.author_id && parent.author_id !== currentUser.id && parent.author_id !== resolvedAuthorId) {
          notificationsService.notifyCommentReply({
            recipientId:   parent.author_id,
            actorId:       currentUser.id,
            actorName:     currentUser.display_name || currentUser.full_name,
            actorAvatarUrl: currentUser.avatar_url,
            postId:        resolvedPostId,
            commentId:     comment.id,
            preview:       body.slice(0, 90),
          }).catch(() => {});
        }
      }

      // Notify @mentions
      const mentionMatches = body.match(/@(\w+)/g);
      if (mentionMatches) {
        const threadAuthors = comments.filter(c => c.author_id && c.author_id !== currentUser.id);
        for (const match of mentionMatches) {
          const mentionName = match.slice(1).toLowerCase();
          const mentioned   = threadAuthors.find(c =>
            (c.author_name || '').toLowerCase().replace(/\s+/g, '').startsWith(mentionName)
          );
          if (mentioned?.author_id) {
            notificationsService.notifyUserMentioned({
              userId:       mentioned.author_id,
              actorId:      currentUser.id,
              actorName:    currentUser.display_name || currentUser.full_name,
              actorAvatarUrl: currentUser.avatar_url,
              postId:       resolvedPostId,
              preview:      body.slice(0, 90),
            }).catch(() => {});
          }
        }
      }

      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    }
    setPosting(false);
  };

  // Build comment tree (two-level: root + nested replies)
  const commentTree = useMemo(() => {
    const byId = new Map();
    const roots = [];
    comments.forEach(c => byId.set(c.id, { ...c, replies: [] }));
    byId.forEach(c => {
      const parentId = c.parent_comment_id || c.reply_to_comment_id;
      const parent   = parentId ? byId.get(parentId) : null;
      if (parent) parent.replies.push(c);
      else roots.push(c);
    });
    return roots;
  }, [comments]);

  const renderComment = (comment, depth = 0) => {
    const repliedToId = comment.reply_to_comment_id || comment.parent_comment_id;
    const repliedTo   = repliedToId ? comments.find(c => c.id === repliedToId) : null;
    const isMine      = Boolean(currentUser?.id && comment.author_id === currentUser.id);
    const ts          = comment.created_at || comment.created_date;

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-5 border-l-2 border-slate-100 pl-3' : ''}>
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[84%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
            {/* Bubble */}
            <div className={`rounded-2xl px-3 py-2.5 ${
              isMine
                ? 'rounded-br-sm bg-blue-600 text-white'
                : 'rounded-bl-sm bg-white text-slate-800 shadow-sm border border-slate-100'
            }`}>
              {/* Reply-to context (only for flat replies at depth 0 that target a specific comment) */}
              {repliedTo && depth === 0 && (
                <div className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-[11px] leading-tight ${
                  isMine
                    ? 'border-white/40 bg-white/10 text-blue-100'
                    : 'border-blue-300 bg-blue-50 text-blue-700'
                }`}>
                  <span className="font-bold">{repliedTo.author_name}</span>: {repliedTo.body?.slice(0, 60)}{repliedTo.body?.length > 60 ? '…' : ''}
                </div>
              )}

              {/* Avatar + name row */}
              <div className="flex items-center gap-1.5 mb-1">
                {!isMine && (
                  <button
                    onClick={() => comment.author_id && navigate(`/PublicProfile?id=${comment.author_id}`)}
                    className="flex-shrink-0"
                  >
                    {comment.author_avatar_url ? (
                      <img src={comment.author_avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                        {comment.author_name?.[0] || '?'}
                      </div>
                    )}
                  </button>
                )}
                <button
                  onClick={() => comment.author_id && navigate(`/PublicProfile?id=${comment.author_id}`)}
                  className={`text-[12px] font-black leading-none ${isMine ? 'text-blue-100' : 'text-slate-700 hover:text-blue-600'}`}
                >
                  {isMine ? 'You' : comment.author_name}
                </button>
                {ts && (
                  <span className={`text-[10px] leading-none ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                    {formatDistanceToNow(parseISO(ts), { addSuffix: true })}
                  </span>
                )}
              </div>

              {/* Body */}
              <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isMine ? 'text-white' : 'text-slate-700'}`}>
                {comment.body}
              </p>
            </div>

            {/* Reply / Report actions */}
            <div className="mt-1.5 flex items-center gap-3">
              <button
                onClick={() => { setReplyingTo(comment.id); inputRef.current?.focus(); }}
                className={`text-[11px] font-semibold ${isMine ? 'text-slate-400 hover:text-slate-600' : 'text-blue-500 hover:text-blue-700'}`}
              >
                Reply
              </button>
              {!isMine && (
                <button
                  onClick={() => setReportTarget({
                    id: comment.id,
                    type: 'comment',
                    targetUserId: comment.author_id,
                    targetUserName: comment.author_name,
                    preview: comment.body,
                  })}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600"
                >
                  <Flag className="h-3 w-3" />
                  Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!sheetOpen || typeof document === 'undefined') return null;

  // Compact post preview for the header
  const postPreview = post?.title || post?.body?.slice(0, 90) || null;

  // User initials avatar
  const userInitial = currentUser?.display_name?.[0] || currentUser?.full_name?.[0] || '?';

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-end sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Replies"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Sheet / Modal panel */}
      <div className="relative w-full sm:max-w-lg flex flex-col bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl motion-soft-in"
        style={{ maxHeight: 'min(92svh, 700px)' }}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-2 pb-3 sm:pt-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 flex-shrink-0">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-black text-slate-900 leading-tight">Replies</h2>
              {postPreview && (
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight line-clamp-1">
                  {postPreview}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 bg-slate-50/60 p-4">
          {loading ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map(i => (
                <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[72%] rounded-2xl bg-white shadow-sm border border-slate-100 p-3 space-y-2">
                    <div className="h-2.5 w-20 rounded-full bg-slate-100 animate-pulse" />
                    <div className="h-2.5 w-40 rounded-full bg-slate-100 animate-pulse" />
                    <div className="h-2.5 w-28 rounded-full bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
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
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-14 w-14 rounded-3xl bg-blue-50 flex items-center justify-center mb-4">
                <MessageCircle className="h-7 w-7 text-blue-400" />
              </div>
              <p className="text-[15px] font-black text-slate-700">No replies yet</p>
              <p className="text-[13px] text-slate-400 mt-1.5">Start the conversation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commentTree.map(c => renderComment(c))}
            </div>
          )}
        </div>

        {/* Reply-to strip */}
        {replyingTo && (
          <div className="flex-shrink-0 bg-blue-50 border-t border-blue-100 px-4 py-2 flex items-center justify-between">
            <p className="text-[12px] text-blue-700 leading-tight">
              Replying to{' '}
              <span className="font-black">
                {comments.find(c => c.id === replyingTo)?.author_name || 'comment'}
              </span>
            </p>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-[12px] font-semibold text-blue-500 hover:text-blue-700 ml-3 flex-shrink-0"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Composer */}
        <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-2">
          {/* Current user avatar */}
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[13px] font-black text-blue-600 flex-shrink-0">
              {userInitial}
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                handlePostComment();
              }
            }}
            placeholder={replyingTo ? 'Write a reply…' : 'Add a reply…'}
            className="flex-1 bg-slate-100 rounded-2xl px-3 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 leading-none"
          />

          <button
            onClick={handlePostComment}
            disabled={posting || !newComment.trim()}
            className="w-9 h-9 bg-blue-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors flex-shrink-0"
            aria-label="Send reply"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <ReportModal
        open={Boolean(reportTarget)}
        onOpenChange={(open) => { if (!open) setReportTarget(null); }}
        contentId={reportTarget?.id}
        contentType={reportTarget?.type}
        targetUserId={reportTarget?.targetUserId}
        targetUserName={reportTarget?.targetUserName}
        contentPreview={reportTarget?.preview}
        currentUser={currentUser}
      />
    </div>,
    document.body
  );
}
