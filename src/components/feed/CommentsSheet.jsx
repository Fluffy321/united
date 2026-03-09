import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function CommentsSheet({ postId, postAuthorId, isOpen, onClose, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    const allComments = await base44.entities.Comment.filter({ post_id: postId }, '-created_date');
    setComments(allComments);
    setLoading(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    setPosting(true);
    try {
      const comment = await base44.entities.Comment.create({
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
        await base44.functions.invoke('sendNotificationOnComment', {
          post_id: postId,
          commenter_id: currentUser.id,
          commenter_name: currentUser.full_name,
          comment_body: newComment.trim(),
          post_author_id: postAuthorId,
        });
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
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-[14px] font-semibold text-slate-600">No comments yet</p>
            <p className="text-[12px] text-slate-400 mt-1">Be the first to start a discussion!</p>
          </div>
        ) : (
          comments.map(comment => {
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
                    {comment.author_avatar_url ? (
                      <img src={comment.author_avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600">
                        {comment.author_name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900">{comment.author_name}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 flex-shrink-0">
                      {formatDistanceToNow(parseISO(comment.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{comment.body}</p>
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="mt-2 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Reply
                  </button>
                </div>
              </div>
            );
          })
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
          onKeyPress={(e) => {
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