import { CommunityPostPreview } from '../CommunityOperatingSystem';
import CompactEmptyState from './CompactEmptyState';

export default function HomeFeedSection({ posts, typeConfig, activeNeeds = [], onTabChange }) {
  if (!posts.length && !activeNeeds.length) {
    return <CompactEmptyState typeConfig={typeConfig} tabKey="home" />;
  }

  return (
    <div className="space-y-2.5">
      <p className="app-section-label px-0.5">Latest</p>
      {posts.map((post) => (
        <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
      ))}
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.status || 'open'}</span>
          <h3 className="mt-2 text-[14px] font-black text-slate-950">{need.title}</h3>
          {need.description && <p className="mt-1 text-sm leading-5 text-slate-600 line-clamp-2">{need.description}</p>}
        </article>
      ))}
    </div>
  );
}
