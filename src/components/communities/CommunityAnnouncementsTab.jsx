import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Megaphone, Sparkles } from 'lucide-react';

export default function CommunityAnnouncementsTab({ posts, isLoading }) {
  const announcements = (posts || [])
    .filter(p => p.type === 'announcement')
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });

  if (isLoading) return (
    <div className="space-y-3 pt-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-3.5 w-48 rounded" />
          <div className="skeleton h-3 w-full rounded" />
        </div>
      ))}
    </div>
  );

  if (announcements.length === 0) return (
    <div className="text-center py-14">
      <p className="text-3xl mb-2">📣</p>
      <p className="text-[14px] font-semibold text-slate-700">No announcements yet</p>
      <p className="text-[12px] text-slate-400 mt-1">Official shul announcements will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-3 pt-4">
      {announcements.map(a => {
        const timeAgo = a.created_date
          ? formatDistanceToNow(new Date(a.created_date), { addSuffix: true })
          : '';
        return (
          <div key={a.id} className={`bg-white rounded-2xl border p-4 ${a.is_pinned ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">
                  <Megaphone className="w-2.5 h-2.5" /> Announcement
                </span>
                {a.is_pinned && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
                {a.is_seeded && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded-full">Sample</span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">{timeAgo}</span>
            </div>
            {a.title && <h3 className="font-bold text-slate-900 text-[14px] mb-1">{a.title}</h3>}
            <p className="text-[13px] text-slate-700 leading-relaxed">{a.body}</p>
          </div>
        );
      })}
    </div>
  );
}