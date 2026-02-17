import React, { useState, useEffect } from 'react';
import { Newspaper, Loader2, ExternalLink, Calendar, MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
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

  const RSS_FEEDS = {
    yeshivaworld: 'https://www.theyeshivaworld.com/feed/',
    jta: 'https://www.jta.org/feed',
    timesofisrael: 'https://www.timesofisrael.com/feed/'
  };

  const { data: headlinesData, isLoading: newsLoading, error: newsError, refetch: refetchHeadlines } = useQuery({
    queryKey: ['rss-headlines', selectedNewsSource],
    queryFn: async () => {
      const rssUrl = RSS_FEEDS[selectedNewsSource];
      if (!rssUrl) {
        throw new Error('Invalid news source');
      }

      const { data } = await base44.functions.invoke('getHeadlines', { rssUrl });
      
      if (data.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }

      return data;
    },
    staleTime: 300000, // 5 minutes
    retry: 2
  });

  const handleRefresh = async () => {
    toast.promise(
      refetchHeadlines(),
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

        {/* Section B: News Headlines */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Headlines</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={newsLoading}
              className="h-7 px-2"
            >
              <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Source Filters */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
            <Button
              variant={selectedNewsSource === 'yeshivaworld' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedNewsSource('yeshivaworld')}
              className={`whitespace-nowrap text-xs h-7 ${
                selectedNewsSource === 'yeshivaworld' 
                  ? 'bg-[#0F5ED7] hover:bg-[#0D4EB8]' 
                  : 'hover:bg-slate-100'
              }`}
            >
              YeshivaWorld
            </Button>
            <Button
              variant={selectedNewsSource === 'jta' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedNewsSource('jta')}
              className={`whitespace-nowrap text-xs h-7 ${
                selectedNewsSource === 'jta' 
                  ? 'bg-[#0F5ED7] hover:bg-[#0D4EB8]' 
                  : 'hover:bg-slate-100'
              }`}
            >
              JTA
            </Button>
            <Button
              variant={selectedNewsSource === 'timesofisrael' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedNewsSource('timesofisrael')}
              className={`whitespace-nowrap text-xs h-7 ${
                selectedNewsSource === 'timesofisrael' 
                  ? 'bg-[#0F5ED7] hover:bg-[#0D4EB8]' 
                  : 'hover:bg-slate-100'
              }`}
            >
              Times of Israel
            </Button>
          </div>

          {/* News Items */}
          {newsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7] mb-2" />
              <p className="text-sm text-slate-500">Loading headlines...</p>
            </div>
          ) : newsError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">Failed to load headlines</p>
                  <p className="text-xs text-red-700">{newsError.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-3 text-xs h-7"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : !headlinesData?.items?.length ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600 mb-1">No headlines returned</p>
              <p className="text-xs text-slate-400">
                {headlinesData?.error || 'Try refreshing or selecting a different source'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {headlinesData.items.map((item, index) => (
                <article 
                  key={index} 
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug mb-2">
                      {item.title}
                    </h3>
                    
                    {item.description && (
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-medium">{item.source}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}</span>
                      </div>
                      
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#0F5ED7] hover:text-[#0D4EB8] text-xs font-semibold flex items-center gap-1 flex-shrink-0"
                      >
                        Read
                        <ExternalLink className="w-3 h-3" />
                      </a>
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