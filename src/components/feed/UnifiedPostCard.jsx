import React from 'react';
import { Heart, MessageCircle, MoreHorizontal, Flag, Trash2, Calendar, MapPin, Clock } from 'lucide-react';
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
  help: { label: 'HELP', color: 'bg-amber-100 text-amber-700' },
  event: { label: 'EVENT', color: 'bg-blue-100 text-blue-700' },
  job: { label: 'JOB', color: 'bg-green-100 text-green-700' },
  housing: { label: 'HOUSING', color: 'bg-purple-100 text-purple-700' },
  food: { label: 'FOOD', color: 'bg-orange-100 text-orange-700' },
  prompt_reply: { label: 'PROMPT REPLY', color: 'bg-indigo-100 text-indigo-700' }
};

export default function UnifiedPostCard({ post, currentUser, onLike, onComment, onDelete, onReport, liked }) {
  const isOwner = currentUser?.id === post.user_id;
  const isAnonymous = post.is_anonymous;
  const timeAgo = formatDistanceToNow(new Date(post.created_date), { addSuffix: true });
  const typeConfig = TYPE_CONFIGS[post.type] || TYPE_CONFIGS.feed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="bg-white rounded-2xl px-4 py-5 border border-slate-100"
      style={{ contain: 'content' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          {isAnonymous ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xl">
                ?
              </div>
              <div>
                <span className="font-semibold text-slate-900">Anonymous</span>
                <p className="text-sm text-slate-500">{timeAgo}</p>
              </div>
            </div>
          ) : (
            <Link to={createPageUrl('Profile') + `?id=${post.user_id}`} className="flex items-center gap-3">
              <UserAvatar user={{...post, display_name: post.user_name}} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{post.user_name}</span>
                  {post.user_age_range && (
                    <Badge variant="outline" className="text-xs font-normal bg-slate-50 border-slate-200 text-slate-600">
                      {post.user_age_range}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">{post.city} · {timeAgo}</p>
              </div>
            </Link>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={`${typeConfig.color} border-0 text-xs font-semibold`}>
            {typeConfig.label}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onReport(post.id, 'post')}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {post.prompt_text && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl px-3 py-2 mb-3 border border-indigo-100">
          <p className="text-sm text-indigo-700 font-bold">💭 {post.prompt_text}</p>
        </div>
      )}

      {post.title && (
        <h3 className="font-bold text-[15px] text-black mb-1.5">{post.title}</h3>
      )}

      <p className="text-black text-sm leading-relaxed mb-2 whitespace-pre-wrap font-bold">{post.body}</p>

      {post.image_url && (
        <div className="rounded-xl overflow-hidden mb-3">
          <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
        </div>
      )}

      {post.type === 'event' && (
        <div className="bg-blue-50 rounded-xl p-3 mb-3 space-y-2">
          {post.event_date && (
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          )}
          {post.event_time && (
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Clock className="w-4 h-4" />
              <span>{post.event_time}</span>
            </div>
          )}
          {post.location_text && (
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <MapPin className="w-4 h-4" />
              <span>{post.location_text}</span>
            </div>
          )}
        </div>
      )}

      {post.location_text && post.type !== 'event' && (
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span>{post.location_text}</span>
        </div>
      )}

      {post.category && post.type === 'help' && (
        <Badge variant="outline" className="mb-3">
          {post.category}
        </Badge>
      )}

      <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onLike(post.id)}
          className={`gap-2 ${liked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>{post.likes_count || 0}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onComment(post)}
          className="gap-2 text-slate-500 hover:text-indigo-600"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments_count || 0}</span>
        </Button>
      </div>
    </motion.div>
  );
}