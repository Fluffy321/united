import React, { useState, useEffect } from 'react';
import { Newspaper, Loader2, ExternalLink, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, isToday, isTomorrow, format } from 'date-fns';
import ProfileSetup from '@/components/profile/ProfileSetup';

export default function CommunityUpdates() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedNewsSource, setSelectedNewsSource] = useState('all');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const { data: recentPosts = [] } = useQuery({
    queryKey: ['recent-community-posts'],
    queryFn: async () => {
      const posts = await base44.entities.UnifiedPost.filter({ 
        type: 'feed' 
      }, '-created_date', 10);
      return posts;
    }
  });

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const events = await base44.entities.UnifiedPost.filter({ 
        type: 'event' 
      }, '-event_date', 20);
      return events.filter(e => e.event_date >= today).slice(0, 5);
    }
  });

  const { data: newsSources = [] } = useQuery({
    queryKey: ['news-sources'],
    queryFn: () => base44.entities.NewsSource.filter({ enabled: true })
  });

  const { data: newsItems = [], isLoading: newsLoading } = useQuery({
    queryKey: ['news-items', selectedNewsSource],
    queryFn: async () => {
      let items;
      if (selectedNewsSource === 'all') {
        items = await base44.entities.NewsItem.list('-published_at', 20);
      } else {
        items = await base44.entities.NewsItem.filter({ 
          source_id: selectedNewsSource 
        }, '-published_at', 20);
      }
      return items;
    }
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={loadUser} />;
  }

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-[#EEF4FF] border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Community Updates</h1>
          <p className="text-sm" style={{ color: '#5F6B7A' }}>Latest from your community and beyond</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Section A: Local Updates */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Local Updates</h2>
          
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-600 mb-2">Upcoming Events</h3>
              <div className="space-y-2">
                {upcomingEvents.map(event => (
                  <div 
                    key={event.id}
                    className="bg-white rounded-xl p-3 shadow-sm border border-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 mb-1">{event.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-medium">{formatEventDate(event.event_date)}</span>
                          {event.event_time && (
                            <>
                              <span>•</span>
                              <span>{event.event_time}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Community Posts */}
          {recentPosts.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-600 mb-2">Recent Posts</h3>
              <div className="space-y-2">
                {recentPosts.slice(0, 3).map(post => (
                  <div 
                    key={post.id}
                    className="bg-white rounded-xl p-3 shadow-sm border border-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 line-clamp-2 mb-1">{post.body}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium">{post.user_name}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section B: News Headlines */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Headlines</h2>
          
          {/* Source Filters */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
            <Button
              variant={selectedNewsSource === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedNewsSource('all')}
              className={`whitespace-nowrap text-xs h-7 ${
                selectedNewsSource === 'all' 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'hover:bg-slate-100'
              }`}
            >
              All
            </Button>
            {newsSources.map(source => (
              <Button
                key={source.id}
                variant={selectedNewsSource === source.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedNewsSource(source.id)}
                className={`whitespace-nowrap text-xs h-7 ${
                  selectedNewsSource === source.id 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'hover:bg-slate-100'
                }`}
              >
                {source.name}
              </Button>
            ))}
          </div>

          {/* News Items */}
          {newsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No headlines available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {newsItems.map(item => (
                <article 
                  key={item.id} 
                  className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3">
                    {item.image_url && (
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                        <img 
                          src={item.image_url} 
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 mb-1">
                        {item.title}
                      </h3>
                      
                      {item.snippet && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                          {item.snippet}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="font-medium">{item.source_name}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}</span>
                        </div>
                        
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1 flex-shrink-0"
                        >
                          Read
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}