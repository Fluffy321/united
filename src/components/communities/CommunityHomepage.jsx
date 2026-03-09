import React from 'react';
import { Calendar, Clock, MapPin, HandHeart, Users, ChevronRight, Megaphone, Pin, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_COLORS = {
  'Food Drive':   'bg-orange-50 text-orange-700',
  'Bikur Cholim': 'bg-rose-50 text-rose-700',
  'Chesed':       'bg-teal-50 text-teal-700',
  'Tutoring':     'bg-violet-50 text-violet-700',
  'Errands':      'bg-sky-50 text-sky-700',
  'Shabbos Help': 'bg-amber-50 text-amber-700',
  'Other':        'bg-slate-100 text-slate-600',
};

function EventMiniCard({ ev }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {ev.start_date && (
        <div className="bg-[#EEF4FF] px-4 py-2 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="text-[12px] font-bold text-[#2563EB]">
            {new Date(ev.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          {ev.start_time && (
            <>
              <span className="text-[#BFD7FF]">·</span>
              <span className="flex items-center gap-1 text-[12px] text-[#2563EB]">
                <Clock className="w-3 h-3" />{ev.start_time}
              </span>
            </>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-[14px] mb-1">{ev.title}</h3>
        {ev.description && <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2">{ev.description}</p>}
        {ev.location && (
          <div className="flex items-center gap-1.5 mt-2 text-[12px] text-slate-500">
            <MapPin className="w-3.5 h-3.5" /><span>{ev.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MitzvahMiniCard({ op }) {
  const colorClass = CATEGORY_COLORS[op.category] || CATEGORY_COLORS.Other;
  const spotsLeft = (op.slots_needed || 1) - (op.slots_filled || 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{op.category}</span>
        {spotsLeft > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <Users className="w-3 h-3" />{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
          </span>
        )}
      </div>
      <h3 className="font-bold text-slate-900 text-[14px] mb-1">{op.title}</h3>
      {op.description && <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2 mb-2">{op.description}</p>}
      {op.location && (
        <div className="flex items-center gap-1 text-[12px] text-slate-500">
          <MapPin className="w-3.5 h-3.5" />{op.location}
        </div>
      )}
    </div>
  );
}

function FeedPostMini({ post }) {
  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : '';
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-slate-500">{post.author_name}</span>
        <span className="text-[11px] text-slate-400">{timeAgo}</span>
      </div>
      {post.title && <h3 className="font-bold text-slate-900 text-[14px] mb-1">{post.title}</h3>}
      <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-3">{post.body}</p>
    </div>
  );
}

function SectionHeader({ title, count, onViewAll }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
      {onViewAll && (
        <button onClick={onViewAll} className="flex items-center gap-0.5 text-[13px] font-semibold text-[#0F5ED7]">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
        <div className="text-[20px] font-bold text-[#2563EB]">{stats.weeklyHours ?? 0}</div>
        <div className="text-[11px] text-slate-500 font-medium mt-0.5">hrs this week</div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
        <div className="text-[20px] font-bold text-emerald-600">+{stats.newMembers ?? 0}</div>
        <div className="text-[11px] text-slate-500 font-medium mt-0.5">new members</div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
        <div className="text-[20px] font-bold text-slate-800">{stats.memberCount ?? 0}</div>
        <div className="text-[11px] text-slate-500 font-medium mt-0.5">total members</div>
      </div>
    </div>
  );
}

export default function CommunityHomepage({ community, posts, events, opportunities, onTabChange, stats, members = [] }) {
  const pinnedAnnouncement = posts.find(p => p.type === 'announcement' && p.is_pinned);
  const secondAnnouncement = posts.find(p => p.type === 'announcement' && !p.is_pinned);
  const feedPosts = posts.filter(p => p.type !== 'announcement').slice(0, 3);
  const upcomingEvents = events
    .filter(e => !e.start_date || new Date(e.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 3);
  const activeOpps = opportunities.filter(o => o.is_active !== false).slice(0, 3);
  const recentMembers = members.slice(0, 5);

  return (
    <div className="space-y-6 pt-4 pb-28">

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Members Preview */}
      {recentMembers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-slate-900">👥 Members</h2>
              <span className="text-[12px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {stats?.memberCount || 0}
              </span>
            </div>
            {recentMembers.length > 0 && (
              <button onClick={() => onTabChange('members')} className="flex items-center gap-0.5 text-[13px] font-semibold text-[#0F5ED7]">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {recentMembers.map(member => (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 flex-shrink-0">
                  {member.user_id?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-[13px] font-medium text-slate-900 truncate flex-1">{member.user_id}</span>
                {member.role === 'Admin' && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">👑 Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Announcement Banner */}
      {(pinnedAnnouncement || secondAnnouncement) && (() => {
        const ann = pinnedAnnouncement || secondAnnouncement;
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mx-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Pin className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Pinned Announcement</span>
            </div>
            {ann.title && <h3 className="font-bold text-slate-900 text-[14px] mb-1">{ann.title}</h3>}
            <p className="text-[13px] text-amber-900 leading-relaxed">{ann.body}</p>
          </div>
        );
      })()}

      {/* Upcoming Events */}
      <div>
        <SectionHeader
          title="📅 Upcoming Events"
          count={upcomingEvents.length}
          onViewAll={upcomingEvents.length > 0 ? () => onTabChange('events') : null}
        />
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 text-slate-400 text-[13px]">No upcoming events</div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(ev => <EventMiniCard key={ev.id} ev={ev} />)}
            {events.length > 3 && (
              <button
                onClick={() => onTabChange('events')}
                className="w-full py-3 bg-white border border-slate-100 rounded-2xl text-[13px] font-semibold text-[#0F5ED7] hover:bg-[#EEF4FF] transition-colors"
              >
                View All Events →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mitzvah Opportunities */}
      <div>
        <SectionHeader
          title="🤝 Mitzvah Opportunities"
          count={activeOpps.length}
          onViewAll={activeOpps.length > 0 ? () => onTabChange('mitzvah') : null}
        />
        {activeOpps.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 text-slate-400 text-[13px]">No active opportunities</div>
        ) : (
          <div className="space-y-3">
            {activeOpps.map(op => <MitzvahMiniCard key={op.id} op={op} />)}
            {opportunities.filter(o => o.is_active !== false).length > 3 && (
              <button
                onClick={() => onTabChange('mitzvah')}
                className="w-full py-3 bg-white border border-slate-100 rounded-2xl text-[13px] font-semibold text-[#0F5ED7] hover:bg-[#EEF4FF] transition-colors"
              >
                View All Opportunities →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Community Feed Preview */}
      {feedPosts.length > 0 && (
        <div>
          <SectionHeader
            title="💬 Community Feed"
            onViewAll={() => onTabChange('feed')}
          />
          <div className="space-y-3">
            {feedPosts.map(p => <FeedPostMini key={p.id} post={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}