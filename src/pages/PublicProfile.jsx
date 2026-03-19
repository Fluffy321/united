import React, { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';
import RecentPostsSection from '@/components/profile/RecentPostsSection';

export default function PublicProfile() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (userId) {
        const users = await base44.entities.User.filter({ id: userId });
        if (users[0]) {
          setProfileUser(users[0]);
          const userPosts = await base44.entities.UnifiedPost.filter({ user_id: userId }, '-created_date', 10);
          setPosts(userPosts);
        }
      }
    } catch (e) {
      console.warn('Public profile: not authenticated', e?.message);
      base44.auth.redirectToLogin();
    }
  };

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

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const displayName = profileUser.display_name || profileUser.full_name?.split(' ')[0] || 'User';
  const memberSince = profileUser.created_date ? format(parseISO(profileUser.created_date), 'MMM yyyy') : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center">
          <button onClick={() => navigate(-1)} className="text-slate-600 font-semibold">
            ← Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-28">
        {/* Hero Section */}
        <div className="bg-white border-b border-slate-100">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600 relative"></div>

          {/* Profile Section */}
          <div className="px-4 pb-4 relative">
            {/* Avatar overlapping cover */}
            <div className="flex justify-center -translate-y-16 mb-4">
              <div className="border-4 border-white rounded-full">
                <UserAvatar user={{ ...profileUser, display_name: displayName }} size="xl" />
              </div>
            </div>

            {/* Name & Location */}
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
              <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                <span>{profileUser.city || 'Five Towns'}</span>
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-center text-slate-600 text-sm mb-2">{profileUser.bio}</p>
            )}

            {/* Member Since */}
            {memberSince && (
              <p className="text-center text-slate-500 text-xs mb-4">
                Member since {memberSince}
              </p>
            )}

            {/* Interests */}
            {profileUser.interests && profileUser.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {profileUser.interests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* Message Button */}
            <button
              onClick={handleMessage}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="px-4 pt-4">
          <RecentPostsSection posts={posts} currentUser={currentUser} profileUser={profileUser} isOwnProfile={false} />
        </div>
      </div>
    </div>
  );
}