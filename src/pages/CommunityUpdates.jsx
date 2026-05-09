import React, { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import RssErrorBlock from '@/components/updates/RssErrorBlock';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, isToday, isTomorrow, format } from 'date-fns';
import ProfileSetup from '@/components/profile/ProfileSetup';
import ArticleViewer from '@/components/updates/ArticleViewer';
import { toast } from 'sonner';

export default function CommunityUpdates() {
  const { user: currentUser } = useAuth();
  const [selectedNewsSource, setSelectedNewsSource] = useState('yeshivaworld');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const { data: recentPosts = [] } = useQuery({
    queryKey: ['recent-community-posts'],
    queryFn: async () => {
      const posts = await dataService.entities.UnifiedPost.filter({ 
        type: 'feed' 
      }, '-created_date', 10);
      return posts;
    }
  });

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const events = await dataService.entities.UnifiedPost.filter({ 
        type: 'event' 
      }, '-event_date', 20);
      return events.filter(e => e.event_date >= today).slice(0, 5);
    }
  });

  const [retryCount, setRetryCount] = useState({ fivetowns: 0, israel: 0 });

  const { data: fiveTownsData, isLoading: fiveTownsLoading, error: fiveTownsError, refetch: refetchFiveTowns } = useQuery({
    queryKey: ['rss-headlines-fivetowns', retryCount.fivetowns],
    queryFn: async () => {
      const { data } = await dataService.functions.invoke('getHeadlines', { sourceType: 'fivetowns' });
      return data;
    },
    staleTime: 300000, // 5 minutes
    retry: 1
  });

  const { data: israelData, isLoading: israelLoading, error: israelError, refetch: refetchIsrael } = useQuery({
    queryKey: ['rss-headlines-israel', retryCount.israel],
    queryFn: async () => {
      const { data } = await dataService.functions.invoke('getHeadlines', { sourceType: 'israel' });
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
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F1C2E] border-t-transparent animate-spin" />
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

  const NewsCard = ({ item }) => (
    <button
      onClick={() => setSelectedArticle(item)}
      className="block w-full text-left bg-white rounded-[14px] border border-[#EAECF0] active:scale-[0.99] transition-transform overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {item.image && (
        <img
          src={item.image}
          alt=""
          className="w-full h-36 object-cover"
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}
      <div className="p-4">
        <p className="font-semibold text-[14px] text-[#0F1C2E] leading-snug mb-1.5">{item.title}</p>
        {item.excerpt && <p className="text-[13px] text-[#667085] line-clamp-2 mb-2">{item.excerpt}</p>}
        <p className="text-[12px] text-[#98A2B3]">
          <span className="font-medium">{item.source}</span> · {formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}
        </p>
      </div>
    </button>
  );

  const NewsSkeletons = () => (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-[14px] border border-[#EAECF0] p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div className="skeleton h-3.5 w-full rounded mb-2" />
          <div className="skeleton h-3 w-4/5 rounded mb-3" />
          <div className="skeleton h-2.5 w-28 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {selectedArticle && (
        <ArticleViewer item={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
      {/* Compact header */}
      <div className="bg-white sticky top-0 z-10" style={{ borderBottom: '1px solid #EAECF0' }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-[#0F1C2E] text-[16px] tracking-[-0.01em]">Updates</span>
          <button
            onClick={handleRefresh}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F4F7] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-[#667085] ${fiveTownsLoading || israelLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24">

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-6">
            <p className="text-[13px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3">Upcoming Events</p>
            <div className="space-y-2.5">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-white rounded-[14px] border border-[#EAECF0] p-3.5 flex items-center gap-3" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4.5 h-4.5 text-[#2563EB]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-[#0F1C2E] truncate">{event.title}</p>
                    <p className="text-[12px] text-[#98A2B3] mt-0.5">
                      {formatEventDate(event.event_date)}{event.event_time ? ` · ${event.event_time}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <div className="mb-6">
            <p className="text-[13px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3">Recent Posts</p>
            <div className="space-y-2.5">
              {recentPosts.slice(0, 3).map(post => (
                <div key={post.id} className="bg-white rounded-[14px] border border-[#EAECF0] p-3.5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <p className="text-[14px] text-[#344054] line-clamp-2 mb-1.5">{post.body}</p>
                  <p className="text-[12px] text-[#98A2B3]">
                    <span className="font-medium text-[#667085]">{post.user_name}</span>
                    {' · '}{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Five Towns News */}
        <div className="mb-6">
          <p className="text-[13px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3">Five Towns News</p>
          {fiveTownsLoading ? <NewsSkeletons /> : fiveTownsError || !fiveTownsData?.ok ? (
            <RssErrorBlock data={fiveTownsData} onRetry={() => setRetryCount(prev => ({ ...prev, fivetowns: prev.fivetowns + 1 }))} />
          ) : !fiveTownsData?.items?.length ? (
            <div className="text-center py-6 bg-white rounded-[14px] border border-[#EAECF0]">
              <p className="text-[13px] text-[#98A2B3]">No headlines available</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {fiveTownsData.items.map((item, index) => (
                <NewsCard key={index} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Israel News */}
        <div className="mb-6">
          <p className="text-[13px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3">Israel News</p>
          {israelLoading ? <NewsSkeletons /> : israelError || !israelData?.ok ? (
            <RssErrorBlock data={israelData} onRetry={() => setRetryCount(prev => ({ ...prev, israel: prev.israel + 1 }))} />
          ) : !israelData?.items?.length ? (
            <div className="text-center py-6 bg-white rounded-[14px] border border-[#EAECF0]">
              <p className="text-[13px] text-[#98A2B3]">No headlines available</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {israelData.items.map((item, index) => (
                <NewsCard key={index} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}