import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Users, Bell, BellOff, Plus, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CommunityHubHeader({ shul, membership, isAdmin, onJoin, onToggleNotifications, onNewPost, onBroadcast, joining }) {
  const navigate = useNavigate();
  const isMember = !!membership;

  return (
    <div className="bg-gradient-to-b from-[#E6F0FF] to-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 text-slate-600 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start gap-4">
          {/* Logo / Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-[#0F5ED7] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md">
            {shul.logo_url ? (
              <img src={shul.logo_url} alt={shul.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              shul.name?.charAt(0)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{shul.name}</h1>
              {shul.verified && (
                <Badge className="bg-[#E6F0FF] text-[#0F5ED7] border-0 text-xs">✓ Verified</Badge>
              )}
              {isAdmin && (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm mb-2" style={{ color: '#5F6B7A' }}>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {shul.town}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {shul.member_count || 0} members
              </div>
            </div>

            {shul.description && (
              <p className="text-sm text-slate-600 line-clamp-2">{shul.description}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap mt-4">
          {!isMember ? (
            <Button
              onClick={onJoin}
              disabled={joining}
              className="bg-[#0F5ED7] hover:bg-[#0D4EB8] text-white font-semibold rounded-2xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              {joining ? 'Joining...' : 'Join Community'}
            </Button>
          ) : (
            <Button
              onClick={onToggleNotifications}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              {membership.notifications_enabled ? (
                <><BellOff className="w-4 h-4 mr-2" />Mute</>
              ) : (
                <><Bell className="w-4 h-4 mr-2" />Unmute</>
              )}
            </Button>
          )}

          {isAdmin && (
            <>
              <Button
                onClick={onNewPost}
                variant="outline"
                size="sm"
                className="border-[#0F5ED7] text-[#0F5ED7] hover:bg-[#E6F0FF] font-semibold rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Post
              </Button>
              <Button
                onClick={onBroadcast}
                variant="outline"
                size="sm"
                className="border-amber-400 text-amber-700 hover:bg-amber-50 font-semibold rounded-xl"
              >
                <Bell className="w-4 h-4 mr-1" />
                Broadcast
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}