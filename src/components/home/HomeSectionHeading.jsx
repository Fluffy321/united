import React from 'react';

const TONES = {
  blue: 'text-[#2861E8]',
  violet: 'text-violet-600',
  orange: 'text-orange-600',
};

export default function HomeSectionHeading({
  eyebrow,
  title,
  action,
  onAction,
  titleId,
  tone = 'blue',
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-0.5">
      <div className="min-w-0">
        <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${TONES[tone] || TONES.blue}`}>{eyebrow}</p>
        <h2 id={titleId} className="mt-0.5 text-[20px] font-black tracking-[-0.045em] text-[#101A2E]">{title}</h2>
      </div>
      {action && (
        <button type="button" onClick={onAction} className="min-h-11 shrink-0 px-1 text-[11px] font-black text-[#2861E8]">
          {action}
        </button>
      )}
    </div>
  );
}
