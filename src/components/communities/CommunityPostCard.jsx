import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Pin, Calendar, MapPin, Clock } from 'lucide-react';

export default function CommunityPostCard({ post }) {
  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : '';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {post.is_official && (
            <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] font-semibold">Official</Badge>
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