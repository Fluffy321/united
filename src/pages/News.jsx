import React, { useState, useEffect } from 'react';
import { Newspaper, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import ProfileSetup from '@/components/profile/ProfileSetup';

export default function News() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSource, setSelectedSource] = useState('all');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (e) {
      setCurrentUser({ id: 'guest', full_name: 'Guest', display_name: 'Guest', role: 'user', is_profile_complete: true });
    }
  };

  const { data: sources = [] } = useQuery({
    queryKey: ['news-sources'],
    queryFn: () => base44.entities.NewsSource.filter({ enabled: true })
  });

  const { data: newsItems = [], isLoading } = useQuery({
    queryKey: ['news-items', selectedSource],
    queryFn: async () => {
      let items;
      if (selectedSource === 'all') {
        items = await base44.entities.NewsItem.list('-published_at', 100);
      } else {
        items = await base44.entities.NewsItem.filter({ 
          source_id: selectedSource 
        }, '-published_at', 100);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Community News</h1>
              <p className="text-xs text-slate-600">Stay informed with local updates</p>
            </div>
          </div>

          {/* Source Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedSource === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSource('all')}
              className={`whitespace-nowrap text-xs h-8 ${
                selectedSource === 'all' 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'hover:bg-slate-100'
              }`}
            >
              All Sources
            </Button>
            {sources.map(source => (
              <Button
                key={source.id}
                variant={selectedSource === source.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSource(source.id)}
                className={`whitespace-nowrap text-xs h-8 ${
                  selectedSource === source.id 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'hover:bg-slate-100'
                }`}
              >
                {source.name}
              </Button>
            ))}
          </div>
        </div>

        {/* News Items */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : newsItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No news items yet</p>
            <p className="text-sm text-slate-400 mt-1">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {newsItems.map(item => (
              <article 
                key={item.id} 
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {item.image_url && (
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                      <img 
                        src={item.image_url} 
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                    
                    {item.snippet && (
                      <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                        {item.snippet}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium">{item.source_name}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}</span>
                      </div>
                      
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1"
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
  );
}