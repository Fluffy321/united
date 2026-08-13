import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, MapPinned, MessageCircle } from 'lucide-react';
import { classifyBriefCategory } from '@/lib/feed/briefRanking';
import UnifiedPostCard from './UnifiedPostCard';

const TAB_LABELS = {
  updates: 'Updates',
  discuss: 'Discuss',
  directory: 'Directory',
};

const postTitle = (post) => String(post?.title || post?.body || '').trim();
const CLOSED_HELP_STATES = new Set(['closed', 'filled', 'completed', 'cancelled', 'canceled', 'resolved']);

export function isOpenCategoryItem(post, categoryId) {
  if (categoryId !== 'helping') return true;
  const status = String(post?.status || post?.request_status || post?.help_status || 'open').toLowerCase();
  return !CLOSED_HELP_STATES.has(status);
}

export function categoryCountLabel(posts, category) {
  const count = posts.filter((post) => isOpenCategoryItem(post, category.id)).length;
  if (!count) return 'No current activity';
  if (category.id === 'helping') return `${count} open`;
  return `${count} current`;
}

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
  const openCategoryPosts = categoryPosts.filter((post) => isOpenCategoryItem(post, category.id));
  const completedHelpingCount = category.id === 'helping'
    ? categoryPosts.length - openCategoryPosts.length
    : 0;
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
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[#EAF0F8] px-2.5 py-1 text-[10px] font-black text-[#234E7A]">
                {categoryCountLabel(categoryPosts, category)}
              </span>
              {category.id === 'helping' && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800">
                  <LockKeyhole aria-hidden="true" className="h-3 w-3" />
                  Private coordination
                </span>
              )}
            </div>
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
          {openCategoryPosts.length > 0 ? openCategoryPosts.map((post) => (
            <UnifiedPostCard
              key={post.id}
              variant="compact"
              post={post}
              onLike={() => {}}
              onReply={onOpenPost}
              onOpen={onOpenPost}
            />
          )) : (
            <EmptyPanel title="No current activity" body={`When your community shares a useful ${category.label} update, it will appear here.`} />
          )}
          {completedHelpingCount > 0 && (
            <div className="flex min-h-11 items-center gap-2 rounded-[14px] border border-emerald-100 bg-emerald-50 px-3 text-[11px] font-bold text-emerald-800">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
              {completedHelpingCount} recently completed
            </div>
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
