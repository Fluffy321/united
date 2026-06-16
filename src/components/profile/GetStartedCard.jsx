import React from 'react';
import { HandHeart, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { COMMUNITIES_ENABLED } from '@/config/features';

const STEPS = [
  {
    Icon: HandHeart,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    title: 'Offer to help',
    subtitle: 'Find a mitzvah nearby',
    page: 'MitzvahCircle',
  },
  {
    Icon: Users,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
    title: 'Join a community',
    subtitle: 'Shuls, Chesed & more',
    page: 'Communities',
    requiresCommunities: true,
  },
  {
    Icon: BookOpen,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    title: 'Learn something',
    subtitle: 'Weekly Torah insights',
    page: 'Feed',
  },
];

export default function GetStartedCard() {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="px-4 pb-3 pt-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Your Impact</p>
        <h3 className="mt-0.5 text-[15px] font-black text-slate-950">Start your chesed journey</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          Every act counts — even one small mitzvah lights the way.
        </p>
      </div>

      {/* Step rows */}
      <div className="divide-y divide-slate-100">
        {STEPS.filter((step) => COMMUNITIES_ENABLED || !step.requiresCommunities).map(({ Icon, iconBg, iconColor, title, subtitle, page }, i) => (
          <button
            key={i}
            onClick={() => navigate(createPageUrl(page))}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-slate-900">{title}</p>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
            <span className="text-[13px] text-slate-300">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
