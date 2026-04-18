import React, { useState } from 'react';

const DAILY_QUESTIONS = [
  "What is one thing you're grateful for today?",
  "If you could improve one thing about this community, what would it be?",
  "What's your go-to Shabbos dish?",
  "What's the best thing about living in the Five Towns?",
  "Hidden gem in the neighborhood everyone should know about?",
  "What act of kindness made your week?",
  "Who in the community deserves a shoutout?",
  "What are you looking forward to this week?",
  "Favorite local restaurant — go!",
  "Best advice you ever received?",
  "What made you smile today?",
];

const SHABBOS_PROMPTS = [
  "What are your Shabbos plans this week?",
  "Anyone hosting or looking for a Shabbos meal?",
  "What parsha topic are you thinking about this Shabbos?",
];

const TONIGHT_PROMPTS = [
  "What's happening in the neighborhood tonight?",
  "Any local events or shiurim tonight?",
  "Anyone organizing anything tonight?",
];

const HELP_PROMPTS = [
  "Could you use a hand with something today?",
  "Need a favor from a neighbor?",
  "Struggling with something? The community is here.",
];

function getDayOfYear() {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}

const day = getDayOfYear();
const dayOfWeek = new Date().getDay();

const ALL_HOOKS = [
  {
    key: 'qotd',
    emoji: '✨',
    source: 'Question of the Day',
    question: DAILY_QUESTIONS[day % DAILY_QUESTIONS.length],
    cta: 'Answer',
    postType: 'feed',
    subtype: 'question',
  },
  {
    key: 'tonight',
    emoji: '🌙',
    source: 'Tonight in Five Towns',
    question: TONIGHT_PROMPTS[(day + 1) % TONIGHT_PROMPTS.length],
    cta: 'Share',
    postType: 'feed',
    subtype: 'discussion',
  },
  (dayOfWeek === 4 || dayOfWeek === 5) && {
    key: 'shabbos',
    emoji: '🕍',
    source: 'Shabbos Plans',
    question: SHABBOS_PROMPTS[day % SHABBOS_PROMPTS.length],
    cta: 'Share',
    postType: 'feed',
    subtype: 'discussion',
  },
  {
    key: 'help',
    emoji: '🤝',
    source: 'Community Help',
    question: HELP_PROMPTS[(day + 2) % HELP_PROMPTS.length],
    cta: 'Post',
    postType: 'help',
    subtype: null,
  },
].filter(Boolean);

export default function DailyHooks({ onPostClick }) {
  const [dismissed, setDismissed] = useState({});
  const [index, setIndex] = useState(0);

  const visible = ALL_HOOKS.filter(h => !dismissed[h.key]);
  if (visible.length === 0) return null;

  const hook = visible[index % visible.length];

  return (
    <div className="mb-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[13px] flex-shrink-0">
            {hook.emoji}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-900">{hook.source}</p>
            <p className="text-[10px] text-slate-400">Pinned · Five Towns</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {visible.length > 1 && (
            <button
              onClick={() => setIndex(i => (i + 1) % visible.length)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 text-[15px] transition-colors"
              aria-label="Next"
            >
              ›
            </button>
          )}
          <button
            onClick={() => setDismissed(prev => ({ ...prev, [hook.key]: true }))}
            className="w-6 h-6 flex items-center justify-center rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 text-[13px] font-bold transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>

      <div className="px-3 pt-2 pb-2.5">
        <p className="text-[14px] font-semibold text-slate-800 leading-snug">{hook.question}</p>
      </div>

      <div className="px-3 pb-2.5 border-t border-slate-100 pt-2">
        <button
          onClick={() => onPostClick(hook.postType, hook.subtype, hook.question)}
          className="w-full h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors active:scale-95"
        >
          {hook.cta}
        </button>
      </div>
    </div>
  );
}