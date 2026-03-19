import React from 'react';
import { MapPin, Edit2, MessageCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProfileHero({ user, isOwnProfile, onMessage, displayName }) {
  const navigate = useNavigate();
  const memberSince = user.created_date ? format(parseISO(user.created_date), 'MMM yyyy') : null;

  return (
    <div className="bg-white border-b border-slate-100">
      {/* Cover Photo */}
      <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600 relative"></div>

      {/* Profile Section */}
      <div className="px-4 pb-4 relative">
        {/* Avatar overlapping cover */}
        <div className="flex justify-center -translate-y-16 mb-4">
          <div className="border-4 border-white rounded-full">
            <UserAvatar user={{ ...user, display_name: displayName }} size="xl" />
          </div>
        </div>

        {/* Name & Location */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
          <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1">
            <MapPin className="w-4 h-4" />
            <span>{user.city || 'Five Towns'}</span>
          </div>
        </div>

        {/* Bio */}
        {user.bio ? (
          <p className="text-center text-slate-600 text-sm mb-2">{user.bio}</p>
        ) : isOwnProfile ? (
          <p className="text-center text-slate-400 text-sm italic mb-2">Tap Edit Profile to add a bio</p>
        ) : null}

        {/* Member Since & Communities Count */}
        {memberSince && (
          <p className="text-center text-slate-500 text-xs mb-4">
            Member since {memberSince} · {user.communities_joined_count || 0} communities joined
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          {!isOwnProfile ? (
            <>
              <button
                onClick={onMessage}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
            </>
          ) : (
            <Link to={createPageUrl('Settings')}>
              <button className="flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}