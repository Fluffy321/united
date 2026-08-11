import React from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { getBriefCategory } from '@/lib/feed/briefCategories';

const readableTitle = (item) => String(item?.title || item?.body || '').trim();

const itemContext = (item) => (
  item?.source_label
  || item?.source
  || item?.community_name
  || item?.location_text
  || item?.city
  || 'Your community'
);

export function buildBriefingItems(items = []) {
  const seenIds = new Set();
  const briefingItems = [];

  for (const item of items) {
    const title = readableTitle(item);
    if (!item?.id || !title || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    const category = getBriefCategory(item.category_id) || getBriefCategory('local');
    briefingItems.push({
      ...item,
      title,
      categoryLabel: category.label,
      context: itemContext(item),
    });
    if (briefingItems.length === 3) break;
  }

  return briefingItems;
}

function BriefItem({ item, onOpenItem }) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#315B8A]">
          {item.categoryLabel} · {item.context}
        </span>
        <span className="mt-0.5 block line-clamp-2 text-[13px] font-bold leading-[1.35] text-[#0F1C2E]">
          {item.title}
        </span>
      </span>
      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-300" />
    </>
  );

  if (!onOpenItem) {
    return (
      <div data-brief-item className="flex min-h-11 items-center gap-3 px-1 py-2.5">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-brief-item
      aria-label={`Open brief item: ${item.title}`}
      onClick={() => onOpenItem(item)}
      className="motion-press flex min-h-11 w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
    >
      {content}
    </button>
  );
}

export default function FiveTownsBrief({
  items = [],
  networkLabel = 'Your community',
  onOpenBrief,
  onOpenItem,
}) {
  const briefingItems = buildBriefingItems(items);

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#DDE3EA] bg-white shadow-[0_8px_24px_rgba(15,28,46,0.07)]">
      <header className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#EAF0F8] text-[#315B8A]">
          <Newspaper aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#315B8A]">
            {networkLabel}
          </span>
          <h2 className="mt-0.5 text-[18px] font-black tracking-[-0.02em] text-[#0F1C2E]">
            Your Daily Brief
          </h2>
          <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
            Three useful things for today
          </span>
        </span>
      </header>

      <div className="px-4 py-2">
        {briefingItems.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {briefingItems.map((item) => (
              <BriefItem key={item.id} item={item} onOpenItem={onOpenItem} />
            ))}
          </div>
        ) : (
          <div className="py-4">
            <p className="text-[13px] font-black text-[#0F1C2E]">No trusted updates are ready yet</p>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">
              Check back soon or share what your community should know.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          aria-label="Open your complete Daily Brief"
          onClick={onOpenBrief}
          className="motion-press flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#0F1C2E] px-4 text-[13px] font-black text-white outline-none transition hover:bg-[#1C304A] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Open Brief
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
