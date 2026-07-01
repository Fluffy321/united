import React, { useState, useEffect } from 'react';
import { Plus, HandHeart, CheckCircle2, Loader2, X } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { createGroupPost, filterGroupPost, updateGroupPost } from '@/services/entityServices';

export default function GroupHelpTab({ group, currentUser, isMember }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);

  useEffect(() => {
    load();
  }, [group.id]);

  const load = async () => {
    setLoading(true);
    const all = await filterGroupPost({ group_id: group.id, post_type: 'help' }, '-created_date', 50);
    setRequests(all);
    setLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    const post = await createGroupPost({
      group_id: group.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      body: body.trim(),
      post_type: 'help',
      help_status: 'open',
    });
    setRequests(prev => [post, ...prev]);
    setBody('');
    setShowForm(false);
    setPosting(false);
    toast.success('Help request posted!');
  };

  const handleFulfill = async (req) => {
    setFulfilling(req.id);
    await updateGroupPost(req.id, { help_status: 'fulfilled' });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, help_status: 'fulfilled' } : r));
    setFulfilling(null);
    toast.success('Marked as fulfilled!');
  };

  const open = requests.filter(r => r.help_status !== 'fulfilled');
  const fulfilled = requests.filter(r => r.help_status === 'fulfilled');

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
    </div>
  );

  return (
    <div className="p-4 space-y-3">
      {/* Post form toggle */}
      {isMember && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#2563EB] text-[#2563EB] text-[13px] font-semibold bg-blue-50/50 active:scale-[0.99] transition-transform"
        >
          <Plus className="w-4 h-4" />
          Post a Help Request
        </button>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[14px] text-slate-900">New Help Request</p>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
          <form onSubmit={handlePost} className="space-y-3">
            <textarea
              autoFocus
              required
              rows={3}
              placeholder="Describe what you need help with…"
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400 resize-none"
            />
            <button
              type="submit"
              disabled={posting || !body.trim()}
              className="w-full py-3 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] transition-all"
              style={{ background: '#16A34A' }}
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandHeart className="w-4 h-4" />}
              {posting ? 'Posting…' : 'Post Request'}
            </button>
          </form>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-[14px] font-semibold text-slate-700">No help requests yet</p>
          <p className="text-[12px] text-slate-400 mt-1">{isMember ? 'Post a request and the community will respond' : 'Join to post help requests'}</p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <section>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Open ({open.length})</p>
              <div className="space-y-2.5">
                {open.map(req => (
                  <HelpCard
                    key={req.id}
                    req={req}
                    currentUser={currentUser}
                    onFulfill={handleFulfill}
                    fulfilling={fulfilling === req.id}
                  />
                ))}
              </div>
            </section>
          )}

          {fulfilled.length > 0 && (
            <section className="mt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Fulfilled ({fulfilled.length})</p>
              <div className="space-y-2.5 opacity-60">
                {fulfilled.map(req => (
                  <HelpCard key={req.id} req={req} currentUser={currentUser} fulfilled />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function HelpCard({ req, currentUser, onFulfill, fulfilling, fulfilled }) {
  return (
    <div
      className="bg-white rounded-2xl border p-4"
      style={{
        borderColor: fulfilled ? '#E2E8F0' : '#BBF7D0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${fulfilled ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
          {req.user_name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-semibold text-slate-900">{req.user_name}</span>
            <span className="text-[11px] text-slate-400">
              {formatDistanceToNow(parseISO(req.created_date), { addSuffix: true })}
            </span>
            {fulfilled && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 ml-auto">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
              </span>
            )}
          </div>
          <p className="text-[14px] text-slate-700 leading-relaxed">{req.body}</p>
        </div>
      </div>

      {!fulfilled && (
        <div className="flex gap-2 mt-3">
          {req.user_id !== currentUser?.id && (
            <button
              onClick={() => onFulfill(req)}
              disabled={fulfilling}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#16A34A' }}
            >
              {fulfilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HandHeart className="w-3.5 h-3.5" />}
              I Can Help
            </button>
          )}
          {req.user_id === currentUser?.id && (
            <button
              onClick={() => onFulfill(req)}
              disabled={fulfilling}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 bg-slate-100 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Fulfilled
            </button>
          )}
        </div>
      )}
    </div>
  );
}