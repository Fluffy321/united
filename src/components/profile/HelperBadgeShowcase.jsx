import React from 'react';
import { BADGE_CONFIG } from './HelperBadge';

const TIERS = [
  { key: 'trusted',   threshold: 10,  icon: '⭐', next: 25 },
  { key: 'volunteer', threshold: 25,  icon: '🕊', next: 50 },
  { key: 'leader',    threshold: 50,  icon: '🧡', next: null },
];

export default function HelperBadgeShowcase({ currentBadge = 'none', actionCount = 0 }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EAECF0] overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] font-bold text-[#98A2B3] uppercase tracking-widest mb-3">Community Recognition</p>
        <div className="space-y-2">
          {TIERS.map(({ key, threshold, icon, next }) => {
            const cfg = BADGE_CONFIG[key];
            const earned = actionCount >= threshold;
            const isActive = currentBadge === key;
            const isNextUp = !earned && (
              key === 'trusted' ? currentBadge === 'none' :
              key === 'volunteer' ? currentBadge === 'trusted' :
              currentBadge === 'volunteer'
            );
            const progress = isNextUp
              ? Math.min(100, Math.round((actionCount / threshold) * 100))
              : null;

            return (
              <div
                key={key}
                className={`rounded-[14px] px-3.5 py-3 flex items-center gap-3 border transition-all ${
                  earned
                    ? `${cfg.bg} ${cfg.border}`
                    : 'bg-[#F7F8FA] border-[#EAECF0]'
                }`}
              >
                <span className={`text-[26px] leading-none ${!earned ? 'grayscale opacity-40' : ''}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`font-bold text-[13px] ${earned ? cfg.text : 'text-[#98A2B3]'}`}>{cfg.label}</p>
                    {isActive && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        Earned
                      </span>
                    )}
                  </div>
                  {earned ? (
                    <p className="text-[11px] text-[#98A2B3]">{cfg.description}</p>
                  ) : (
                    <div>
                      <p className="text-[11px] text-[#98A2B3] mb-1">{threshold - actionCount} more to unlock</p>
                      {isNextUp && (
                        <div className="w-full h-1.5 bg-[#EAECF0] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient} transition-all duration-700`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {earned && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-white border ${cfg.border}`}>
                    <span className="text-[14px]">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-[#F2F4F7]">
        <p className="text-[11px] text-[#98A2B3] text-center">
          You've completed <span className="font-bold text-[#0F1C2E]">{actionCount}</span> helping acts
        </p>
      </div>
    </div>
  );
}