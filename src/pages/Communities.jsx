import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import CommunityCard from '@/components/communities/CommunityCard';
import ClaimModal from '@/components/communities/ClaimModal';
import CommunityDetailView from '@/components/communities/CommunityDetailView';

const TYPE_FILTERS = ['All', 'Shul', 'School', 'Yeshiva', 'Seminary', 'Camp'];
const NEIGHBORHOODS = ['All', 'Lawrence', 'Cedarhurst', 'Woodmere', 'Inwood', 'Hewlett'];

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('All');
  const [sortBy, setSortBy] = useState('az');
  const [claimTarget, setClaimTarget] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities-directory'],
    queryFn: () => base44.entities.Community.list('-created_date', 200),
    enabled: !!currentUser
  });

  const filtered = communities
    .filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.neighborhood?.toLowerCase().includes(q) || c.rabbi_or_principal?.toLowerCase().includes(q);
      const matchType = typeFilter === 'All' || c.type === typeFilter;
      const matchNeighborhood = neighborhoodFilter === 'All' || c.neighborhood === neighborhoodFilter;
      return matchSearch && matchType && matchNeighborhood;
    })
    .sort((a, b) => {
      if (sortBy === 'az') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'followers') return (b.follower_count || 0) - (a.follower_count || 0);
      return 0;
    });

  // If a community is selected, show detail view
  if (selectedCommunity) {
    return (
      <CommunityDetailView
        communityId={selectedCommunity.id}
        currentUser={currentUser}
        onBack={() => {
          setSelectedCommunity(null);
          queryClient.invalidateQueries({ queryKey: ['communities-directory'] });
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Five Towns Directory</h1>
              <p className="text-xs text-slate-500">{communities.length} communities listed</p>
            </div>
            {currentUser?.role === 'admin' && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={async () => {
                  try {
                    const { data } = await base44.functions.invoke('seedCommunitiesDirectory');
                    toast.success(`Seeded ${data.count} communities`);
                    queryClient.invalidateQueries({ queryKey: ['communities-directory'] });
                  } catch (e) {
                    toast.error('Seed failed: ' + e.message);
                  }
                }}
              >
                ⚙️ Seed
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search shuls, schools, rabbis..."
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>

          {/* Type filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {TYPE_FILTERS.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  typeFilter === t ? 'bg-[#0F5ED7] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
            <div className="w-px mx-1 bg-slate-200 flex-shrink-0" />
            {NEIGHBORHOODS.map(n => (
              <button
                key={n}
                onClick={() => setNeighborhoodFilter(n)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  neighborhoodFilter === n ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Sort row */}
        <div className="max-w-2xl mx-auto px-4 pb-2 flex items-center gap-2">
          <span className="text-xs text-slate-400">{filtered.length} results · Sort:</span>
          <button onClick={() => setSortBy('az')} className={`text-xs font-medium px-2 py-0.5 rounded ${sortBy === 'az' ? 'text-[#0F5ED7]' : 'text-slate-500'}`}>A–Z</button>
          <button onClick={() => setSortBy('followers')} className={`text-xs font-medium px-2 py-0.5 rounded ${sortBy === 'followers' ? 'text-[#0F5ED7]' : 'text-slate-500'}`}>Most Followed</button>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-[#0F5ED7]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🕍</p>
            <p className="font-semibold text-slate-800 mb-1">
              {communities.length === 0 ? 'Directory is empty' : 'No results found'}
            </p>
            <p className="text-sm text-slate-400">
              {communities.length === 0
                ? 'An admin can seed the directory to get started'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {filtered.some(c => c.is_featured) && (
              <div className="mb-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">⭐ Featured</p>
                <div className="border border-amber-200 rounded-2xl overflow-hidden bg-white">
                  {filtered.filter(c => c.is_featured).map(c => (
                    <CommunityCard key={c.id} community={c} onView={setSelectedCommunity} onClaim={setClaimTarget} />
                  ))}
                </div>
              </div>
            )}

            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
              {filtered.filter(c => !c.is_featured).map(c => (
                <CommunityCard key={c.id} community={c} onView={setSelectedCommunity} onClaim={setClaimTarget} />
              ))}
            </div>
          </>
        )}
      </div>

      {claimTarget && currentUser && (
        <ClaimModal
          open={!!claimTarget}
          onOpenChange={open => !open && setClaimTarget(null)}
          community={claimTarget}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}