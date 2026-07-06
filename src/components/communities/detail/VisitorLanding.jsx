import { Lock, Users } from 'lucide-react';
import { CommunityFeaturedSection, CommunityPostPreview } from '../CommunityOperatingSystem';
import { isAnn } from './shared';

export default function VisitorLanding({ community, typeConfig, posts, events, resources, members, onFollow, onTabChange }) {
  const description = community?.settings?.welcome_message
    || community?.welcome_message
    || community?.description_long
    || community?.description
    || typeConfig.cardFallback;
  const memberCount = members.length > 0 ? members.length : (community?.follower_count || 0);
  const pinnedPost = posts.find((p) => p.is_pinned) || posts.find(isAnn);
  const upcomingEvent = events
    .filter((e) => new Date(e.start_date || e.event_date) >= new Date())
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date))[0];
  const featuredResource = resources.find((r) => r.is_pinned) || resources[0];
  const hasFeatured = pinnedPost || upcomingEvent || featuredResource;
  const previewPosts = posts.slice(0, 2);
  const lockedCount = Math.max(0, posts.length - previewPosts.length);
  const Icon = typeConfig.icon;

  return (
    <div className="space-y-3 pt-3">
      {/* Value proposition + join CTA */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{typeConfig.label}</span>
            {memberCount > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[12px] font-bold text-slate-500">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {memberCount.toLocaleString()}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[14px] font-semibold text-slate-700 leading-relaxed mb-5">{description}</p>
          )}
          <button
            type="button"
            onClick={onFollow}
            className={`w-full h-11 rounded-2xl bg-gradient-to-r ${typeConfig.accent} text-white font-black text-[15px] active:scale-[0.98] transition-all shadow-sm`}
          >
            Join {community.name}
          </button>
        </div>
      </div>

      {/* Featured pinned post / next event / top resource */}
      {hasFeatured && (
        <CommunityFeaturedSection
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          onTabChange={onTabChange}
        />
      )}

      {/* Preview posts with join gate */}
      {previewPosts.length > 0 && (
        <div>
          <p className="app-section-label px-1 mb-2">
            Community posts
          </p>
          <div className="space-y-2.5">
            {previewPosts.map((post) => (
              <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
            ))}
          </div>
          {lockedCount > 0 && (
            <div className="mt-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 px-5 py-6 text-center">
              <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-[15px] font-black text-slate-900 mb-1">
                {lockedCount} more {lockedCount === 1 ? 'post' : 'posts'} in this community
              </p>
              <p className="text-[12px] font-semibold text-slate-500 mb-4">
                Join to read, reply, and participate
              </p>
              <button
                type="button"
                onClick={onFollow}
                className={`h-10 px-6 rounded-full bg-gradient-to-r ${typeConfig.accent} text-white font-black text-[13px] active:scale-95 transition-all`}
              >
                Join for free
              </button>
            </div>
          )}
        </div>
      )}

      {/* Brand-new community — no posts yet */}
      {posts.length === 0 && (
        <div className="app-empty-state">
          <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="app-empty-state-title mb-1">{typeConfig.emptyTitle || 'Be the first to join'}</p>
          <p className="app-empty-state-body">{typeConfig.tagline}</p>
        </div>
      )}
    </div>
  );
}
