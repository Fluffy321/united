import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Flag, Trash2, Calendar, MapPin, Clock, CheckCircle2, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import UserAvatar from '@/components/common/UserAvatar';
import HelperBadge from '@/components/profile/HelperBadge';
import MessageButton from '@/components/common/MessageButton';
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
  help:         { label: 'Help Needed',  color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  event:        { label: 'Event',        color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  job:          { label: 'Job',          color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  housing:      { label: 'Housing',      color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  dating:       { label: 'Dating',       color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  food:         { label: 'Food',         color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  shul:         { label: 'Shul',         color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  news:         { label: 'News',         color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  prompt_reply: { label: 'Prompt',       color: 'bg-slate-100 text-slate-700 border border-slate-200' },
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
  const timeAgo = formatDistanceToNow(new Date(post.created_date), { addSuffix: true });
  const typeConfig = TYPE_CONFIGS[post.type] || TYPE_CONFIGS.feed;
  const [expanded, setExpanded] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [helpStatus, setHelpStatus] = useState(post.help_status || 'open');
  const [fulfilling, setFulfilling] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loadingRSVP, setLoadingRSVP] = useState(false);

  useEffect(() => {
    if (post.type === 'event' && currentUser) {
      const timer = setTimeout(() => {
        checkRSVPStatus();
      }, 100); // Debounce to reduce simultaneous requests
      return () => clearTimeout(timer);
    }
  }, [post.id, currentUser?.id]);

  const helpCat = HELP_REQUEST_CATEGORIES.find(c => c.value === post.category);

  const checkRSVPStatus = async () => {
    try {
      const rsvps = await base44.entities.RSVP.filter({ post_id: post.id, user_id: currentUser.id });
      setIsRSVPed(rsvps.length > 0);
      const allRsvps = await base44.entities.RSVP.filter({ post_id: post.id });
      setRsvpCount(allRsvps.length);
    } catch (error) {
      console.warn('Failed to check RSVP status:', error?.message);
      // Silently fail to avoid blocking UI
    }
  };

  const handleRSVP = async () => {
    setLoadingRSVP(true);
    try {
      if (isRSVPed) {
        const rsvps = await base44.entities.RSVP.filter({ post_id: post.id, user_id: currentUser.id });
        if (rsvps[0]) await base44.entities.RSVP.delete(rsvps[0].id);
        setIsRSVPed(false);
        setRsvpCount(c => Math.max(0, c - 1));
        toast.success('RSVP removed');
      } else {
        await base44.entities.RSVP.create({
          post_id: post.id,
          user_id: currentUser.id,
          user_name: currentUser.display_name || currentUser.full_name,
          user_avatar_url: currentUser.avatar_url,
          status: 'going'
        });
        setIsRSVPed(true);
        setRsvpCount(c => c + 1);
        toast.success('You\'re going! 🎉');
      }
    } catch (error) {
      toast.error('Failed to update RSVP');
    } finally {
      setLoadingRSVP(false);
    }
  };

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
              <UserAvatar user={{...post, display_name: post.user_name}} size="sm" />
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
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
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
      <div className="px-4 pt-3 pb-1">
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

        {/* Image */}
        {post.image_url && (
          <div className="mt-2.5 mb-1">
            {imgExpanded ? (
              <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setImgExpanded(false)}>
                <img src={post.image_url} alt="" className="w-full object-cover" loading="lazy" decoding="async" />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setImgExpanded(true)}>
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[#EAECF0]">
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
                <span className="text-xs text-[#98A2B3] font-medium">Tap to expand</span>
              </div>
            )}
          </div>
        )}

        {/* Event details */}
        {post.type === 'event' && (
          <div className="bg-slate-50 rounded-xl px-3 py-2 mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border border-slate-200">
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
          </div>
        )}

        {/* Location (non-event) */}
        {post.location_text && post.type !== 'event' && (
          <div className="flex items-center gap-1 text-[12px] text-[#98A2B3] mt-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{post.location_text}</span>
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
      <div className="flex items-center px-3 py-2 mt-1 border-t border-[#F2F4F7] bg-white rounded-b-[14px]">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[13px] font-medium transition-colors ${liked ? 'text-red-600 bg-red-50' : 'text-[#64748B] hover:bg-slate-100'}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{post.likes_count || 0}</span>
        </button>

        <button
          onClick={() => onComment(post)}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[13px] font-medium text-[#64748B] hover:bg-slate-100 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count || 0}</span>
        </button>

        {/* Fulfilled button — only for owner of open help posts */}
        {post.type === 'help' && isOwner && helpStatus === 'open' && (
          <button
            onClick={handleFulfilled}
            disabled={fulfilling}
            className="ml-auto h-8 px-3.5 rounded-full text-[13px] font-semibold btn-primary !rounded-full !h-8 !px-3.5 !py-0 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {fulfilling ? 'Saving…' : 'Mark Fulfilled'}
          </button>
        )}

        {/* Message button for coordination */}
        {post.user_id !== currentUser?.id && (
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

        {post.type === 'event' && (
          <button
            onClick={handleRSVP}
            disabled={loadingRSVP}
            className={`h-8 px-3.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-colors ${
              isRSVPed
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'btn-primary !rounded-full !h-8 !px-3.5 !py-0 text-[13px]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {loadingRSVP ? 'Saving...' : isRSVPed ? `Going (${rsvpCount}) ✕` : 'RSVP'}
          </button>
        )}

        {ACTION_BUTTON[post.type] && post.type !== 'help' && post.type !== 'event' && (
          <button
            onClick={() => onComment(post)}
            className="ml-auto h-8 px-3.5 rounded-full text-[13px] font-semibold btn-secondary !rounded-full !h-8 !px-3.5 !py-0"
          >
            {ACTION_BUTTON[post.type].label}
          </button>
        )}
      </div>
    </motion.div>
  );
}