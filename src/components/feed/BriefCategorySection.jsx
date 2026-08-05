import React from 'react';
import { ArrowLeft, ArrowRight, MapPinned, MessageCircle } from 'lucide-react';
import { classifyBriefCategory } from '@/lib/feed/briefRanking';
import UnifiedPostCard from './UnifiedPostCard';

const TAB_LABELS = {
  updates: 'Updates',
  discuss: 'Discuss',
  directory: 'Directory',
};

const postTitle = (post) => String(post?.title || post?.body || '').trim();

export default function BriefCategorySection({
  category,
  posts = [],
  activeTab = 'updates',
  onTabChange,
  onBack,
  onOpenPost,
  onOpenDirectory,
  onAction,
}) {
  if (!category) return null;

  const categoryPosts = posts.filter((post) => classifyBriefCategory(post) === category.id);
  const discussionPosts = categoryPosts.filter((post) => (
    post.post_subtype === 'question' || Number(post.comments_count || 0) > 0
  ));

  return (
    <section aria-labelledby="brief-category-heading" className="space-y-3">
      <div className="rounded-[22px] border border-[#DDE3EA] bg-white p-3 shadow-[0_8px_24px_rgba(15,28,46,0.07)]">
        <header className="flex items-start gap-2 px-1">
          <button
            type="button"
            aria-label="Back to all Brief categories"
            onClick={onBack}
            className="motion-press flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="min-w-0 pt-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#315B8A]">Daily Brief</p>
            <h1 id="brief-category-heading" className="mt-0.5 text-[20px] font-black tracking-[-0.025em] text-[#0F1C2E]">
              {category.label}
            </h1>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">{category.description}</p>
          </div>
        </header>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {category.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction?.(action, category)}
              className="motion-press min-h-11 rounded-[14px] bg-[#EAF0F8] px-3 text-[11.5px] font-black text-[#234E7A] outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div role="tablist" aria-label={`${category.label} sections`} className="mt-3 grid grid-cols-3 rounded-[14px] bg-slate-100 p-1">
          {category.tabs.map((tabId) => (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={activeTab === tabId}
              onClick={() => onTabChange?.(tabId)}
              className={`min-h-11 rounded-[11px] px-2 text-[11.5px] font-black outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeTab === tabId ? 'bg-white text-[#0F1C2E] shadow-sm' : 'text-slate-500'
              }`}
            >
              {TAB_LABELS[tabId]}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'updates' && (
        <div data-category-panel="updates" role="tabpanel" className="space-y-2.5">
          {categoryPosts.length > 0 ? categoryPosts.map((post) => (
            <UnifiedPostCard
              key={post.id}
              variant="compact"
              post={post}
              onLike={() => {}}
              onReply={onOpenPost}
              onOpen={onOpenPost}
            />
          )) : (
            <EmptyPanel title={`No trusted ${category.label} updates yet`} body="When your community shares something useful here, it will appear in this section." />
          )}
        </div>
      )}

      {activeTab === 'discuss' && (
        <div data-category-panel="discuss" role="tabpanel" className="space-y-2">
          {discussionPosts.length > 0 ? discussionPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => onOpenPost?.(post)}
              className="motion-press flex min-h-14 w-full items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-[#315B8A]" />
              <span className="min-w-0 flex-1">
                <span className="block line-clamp-2 text-[13px] font-bold text-[#0F1C2E]">{postTitle(post)}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">{Number(post.comments_count || 0)} replies</span>
              </span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          )) : (
            <EmptyPanel title="No discussion has started here" body={`Ask a ${category.label} question to begin a useful local conversation.`} />
          )}
        </div>
      )}

      {activeTab === 'directory' && (
        <div data-category-panel="directory" role="tabpanel" className="rounded-[18px] border border-slate-200 bg-white p-4">
          <MapPinned aria-hidden="true" className="h-6 w-6 text-[#315B8A]" />
          <p className="mt-3 text-[13px] font-black text-[#0F1C2E]">
            A structured {category.label} directory is not available yet.
          </p>
          <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">
            Use the community map to find nearby places and organizations while this directory grows.
          </p>
          <button
            type="button"
            onClick={onOpenDirectory}
            className="motion-press mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#0F1C2E] px-4 text-[12px] font-black text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Open the community map
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

function EmptyPanel({ title, body }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-5">
      <p className="text-[13px] font-black text-[#0F1C2E]">{title}</p>
      <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}
