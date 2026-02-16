import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pin, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ShulPostCard({ post, currentUser, isAdmin, onRefresh }) {
  const isAnnouncement = post.type === 'announcement';

  return (
    <div className={`bg-white rounded-xl p-4 border ${
      post.is_pinned ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {post.is_pinned && (
              <Pin className="w-4 h-4 text-indigo-600" />
            )}
            {isAnnouncement && (
              <Badge className="bg-indigo-600 text-white text-xs">Announcement</Badge>
            )}
          </div>
          {post.title && (
            <h3 className="font-bold text-slate-900 mb-1">{post.title}</h3>
          )}
          <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          {post.user_name} • {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
        </div>
        <Button variant="ghost" size="sm" className="text-slate-600">
          <MessageCircle className="w-4 h-4 mr-1" />
          {post.comments_count || 0}
        </Button>
      </div>
    </div>
  );
}