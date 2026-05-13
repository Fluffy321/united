import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EyeOff, MapPin, Navigation, UsersRound } from 'lucide-react';
import PageHelp from '@/components/common/PageHelp';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import MitzvahMap from '@/components/mitzvah/MitzvahMap';

const MAP_FILTER_STORAGE = 'junited-map-community-filters';
const COMMUNITY_LOCATION_FALLBACKS = {
  cedarhurst: { lat: 40.6224, lng: -73.7268, label: 'Cedarhurst' },
  lawrence: { lat: 40.6134, lng: -73.7302, label: 'Lawrence' },
  woodmere: { lat: 40.6326, lng: -73.7162, label: 'Woodmere' },
  hewlett: { lat: 40.6412, lng: -73.7012, label: 'Hewlett' },
  inwood: { lat: 40.6223, lng: -73.7462, label: 'Inwood' },
  'five towns': { lat: 40.6249, lng: -73.7178, label: 'Five Towns' },
};

function readMapFilterState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(MAP_FILTER_STORAGE) || '{}');
    return {
      hiddenCommunityIds: new Set(saved.hiddenCommunityIds || []),
      hiddenPosterIds: new Set(saved.hiddenPosterIds || []),
    };
  } catch {
    return { hiddenCommunityIds: new Set(), hiddenPosterIds: new Set() };
  }
}

function resolvePostLocation(post) {
  if (post.location_lat && post.location_lng) {
    return { lat: post.location_lat, lng: post.location_lng, label: post.location_text || post.city || 'Five Towns' };
  }

  const text = `${post.location_text || ''} ${post.city || ''}`.toLowerCase();
  const match = Object.entries(COMMUNITY_LOCATION_FALLBACKS).find(([key]) => text.includes(key));
  return match?.[1] || COMMUNITY_LOCATION_FALLBACKS['five towns'];
}

export default function MapPage() {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState(() => new Set());
  const [{ hiddenCommunityIds, hiddenPosterIds }, setMapFilterState] = useState(readMapFilterState);

  const { data: requests = [] } = useQuery({
    queryKey: ['mitzvah-requests-map'],
    queryFn: () => dataService.entities.MitzvahRequest.list('-created_date', 100),
    staleTime: 120000,
  });
  const highlightedRequestId = searchParams.get('requestId');
  const highlightedRequest = useMemo(
    () => requests.find((request) => request.id === highlightedRequestId),
    [highlightedRequestId, requests]
  );

  const { data: memberships = [] } = useQuery({
    queryKey: ['map-community-memberships', currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ user_id: currentUser.id }, '-created_date', 100),
    enabled: Boolean(currentUser?.id),
    staleTime: 120000,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['map-communities-directory'],
    queryFn: () => dataService.entities.Community.list('-follower_count', 200),
    staleTime: 300000,
  });

  const { data: communityPosts = [] } = useQuery({
    queryKey: ['map-community-posts'],
    queryFn: () => dataService.entities.UnifiedPost.list('-created_date', 180),
    staleTime: 120000,
  });

  const joinedCommunityIds = useMemo(() => new Set(memberships.map((membership) => membership.community_id)), [memberships]);
  const joinedCommunities = useMemo(
    () => communities.filter((community) => joinedCommunityIds.has(community.id)),
    [communities, joinedCommunityIds]
  );
  const communityById = useMemo(() => new Map(communities.map((community) => [community.id, community])), [communities]);

  const visibleCommunityIds = useMemo(() => {
    if (selectedCommunityIds.size > 0) return selectedCommunityIds;
    return new Set(joinedCommunities.map((community) => community.id));
  }, [joinedCommunities, selectedCommunityIds]);

  const communityPoints = useMemo(() => (
    communityPosts
      .filter((post) => post.community_id && joinedCommunityIds.has(post.community_id))
      .filter((post) => visibleCommunityIds.has(post.community_id))
      .filter((post) => !hiddenCommunityIds.has(post.community_id))
      .filter((post) => !hiddenPosterIds.has(post.user_id))
      .slice(0, 80)
      .map((post) => {
        const community = communityById.get(post.community_id);
        const location = resolvePostLocation(post);
        return {
          id: `community-post-${post.id}`,
          title: post.title || post.body?.slice(0, 70) || 'Community update',
          description: post.body || post.prompt_text || 'Shared by a community member.',
          location_text: post.location_text || location.label,
          location_lat: location.lat,
          location_lng: location.lng,
          communityId: post.community_id,
          communityName: post.community_name || community?.name || 'Joined community',
          posterId: post.user_id || null,
          posterName: post.user_name || 'Community member',
          type: 'community_post',
        };
      })
  ), [communityById, communityPosts, hiddenCommunityIds, hiddenPosterIds, joinedCommunityIds, visibleCommunityIds]);

  const mapPosters = useMemo(() => {
    const unique = new Map();
    communityPosts
      .filter((post) => post.community_id && joinedCommunityIds.has(post.community_id))
      .filter((post) => visibleCommunityIds.has(post.community_id))
      .filter((post) => !hiddenCommunityIds.has(post.community_id))
      .forEach((post) => {
        if (post.user_id && !unique.has(post.user_id)) unique.set(post.user_id, post.user_name || 'Community member');
      });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [communityPosts, hiddenCommunityIds, joinedCommunityIds, visibleCommunityIds]);

  const persistFilterState = (next) => {
    setMapFilterState(next);
    window.localStorage.setItem(MAP_FILTER_STORAGE, JSON.stringify({
      hiddenCommunityIds: Array.from(next.hiddenCommunityIds),
      hiddenPosterIds: Array.from(next.hiddenPosterIds),
    }));
  };

  const toggleSelectedCommunity = (communityId) => {
    setSelectedCommunityIds((current) => {
      const next = new Set(current);
      if (next.has(communityId)) next.delete(communityId);
      else next.add(communityId);
      return next;
    });
  };

  const toggleHiddenCommunity = (communityId) => {
    const next = new Set(hiddenCommunityIds);
    if (next.has(communityId)) next.delete(communityId);
    else next.add(communityId);
    persistFilterState({ hiddenCommunityIds: next, hiddenPosterIds });
  };

  const toggleHiddenPoster = (posterId) => {
    const next = new Set(hiddenPosterIds);
    if (next.has(posterId)) next.delete(posterId);
    else next.add(posterId);
    persistFilterState({ hiddenCommunityIds, hiddenPosterIds: next });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => setUserLocation({ lat, lng }),
      () => {}
    );
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden mobile-safe-bottom">
      {/* Fixed-height header */}
      <div className="mobile-page-wide flex shrink-0 items-center gap-2 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        <MapPin className="h-5 w-5 shrink-0 text-blue-600" />
        <h1 className="text-2xl font-black text-slate-950">Map</h1>
        <PageHelp text="Explore Jewish community life around you — shuls, minyanim, chesed needs, and more." />
        <button
          onClick={handleUseMyLocation}
          className="motion-press ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-100"
        >
          <Navigation className="h-3.5 w-3.5" />
          Near me
        </button>
      </div>

      <div className="mobile-page-wide min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:px-4 sm:pb-4">
        {highlightedRequest && (
          <section className="mb-3 rounded-[22px] border border-blue-200 bg-blue-50 p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Opened from Mitzvah Circle</p>
            <p className="mt-1 text-[15px] font-black text-slate-950">{highlightedRequest.title}</p>
            <p className="mt-1 text-[12px] font-semibold text-slate-600">
              {highlightedRequest.location_label || highlightedRequest.locationLabel || highlightedRequest.neighborhood || 'Five Towns'}
            </p>
          </section>
        )}

        <section className="surface-panel-soft mb-3 rounded-[24px] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                <UsersRound className="h-4 w-4 text-blue-600" />
                Community posts on my map
              </p>
              <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">
                Pick joined communities one by one, or leave all unselected to show posts from every joined community.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
              {communityPoints.length} posts
            </span>
          </div>

          <div className="mobile-scroll-x mt-3 flex gap-2 pb-1">
            {joinedCommunities.length > 0 ? joinedCommunities.map((community) => {
              const active = selectedCommunityIds.size === 0 || selectedCommunityIds.has(community.id);
              return (
                <button
                  key={`map-community-${community.id}`}
                  type="button"
                  onClick={() => toggleSelectedCommunity(community.id)}
                  className={`motion-press shrink-0 rounded-full border px-3 py-2 text-[12px] font-black transition ${
                    active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {community.name}
                </button>
              );
            }) : (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-500">
                Join communities to map their posts.
              </span>
            )}
          </div>

          {(joinedCommunities.length > 0 || mapPosters.length > 0) && (
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wide text-slate-500">
                  <EyeOff className="h-3.5 w-3.5" />
                  Block communities from map
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {joinedCommunities.map((community) => {
                    const blocked = hiddenCommunityIds.has(community.id);
                    return (
                      <button
                        key={`hide-community-${community.id}`}
                        type="button"
                        onClick={() => toggleHiddenCommunity(community.id)}
                        className={`motion-press rounded-full border px-2.5 py-1.5 text-[11px] font-black ${
                          blocked ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {blocked ? `Hidden: ${community.name}` : community.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wide text-slate-500">
                  <EyeOff className="h-3.5 w-3.5" />
                  Block people from map
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mapPosters.length > 0 ? mapPosters.map((poster) => {
                    const blocked = hiddenPosterIds.has(poster.id);
                    return (
                      <button
                        key={`hide-poster-${poster.id}`}
                        type="button"
                        onClick={() => toggleHiddenPoster(poster.id)}
                        className={`motion-press rounded-full border px-2.5 py-1.5 text-[11px] font-black ${
                          blocked ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {blocked ? `Hidden: ${poster.name}` : poster.name}
                      </button>
                    );
                  }) : (
                    <span className="text-[12px] font-bold text-slate-400">Posters appear here when their map posts load.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="h-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <MitzvahMap
            requests={requests}
            userLocation={userLocation}
            communityPoints={communityPoints}
            personalized
            mapHeight="100%"
          />
        </div>
      </div>
    </main>
  );
}
