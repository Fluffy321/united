import React from 'react';
import { MapPin, Edit2, MessageCircle, Share2, Heart, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProfileHero({ user, isOwnProfile, onMessage, displayName }) {
  const navigate = useNavigate();
  const memberSince = user.created_date ? format(parseISO(user.created_date), 'MMM yyyy') : null;

  return (
    <div className="bg-white border-b border-slate-100 overflow-hidden">
      {/* Cover Photo with Gradient Overlay */}
      <div className="relative h-40">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600"></div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
      </div>

      {/* Profile Section */}
      <div className="px-4 pb-6 relative">
        {/* Avatar overlapping cover */}
        <div className="flex justify-center -translate-y-20 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30 scale-110"></div>
            <div className="relative border-4 border-white rounded-full shadow-lg">
              <UserAvatar user={{ ...user, display_name: displayName }} size="xl" />
            </div>
          </div>
        </div>

        {/* Name & Location */}
        <div className="text-center mb-3">
          <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
          <div className="flex items-center justify-center gap-1 text-slate-600 text-sm mt-2 font-medium">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>{user.city || 'Five Towns'}</span>
          </div>
        </div>

        {/* Bio */}
        {user.bio ? (
          <p className="text-center text-slate-700 text-sm mb-3 leading-relaxed max-w-md mx-auto">{user.bio}</p>
        ) : isOwnProfile ? (
          <p className="text-center text-slate-400 text-sm italic mb-3">Tap Edit Profile to add a bio</p>
        ) : null}

        {/* Member Since & Communities Count */}
        {memberSince && (
          <div className="flex justify-center gap-4 mb-5 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1">
              <span className="text-indigo-600 font-semibold">📅</span>
              <span>Member since {memberSince}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-indigo-600 font-semibold">👥</span>
              <span>{user.communities_joined_count || 0} communities</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center pt-2">
          {!isOwnProfile ? (
            <>
              <button
                onClick={onMessage}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
            </>
          ) : (
            <Link to={createPageUrl('Settings')}>
              <button className="flex items-center gap-2 px-8 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all active:scale-95">
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