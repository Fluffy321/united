import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ShulEventCard({ post, currentUser, isAdmin }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-start gap-3">
        <div className="bg-indigo-100 rounded-lg p-3 text-center min-w-[60px]">
          <div className="text-2xl font-bold text-indigo-600">
            {format(new Date(post.event_date), 'd')}
          </div>
          <div className="text-xs text-indigo-600 uppercase">
            {format(new Date(post.event_date), 'MMM')}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-slate-900 mb-1">{post.title}</h3>
          <p className="text-sm text-slate-700 mb-2">{post.content}</p>
          
          <div className="flex items-center gap-3 text-sm text-slate-600">
            {post.event_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.event_time}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}