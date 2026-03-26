import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function PromptResponsesSheet({ post, currentUser, open, onOpenChange, onResponseAdded }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && post) loadResponses();
  }, [open, post?.id]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date', 50);
      setResponses(data);
    } catch (e) {}
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!reply.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      await base44.entities.Comment.create({
        post_id: post.id,
        author_id: currentUser.id,
        author_name: currentUser.display_name || currentUser.full_name,
        author_avatar_url: currentUser.avatar_url,
        body: reply.trim(),
      });
      await base44.entities.UnifiedPost.update(post.id, {
        comments_count: (post.comments_count || 0) + 1,
      });
      setReply('');
      await loadResponses();
      onResponseAdded?.();
      toast.success('Response added!');
    } catch (e) {
      toast.error('Failed to post response');
    }
    setSubmitting(false);
  };

  const handleMessage = async (authorId) => {
    if (!currentUser || authorId === currentUser.id) return;
    try {
      const convs = await base44.entities.Conversation.list('-updated_date', 50);
      const existing = convs.find(c =>
        c.participant_ids?.includes(currentUser.id) && c.participant_ids?.includes(authorId)
      );
      if (existing) { navigate(createPageUrl('Messages') + `?conversation=${existing.id}`); return; }
      const [other] = await base44.entities.User.filter({ id: authorId });
      const conv = await base44.entities.Conversation.create({
        participant_ids: [currentUser.id, authorId],
        participant_names: [currentUser.display_name || currentUser.full_name, other?.display_name || other?.full_name],
        participant_ages: [currentUser.age_range || '18+', other?.age_range || '18+'],
        unread_count: {},
      });
      navigate(createPageUrl('Messages') + `?conversation=${conv.id}`);
    } catch (e) { toast.error('Could not open message'); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => onOpenChange(false)}>
      <div className="mt-auto bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wide mb-0.5">Community Prompt</div>
            <p className="text-[15px] font-bold text-slate-900 leading-snug">{post?.body}</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-full hover:bg-slate-100 flex-shrink-0">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Responses list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : responses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-[13px]">No responses yet. Be the first!</div>
          ) : responses.map(r => (
            <div key={r.id} className="flex items-start gap-3 bg-slate-50 rounded-2xl px-3 py-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-purple-600">
                {r.author_avatar_url
                  ? <img src={r.author_avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : (r.author_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-slate-800">{r.author_name || 'Anonymous'}</span>
                  <span className="text-[11px] text-slate-400">{formatDistanceToNow(new Date(r.created_date), { addSuffix: true })}</span>
                </div>
                <p className="text-[13px] text-slate-700 mt-0.5 leading-snug">{r.body}</p>
              </div>
              {currentUser && r.author_id !== currentUser.id && (
                <button
                  onClick={() => handleMessage(r.author_id)}
                  className="flex-shrink-0 p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                  title="Message"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Reply input */}
        <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-end" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Share your answer..."
            rows={2}
            className="flex-1 resize-none rounded-2xl border border-slate-200 px-3 py-2 text-[14px] focus:outline-none focus:border-purple-400 bg-slate-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!reply.trim() || submitting}
            className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-purple-700 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}