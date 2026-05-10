import React from 'react';

const STAGES = [
  { key: 'open',        label: 'Open',        color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', dot: 'bg-yellow-400' },
  { key: 'offered',     label: 'Offered',     color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', dot: 'bg-violet-500' },
  { key: 'accepted',    label: 'Accepted',    color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', dot: 'bg-blue-500' },
  { key: 'in_progress', label: 'Helping',     color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', dot: 'bg-teal-500' },
  { key: 'verified',    label: 'Verified',    color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', dot: 'bg-green-500' },
];

const STATUS_INDEX = {
  open: 0,
  Open: 0,
  offered: 1,
  volunteer_offered: 1,
  Offered: 1,
  accepted: 2,
  in_progress: 3,
  InProgress: 3,
  Claimed: 3,
  pending_verify: 4,
  verified: 4,
  completed: 4,
  Completed: 4,
};

export default function StatusPipeline({ status }) {
  const active = STATUS_INDEX[status] ?? 0;

  return (
    <div className="flex items-center gap-0 w-full mb-3">
      {STAGES.map((s, i) => {
        const isDone    = i < active;
        const isCurrent = i === active;

        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              {/* Dot */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isCurrent ? `${s.dot} ring-4 ring-offset-1` : isDone ? 'bg-green-400' : 'bg-slate-200'
                }`}
                style={isCurrent ? { ringColor: `${s.color}30` } : {}}
              >
                {isDone && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              {/* Label */}
              <span
                className="text-[10px] font-semibold mt-1 whitespace-nowrap"
                style={{ color: isCurrent ? s.color : isDone ? '#16A34A' : '#9CA3AF' }}
              >
                {s.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STAGES.length - 1 && (
              <div
                className="h-[2px] flex-1 mx-1 mb-4 rounded-full transition-all"
                style={{ background: i < active ? '#4ADE80' : '#E5E7EB' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
