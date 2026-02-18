import React, { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Flag, Trash2, Calendar, MapPin, Clock, Briefcase, Home, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from '@/components/common/UserAvatar';
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

const TYPE_CONFIGS = {
  feed: { label: 'POST', color: 'bg-slate-100 text-slate-700' },
  help: { label: 'HELP NEEDED', color: 'bg-amber-100 text-amber-700' },
  event: { label: 'EVENT', color: 'bg-blue-100 text-blue-700' },
  job: { label: 'JOB', color: 'bg-green-100 text-green-700' },
  housing: { label: 'HOUSING', color: 'bg-purple-100 text-purple-700' },
  dating: { label: 'DATING', color: 'bg-pink-100 text-pink-700' },
  food: { label: 'FOOD', color: 'bg-orange-100 text-orange-700' },
  shul: { label: 'SHUL', color: 'bg-indigo-100 text-indigo-700' },
  news: { label: 'NEWS', color: 'bg-cyan-100 text-cyan-700' },
  prompt_reply: { label: 'PROMPT REPLY', color: 'bg-indigo-100 text-indigo-700' }
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

  const BODY_LIMIT = 120;
  const bodyLong = post.body && post.body.length > BODY_LIMIT;
  const bodyPreview = bodyLong && !expanded ? post.body.slice(0, BODY_LIMIT).trimEnd() + '…' : post.body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="bg-white rounded-2xl px-4 py-3 border border-slate-100"
      style={{ contain: 'content' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isAnonymous ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm flex-shrink-0">?</div>
              <div>
                <span className="font-semibold text-slate-900 text-sm">Anonymous</span>
                <p className="text-xs text-slate-400">{timeAgo}</p>
              </div>
            </div>
          ) : (
            <Link to={createPageUrl('Profile') + `?id=${post.user_id}`} className="flex items-center gap-2 min-w-0">
              <UserAvatar user={{...post, display_name: post.user_name}} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 text-sm truncate">{post.user_name}</span>
                  {post.user_age_range && (
                    <Badge variant="outline" className="text-[10px] font-normal bg-slate-50 border-slate-200 text-slate-500 px-1 py-0 flex-shrink-0">
                      {post.user_age_range}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400">{post.city} · {timeAgo}</p>
              </div>
            </Link>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge className={`${typeConfig.color} border-0 text-[10px] font-semibold px-1.5 py-0.5`}>
            {typeConfig.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
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

      {/* Prompt context */}
      {post.prompt_text && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-2.5 py-1.5 mb-2 border border-indigo-100">
          <p className="text-xs text-indigo-700 font-bold">💭 {post.prompt_text}</p>
        </div>
      )}

      {/* Title */}
      {post.title && (
        <h3 className="font-bold text-sm text-black mb-1">{post.title}</h3>
      )}

      {/* Body */}
      <p className="text-black text-sm leading-snug font-bold">
        {bodyPreview}
        {bodyLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="ml-1 text-[#0F5ED7] font-semibold text-xs"
          >
            {expanded ? 'See less' : 'See more'}
          </button>
        )}
      </p>

      {/* Image — compact thumbnail unless expanded */}
      {post.image_url && (
        <div className="mt-2 mb-1">
          {imgExpanded ? (
            <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setImgExpanded(false)}>
              <img src={post.image_url} alt="" className="w-full object-cover" loading="lazy" decoding="async" />
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setImgExpanded(true)}>
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
              <span className="text-xs text-slate-400">Tap to view image</span>
            </div>
          )}
        </div>
      )}

      {/* Event details */}
      {post.type === 'event' && (
        <div className="bg-blue-50 rounded-lg px-2.5 py-1.5 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {post.event_date && (
            <div className="flex items-center gap-1 text-xs text-blue-900">
              <Calendar className="w-3 h-3" />
              <span>{new Date(post.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
          {post.event_time && (
            <div className="flex items-center gap-1 text-xs text-blue-900">
              <Clock className="w-3 h-3" />
              <span>{post.event_time}</span>
            </div>
          )}
          {post.location_text && (
            <div className="flex items-center gap-1 text-xs text-blue-900">
              <MapPin className="w-3 h-3" />
              <span>{post.location_text}</span>
            </div>
          )}
        </div>
      )}

      {/* Location (non-event) */}
      {post.location_text && post.type !== 'event' && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
          <MapPin className="w-3 h-3" />
          <span>{post.location_text}</span>
        </div>
      )}

      {/* Help category */}
      {post.category && post.type === 'help' && (
        <Badge variant="outline" className="mt-1.5 text-xs px-1.5 py-0">
          {post.category}
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 pt-2 mt-1.5 border-t border-slate-100">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onLike(post.id)}
          className={`h-7 px-2 gap-1.5 text-xs ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{post.likes_count || 0}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onComment(post)}
          className="h-7 px-2 gap-1.5 text-xs text-slate-400 hover:text-indigo-600"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count || 0}</span>
        </Button>

        {ACTION_BUTTON[post.type] && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComment(post)}
            className="ml-auto h-7 px-2 text-[#0F5ED7] font-semibold hover:bg-blue-50 text-xs"
          >
            {ACTION_BUTTON[post.type].label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}