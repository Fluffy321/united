// DEFERRED: no backing table — do not use in beta
import React, { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { MessageSquare, Heart, ChevronDown, ChevronUp, Send, Plus, X } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';

const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];

function Avatar({ name = '?', size = 9 }) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const px = size === 9 ? 36 : 28;
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ background: color, width: px, height: px, fontSize: size === 9 ? 13 : 11 }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function DiscussionThread({ discussion, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadedComments, setLoadedComments] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(discussion.likes_count || 0);

  const toggle = async () => {
    if (!expanded && !loadedComments) {
      const result = await dataService.entities.DiscussionComment.filter({ discussion_id: discussion.id }, 'created_date', 20);
      setComments(result);
      setLoadedComments(true);
    }
    setExpanded(e => !e);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    const c = await dataService.entities.DiscussionComment.create({
      discussion_id: discussion.id,
      user_id: currentUser?.id || 'guest',
      user_name: currentUser?.display_name || currentUser?.full_name || 'You',
      body: replyText.trim(),
    });
    setComments(prev => [...prev, c]);
    setReplyText('');
    toast.success('Reply posted!');
  };

  const name = discussion.user_name || 'Member';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[13px] font-semibold text-slate-900">{name}</p>
              <p className="text-[11px] text-slate-400">
                {discussion.created_date ? formatDistanceToNow(parseISO(discussion.created_date), { addSuffix: true }) : ''}
              </p>
            </div>
            {discussion.title && (
              <p className="text-[15px] font-bold text-slate-900 mb-1 leading-snug">{discussion.title}</p>
            )}
            <p className="text-[13px] text-slate-600 leading-relaxed">{discussion.body}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
          <button
            onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1); }}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-500' : ''}`} />
            {likes > 0 && likes}
          </button>
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-blue-500 transition-colors font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {discussion.comments_count > 0 ? `${discussion.comments_count} replies` : 'Reply'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Replies */}
      {expanded && (
        <div className="border-t border-slate-50 bg-slate-50/50 px-4 py-3 space-y-3">
          {comments.length === 0 && loadedComments ? (
            <p className="text-[11px] text-slate-400 text-center py-1">No replies yet</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <Avatar name={c.user_name || '?'} size={7} />
                <div className="bg-white rounded-xl px-3 py-2 flex-1 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-700">{c.user_name || 'Member'}</p>
                  <p className="text-[12px] text-slate-600 mt-0.5">{c.body}</p>
                </div>
              </div>
            ))
          )}
          <div className="flex gap-2 mt-2">
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitReply()}
              placeholder="Write a reply…"
              className="flex-1 text-[12px] bg-white rounded-full px-4 py-2 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button onClick={submitReply} className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white active:scale-90 transition-transform flex-shrink-0">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewDiscussionComposer({ community, currentUser, onNewDiscussion }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    const d = await dataService.entities.GroupDiscussion.create({
      group_id: community.id,
      user_id: currentUser?.id || 'guest',
      user_name: currentUser?.display_name || currentUser?.full_name || 'Anonymous',
      title: title.trim(),
      body: body.trim(),
      likes_count: 0,
      comments_count: 0,
    });
    onNewDiscussion(d);
    setTitle('');
    setBody('');
    setOpen(false);
    setSubmitting(false);
    toast.success('Discussion started!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-1">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 text-[13px] text-slate-400 bg-slate-50 rounded-full px-4 py-3 border border-slate-200 hover:border-blue-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Start a discussion…
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-800">New Discussion</p>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Discussion title / question…"
            className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-300"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your thoughts or question in detail…"
            rows={3}
            className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-blue-300"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-[12px] font-semibold text-slate-500 rounded-full border border-slate-200">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !title.trim() || !body.trim()}
              className="px-5 py-2 text-[12px] font-bold text-white bg-blue-600 rounded-full disabled:opacity-50 active:scale-95 transition-all"
            >
              {submitting ? 'Posting…' : 'Start Discussion'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityDiscussionsTab({ discussions, community, currentUser, onNewDiscussion }) {
  return (
    <div className="space-y-3 pb-4">
      <NewDiscussionComposer community={community} currentUser={currentUser} onNewDiscussion={onNewDiscussion} />
      {discussions.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-[15px] font-bold text-slate-900">No discussions yet</p>
          <p className="text-[13px] text-slate-500 mt-1">Start a conversation with the community!</p>
        </div>
      ) : (
        discussions.map(d => (
          <DiscussionThread key={d.id} discussion={d} currentUser={currentUser} />
        ))
      )}
    </div>
  );
}
