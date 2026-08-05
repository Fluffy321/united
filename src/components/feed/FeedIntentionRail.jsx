import React from 'react';
import { CalendarPlus, CircleHelp, HandHeart, HeartHandshake, Send } from 'lucide-react';
import { FEED_INTENTIONS } from '@/lib/feed/feedIntentions';

const ICONS = { CalendarPlus, CircleHelp, HandHeart, HeartHandshake, Send };

export default function FeedIntentionRail({ onSelect }) {
  return (
    <section aria-labelledby="feed-intentions-heading" className="rounded-[18px] border border-[#DDE3EA] bg-white px-2 py-2.5 shadow-[0_4px_16px_rgba(15,28,46,0.05)]">
      <h2 id="feed-intentions-heading" className="sr-only">Post to your community</h2>
      <div className="overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid min-w-[340px] grid-cols-5 gap-1.5">
          {FEED_INTENTIONS.map((intention) => {
            const Icon = ICONS[intention.icon] || Send;
            return (
              <button
                key={intention.id}
                type="button"
                data-feed-intention={intention.id}
                aria-label={intention.ariaLabel}
                onClick={() => onSelect?.(intention)}
                className="motion-press flex min-h-11 flex-col items-center justify-center gap-1 rounded-[13px] px-1 text-[10.5px] font-black text-[#0F1C2E] outline-none transition hover:bg-[#EAF0F8] focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Icon aria-hidden="true" className="h-[17px] w-[17px] text-[#315B8A]" />
                {intention.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
