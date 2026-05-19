import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Crown,
  FileText,
  Megaphone,
  MessageCircle,
  Pin,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const MANAGER_ROLES = new Set(['owner', 'admin', 'moderator']);

export function isAnnouncementPost(post = {}) {
  const kind = String(post.post_kind || post.post_type || post.type || '').toLowerCase();
  return kind === 'announcement' || kind === 'official_update' || kind === 'local_update' || post.is_official === true;
}

export function postSnippet(post = {}, limit = 120) {
  const text = post.title || post.body || post.content || '';
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}...` : text;
}

export function getMemberName(member = {}) {
  return member.profile?.display_name || member.user_name || member.display_name || member.full_name || 'Community member';
}

export function getMemberRole(member = {}, community = {}) {
  const role = String(member.role || 'member').toLowerCase();
  if (member.user_id && community?.created_by_user_id === member.user_id) return 'owner';
  return role;
}

export function RoleLabel({ role }) {
  const normalized = String(role || 'member').toLowerCase();
  const classes = {
    owner: 'bg-amber-100 text-amber-800 border-amber-200',
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    moderator: 'bg-violet-100 text-violet-800 border-violet-200',
    member: 'bg-slate-100 text-slate-600 border-slate-200',
  }[normalized] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${classes}`}>
      {normalized === 'owner' ? <Crown className="h-2.5 w-2.5" /> : null}
      {normalized === 'admin' || normalized === 'moderator' ? <ShieldCheck className="h-2.5 w-2.5" /> : null}
      {normalized}
    </span>
  );
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getUpcomingEvents(events = []) {
  const now = new Date();
  return [...events]
    .filter((event) => {
      const dateValue = event.start_date || event.event_date;
      if (!dateValue) return true;
      return new Date(dateValue) >= now;
    })
    .sort((a, b) => new Date(a.start_date || a.event_date || 0) - new Date(b.start_date || b.event_date || 0));
}

function AvatarInitial({ name }) {
  const initial = String(name || '?').trim()[0]?.toUpperCase() || '?';
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-slate-800 text-xs font-black text-white">
      {initial}
    </div>
  );
}

export function CommunityPostPreview({ post, typeConfig, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const announcement = isAnnouncementPost(post);
  const Icon = announcement ? Megaphone : typeConfig?.icon || Sparkles;
  const body = post.body || post.content || '';
  const shouldCollapse = !compact && (announcement || body.length > 220);

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm ${
        announcement
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-blue-50'
          : 'border-slate-100 bg-white'
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
            announcement ? 'bg-amber-100 text-amber-800' : (typeConfig?.badgeClass || 'bg-blue-50 text-blue-700')
          }`}
        >
          <Icon className="h-3 w-3" />
          {announcement ? 'Official update' : (post.type || post.post_type || typeConfig?.label || 'Post')}
        </span>
        {post.is_pinned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
            <Pin className="h-3 w-3" />
            Featured
          </span>
        ) : null}
        <span className="text-[11px] font-semibold text-slate-400">
          {formatDate(post.created_date || post.created_at) || 'Community post'}
        </span>
      </div>
      {post.title ? <h3 className="text-[15px] font-black leading-snug text-slate-950">{post.title}</h3> : null}
      <p className={`mt-1 text-sm leading-6 text-slate-600 ${compact ? 'line-clamp-2' : (!expanded && shouldCollapse ? 'line-clamp-3' : '')}`}>
        {body}
      </p>
      {shouldCollapse && !expanded && body.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="mt-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-800"
        >
          Read more
        </button>
      )}
    </article>
  );
}

export function CommunityFeaturedSection({
  typeConfig,
  posts = [],
  events = [],
  resources = [],
  onTabChange,
}) {
  const pinnedPost = posts.find((post) => post.is_pinned) || posts.find(isAnnouncementPost);
  const upcomingEvent = getUpcomingEvents(events)[0];
  const featuredResource = resources.find((resource) => resource.is_pinned) || resources[0];

  if (!pinnedPost && !upcomingEvent && !featuredResource) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-950">Featured content will appear here</p>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-500">
              Pin an announcement, add an event, or share a resource to give members a clear place to start.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Featured</p>
          <h2 className="text-base font-black text-slate-950">Start here</h2>
        </div>
        {pinnedPost ? (
          <button
            type="button"
            onClick={() => onTabChange?.(isAnnouncementPost(pinnedPost) ? 'announcements' : 'posts')}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700"
          >
            Open
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {pinnedPost ? (
        <CommunityPostPreview post={pinnedPost} typeConfig={typeConfig} compact />
      ) : null}

      <div className={`grid gap-2 ${pinnedPost ? 'mt-3' : ''} sm:grid-cols-2`}>
        {upcomingEvent ? (
          <button
            type="button"
            onClick={() => onTabChange?.('events')}
            className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-emerald-700">
              <CalendarDays className="h-3.5 w-3.5" />
              Upcoming event
            </div>
            <p className="mt-1 line-clamp-1 text-sm font-black text-slate-900">{upcomingEvent.title || upcomingEvent.name}</p>
            <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{formatDate(upcomingEvent.start_date || upcomingEvent.event_date) || 'Date TBD'}</p>
          </button>
        ) : null}
        {featuredResource ? (
          <button
            type="button"
            onClick={() => onTabChange?.('resources')}
            className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-violet-700">
              <FileText className="h-3.5 w-3.5" />
              Resource
            </div>
            <p className="mt-1 line-clamp-1 text-sm font-black text-slate-900">{featuredResource.title}</p>
            <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{featuredResource.category || 'Shared resource'}</p>
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function CommunityWelcomeHub({
  community,
  typeConfig,
  posts = [],
  events = [],
  resources = [],
  members = [],
  isCommunityManager = false,
  isFollowing = false,
  lastVisitedAt = null,
  onTabChange,
  onManage,
  onCompose,
}) {
  const settings = community?.settings && typeof community.settings === 'object' ? community.settings : {};
  const welcomeText = settings.welcome_message
    || community?.welcome_message
    || community?.description_long
    || community?.description
    || typeConfig?.cardFallback;
  const announcementCount = posts.filter(isAnnouncementPost).length;
  const latestAnnouncement = posts.find(isAnnouncementPost);
  const leadership = members
    .filter((member) => MANAGER_ROLES.has(getMemberRole(member, community)))
    .slice(0, 3);
  const upcomingEvent = getUpcomingEvents(events)[0];
  const resourcePreview = resources[0];
  const Icon = typeConfig?.icon || Users;

  const { newAnnouncements, newRegularPosts, newEvents: newEventCount } = useMemo(() => {
    if (!lastVisitedAt) return { newAnnouncements: 0, newRegularPosts: 0, newEvents: 0 };
    const since = new Date(lastVisitedAt);
    const newAnn = posts.filter((p) => isAnnouncementPost(p) && new Date(p.created_at || p.created_date) > since).length;
    const newReg = posts.filter((p) => !isAnnouncementPost(p) && new Date(p.created_at || p.created_date) > since).length;
    const newEvt = events.filter((e) => new Date(e.created_at) > since).length;
    return { newAnnouncements: newAnn, newRegularPosts: newReg, newEvents: newEvt };
  }, [lastVisitedAt, posts, events]);
  const hasAnyNew = newAnnouncements + newRegularPosts + newEventCount > 0;

  if (isFollowing) {
    // ── Joined member: compact dashboard ──────────────────────────────────────
    return (
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        {/* Compact identity row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig?.accent || 'from-blue-600 to-slate-800'} text-white`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black leading-tight text-slate-950 truncate">{community?.name}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            Joined
          </span>
        </div>

        {/* Since-your-last-visit activity digest */}
        {hasAnyNew && (
          <div className="border-b border-slate-50 bg-blue-50/50 px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-blue-600">
              <Sparkles className="h-3 w-3" />
              Since your last visit
            </p>
            <div className="space-y-0.5">
              {newAnnouncements > 0 && (
                <button
                  type="button"
                  onClick={() => onTabChange?.('announcements')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-blue-100/70 active:bg-blue-100"
                >
                  <Megaphone className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                  <span className="flex-1 text-[13px] font-bold text-slate-800">
                    {newAnnouncements === 1 ? '1 new announcement' : `${newAnnouncements} new announcements`}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
              {newRegularPosts > 0 && (
                <button
                  type="button"
                  onClick={() => onTabChange?.('posts')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-blue-100/70 active:bg-blue-100"
                >
                  <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                  <span className="flex-1 text-[13px] font-bold text-slate-800">
                    {newRegularPosts === 1 ? '1 new post' : `${newRegularPosts} new posts`}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
              {newEventCount > 0 && (
                <button
                  type="button"
                  onClick={() => onTabChange?.('events')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-blue-100/70 active:bg-blue-100"
                >
                  <CalendarDays className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                  <span className="flex-1 text-[13px] font-bold text-slate-800">
                    {newEventCount === 1 ? '1 new event' : `${newEventCount} new events`}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Latest announcement — prominent if available */}
        {latestAnnouncement && (
          <button
            type="button"
            onClick={() => onTabChange?.('announcements')}
            className="w-full border-b border-slate-50 bg-amber-50/70 px-4 py-3 text-left transition-colors hover:bg-amber-50"
          >
            <div className="mb-1 flex items-center gap-2">
              <Megaphone className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
              <span className="text-[10px] font-black uppercase tracking-wide text-amber-700">Latest announcement</span>
              {announcementCount > 1 && (
                <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  +{announcementCount - 1} more
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-900">
              {postSnippet(latestAnnouncement, 120)}
            </p>
          </button>
        )}

        {/* Quick-nav stats grid */}
        <div className="grid grid-cols-3 divide-x divide-slate-50">
          <button
            type="button"
            onClick={() => onTabChange?.('members')}
            className="px-3 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Leadership</p>
            <p className="mt-0.5 truncate text-[13px] font-black text-slate-900">
              {leadership.length ? getMemberName(leadership[0]) : 'View all'}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onTabChange?.('events')}
            className="px-3 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Next event</p>
            <p className="mt-0.5 line-clamp-1 text-[13px] font-black text-slate-900">
              {upcomingEvent ? (upcomingEvent.title || upcomingEvent.name) : 'None yet'}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onTabChange?.('resources')}
            className="px-3 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Resource</p>
            <p className="mt-0.5 line-clamp-1 text-[13px] font-black text-slate-900">
              {resourcePreview ? resourcePreview.title : 'None yet'}
            </p>
          </button>
        </div>
      </section>
    );
  }

  // ── Visitor / non-member: community landing page ───────────────────────────
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig?.accent || 'from-blue-600 to-slate-800'} text-white shadow-sm`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">About this community</p>
          <h2 className="text-lg font-black leading-tight text-slate-950">{community?.name}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{welcomeText}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onTabChange?.('about')}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
            >
              Learn more
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onTabChange?.('members')}
          className="rounded-2xl bg-slate-50 px-3 py-3 text-left"
        >
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Leadership</p>
          <p className="mt-1 text-sm font-black text-slate-900">
            {leadership.length ? leadership.map(getMemberName).slice(0, 2).join(', ') : 'View members'}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onTabChange?.('events')}
          className="rounded-2xl bg-slate-50 px-3 py-3 text-left"
        >
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Next event</p>
          <p className="mt-1 line-clamp-1 text-sm font-black text-slate-900">
            {upcomingEvent ? (upcomingEvent.title || upcomingEvent.name) : 'No event yet'}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onTabChange?.('resources')}
          className="rounded-2xl bg-slate-50 px-3 py-3 text-left"
        >
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Useful resource</p>
          <p className="mt-1 line-clamp-1 text-sm font-black text-slate-900">
            {resourcePreview ? resourcePreview.title : 'No resources yet'}
          </p>
        </button>
      </div>
    </section>
  );
}

export function CommunityMemberDirectory({ community, members = [], memberCount }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const sortedMembers = useMemo(() => {
    const order = { owner: 0, admin: 1, moderator: 2, member: 3 };
    return [...members].sort((a, b) => {
      const aRole = getMemberRole(a, community);
      const bRole = getMemberRole(b, community);
      return (order[aRole] ?? 4) - (order[bRole] ?? 4) || getMemberName(a).localeCompare(getMemberName(b));
    });
  }, [community, members]);
  const leadership = sortedMembers.filter((member) => MANAGER_ROLES.has(getMemberRole(member, community)));
  const filteredMembers = sortedMembers.filter((member) => {
    if (!normalizedQuery) return true;
    return getMemberName(member).toLowerCase().includes(normalizedQuery);
  });

  return (
    <div className="space-y-4 pt-4">
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">{(memberCount || members.length || 0).toLocaleString()} members</p>
            <p className="text-[12px] font-semibold text-slate-500">Directory, leadership, and role labels</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-700" />
          <p className="text-sm font-black text-blue-950">Community leadership</p>
        </div>
        {leadership.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {leadership.slice(0, 6).map((member) => {
              const name = getMemberName(member);
              const role = getMemberRole(member, community);
              return (
                <div key={member.id || member.user_id} className="rounded-2xl border border-blue-100 bg-white px-3 py-3">
                  <div className="flex items-center gap-2">
                    <AvatarInitial name={name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900">{name}</p>
                      <RoleLabel role={role} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] font-semibold leading-5 text-blue-800">
            Owner and admin contacts will appear here once the community has active leadership records.
          </p>
        )}
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search members..."
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold outline-none transition focus:border-blue-400"
        />
      </div>

      {filteredMembers.length ? (
        <div className="space-y-2">
          {filteredMembers.slice(0, 80).map((member) => {
            const name = getMemberName(member);
            const role = getMemberRole(member, community);
            return (
              <div key={member.id || member.user_id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <AvatarInitial name={name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">{name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <RoleLabel role={role} />
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatDate(member.joined_at || member.created_at) ? `Joined ${formatDate(member.joined_at || member.created_at)}` : 'Community member'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-900">No members found</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-500">Try another search.</p>
        </div>
      )}
    </div>
  );
}

export function CommunityAdminQuickActions({ onAnnouncement, onEvent, onResource, onAdminCenter }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
      <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 flex-shrink-0 mr-0.5">Admin</span>
      <button
        type="button"
        onClick={onAnnouncement}
        className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 active:scale-95 transition-all flex-shrink-0"
      >
        <Megaphone className="h-3 w-3 text-amber-600 flex-shrink-0" /> Announce
      </button>
      <button
        type="button"
        onClick={onEvent}
        className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 active:scale-95 transition-all flex-shrink-0"
      >
        <CalendarDays className="h-3 w-3 text-emerald-600 flex-shrink-0" /> Event
      </button>
      <button
        type="button"
        onClick={onResource}
        className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 active:scale-95 transition-all flex-shrink-0"
      >
        <FileText className="h-3 w-3 text-violet-600 flex-shrink-0" /> Resource
      </button>
      <button
        type="button"
        onClick={onAdminCenter}
        className="ml-auto h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 active:scale-95 transition-all flex-shrink-0"
        aria-label="Admin center"
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Single compact strip showing the most timely community item.
 * Priority: pinned announcement → latest announcement → urgent need → upcoming event → resource
 */
export function CommunityImportantStrip({ posts = [], events = [], activeNeeds = [], resources = [], typeConfig, onTabChange }) {
  const pinnedOrLatestAnnouncement = posts.find((p) => p.is_pinned && isAnnouncementPost(p)) || posts.find(isAnnouncementPost);
  const upcomingEvent = getUpcomingEvents(events)[0];
  const featuredResource = resources.find((r) => r.is_pinned) || resources[0];
  const urgentNeed = activeNeeds[0];

  // Determine what to surface based on type emphasis + content availability
  const typeKey = typeConfig?.key || 'general';

  let item = null;
  if (typeKey === 'chesed' && urgentNeed) {
    item = {
      kind: 'need',
      icon: '🙏',
      label: 'Open need',
      text: urgentNeed.title || 'Community chesed request',
      action: () => onTabChange?.('openNeeds'),
      colorClass: 'border-emerald-200 bg-emerald-50',
      labelClass: 'text-emerald-700',
    };
  } else if (pinnedOrLatestAnnouncement) {
    const typeAnnouncementColors = {
      shul: { colorClass: 'border-indigo-200 bg-indigo-50', labelClass: 'text-indigo-700' },
      neighborhood: { colorClass: 'border-cyan-200 bg-cyan-50', labelClass: 'text-cyan-700' },
      learning: { colorClass: 'border-amber-200 bg-amber-50', labelClass: 'text-amber-700' },
      parents: { colorClass: 'border-orange-200 bg-orange-50', labelClass: 'text-orange-700' },
      events: { colorClass: 'border-rose-200 bg-rose-50', labelClass: 'text-rose-700' },
    };
    const typeAccent = typeAnnouncementColors[typeKey] || { colorClass: 'border-amber-200 bg-amber-50', labelClass: 'text-amber-700' };
    item = {
      kind: 'announcement',
      icon: '📢',
      label: 'Latest update',
      text: postSnippet(pinnedOrLatestAnnouncement, 80),
      action: () => onTabChange?.('announcements'),
      colorClass: typeAccent.colorClass,
      labelClass: typeAccent.labelClass,
    };
  } else if ((typeKey === 'events' || typeKey === 'shul' || typeKey === 'neighborhood') && upcomingEvent) {
    item = {
      kind: 'event',
      icon: '📅',
      label: 'Coming up',
      text: upcomingEvent.title || upcomingEvent.name,
      action: () => onTabChange?.('events'),
      colorClass: 'border-blue-200 bg-blue-50',
      labelClass: 'text-blue-700',
    };
  } else if (upcomingEvent) {
    item = {
      kind: 'event',
      icon: '📅',
      label: 'Coming up',
      text: upcomingEvent.title || upcomingEvent.name,
      action: () => onTabChange?.('events'),
      colorClass: 'border-blue-200 bg-blue-50',
      labelClass: 'text-blue-700',
    };
  } else if (featuredResource) {
    item = {
      kind: 'resource',
      icon: '📎',
      label: 'Resource',
      text: featuredResource.title,
      action: () => onTabChange?.('resources'),
      colorClass: 'border-violet-200 bg-violet-50',
      labelClass: 'text-violet-700',
    };
  }

  if (!item) return null;

  return (
    <button
      type="button"
      onClick={item.action}
      className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-opacity active:opacity-80 ${item.colorClass}`}
    >
      <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
      <div className="min-w-0 flex-1">
        <span className={`block text-[10px] font-black uppercase tracking-wide ${item.labelClass}`}>{item.label}</span>
        <span className="block text-[13px] font-bold text-slate-900 leading-snug mt-0.5 line-clamp-1">{item.text}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
    </button>
  );
}

/**
 * Compact inline digest of what's new since last visit.
 * Extracted so joined home can use it without the full WelcomeHub card wrapper.
 */
export function SinceLastVisitDigest({ posts = [], events = [], lastVisitedAt, onTabChange }) {
  const { newAnnouncements, newRegularPosts, newEventCount } = useMemo(() => {
    if (!lastVisitedAt) return { newAnnouncements: 0, newRegularPosts: 0, newEventCount: 0 };
    const since = new Date(lastVisitedAt);
    return {
      newAnnouncements: posts.filter((p) => isAnnouncementPost(p) && new Date(p.created_at || p.created_date) > since).length,
      newRegularPosts: posts.filter((p) => !isAnnouncementPost(p) && new Date(p.created_at || p.created_date) > since).length,
      newEventCount: events.filter((e) => new Date(e.created_at) > since).length,
    };
  }, [lastVisitedAt, posts, events]);

  const total = newAnnouncements + newRegularPosts + newEventCount;
  if (!total) return null;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-blue-600 mb-2">
        <Sparkles className="h-3 w-3" />
        Since your last visit
      </p>
      <div className="space-y-0.5">
        {newAnnouncements > 0 && (
          <button type="button" onClick={() => onTabChange?.('announcements')} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-blue-100/70 active:bg-blue-100">
            <Megaphone className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
            <span className="flex-1 text-[13px] font-bold text-slate-800">{newAnnouncements === 1 ? '1 new announcement' : `${newAnnouncements} new announcements`}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}
        {newRegularPosts > 0 && (
          <button type="button" onClick={() => onTabChange?.('posts')} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-blue-100/70 active:bg-blue-100">
            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
            <span className="flex-1 text-[13px] font-bold text-slate-800">{newRegularPosts === 1 ? '1 new post' : `${newRegularPosts} new posts`}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}
        {newEventCount > 0 && (
          <button type="button" onClick={() => onTabChange?.('events')} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-blue-100/70 active:bg-blue-100">
            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
            <span className="flex-1 text-[13px] font-bold text-slate-800">{newEventCount === 1 ? '1 new event' : `${newEventCount} new events`}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
}
