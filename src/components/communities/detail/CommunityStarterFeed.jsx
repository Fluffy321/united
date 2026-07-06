import { ChevronRight, Zap } from 'lucide-react';
import { CommunityPostPreview } from '../CommunityOperatingSystem';

export default function CommunityStarterFeed({ kit, posts, typeConfig, onPrompt, onTabChange }) {
  const visiblePosts = posts.slice(0, 3);

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{kit.feedTitle}</p>
          <h3 className="text-[17px] font-black text-slate-950">
            {visiblePosts.length ? 'Latest from the room' : kit.feedEmptyTitle}
          </h3>
          {!visiblePosts.length && (
            <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{kit.feedEmptyBody}</p>
          )}
        </div>
        <button type="button" onClick={() => onTabChange('posts')} className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">
          View all
        </button>
      </div>

      {visiblePosts.length ? (
        <div className="space-y-2.5">
          {visiblePosts.map((post) => (
            <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} compact />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {kit.starterThreads.map((thread) => (
            <button
              key={thread.title}
              type="button"
              onClick={() => onPrompt(thread.prompt)}
              className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-3 text-left shadow-sm transition-all active:scale-[0.98]"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <p className="text-[13px] font-black leading-tight text-slate-950">{thread.title}</p>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{thread.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-blue-600">
                Start this <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
