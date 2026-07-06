import { ChevronRight, Hash } from 'lucide-react';
import { getCommunityTabLabel } from '@/lib/communityTypes';
import { TAB_ICON_MAP, getCommunityActionCopy } from './shared';

export default function FeaturedLaunchpadCard({ tabKey, typeConfig, onTabChange, cardData }) {
  const Icon = TAB_ICON_MAP[tabKey] || Hash;
  const copy = getCommunityActionCopy(tabKey, typeConfig);
  const hasRealData = Boolean(cardData.stat || cardData.preview);
  return (
    <button
      type="button"
      onClick={() => onTabChange(tabKey)}
      className="group w-full overflow-hidden rounded-[28px] border border-blue-100 bg-white text-left shadow-sm active:scale-[0.99] transition-all"
    >
      <div className={`bg-gradient-to-br ${typeConfig.accent} px-5 py-4 text-white`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/20">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white/75">
              {hasRealData ? getCommunityTabLabel(tabKey) : 'Next best move'}
            </p>
            <h3 className="mt-1 text-[18px] font-black leading-tight">{hasRealData ? (cardData.preview || copy.title) : copy.title}</h3>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 px-5 py-3.5">
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-5 text-slate-600">
          {hasRealData ? (cardData.stat || copy.body) : copy.body}
        </p>
        <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-black text-blue-700 group-active:bg-blue-100">
          {copy.action}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}
