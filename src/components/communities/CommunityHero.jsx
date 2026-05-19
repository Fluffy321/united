import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Star, Settings, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import CommunityLogo from './CommunityLogo';
import InviteLinkButton from './InviteLinkButton';
import { toast } from 'sonner';
import { getCommunityTypeConfig } from '@/lib/communityTypes';

const TYPE_LABEL_PLURAL = {
  Shul: 'Shuls', School: 'Schools', Yeshiva: 'Yeshivas',
  Seminary: 'Seminaries', Camp: 'Camps', Organization: 'Organizations', Other: 'Communities',
};

const TYPE_EMOJI = {
  Shul: '🕍', School: '🏫', Yeshiva: '📚',
  Seminary: '🎓', Camp: '⛺', Organization: '🏢', Other: '🏘️',
};

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
  community, isFollowing, isAdmin, isCreator = false, onBack, onFollow, onManage, onClaim,
  // eventCount, mitzvahCount, postsThisWeek removed — stats ribbon was removed
  actualMemberCount,
  members = [], currentUser, onTabChange, typeConfig: providedTypeConfig
}) {
  const [scrollY, setScrollY] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);

  const memberCount = actualMemberCount > 0 ? actualMemberCount : (community.follower_count || 0);
  const typeConfig = providedTypeConfig || getCommunityTypeConfig(community);
  const TypeIcon = typeConfig.icon;
  const type = community.type || community.verified_type || typeConfig.label;
  const typeLabel = typeConfig.pluralLabel || TYPE_LABEL_PLURAL[type] || 'Communities';
  const typeEmoji = TYPE_EMOJI[type] || typeConfig.emoji || 'JU';
  const gradient = community.featured_accent_color
    ? communityGradient(community.name, community.featured_accent_color)
    : typeConfig.coverPattern;

  // Scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setStickyVisible(y > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isActive = (community.joins_this_week || 0) + (community.posts_this_week || 0) > 3;
  const statusPill = isActive
    ? <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white border border-white/30">🔥 Busy today</span>
    : memberCount > 0
    ? <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">🟢 {memberCount} members</span>
    : null;

  return (
    <>
      {/* ── Sticky mini-header ── */}
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

      {/* ── Hero cover — compact 120px ── */}
      <div className="relative overflow-hidden" style={{ height: 120 }}>
        {/* Cover image or gradient — static (no parallax) */}
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
          {/* Darkening overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Back + share buttons over cover */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-white/80 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {typeEmoji} {typeLabel}
            </span>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Status pill bottom-left of cover */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          {statusPill}
        </div>
      </div>

      {/* ── Identity row: logo + name + type badge + CTA ── */}
      <div className="bg-white px-4 pt-0 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3 -mt-6">
          {/* Logo: 48x48, overlapping cover bottom */}
          <div className="relative flex-shrink-0">
            <div className="rounded-xl border-4 border-white shadow-md overflow-hidden" style={{ width: 48, height: 48 }}>
              <CommunityLogo community={community} size="md" />
            </div>
            {isActive && (
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0 pt-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-extrabold text-slate-900 text-[16px] leading-tight truncate">{community.name}</h1>
              {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />}
              {community.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <TypeIcon className="h-3 w-3 flex-shrink-0" />
              {typeConfig.label}
              {community.neighborhood && <span className="text-slate-400"> · {community.neighborhood}</span>}
            </p>
          </div>

          {/* CTA — right side */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-6">
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

        {/* Tagline below identity row */}
        {typeConfig.tagline && (
          <p className="mt-2 text-[11px] text-slate-500 leading-snug">
            {typeConfig.tagline}
          </p>
        )}

        {/* Invite link — only for members */}
        {isFollowing && (
          <div className="mt-2">
            <InviteLinkButton
              communityId={community.id}
              communityName={community.name}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>
    </>
  );
}
