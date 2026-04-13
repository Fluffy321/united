import React, { useState } from 'react';
import { HandHeart, Moon, Sparkles } from 'lucide-react';

const HELP_PROMPTS = [
  "Could you use a hand with something today?",
  "Need a favor from a neighbor?",
  "Struggling with something? The community is here.",
  "Looking for advice or support?",
  "Need a ride, a meal, or just someone to talk to?",
];

const DAILY_QUESTIONS = [
  "What is one thing you are grateful for today?",
  "If you could improve one thing about this community, what would it be?",
  "What is your go-to Shabbos dish?",
  "What is the best thing about living in the Five Towns?",
  "What is a hidden gem in the neighborhood everyone should know about?",
  "What act of kindness made your week?",
  "Who in the community deserves a shoutout?",
  "What are you looking forward to this week?",
  "Favorite local restaurant — go!",
  "What is one thing you wish more people knew about you?",
  "Best advice you ever received?",
  "What made you smile today?",
  "How do you unwind after a long week?",
  "What is your favorite thing to do on Sunday mornings?",
];

const SHABBOS_PROMPTS = [
  "What are your Shabbos plans this week?",
  "Anyone hosting or looking for a Shabbos meal?",
  "What parsha topic are you thinking about this Shabbos?",
  "Who is walking to shul together? Share your route!",
];

const TONIGHT_PROMPTS = [
  "What is happening in the neighborhood tonight?",
  "Any local events or shiurim tonight?",
  "Looking for something to do tonight?",
  "Anyone organizing anything tonight?",
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function rotateByDay(arr) {
  return arr[getDayOfYear() % arr.length];
}

function rotateByDayOffset(arr, offset) {
  return arr[(getDayOfYear() + offset) % arr.length];
}

const dayOfWeek = new Date().getDay();
const isThursdayOrFriday = dayOfWeek === 4 || dayOfWeek === 5;

export default function DailyHooks({ onPostClick }) {
  const [dismissed, setDismissed] = useState({});

  const dismiss = (key, e) => {
    e.stopPropagation();
    setDismissed(prev => ({ ...prev, [key]: true }));
  };

  const hooks = [
    {
      key: 'qotd',
      icon: Sparkles,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      label: '✨ Question of the Day',
      text: rotateByDay(DAILY_QUESTIONS),
      cta: 'Answer',
      gradient: 'from-violet-50 to-indigo-50',
      border: 'border-violet-200',
      ctaBg: 'bg-violet-600 hover:bg-violet-700',
      postType: 'feed',
      subtype: 'question',
    },
    {
      key: 'tonight',
      icon: Moon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: "🌙 What's happening tonight?",
      text: rotateByDayOffset(TONIGHT_PROMPTS, 1),
      cta: 'Share',
      gradient: 'from-blue-50 to-sky-50',
      border: 'border-blue-200',
      ctaBg: 'bg-blue-600 hover:bg-blue-700',
      postType: 'feed',
      subtype: 'discussion',
    },
    isThursdayOrFriday && {
      key: 'shabbos',
      icon: Moon,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      label: '🕍 Shabbos Plans',
      text: rotateByDay(SHABBOS_PROMPTS),
      cta: 'Share',
      gradient: 'from-amber-50 to-yellow-50',
      border: 'border-amber-200',
      ctaBg: 'bg-amber-500 hover:bg-amber-600',
      postType: 'feed',
      subtype: 'discussion',
    },
    {
      key: 'help',
      icon: HandHeart,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      label: '🤝 Need help?',
      text: rotateByDayOffset(HELP_PROMPTS, 2),
      cta: 'Ask',
      gradient: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      ctaBg: 'bg-orange-500 hover:bg-orange-600',
      postType: 'help',
      subtype: null,
    },
  ].filter(Boolean).filter(h => !dismissed[h.key]);

  if (hooks.length === 0) return null;

  return (
    <div className="space-y-2 mb-3">
      {hooks.map(hook => {
        const Icon = hook.icon;
        return (
          <div
            key={hook.key}
            className={`relative rounded-2xl bg-gradient-to-r ${hook.gradient} border ${hook.border} px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform`}
            onClick={() => onPostClick(hook.postType, hook.subtype, hook.text)}
          >
            <div className={`w-9 h-9 rounded-xl ${hook.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${hook.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{hook.label}</p>
              <p className="text-[13px] font-semibold text-slate-800 leading-snug mt-0.5 line-clamp-2">{hook.text}</p>
            </div>
            <button
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-white text-[11px] font-bold ${hook.ctaBg} transition-colors`}
              onClick={e => { e.stopPropagation(); onPostClick(hook.postType, hook.subtype, hook.text); }}
            >
              {hook.cta}
            </button>
            <button
              onClick={e => dismiss(hook.key, e)}
              className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-slate-300 hover:text-slate-500 hover:bg-white/60 transition-colors text-[12px] font-bold"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}