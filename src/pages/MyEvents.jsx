import React, { useState } from 'react';
import { Loader2, Calendar, MapPin, Clock } from 'lucide-react';
import { dataService, batchFetchByIds } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import { toast } from 'sonner';

export default function MyEvents() {
  const { user: currentUser } = useAuth();
  const [liked, setLiked] = useState({});

  const { data: rsvps = [], isLoading } = useQuery({
    queryKey: ['my-rsvps', currentUser?.id],
    queryFn: async () => {
      const myRsvps = await dataService.entities.RSVP.filter({ user_id: currentUser.id });
      return batchFetchByIds('UnifiedPost', myRsvps.map(r => r.post_id));
    },
    enabled: !!currentUser,
  });

  const { data: createdEvents = [] } = useQuery({
    queryKey: ['created-events', currentUser?.id],
    queryFn: async () => {
      const events = await dataService.entities.UnifiedPost.filter(
        { user_id: currentUser.id, type: 'event' },
        '-created_date',
        50
      );
      if (!events.length) return [];
      // Batch-load all RSVPs for every created event in one pass so that
      // EventCreatorCard never needs to fetch data on its own.
      const eventIds = new Set(events.map(e => e.id));
      const allRsvps = await dataService.entities.RSVP.filter({}, null, 5000);
      const rsvpsByEvent = {};
      allRsvps.filter(r => eventIds.has(r.post_id)).forEach(r => {
        (rsvpsByEvent[r.post_id] ??= []).push(r);
      });
      return events.map(e => ({ ...e, _rsvps: rsvpsByEvent[e.id] || [] }));
    },
    enabled: !!currentUser,
  });

  const handleRsvpRemove = async (postId) => {
    const rsvp = await dataService.entities.RSVP.filter({ post_id: postId, user_id: currentUser.id });
    if (rsvp[0]) {
      // TODO: implement delete when available
      toast.info('RSVP removal coming soon');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Events</h1>

        {/* Events I'm Going To */}
        {rsvps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Going ({rsvps.length})</h2>
            <div className="space-y-4">
              {rsvps.map(post => (
                <UnifiedPostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onLike={() => {}}
                  onComment={() => {}}
                  onDelete={() => {}}
                  onReport={() => {}}
                  liked={liked[post.id]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Events I Created */}
        {createdEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Events I Created ({createdEvents.length})</h2>
            <div className="space-y-4">
              {createdEvents.map(post => (
                <EventCreatorCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  rsvps={post._rsvps || []}
                />
              ))}
            </div>
          </div>
        )}

        {rsvps.length === 0 && createdEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No events yet</p>
            <p className="text-sm text-slate-500 mt-1">Create an event or RSVP to upcoming ones</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCreatorCard({ post, currentUser, rsvps = [] }) {
  const [showGuests, setShowGuests] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 mb-2">{post.title}</h3>
          <p className="text-sm text-slate-600 mb-3">{post.body}</p>
        </div>

        {/* Event details */}
        <div className="bg-blue-50 rounded-lg p-3 space-y-2 border border-blue-100">
          {post.event_date && (
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
          {post.event_time && (
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Clock className="w-4 h-4" />
              <span>{post.event_time}</span>
            </div>
          )}
          {post.location_text && (
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <MapPin className="w-4 h-4" />
              <span>{post.location_text}</span>
            </div>
          )}
        </div>

        {/* Guest list */}
        <div className="border-t pt-3">
          <button
            onClick={() => setShowGuests(!showGuests)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            {rsvps.length} Going {showGuests ? '▼' : '▶'}
          </button>

          {showGuests && rsvps.length > 0 && (
            <div className="mt-3 space-y-2">
              {rsvps.map(guest => (
                <div key={guest.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  {guest.user_avatar_url && (
                    <img src={guest.user_avatar_url} alt="" className="w-6 h-6 rounded-full" />
                  )}
                  <span className="text-sm text-slate-700">{guest.user_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}