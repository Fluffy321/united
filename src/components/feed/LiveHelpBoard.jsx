import React, { useState } from 'react';
import { Hand, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, isToday, isThisWeek, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_EMOJI = {
  'Errand': '🚗',
  'Lost & Found': '🔍',
  'Quick Favor': '🤝',
  'Tutoring': '📚',
  'Shabbat Help': '✨',
  'Other': '💡'
};

function getUrgency(request) {
  if (!request.needed_by) {
    // Fall back to created_date: if today → urgent, this week → soon, else ongoing
    const created = parseISO(request.created_date);
    if (isToday(created)) return 'urgent';
    if (isThisWeek(created)) return 'soon';
    return 'ongoing';
  }
  const needed = parseISO(request.needed_by);
  if (isToday(needed)) return 'urgent';
  if (isThisWeek(needed)) return 'soon';
  return 'ongoing';
}

const URGENCY_CONFIG = {
  urgent: {
    label: 'Urgent',
    dot: 'bg-[#0F1C2E]',
    badge: 'bg-[#F0F3F9] border-[#E8ECF4] text-[#0F1C2E]',
    ring: 'border-[#E8ECF4]',
    pulse: true,
  },
  soon: {
    label: 'This Week',
    dot: 'bg-[#6B7280]',
    badge: 'bg-[#F0F3F9] border-[#E8ECF4] text-[#374151]',
    ring: 'border-[#E8ECF4]',
    pulse: false,
  },
  ongoing: {
    label: 'Ongoing',
    dot: 'bg-[#9CA3AF]',
    badge: 'bg-[#F0F3F9] border-[#E8ECF4] text-[#6B7280]',
    ring: 'border-[#E8ECF4]',
    pulse: false,
  }
};

function UrgencyRow({ urgency, requests, onClaim }) {
  const [expanded, setExpanded] = useState(urgency === 'urgent');
  const cfg = URGENCY_CONFIG[urgency];
  if (requests.length === 0) return null;

  return (
    <div className={`rounded-xl border overflow-hidden ${cfg.ring} mb-2`}>
      {/* Section header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors"
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
        <span className={`status-pill ${urgency === 'urgent' ? 'active' : urgency === 'soon' ? 'active' : 'fulfilled'}`}>
          {cfg.label} — {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </span>
        <span className="ml-auto text-[#98A2B3]">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* Items */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-slate-100 bg-white">
              {requests.map(req => (
                <div key={req.id} className="flex items-center gap-3 px-3 py-2.5">
                 <span className="text-lg flex-shrink-0">{CATEGORY_EMOJI[req.category] || '💡'}</span>
                 <div className="flex-1 min-w-0">
                   <p className="font-semibold text-[13px] text-[#0F1C2E] truncate">{req.title}</p>
                   <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                     <p className="text-[11px] text-[#98A2B3]">
                       {req.is_anonymous ? 'Anonymous' : req.created_by_name} · {formatDistanceToNow(parseISO(req.created_date), { addSuffix: true })}
                       {req.distance != null && req.distance < 99 ? ` · ${req.distance < 0.2 ? 'Nearby' : `${req.distance.toFixed(1)} mi`}` : ''}
                     </p>
                     {req.views_count > 0 && (
                       <span className="text-[10px] text-[#98A2B3]">👁 {req.views_count}</span>
                     )}
                     {req.offers_count > 0 && (
                       <span className="text-[10px] font-bold text-emerald-600">✋ {req.offers_count} helping</span>
                     )}
                     {req.bump_count > 0 && (
                       <span className="text-[10px] text-orange-500 font-semibold">🔔 bumped</span>
                     )}
                   </div>
                 </div>
                  <button
                    onClick={() => onClaim(req)}
                    className="flex-shrink-0 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-all"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Hand className="w-3 h-3" />
                    Help
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LiveHelpBoard({ requests = [], onClaim }) {
  const urgent = requests.filter(r => getUrgency(r) === 'urgent');
  const soon = requests.filter(r => getUrgency(r) === 'soon');
  const ongoing = requests.filter(r => getUrgency(r) === 'ongoing');

  const totalOpen = requests.length;
  const urgentCount = urgent.length;

  if (totalOpen === 0) return null;

  return (
    <div className="mb-4">
      {/* Mission Control Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="font-bold text-[20px] text-[#0F1C2E]">Community Help Center</span>
          </div>
          {urgentCount > 0 && (
            <span className="text-[11px] font-bold bg-[#F0F3F9] text-[#0F1C2E] px-2 py-0.5 rounded-full border border-[#E8ECF4]">
              {urgentCount} urgent
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#98A2B3] font-medium">{totalOpen} open</span>
      </div>

      {/* Summary pill */}
      <div className="text-white rounded-[12px] px-3.5 py-2.5 flex items-center gap-2 mb-3" style={{ background: 'var(--accent)' }}>
        <span className="text-[18px]">🙋</span>
        <p className="text-[13px] font-semibold leading-snug">
          {urgentCount > 0
            ? `${urgentCount} ${urgentCount === 1 ? 'person needs' : 'people need'} help right now.`
            : `${totalOpen} people need help in your community.`}
          <span className="text-white/60 ml-1">Can you step up?</span>
        </p>
      </div>

      <UrgencyRow urgency="urgent" requests={urgent} onClaim={onClaim} />
      <UrgencyRow urgency="soon" requests={soon} onClaim={onClaim} />
      <UrgencyRow urgency="ongoing" requests={ongoing} onClaim={onClaim} />


    </div>
  );
}