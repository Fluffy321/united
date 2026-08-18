import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PUBLISHING_GROUPS, PUBLISHING_TYPES } from '@/lib/publishing/publishingTypes';

const GROUP_STYLE = {
  local: 'border-l-blue-500 bg-blue-50/70',
  jewish_life: 'border-l-amber-500 bg-amber-50/70',
  plans: 'border-l-violet-500 bg-violet-50/70',
  help: 'border-l-emerald-500 bg-emerald-50/70',
  opportunities: 'border-l-sky-500 bg-sky-50/70',
  businesses_food: 'border-l-orange-500 bg-orange-50/70',
};

export default function PublishingTypePicker({ expandedGroup = 'local', onGroup, onType }) {
  return (
    <div className="space-y-2.5" aria-label="Publishing choices">
      {PUBLISHING_GROUPS.map((group) => {
        const isOpen = group.id === expandedGroup;
        const types = PUBLISHING_TYPES.filter((type) => type.group === group.id);
        return (
          <section
            key={group.id}
            data-publishing-group={group.id}
            className={`overflow-hidden rounded-[20px] border border-slate-200 border-l-4 ${GROUP_STYLE[group.id]}`}
          >
            <button
              type="button"
              onClick={() => onGroup?.(isOpen ? null : group.id)}
              aria-expanded={isOpen}
              className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-black tracking-[-0.01em] text-slate-950">{group.label}</span>
                <span className="mt-0.5 block text-xs font-medium leading-4 text-slate-600">{group.description}</span>
              </span>
              <span className="rounded-full bg-white/90 p-2 text-slate-500 shadow-sm" aria-hidden="true">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            </button>
            {isOpen && (
              <div className="grid grid-cols-2 gap-2 border-t border-black/5 bg-white/75 p-2.5">
                {types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    data-publishing-type={type.id}
                    onClick={() => onType?.(type.id)}
                    className="min-h-[54px] rounded-[15px] border border-slate-200 bg-white px-3 py-2.5 text-left text-[13px] font-extrabold leading-4 text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
