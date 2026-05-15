import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Globe, Heart, Loader2, Lock, MapPin, MessageCircle, Phone, Pin, Send, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { dataService, incrementCounter } from '@/services';
import {
  getCommunityTabLabel,
  getCommunityTypeConfig,
  getSupportedCommunityTabs,
} from '@/lib/communityTypes';
import { supabase } from '@/api/supabaseClient';
import CommunityHero from './CommunityHero';
import ClaimModal from './ClaimModal';
import CommunityEventsTab from './CommunityEventsTab';
import CommunityResourceLibrary from './CommunityResourceLibrary';
import CommunityStoreTab from './CommunityStoreTab';
import GroupChatSection from './GroupChatSection';
import CommunityAdminCenter, { AppealSubmitModal } from './CommunityAdminCenter';

const CLAIM_COPY = {
  School: { question: 'Is this your school?', cta: 'Claim this school' },
  Shul: { question: 'Is this your shul?', cta: 'Claim this shul' },
  Yeshiva: { question: 'Is this your yeshiva?', cta: 'Claim this yeshiva' },
  Seminary: { question: 'Is this your seminary?', cta: 'Claim this seminary' },
  Organization: { question: 'Is this your organization?', cta: 'Claim this organization' },
  Camp: { question: 'Is this your camp?', cta: 'Claim this camp' },
};

const OPEN_NEED_STATUSES = new Set(['open', 'offered', 'accepted', 'in_progress', 'volunteer_offered']);

function getPostTypeForTab(tab, typeKey) {
  if (tab === 'announcements' || typeKey === 'shul') return 'announcement';
  if (tab === 'questions' || typeKey === 'parents') return 'question';
  if (tab === 'discussions' || typeKey === 'learning') return 'discussion';
  if (typeKey === 'chesed') return 'chesed';
  return 'post';
}

function matchesTab(post, tab) {
  const type = String(post.type || post.post_type || post.category || '').toLowerCase();
  const content = `${post.title || ''} ${post.body || ''} ${post.content || ''}`.toLowerCase();
  if (tab === 'announcements') return type === 'announcement';
  if (tab === 'questions') return type === 'question' || type === 'ask' || content.includes('?');
  if (tab === 'discussions') return type === 'discussion' || type === 'learning';
  return true;
}

export default function CommunityDetailView({ communityId, currentUser, onBack, fallbackCommunity }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [showClaim, setShowClaim] = useState(false);
  const [showAdminCenter, setShowAdminCenter] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [posting, setPosting] = useState(false);
  const queryClient = useQueryClient();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      if (fallbackCommunity) return fallbackCommunity;
      try {
        const result = await dataService.entities.Community.get(communityId);
        if (result) return result;
      } catch {}
      const results = await dataService.entities.Community.filter({ id: communityId });
      return results[0] || null;
    },
    enabled: !!communityId,
  });

  const typeConfig = getCommunityTypeConfig(community || fallbackCommunity || {});

  const { data: membershipRecord = [] } = useQuery({
    queryKey: ['community-membership', communityId, currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser && !!communityId,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: () => dataService.entities.UnifiedPost.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 100),
    enabled: !!communityId,
  });

  // Check if the current (non-member) user was removed and can appeal
  const { data: myRemoval = null } = useQuery({
    queryKey: ['my-community-removal', communityId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_member_removals')
        .select('id, reason_code, removed_at, appeal_allowed, appeal:community_member_appeals(id, status)')
        .eq('community_id', communityId)
        .eq('removed_user_id', currentUser.id)
        .order('removed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!currentUser && !!communityId
      && membershipRecord.length === 0
      && community?.created_by_user_id !== currentUser?.id,
  });

  const { data: openNeeds = [] } = useQuery({
    queryKey: ['community-open-needs', communityId],
    queryFn: () => dataService.entities.MitzvahRequest.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId && typeConfig.key === 'chesed',
  });

  const { data: pinnedPost = null } = useQuery({
    queryKey: ['community-pinned-post', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('posts')
        .select('id, title, content, type, created_at')
        .eq('community_id', communityId)
        .eq('is_pinned', true)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!communityId,
  });

  const membershipRole = String(membershipRecord[0]?.role || '').toLowerCase();
  const isCreator = Boolean(currentUser?.id && community?.created_by_user_id === currentUser.id);
  const isFollowing = membershipRecord.length > 0 || isCreator;
  const isAdmin = currentUser?.role === 'admin' || isCreator || ['admin', 'moderator', 'owner'].includes(membershipRole);
  const canPost = isAdmin || (community?.posting_mode || 'open') === 'open';
  const actualMemberCount = members.length;
  const activeNeeds = openNeeds.filter((need) => OPEN_NEED_STATUSES.has(String(need.status || 'open')));
  const featureCapabilities = {
    events: Boolean(community?.allow_member_events || isAdmin || ['events', 'shul'].includes(typeConfig.key)),
    resources: Boolean(community?.allow_resources || isAdmin || ['learning', 'shul'].includes(typeConfig.key)),
    chat: Boolean(community?.allow_group_chat || isAdmin),
    listings: Boolean(community?.allow_member_listings || isAdmin || typeConfig.key === 'marketplace'),
  };
  const visibleTabs = getSupportedCommunityTabs(community || fallbackCommunity || {}, featureCapabilities);
  const setTab = (tab) => {
    const nextTab = visibleTabs.includes(tab) ? tab : (visibleTabs[0] || 'home');
    setActiveTab(nextTab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', nextTab);
      return next;
    }, { replace: true });
  };

  const { data: events = [] } = useQuery({
    queryKey: ['community-events', communityId],
    queryFn: () => dataService.entities.CommunityEvent.filter({ community_id: communityId }, 'start_date', 50),
    enabled: !!communityId && featureCapabilities.events,
  });

  const handleFollow = async () => {
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }

    try {
      if (isFollowing) {
        if (isCreator) {
          toast.info('Community owners manage their community instead of leaving it.');
          return;
        }
        await dataService.entities.UserCommunity.delete(membershipRecord[0].id);
        if (community) await incrementCounter('communities', 'follower_count', communityId, -1);
        toast.success('Left community');
      } else {
        await dataService.entities.UserCommunity.create({ user_id: currentUser.id, community_id: communityId, role: 'member' });
        if (community) await incrementCounter('communities', 'follower_count', communityId, 1);
        toast.success('Joined!');
      }
    queryClient.invalidateQueries({ queryKey: ['community-membership', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    queryClient.invalidateQueries({ queryKey: ['user-communities', currentUser?.id] });
    } catch {
      toast.error('Could not update membership');
    }
  };

  const submitPost = async () => {
    const text = composeText.trim();
    if (!text) return;
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }

    setPosting(true);
    try {
      await dataService.entities.UnifiedPost.create({
        user_id: currentUser.id,
        community_id: communityId,
        type: getPostTypeForTab(activeTab, typeConfig.key),
        title: text.length > 72 ? text.slice(0, 72) : undefined,
        content: text,
      });
      setComposeText('');
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      toast.success('Posted');
    } catch {
      toast.error('Could not post right now');
    } finally {
      setPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">JU</div>
        <h2 className="text-xl font-bold text-slate-800">Community not found</h2>
        <p className="text-slate-500 text-sm">This community may have been removed or the link is invalid.</p>
        <button onClick={onBack} className="mt-2 bg-blue-600 text-white rounded-full px-6 py-2.5 font-semibold text-sm active:scale-95 transition-all">
          Back to Communities
        </button>
      </div>
    );
  }

  const tabsWithCounts = visibleTabs.map((key) => ({
    key,
    label: getCommunityTabLabel(key),
    count: key === 'announcements'
      ? posts.filter((post) => matchesTab(post, 'announcements')).length
      : key === 'openNeeds'
        ? activeNeeds.length
        : key === 'events'
          ? events.length
        : 0,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
      <CommunityHero
        community={community}
        isFollowing={isFollowing}
        isAdmin={isAdmin}
        isCreator={isCreator}
        onFollow={handleFollow}
        onManage={() => setShowAdminCenter(true)}
        onClaim={() => setShowClaim(true)}
        onBack={onBack}
        eventCount={events.length}
        mitzvahCount={activeNeeds.length}
        actualMemberCount={actualMemberCount}
        postsThisWeek={community.posts_this_week || posts.length}
        members={members}
        currentUser={currentUser}
        onTabChange={setTab}
        typeConfig={typeConfig}
      />

      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {tabsWithCounts.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab.key ? 'text-[#0F5ED7]' : 'text-slate-500'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 text-[10px] bg-[#E0EDFF] text-[#2563EB] rounded-full px-1.5 py-0.5 font-bold">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F5ED7] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appeal banner — shown when user was removed and hasn't yet appealed */}
      {myRemoval && !isFollowing && (() => {
        const appealEntry = myRemoval.appeal?.[0];
        const appealStatus = appealEntry?.status ?? null;
        if (appealStatus === 'approved') return null;
        return (
          <div className={`border-b px-4 py-3 ${
            appealStatus === 'pending'
              ? 'bg-amber-50 border-amber-200'
              : appealStatus === 'denied'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="max-w-2xl mx-auto flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-slate-800">
                  {appealStatus === 'pending'
                    ? 'Your appeal is under review.'
                    : appealStatus === 'denied'
                    ? 'Your appeal was not approved.'
                    : 'You were removed from this community.'}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {appealStatus === 'pending'
                    ? 'The community admin will review your appeal.'
                    : appealStatus === 'denied'
                    ? 'Contact the community admin if you have questions.'
                    : 'You may submit an appeal if you believe this was in error.'}
                </p>
              </div>
              {!appealStatus && myRemoval.appeal_allowed && (
                <button
                  type="button"
                  onClick={() => setShowAppealModal(true)}
                  className="flex-shrink-0 rounded-xl bg-[#2563EB] px-3 py-1.5 text-[12px] font-black text-white"
                >
                  Appeal
                </button>
              )}
            </div>
          </div>
        );
      })()}

      <div className="max-w-2xl mx-auto w-full px-4 pb-28">
        {activeTab === 'home' && (
          <RoutedCommunityHome
            posts={posts}
            activeNeeds={activeNeeds}
            composeText={composeText}
            setComposeText={setComposeText}
            submitPost={submitPost}
            posting={posting}
            onTabChange={setTab}
            pinnedPost={pinnedPost}
            canPost={canPost}
          />
        )}

        {activeTab === 'about' && (
          <AboutTab community={community} typeConfig={typeConfig} onClaim={() => setShowClaim(true)} />
        )}

        {activeTab === 'members' && (
          <SimpleMembersTab members={members} memberCount={actualMemberCount || community.follower_count || 0} />
        )}

        {['posts', 'questions', 'discussions', 'announcements'].includes(activeTab) && (
          <RoutedPostsTab
            posts={posts}
            isLoading={postsLoading}
            activeTab={activeTab}
            typeConfig={typeConfig}
            composeText={composeText}
            setComposeText={setComposeText}
            submitPost={submitPost}
            posting={posting}
            canPost={canPost}
          />
        )}

        {activeTab === 'openNeeds' && (
          <RoutedOpenNeedsTab activeNeeds={activeNeeds} typeConfig={typeConfig} />
        )}

        {activeTab === 'events' && featureCapabilities.events && (
          <CommunityEventsTab
            events={events}
            currentUser={currentUser}
            communityId={communityId}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'resources' && featureCapabilities.resources && (
          <CommunityResourceLibrary
            communityId={communityId}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'listings' && featureCapabilities.listings && (
          <CommunityStoreTab
            communityId={communityId}
            community={community}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'chat' && featureCapabilities.chat && (
          <div className="mt-4 h-[60vh] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <GroupChatSection communityId={communityId} currentUser={currentUser} />
          </div>
        )}
      </div>

      <ClaimModal
        open={showClaim}
        onOpenChange={setShowClaim}
        community={community}
        currentUser={currentUser}
      />
      <CommunityAdminCenter
        community={community}
        currentUser={currentUser}
        open={showAdminCenter}
        onClose={() => setShowAdminCenter(false)}
        onCommunityUpdated={(updated) => {
          if (updated) {
            // Immediately update the cache so tabs/flags reflect without waiting for a refetch.
            queryClient.setQueryData(['community', communityId], updated);
          }
          queryClient.invalidateQueries({ queryKey: ['community', communityId] });
          queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
          queryClient.invalidateQueries({ queryKey: ['communities-list'] });
          queryClient.invalidateQueries({ queryKey: ['community-pinned-post', communityId] });
        }}
        onDeleted={() => {
          setShowAdminCenter(false);
          onBack?.();
        }}
      />
      {showAppealModal && myRemoval && (
        <AppealSubmitModal
          removal={myRemoval}
          communityName={community?.name}
          onClose={() => setShowAppealModal(false)}
          onSubmitted={() => {
            setShowAppealModal(false);
            queryClient.invalidateQueries({ queryKey: ['my-community-removal', communityId, currentUser?.id] });
          }}
        />
      )}
    </div>
  );
}

function ComposerBox({ typeConfig, composeText, setComposeText, submitPost, posting }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-950">{typeConfig.primaryCta}</p>
          <p className="text-[11px] font-semibold text-slate-500">{typeConfig.tagline}</p>
        </div>
      </div>
      <textarea
        value={composeText}
        onChange={(event) => setComposeText(event.target.value)}
        rows={3}
        placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
      />
      <div className="mt-3 flex justify-end">
        <button
          onClick={submitPost}
          disabled={posting || !composeText.trim()}
          className={`motion-press inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}
        >
          <Send className="h-3.5 w-3.5" />
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

function RoutedCommunityHome({ typeConfig, posts, activeNeeds, composeText, setComposeText, submitPost, posting, onTabChange, pinnedPost, canPost }) {
  const Icon = typeConfig.icon;
  return (
    <div className="space-y-4 pt-4">
      <div className={`rounded-3xl border p-5 ${typeConfig.softClass}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-black text-slate-950">{typeConfig.label} hub</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{typeConfig.tagline}</p>
          </div>
        </div>
      </div>

      {typeConfig.key === 'chesed' && (
        <button
          onClick={() => onTabChange('openNeeds')}
          className="w-full rounded-2xl border border-emerald-100 bg-white p-4 text-left shadow-sm"
        >
          <p className="text-sm font-black text-slate-950">Open chesed needs</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-500">
            {activeNeeds.length ? `${activeNeeds.length} request${activeNeeds.length === 1 ? '' : 's'} connected to this community.` : 'No open needs connected here yet.'}
          </p>
        </button>
      )}

      {pinnedPost && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <Pin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-wide mb-0.5">Pinned</p>
            <p className="text-[13px] font-semibold text-slate-800 line-clamp-2">
              {pinnedPost.title || pinnedPost.content || ''}
            </p>
          </div>
        </div>
      )}

      {canPost ? (
        <ComposerBox
          typeConfig={typeConfig}
          composeText={composeText}
          setComposeText={setComposeText}
          submitPost={submitPost}
          posting={posting}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <p className="text-[13px] font-semibold text-slate-500">Posting is restricted to community admins.</p>
        </div>
      )}

      <RoutedPostsList posts={posts.slice(0, 3)} typeConfig={typeConfig} emptyCompact />
    </div>
  );
}

function RoutedPostsTab({ posts, isLoading, activeTab, typeConfig, composeText, setComposeText, submitPost, posting, canPost }) {
  const filteredPosts = posts.filter((post) => matchesTab(post, activeTab));
  return (
    <div className="space-y-4 pt-4">
      {canPost ? (
        <ComposerBox
          typeConfig={typeConfig}
          composeText={composeText}
          setComposeText={setComposeText}
          submitPost={submitPost}
          posting={posting}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <p className="text-[13px] font-semibold text-slate-500">Posting is restricted to community admins.</p>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      ) : (
        <RoutedPostsList posts={filteredPosts} typeConfig={typeConfig} />
      )}
    </div>
  );
}

function RoutedPostsList({ posts, typeConfig, emptyCompact = false }) {
  if (!posts.length) {
    if (emptyCompact) return null;
    const Icon = typeConfig.icon;
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="mt-4 text-[15px] font-black text-slate-900">{typeConfig.emptyTitle}</p>
        <p className="mt-1 text-[13px] font-semibold leading-6 text-slate-500">{typeConfig.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article key={post.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${typeConfig.badgeClass}`}>
              {post.type || post.post_type || typeConfig.label}
            </span>
            {post.created_date && <span className="text-[11px] font-semibold text-slate-400">Community post</span>}
          </div>
          {post.title && <h3 className="text-[15px] font-black text-slate-950">{post.title}</h3>}
          <p className="mt-1 text-sm leading-6 text-slate-600">{post.body || post.content}</p>
        </article>
      ))}
    </div>
  );
}

function RoutedOpenNeedsTab({ activeNeeds, typeConfig }) {
  if (!activeNeeds.length) {
    const Icon = typeConfig.icon;
    return (
      <div className="pt-4">
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          <p className="mt-4 text-[15px] font-black text-slate-900">{typeConfig.emptyTitle}</p>
          <p className="mt-1 text-[13px] font-semibold leading-6 text-slate-500">{typeConfig.emptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.status || 'open'}</span>
          <h3 className="mt-3 text-[15px] font-black text-slate-950">{need.title}</h3>
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

function SimpleMembersTab({ members, memberCount }) {
  return (
    <div className="space-y-3 pt-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">{memberCount.toLocaleString()} members</p>
            <p className="text-[12px] font-semibold text-slate-500">Membership is backed by community_memberships.</p>
          </div>
        </div>
      </div>
      {members.slice(0, 20).map((member) => (
        <div key={member.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-bold text-slate-900">{member.user_name || member.user_id || 'Community member'}</p>
          <p className="text-[12px] font-semibold text-slate-400">{member.role || 'member'}</p>
        </div>
      ))}
    </div>
  );
}

function AboutTab({ community, typeConfig, onClaim }) {
  const type = community.type || community.verified_type || typeConfig.label;
  const claim = CLAIM_COPY[type] || { question: 'Is this your community?', cta: 'Claim this page' };

  return (
    <div className="space-y-3 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> About this {typeConfig.label.toLowerCase()}
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{community.description_long || community.description_short || community.description || typeConfig.cardFallback}</p>
      </div>

      {(community.address || community.phone || community.website) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
          {community.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(community.address)}`} target="_blank" rel="noreferrer"
              className="flex items-start gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{community.address}</span>
            </a>
          )}
          {community.phone && (
            <a href={`tel:${community.phone}`} className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{community.phone}</span>
            </a>
          )}
          {community.website && (
            <a href={community.website?.startsWith('http') ? community.website : `https://${community.website}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="break-all">{community.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>
          )}
        </div>
      )}

      {community.rules && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Community Guidelines
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{community.rules}</p>
        </div>
      )}

      {community.donation_url && (
        <a
          href={community.donation_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-[14px] active:scale-95 transition-all"
        >
          <Heart className="w-4 h-4 fill-white" />
          Donate to {community.name}
        </a>
      )}

      {community.verified_plan && community.verified_plan !== 'none' && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-[13px] text-blue-700 font-medium">
          <Shield className="w-4 h-4 flex-shrink-0" />
          Verified {community.type || 'Community'} on JUnited
        </div>
      )}

      {!community.is_claimed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-amber-800 mb-1">{claim.question}</p>
          <p className="text-xs text-amber-700 mb-2">Manage announcements, posts, and your community hub.</p>
          <button onClick={onClaim} className="text-xs font-bold text-[#0F5ED7] underline">
            {claim.cta} →
          </button>
        </div>
      )}
    </div>
  );
}
