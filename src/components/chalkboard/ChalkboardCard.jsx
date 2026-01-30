import React from 'react';
import { MapPin, Calendar, Clock, MessageCircle, MoreHorizontal, Flag, Trash2, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const boardConfig = {
  help_needed: { label: 'Help Needed', color: 'bg-red-100 text-red-700 border-red-200', icon: '🆘' },
  events: { label: 'Events', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '📅' },
  dating: { label: 'Dating', color: 'bg-pink-100 text-pink-700 border-pink-200', icon: '💕' },
  jobs: { label: 'Jobs', color: 'bg-green-100 text-green-700 border-green-200', icon: '💼' },
  roommates: { label: 'Roommates', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🏠' },
  kosher_food: { label: 'Kosher Food', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🍽️' }
};

export default function ChalkboardCard({ post, currentUser, onComment, onMessage, onDelete, onReport }) {
  const config = boardConfig[post.board_type] || boardConfig.help_needed;
  const isOwner = currentUser?.id === post.author_id;
  const timeAgo = formatDistanceToNow(new Date(post.created_date), { addSuffix: true });
  
  const isExpired = post.expires_at && new Date(post.expires_at) < new Date();
  const canViewDating = post.board_type !== 'dating' || currentUser?.age_range === '18+';

  if (!canViewDating) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow ${isExpired ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <Badge variant="outline" className={`${config.color} border`}>
          {config.icon} {config.label}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner ? (
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onReport(post.id, 'chalkboard')}>
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="font-semibold text-lg text-slate-900 mb-2">{post.title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed mb-4">{post.content}</p>

      {post.event_date && (
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(post.event_date), 'MMM d, yyyy')}</span>
          </div>
          {post.event_time && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{post.event_time}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{post.location_details || post.city}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {post.is_anonymous ? (
            <span className="text-sm text-slate-500 italic">Anonymous</span>
          ) : (
            <Link to={createPageUrl('Profile') + `?id=${post.author_id}`} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                {post.author_name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700">{post.author_name}</span>
              <Badge variant="outline" className="text-xs scale-90">{post.author_age_range}</Badge>
            </Link>
          )}
          <span className="text-xs text-slate-400">· {timeAgo}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onComment(post)}
            className="gap-1 text-slate-500 hover:text-indigo-600"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">{post.comments_count || 0}</span>
          </Button>
          
          {!post.is_anonymous && !isOwner && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onMessage(post.author_id, post.author_name)}
              className="gap-1 text-slate-500 hover:text-indigo-600"
            >
              <Mail className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {isExpired && (
        <div className="mt-3 text-xs text-slate-400 text-center">This post has expired</div>
      )}
    </div>
  );
}