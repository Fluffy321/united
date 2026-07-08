import { createPortal } from 'react-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { getCommunityTabLabel } from '@/lib/communityTypes';
import { TAB_ICON_MAP } from './shared';

export default function CommunityMoreSheet({ navConfig, activeTab, tabsWithCounts, onTabChange, onClose, accentHex }) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-[15px] font-black text-slate-900">More</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 rotate-[-90deg]" />
          </button>
        </div>
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          {navConfig.more.map((tabKey) => {
            const TabIcon = TAB_ICON_MAP[tabKey] || Home;
            const isActive = activeTab === tabKey;
            const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
            return (
              <button
                key={tabKey}
                onClick={() => onTabChange(tabKey)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95"
                style={
                  isActive
                    ? { background: `${accentHex}15`, borderColor: `${accentHex}40` }
                    : { background: '#f8fafc', borderColor: '#e2e8f0' }
                }
              >
                <div className="relative">
                  <TabIcon
                    className="w-6 h-6"
                    style={{ color: isActive ? accentHex : '#64748b' }}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {tabInfo?.count > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center px-0.5">
                      {tabInfo.count > 99 ? '99+' : tabInfo.count}
                    </span>
                  )}
                </div>
                <span
                  className="text-[11px] font-bold leading-none text-center"
                  style={{ color: isActive ? accentHex : '#64748b' }}
                >
                  {tabInfo?.label || getCommunityTabLabel(tabKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}
