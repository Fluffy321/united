import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services';
import { HandHeart, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_EMOJI = {
  'Errand': '🛒',
  'Lost & Found': '🔍',
  'Quick Favor': '🙏',
  'Tutoring': '📚',
  'Shabbat Help': '✨',
  'Other': '💬'
};

const STATUS_CONFIG = {
  open:        { label: 'Open',        color: 'bg-green-50 text-green-700 border-green-100',   icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-100',      icon: Clock },
  completed:   { label: 'Completed',   color: 'bg-slate-100 text-slate-500 border-slate-200',  icon: CheckCircle },
};

export default function ShulHelpFeed({ shulId, shulName, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Quick Favor', is_anonymous: false });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['shul-help', shulId],
    queryFn: () => dataService.entities.MitzvahRequest.filter({ shul_id: shulId }, '-created_date', 50),
    enabled: !!shulId,
    staleTime: 30000
  });

  const createMutation = useMutation({
    mutationFn: (data) => dataService.entities.MitzvahRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shul-help', shulId] });
      setShowForm(false);
      setForm({ title: '', description: '', category: 'Quick Favor', is_anonymous: false });
      toast.success('Help request posted!');
    }
  });

  const claimMutation = useMutation({
    mutationFn: ({ id }) => dataService.entities.MitzvahRequest.update(id, {
      status: 'in_progress',
      claimed_by_user_id: currentUser.id,
      claimed_by_name: currentUser.display_name || currentUser.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shul-help', shulId] });
      toast.success('You offered to help! 🙏');
    }
  });

  const completeMutation = useMutation({
    mutationFn: ({ id }) => dataService.entities.MitzvahRequest.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shul-help', shulId] });
      toast.success('Marked as completed! ✅');
    }
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error('Title required');
    createMutation.mutate({
      ...form,
      shul_id: shulId,
      created_by_user_id: currentUser.id,
      created_by_name: form.is_anonymous ? 'Anonymous' : (currentUser.display_name || currentUser.full_name),
      status: 'open'
    });
  };

  const openRequests = requests.filter(r => r.status === 'open');
  const otherRequests = requests.filter(r => r.status !== 'open');

  return (
    <div className="space-y-4">
      {/* Post Help Request */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full border-2 border-dashed border-amber-200 rounded-2xl p-4 text-center text-amber-700 hover:border-amber-400 hover:bg-amber-50 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
      >
        <HandHeart className="w-4 h-4" />
        Post a Help Request
      </button>

      {showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <input
            className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="What do you need? (e.g. Ride to doctor)"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="Add details..."
            rows={2}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
            {['Quick Favor','Errand','Tutoring','Shabbat Help','Lost & Found','Other'].map(cat => (
              <button
                key={cat}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                  form.category === cat
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-amber-700 border-amber-200'
                }`}
              >
                {CATEGORY_EMOJI[cat]} {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              id="anon"
              checked={form.is_anonymous}
              onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="anon">Post anonymously</label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              {createMutation.isPending ? 'Posting...' : 'Post Request'}
            </button>
          </div>
        </div>
      )}

      {/* Open Requests */}
      {openRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#98A2B3] uppercase tracking-widest mb-2">Needs Help Now</p>
          <div className="space-y-3">
            {openRequests.map(req => (
              <HelpCard
                key={req.id}
                req={req}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onClaim={() => claimMutation.mutate({ id: req.id })}
                onComplete={() => completeMutation.mutate({ id: req.id })}
              />
            ))}
          </div>
        </div>
      )}

      {otherRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#98A2B3] uppercase tracking-widest mb-2">Recent</p>
          <div className="space-y-2">
            {otherRequests.slice(0, 10).map(req => (
              <HelpCard
                key={req.id}
                req={req}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onClaim={() => claimMutation.mutate({ id: req.id })}
                onComplete={() => completeMutation.mutate({ id: req.id })}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && requests.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <HandHeart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="font-medium">No help requests yet</p>
          <p className="text-sm text-slate-400">Post a request to get the community involved</p>
        </div>
      )}
    </div>
  );
}

function HelpCard({ req, currentUser, isAdmin, onClaim, onComplete }) {
  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.open;
  const StatusIcon = status.icon;
  const isOwner = req.created_by_user_id === currentUser?.id;
  const isClaimer = req.claimed_by_user_id === currentUser?.id;
  const timeAgo = formatDistanceToNow(new Date(req.created_date), { addSuffix: true });

  return (
    <div className={`bg-white rounded-2xl border border-[#EAECF0] p-4 ${req.status === 'completed' ? 'opacity-60' : ''}`}
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{CATEGORY_EMOJI[req.category] || '🙏'}</span>
          <p className="font-semibold text-[14px] text-[#0F1C2E]">{req.title}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {req.description && (
        <p className="text-[13px] text-slate-500 mb-2 leading-relaxed">{req.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>{req.is_anonymous ? 'Anonymous' : req.created_by_name}</span>
          <span>·</span>
          <span>{timeAgo}</span>
          {req.claimed_by_name && req.status === 'in_progress' && (
            <>
              <span>·</span>
              <span className="text-blue-600 font-semibold">Helping: {req.claimed_by_name}</span>
            </>
          )}
        </div>

        {req.status === 'open' && !isOwner && (
          <button
            onClick={onClaim}
            className="text-[12px] font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            I'll Help 🙋
          </button>
        )}
        {req.status === 'in_progress' && (isOwner || isClaimer || isAdmin) && (
          <button
            onClick={onComplete}
            className="text-[12px] font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 hover:bg-green-100 transition-colors"
          >
            Mark Done ✅
          </button>
        )}
      </div>
    </div>
  );
}