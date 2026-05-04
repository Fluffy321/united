import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ReportModal from '@/components/common/ReportModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';
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
import SavedPostsSection from '@/components/profile/SavedPostsSection.jsx';
import InterestPickerModal from '@/components/profile/InterestPickerModal.jsx';

export default function Profile() {
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('posts');
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [searchParams]);


  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const profileId = searchParams.get('id');
      
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
    enabled: !!profileUser,
    gcTime: 0
  });

  const { data: userStreak } = useQuery({
    queryKey: ['user-streak', profileUser?.id],
    queryFn: async () => {
      const existing = await base44.entities.UserStreak.filter({ user_id: profileUser.id });
      return existing[0] || null;
    },
    enabled: !!profileUser,
    staleTime: 0,
    retry: 1,
    gcTime: 0
  });

  const { data: mitzvahLogs = [] } = useQuery({
    queryKey: ['mitzvah-logs', profileUser?.id],
    queryFn: async () => {
      const logs = await base44.entities.MitzvahLog.filter({ user_id: profileUser.id }, '-created_date', 50);
      return logs;
    },
    enabled: !!profileUser && isOwnProfile,
    staleTime: 0,
    retry: 1,
    gcTime: 0
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
    staleTime: 0,
    retry: 1,
    gcTime: 0
  });

  const { data: mitzvahPoints = 0 } = useQuery({
    queryKey: ['mitzvah-points', profileUser?.id],
    queryFn: async () => {
      const points = await base44.entities.MitzvahPoints.filter({ user_id: profileUser.id });
      return points.length > 0 ? points[0].total_points : 0;
    },
    enabled: !!profileUser,
    staleTime: 0,
    retry: 1,
    gcTime: 0
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
    staleTime: 60000,
    retry: 1,
    gcTime: 0
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
    } catch (e) {
      // Fallback to clipboard if share is denied
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied!');
      } catch {
        toast.error('Could not share profile');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] mobile-safe-bottom">
      <div className="mobile-page">

        {/* Modern Header */}
        <ModernProfileHeader
          user={profileUser}
          isOwnProfile={isOwnProfile}
          onMessage={handleMessage}
          onReport={() => setShowReport(true)}
          onBlock={handleBlock}
          onSettings={isOwnProfile ? handleEditProfile : undefined}
        />

        {/* Stats Row */}
        <ModernStatsRow
          following={userCommunities.length}
          posts={unifiedPosts.length}
          impact={mitzvahPoints}
          onPostsClick={() => scrollTo('recent-posts-section')}
          onImpactClick={() => scrollTo('impact-section')}
          onFollowingClick={() => scrollTo('communities-section')}
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
        <div className="space-y-3 pb-4">

          {/* Streak Card */}
          {isOwnProfile && <div className="px-3"><StreakCard streak={userStreak} /></div>}

          {/* Interests Section */}
          {isOwnProfile && (
            <div className="mx-3">
              <InterestsSection 
                interests={profileUser.interests || []} 
                onAddInterest={() => setShowInterestPicker(true)}
              />
            </div>
          )}

          {/* Impact or Get Started */}
          {isOwnProfile && (
            <div id="impact-section" className="mx-3">
              {hasActivity ? (
                <ImpactSection points={mitzvahPoints} weeklyCount={weeklyMitzvahCount} streak={userStreak} />
              ) : (
                <GetStartedCard />
              )}
            </div>
          )}

          {/* Weekly Summary */}
          {isOwnProfile && <div className="mx-3"><WeeklySummaryCard mitzvahCount={weeklyMitzvahCount} /></div>}

          {/* Communities Section */}
          {userCommunities.length > 0 && <div id="communities-section" className="mx-3"><CommunitiesSection userCommunities={userCommunities} /></div>}

          {/* Badges Section */}
          {isOwnProfile && <div className="mx-3"><BadgesSection user={profileUser} /></div>}

          {/* Mitzvah Journey */}
          {isOwnProfile && mitzvahLogs.length > 0 && <div className="mx-3"><MitzvahJourneySection logs={mitzvahLogs} /></div>}

          {/* Posts / Saved Tabs */}
          <div id="recent-posts-section" className="mx-3">
            {isOwnProfile && (
              <div className="mb-3 flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setActiveProfileTab('posts')}
                  className={`flex-1 rounded-xl py-2 text-[13px] font-black transition-all ${
                    activeProfileTab === 'posts' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveProfileTab('saved')}
                  className={`flex-1 rounded-xl py-2 text-[13px] font-black transition-all ${
                    activeProfileTab === 'saved' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  🔖 Saved
                </button>
              </div>
            )}
            {(!isOwnProfile || activeProfileTab === 'posts') && (
              <RecentPostsSection posts={unifiedPosts} currentUser={currentUser} profileUser={profileUser} isOwnProfile={isOwnProfile} />
            )}
            {isOwnProfile && activeProfileTab === 'saved' && (
              <SavedPostsSection userId={currentUser?.id} />
            )}
          </div>
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
