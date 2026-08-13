import React, { useState, useEffect } from 'react';
import { Loader2, Settings, Share2, UserRound } from 'lucide-react';
import { dataService, findOrCreateDirectConversation, friendsService, notificationsService, streakService } from '@/services';
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
import InterestsSection from '@/components/profile/InterestsSection.jsx';
import ImpactSection from '@/components/profile/ImpactSection.jsx';
import GetStartedCard from '@/components/profile/GetStartedCard.jsx';
import BadgesSection from '@/components/profile/BadgesSection.jsx';
import MitzvahJourneySection from '@/components/profile/MitzvahJourneySection.jsx';
import CommunitiesSection from '@/components/profile/CommunitiesSection.jsx';
import { COMMUNITIES_ENABLED } from '@/config/features';
import RecentPostsSection from '@/components/profile/RecentPostsSection.jsx';
import SavedPostsSection from '@/components/profile/SavedPostsSection.jsx';
import ProfileProgressSection from '@/components/profile/ProfileProgressSection.jsx';
import MeTodaySummary from '@/components/profile/MeTodaySummary.jsx';
import MePersonalAlerts from '@/components/profile/MePersonalAlerts.jsx';
import MeShortcutGrid from '@/components/profile/MeShortcutGrid.jsx';
import MeIdentityRow from '@/components/profile/MeIdentityRow.jsx';
import InterestPickerModal from '@/components/profile/InterestPickerModal.jsx';
import FriendsHub from '@/components/profile/FriendsHub.jsx';
import DestinationHeader from '@/components/layout/DestinationHeader';
import { createBlock, filterBookmark, filterMitzvahAction, filterMitzvahLog, filterMitzvahPoints, filterUnifiedPost, filterUser, filterUserCommunity } from '@/services/entityServices';
import { postKeys } from '@/lib/queryKeys';
import useShabbatLocation from '@/hooks/useShabbatLocation';
import { getShabbatTimes, getZmanim } from '@/lib/hebrewDate';
import { getNotificationRoute } from '@/lib/notificationRoute';
import { rankPersonalAlerts, selectNextJewishTime, selectNextPersonalPlan } from '@/lib/profile/meDashboard';

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
  const [progressOpenRequest, setProgressOpenRequest] = useState(0);

  // Relationship state: { status: FRIEND_STATUS.*, requestId: string|null }
  const [relationship, setRelationship] = useState({ status: FRIEND_STATUS.NONE, requestId: null });
  const [friendLoading, setFriendLoading] = useState(false);
  const navigate = useNavigate();
  const { location: jewishLocation } = useShabbatLocation({ autoRequest: false });

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
          const users = await filterUser({ id: profileId });
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
    queryKey: postKeys.user(profileUser?.id),
    queryFn: () => filterUnifiedPost({ user_id: profileUser.id }, '-created_date', 10),
    enabled: !!profileUser && COMMUNITIES_ENABLED,
  });

  const { data: userStreak } = useQuery({
    queryKey: ['user-streak', profileUser?.id],
    queryFn: () => streakService.getUserStreak(profileUser.id),
    enabled: !!profileUser,
    staleTime: 0,
    retry: 1,
  });

  const { data: mitzvahLogs = [] } = useQuery({
    queryKey: ['mitzvah-logs', profileUser?.id],
    queryFn: async () => {
      const logs = await filterMitzvahLog({ user_id: profileUser.id }, '-created_date', 50);
      return logs;
    },
    enabled: !!profileUser && isOwnProfile,
    staleTime: 0,
    retry: 1,
  });

  const { data: weeklyMitzvahCount = 0 } = useQuery({
    queryKey: ['weekly-mitzvah-count', profileUser?.id],
    queryFn: async () => {
      const actions = await filterMitzvahAction({ user_id: profileUser.id }, '-created_date', 100);
      const logs = await filterMitzvahLog({ user_id: profileUser.id }, '-created_date', 100);

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
      const points = await filterMitzvahPoints({ user_id: profileUser.id });
      return points.length > 0 ? points[0].total_points : 0;
    },
    enabled: !!profileUser,
    staleTime: 0,
    retry: 1,
  });

  const { data: userCommunities = [] } = useQuery({
    queryKey: ['user-communities', profileUser?.id],
    queryFn: async () => {
      const comms = await filterUserCommunity({ user_id: profileUser.id }, '-created_date', 50);
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

  const {
    data: personalNotifications = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['me-dashboard-notifications', profileUser?.id],
    queryFn: () => notificationsService.listForUser(profileUser.id, 20),
    enabled: !!profileUser && isOwnProfile,
    staleTime: 30000,
    retry: 1,
  });

  const { data: zmanim, isLoading: zmanimLoading, isError: zmanimError } = useQuery({
    queryKey: ['me-dashboard-zmanim', jewishLocation?.lat, jewishLocation?.lng, jewishLocation?.tzid, new Date().toDateString()],
    queryFn: () => getZmanim(jewishLocation.lat, jewishLocation.lng, new Date(), jewishLocation.tzid),
    enabled: !!profileUser && isOwnProfile && !!jewishLocation?.lat && !!jewishLocation?.lng,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  const { data: shabbatTimes, isLoading: shabbatLoading, isError: shabbatError } = useQuery({
    queryKey: ['me-dashboard-shabbat', jewishLocation?.lat, jewishLocation?.lng, jewishLocation?.tzid, new Date().toDateString()],
    queryFn: () => getShabbatTimes(jewishLocation.lat, jewishLocation.lng, jewishLocation.tzid, new Date()),
    enabled: !!profileUser && isOwnProfile && !!jewishLocation?.lat && !!jewishLocation?.lng,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const { data: savedCount = 0 } = useQuery({
    queryKey: ['me-dashboard-bookmarks', profileUser?.id],
    queryFn: async () => (await filterBookmark({ user_id: profileUser.id }, '-created_date', 100)).length,
    enabled: !!profileUser && isOwnProfile,
    staleTime: 30000,
    retry: 1,
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
    await createBlock({
      blocker_id: currentUser.id,
      blocked_id: profileUser.id,
    });
    toast.success('User blocked');
    navigate(createPageUrl('Feed'));
  };

  const handleEditProfile = () => navigate(createPageUrl('Settings'));

  const handleOpenAlert = async (notification) => {
    const route = getNotificationRoute(notification);
    if (!route) return;
    if (!notification.is_read) {
      notificationsService.markRead(notification.id).catch(() => {});
    }
    navigate(route);
  };

  const handleOpenSaved = () => {
    setProgressOpenRequest((value) => value + 1);
    window.setTimeout(() => scrollTo('saved-posts-section'), 100);
  };

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
  const personalAlerts = rankPersonalAlerts(personalNotifications, 3);
  const nextPlan = selectNextPersonalPlan(personalNotifications);
  const nextJewishTime = selectNextJewishTime(zmanim, shabbatTimes);

  return (
    <div className="min-h-screen bg-transparent mobile-safe-bottom">
      <DestinationHeader
        icon={UserRound}
        title={isOwnProfile ? 'Me' : 'Member Profile'}
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
            {!isOwnProfile && (
              <button
                onClick={handleShareProfile}
                className="app-icon-button surface-tile-hover touch-manipulation"
                aria-label="Share profile"
              >
                <Share2 className="h-[18px] w-[18px] text-slate-500" />
              </button>
            )}
          </>
        )}
      />

      <div className="mobile-page">
        {isOwnProfile ? (
          <div data-testid="me-dashboard" className="space-y-4 px-3 pb-4 pt-3">
            <MeTodaySummary
              firstName={displayName.split(' ')[0]}
              jewishTime={nextJewishTime}
              jewishLocation={jewishLocation?.label || 'Your location'}
              timeZone={jewishLocation?.tzid}
              nextPlan={nextPlan}
              onOpenJewish={() => navigate('/JewishHub')}
              onOpenPlan={() => navigate(nextPlan ? getNotificationRoute(nextPlan) : '/Search?type=event')}
              isLoading={zmanimLoading || shabbatLoading}
              hasError={zmanimError || shabbatError}
            />

            <MePersonalAlerts
              alerts={personalAlerts}
              isLoading={notificationsLoading}
              isError={notificationsError}
              onRetry={refetchNotifications}
              onOpenAlert={handleOpenAlert}
              onSeeAll={() => navigate('/Notifications')}
            />

            <MeShortcutGrid
              communityCount={userCommunities.length}
              savedCount={savedCount}
              helpCount={weeklyMitzvahCount}
              onCommunities={() => navigate('/Communities')}
              onSaved={handleOpenSaved}
              onHelp={() => navigate('/MitzvahCircle')}
              onPlans={() => navigate('/Search?type=event')}
            />

            <MeIdentityRow user={profileUser} onEdit={handleEditProfile} />

            <div data-testid="profile-progress">
              <ProfileProgressSection openRequest={progressOpenRequest}>
                <InterestsSection
                  interests={profileUser.interests || []}
                  onAddInterest={() => setShowInterestPicker(true)}
                />

                <div id="impact-section">
                  {hasActivity ? (
                    <ImpactSection points={mitzvahPoints} weeklyCount={weeklyMitzvahCount} streak={userStreak} />
                  ) : (
                    <GetStartedCard />
                  )}
                </div>

                <BadgesSection user={profileUser} />
                {mitzvahLogs.length > 0 && <MitzvahJourneySection logs={mitzvahLogs} />}

                <div id="saved-posts-section">
                  <SavedPostsSection userId={profileUser.id} />
                </div>
              </ProfileProgressSection>
            </div>
          </div>
        ) : (
          <>
        <section data-testid="profile-identity" className="px-3 pt-3">
          <div className="surface-panel overflow-hidden rounded-[28px] shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <ModernProfileHeader
              user={{ ...profileUser, current_streak: userStreak?.current_streak || 0 }}
              isOwnProfile={false}
              onMessage={handleMessage}
              onReport={() => setShowReport(true)}
              onBlock={handleBlock}
              onSettings={undefined}
            />

            <ModernStatsRow
              friends={friendCount}
              following={COMMUNITIES_ENABLED ? userCommunities.length : 0}
              posts={unifiedPosts.length}
              impact={mitzvahPoints}
              showFollowing={COMMUNITIES_ENABLED}
              isOwnProfile={false}
              onFriendsClick={undefined}
              onPostsClick={() => scrollTo('recent-posts-section')}
              onImpactClick={() => scrollTo('impact-section')}
              onFollowingClick={COMMUNITIES_ENABLED ? () => scrollTo('communities-section') : undefined}
            />

            <ModernActionButtons
              isOwnProfile={false}
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
          <div id="recent-posts-section" data-testid="profile-recent-posts" className="mx-3 motion-soft-in">
            <RecentPostsSection posts={unifiedPosts} isOwnProfile={false} />
          </div>

          <div id="communities-section" data-testid="profile-communities" className="mx-3 motion-soft-in">
            {COMMUNITIES_ENABLED && userCommunities.length > 0 && (
              <CommunitiesSection userCommunities={userCommunities} />
            )}
          </div>

        </div>
          </>
        )}
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
