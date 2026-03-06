import React, { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Flag, Trash2, Calendar, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import UserAvatar from '@/components/common/UserAvatar';
import HelperBadge from '@/components/profile/HelperBadge';
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
  help:         { label: 'Help Needed',  color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  event:        { label: 'Event',        color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  job:          { label: 'Job',          color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  housing:      { label: 'Housing',      color: 'bg-violet-50 text-violet-700 border border-violet-200' },
  dating:       { label: 'Dating',       color: 'bg-rose-50 text-rose-700 border border-rose-200' },
  food:         { label: 'Food',         color: 'bg-orange-50 text-orange-700 border border-orange-200' },
  shul:         { label: 'Shul',         color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  news:         { label: 'News',         color: 'bg-sky-50 text-sky-700 border border-sky-200' },
  prompt_reply: { label: 'Prompt',       color: 'bg-purple-50 text-purple-700 border border-purple-200' },
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
              <UserAvatar user={{...post, display_name: post.user_name}} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[#0F1C2E] text-[14px] truncate">{post.user_name}</span>
                  {post.helper_badge && post.helper_badge !== 'none' && (
                    <HelperBadge badge={post.helper_badge} size="sm" />
                  )}
                </div>
                <p className="text-[11px] text-[#98A2B3] mt-0.5">{post.city} · {timeAgo}</p>
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
              <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#98A2B3] hover:bg-slate-100 transition-colors">
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
          <div className="bg-blue-50 rounded-xl px-3 py-2 mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border border-blue-100">
            {post.event_date && (
              <div className="flex items-center gap-1.5 text-[12px] text-blue-800 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(post.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            {post.event_time && (
              <div className="flex items-center gap-1.5 text-[12px] text-blue-800 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.event_time}</span>
              </div>
            )}
            {post.location_text && (
              <div className="flex items-center gap-1.5 text-[12px] text-blue-800 font-medium">
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
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fulfilled
              </span>
            ) : (
              <span className="text-[11px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 rounded-full">
                🟡 Open
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="flex items-center px-3 py-2 mt-1 border-t border-[#F2F4F7] bg-white rounded-b-[14px]">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[13px] font-medium transition-colors ${liked ? 'text-red-500 bg-red-50' : 'text-[#667085] hover:bg-slate-50'}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{post.likes_count || 0}</span>
        </button>
        
        <button
          onClick={() => onComment(post)}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[13px] font-medium text-[#667085] hover:bg-slate-50 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count || 0}</span>
        </button>

        {/* Fulfilled button — only for owner of open help posts */}
        {post.type === 'help' && isOwner && helpStatus === 'open' && (
          <button
            onClick={handleFulfilled}
            disabled={fulfilling}
            className="ml-auto h-8 px-3.5 rounded-full text-[13px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {fulfilling ? 'Saving…' : 'Mark Fulfilled'}
          </button>
        )}

        {ACTION_BUTTON[post.type] && post.type !== 'help' && (
          <button
            onClick={() => onComment(post)}
            className="ml-auto h-8 px-3.5 rounded-full text-[13px] font-semibold text-[#0F1C2E] bg-[#F2F4F7] hover:bg-[#E9EBF0] transition-colors"
          >
            {ACTION_BUTTON[post.type].label}
          </button>
        )}
      </div>
    </motion.div>
  );
}