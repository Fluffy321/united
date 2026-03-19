import React, { useState, useEffect } from 'react';
import { MessageCircle, MoreHorizontal, Flag, Trash2, Calendar, MapPin, Clock, CheckCircle2, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import UserAvatar from '@/components/common/UserAvatar';
import HelperBadge from '@/components/profile/HelperBadge';
import MessageButton from '@/components/common/MessageButton';
import CommentsSheet from './CommentsSheet';
import EventRSVPSection from '@/components/events/EventRSVPSection';
import ReactionBar from './ReactionBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { HELP_REQUEST_CATEGORIES } from '@/components/feed/RequestHelpModal';

const TYPE_CONFIGS = {
  feed:         { label: 'Post',         color: 'bg-slate-100 text-slate-600' },
  help:         { label: 'Help Needed',  color: 'bg-orange-50 text-orange-700 border border-orange-200' },
  event:        { label: 'Event',        color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  job:          { label: 'Job',          color: 'bg-green-50 text-green-700 border border-green-200' },
  housing:      { label: 'Housing',      color: 'bg-purple-50 text-purple-700 border border-purple-200' },
  dating:       { label: 'Dating',       color: 'bg-pink-50 text-pink-700 border border-pink-200' },
  food:         { label: 'Food',         color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  shul:         { label: 'Shul',         color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  news:         { label: 'News',         color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  prompt_reply: { label: 'Prompt',       color: 'bg-violet-50 text-violet-700 border border-violet-200' },
};

const SUBTYPE_CONFIGS = {
  discussion:     { label: '💬 Discussion',     color: 'bg-slate-100 text-slate-600' },
  question:       { label: '❓ Question',        color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  alert:          { label: '🚨 Alert',           color: 'bg-red-50 text-red-700 border border-red-200' },
  recommendation: { label: '⭐ Recommendation', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  lost_found:     { label: '🔍 Lost & Found',   color: 'bg-blue-50 text-blue-700 border border-blue-200' },
};

const ACTION_BUTTON = {
  help: { label: 'Offer Help', icon: null },
  event: { label: 'RSVP', icon: null },
  job: { label: 'Apply', icon: null },
  housing: { label: 'Interested', icon: null },
  dating: { label: 'Connect', icon: null },
};

export default function UnifiedPostCard({ post, currentUser, onLike, onComment, onDelete, onReport, liked }) {
  const isOwner = currentUser?.id === post.user_id;
  const isAnonymous = post.is_anonymous;

  // For seeded posts, generate a deterministic spread-out timestamp from post ID
  const getDisplayDate = () => {
    if (post.is_seeded) {
      const hash = post.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const maxMs = 4 * 24 * 60 * 60 * 1000; // 4 days
      return new Date(Date.now() - (hash % maxMs));
    }
    return new Date(post.created_date);
  };

  const timeAgo = formatDistanceToNow(getDisplayDate(), { addSuffix: true });
  const typeConfig = TYPE_CONFIGS[post.type] || TYPE_CONFIGS.feed;
  const [expanded, setExpanded] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [helpStatus, setHelpStatus] = useState(post.help_status || 'open');
  const [fulfilling, setFulfilling] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loadingRSVP, setLoadingRSVP] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const helpCat = HELP_REQUEST_CATEGORIES.find(c => c.value === post.category);

  const handleFulfilled = async () => {
    setFulfilling(true);
    await base44.entities.UnifiedPost.update(post.id, { help_status: 'fulfilled' });
    setHelpStatus('fulfilled');
    setFulfilling(false);
    toast.success('Marked as fulfilled! 🎉');
  };

  const BODY_LIMIT = 120;
  const bodyLong = post.body && post.body.length > BODY_LIMIT;
  const bodyPreview = bodyLong && !expanded ? post.body.slice(0, BODY_LIMIT).trimEnd() + '…' : post.body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-[14px] border border-[#EAECF0] overflow-visible"
      style={{ background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {isAnonymous ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm flex-shrink-0 font-semibold">?</div>
              <div>
                <span className="font-semibold text-[#0F1C2E] text-[14px]">Anonymous</span>
                <p className="text-[11px] text-[#98A2B3] mt-0.5">{timeAgo}</p>
              </div>
            </div>
          ) : (
            <Link to={createPageUrl('Profile') + `?id=${post.user_id}`} className="flex items-center gap-2.5 min-w-0">
              <UserAvatar user={post} name={post.user_name} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[#0F1C2E] text-[14px] truncate">{post.user_name}</span>
                  {post.helper_badge && post.helper_badge !== 'none' && (
                    <HelperBadge badge={post.helper_badge} size="sm" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-[#98A2B3]">{timeAgo}</span>
                  {post.city && (
                    <>
                      <span className="text-[#C8D0DC] text-[10px]">·</span>
                      <span className="text-[11px] text-[#2563EB] font-medium">{post.city}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Activity labels */}
          {(() => {
            const score = (post.likes_count || 0) + (post.comments_count || 0) * 2;
            const isNew = !post.is_seeded && (Date.now() - new Date(post.created_date).getTime()) < 2 * 60 * 60 * 1000;
            const isHot = score >= 20;
            const isChessed = post.type === 'help';
            return (
              <>
                {isHot && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">🔥 Active</span>}
                {isNew && !isHot && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">🟢 New</span>}
                {isChessed && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">❤️ Chessed</span>}
              </>
            );
          })()}
          {post.post_subtype && SUBTYPE_CONFIGS[post.post_subtype] ? (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SUBTYPE_CONFIGS[post.post_subtype].color}`}>
              {SUBTYPE_CONFIGS[post.post_subtype].label}
            </span>
          ) : (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#64748B] hover:bg-slate-100 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onReport(post.id, 'post')}>
                  <Flag className="w-4 h-4 mr-2" />Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 pt-3 pb-1 relative">
        {/* Prompt context */}
        {post.prompt_text && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl px-3 py-2 mb-2.5 border border-violet-100">
            <p className="text-xs text-violet-700 font-semibold">💭 {post.prompt_text}</p>
          </div>
        )}

        {/* Title */}
        {post.title && (
          <h3 className="font-bold text-[15px] text-[#0F1C2E] mb-1.5 leading-snug">{post.title}</h3>
        )}

        {/* Body */}
        <p className="text-[14.5px] text-[#344054] leading-relaxed">
          {bodyPreview}
          {bodyLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="ml-1 text-[#2563EB] font-semibold text-[13px]"
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </p>

        {/* Image — full width, tap to toggle zoom */}
        {post.image_url && (
          <div className="mt-3 -mx-4 cursor-pointer" onClick={() => setImgExpanded(e => !e)}>
            <img
              src={post.image_url}
              alt=""
              className={`w-full object-cover transition-all ${imgExpanded ? 'max-h-[480px]' : 'max-h-52'}`}
              loading="lazy"
              decoding="async"
            />
            {!imgExpanded && (
              <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none">tap to expand</div>
            )}
          </div>
        )}

        {/* Event details */}
        {post.type === 'event' && (
          <div className="space-y-3 mt-3">
            <button
              onClick={() => setShowEventDetails(!showEventDetails)}
              className="w-full bg-slate-50 rounded-xl px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 border border-slate-200 hover:bg-slate-100 transition-colors text-left"
            >
              {post.event_date && (
                <div className="flex items-center gap-1.5 text-[12px] text-slate-700 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(post.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {post.event_time && (
                <div className="flex items-center gap-1.5 text-[12px] text-slate-700 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.event_time}</span>
                </div>
              )}
              {post.location_text && (
                <div className="flex items-center gap-1.5 text-[12px] text-slate-700 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{post.location_text}</span>
                </div>
              )}
            </button>
            
            {/* RSVP Section */}
            {showEventDetails && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <EventRSVPSection 
                  postId={post.id}
                  currentUser={currentUser}
                  eventDate={post.event_date}
                />
              </div>
            )}
          </div>
        )}

        {/* Location tag */}
        {post.location_text && post.type !== 'event' && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold">
              <MapPin className="w-3 h-3" />
              {post.location_text}
            </span>
          </div>
        )}

        {/* Help status and metadata */}
        {post.type === 'help' && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {helpCat && (
              <span
                className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
                style={{ backgroundColor: helpCat.bgColor, color: helpCat.textColor }}
              >
                <span>{helpCat.emoji}</span> {helpCat.label}
              </span>
            )}
            {helpStatus === 'fulfilled' ? (
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fulfilled
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                Open
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="px-3 py-2 mt-1 border-t border-[#F2F4F7] bg-white rounded-b-[14px]">
        <div className="flex items-center justify-between">
          {/* Left: Likes + Comments */}
          <div className="flex items-center gap-1">
            <ReactionBar postId={post.id} currentUser={currentUser} />
            <button
              onClick={() => setCommentsOpen(true)}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[13px] font-medium text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {commentCount > 0 && <span>{commentCount}</span>}
            </button>
          </div>

          {/* Right: context-aware action */}
          <div className="flex items-center gap-1.5">
            {/* Message button (not for own posts) */}
            {post.user_id !== currentUser?.id && post.type !== 'event' && (
              <MessageButton
                recipientId={post.user_id}
                recipientName={post.user_name}
                postId={post.id}
                postTitle={post.title || post.body?.substring(0, 50)}
                postType={post.type}
                currentUser={currentUser}
                variant="compact"
              />
            )}

            {/* Help: mark fulfilled (owner) */}
            {post.type === 'help' && isOwner && helpStatus === 'open' && (
              <button
                onClick={handleFulfilled}
                disabled={fulfilling}
                className="h-8 px-3.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 text-white disabled:opacity-50"
                style={{ background: '#16A34A' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {fulfilling ? 'Saving…' : 'Fulfilled'}
              </button>
            )}

            {/* Event: RSVP */}
            {post.type === 'event' && (
              <button
                onClick={() => setShowEventDetails(!showEventDetails)}
                className="h-8 px-3.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                {showEventDetails ? 'Hide' : 'RSVP'}
              </button>
            )}

            {/* Other types: secondary action */}
            {ACTION_BUTTON[post.type] && post.type !== 'help' && post.type !== 'event' && (
              <button
                onClick={() => onComment(post)}
                className="h-8 px-3.5 rounded-full text-[13px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {ACTION_BUTTON[post.type].label}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet 
        postId={post.id}
        postAuthorId={post.user_id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        currentUser={currentUser}
      />
    </motion.div>
  );
}