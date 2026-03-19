import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';

const BADGES = [
  { id: 'trusted', name: 'Trusted Helper', icon: '🤝', threshold: 10, color: 'blue' },
  { id: 'volunteer', name: 'Community Volunteer', icon: '❤️', threshold: 25, color: 'purple' },
  { id: 'leader', name: 'Chesed Leader', icon: '👑', threshold: 50, color: 'amber' },
  { id: 'first-responder', name: 'First Responder', icon: '⚡', threshold: 5, color: 'red' },
  { id: 'event-organizer', name: 'Event Organizer', icon: '📅', threshold: 3, color: 'green' },
  { id: 'community-connector', name: 'Community Connector', icon: '🌉', threshold: 10, color: 'indigo' }
];

export default function BadgesSection({ user }) {
  const actionCount = user.helper_actions_count || 0;

  if (actionCount === 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Recognition Badges</h2>
        
        <p className="text-xs text-slate-600 mb-4">
          You've completed {actionCount} helping {actionCount === 1 ? 'act' : 'acts'} — {Math.max(0, BADGES[0].threshold - actionCount)} more to next badge!
        </p>

        <div className="grid grid-cols-2 gap-3">
          {BADGES.map(badge => {
            const isUnlocked = actionCount >= badge.threshold;
            const progress = Math.min(actionCount, badge.threshold);

            return (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border ${isUnlocked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl">{badge.icon}</span>
                  {isUnlocked && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />}
                  {!isUnlocked && <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
                </div>
                <p className={`text-xs font-bold ${isUnlocked ? 'text-slate-900' : 'text-slate-600'}`}>
                  {badge.name}
                </p>
                
                {/* Progress Bar */}
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${isUnlocked ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${(progress / badge.threshold) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {progress}/{badge.threshold}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}