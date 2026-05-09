import React, { useState } from 'react';
import { dataService, incrementCounter } from '@/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Phone, Globe, Clock, BookOpen, Heart, Shield } from 'lucide-react';
import { toast } from 'sonner';
import CommunityHero from './CommunityHero';
import ClaimModal from './ClaimModal';

// Type-aware claim copy
const CLAIM_COPY = {
  School: { question: 'Is this your school?', cta: 'Claim this school' },
  Shul: { question: 'Is this your shul?', cta: 'Claim this shul' },
  Yeshiva: { question: 'Is this your yeshiva?', cta: 'Claim this yeshiva' },
  Seminary: { question: 'Is this your seminary?', cta: 'Claim this seminary' },
  Organization: { question: 'Is this your organization?', cta: 'Claim this organization' },
  Camp: { question: 'Is this your camp?', cta: 'Claim this camp' },
};

function AboutTab({ community, onClaim }) {
  const type = community.type || community.verified_type || 'Other';
  const claim = CLAIM_COPY[type] || { question: 'Is this your community?', cta: 'Claim this page' };
  const isSchoolType = ['School', 'Yeshiva', 'Seminary'].includes(type);
  const isShul = type === 'Shul';

  return (
    <div className="space-y-3 pt-4">
      {/* Description */}
      {(community.description_long || community.description_short) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm text-slate-700 leading-relaxed">{community.description_long || community.description_short}</p>
        </div>
      )}

      {/* Type-specific info */}
      {isShul && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          {community.rabbi_or_principal && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-slate-400">👤</span>
              <span><strong>Rabbi:</strong> {community.rabbi_or_principal}</span>
            </div>
          )}
          {community.hours && (
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Services Schedule
              </p>
              <p className="text-sm text-slate-600 whitespace-pre-line">{community.hours}</p>
            </div>
          )}
          {!community.hours && (
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Services
              </p>
              <div className="space-y-1.5">
                {['Shacharis', 'Mincha/Maariv', 'Shabbos'].map(s => (
                  <div key={s} className="bg-slate-50 rounded-lg px-3 py-2 text-[12px] text-slate-500">{s} — see website for times</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isSchoolType && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2.5">
          {community.rabbi_or_principal && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-slate-400">👤</span>
              <span><strong>Head of School:</strong> {community.rabbi_or_principal}</span>
            </div>
          )}
          {community.hours && (
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span><strong>Office Hours:</strong> {community.hours}</span>
            </div>
          )}
          {community.website && (
            <div className="flex flex-wrap gap-2 pt-1">
              {['Parent Portal', 'Apply Now', 'Tuition Info'].map(link => (
                <a key={link} href={community.website?.startsWith('http') ? community.website : `https://${community.website}`}
                  target="_blank" rel="noreferrer"
                  className="text-[12px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors"
                >
                  {link} →
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact info */}
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

      {/* Rules */}
      {community.rules && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Community Guidelines
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{community.rules}</p>
        </div>
      )}

      {/* Donate button */}
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

      {/* Verified community callout */}
      {community.verified_plan && community.verified_plan !== 'none' && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-[13px] text-blue-700 font-medium">
          <Shield className="w-4 h-4 flex-shrink-0" />
          Verified {community.type || 'Community'} on JUnited
        </div>
      )}

      {/* Claim CTA */}
      {!community.is_claimed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-amber-800 mb-1">{claim.question}</p>
          <p className="text-xs text-amber-700 mb-2">Manage announcements, events, and your community hub — free.</p>
          <button onClick={onClaim} className="text-xs font-bold text-[#0F5ED7] underline">
            {claim.cta} →
          </button>
        </div>
      )}
    </div>
  );
}
import CommunityHomepage from './CommunityHomepage';
import CommunityFeedTab from './CommunityFeedTab';
import CommunityAnnouncementsTab from './CommunityAnnouncementsTab';
import CommunityEventsTab from './CommunityEventsTab';
import CommunityMitzvahTab from './CommunityMitzvahTab';
import MembersListTab from './MembersListTab';
import GroupChatSection from './GroupChatSection';
import CommunityResourceLibrary from './CommunityResourceLibrary';
import CommunityHealthDashboard from './CommunityHealthDashboard';
import CommunityStoreTab from './CommunityStoreTab';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'members', label: 'Members' },
  { key: 'feed', label: 'Feed' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'events', label: 'Events' },
  { key: 'mitzvah', label: 'Mitzvah' },
  { key: 'chat', label: 'Chat' },
  { key: 'resources', label: 'Resources' },
];

export default function CommunityDetailView({ communityId, currentUser, onBack, fallbackCommunity }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showClaim, setShowClaim] = useState(false);
  const queryClient = useQueryClient();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      if (fallbackCommunity) return fallbackCommunity;
      // Try direct get first, fall back to filter
      try {
        const result = await dataService.entities.Community.get(communityId);
        if (result) return result;
      } catch {}
      const results = await dataService.entities.Community.filter({ id: communityId });
      return results[0] || null;
    },
    enabled: !!communityId
  });

  const { data: followRecord = [] } = useQuery({
    queryKey: ['community-follow', communityId, currentUser?.id],
    queryFn: () => dataService.entities.CommunityFollow.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: () => dataService.entities.CommunityPost.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['community-events', communityId],
    queryFn: () => dataService.entities.CommunityEvent.filter({ community_id: communityId }, 'start_date', 50),
    enabled: !!communityId
  });

  const { data: opportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ['community-opportunities', communityId],
    queryFn: () => dataService.entities.MitzvahOpportunity.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId
  });

  const { data: communityStats } = useQuery({
    queryKey: ['community-stats', communityId],
    queryFn: async () => {
      const res = await dataService.functions.invoke('getCommunityImpact', { community_id: communityId });
      return res.data;
    },
    enabled: !!communityId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 100),
    enabled: !!communityId
  });

  const isFollowing = followRecord.length > 0;
  const isAdmin = currentUser?.role === 'admin';
  const isPremium = community?.is_verified === true;
  const actualMemberCount = members.length;

  const handleFollow = async () => {
    if (isFollowing) {
      await dataService.entities.CommunityFollow.delete(followRecord[0].id);
      const memberships = await dataService.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id });
      for (const m of memberships) await dataService.entities.UserCommunity.delete(m.id);
      if (community) await incrementCounter('communities', 'follower_count', communityId, -1);
      toast.success('Unfollowed');
    } else {
      await dataService.entities.CommunityFollow.create({ community_id: communityId, user_id: currentUser.id });
      const existing = await dataService.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id });
      if (existing.length === 0) {
        await dataService.entities.UserCommunity.create({ user_id: currentUser.id, community_id: communityId, role: 'Member' });
      }
      if (community) await incrementCounter('communities', 'follower_count', communityId, 1);
      toast.success('Joined!');
    }
    queryClient.invalidateQueries({ queryKey: ['community-follow', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    queryClient.invalidateQueries({ queryKey: ['user-communities', currentUser?.id] });
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
        <div className="text-5xl">🏘️</div>
        <h2 className="text-xl font-bold text-slate-800">Community not found</h2>
        <p className="text-slate-500 text-sm">This community may have been removed or the link is invalid.</p>
        <button onClick={onBack} className="mt-2 bg-blue-600 text-white rounded-full px-6 py-2.5 font-semibold text-sm active:scale-95 transition-all">
          Back to Communities
        </button>
      </div>
    );
  }

  const announcementCount = posts.filter(p => p.type === 'announcement' || p.post_type === 'announcement').length;
  const eventCount = events.length;
  const mitzvahCount = opportunities.filter(o => o.is_active !== false).length;

  // Extra tabs for verified (premium) communities
  let visibleTabs = [...TABS];
  if (isPremium) visibleTabs = [...visibleTabs, { key: 'store', label: '🏪 Store' }];
  if (isAdmin && isPremium) visibleTabs = [...visibleTabs, { key: 'health', label: '🧠 Health' }];

  const tabsWithCounts = visibleTabs.map(t => ({
    ...t,
    count: t.key === 'announcements' ? announcementCount
         : t.key === 'events' ? eventCount
         : t.key === 'mitzvah' ? mitzvahCount
         : 0
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
      <CommunityHero
        community={community}
        isFollowing={isFollowing}
        isAdmin={isAdmin}
        onFollow={handleFollow}
        onClaim={() => setShowClaim(true)}
        onBack={onBack}
        eventCount={events.length}
        mitzvahCount={opportunities.filter(o => o.is_active !== false).length}
        actualMemberCount={actualMemberCount}
        postsThisWeek={community.posts_this_week || posts.filter(p => {
          const d = new Date(p.created_date);
          return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
        }).length}
        members={members}
        currentUser={currentUser}
        onTabChange={setActiveTab}
      />

      {/* Scrollable tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {tabsWithCounts.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === t.key ? 'text-[#0F5ED7]' : 'text-slate-500'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-1 text-[10px] bg-[#E0EDFF] text-[#2563EB] rounded-full px-1.5 py-0.5 font-bold">
                    {t.count}
                  </span>
                )}
                {activeTab === t.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F5ED7] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pb-28">
        {activeTab === 'home' && (
          <CommunityHomepage
            community={community}
            posts={posts}
            events={events}
            opportunities={opportunities}
            onTabChange={setActiveTab}
            stats={communityStats}
            members={members}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'about' && (
          <AboutTab community={community} onClaim={() => setShowClaim(true)} />
        )}

        {activeTab === 'members' && (
          <MembersListTab communityId={communityId} />
        )}

        {activeTab === 'feed' && (
          <CommunityFeedTab
            posts={posts}
            isLoading={postsLoading}
            community={community}
            currentUser={currentUser}
            isAdmin={isAdmin}
            members={members}
            onNewPost={(post) => queryClient.setQueryData(['community-posts', communityId], prev => [post, ...(prev || [])])}
          />
        )}

        {activeTab === 'announcements' && (
          <CommunityAnnouncementsTab
            announcements={posts.filter(p => p.type === 'announcement' || p.post_type === 'announcement')}
            allPosts={posts}
            community={community}
            currentUser={currentUser}
            memberCount={actualMemberCount}
          />
        )}

        {activeTab === 'events' && (
          <CommunityEventsTab
            events={events}
            isLoading={eventsLoading}
            currentUser={currentUser}
            communityId={communityId}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'mitzvah' && (
          <CommunityMitzvahTab opportunities={opportunities} isLoading={oppsLoading} />
        )}

        {activeTab === 'chat' && (
          <div className="pt-4 h-[600px]">
            <GroupChatSection communityId={communityId} currentUser={currentUser} />
          </div>
        )}

        {activeTab === 'resources' && (
          <CommunityResourceLibrary communityId={communityId} currentUser={currentUser} isAdmin={isAdmin} />
        )}

        {activeTab === 'store' && isPremium && (
          <CommunityStoreTab
            communityId={communityId}
            community={community}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'health' && isAdmin && isPremium && (
          <CommunityHealthDashboard communityId={communityId} community={community} />
        )}
      </div>

      <ClaimModal
        open={showClaim}
        onOpenChange={setShowClaim}
        community={community}
        currentUser={currentUser}
      />
    </div>
  );
}