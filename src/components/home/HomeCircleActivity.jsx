import React from 'react';
import { ArrowRight, MessageCircle, Users } from 'lucide-react';
import { feedText, formatPostAge, postDate } from '@/lib/feed/feedRanking';

export default function HomeCircleActivity({
  activity = { active: [], quiet: [] },
  isLoading = false,
  embedded = false,
  onOpenCommunity,
  onBrowseCommunities,
}) {
  const active = activity.active || [];
  const quiet = activity.quiet || [];
  const cards = active.length ? active : quiet;

  return (
    <section className="space-y-2.5" aria-labelledby={embedded ? undefined : 'home-circles-title'} aria-label={embedded ? 'Circle activity' : undefined}>
      {!embedded && <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600">People you chose</p>
          <h2 id="home-circles-title" className="mt-0.5 text-[20px] font-black tracking-[-0.045em] text-[#101A2E]">From your circles</h2>
        </div>
        <button
          type="button"
          aria-label="Browse all circles"
          onClick={onBrowseCommunities}
          className="min-h-11 shrink-0 text-[11px] font-black text-[#2861E8]"
        >
          All circles
        </button>
      </div>}

      {isLoading ? (
        <div className="flex gap-2.5 overflow-hidden" aria-label="Loading circle activity">
          {[0, 1].map((item) => <div key={item} className="h-[132px] min-w-[78%] animate-pulse rounded-[23px] bg-slate-200/70" />)}
        </div>
      ) : cards.length ? (
        <div className="-mx-3.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((item) => {
            const post = item.post;
            const communityName = item.community?.name || 'Your circle';
            return (
              <button
                key={`${item.community?.id}-${post?.id || 'quiet'}`}
                type="button"
                aria-label={`Open ${communityName}`}
                onClick={() => onOpenCommunity?.(item)}
                className="min-h-[132px] min-w-[78%] snap-start rounded-[23px] border border-violet-100 bg-[linear-gradient(145deg,#ffffff_15%,#f3f0ff_100%)] p-4 text-left shadow-[0_10px_28px_rgba(48,37,98,0.08)] active:scale-[0.985]"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white"><Users className="h-[17px] w-[17px]" /></span>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-black text-violet-900">{communityName}</span>
                  <ArrowRight className="h-4 w-4 text-violet-400" />
                </span>
                {post ? (
                  <>
                    <span className="mt-3 block line-clamp-2 text-[14px] font-black leading-snug tracking-[-0.02em] text-slate-900">{feedText(post)}</span>
                    <span className="mt-2 block text-[10px] font-bold text-slate-500">
                      {[post.author_name || post.author?.name, formatPostAge(postDate(post))].filter(Boolean).join(' · ')}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="mt-3 block text-[14px] font-black text-slate-900">No new post here yet</span>
                    <span className="mt-1 block text-[10px] font-semibold text-slate-500">Open the circle whenever you want to check in.</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          aria-label="Browse communities"
          onClick={onBrowseCommunities}
          className="flex min-h-[82px] w-full items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 text-left shadow-[0_8px_24px_rgba(15,28,46,0.045)] active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><MessageCircle className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-black text-slate-900">Find people and groups that fit you</span>
            <span className="mt-0.5 block text-[10px] font-semibold text-slate-500">Browse communities</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-300" />
        </button>
      )}
    </section>
  );
}
