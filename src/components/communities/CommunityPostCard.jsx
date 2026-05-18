import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Pin, Calendar, MapPin, Clock, Megaphone } from 'lucide-react';

export default function CommunityPostCard({ post }) {
  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : '';
  const isAnnouncement = post.is_official || post.type === 'announcement' || post.post_type === 'announcement' || post.post_kind === 'announcement';

  return (
    <div className={`rounded-2xl border p-4 ${isAnnouncement ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-blue-50' : 'border-slate-100 bg-white'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isAnnouncement && (
            <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-semibold">
              <Megaphone className="mr-1 h-3 w-3" />
              Official update
            </Badge>
          )}
          {post.is_pinned && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
          {post.type === 'event' && (
            <Badge className="bg-blue-50 text-blue-600 border-0 text-[10px]">Event</Badge>
          )}
        </div>
        <span className="text-xs text-slate-400">{timeAgo}</span>
      </div>

      {post.title && (
        <h3 className="font-bold text-slate-900 text-sm mb-1">{post.title}</h3>
      )}
      <p className="text-sm text-slate-700 leading-snug line-clamp-4">{post.body}</p>

      {post.type === 'event' && (post.event_date || post.event_time || post.location_text) && (
        <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 flex flex-wrap gap-x-3 gap-y-1">
          {post.event_date && (
            <span className="flex items-center gap-1 text-xs text-blue-800">
              <Calendar className="w-3 h-3" />
              {new Date(post.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {post.event_time && (
            <span className="flex items-center gap-1 text-xs text-blue-800">
              <Clock className="w-3 h-3" />{post.event_time}
            </span>
          )}
          {post.location_text && (
            <span className="flex items-center gap-1 text-xs text-blue-800">
              <MapPin className="w-3 h-3" />{post.location_text}
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-2">— {post.author_name}</p>
    </div>
  );
}
