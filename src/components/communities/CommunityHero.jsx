import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Star, Settings, Share2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import CommunityLogo from './CommunityLogo';
import CommunityInviteModal from './CommunityInviteModal';
import { toast } from 'sonner';
import { getCommunityTypeConfig } from '@/lib/communityTypes';

// Deterministic gradient from community name
function communityGradient(name = '', accentColor) {
  if (accentColor) return `linear-gradient(135deg, ${accentColor}CC 0%, ${accentColor}88 100%)`;
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradients = [
    'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)',
    'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
    'linear-gradient(135deg, #991b1b 0%, #f87171 100%)',
    'linear-gradient(135deg, #0e7490 0%, #22d3ee 100%)',
  ];
  return gradients[hash % gradients.length];
}

export default function CommunityHero({
  community, isFollowing, isAdmin, isCreator = false, onBack, onFollow, onManage,
  actualMemberCount,
  members = [], currentUser, onTabChange, typeConfig: providedTypeConfig,
  inAppShell = false,
}) {
  const [stickyVisible, setStickyVisible]   = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const memberCount = actualMemberCount > 0 ? actualMemberCount : (community.follower_count || 0);
  const typeConfig = providedTypeConfig || getCommunityTypeConfig(community);
  const TypeIcon = typeConfig.icon;
  const brandingSettings = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.branding || {})
    : {};
  const COVER_STYLE_GRADIENTS = {
    midnight: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    sunrise:  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    forest:   'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
    twilight: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #db2777 100%)',
  };
  const effectiveAccent = brandingSettings.accentColor || community.featured_accent_color;
  const gradient = effectiveAccent
    ? communityGradient(community.name, effectiveAccent)
    : (brandingSettings.coverStyle && brandingSettings.coverStyle !== 'default' && COVER_STYLE_GRADIENTS[brandingSettings.coverStyle])
      ? COVER_STYLE_GRADIENTS[brandingSettings.coverStyle]
      : typeConfig.coverPattern;

  useEffect(() => {
    if (inAppShell) return;
    const handleScroll = () => setStickyVisible(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [inAppShell]);

  const handleShare = async () => {
    const url = `${window.location.origin}/communities/${community.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: community.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      }
    } catch {}
  };

  return (
    <>
      {/* ── Sticky mini-header — only when NOT inside app shell ── */}
      {!inAppShell && (
        <motion.div
          initial={false}
          animate={{ y: stickyVisible ? 0 : -64, opacity: stickyVisible ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 flex items-center gap-3 px-4 h-14 shadow-sm"
        >
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-[14px] truncate">{community.name}</p>
            <p className="text-[11px] text-slate-400">{memberCount.toLocaleString()} members</p>
          </div>
          <button
            onClick={isCreator ? onManage : onFollow}
            className={`h-8 px-4 rounded-full text-[13px] font-bold transition-colors ${
              isCreator ? 'bg-slate-950 text-white' : isFollowing ? 'bg-slate-100 text-slate-600' : 'bg-[#2563EB] text-white'
            }`}
          >
            {isCreator ? 'Admin Center' : isFollowing ? 'Joined' : '+ Join'}
          </button>
        </motion.div>
      )}

      {/* ── Branded cover ── */}
      <div className="relative overflow-hidden" style={{ height: inAppShell ? 120 : 128 }}>
        {/* Cover: image or type-specific gradient */}
        <div className="absolute inset-0 w-full">
          {(community.cover_url || community.cover_image_url) ? (
            <img
              src={community.cover_url || community.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full" style={{ background: gradient }} />
          )}
          {/* Gradient overlay — lighter in app shell since name is in AppBar */}
          <div className={`absolute inset-0 bg-gradient-to-t ${inAppShell ? 'from-black/55 via-black/20 to-transparent' : 'from-black/80 via-black/25 to-transparent'}`} />
        </div>

        {/* Description overlay — only in app shell, since name is already in AppBar */}
        {inAppShell && (community.description || community.tagline) && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-2.5 z-10">
            <p className="text-[11px] text-white/85 line-clamp-2 leading-relaxed drop-shadow-sm">
              {community.description || community.tagline}
            </p>
          </div>
        )}

        {/* Back + share — only when NOT in app shell */}
        {!inAppShell && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Community identity — overlaid at cover bottom — only when NOT in app shell */}
        {!inAppShell && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-10">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-white text-[19px] leading-tight drop-shadow-sm truncate">
                    {community.name}
                  </h1>
                  {community.is_claimed && <CheckCircle2 className="w-4 h-4 text-blue-300 flex-shrink-0" />}
                  {community.is_featured && <Star className="w-4 h-4 text-amber-300 fill-amber-300 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-white/75 flex items-center gap-1 mt-0.5 leading-none">
                  <TypeIcon className="h-3 w-3 flex-shrink-0" />
                  {typeConfig.label}
                  {community.neighborhood && <span className="opacity-80"> · {community.neighborhood}</span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Thin action bar: logo + member count + CTA ── */}
      <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-2.5">
        <div className="rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm" style={{ width: 36, height: 36 }}>
          <CommunityLogo community={community} size="sm" />
        </div>

        <p className="text-[12px] font-bold text-slate-600 flex-1 truncate min-w-0">
          {memberCount > 0 ? `${memberCount.toLocaleString()} members` : typeConfig.tagline}
        </p>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isCreator ? (
            <button
              onClick={onManage}
              className="h-8 px-3 text-[12px] font-bold rounded-full bg-slate-950 text-white active:scale-95 transition-all"
            >
              Admin
            </button>
          ) : isFollowing ? (
            <>
              <button
                onClick={onFollow}
                className="h-8 px-3 text-[12px] font-bold rounded-full bg-slate-100 text-slate-600 active:scale-95 transition-all"
              >
                Joined ✓
              </button>
              {isAdmin && (
                <button
                  onClick={onManage}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 active:scale-95 transition-all"
                  aria-label="Admin center"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onFollow}
              className="h-8 px-4 text-[12px] font-bold rounded-full bg-[#2563EB] text-white active:scale-95 transition-all"
            >
              Join
            </button>
          )}
        </div>
      </div>

      {/* Invite strip — only for members */}
      {isFollowing && (
        <div className="bg-white px-4 pb-3 pt-1.5">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100 active:scale-[0.99] transition-all"
          >
            <UserPlus className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
            <span className="flex-1 text-[12px] font-semibold text-slate-600">Invite people to {community.name}</span>
            <span className="text-[11px] font-black text-blue-600">Share</span>
          </button>
        </div>
      )}

      <CommunityInviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        community={community}
        currentUser={currentUser}
        typeConfig={typeConfig}
      />
    </>
  );
}
