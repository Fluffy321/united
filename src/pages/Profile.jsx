import React, { useState, useEffect } from 'react';
import { Loader2, Settings, Share2, UserRound } from 'lucide-react';
import { dataService, findOrCreateDirectConversation, friendsService } from '@/services';
import { FRIEND_STATUS } from '@/services/friendsService';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReportModal from '@/components/common/ReportModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import QueryError from '@/components/common/QueryError';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';
import ModernProfileHeader from '@/components/profile/ModernProfileHeader.jsx';
import ModernStatsRow from '@/components/profile/ModernStatsRow.jsx';
import ModernActionButtons from '@/components/profile/ModernActionButtons.jsx';
import StreakCard from '@/components/profile/StreakCard.jsx';
import InterestsSection from '@/components/profile/InterestsSection.jsx';
import ImpactSection from '@/components/profile/ImpactSection.jsx';
import GetStartedCard from '@/components/profile/GetStartedCard.jsx';
import BadgesSection from '@/components/profile/BadgesSection.jsx';
import MitzvahJourneySection from '@/components/profile/MitzvahJourneySection.jsx';
import CommunitiesSection from '@/components/profile/CommunitiesSection.jsx';
import { COMMUNITIES_ENABLED } from '@/config/features';
import RecentPostsSection from '@/components/profile/RecentPostsSection.jsx';
import SavedPostsSection from '@/components/profile/SavedPostsSection.jsx';
import InterestPickerModal from '@/components/profile/InterestPickerModal.jsx';
import FriendsHub from '@/components/profile/FriendsHub.jsx';
import DestinationHeader from '@/components/layout/DestinationHeader';

export default function Profile() {
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [showFriendsHub, setShowFriendsHub] = useState(false);

  // Relationship state: { status: FRIEND_STATUS.*, requestId: string|null }
  const [relationship, setRelationship] = useState({ status: FRIEND_STATUS.NONE, requestId: null });
  const [friendLoading, setFriendLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setProfileLoadError(false);
    loadProfile();
  }, [searchParams, currentUser?.id]);

  const loadProfile = async () => {
    try {
      const profileId = searchParams.get('id');
      if (!currentUser) return;

      if (profileId && profileId !== currentUser.id) {
        try {
          const users = await dataService.entities.User.filter({ id: profileId });
          if (users[0]) {
            setProfileUser(users[0]);
            setIsOwnProfile(false);
          } else {
            setProfileUser(currentUser);
            setIsOwnProfile(true);
          }
        } catch {
          setProfileUser(currentUser);
          setIsOwnProfile(true);
        }
      } else {
        setProfileUser(currentUser);
        setIsOwnProfile(true);
      }
    } catch (e) {
      console.warn('Profile: error loading profile', e?.message);
      setProfileLoadError(true);
    }
  };

  // Load relationship when viewing someone else's profile
  useEffect(() => {
    if (!currentUser?.id || !profileUser?.id || isOwnProfile) return;
    friendsService
      .getRelationship(currentUser.id, profileUser.id)
      .then(setRelationship)
      .catch(() => setRelationship({ status: FRIEND_STATUS.NONE, requestId: null }));
  }, [currentUser?.id, profileUser?.id, isOwnProfile]);

  const { data: unifiedPosts = [] } = useQuery({
    queryKey: ['user-posts', profileUser?.id],
    queryFn: () => dataService.entities.UnifiedPost.filter({ user_id: profileUser.id }, '-created_date', 10),
    enabled: !!profileUser && COMMUNITIES_ENABLED,
  });

  const { data: userStreak } = useQuery({
    queryKey: ['user-streak', profileUser?.id],
    queryFn: async () => {
      const existing = await dataService.entities.UserStreak.filter({ user_id: profileUser.id });
      return existing[0] || null;
    },
    enabled: !!profileUser,
    staleTime: 0,
    retry: 1,
  });

  const { data: mitzvahLogs = [] } = useQuery({
    queryKey: ['mitzvah-logs', profileUser?.id],
    queryFn: async () => {
      const logs = await dataService.entities.MitzvahLog.filter({ user_id: profileUser.id }, '-created_date', 50);
      return logs;
    },
    enabled: !!profileUser && isOwnProfile,
    staleTime: 0,
    retry: 1,
  });

  const { data: weeklyMitzvahCount = 0 } = useQuery({
    queryKey: ['weekly-mitzvah-count', profileUser?.id],
    queryFn: async () => {
      const actions = await dataService.entities.MitzvahAction.filter({ user_id: profileUser.id }, '-created_date', 100);
      const logs = await dataService.entities.MitzvahLog.filter({ user_id: profileUser.id }, '-created_date', 100);

      const weekActions = actions.filter(a => {
        const date = parseISO(a.created_date);
        return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
      });
      const weekLogs = logs.filter(l => {
        const date = parseISO(l.date);
        return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
      });

      return weekActions.length + weekLogs.length;
    },
    enabled: !!profileUser && isOwnProfile,
    staleTime: 0,
    retry: 1,
  });

  const { data: mitzvahPoints = 0 } = useQuery({
    queryKey: ['mitzvah-points', profileUser?.id],
    queryFn: async () => {
      const points = await dataService.entities.MitzvahPoints.filter({ user_id: profileUser.id });
      return points.length > 0 ? points[0].total_points : 0;
    },
    enabled: !!profileUser,
    staleTime: 0,
    retry: 1,
  });

  const { data: userCommunities = [] } = useQuery({
    queryKey: ['user-communities', profileUser?.id],
    queryFn: async () => {
      const comms = await dataService.entities.UserCommunity.filter({ user_id: profileUser.id }, '-created_date', 50);
      if (comms.length > 0 && (!profileUser.communities_joined_count || profileUser.communities_joined_count !== comms.length)) {
        dataService.auth.updateMe({ communities_joined_count: comms.length }).catch(() => {});
      }
      return comms;
    },
    enabled: !!profileUser,
    staleTime: 60000,
    retry: 1,
  });

  const { data: friendCount = 0 } = useQuery({
    queryKey: ['profile-friend-count', profileUser?.id],
    queryFn: () => friendsService.count(profileUser.id),
    enabled: !!profileUser,
    staleTime: 60000,
  });

  // ── Friend action handlers ───────────────────────────────────────────────

  const withFriendLoading = async (fn) => {
    setFriendLoading(true);
    try { await fn(); } finally { setFriendLoading(false); }
  };

  const refreshRelationship = async () => {
    const rel = await friendsService.getRelationship(currentUser.id, profileUser.id);
    setRelationship(rel);
    queryClient.invalidateQueries({ queryKey: ['profile-friend-count', profileUser.id] });
    queryClient.invalidateQueries({ queryKey: ['profile-friend-count', currentUser.id] });
  };

  const handleSendRequest = () => withFriendLoading(async () => {
    try {
      await friendsService.sendRequest(currentUser, profileUser);
      await refreshRelationship();
      toast.success('Friend request sent!');
    } catch (e) {
      toast.error(e.message === 'blocked' ? 'Cannot send request' : 'Could not send request');
    }
  });

  const handleCancelRequest = () => withFriendLoading(async () => {
    try {
      await friendsService.cancelRequest(relationship.requestId);
      setRelationship({ status: FRIEND_STATUS.NONE, requestId: null });
    } catch { toast.error('Could not cancel request'); }
  });

  const handleAcceptRequest = () => withFriendLoading(async () => {
    try {
      await friendsService.acceptRequest(relationship.requestId, currentUser, profileUser);
      await refreshRelationship();
      toast.success('You are now friends!');
    } catch { toast.error('Could not accept request'); }
  });

  const handleDeclineRequest = () => withFriendLoading(async () => {
    try {
      await friendsService.declineRequest(relationship.requestId);
      setRelationship({ status: FRIEND_STATUS.NONE, requestId: null });
    } catch { toast.error('Could not decline request'); }
  });

  const handleRemoveFriend = () => withFriendLoading(async () => {
    try {
      await friendsService.removeFriend(currentUser.id, profileUser.id);
      setRelationship({ status: FRIEND_STATUS.NONE, requestId: null });
      queryClient.invalidateQueries({ queryKey: ['profile-friend-count'] });
    } catch { toast.error('Could not remove friend'); }
  });

  // ── Other handlers ───────────────────────────────────────────────────────

  const handleMessage = async () => {
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }
    try {
      const conv = await findOrCreateDirectConversation(currentUser, {
        id: profileUser.id,
        name: profileUser.display_name || profileUser.full_name?.split(' ')[0] || 'User',
        avatar_url: profileUser.avatar_url || '',
        age_range: profileUser.age_range,
      });
      toast.success('Opening messages...');
      navigate(createPageUrl('Messages') + `?conversation=${conv.id}`);
    } catch (error) {
      toast.error(error?.message || 'Could not open messages');
    }
  };

  const handleBlock = async () => {
    await dataService.entities.Block.create({
      blocker_id: currentUser.id,
      blocked_id: profileUser.id,
    });
    toast.success('User blocked');
    navigate(createPageUrl('Feed'));
  };

  const handleEditProfile = () => navigate(createPageUrl('Settings'));

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}${createPageUrl('Profile')}?id=${profileUser.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName, url: profileUrl });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied!');
      } catch {
        toast.error('Could not share profile');
      }
    }
  };

  if (profileLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <QueryError
            message="Profile could not load."
            onRetry={() => { setProfileLoadError(false); loadProfile(); }}
          />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const displayName = profileUser.display_name || profileUser.full_name?.split(' ')[0] || 'User';
  const hasActivity = mitzvahPoints > 0 || weeklyMitzvahCount > 0 || (userStreak?.current_streak || 0) > 0 || mitzvahLogs.length >= 3;

  return (
    <div className="min-h-screen bg-transparent mobile-safe-bottom">
      <DestinationHeader
        icon={UserRound}
        title={isOwnProfile ? 'Profile' : 'Member Profile'}
        actions={(
          <>
            {isOwnProfile && (
              <button
                onClick={handleEditProfile}
                className="app-icon-button surface-tile-hover touch-manipulation"
                aria-label="Edit profile settings"
              >
                <Settings className="h-[18px] w-[18px] text-slate-500" />
              </button>
            )}
            <button
              onClick={handleShareProfile}
              className="app-icon-button surface-tile-hover touch-manipulation"
              aria-label="Share profile"
            >
              <Share2 className="h-[18px] w-[18px] text-slate-500" />
            </button>
          </>
        )}
      />

      <div className="mobile-page">

        <section className="px-3 pt-3">
          <div className="surface-panel overflow-hidden rounded-[28px] shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <ModernProfileHeader
              user={profileUser}
              isOwnProfile={isOwnProfile}
              onMessage={handleMessage}
              onReport={() => setShowReport(true)}
              onBlock={handleBlock}
              onSettings={isOwnProfile ? handleEditProfile : undefined}
            />

            <ModernStatsRow
              friends={friendCount}
              following={COMMUNITIES_ENABLED ? userCommunities.length : 0}
              posts={unifiedPosts.length}
              impact={mitzvahPoints}
              showFollowing={COMMUNITIES_ENABLED}
              onFriendsClick={isOwnProfile ? () => setShowFriendsHub(true) : undefined}
              onPostsClick={() => scrollTo('recent-posts-section')}
              onImpactClick={() => scrollTo('impact-section')}
              onFollowingClick={COMMUNITIES_ENABLED ? () => scrollTo('communities-section') : undefined}
            />

            <ModernActionButtons
              isOwnProfile={isOwnProfile}
              onEditProfile={handleEditProfile}
              onFindFriends={() => setShowFriendsHub(true)}
              onMessage={handleMessage}
              onShare={handleShareProfile}
              onReport={() => setShowReport(true)}
              onBlock={handleBlock}
              relationship={relationship}
              onSendRequest={handleSendRequest}
              onCancelRequest={handleCancelRequest}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onRemoveFriend={handleRemoveFriend}
              friendLoading={friendLoading}
            />
          </div>
        </section>

        <div className="space-y-3 pb-4">

          {isOwnProfile && <div className="px-3 motion-soft-in"><StreakCard streak={userStreak} /></div>}

          {isOwnProfile && (
            <div className="mx-3 motion-soft-in">
              <InterestsSection
                interests={profileUser.interests || []}
                onAddInterest={() => setShowInterestPicker(true)}
              />
            </div>
          )}

          {isOwnProfile && (
            <div id="impact-section" className="mx-3 motion-soft-in">
              {hasActivity ? (
                <ImpactSection points={mitzvahPoints} weeklyCount={weeklyMitzvahCount} streak={userStreak} />
              ) : (
                <GetStartedCard />
              )}
            </div>
          )}

          {COMMUNITIES_ENABLED && userCommunities.length > 0 && (
            <div id="communities-section" className="mx-3 motion-soft-in">
              <CommunitiesSection userCommunities={userCommunities} />
            </div>
          )}

          {isOwnProfile && <div className="mx-3 motion-soft-in"><BadgesSection user={profileUser} /></div>}

          {isOwnProfile && mitzvahLogs.length > 0 && (
            <div className="mx-3 motion-soft-in"><MitzvahJourneySection logs={mitzvahLogs} /></div>
          )}

          <div id="recent-posts-section" className="mx-3 motion-soft-in">
            <RecentPostsSection posts={unifiedPosts} currentUser={currentUser} profileUser={profileUser} isOwnProfile={isOwnProfile} />
          </div>

          {isOwnProfile && (
            <div id="saved-posts-section" className="mx-3 motion-soft-in">
              <SavedPostsSection userId={profileUser.id} />
            </div>
          )}
        </div>
      </div>

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        contentId={profileUser.id}
        contentType="user"
        currentUser={currentUser}
      />

      {isOwnProfile && (
        <InterestPickerModal
          open={showInterestPicker}
          onOpenChange={setShowInterestPicker}
          currentUser={profileUser}
          onInterestAdded={() => loadProfile()}
        />
      )}

      {isOwnProfile && (
        <FriendsHub
          open={showFriendsHub}
          onOpenChange={setShowFriendsHub}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
