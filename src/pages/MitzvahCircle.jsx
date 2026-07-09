import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Car,
  Clock,
  HandHeart,
  ListFilter,
  Loader2,
  Plus,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { mitzvahService, notificationsService } from '@/services';
import { toast } from 'sonner';
import PageHelp from '@/components/common/PageHelp';
import LiveNowRail from '@/components/common/LiveNowRail';
import DestinationHeader from '@/components/layout/DestinationHeader';
import CarpoolBoard from '@/components/mitzvah/CarpoolBoard';
import MinyanBoard from '@/components/feed/MinyanBoard';
import ParshaCard from '@/components/feed/ParshaCard';
import ChesedChallenge from '@/components/feed/ChesedChallenge';
import MealTrainsSection from '@/components/mitzvah/MealTrainsSection';
import { buildMitzvahLiveNowItems } from '@/lib/liveNow';
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  REQUEST_EXPIRY_MS,
  STATUSES,
  VALID_VIEWS,
  WORKFLOW_TABS,
  getCategoryGroup,
  isRequestExpired,
  normalizeCarpoolRide,
  normalizeOffer,
  normalizeRequest,
  requestMatchesCategoryGroup,
  resolveMapLocation,
} from '@/components/mitzvah/circle/shared';
import EmptyState from '@/components/mitzvah/circle/EmptyState';
import Metric from '@/components/mitzvah/circle/Metric';
import RequestCard from '@/components/mitzvah/circle/RequestCard';
import CreateRequestModal from '@/components/mitzvah/circle/CreateRequestModal';
import CreateCarpoolModal from '@/components/mitzvah/circle/CreateCarpoolModal';
import QuickViewSheet from '@/components/mitzvah/circle/QuickViewSheet';


export default function MitzvahCircle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = React.useState(() => {
    const tab = searchParams.get('tab');
    if (tab === 'open' || tab === 'carpool') return 'browse';
    if (tab === 'offers' || tab === 'posted') return 'mine';
    return VALID_VIEWS.includes(tab) ? tab : 'browse';
  });
  const [activeCategory, setActiveCategory] = React.useState(() =>
    searchParams.get('tab') === 'carpool' ? 'rides' : 'all'
  );
  const [query, setQuery] = React.useState('');
  const [detailCategoryFilter, setDetailCategoryFilter] = React.useState('All');
  const [showCreate, setShowCreate] = React.useState(false);
  const [carpoolCreateMode, setCarpoolCreateMode] = React.useState(null);
  const [quickViewRequest, setQuickViewRequest] = React.useState(null);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    const nextView = tab === 'open' || tab === 'carpool'
      ? 'browse'
      : tab === 'offers' || tab === 'posted'
        ? 'mine'
      : VALID_VIEWS.includes(tab)
        ? tab
        : 'browse';
    if (nextView !== activeView) setActiveView(nextView);
    if (tab === 'carpool' && activeCategory !== 'rides') setActiveCategory('rides');
  }, [searchParams]);

  const changeView = (view) => {
    setActiveView(view);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (view === 'browse') next.delete('tab');
      else next.set('tab', view);
      return next;
    }, { replace: true });
  };

  const changeBrowseCategory = (categoryId) => {
    setActiveCategory(categoryId);
    if (activeView !== 'browse') changeView('browse');
  };

  const openRequestOnMap = (request) => {
    navigate(`/Map?requestId=${encodeURIComponent(request.id)}`);
  };

  // ── Data loading ───────────────────────────────────────────────────────────

	  const { data: rawRequests = [], isLoading: loadingRequests } = useQuery({
	    queryKey: ['mitzvah-requests'],
	    queryFn: async () => {
	      const rows = await mitzvahService.listRequests({}, '-created_date', 200);
	      const list = Array.isArray(rows) ? rows : [];
	      const expired = list.filter(isRequestExpired);
	      if (expired.length > 0) {
	        Promise.allSettled(expired.map((request) => mitzvahService.deleteRequest(request.id)))
	          .then(() => queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] }))
	          .catch(() => {});
	      }
	      return list.filter((request) => !isRequestExpired(request));
	    },
	    staleTime: 30000,
	    enabled: !!currentUser,
	  });

  const { data: rawOffers = [] } = useQuery({
    queryKey: ['mitzvah-offers'],
    queryFn: () => mitzvahService.listOffers({}, '-created_date', 500),
    staleTime: 30000,
    enabled: !!currentUser,
  });

  const { data: rawComments = [] } = useQuery({
    queryKey: ['mitzvah-request-comments'],
    queryFn: () => mitzvahService.listRequestComments({}, 'created_date', 500),
    staleTime: 30000,
    enabled: !!currentUser,
  });

  const requests = React.useMemo(() => rawRequests.map(normalizeRequest), [rawRequests]);
  const offers = React.useMemo(() => rawOffers.map(normalizeOffer), [rawOffers]);
  const commentsByRequest = React.useMemo(() => {
    const groups = {};
    (Array.isArray(rawComments) ? rawComments : []).forEach((comment) => {
      if (!comment.request_id) return;
      if (!groups[comment.request_id]) groups[comment.request_id] = [];
      groups[comment.request_id].push(comment);
    });
    return groups;
  }, [rawComments]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
    queryClient.invalidateQueries({ queryKey: ['mitzvah-offers'] });
    queryClient.invalidateQueries({ queryKey: ['mitzvah-request-comments'] });
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const { mutateAsync: createRequestMutation, isPending: isCreating } = useMutation({
    mutationFn: (payload) => mitzvahService.createRequest(payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateRequestMutation } = useMutation({
    mutationFn: ({ id, patch }) => mitzvahService.updateRequest(id, patch),
    onSuccess: invalidate,
  });

  const { mutateAsync: createOfferMutation, isPending: isOffering } = useMutation({
    mutationFn: (payload) => mitzvahService.createOffer(payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateOfferMutation } = useMutation({
    mutationFn: ({ id, patch }) => mitzvahService.updateOffer(id, patch),
    onSuccess: invalidate,
  });

  const { mutateAsync: createCommentMutation } = useMutation({
    mutationFn: (payload) => mitzvahService.createRequestComment(payload),
    onSuccess: invalidate,
  });

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleCreateRequest = async (formData) => {
    const mapLocation = resolveMapLocation(formData.neighborhood);
    try {
      await createRequestMutation({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        neighborhood: formData.neighborhood,
        locationLabel: formData.neighborhood,
        location_text: formData.neighborhood,
        ...(formData.postToMap ? {
          location_lat: currentUser?.location_lat || mapLocation.lat,
          location_lng: currentUser?.location_lng || mapLocation.lng,
          approxLat: currentUser?.location_lat || mapLocation.lat,
          approxLng: currentUser?.location_lng || mapLocation.lng,
          map_visible: true,
          is_hidden: false,
        } : {
          map_visible: false,
        }),
        estimated_hours: formData.estimatedHours,
	        urgency: formData.urgency.toLowerCase(),
	        status: 'open',
	        request_kind: 'volunteer',
	        expires_at: new Date(Date.now() + REQUEST_EXPIRY_MS).toISOString(),
	        created_by_user_id: currentUser.id,
	        created_by_name: currentUser.display_name || currentUser.full_name,
      });
      setShowCreate(false);
      changeView('mine');
      toast.success('Request posted.');
    } catch (err) {
      toast.error(err.message || 'Could not post request.');
    }
  };

	  const handleCreateCarpoolRide = async (formData, mode) => {
	    const route = `${formData.from} to ${formData.to}`;
	    const typeLabel = mode === 'offer' ? 'offering' : 'needed';
	    const title = mode === 'offer' ? `Seats available: ${route}` : `Ride needed: ${route}`;
	    const note = formData.notes?.trim();
	    const mapLocation = resolveMapLocation(formData.from || formData.to || route);
	    const description = [
	      `Type: ${typeLabel}`,
	      `Pickup: ${formData.pickup}`,
	      `Seats: ${formData.seats}`,
	      note ? `Notes: ${note}` : null,
    ].filter(Boolean).join(' | ');

    try {
      await createRequestMutation({
        title,
	        description,
	        category: 'Transportation',
	        neighborhood: route,
	        locationLabel: route,
	        location_text: route,
	        ...(formData.postToMap ? {
	          location_lat: currentUser?.location_lat || mapLocation.lat,
	          location_lng: currentUser?.location_lng || mapLocation.lng,
	          approxLat: currentUser?.location_lat || mapLocation.lat,
	          approxLng: currentUser?.location_lng || mapLocation.lng,
	          map_visible: true,
	          is_hidden: false,
	        } : {
	          map_visible: false,
	        }),
	        estimated_hours: 1,
	        urgency: 'medium',
	        status: 'open',
	        request_kind: 'carpool',
	        ride_direction: mode === 'offer' ? 'offering' : 'needed',
	        pickup_window: formData.pickup,
	        expires_at: new Date(Date.now() + REQUEST_EXPIRY_MS).toISOString(),
	        created_by_user_id: currentUser.id,
	        created_by_name: currentUser.display_name || currentUser.full_name,
	      });
      setCarpoolCreateMode(null);
      changeView('rides');
      toast.success(mode === 'offer' ? 'Carpool offer posted.' : 'Ride request posted.');
    } catch (err) {
      toast.error(err.message || 'Could not post carpool.');
    }
  };

  const handleOffer = async (request) => {
    if (request.poster_id === currentUser?.id) {
      toast.error('You cannot offer to help on your own request.');
      return;
    }
    try {
      await createOfferMutation({
        request_id: request.id,
        user_id: currentUser.id,
        volunteer_id: currentUser.id,
        volunteer_name: currentUser.display_name || currentUser.full_name,
        note: 'I am available to help with this request.',
        status: 'offered',
      });
      await updateRequestMutation({
        id: request.id,
        patch: { status: 'offered' },
      });
      notificationsService.notifyMitzvahOffer({
        posterId: request.poster_id,
        volunteerId: currentUser.id,
        volunteerName: currentUser.display_name || currentUser.full_name,
        requestId: request.id,
        requestTitle: request.title,
      }).catch(() => {});
      toast.success('Offer sent to the poster.');
    } catch (err) {
      toast.error(err.message || 'Could not send offer.');
    }
  };

  const handleAcceptOffer = async (requestId, offerId, volunteerId) => {
    try {
      // Mark all other offers as not_selected; mark chosen as accepted.
      const reqOffers = offers.filter((o) => o.requestId === requestId);
      await Promise.all(
        reqOffers.map((o) =>
          updateOfferMutation({ id: o.id, patch: { status: o.id === offerId ? 'accepted' : 'not_selected' } })
        )
      );
      await updateRequestMutation({
        id: requestId,
        patch: { status: 'accepted', claimed_by_user_id: volunteerId },
      });
      const accepted = offers.find((o) => o.id === offerId);
      notificationsService.notifyMitzvahAccepted({
        volunteerId,
        posterId: currentUser.id,
        posterName: currentUser.display_name || currentUser.full_name,
        requestId,
        requestTitle: requests.find((r) => r.id === requestId)?.title || '',
      }).catch(() => {});
      toast.success(`Volunteer ${accepted?.volunteerName || ''} accepted.`);
    } catch (err) {
      toast.error(err.message || 'Could not accept offer.');
    }
  };

  const handleStart = async (requestId) => {
    try {
      await updateRequestMutation({ id: requestId, patch: { status: 'in_progress' } });
      toast.success('Task marked in progress.');
    } catch (err) {
      toast.error(err.message || 'Could not start task.');
    }
  };

  const handleComplete = async (requestId) => {
    try {
      await updateRequestMutation({ id: requestId, patch: { status: 'pending_verify' } });
      notificationsService.notifyVerificationRequest({
        posterId: requests.find((r) => r.id === requestId)?.poster_id,
        volunteerId: currentUser.id,
        volunteerName: currentUser.display_name || currentUser.full_name,
        requestId,
        requestTitle: requests.find((r) => r.id === requestId)?.title || '',
      }).catch(() => {});
      toast.success('Completion sent to the poster for verification.');
    } catch (err) {
      toast.error(err.message || 'Could not mark complete.');
    }
  };

  const handleVerify = async (requestId) => {
    try {
      await updateRequestMutation({ id: requestId, patch: { status: 'verified' } });
      toast.success('Completion verified! Chesed hours logged.');
    } catch (err) {
      toast.error(err.message || 'Could not verify completion.');
    }
  };

  const handleUrgencyChange = async (requestId, urgency) => {
    try {
      await updateRequestMutation({
        id: requestId,
        patch: { urgency: urgency.toLowerCase() },
      });
      toast.success(`Urgency set to ${urgency}.`);
    } catch (err) {
      toast.error(err.message || 'Could not update urgency.');
    }
  };

  const handleCommentOnRequest = async (request, body) => {
    if (!currentUser) return;
    try {
      await createCommentMutation({
        request_id: request.id,
        author_id: currentUser.id,
        author_name: currentUser.display_name || currentUser.full_name || 'Community member',
        author_avatar_url: currentUser.avatar_url || null,
        body,
      });
      toast.success('Comment added.');
    } catch (err) {
      toast.error(err.message || 'Could not add comment.');
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const searchFilteredRequests = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesQuery =
        !needle ||
        [r.title, r.description, r.category, r.neighborhood, r.poster_name].some((v) =>
          String(v || '').toLowerCase().includes(needle)
        );
      return matchesQuery;
    });
  }, [requests, query]);

  const browseRequests = searchFilteredRequests.filter(
    (r) => ![STATUSES.VERIFIED, STATUSES.CANCELLED].includes(r.status)
      && requestMatchesCategoryGroup(r, activeCategory)
  );
  const completedRequests = searchFilteredRequests.filter((r) =>
    [STATUSES.VERIFIED, STATUSES.CANCELLED].includes(r.status)
    && (detailCategoryFilter === 'All' || r.category === detailCategoryFilter)
  );
  const myOfferRequests = requests
    .map((r) => ({
      request: r,
      offer: offers.find((o) => o.requestId === r.id && o.volunteerId === currentUser?.id),
    }))
    .filter((item) => item.offer);
  const myPosted = searchFilteredRequests.filter((r) =>
    r.poster_id === currentUser?.id
    && (detailCategoryFilter === 'All' || r.category === detailCategoryFilter)
  );
  const myActivityItems = [
    ...myPosted.map((request) => ({ type: 'request', request })),
    ...myOfferRequests
      .filter(({ request }) => request.poster_id !== currentUser?.id)
      .map(({ request, offer }) => ({ type: 'offer', request, offer })),
  ];
  const carpoolRequests = requests
    .filter((r) =>
      r.request_kind === 'carpool'
      || r.category === 'Transportation'
      || /ride|carpool|pickup|seat/i.test(`${r.title || ''} ${r.description || ''}`)
    )
    .map(normalizeCarpoolRide);
  const signupsByRequest = offers.reduce((acc, offer) => {
    if (!acc[offer.requestId]) acc[offer.requestId] = [];
    acc[offer.requestId].push(offer);
    return acc;
  }, {});

  const totals = React.useMemo(() => ({
    openCount: requests.filter((r) => r.status === STATUSES.OPEN).length,
    offeredCount: requests.filter((r) =>
      [STATUSES.OFFERED, STATUSES.ACCEPTED, STATUSES.IN_PROG].includes(r.status)
    ).length,
    completedCount: requests.filter((r) => r.status === STATUSES.VERIFIED).length,
  }), [requests]);
  const liveNowItems = React.useMemo(() => buildMitzvahLiveNowItems({
    requests: requests.filter((r) => r.status === STATUSES.OPEN),
    offers,
  }), [requests, offers]);
  const hasMitzvahStats = totals.openCount > 0 || totals.offeredCount > 0 || totals.completedCount > 0;

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="app-page mobile-safe-bottom">
      <DestinationHeader
        icon={HandHeart}
        title="Mitzvah Circle"
        help={<PageHelp text="Post mitzvah opportunities, take one, share what you did, coordinate carpools, and build daily mitzvah streaks." />}
      />

      <section className="mobile-page-wide px-3 pt-3 sm:px-4 sm:pt-4">
        {/* Header */}
        {activeView !== 'shuls' && (
          <div className="overflow-hidden rounded-[30px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50 shadow-sm">
            <div className="relative p-4 sm:p-5">
              <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-blue-700">
                      <HandHeart className="h-3.5 w-3.5" />
                      Real mitzvah network
                    </div>
                    <p className="max-w-xl text-[15px] font-black leading-6 text-slate-950">
                      Post an opportunity, take a mitzvah, share what you did, and keep the community moving.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="app-button-primary h-11 shrink-0 px-3 sm:px-4"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Post Request</span>
                    <span className="sm:hidden">Post</span>
                  </button>
                </div>

                {hasMitzvahStats ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Metric icon={HandHeart} label="Open" value={totals.openCount} tone="blue" />
                    <Metric icon={Clock} label="In Progress" value={totals.offeredCount} tone="amber" />
                    <Metric icon={Award} label="Completed" value={totals.completedCount} tone="emerald" />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-blue-100 bg-white/75 px-3 py-2.5 text-[12px] font-bold text-slate-600">
                    Start with one clear ask, or offer a ride before someone needs it.
                  </div>
                )}

	                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
	                  {[
	                    {
	                      label: 'Post opportunity',
	                      detail: 'Ask or offer help',
                      icon: Plus,
                      onClick: () => setShowCreate(true),
	                    },
	                    {
	                      label: 'Do one now',
	                      detail: 'Browse open needs',
	                      icon: HandHeart,
	                      onClick: () => changeView('browse'),
	                    },
	                    {
	                      label: 'Share completed',
	                      detail: 'Build your streak',
	                      icon: Award,
	                      onClick: () => changeView('completed'),
	                    },
	                    {
	                      label: 'Carpool safely',
	                      detail: 'Rides in one place',
                      icon: Car,
                      onClick: () => changeView('rides'),
	                    },
	                    {
	                      label: 'Jewish business',
	                      detail: 'Work local',
	                      icon: ShoppingBag,
	                      onClick: () => navigate('/Marketplace'),
	                    },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        className="motion-press rounded-2xl border border-white bg-white/80 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-[12px] font-black text-slate-950">{action.label}</p>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-500">{action.detail}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity views */}
        <div className="sticky top-0 z-20 -mx-3 mt-3 bg-[#F6F8FB]/78 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
          <div className="surface-panel-soft rounded-[24px] p-2">
            <p className="px-2 pb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">My activity</p>
            <div className="mobile-scroll-x flex gap-2">
              {WORKFLOW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => changeView(tab.id)}
                  className={`motion-press shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-black transition ${
                    activeView === tab.id
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeView !== 'shuls' && activeView !== 'mealtrains' && activeView !== 'dvar-torah' && (
          <LiveNowRail
            className="mb-3"
            title="Needs help now"
            subtitle="Live mitzvah requests with progress and people responding"
            items={liveNowItems}
            onItemClick={(item) => navigate(item.href || '/MitzvahCircle')}
          />
        )}

        {(activeView === 'browse' && activeCategory === 'rides') || activeView === 'rides' ? (
          <div className="mb-3">
            <CarpoolBoard
              rideRequests={carpoolRequests}
              signupsByRequest={signupsByRequest}
              onCreateRide={(mode) => setCarpoolCreateMode(mode)}
              onSelectRide={setQuickViewRequest}
              onClaimRide={(_, ride) => handleOffer(ride)}
              isClaiming={isOffering}
            />
          </div>
        ) : null}

        {/* Search/filter bar */}
        {activeView !== 'shuls' && activeView !== 'mealtrains' && activeView !== 'rides' && activeView !== 'dvar-torah' && (
          <div className="surface-panel-soft mb-3 space-y-3 rounded-[24px] p-3">
            {activeView === 'browse' && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-black text-slate-950">Browse by need</p>
                    <p className="text-[12px] font-semibold text-slate-500">
                      Choose the kind of chesed you want to help with.
                    </p>
                  </div>
                  {browseRequests.length > 0 && (
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                      {browseRequests.length} open
                    </span>
                  )}
                </div>
                <div className="mobile-scroll-x flex gap-2">
                  {CATEGORY_GROUPS.map((group) => {
                    const Icon = group.icon;
                    const selected = activeCategory === group.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => changeBrowseCategory(group.id)}
                        className={`motion-press shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                          selected
                            ? `${group.tone} shadow-sm`
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-[12px] font-black">
                          <Icon className="h-4 w-4" />
                          {group.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={activeView === 'browse' ? 'grid gap-2' : 'grid gap-2 sm:grid-cols-[1fr_220px]'}>
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search requests"
                  className="app-input h-11 pl-10 pr-3 text-sm"
                />
              </label>
              {activeView !== 'browse' && (
                <label className="relative">
                  <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={detailCategoryFilter}
                    onChange={(e) => setDetailCategoryFilter(e.target.value)}
                    className="app-input h-11 pl-10 pr-3 text-sm font-black"
                  >
                    <option>All</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Tab content */}
        <div key={`${activeView}-${activeCategory}`} className="motion-stagger space-y-3">
          {activeView === 'shuls' && (
            <MinyanBoard />
          )}

          {activeView === 'dvar-torah' && (
            <ParshaCard />
          )}

          {activeView === 'mealtrains' && (
            <MealTrainsSection currentUser={currentUser} />
          )}

          {activeView === 'browse' && (
            <>
              <ChesedChallenge />
              {loadingRequests ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : activeCategory === 'rides' ? null : browseRequests.length ? (
              <>
                {browseRequests.map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    offers={offers}
                    comments={commentsByRequest[r.id] || []}
                    currentUser={currentUser}
                    onOffer={handleOffer}
                    onAcceptOffer={handleAcceptOffer}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    onVerify={handleVerify}
                    onComment={handleCommentOnRequest}
                    onOpenMap={openRequestOnMap}
                    onQuickView={setQuickViewRequest}
                    onUrgencyChange={handleUrgencyChange}
                  />
                ))}
              </>
            ) : (
              <EmptyState
                title={activeCategory === 'all' ? 'Ready for the first chesed request' : `${getCategoryGroup(activeCategory).shortLabel} requests will appear here`}
                text={activeCategory === 'all'
                  ? 'Post a food, ride, errand, or care request with enough detail for someone to say yes.'
                  : `${getCategoryGroup(activeCategory).description} belong here when a real need comes up.`}
                actionLabel="Post a need"
                onAction={() => setShowCreate(true)}
              />
              )}
            </>
          )}

          {activeView === 'mine' && (
            myActivityItems.length ? (
              myActivityItems.map(({ type, request }) => (
                <div key={`${type}-${request.id}`} className="space-y-2">
                  <p className="px-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
                    {type === 'request' ? 'My request' : 'My offer'}
                  </p>
                  <RequestCard
                    request={request}
                    offers={offers}
                    comments={commentsByRequest[request.id] || []}
                    currentUser={currentUser}
                    onOffer={handleOffer}
                    onAcceptOffer={handleAcceptOffer}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    onVerify={handleVerify}
                    onComment={handleCommentOnRequest}
                    onOpenMap={openRequestOnMap}
                    onUrgencyChange={handleUrgencyChange}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title="Your mitzvah activity starts here"
                text="Post a need you know about, or offer help on an open request and it will show here."
                actionLabel="Offer help"
                onAction={() => changeView('browse')}
              />
            )
          )}

          {activeView === 'completed' && (
            completedRequests.length ? (
              completedRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  offers={offers}
                  comments={commentsByRequest[r.id] || []}
                  currentUser={currentUser}
                  onOffer={() => {}}
                  onAcceptOffer={() => {}}
                  onStart={() => {}}
                  onComplete={() => {}}
                  onVerify={() => {}}
                  onComment={handleCommentOnRequest}
                  onOpenMap={openRequestOnMap}
                  onUrgencyChange={handleUrgencyChange}
                />
              ))
            ) : (
              <EmptyState
                title="Completed mitzvahs will collect here"
                text="When a request is helped and marked complete, this becomes the shared record of good done."
                actionLabel="Find a request"
                onAction={() => changeView('browse')}
              />
            )
          )}
        </div>
      </section>

      <CreateRequestModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateRequest}
        isLoading={isCreating}
      />

      <CreateCarpoolModal
        mode={carpoolCreateMode}
        onClose={() => setCarpoolCreateMode(null)}
        onCreate={handleCreateCarpoolRide}
        isLoading={isCreating}
      />

      {quickViewRequest && (
        <QuickViewSheet
          request={quickViewRequest}
          offers={offers}
          comments={commentsByRequest[quickViewRequest.id] || []}
          currentUser={currentUser}
          onClose={() => setQuickViewRequest(null)}
          onOffer={(r) => { handleOffer(r); setQuickViewRequest(null); }}
          onOpenMap={openRequestOnMap}
        />
      )}
    </div>
  );
}
