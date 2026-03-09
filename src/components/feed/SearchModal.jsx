import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function SearchModal({ open, onOpenChange, posts, helpRequests, communities }) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, posts, help, communities

  const filteredResults = useMemo(() => {
    if (!query.trim()) return { posts: [], helpRequests: [], communities: [] };

    const q = query.toLowerCase();

    const filteredPosts = posts.filter(p =>
      (p.title?.toLowerCase().includes(q) ||
        p.body?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q))
    );

    const filteredHelp = helpRequests.filter(r =>
      (r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.community_name?.toLowerCase().includes(q))
    );

    const filteredCommunities = communities.filter(c =>
      (c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q))
    );

    if (searchType === 'posts') return { posts: filteredPosts, helpRequests: [], communities: [] };
    if (searchType === 'help') return { posts: [], helpRequests: filteredHelp, communities: [] };
    if (searchType === 'communities') return { posts: [], helpRequests: [], communities: filteredCommunities };
    return { posts: filteredPosts, helpRequests: filteredHelp, communities: filteredCommunities };
  }, [query, searchType, posts, helpRequests, communities]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search posts, requests, communities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {['all', 'posts', 'help', 'communities'].map(type => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type === 'all' && 'All'}
                {type === 'posts' && 'Posts'}
                {type === 'help' && 'Help'}
                {type === 'communities' && 'Communities'}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {query && Object.values(filteredResults).every(arr => arr.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No results found</p>
              </div>
            ) : (
              <>
                {/* Posts Results */}
                {filteredResults.posts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">POSTS ({filteredResults.posts.length})</p>
                    <div className="space-y-2">
                      {filteredResults.posts.map(post => (
                        <div key={post.id} className="p-2 rounded border border-slate-200 hover:bg-slate-50">
                          <p className="text-sm font-semibold text-slate-900">{post.title || post.body?.substring(0, 40)}</p>
                          <p className="text-xs text-slate-500">{post.user_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Help Requests Results */}
                {filteredResults.helpRequests.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">HELP REQUESTS ({filteredResults.helpRequests.length})</p>
                    <div className="space-y-2">
                      {filteredResults.helpRequests.map(req => (
                        <div key={req.id} className="p-2 rounded border border-slate-200 hover:bg-slate-50">
                          <p className="text-sm font-semibold text-slate-900">{req.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">{req.category}</span>
                            {req.community_name && <span className="text-xs text-slate-500">{req.community_name}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Communities Results */}
                {filteredResults.communities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">COMMUNITIES ({filteredResults.communities.length})</p>
                    <div className="space-y-2">
                      {filteredResults.communities.map(community => (
                        <div key={community.id} className="p-2 rounded border border-slate-200 hover:bg-slate-50">
                          <p className="text-sm font-semibold text-slate-900">{community.name}</p>
                          <p className="text-xs text-slate-500">{community.description?.substring(0, 50)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}