import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  MessageCircle,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dataService } from '@/services';
import { getCommunityTabLabel, getCommunityTypeConfig, getSupportedCommunityTabs } from '@/lib/communityTypes';

function getPostTypeForTab(activeTab, typeKey) {
  if (activeTab === 'announcements' || typeKey === 'shul') return 'announcement';
  if (activeTab === 'questions' || typeKey === 'parents') return 'question';
  if (activeTab === 'discussions' || typeKey === 'learning') return 'discussion';
  if (typeKey === 'chesed') return 'chesed';
  return 'post';
}

function matchesPostFilter(post, filter) {
  if (!filter) return true;
  const type = String(post.type || post.post_type || post.category || '').toLowerCase();
  const text = `${post.title || ''} ${post.body || ''} ${post.content || ''}`.toLowerCase();
  if (filter === 'question') return ['question', 'ask'].includes(type) || text.includes('?');
  if (filter === 'discussion') return ['discussion', 'learning'].includes(type);
  if (filter === 'announcement') return ['announcement', 'pinned'].includes(type);
  return type === filter;
}

export default function CommunityHubDetail({ community, currentUser, initialComposePrompt = '', onBack, onToggleJoin, joiningId }) {
  const typeConfig = getCommunityTypeConfig(community);
  const Icon = typeConfig.icon;
  const tabs = getSupportedCommunityTabs(community, {
    events: false,
    resources: false,
    chat: false,
    listings: false,
  });
  const [activeTab, setActiveTab] = useState(tabs[0] || 'home');
  const [composeText, setComposeText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const queryClient = useQueryClient();
  const accent = typeConfig.accent;
  const prompts = community.quickActions || typeConfig.prompts;
  const isJoining = joiningId === community.id;
  const isSensitive = community.communityType === 'support' || typeConfig.key === 'chesed';
  const memberVisibility = isSensitive ? 'Hidden unless opted in' : community.privacy || 'Public';
  const isSeedCommunity = String(community.id || '').startsWith('seed-');

  useEffect(() => {
    if (!initialComposePrompt) return;
    setComposeText(initialComposePrompt);
    setShowCompose(true);
  }, [initialComposePrompt, community.id]);

  const { data: realPosts = [] } = useQuery({
    queryKey: ['community-hub-posts', community.id],
    queryFn: () => dataService.entities.UnifiedPost.filter({ community_id: community.id }, '-created_date', 50),
    enabled: Boolean(community.id) && !isSeedCommunity,
    staleTime: 30000,
  });

  const { data: openNeeds = [] } = useQuery({
    queryKey: ['community-hub-open-needs', community.id],
    queryFn: () => dataService.entities.MitzvahRequest.filter({ community_id: community.id }, '-created_date', 30),
    enabled: Boolean(community.id) && !isSeedCommunity && typeConfig.key === 'chesed',
    staleTime: 30000,
  });

  const visiblePosts = useMemo(() => {
    if (realPosts.length > 0) return realPosts;
    return isSeedCommunity ? (community.posts || []) : [];
  }, [community.posts, isSeedCommunity, realPosts]);

  const openCompose = (prefill = '') => {
    setComposeText(prefill);
    setShowCompose(true);
  };

  const submitPost = async () => {
    const text = composeText.trim();
    if (!text) return;
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }
    if (isSeedCommunity) {
      toast.info('Preview communities show sample content only. Open a real community to post.');
      setShowCompose(false);
      return;
    }

    try {
      await dataService.entities.UnifiedPost.create({
        user_id: currentUser.id,
        community_id: community.id,
        type: getPostTypeForTab(activeTab, typeConfig.key),
        title: text.length > 72 ? text.slice(0, 72) : undefined,
        content: text,
      });
      await queryClient.invalidateQueries({ queryKey: ['community-hub-posts', community.id] });
      setComposeText('');
      setShowCompose(false);
      toast.success('Posted');
    } catch {
      toast.error('Could not post right now');
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 pb-8 sm:px-4 sm:pt-4">
        <button
          onClick={onBack}
          className="mb-3 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Communities
        </button>

        {/* Header card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Cover / gradient banner */}
          <div
            className={`relative h-24 bg-gradient-to-br ${accent}`}
            style={
              community.cover_url
                ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: typeConfig.coverPattern }
            }
          >
            {community.cover_url && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />}
            {!community.cover_url && (
              <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
                <Icon className="h-6 w-6" />
              </div>
            )}
            {/* Avatar overlapping banner */}
            <div
              className={`absolute -bottom-5 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-[14px] font-black text-white shadow-md ring-2 ring-white`}
            >
              {community.logo_url ? (
                <img src={community.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <Icon className="h-6 w-6" />
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black leading-tight text-slate-950">{community.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {community.category && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${typeConfig.badgeClass}`}>
                    <Icon className="h-3 w-3" />
                    {typeConfig.label}
                  </span>
                )}
                {community.location && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="h-3 w-3" />
                    {community.location}
                  </span>
                )}
                {community.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    <BadgeCheck className="h-3 w-3" />
                    Official
                  </span>
                )}
                {community.trending && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onToggleJoin?.(isSensitive ? { incognito: true } : {})}
              disabled={isJoining}
              className={`h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${
                community.joined
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isJoining ? '...' : community.joined ? 'Leave' : isSensitive ? 'Join Incognito' : 'Join'}
            </button>
          </div>

          <div className="px-4 pb-4">
            <p className="text-sm font-semibold leading-relaxed text-slate-600">
              {community.valueHook || community.description || typeConfig.cardFallback}
            </p>
            {community.description && community.valueHook && (
              <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-500">{community.description}</p>
            )}
            <div className={`mt-3 rounded-2xl border px-3 py-2 ${typeConfig.softClass}`}>
              <p className="text-[11px] font-black uppercase tracking-wide opacity-80">This space is for</p>
              <p className="mt-0.5 text-[13px] font-bold leading-5 text-slate-800">{typeConfig.tagline}</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              {(community.memberCount || 0).toLocaleString()} members
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {community.postsToday || 0} posts today
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
              <Sparkles className="h-3.5 w-3.5" />
              {community.activeNow || 0} active now
            </span>
            {community.joined && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                <Shield className="h-3.5 w-3.5" />
                You're a member
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              {community.privacy || 'Public'}
            </span>
          </div>

          {/* Tabs */}
          <div className="mobile-scroll-x flex border-t border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-3 text-[13px] font-bold transition ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {getCommunityTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-3">
          {activeTab === 'home' && (
            <HomeTab
              community={community}
              typeConfig={typeConfig}
              posts={visiblePosts}
              openNeeds={openNeeds}
              prompts={prompts}
              onCompose={openCompose}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'openNeeds' && (
            <OpenNeedsTab openNeeds={openNeeds} typeConfig={typeConfig} onCompose={openCompose} />
          )}
          {activeTab === 'questions' && (
            <PostsTab community={community} typeConfig={typeConfig} prompts={prompts} posts={visiblePosts} onCompose={openCompose} filter="question" />
          )}
          {activeTab === 'discussions' && (
            <PostsTab community={community} typeConfig={typeConfig} prompts={prompts} posts={visiblePosts} onCompose={openCompose} filter="discussion" />
          )}
          {activeTab === 'announcements' && (
            <PostsTab community={community} typeConfig={typeConfig} prompts={prompts} posts={visiblePosts} onCompose={openCompose} filter="announcement" />
          )}
          {activeTab === 'posts' && (
            <PostsTab community={community} typeConfig={typeConfig} prompts={prompts} posts={visiblePosts} onCompose={openCompose} />
          )}
          {activeTab === 'about' && (
            <AboutTab community={community} typeConfig={typeConfig} />
          )}
          {activeTab === 'members' && (
            <MembersTab community={community} memberVisibility={memberVisibility} />
          )}
        </div>
      </section>

      {showCompose && (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{typeConfig.primaryCta} in {community.name}</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              autoFocus
              rows={4}
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-colors placeholder:text-slate-400"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCompose(false)}
                className="h-9 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPost}
                disabled={!composeText.trim()}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-40 active:scale-[0.98]"
              >
                <Send className="h-3.5 w-3.5" />
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function HomeTab({ community, typeConfig, posts, openNeeds, prompts, onCompose, onTabChange }) {
  const featuredPosts = posts.slice(0, 3);
  const Icon = typeConfig.icon;

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border p-4 ${typeConfig.softClass}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white shadow-sm`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-950">{typeConfig.primaryCta}</p>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">{typeConfig.emptyBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => onCompose(prompts[0] || '')}
                className={`motion-press rounded-xl bg-gradient-to-br ${typeConfig.accent} px-3 py-2 text-xs font-black text-white`}
              >
                {typeConfig.primaryCta}
              </button>
              {typeConfig.secondaryCta && (
                <button
                  onClick={() => onCompose(prompts[1] || '')}
                  className="motion-press rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                >
                  {typeConfig.secondaryCta}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {typeConfig.key === 'chesed' && (
        <OpenNeedsPreview openNeeds={openNeeds} onTabChange={() => onTabChange('openNeeds')} />
      )}

      <PostsTab
        community={community}
        typeConfig={typeConfig}
        prompts={prompts}
        posts={featuredPosts}
        onCompose={onCompose}
        compact
      />
    </div>
  );
}

function OpenNeedsPreview({ openNeeds, onTabChange }) {
  const activeNeeds = (openNeeds || []).filter((need) => ['open', 'offered', 'accepted', 'in_progress'].includes(String(need.status || 'open')));

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">Open chesed needs</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">
            {activeNeeds.length > 0 ? `${activeNeeds.length} request${activeNeeds.length === 1 ? '' : 's'} connected to this community.` : 'No open needs are connected here yet.'}
          </p>
        </div>
        <button onClick={onTabChange} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
          View
        </button>
      </div>
    </div>
  );
}

function OpenNeedsTab({ openNeeds, typeConfig, onCompose }) {
  const activeNeeds = (openNeeds || []).filter((need) => ['open', 'offered', 'accepted', 'in_progress'].includes(String(need.status || 'open')));

  if (activeNeeds.length === 0) {
    return (
      <TypeEmptyState
        typeConfig={typeConfig}
        onCompose={() => onCompose(typeConfig.prompts[0] || '')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.category || 'Chesed'}</span>
            <span className="text-[11px] font-semibold text-slate-400">{need.status || 'open'}</span>
          </div>
          <h3 className="text-[15px] font-black text-slate-950">{need.title}</h3>
          {need.description && <p className="mt-1 text-sm leading-6 text-slate-600">{need.description}</p>}
          {(need.location_label || need.neighborhood) && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {need.location_label || need.neighborhood}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function TypeEmptyState({ typeConfig, onCompose }) {
  const Icon = typeConfig.icon;
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white shadow-sm`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-black text-slate-900">{typeConfig.emptyTitle}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-500">{typeConfig.emptyBody}</p>
      <button
        onClick={onCompose}
        className={`motion-press mt-4 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 py-2 text-xs font-black text-white`}
      >
        {typeConfig.primaryCta}
      </button>
    </div>
  );
}

function PostsTab({ community, typeConfig, prompts, posts, onCompose, filter, compact = false }) {
  const isOfficial = community.communityType === 'official';
  const isPublic = (community.privacy || 'Public') === 'Public';
  const shouldHideFeed = !community.joined && !isOfficial && !isPublic;
  const filteredPosts = (posts || []).filter((post) => matchesPostFilter(post, filter));

  if (shouldHideFeed) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <MessageCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <h3 className="text-base font-bold text-slate-800">Join to see posts</h3>
        <p className="mt-1 text-sm text-slate-500">Members can post, comment, and participate in this community.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!community.joined && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
          {isOfficial
            ? 'Official feed is open to read. Join to personalize replies, saves, and follow-up activity.'
            : 'This public feed is open to read. Join to participate and keep it in your identity stack.'}
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-700">
          <Sparkles className="h-4 w-4" />
          Suggested prompt
        </div>
        <h3 className="mt-2 text-lg font-black leading-6 text-slate-950">
          {community.dailyPrompt || prompts[0] || typeConfig.primaryCta}
        </h3>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          onClick={() => onCompose('')}
          className="flex w-full items-center gap-3 pb-4 border-b border-slate-100 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <MessageCircle className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-400">{typeConfig.primaryCta}...</p>
        </button>
        <div className="mt-4 space-y-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onCompose(prompt)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-[13px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 active:scale-[0.99]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {(community.announcements?.length > 0 || community.updates?.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {community.announcements?.length > 0 && (
            <InfoPanel title="Pinned updates" items={community.announcements} />
          )}
          {community.updates?.length > 0 && (
            <InfoPanel title="Live pulse" items={community.updates} />
          )}
        </div>
      )}

      {filteredPosts.map((seedPost) => (
        <article key={seedPost.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">{seedPost.type || seedPost.post_type || 'Post'}</span>
            {(seedPost.meta || seedPost.created_date) && <span className="text-[11px] font-semibold text-slate-400">{seedPost.meta || 'Community post'}</span>}
          </div>
          <h3 className="text-[15px] font-black text-slate-950">{seedPost.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{seedPost.body || seedPost.content}</p>
          <p className="mt-3 text-xs font-bold text-slate-500">Posted by {seedPost.author || seedPost.author_name || seedPost.user_name || 'Community member'}</p>
        </article>
      ))}

      {filteredPosts.length === 0 && !compact && (
        <TypeEmptyState typeConfig={typeConfig} onCompose={() => onCompose(prompts[0] || '')} />
      )}
    </div>
  );
}

function MembersTab({ community, memberVisibility }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{(community.memberCount || 0).toLocaleString()} members</p>
          <p className="text-xs text-slate-500">in this community</p>
        </div>
      </div>

      {community.joined ? (
        <p className="mt-4 text-sm text-slate-500">
          You're a member of this community. Visibility: {memberVisibility}.
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Join this community to connect with its members.
        </p>
      )}
    </div>
  );
}

function AboutTab({ community, typeConfig }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-black text-slate-900">About this {typeConfig.label.toLowerCase()}</h3>
        <p className="text-sm leading-relaxed text-slate-600">{community.description || typeConfig.cardFallback}</p>
      </div>

      {community.resources?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-black text-slate-900">Useful resources</h3>
          <div className="flex flex-wrap gap-2">
            {community.resources.map((resource) => (
              <span key={resource} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                {resource}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-slate-900">Details</h3>
        <div className="space-y-2.5">
          {community.category && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Type</span>
              <span className="font-semibold text-slate-700">{typeConfig.label}</span>
            </div>
          )}
          {community.location && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Location</span>
              <span className="font-semibold text-slate-700">{community.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Privacy</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              {community.privacy || 'Public'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Identity</span>
            <span className="font-semibold text-slate-700">{community.communityType || 'user-created'}</span>
          </div>
          {community.supportsAnonymousPosting && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Anon</span>
              <span className="inline-flex items-center gap-1 font-semibold text-violet-700">
                <EyeOff className="h-3.5 w-3.5" />
                Anonymous posting enabled
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Members</span>
            <span className="font-semibold text-slate-700">{(community.memberCount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ title, items }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-black text-slate-900">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-[13px] font-semibold leading-5 text-slate-700">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
