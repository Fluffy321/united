import React from 'react';
import { Calendar, Clock, MapPin, Plus, Users, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import EventRSVPSection from '@/components/events/EventRSVPSection';
import { useState } from 'react';
import { motion } from 'framer-motion';

function getDateLabel(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (isToday(d)) return { label: 'Today', color: 'text-green-700 bg-green-50 border-green-200' };
  if (isTomorrow(d)) return { label: 'Tomorrow', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  return { label: format(d, 'EEE, MMM d'), color: 'text-slate-700 bg-slate-100 border-slate-200' };
}

function EventCard({ post, currentUser, onCreateEvent }) {
  const [showRSVP, setShowRSVP] = useState(false);
  const dateLabel = getDateLabel(post.event_date);
  const gone = post.event_date && isPast(parseISO(post.event_date + 'T23:59:59'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border overflow-hidden ${gone ? 'opacity-60' : 'border-slate-100'}`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      {/* Image banner if present */}
      {post.image_url && (
        <div className="h-36 overflow-hidden">
          <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="p-4">
        {/* Date + time row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          {dateLabel && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${dateLabel.color}`}>
              {dateLabel.label}
            </span>
          )}
          {post.event_time && (
            <span className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {post.event_time}
            </span>
          )}
          {gone && <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Past</span>}
        </div>

        {/* Title / body */}
        {post.title && <h3 className="font-bold text-[15px] text-slate-900 mb-1 leading-snug">{post.title}</h3>}
        <p className="text-[13.5px] text-slate-600 leading-relaxed line-clamp-2 mb-2.5">{post.body}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap text-[12px] text-slate-500 mb-3">
          <span className="font-medium">{post.user_name}</span>
          {post.location_text && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {post.location_text}
            </span>
          )}
        </div>

        {/* RSVP toggle */}
        {!gone && (
          <>
            <button
              onClick={() => setShowRSVP(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors"
              style={{ background: showRSVP ? '#1d4ed8' : '#2563eb' }}
            >
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> RSVP</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showRSVP ? 'rotate-90' : ''}`} />
            </button>
            {showRSVP && (
              <div className="mt-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                <EventRSVPSection postId={post.id} currentUser={currentUser} eventDate={post.event_date} />
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function EventsFeedSection({ posts, currentUser, onCreateEvent }) {
  const eventPosts = posts
    .filter(p => p.type === 'event' || p.board === 'events')
    .sort((a, b) => {
      // Future events first, sorted by date; past events at the bottom
      const aDate = a.event_date ? new Date(a.event_date) : new Date(0);
      const bDate = b.event_date ? new Date(b.event_date) : new Date(0);
      const now = new Date();
      const aFuture = aDate >= now;
      const bFuture = bDate >= now;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      if (aFuture && bFuture) return aDate - bDate;
      return bDate - aDate; // both past: most recent first
    });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900">Upcoming Events</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Community events near you</p>
        </div>
        <button
          onClick={onCreateEvent}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold text-white"
          style={{ background: '#2563EB', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Event
        </button>
      </div>

      {eventPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="text-4xl mb-3">📅</div>
          <p className="font-bold text-slate-800 text-[15px]">No events yet</p>
          <p className="text-[13px] text-slate-400 mt-1 mb-4">Be the first to post a community event!</p>
          <button
            onClick={onCreateEvent}
            className="px-5 py-2 rounded-full text-[13px] font-semibold text-white bg-blue-600"
          >
            Post an Event
          </button>
        </div>
      ) : (
        eventPosts.map(post => (
          <EventCard key={post.id} post={post} currentUser={currentUser} />
        ))
      )}
    </div>
  );
}