import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ReportModal from '@/components/common/ReportModal';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import ModernProfileHeader from '@/components/profile/ModernProfileHeader.jsx';
import ModernStatsRow from '@/components/profile/ModernStatsRow.jsx';
import ModernActionButtons from '@/components/profile/ModernActionButtons.jsx';
import StreakCard from '@/components/profile/StreakCard.jsx';
import InterestsSection from '@/components/profile/InterestsSection.jsx';
import ImpactSection from '@/components/profile/ImpactSection.jsx';
import GetStartedCard from '@/components/profile/GetStartedCard.jsx';
import WeeklySummaryCard from '@/components/profile/WeeklySummaryCard.jsx';
import BadgesSection from '@/components/profile/BadgesSection.jsx';
import MitzvahJourneySection from '@/components/profile/MitzvahJourneySection.jsx';
import CommunitiesSection from '@/components/profile/CommunitiesSection.jsx';
import RecentPostsSection from '@/components/profile/RecentPostsSection.jsx';
import InterestPickerModal from '@/components/profile/InterestPickerModal.jsx';
import SectionCard from '@/components/profile/SectionCard.jsx';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    seedDemoPostsIfNeeded();
  }, []);

  const seedDemoPostsIfNeeded = async () => {
    try {
      await base44.functions.invoke('seedProfilePosts', {});
    } catch (e) {
      // Silently fail if already seeded
    }
  };

  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const params = new URLSearchParams(window.location.search);
      const profileId = params.get('id');
      
      if (profileId && profileId !== user.id) {
        try {
          const users = await base44.entities.User.filter({ id: profileId });
          if (users[0]) {
            setProfileUser(users[0]);
            setIsOwnProfile(false);
          } else {
            setProfileUser(user);
            setIsOwnProfile(true);
          }
        } catch {
          setProfileUser(user);
          setIsOwnProfile(true);
        }
      } else {
        setProfileUser(user);
        setIsOwnProfile(true);
      }
    } catch (e) {
      console.warn('Profile: not authenticated', e?.message);
      base44.auth.redirectToLogin();
    }
  };

  const { data: unifiedPosts = [] } = useQuery({
    queryKey: ['user-posts', profileUser?.id],
    queryFn: () => base44.entities.UnifiedPost.filter({ user_id: profileUser.id }, '-created_date', 10),
    enabled: !!profileUser
  });

  const { data: userStreak } = useQuery({
    queryKey: ['user-streak', profileUser?.id],
    queryFn: async () => {
      const existing = await base44.entities.UserStreak.filter({ user_id: profileUser.id });
      return existing[0] || null;
    },
    enabled: !!profileUser,
    staleTime: 300000,
    retry: 1
  });

  const { data: mitzvahLogs = [] } = useQuery({
    queryKey: ['mitzvah-logs', profileUser?.id],
    queryFn: async () => {
      const logs = await base44.entities.MitzvahLog.filter({ user_id: profileUser.id }, '-created_date', 50);
      return logs;
    },
    enabled: !!profileUser && isOwnProfile,
    staleTime: 300000,
    retry: 1
  });

  const { data: weeklyMitzvahCount = 0 } = useQuery({
    queryKey: ['weekly-mitzvah-count', profileUser?.id],
    queryFn: async () => {
      const actions = await base44.entities.MitzvahAction.filter({ user_id: profileUser.id }, '-created_date', 100);
      const logs = await base44.entities.MitzvahLog.filter({ user_id: profileUser.id }, '-created_date', 100);
      
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
    staleTime: 300000,
    retry: 1
  });

  const { data: mitzvahPoints = 0 } = useQuery({
    queryKey: ['mitzvah-points', profileUser?.id],
    queryFn: async () => {
      const points = await base44.entities.MitzvahPoints.filter({ user_id: profileUser.id });
      return points.length > 0 ? points[0].total_points : 0;
    },
    enabled: !!profileUser,
    staleTime: 300000,
    retry: 1
  });

  const { data: userCommunities = [] } = useQuery({
    queryKey: ['user-communities', profileUser?.id],
    queryFn: async () => {
      const comms = await base44.entities.UserCommunity.filter({ user_id: profileUser.id }, '-created_date', 50);
      // Update user's communities_joined_count
      if (comms.length > 0 && (!profileUser.communities_joined_count || profileUser.communities_joined_count !== comms.length)) {
        base44.auth.updateMe({ communities_joined_count: comms.length }).catch(() => {});
      }
      return comms;
    },
    enabled: !!profileUser,
    staleTime: 300000,
    retry: 1
  });

  const handleMessage = async () => {
    const conversations = await base44.entities.Conversation.list();
    const existing = conversations.find(c => 
      c.participant_ids?.includes(currentUser.id) && c.participant_ids?.includes(profileUser.id)
    );

    if (existing) {
      navigate(createPageUrl('Messages') + `?conversation=${existing.id}`);
    } else {
      const conv = await base44.entities.Conversation.create({
        participant_ids: [currentUser.id, profileUser.id],
        participant_names: [
          currentUser.display_name || currentUser.full_name?.split(' ')[0],
          profileUser.display_name || profileUser.full_name?.split(' ')[0]
        ],
        participant_ages: [currentUser.age_range || '18+', profileUser.age_range || '18+'],
        unread_count: {}
      });
      navigate(createPageUrl('Messages') + `?conversation=${conv.id}`);
    }
  };

  const handleBlock = async () => {
    await base44.entities.Block.create({
      blocker_id: currentUser.id,
      blocked_id: profileUser.id
    });
    toast.success('User blocked');
    navigate(createPageUrl('Feed'));
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const displayName = profileUser.display_name || profileUser.full_name?.split(' ')[0] || 'User';
  const hasActivity = mitzvahPoints > 0 || weeklyMitzvahCount > 0 || (userStreak?.current_streak || 0) > 0 || mitzvahLogs.length >= 3;

  const handleEditProfile = () => {
    navigate(createPageUrl('Settings'));
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}${createPageUrl('Profile')}?id=${profileUser.id}`;
    if (navigator.share) {
      navigator.share({ title: displayName, url: profileUrl });
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto">
        {/* Modern Header */}
        <ModernProfileHeader
          user={profileUser}
          isOwnProfile={isOwnProfile}
          onMessage={handleMessage}
          onReport={() => setShowReport(true)}
          onBlock={handleBlock}
        />

        {/* Stats Row */}
        <ModernStatsRow
          following={0}
          posts={unifiedPosts.length}
          impact={mitzvahPoints}
        />

        {/* Action Buttons */}
        <ModernActionButtons
          isOwnProfile={isOwnProfile}
          onEditProfile={handleEditProfile}
          onMessage={handleMessage}
          onShare={handleShareProfile}
          onReport={() => setShowReport(true)}
          onBlock={handleBlock}
        />

        {/* Content Sections */}
        <div className="space-y-4 pb-28">

          {/* Streak Card */}
          {isOwnProfile && <div className="px-6"><StreakCard streak={userStreak} /></div>}

          {/* Interests Section */}
          {isOwnProfile && (
            <div className="mx-6">
              <InterestsSection 
                interests={profileUser.interests || []} 
                onAddInterest={() => setShowInterestPicker(true)}
              />
            </div>
          )}

          {/* Impact or Get Started */}
          {isOwnProfile && (
            <div className="mx-6">
              {hasActivity ? (
                <ImpactSection points={mitzvahPoints} weeklyCount={weeklyMitzvahCount} streak={userStreak} />
              ) : (
                <GetStartedCard />
              )}
            </div>
          )}

          {/* Weekly Summary */}
          {isOwnProfile && <div className="mx-6"><WeeklySummaryCard mitzvahCount={weeklyMitzvahCount} /></div>}

          {/* Communities Section */}
          {isOwnProfile && userCommunities.length > 0 && <div className="mx-6"><CommunitiesSection userCommunities={userCommunities} /></div>}

          {/* Badges Section */}
          {isOwnProfile && <div className="mx-6"><BadgesSection user={profileUser} /></div>}

          {/* Mitzvah Journey */}
          {isOwnProfile && mitzvahLogs.length > 0 && <div className="mx-6"><MitzvahJourneySection logs={mitzvahLogs} /></div>}

          {/* Recent Posts */}
          <div className="mx-6"><RecentPostsSection posts={unifiedPosts} currentUser={currentUser} profileUser={profileUser} isOwnProfile={isOwnProfile} /></div>
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
    </div>
  );
}