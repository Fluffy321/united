import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CommunityDetailHeader from './CommunityDetailHeader';
import CommunityPostCard from './CommunityPostCard';
import ClaimModal from './ClaimModal';
import AdminToolsPanel from './AdminToolsPanel';
import BasicInfoSection from './BasicInfoSection';

export default function CommunityDetailView({ communityId, currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState('about');
  const [showClaim, setShowClaim] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const queryClient = useQueryClient();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(r => r[0]),
    enabled: !!communityId
  });

  const { data: org } = useQuery({
    queryKey: ['community-org', community?.claimed_org_id],
    queryFn: () => base44.entities.CommunityOrg.filter({ id: community.claimed_org_id }).then(r => r[0]),
    enabled: !!community?.claimed_org_id
  });

  const { data: followRecord = [] } = useQuery({
    queryKey: ['community-follow', communityId, currentUser?.id],
    queryFn: () => base44.entities.CommunityFollow.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const { data: orgMembership = [] } = useQuery({
    queryKey: ['org-member', community?.claimed_org_id, currentUser?.id],
    queryFn: () => base44.entities.OrgMember.filter({ org_id: community.claimed_org_id, user_id: currentUser.id }),
    enabled: !!community?.claimed_org_id && !!currentUser
  });

  const { data: posts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: () => base44.entities.CommunityPost.filter({ community_id: communityId }, '-created_date', 30),
    enabled: !!communityId
  });

  const isFollowing = followRecord.length > 0;
  const isAdmin = orgMembership.length > 0 || currentUser?.role === 'admin';

  const handleFollow = async () => {
    if (isFollowing) {
      await base44.entities.CommunityFollow.delete(followRecord[0].id);
      if (community) {
        await base44.entities.Community.update(communityId, {
          follower_count: Math.max(0, (community.follower_count || 0) - 1)
        });
      }
      toast.success('Unfollowed');
    } else {
      await base44.entities.CommunityFollow.create({ community_id: communityId, user_id: currentUser.id });
      if (community) {
        await base44.entities.Community.update(communityId, {
          follower_count: (community.follower_count || 0) + 1
        });
      }
      toast.success('Following!');
    }
    queryClient.invalidateQueries({ queryKey: ['community-follow', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community', communityId] });
  };

  if (isLoading || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  const events = posts.filter(p => p.type === 'event');
  const announcements = posts.filter(p => p.type !== 'event');

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-24">
      <CommunityDetailHeader
        community={community}
        isFollowing={isFollowing}
        isAdmin={isAdmin}
        onFollow={handleFollow}
        onClaim={() => setShowClaim(true)}
        onAdminTools={() => setShowAdmin(s => !s)}
        onBack={onBack}
      />

      {/* Admin panel */}
      {showAdmin && isAdmin && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <AdminToolsPanel
            community={community}
            org={org}
            currentUser={currentUser}
            onPostCreated={() => {
              refetchPosts();
              queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
            }}
            onLogoUpdated={() => queryClient.invalidateQueries({ queryKey: ['community', communityId] })}
            onInfoUpdated={() => queryClient.invalidateQueries({ queryKey: ['community', communityId] })}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex">
          {['about', 'posts', 'events'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === t ? 'text-[#0F5ED7] border-b-2 border-[#0F5ED7]' : 'text-slate-500'
              }`}
            >
              {t}{t === 'posts' && announcements.length > 0 ? ` (${announcements.length})` : ''}
              {t === 'events' && events.length > 0 ? ` (${events.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {activeTab === 'about' && (
          <div className="space-y-3">
            {community.is_seeded && !community.is_claimed && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">⚡ Auto-generated listing</p>
                <p className="text-xs text-amber-600 mb-2">This page was automatically created. Claim it to add real info, post announcements, and engage your community — free.</p>
                <button onClick={() => setShowClaim(true)} className="text-xs font-bold text-[#0F5ED7] underline">
                  Claim this page →
                </button>
              </div>
            )}

            <BasicInfoSection community={community} />

            {!community.description_short && !community.description_long && !community.address && !community.phone && !community.website && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <p className="text-sm text-slate-400 italic">No info added yet.</p>
              </div>
            )}

            {!community.is_claimed && !community.is_seeded && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-amber-800 mb-1">Is this your organization?</p>
                <p className="text-xs text-amber-700 mb-2">Claim this page to update info, post announcements, and more — for free.</p>
                <button onClick={() => setShowClaim(true)} className="text-xs font-bold text-[#0F5ED7] underline">
                  Claim this page →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          announcements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-slate-500 text-sm">No posts yet</p>
            </div>
          ) : (
            announcements.map(p => <CommunityPostCard key={p.id} post={p} />)
          )
        )}

        {activeTab === 'events' && (
          events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-slate-500 text-sm">No upcoming events</p>
            </div>
          ) : (
            events.map(p => <CommunityPostCard key={p.id} post={p} />)
          )
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