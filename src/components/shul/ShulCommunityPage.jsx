import React, { useState } from 'react';
import { MapPin, Users, ChevronLeft, Bell, Calendar, FileText, Users2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import CommunityPostCard from '@/components/communities/CommunityPostCard';
import { filterCommunityPost, filterUserCommunity } from '@/services/entityServices';
import { postKeys } from '@/lib/queryKeys';

const TABS = ['Posts', 'Announcements', 'Events', 'Members'];

export default function ShulCommunityPage({ community, currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState('Posts');

  const { data: posts = [] } = useQuery({
    queryKey: postKeys.communityShul(community.id),
    queryFn: () => filterCommunityPost({ community_id: community.id, type: 'general' }),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['shul-announcements', community.id],
    queryFn: () => filterCommunityPost({ community_id: community.id, type: 'announcement' }),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['shul-events', community.id],
    queryFn: () => filterCommunityPost({ community_id: community.id, type: 'event' }),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['shul-members', community.id],
    queryFn: () => filterUserCommunity({ community_id: community.id }),
  });

  const tabContent = {
    Posts: posts,
    Announcements: announcements,
    Events: events,
    Members: members,
  };

  const currentContent = tabContent[activeTab];

  return (
    <div className="flex flex-col h-full bg-[#F5F7FB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 flex-shrink-0 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-[#2563EB] text-[14px] font-semibold mb-3">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="mb-4">
            <h1 className="text-[24px] font-bold text-slate-900">{community.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-[13px] text-slate-500">
              {(community.neighborhood || community.address) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {community.neighborhood || community.address?.split(',')[0]}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {community.follower_count || 0} members
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-[#2563EB] border-[#2563EB]'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                {tab === 'Posts' && <FileText className="w-4 h-4" />}
                {tab === 'Announcements' && <Bell className="w-4 h-4" />}
                {tab === 'Events' && <Calendar className="w-4 h-4" />}
                {tab === 'Members' && <Users2 className="w-4 h-4" />}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <div className="max-w-2xl mx-auto px-4 pt-4">
          {activeTab === 'Posts' && <PostsTab posts={posts} communityId={community.id} />}
          {activeTab === 'Announcements' && <AnnouncementsTab announcements={announcements} />}
          {activeTab === 'Events' && <EventsTab events={events} />}
          {activeTab === 'Members' && <MembersTab members={members} />}
        </div>
      </div>
    </div>
  );
}

function PostsTab({ posts, communityId }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📝</div>
        <p className="text-[13px] text-slate-400">No posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map(post => (
        <CommunityPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function AnnouncementsTab({ announcements }) {
  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📢</div>
        <p className="text-[13px] text-slate-400">No announcements</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map(post => (
        <AnnouncementCard key={post.id} announcement={post} />
      ))}
    </div>
  );
}

function AnnouncementCard({ announcement }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#2563EB] mt-2" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-[14px]">{announcement.title || 'Announcement'}</p>
          <p className="text-[12px] text-slate-500 mt-1">{announcement.author_name}</p>
        </div>
      </div>
      {announcement.body && (
        <p className="text-[13px] text-slate-700 leading-relaxed mt-3">{announcement.body}</p>
      )}
    </div>
  );
}

function EventsTab({ events }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-[13px] text-slate-400">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">🎉</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-[14px]">{event.title}</p>
          {event.event_date && (
            <p className="text-[12px] text-slate-500 mt-1">
              {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {event.event_time && ` at ${event.event_time}`}
            </p>
          )}
          {event.location_text && (
            <p className="text-[12px] text-slate-500 mt-0.5">{event.location_text}</p>
          )}
          {event.body && (
            <p className="text-[13px] text-slate-700 leading-relaxed mt-2">{event.body}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MembersTab({ members }) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">👥</div>
        <p className="text-[13px] text-slate-400">No members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map(member => (
        <div key={member.id} className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-[13px]">{member.user_name || 'Member'}</p>
            <p className="text-[11px] text-slate-400 capitalize">{member.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}