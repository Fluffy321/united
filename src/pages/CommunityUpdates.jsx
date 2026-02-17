import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, MessageSquare, RefreshCw } from 'lucide-react';
import RssErrorBlock from '@/components/updates/RssErrorBlock';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, isToday, isTomorrow, format } from 'date-fns';
import ProfileSetup from '@/components/profile/ProfileSetup';
import { toast } from 'sonner';

export default function CommunityUpdates() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedNewsSource, setSelectedNewsSource] = useState('yeshivaworld');

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

  const [retryCount, setRetryCount] = useState({ fivetowns: 0, israel: 0 });

  const { data: fiveTownsData, isLoading: fiveTownsLoading, error: fiveTownsError, refetch: refetchFiveTowns } = useQuery({
    queryKey: ['rss-headlines-fivetowns', retryCount.fivetowns],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getHeadlines', { sourceType: 'fivetowns' });
      return data;
    },
    staleTime: 300000, // 5 minutes
    retry: 1
  });

  const { data: israelData, isLoading: israelLoading, error: israelError, refetch: refetchIsrael } = useQuery({
    queryKey: ['rss-headlines-israel', retryCount.israel],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getHeadlines', { sourceType: 'israel' });
      return data;
    },
    staleTime: 300000, // 5 minutes
    retry: 1
  });

  const handleRefresh = async () => {
    toast.promise(
      Promise.all([refetchFiveTowns(), refetchIsrael()]),
      {
        loading: 'Refreshing headlines...',
        success: 'Headlines updated',
        error: 'Failed to refresh'
      }
    );
  };

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

        {/* Section B: Five Towns Headlines */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Five Towns News</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchFiveTowns()}
              disabled={fiveTownsLoading}
              className="h-7 px-2"
            >
              <RefreshCw className={`w-4 h-4 ${fiveTownsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {fiveTownsLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#0F5ED7] mb-2" />
              <p className="text-xs text-slate-500">Loading headlines...</p>
            </div>
          ) : fiveTownsError || !fiveTownsData?.ok ? (
            <RssErrorBlock
              data={fiveTownsData}
              onRetry={() => setRetryCount(prev => ({ ...prev, fivetowns: prev.fivetowns + 1 }))}
            />
          ) : !fiveTownsData?.items?.length ? (
            <div className="text-center py-6 bg-white rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500">No headlines available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fiveTownsData.items.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-sm text-slate-900 leading-snug mb-2">
                    {item.title}
                  </h3>
                  
                  {item.excerpt && (
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium">{item.source}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Section C: Israel Headlines */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Israel News</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchIsrael()}
              disabled={israelLoading}
              className="h-7 px-2"
            >
              <RefreshCw className={`w-4 h-4 ${israelLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {israelLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#0F5ED7] mb-2" />
              <p className="text-xs text-slate-500">Loading headlines...</p>
            </div>
          ) : israelError || !israelData?.ok ? (
            <RssErrorBlock
              data={israelData}
              onRetry={() => setRetryCount(prev => ({ ...prev, israel: prev.israel + 1 }))}
            />
          ) : !israelData?.items?.length ? (
            <div className="text-center py-6 bg-white rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500">No headlines available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {israelData.items.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-sm text-slate-900 leading-snug mb-2">
                    {item.title}
                  </h3>
                  
                  {item.excerpt && (
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium">{item.source}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}