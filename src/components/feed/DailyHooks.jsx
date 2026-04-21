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
    label: 'Question of the Day',
    question: DAILY_QUESTIONS[day % DAILY_QUESTIONS.length],
    cta: 'Reply',
    postType: 'feed',
    subtype: 'question',
  },
  {
    key: 'tonight',
    label: 'Tonight in Five Towns',
    question: TONIGHT_PROMPTS[(day + 1) % TONIGHT_PROMPTS.length],
    cta: 'Reply',
    postType: 'feed',
    subtype: 'discussion',
  },
  (dayOfWeek === 4 || dayOfWeek === 5) && {
    key: 'shabbos',
    label: 'Shabbos Plans',
    question: SHABBOS_PROMPTS[day % SHABBOS_PROMPTS.length],
    cta: 'Reply',
    postType: 'feed',
    subtype: 'discussion',
  },
  {
    key: 'help',
    label: 'Community Help',
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
    <div className="border-b border-slate-100 px-0 pb-0 mb-0">
      {/* Looks like a real post row */}
      <div className="flex items-start gap-2.5 px-4 py-2.5">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
          ✨
        </div>
        <div className="flex-1 min-w-0">
          {/* Author + dismiss */}
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-semibold text-slate-600">{hook.label}</span>
              {visible.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); setIndex(i => (i + 1) % visible.length); }}
                  className="text-[12px] text-slate-300 hover:text-slate-500 px-0.5"
                >
                  ›
                </button>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); setDismissed(prev => ({ ...prev, [hook.key]: true })); }}
              className="text-slate-200 hover:text-slate-400 text-[15px] font-bold leading-none"
            >
              ×
            </button>
          </div>
          {/* Question body — looks like post text */}
          <p
            className="text-[13.5px] text-slate-800 leading-snug mb-1.5 cursor-pointer"
            onClick={() => onPostClick(hook.postType, hook.subtype, hook.question)}
          >
            {hook.question}
          </p>
          {/* Reply row — mimics comment input */}
          <button
            onClick={() => onPostClick(hook.postType, hook.subtype, hook.question)}
            className="flex items-center gap-1.5 text-[11.5px] text-slate-400 hover:text-blue-500 transition-colors"
          >
            <span>💬</span>
            <span>Share your answer…</span>
          </button>
        </div>
      </div>
    </div>
  );
}