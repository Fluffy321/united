import { ChevronRight, Hash } from 'lucide-react';
import { TAB_ICON_MAP, getCommunityActionCopy } from './shared';

export default function SecondaryLaunchpadCard({ tabKey, typeConfig, onTabChange, cardData }) {
  const Icon = TAB_ICON_MAP[tabKey] || Hash;
  const copy = getCommunityActionCopy(tabKey, typeConfig);
  const hasData = cardData.stat || cardData.preview;
  const subtext = hasData ? (cardData.stat || cardData.preview) : copy.body;
  const subtextClass = hasData ? 'text-blue-700 font-black' : 'text-slate-500 font-semibold';
  return (
    <button
      type="button"
      onClick={() => onTabChange(tabKey)}
      className="group flex min-h-[134px] flex-col items-start justify-between rounded-[22px] border border-slate-100 bg-white p-4 text-left shadow-sm active:scale-[0.98] active:bg-slate-50 transition-all"
    >
      <div className="flex w-full items-start gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-black leading-tight text-slate-950">{copy.title}</p>
          {subtext && (
            <p className={`mt-1 text-[11px] leading-snug line-clamp-2 ${subtextClass}`}>{subtext}</p>
          )}
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-black text-blue-600">
        {copy.action}
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
