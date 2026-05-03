import React, { useState, useMemo } from 'react';
import { Search, X, FileText, Users, User, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '@/components/common/UserAvatar';

const TABS = [

  { id: 'all', label: 'All' },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'people', label: 'People', icon: User },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'events', label: 'Events', icon: Calendar },
];

export default function SearchModal({ open, onOpenChange, posts = [] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: communities = [] } = useQuery({
    queryKey: ['search-communities'],
    queryFn: () => base44.entities.Community.list('-follower_count', 100),
    enabled: open,
    staleTime: 300000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['search-users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
    enabled: open,
    staleTime: 300000,
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { posts: [], people: [], communities: [], events: [] };

    const matchedPosts = posts.filter(p =>
      p.type !== 'event' && (
        p.title?.toLowerCase().includes(q) ||
        p.body?.toLowerCase().includes(q) ||
        p.user_name?.toLowerCase().includes(q)
      )
    ).slice(0, 10);

    const matchedEvents = posts.filter(p =>
      (p.type === 'event' || p.board === 'events') && (
        p.title?.toLowerCase().includes(q) ||
        p.body?.toLowerCase().includes(q) ||
        p.location_text?.toLowerCase().includes(q)
      )
    ).slice(0, 8);

    const matchedPeople = users.filter(u =>
      u.full_name?.toLowerCase().includes(q) ||
      u.display_name?.toLowerCase().includes(q)
    ).slice(0, 8);

    const matchedCommunities = communities.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.neighborhood?.toLowerCase().includes(q) ||
      c.description_short?.toLowerCase().includes(q)
    ).slice(0, 8);

    return { posts: matchedPosts, people: matchedPeople, communities: matchedCommunities, events: matchedEvents };
  }, [query, posts, users, communities]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  const hasQuery = query.trim().length > 0;

  const getTabResults = () => {
    if (activeTab === 'all') return results;
    return { posts: [], people: [], communities: [], events: [], [activeTab]: results[activeTab] };
  };

  const tabResults = getTabResults();

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setQuery(''); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden" style={{ maxHeight: '85vh' }}>
        {/* Search Input */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search posts, people, communities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-blue-400 transition-colors placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 130px)' }}>
          {!hasQuery ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Search className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-[14px] font-semibold text-slate-600">Search everything</p>
              <p className="text-[12px] text-slate-400 mt-1">Posts, people, communities, and events</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-[14px] font-semibold text-slate-600">No results for "{query}"</p>
              <p className="text-[12px] text-slate-400 mt-1">Try different keywords</p>
            </div>
          ) : (
            <div className="p-3 space-y-4">
              {/* Posts */}
              {tabResults.posts?.length > 0 && (
                <Section title="Posts" count={tabResults.posts.length}>
                  {tabResults.posts.map(post => (
                    <div key={post.id} onClick={() => { navigate(`/PostDetail?id=${post.id}`); onOpenChange(false); }} className="flex items-start gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">

                      <UserAvatar name={post.user_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 line-clamp-1">{post.title || post.body?.substring(0, 50)}</p>
                        <p className="text-[11px] text-slate-400">{post.user_name} · {post.board || post.type}</p>
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* People */}
              {tabResults.people?.length > 0 && (
                <Section title="People" count={tabResults.people.length}>
                  {tabResults.people.map(u => (
                    <div key={u.id} onClick={() => { navigate(`/PublicProfile?id=${u.id}`); onOpenChange(false); }} className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                      <UserAvatar user={u} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900">{u.display_name || u.full_name}</p>
                        {u.cityPreset && <p className="text-[11px] text-slate-400">{u.cityPreset}</p>}
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Communities */}
              {tabResults.communities?.length > 0 && (
                <Section title="Communities" count={tabResults.communities.length}>
                  {tabResults.communities.map(c => (
                    <div key={c.id} onClick={() => { navigate(`/Communities?communityId=${c.id}`); onOpenChange(false); }} className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 overflow-hidden">
                        {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover" /> : <span className="text-blue-600 font-bold text-[12px]">{c.name?.charAt(0)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.neighborhood || c.type} · {c.follower_count || 0} members</p>
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Events */}
              {tabResults.events?.length > 0 && (
                <Section title="Events" count={tabResults.events.length}>
                  {tabResults.events.map(ev => (
                    <div key={ev.id} onClick={() => { navigate('/Events'); onOpenChange(false); }} className="flex items-start gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100">
                        <Calendar className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 line-clamp-1">{ev.title || ev.body?.substring(0, 50)}</p>
                        {ev.event_date && <p className="text-[11px] text-slate-400">{ev.event_date}{ev.location_text ? ` · ${ev.location_text}` : ''}</p>}
                      </div>
                    </div>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, count, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-3 mb-1">{title} ({count})</p>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
        {children}
      </div>
    </div>
  );
}