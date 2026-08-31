import React from 'react';

export default function DirectoryIntentRail({ intents, activeIntentId = '', onSelect }) {
  return (
    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {intents.map((intent) => {
        const selected = intent.id === activeIntentId;
        return (
          <button
            type="button"
            key={intent.id}
            aria-pressed={selected}
            onClick={() => onSelect?.(selected ? '' : intent.id)}
            className={`min-h-11 shrink-0 snap-start rounded-full border px-4 text-[11px] font-black transition active:scale-[0.97] ${selected
              ? 'border-[#2456D8] bg-[#2456D8] text-white shadow-[0_7px_18px_rgba(36,86,216,0.2)]'
              : 'border-slate-200 bg-white text-slate-700'}`}
          >
            {intent.label}
          </button>
        );
      })}
    </div>
  );
}
