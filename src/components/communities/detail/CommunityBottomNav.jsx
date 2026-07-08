import { createPortal } from 'react-dom';
import { Home, MoreHorizontal } from 'lucide-react';
import { getCommunityTabLabel } from '@/lib/communityTypes';
import { TAB_ICON_MAP } from './shared';

export default function CommunityBottomNav({ navConfig, activeTab, tabsWithCounts, onTabChange, onMoreClick, accentHex }) {
  const moreIsActive = navConfig.more.includes(activeTab);
  return createPortal(
    <nav className="app-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4">
      <div className="glass-toolbar mobile-page pointer-events-auto relative overflow-hidden rounded-[28px] px-2 py-1.5">
        <div className="flex items-center justify-around px-1 py-1.5">
          {navConfig.primary.map((tabKey) => {
            const TabIcon = TAB_ICON_MAP[tabKey] || Home;
            const isActive = activeTab === tabKey;
            const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
            return (
              <button
                key={tabKey}
                onClick={() => onTabChange(tabKey)}
                className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-[20px] py-[7px] touch-manipulation ${
                  isActive ? 'bg-white shadow-[0_12px_24px_rgba(37,99,235,0.14)] ring-1 ring-blue-100' : 'text-slate-500 hover:bg-white/70 active:bg-slate-100/60'
                }`}
              >
                {isActive && (
                  <span className="nav-active-pill absolute inset-1 rounded-[16px]" style={{ background: `${accentHex}18` }} />
                )}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <div className="relative">
                    <TabIcon
                      className="h-[22px] w-[22px] transition-colors"
                      style={{ color: isActive ? accentHex : '#94a3b8' }}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                    {tabInfo?.count > 0 && !isActive && (
                      <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center px-0.5">
                        {tabInfo.count > 99 ? '99+' : tabInfo.count}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold leading-none transition-colors"
                    style={{ color: isActive ? accentHex : '#94a3b8' }}
                  >
                    {getCommunityTabLabel(tabKey)}
                  </span>
                </div>
              </button>
            );
          })}
          {navConfig.more.length > 0 && (
            <button
              onClick={onMoreClick}
              className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-[20px] py-[7px] touch-manipulation ${
                moreIsActive ? 'bg-white shadow-[0_12px_24px_rgba(37,99,235,0.14)] ring-1 ring-blue-100' : 'text-slate-500 hover:bg-white/70 active:bg-slate-100/60'
              }`}
            >
              {moreIsActive && (
                <span className="nav-active-pill absolute inset-1 rounded-[16px]" style={{ background: `${accentHex}18` }} />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <MoreHorizontal
                  className="h-[22px] w-[22px] transition-colors"
                  style={{ color: moreIsActive ? accentHex : '#94a3b8' }}
                  strokeWidth={moreIsActive ? 2.5 : 1.75}
                />
                <span
                  className="text-[10px] font-semibold leading-none transition-colors"
                  style={{ color: moreIsActive ? accentHex : '#94a3b8' }}
                >
                  More
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </nav>,
    document.body
  );
}
