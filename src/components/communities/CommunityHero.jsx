import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Star, Settings, Share2, Plus } from 'lucide-react';
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

function MemberAvatarStrip({ members, totalCount, onViewMembers }) {
  const shown = members.slice(0, 5);
  return (
    <button onClick={onViewMembers} className="flex items-center gap-1.5 mt-3 active:opacity-70 transition-opacity">
      <div className="flex -space-x-2">
        {shown.map((m, i) => (
          <div
            key={m.id || i}
            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{
              background: ['#2563EB','#7C3AED','#16A34A','#D97706','#DC2626'][i % 5],
              zIndex: 10 - i
            }}
          >
            {(m.user_name || m.user_id || '?')[0]?.toUpperCase()}
          </div>
        ))}
      </div>
      {totalCount > 5 && (
        <span className="text-[12px] font-bold text-white/90 bg-white/20 rounded-full px-2 py-0.5">
          +{totalCount - 5}
        </span>
      )}
      {totalCount > 0 && (
        <span className="text-[12px] text-white/80 font-medium">
          {totalCount.toLocaleString()} members
        </span>
      )}
    </button>
  );
}

export default function CommunityHero({
  community, isFollowing, isAdmin, onBack, onFollow, onClaim,
  eventCount, mitzvahCount, actualMemberCount, postsThisWeek,
  members = [], currentUser, onTabChange, typeConfig: providedTypeConfig
}) {
  const scrollRef = useRef(null);
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

  // Scroll listener for parallax + sticky
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setStickyVisible(y > 140);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const coverParallax = Math.min(scrollY * 0.4, 60);
  const coverOpacity = Math.max(0, 1 - scrollY / 200);

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
          onClick={onFollow}
          className={`h-8 px-4 rounded-full text-[13px] font-bold transition-colors ${
            isFollowing ? 'bg-slate-100 text-slate-600' : 'bg-[#2563EB] text-white'
          }`}
        >
          {isFollowing ? 'Joined' : '+ Join'}
        </button>
      </motion.div>

      {/* ── Hero cover ── */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        {/* Cover image or gradient */}
        <div
          className="absolute inset-0 w-full"
          style={{
            transform: `translateY(${coverParallax}px)`,
            opacity: coverOpacity,
            transition: 'opacity 0.1s',
          }}
        >
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

      {/* ── Identity row: logo + name + actions ── */}
      <div className="bg-white px-4 pt-0 pb-4 border-b border-slate-100">
        {/* Logo overlapping cover */}
        <div className="flex items-end gap-3 -mt-8 mb-3">
          <div className="relative flex-shrink-0">
            <div className="rounded-2xl border-4 border-white shadow-lg overflow-hidden" style={{ width: 64, height: 64 }}>
              <CommunityLogo community={community} size="lg" />
            </div>
            {/* Active dot */}
            {isActive && (
              <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-8">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-extrabold text-slate-900 text-[18px] leading-tight">{community.name}</h1>
              {community.is_claimed && <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0" />}
              {community.is_featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />}
            </div>
            {community.neighborhood && (
              <p className="text-[12px] text-slate-500">{community.neighborhood}</p>
            )}
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
              <TypeIcon className="h-3.5 w-3.5" />
              {typeConfig.tagline}
            </p>
          </div>
        </div>

        {/* Member avatars strip */}
        {members.length > 0 && (
          <MemberAvatarStrip
            members={members}
            totalCount={memberCount}
            onViewMembers={() => onTabChange?.('members')}
          />
        )}

        {/* Stats ribbon */}
        <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-hide">
          {[
            { label: 'Posts this wk', value: postsThisWeek, tab: 'posts', show: true },
            { label: 'Events', value: eventCount, tab: 'events', show: eventCount > 0 },
            { label: 'Open needs', value: mitzvahCount, tab: 'openNeeds', show: mitzvahCount > 0 },
            { label: 'Members', value: memberCount, tab: 'members', show: true },
          ].filter(s => s.show).map(s => (
            <button
              key={s.label}
              onClick={() => onTabChange?.(s.tab)}
              className="flex-shrink-0 text-center bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl px-3 py-2 transition-colors active:scale-95"
            >
              <div className="text-[15px] font-extrabold text-slate-900">{s.value ?? 0}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 whitespace-nowrap">{s.label}</div>
            </button>
          ))}
        </div>

        {/* CTA row */}
        <div className="flex gap-2 mt-3">
          {isFollowing ? (
            <>
              <button
                onClick={() => onTabChange?.('posts')}
                className="flex-1 h-10 text-[14px] font-bold rounded-xl bg-[#2563EB] text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> {typeConfig.primaryCta}
              </button>
              <button
                onClick={onFollow}
                className="h-10 px-4 text-[13px] font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                ✓ Joined
              </button>
              {isAdmin && (
                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={onFollow}
                className="flex-1 h-10 text-[14px] font-bold rounded-xl bg-[#2563EB] text-white active:scale-95 transition-all"
              >
                + Join Community
              </button>
            </>
          )}
          {isFollowing && (
            <InviteLinkButton
              communityId={community.id}
              communityName={community.name}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    </>
  );
}
