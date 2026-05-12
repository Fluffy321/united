import React, { createPortal } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  HandHeart,
  ListFilter,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { mitzvahService, notificationsService } from '@/services';
import { toast } from 'sonner';
import PageHelp from '@/components/common/PageHelp';

const CATEGORIES = [
  'Transportation',
  'Errands',
  'Food / Meals',
  'Simcha Help',
  'Shul Help',
  'Tutoring',
  'Elderly Support',
  'Babysitting',
  'Tech Help',
  'Other',
];

const STATUSES = {
  OPEN:      'Open',
  OFFERED:   'Offered',
  ACCEPTED:  'Accepted',
  IN_PROG:   'In Progress',
  PENDING:   'Pending Verify',
  VERIFIED:  'Verified',
  CANCELLED: 'Cancelled',
};

// Normalize lowercase DB status values to the title-case UI values.
const DB_TO_UI_STATUS = {
  open:                STATUSES.OPEN,
  offered:             STATUSES.OFFERED,
  volunteer_offered:   STATUSES.OFFERED,
  accepted:            STATUSES.ACCEPTED,
  in_progress:         STATUSES.IN_PROG,
  pending_verify:      STATUSES.PENDING,
  pending_verification: STATUSES.PENDING,
  verified:            STATUSES.VERIFIED,
  completed:           STATUSES.VERIFIED,
  cancelled:           STATUSES.CANCELLED,
  closed:              STATUSES.CANCELLED,
  // Legacy title-case values from old local-state
  Open:       STATUSES.OPEN,
  Offered:    STATUSES.OFFERED,
  Accepted:   STATUSES.ACCEPTED,
  'In Progress': STATUSES.IN_PROG,
  Claimed:    STATUSES.ACCEPTED,
  Completed:  STATUSES.VERIFIED,
  Cancelled:  STATUSES.CANCELLED,
};

const UI_TO_DB_STATUS = {
  [STATUSES.OPEN]:      'open',
  [STATUSES.OFFERED]:   'offered',
  [STATUSES.ACCEPTED]:  'accepted',
  [STATUSES.IN_PROG]:   'in_progress',
  [STATUSES.PENDING]:   'pending_verify',
  [STATUSES.VERIFIED]:  'verified',
  [STATUSES.CANCELLED]: 'cancelled',
};

const normalizeRequest = (row) => {
  if (!row) return row;
  return {
    ...row,
    status: DB_TO_UI_STATUS[row.status] || row.status || STATUSES.OPEN,
    poster_id: row.requester_id || row.created_by_user_id,
    postedById: row.requester_id || row.created_by_user_id,
    poster_name: row.requester_name || row.created_by_name || 'Community member',
    postedBy: row.requester_name || row.created_by_name || 'Community member',
    neighborhood: row.neighborhood || row.location_label || row.locationLabel || 'Five Towns',
    estimatedHours: parseFloat(row.estimated_hours || row.estimatedHours || 1),
    urgency: row.urgency
      ? row.urgency.charAt(0).toUpperCase() + row.urgency.slice(1).replace('_', ' ')
      : 'Medium',
    accepted_volunteer_id: row.claimed_by_user_id,
  };
};

const normalizeOffer = (row) => {
  if (!row) return row;
  return {
    ...row,
    requestId: row.request_id,
    volunteerId: row.volunteer_id || row.user_id,
    volunteerName: row.volunteer_name || row.user_name || 'Volunteer',
  };
};

const STATUS_CONFIGS = {
  [STATUSES.OPEN]:      { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: HandHeart,    label: 'Open' },
  [STATUSES.OFFERED]:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',          Icon: Eye,          label: 'Offered' },
  [STATUSES.ACCEPTED]:  { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',    Icon: UserCheck,    label: 'Accepted' },
  [STATUSES.IN_PROG]:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',       Icon: Clock,        label: 'In Progress' },
  [STATUSES.PENDING]:   { cls: 'bg-purple-50 text-purple-700 border-purple-200',    Icon: ShieldCheck,  label: 'Pending Verify' },
  [STATUSES.VERIFIED]:  { cls: 'bg-slate-950 text-white border-slate-950',          Icon: CheckCircle2, label: 'Verified' },
  [STATUSES.CANCELLED]: { cls: 'bg-slate-100 text-slate-500 border-slate-200',      Icon: X,            label: 'Cancelled' },
};

function StatusPill({ status }) {
  const { cls, Icon, label } = STATUS_CONFIGS[status] || {
    cls: 'bg-slate-50 text-slate-600 border-slate-200',
    Icon: null,
    label: status,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${cls}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

function RequestCard({
  request,
  offers,
  currentUser,
  onOffer,
  onAcceptOffer,
  onStart,
  onComplete,
  onVerify,
  onQuickView,
}) {
  const isPoster = request.poster_id === currentUser?.id;
  const acceptedOffer = offers.find(
    (o) => o.requestId === request.id && o.status === 'accepted'
  );
  const acceptedVolunteerId = acceptedOffer?.volunteerId || request.accepted_volunteer_id;
  const myOffer = offers.find(
    (o) => o.requestId === request.id && o.volunteerId === currentUser?.id
  );
  const isAcceptedVolunteer = acceptedVolunteerId === currentUser?.id;
  const canOffer = !isPoster && request.status === STATUSES.OPEN && !myOffer;
  const canStart = isAcceptedVolunteer && request.status === STATUSES.ACCEPTED;
  const canComplete = isAcceptedVolunteer && request.status === STATUSES.IN_PROG;
  const canVerify =
    isPoster &&
    acceptedVolunteerId !== currentUser?.id &&
    request.status === STATUSES.PENDING;
  const pendingOffers = offers.filter(
    (o) => o.requestId === request.id && o.status === 'offered'
  );

  return (
    <article className="app-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
              {request.category}
            </span>
            <StatusPill status={request.status} />
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
              <HandHeart className="h-3 w-3" />
              Chesed
            </span>
          </div>
          <h2 className="text-[17px] font-black leading-snug text-slate-950">{request.title}</h2>
          <p className="mt-1 text-[13px] font-medium leading-5 text-slate-600">
            {request.description}
          </p>

          {request.status === STATUSES.VERIFIED && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-3 py-2.5">
              <span className="text-base">⛓️</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  Chesed Chain
                </p>
                <p className="text-[12px] font-semibold leading-5 text-emerald-900">
                  {request.estimatedHours}h contributed to the community
                </p>
              </div>
            </div>
          )}

          {request.status === STATUSES.OPEN && pendingOffers.length > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              <Users className="h-3 w-3" />
              {pendingOffers.length}{' '}
              {pendingOffers.length === 1 ? 'person offered' : 'people offered'} to help
            </div>
          )}
        </div>

        {onQuickView && (
          <button
            onClick={() => onQuickView(request)}
            className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 p-2 text-slate-400 transition-all hover:bg-slate-100 active:scale-95"
            title="Quick view"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] font-semibold text-slate-600 sm:grid-cols-4">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <MapPin className="h-3.5 w-3.5" />
          {request.neighborhood}
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <Clock className="h-3.5 w-3.5" />
          {request.estimatedHours} hrs
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          {request.urgency}
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <Users className="h-3.5 w-3.5" />
          {request.poster_name}
        </div>
      </div>

      {isPoster && pendingOffers.length > 0 && (
        <div className="mt-3 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[12px] font-black uppercase text-blue-700">Volunteer offers</p>
          {pendingOffers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2">
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-950">{offer.volunteerName}</p>
                {offer.note && (
                  <p className="truncate text-[12px] font-medium text-slate-500">{offer.note}</p>
                )}
              </div>
              <button
                onClick={() => onAcceptOffer(request.id, offer.id, offer.volunteerId)}
                className="app-button-primary min-h-9 shrink-0 rounded-lg px-3 py-0 text-[12px]"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canOffer && (
          <button
            onClick={() => onOffer(request)}
            className="chesed-cta-pulse app-button-primary h-10 px-4 text-[13px]"
            style={{ background: '#556B2F' }}
          >
            <HandHeart className="h-4 w-4" />
            Offer to Help
          </button>
        )}
        {myOffer && myOffer.status === 'offered' && (
          <span className="inline-flex h-10 items-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-[13px] font-black text-blue-700">
            Offer sent ✓
          </span>
        )}
        {canStart && (
          <button
            onClick={() => onStart(request.id)}
            className="app-button-primary h-10 bg-indigo-600 px-4 text-[13px] hover:bg-indigo-700"
          >
            <UserCheck className="h-4 w-4" />
            Start Task
          </button>
        )}
        {canComplete && (
          <button
            onClick={() => onComplete(request.id)}
            className="app-button-primary h-10 bg-purple-600 px-4 text-[13px] hover:bg-purple-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Completed
          </button>
        )}
        {canVerify && (
          <button
            onClick={() => onVerify(request.id)}
            className="app-button-primary h-10 bg-emerald-600 px-4 text-[13px] hover:bg-emerald-700"
          >
            <ShieldCheck className="h-4 w-4" />
            Verify Completion
          </button>
        )}
        {isPoster && acceptedVolunteerId === currentUser?.id && request.status === STATUSES.PENDING && (
          <span className="inline-flex h-10 items-center rounded-xl border border-red-200 bg-red-50 px-4 text-[13px] font-black text-red-700">
            Cannot verify your own hours
          </span>
        )}
      </div>
    </article>
  );
}

function CreateRequestModal({ open, onClose, onCreate, isLoading }) {
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: 'Other',
    neighborhood: 'Five Towns',
    estimatedHours: 1,
    urgency: 'Medium',
  });

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    onCreate(form);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 motion-soft-in"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl motion-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
          <div>
            <p className="text-[12px] font-black uppercase text-blue-600">New request</p>
            <h2 className="text-xl font-black text-slate-950">Post help needed</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="motion-stagger flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-slate-700">Title</span>
            <input
              autoFocus
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Example: Pick up groceries for elderly neighbor"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-slate-700">Description</span>
            <textarea
              required
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Describe what help is needed and any relevant details"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Category</span>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Neighborhood</span>
              <input
                value={form.neighborhood}
                onChange={(e) => update('neighborhood', e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Est. hours</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.estimatedHours}
                onChange={(e) => update('estimatedHours', parseFloat(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Urgency</span>
              <select
                value={form.urgency}
                onChange={(e) => update('urgency', e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="app-button-primary h-11 flex-1 text-[13px]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Request'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="app-card flex flex-col items-center gap-3 p-8 text-center">
      <HandHeart className="h-10 w-10 text-slate-300" />
      <div>
        <p className="font-black text-slate-950">{title}</p>
        {text && <p className="mt-1 text-[13px] text-slate-500">{text}</p>}
      </div>
    </div>
  );
}

function QuickViewSheet({ request, offers, currentUser, onClose, onOffer }) {
  if (!request || typeof document === 'undefined') return null;
  const myOffer = offers.find(
    (o) => o.requestId === request.id && o.volunteerId === currentUser?.id
  );
  const canOffer = request.poster_id !== currentUser?.id && request.status === STATUSES.OPEN && !myOffer;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 motion-soft-in sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl motion-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <StatusPill status={request.status} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                {request.category}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-950">{request.title}</h2>
            <p className="mt-2 text-[13px] text-slate-600">{request.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          {canOffer && (
            <button
              onClick={() => { onOffer(request); onClose(); }}
              className="chesed-cta-pulse app-button-primary h-10 flex-1 text-[13px]"
              style={{ background: '#556B2F' }}
            >
              <HandHeart className="h-4 w-4" />
              Offer to Help
            </button>
          )}
          <button
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className={`rounded-xl p-3 ${tones[tone]}`}>
      <Icon className="mb-2 h-4 w-4" />
      <p className="text-xl font-black">{value}</p>
      <p className="text-[10px] font-black uppercase">{label}</p>
    </div>
  );
}


export default function MitzvahCircle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();

  const VALID_TABS = ['open', 'offers', 'posted', 'completed'];
  const [activeTab, setActiveTab] = React.useState(() => {
    const tab = searchParams.get('tab');
    return VALID_TABS.includes(tab) ? tab : 'open';
  });
  const [query, setQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [showCreate, setShowCreate] = React.useState(false);
  const [quickViewRequest, setQuickViewRequest] = React.useState(null);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab && VALID_TABS.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'open') next.delete('tab');
      else next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  // ── Data loading ───────────────────────────────────────────────────────────

  const { data: rawRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['mitzvah-requests'],
    queryFn: () => mitzvahService.listRequests({}, '-created_date', 200),
    staleTime: 30000,
    enabled: !!currentUser,
  });

  const { data: rawOffers = [] } = useQuery({
    queryKey: ['mitzvah-offers'],
    queryFn: () => mitzvahService.listOffers({}, '-created_date', 500),
    staleTime: 30000,
    enabled: !!currentUser,
  });

  const requests = React.useMemo(() => rawRequests.map(normalizeRequest), [rawRequests]);
  const offers = React.useMemo(() => rawOffers.map(normalizeOffer), [rawOffers]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
    queryClient.invalidateQueries({ queryKey: ['mitzvah-offers'] });
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

  const { mutateAsync: createOfferMutation } = useMutation({
    mutationFn: (payload) => mitzvahService.createOffer(payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateOfferMutation } = useMutation({
    mutationFn: ({ id, patch }) => mitzvahService.updateOffer(id, patch),
    onSuccess: invalidate,
  });

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleCreateRequest = async (formData) => {
    try {
      await createRequestMutation({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        neighborhood: formData.neighborhood,
        locationLabel: formData.neighborhood,
        estimated_hours: formData.estimatedHours,
        urgency: formData.urgency.toLowerCase(),
        status: 'open',
        request_kind: 'volunteer',
        created_by_user_id: currentUser.id,
        created_by_name: currentUser.display_name || currentUser.full_name,
      });
      setShowCreate(false);
      changeTab('posted');
      toast.success('Request posted.');
    } catch (err) {
      toast.error(err.message || 'Could not post request.');
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

  // ── Derived data ───────────────────────────────────────────────────────────

  const filteredRequests = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesQuery =
        !needle ||
        [r.title, r.description, r.category, r.neighborhood, r.poster_name].some((v) =>
          String(v || '').toLowerCase().includes(needle)
        );
      const matchesCat = categoryFilter === 'All' || r.category === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [requests, query, categoryFilter]);

  const openRequests = filteredRequests.filter(
    (r) => ![STATUSES.VERIFIED, STATUSES.CANCELLED].includes(r.status)
  );
  const completedRequests = filteredRequests.filter((r) =>
    [STATUSES.VERIFIED, STATUSES.CANCELLED].includes(r.status)
  );
  const myOfferRequests = requests
    .map((r) => ({
      request: r,
      offer: offers.find((o) => o.requestId === r.id && o.volunteerId === currentUser?.id),
    }))
    .filter((item) => item.offer);
  const myPosted = filteredRequests.filter((r) => r.poster_id === currentUser?.id);

  const totals = React.useMemo(() => ({
    openCount: requests.filter((r) => r.status === STATUSES.OPEN).length,
    offeredCount: requests.filter((r) =>
      [STATUSES.OFFERED, STATUSES.ACCEPTED, STATUSES.IN_PROG].includes(r.status)
    ).length,
    completedCount: requests.filter((r) => r.status === STATUSES.VERIFIED).length,
  }), [requests]);

  const tabs = [
    { id: 'open', label: 'Help Requests' },
    { id: 'offers', label: 'My Offers' },
    { id: 'posted', label: 'My Posted' },
    { id: 'completed', label: 'Completed' },
  ];

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="app-page mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 sm:px-4 sm:pt-4">
        {/* Header */}
        <div className="app-card overflow-hidden">
          <div className="relative p-4 sm:p-5">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[48px] bg-blue-50" />
            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                    Mitzvah Circle
                  </h1>
                  <PageHelp text="Ask for help, offer help, and follow mitzvah requests from open to completed." />
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="app-button-primary h-11 self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  Post Request
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Metric icon={HandHeart} label="Open" value={totals.openCount} tone="blue" />
                <Metric icon={Clock} label="In Progress" value={totals.offeredCount} tone="amber" />
                <Metric icon={Award} label="Completed" value={totals.completedCount} tone="emerald" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-20 -mx-3 mt-3 bg-[#F6F8FB]/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
          <div className="app-card mobile-scroll-x flex gap-2 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`motion-press shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-black transition ${
                  activeTab === tab.id
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search/filter bar for list views */}
        {['open', 'posted'].includes(activeTab) && (
          <div className="app-card mb-3 grid gap-2 p-3 sm:grid-cols-[1fr_220px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search requests"
                className="app-input h-11 pl-10 pr-3 text-sm"
              />
            </label>
            <label className="relative">
              <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="app-input h-11 pl-10 pr-3 text-sm font-black"
              >
                <option>All</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
        )}

        {/* Tab content */}
        <div key={activeTab} className="motion-stagger space-y-3">
          {activeTab === 'open' && (
            loadingRequests ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : openRequests.length ? (
              openRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  offers={offers}
                  currentUser={currentUser}
                  onOffer={handleOffer}
                  onAcceptOffer={handleAcceptOffer}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onVerify={handleVerify}
                  onQuickView={setQuickViewRequest}
                />
              ))
            ) : (
              <EmptyState
                title="No open requests"
                text="Be the first to post a chesed request in your community."
              />
            )
          )}

          {activeTab === 'offers' && (
            myOfferRequests.length ? (
              myOfferRequests.map(({ request, offer }) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  offers={offers}
                  currentUser={currentUser}
                  onOffer={handleOffer}
                  onAcceptOffer={handleAcceptOffer}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onVerify={handleVerify}
                />
              ))
            ) : (
              <EmptyState
                title="No offers yet"
                text="Browse open requests and tap 'Offer to Help' to get started."
              />
            )
          )}

          {activeTab === 'posted' && (
            myPosted.length ? (
              myPosted.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  offers={offers}
                  currentUser={currentUser}
                  onOffer={handleOffer}
                  onAcceptOffer={handleAcceptOffer}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onVerify={handleVerify}
                />
              ))
            ) : (
              <EmptyState
                title="No posted requests"
                text="Post a request and your community will be notified."
              />
            )
          )}

          {activeTab === 'completed' && (
            completedRequests.length ? (
              completedRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  offers={offers}
                  currentUser={currentUser}
                  onOffer={() => {}}
                  onAcceptOffer={() => {}}
                  onStart={() => {}}
                  onComplete={() => {}}
                  onVerify={() => {}}
                />
              ))
            ) : (
              <EmptyState
                title="No completed requests yet"
                text="Completed and verified requests will appear here."
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

      {quickViewRequest && (
        <QuickViewSheet
          request={quickViewRequest}
          offers={offers}
          currentUser={currentUser}
          onClose={() => setQuickViewRequest(null)}
          onOffer={(r) => { handleOffer(r); setQuickViewRequest(null); }}
        />
      )}
    </main>
  );
}
