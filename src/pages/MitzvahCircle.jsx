import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HandHeart, Loader2 } from 'lucide-react';
import { mitzvahService, notificationsService } from '@/services';
import { toast } from 'sonner';
import PageHelp from '@/components/common/PageHelp';
import DestinationHeader from '@/components/layout/DestinationHeader';
import CarpoolBoard from '@/components/mitzvah/CarpoolBoard';
import MinyanBoard from '@/components/feed/MinyanBoard';
import ParshaCard from '@/components/feed/ParshaCard';
import MealTrainsSection from '@/components/mitzvah/MealTrainsSection';
import {
  REQUEST_EXPIRY_MS,
  STATUSES,
  VALID_VIEWS,
  isRequestExpired,
  normalizeCarpoolRide,
  normalizeOffer,
  normalizeRequest,
  requestMatchesCategoryGroup,
  resolveMapLocation,
} from '@/components/mitzvah/circle/shared';
import CreateRequestModal from '@/components/mitzvah/circle/CreateRequestModal';
import CreateCarpoolModal from '@/components/mitzvah/circle/CreateCarpoolModal';
import QuickViewSheet from '@/components/mitzvah/circle/QuickViewSheet';
import MitzvahCircleHero from '@/components/mitzvah/circle/MitzvahCircleHero';
import BrowseTab from '@/components/mitzvah/circle/BrowseTab';
import MineTab from '@/components/mitzvah/circle/MineTab';
import CompletedTab from '@/components/mitzvah/circle/CompletedTab';

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
  const [requestDefaults, setRequestDefaults] = React.useState(null);
  const [requestDirection, setRequestDirection] = React.useState('need');
  const [carpoolCreateMode, setCarpoolCreateMode] = React.useState(null);
  const [quickViewRequest, setQuickViewRequest] = React.useState(null);

  React.useEffect(() => {
    if (searchParams.get('action') !== 'request') return;
    setRequestDefaults(null);
    setRequestDirection('need');
    setShowCreate(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('action');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

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

  const openRequestForm = (_defaults = null, direction = 'need') => {
    navigate(direction === 'offer' ? '/Publish?type=help_offer' : '/Publish?type=help_need');
  };

  const openRequestOnMap = (request) => {
    navigate(`/Map?requestId=${encodeURIComponent(request.id)}`);
  };

  const openOfferProfile = (request) => {
    navigate(`/PublicProfile?id=${encodeURIComponent(request.poster_id)}`);
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
        direction: requestDirection,
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
      toast.success(requestDirection === 'offer' ? 'Public help offer posted.' : 'Request posted.');
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
	        direction: mode === 'offer' ? 'offer' : 'need',
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
    if (request.direction === 'offer') {
      toast.error('This member is already offering help.');
      return;
    }
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
        title="Help"
        help={<PageHelp text="Ask for help, offer help, coordinate carpools, and build daily mitzvah streaks — the Five Towns Mitzvah Circle." />}
      />

      <section className="mobile-page-wide px-3 pt-3 sm:px-4 sm:pt-4">
        {/* Header */}
        <MitzvahCircleHero
          activeView={activeView}
          hasMitzvahStats={hasMitzvahStats}
          totals={totals}
          onPostRequest={openRequestForm}
          onChangeView={changeView}
          onChangeBrowseCategory={changeBrowseCategory}
          currentUser={currentUser}
        />

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
            <BrowseTab
              activeCategory={activeCategory}
              loadingRequests={loadingRequests}
              browseRequests={browseRequests}
              onQuickView={setQuickViewRequest}
              onPostNeed={() => navigate('/Publish?type=help_need')}
              onPostOffer={() => navigate('/Publish?type=help_offer')}
            />
          )}

          {activeView === 'mine' && (
            <MineTab
              myActivityItems={myActivityItems}
              offers={offers}
              commentsByRequest={commentsByRequest}
              currentUser={currentUser}
              onOffer={handleOffer}
              onAcceptOffer={handleAcceptOffer}
              onStart={handleStart}
              onComplete={handleComplete}
              onVerify={handleVerify}
              onComment={handleCommentOnRequest}
              onOpenMap={openRequestOnMap}
              onUrgencyChange={handleUrgencyChange}
              onBrowse={() => changeView('browse')}
            />
          )}

          {activeView === 'completed' && (
            <CompletedTab
              completedRequests={completedRequests}
              offers={offers}
              commentsByRequest={commentsByRequest}
              currentUser={currentUser}
              onComment={handleCommentOnRequest}
              onOpenMap={openRequestOnMap}
              onUrgencyChange={handleUrgencyChange}
              onFindRequest={() => changeView('browse')}
            />
          )}
        </div>
      </section>

      <CreateRequestModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateRequest}
        isLoading={isCreating}
        initialValues={requestDefaults}
        direction={requestDirection}
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
          onViewProfile={openOfferProfile}
        />
      )}
    </div>
  );
}
