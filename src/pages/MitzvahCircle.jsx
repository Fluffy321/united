import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  HandCoins,
  HandHeart,
  ListFilter,
  Loader2,
  MapPin,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { dataService, notificationsService, storageService } from '@/services';
import { toast } from 'sonner';
import FeatureStatusNotice, { StatusBadge } from '@/components/common/FeatureStatusNotice';
import MitzvahMap from '@/components/mitzvah/MitzvahMap';
import CarpoolBoard from '@/components/mitzvah/CarpoolBoard';

const STORAGE_KEY = 'junited_advanced_mitzvah_marketplace_v1';

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
  OPEN: 'Open',
  OFFERED: 'Offered',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  PENDING: 'Completed Pending Verification',
  VERIFIED: 'Verified',
  CANCELLED: 'Cancelled',
};

const CURRENT_USER_ID = 'local-demo';

const NEIGHBORHOOD_COORDS = {
  Cedarhurst: { lat: 40.6223, lng: -73.7246 },
  Woodmere: { lat: 40.6323, lng: -73.7129 },
  Lawrence: { lat: 40.6157, lng: -73.7296 },
  Hewlett: { lat: 40.6434, lng: -73.6946 },
  Inwood: { lat: 40.6229, lng: -73.7501 },
  'Five Towns': { lat: 40.6369, lng: -73.7142 },
};

const getRequestCoords = (request, index = 0) => {
  if (request.location_lat && request.location_lng) {
    return { lat: request.location_lat, lng: request.location_lng };
  }
  if (request.approxLat && request.approxLng) {
    return { lat: request.approxLat, lng: request.approxLng };
  }
  const base = NEIGHBORHOOD_COORDS[request.neighborhood] || NEIGHBORHOOD_COORDS[request.locationLabel] || NEIGHBORHOOD_COORDS['Five Towns'];
  return {
    lat: base.lat + ((index % 3) - 1) * 0.002,
    lng: base.lng + (Math.floor(index / 3) - 1) * 0.002,
  };
};

const JOINED_COMMUNITY_IDS = [
  'five-towns-shul-network',
  'chesed-response-circle',
  'simcha-events-board',
  'shabbos-table-hosts',
  'demo-community',
];

const COMMUNITY_MAP_POINTS = [
  {
    id: 'community-post-minyan',
    community_id: 'five-towns-shul-network',
    communityName: 'Five Towns Shul Network',
    title: 'Late Maariv update',
    description: 'New late Maariv slot and Motzei Shabbos learning post from your shul network.',
    type: 'community_post',
    location_text: 'Cedarhurst',
    location_lat: 40.6227,
    location_lng: -73.7233,
  },
  {
    id: 'community-post-meals',
    community_id: 'chesed-response-circle',
    communityName: 'Chesed Response Circle',
    title: 'Meals needed nearby',
    description: 'Two dinner slots are still open for a local family.',
    type: 'help_needed',
    location_text: 'Woodmere',
    location_lat: 40.6336,
    location_lng: -73.7118,
  },
  {
    id: 'community-post-simcha',
    community_id: 'simcha-events-board',
    communityName: 'Simcha & Events Board',
    title: 'Sheva brachos setup',
    description: 'Volunteers and rides are being coordinated for tonight.',
    type: 'event',
    location_text: 'Lawrence',
    location_lat: 40.6178,
    location_lng: -73.7283,
  },
  {
    id: 'community-post-hosting',
    community_id: 'shabbos-table-hosts',
    communityName: 'Shabbos Table Hosts',
    title: 'Guests looking for lunch',
    description: 'A new couple is looking for a Shabbos lunch invite this week.',
    type: 'community_post',
    location_text: 'Woodmere',
    location_lat: 40.6311,
    location_lng: -73.7144,
  },
  {
    id: 'community-post-demo',
    community_id: 'demo-community',
    communityName: 'Five Towns',
    title: 'Neighborhood post near you',
    description: 'A community update from one of your joined local circles.',
    type: 'community_post',
    location_text: 'Five Towns',
    location_lat: 40.6368,
    location_lng: -73.7168,
  },
  {
    id: 'not-joined-example',
    community_id: 'not-joined',
    communityName: 'Not Joined Example',
    title: 'Hidden from personalized map',
    description: 'This point should not appear unless the user joins this community.',
    type: 'community_post',
    location_text: 'Inwood',
    location_lat: 40.6229,
    location_lng: -73.7501,
  },
];

const initialState = {
  mitzvah_requests: [
    {
      id: 'req-simcha-setup',
      title: 'Help setting up for a simcha',
      description: 'Need two people to help set tables, move chairs, and place centerpieces before a vort.',
      category: 'Simcha Help',
      neighborhood: 'Cedarhurst',
      estimatedHours: 2.5,
      type: 'volunteer',
      amount: 0,
      urgency: 'High',
      status: STATUSES.OPEN,
      postedById: 'poster-rivka',
      postedBy: 'Rivka S.',
      createdAt: '2026-05-05T16:00:00.000Z',
    },
    {
      id: 'req-appointment-ride',
      title: 'Drive someone to an appointment',
      description: 'Round trip ride for an elderly community member. Appointment is near Rockville Centre.',
      category: 'Transportation',
      neighborhood: 'Woodmere',
      estimatedHours: 1.5,
      type: 'paid',
      amount: 36,
      urgency: 'Medium',
      status: STATUSES.OPEN,
      postedById: 'poster-david',
      postedBy: 'David L.',
      createdAt: '2026-05-05T13:30:00.000Z',
    },
    {
      id: 'req-tech-help',
      title: 'Tech help setting up a printer',
      description: 'Help an older neighbor connect a wireless printer and explain basic scanning.',
      category: 'Tech Help',
      neighborhood: 'Lawrence',
      estimatedHours: 1,
      type: 'volunteer',
      amount: 0,
      urgency: 'Low',
      status: STATUSES.OFFERED,
      postedById: CURRENT_USER_ID,
      postedBy: 'Demo',
      createdAt: '2026-05-04T20:00:00.000Z',
    },
    {
      id: 'req-tutoring',
      title: 'Tutor a student in math',
      description: 'Looking for patient homework help for a middle school student before finals.',
      category: 'Tutoring',
      neighborhood: 'Hewlett',
      estimatedHours: 2,
      type: 'paid',
      amount: 50,
      urgency: 'Medium',
      status: STATUSES.ACCEPTED,
      postedById: 'poster-miriam',
      postedBy: 'Miriam C.',
      acceptedOfferId: 'offer-tutoring-demo',
      createdAt: '2026-05-03T18:45:00.000Z',
    },
  ],
  mitzvah_offers: [
    {
      id: 'offer-tech-avi',
      requestId: 'req-tech-help',
      volunteerId: 'volunteer-avi',
      volunteerName: 'Avi R.',
      note: 'I can come after Maariv and bring my laptop if needed.',
      status: 'offered',
      createdAt: '2026-05-04T21:00:00.000Z',
    },
    {
      id: 'offer-tutoring-demo',
      requestId: 'req-tutoring',
      volunteerId: CURRENT_USER_ID,
      volunteerName: 'Demo',
      note: 'I can help with review sheets and practice problems.',
      status: 'accepted',
      createdAt: '2026-05-04T12:00:00.000Z',
    },
  ],
  mitzvah_completions: [],
  verification_requests: [],
  chesed_hours_logs: [
    {
      id: 'log-food-delivery',
      volunteerId: CURRENT_USER_ID,
      volunteerName: 'Demo',
      taskTitle: 'Deliver Shabbos meals',
      category: 'Food / Meals',
      dateCompleted: '2026-05-01',
      hoursCompleted: 1.5,
      verifierName: 'Sarah K.',
      verificationStatus: 'Verified',
      description: 'Delivered prepared meals to a local family before Shabbos.',
      createdAt: '2026-05-01T19:00:00.000Z',
    },
    {
      id: 'log-shul-setup',
      volunteerId: CURRENT_USER_ID,
      volunteerName: 'Demo',
      taskTitle: 'Shul event setup',
      category: 'Shul Help',
      dateCompleted: '2026-04-28',
      hoursCompleted: 2,
      verifierName: 'Rabbi Office',
      verificationStatus: 'Verified',
      description: 'Helped arrange tables, siddurim, and chairs for a community learning event.',
      createdAt: '2026-04-28T21:00:00.000Z',
    },
  ],
};

const normalizeRequestStatus = (status) => ({
  'Volunteer Offered': STATUSES.OFFERED,
  'Verified Completed': STATUSES.VERIFIED,
}[status] || status);

const normalizeWorkflowState = (savedState) => ({
  mitzvah_requests: (savedState?.mitzvah_requests || savedState?.requests || initialState.mitzvah_requests)
    .map((request) => ({
      ...request,
      poster_id: getPosterId(request),
      poster_name: getPosterName(request),
      status: normalizeRequestStatus(request.status),
      status_history: request.status_history || request.statusHistory || [],
    })),
  mitzvah_offers: (savedState?.mitzvah_offers || savedState?.offers || initialState.mitzvah_offers)
    .map((offer) => ({
      ...offer,
      volunteer_id: getVolunteerId(offer),
      volunteer_name: getVolunteerName(offer),
      status_history: offer.status_history || offer.statusHistory || [],
    })),
  mitzvah_completions: (savedState?.mitzvah_completions || initialState.mitzvah_completions)
    .map((completion) => ({ ...completion, status_history: completion.status_history || completion.statusHistory || [] })),
  verification_requests: (savedState?.verification_requests || initialState.verification_requests)
    .map((request) => ({ ...request, status_history: request.status_history || request.statusHistory || [] })),
  chesed_hours_logs: (savedState?.chesed_hours_logs || savedState?.chesedLogs || initialState.chesed_hours_logs)
    .map((log) => ({ ...log, volunteer_id: log.volunteer_id || log.volunteerId, verifier_id: log.verifier_id || log.verifierId })),
});

const readState = () => {
  return normalizeWorkflowState(storageService.getJson(STORAGE_KEY, initialState));
};

const saveState = (state) => {
  storageService.setJson(STORAGE_KEY, state);
};

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(0)}`;
const nowISO = () => new Date().toISOString();
const todayISO = () => new Date().toISOString().slice(0, 10);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getPosterId = (request) => request.poster_id || request.postedById;
const getPosterName = (request) => request.poster_name || request.postedBy;
const getVolunteerId = (offer) => offer.volunteer_id || offer.volunteerId;
const getVolunteerName = (offer) => offer.volunteer_name || offer.volunteerName;

const addStatusHistory = (record, status, actor, action) => [
  ...(record.status_history || record.statusHistory || []),
  {
    status,
    action,
    actor_id: actor?.id || null,
    actor_name: actor?.full_name || actor?.name || 'System',
    timestamp: nowISO(),
  },
];

const normalizeDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function StatusPill({ status }) {
  const tone = {
    [STATUSES.OPEN]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [STATUSES.OFFERED]: 'bg-blue-50 text-blue-700 border-blue-200',
    [STATUSES.ACCEPTED]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    [STATUSES.IN_PROGRESS]: 'bg-amber-50 text-amber-700 border-amber-200',
    [STATUSES.PENDING]: 'bg-purple-50 text-purple-700 border-purple-200',
    [STATUSES.VERIFIED]: 'bg-slate-950 text-white border-slate-950',
    [STATUSES.CANCELLED]: 'bg-slate-100 text-slate-500 border-slate-200',
  }[status] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${tone}`}>
      {status}
    </span>
  );
}

function RequestCard({ request, offers, completions, verificationRequests, currentUser, onOffer, onAcceptPaid, onAcceptOffer, onStart, onComplete, onVerify }) {
  const posterId = getPosterId(request);
  const posterName = getPosterName(request);
  const isPoster = posterId === currentUser.id;
  const acceptedOffer = offers.find((offer) => offer.id === request.acceptedOfferId);
  const acceptedVolunteerId = acceptedOffer ? getVolunteerId(acceptedOffer) : null;
  const myOffer = offers.find((offer) => offer.requestId === request.id && getVolunteerId(offer) === currentUser.id);
  const completion = completions.find((item) => item.id === request.completionId || item.requestId === request.id);
  const verificationRequest = verificationRequests.find((item) => item.id === request.verificationRequestId || item.completionId === completion?.id);
  const isAcceptedVolunteer = acceptedVolunteerId === currentUser.id;
  const canOffer = !isPoster && request.status === STATUSES.OPEN && !myOffer;
  const canAcceptPaid = canOffer && request.type === 'paid';
  const canStart = isAcceptedVolunteer && request.status === STATUSES.ACCEPTED;
  const canComplete = isAcceptedVolunteer && request.status === STATUSES.IN_PROGRESS;
  const canVerify = isPoster && acceptedVolunteerId !== currentUser.id && request.status === STATUSES.PENDING;
  const blockedSelfVerify = isPoster && acceptedVolunteerId === currentUser.id && request.status === STATUSES.PENDING;
  const pendingOffers = offers.filter((offer) => offer.requestId === request.id && offer.status === 'offered');

  return (
    <article className="app-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">{request.category}</span>
            <StatusPill status={request.status} />
            <StatusBadge>Demo Only</StatusBadge>
          </div>
          <h2 className="text-[17px] font-black leading-snug text-slate-950">{request.title}</h2>
          <p className="mt-1 text-[13px] font-medium leading-5 text-slate-600">{request.description}</p>
        </div>
        <div className={`shrink-0 rounded-xl px-3 py-2 text-right ${request.type === 'paid' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <p className={`text-[11px] font-black uppercase ${request.type === 'paid' ? 'text-amber-700' : 'text-emerald-700'}`}>
            {request.type === 'paid' ? 'Paid' : 'Chesed'}
          </p>
          <p className={`text-lg font-black ${request.type === 'paid' ? 'text-amber-900' : 'text-emerald-900'}`}>
            {request.type === 'paid' ? formatMoney(request.amount) : 'Free'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] font-semibold text-slate-600 sm:grid-cols-4">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2"><MapPin className="h-3.5 w-3.5" />{request.neighborhood}</div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2"><Clock className="h-3.5 w-3.5" />{request.estimatedHours} hrs</div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2"><AlertCircle className="h-3.5 w-3.5" />{request.urgency}</div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2"><Users className="h-3.5 w-3.5" />{posterName}</div>
      </div>

      {request.type === 'paid' && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[12px] font-bold leading-5 text-amber-900">
            Payment placeholder: this task is structured for future in-app payment. Stripe can later create a checkout or escrow flow from this request id.
            No money is processed in this demo.
          </p>
        </div>
      )}

      {(completion || verificationRequest || acceptedOffer) && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[11px] font-black uppercase text-slate-500">Structured workflow records</p>
          <div className="grid gap-2 text-[12px] font-bold text-slate-600 sm:grid-cols-3">
            {acceptedOffer && <span className="rounded-lg bg-white px-2.5 py-2">mitzvah_offers: {acceptedOffer.status}</span>}
            {completion && <span className="rounded-lg bg-white px-2.5 py-2">mitzvah_completions: {completion.status}</span>}
            {verificationRequest && <span className="rounded-lg bg-white px-2.5 py-2">verification_requests: {verificationRequest.status}</span>}
          </div>
          {verificationRequest?.status === 'pending' && (
            <p className="mt-2 rounded-lg bg-purple-50 px-2.5 py-2 text-[12px] font-bold text-purple-800">
              Pending verification from {verificationRequest.verifier_name || verificationRequest.verifierName}. Hours are not logged until the poster verifies.
            </p>
          )}
          {request.status_history?.length > 0 && (
            <p className="mt-2 text-[12px] font-semibold text-slate-500">
              Latest status: {request.status_history[request.status_history.length - 1].action}
            </p>
          )}
        </div>
      )}

      {isPoster && pendingOffers.length > 0 && (
        <div className="mt-3 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[12px] font-black uppercase text-blue-700">Volunteer offers</p>
          {pendingOffers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2">
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-950">{offer.volunteerName}</p>
                <p className="truncate text-[12px] font-medium text-slate-500">{offer.note}</p>
              </div>
              <button
                onClick={() => onAcceptOffer(request.id, offer.id)}
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
          <button onClick={() => onOffer(request)} className="app-button-primary h-10 bg-slate-950 px-4 text-[13px] hover:bg-slate-900">
            <HandHeart className="h-4 w-4" />
            Offer to Help
          </button>
        )}
        {canAcceptPaid && (
          <button onClick={() => onAcceptPaid(request)} className="app-button-primary h-10 bg-amber-500 px-4 text-[13px] hover:bg-amber-600">
            <HandCoins className="h-4 w-4" />
            Accept Demo Paid Task
          </button>
        )}
        {myOffer && myOffer.status === 'offered' && (
          <span className="inline-flex h-10 items-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-[13px] font-black text-blue-700">
            Offer sent
          </span>
        )}
        {canStart && (
          <button onClick={() => onStart(request.id)} className="app-button-primary h-10 bg-indigo-600 px-4 text-[13px] hover:bg-indigo-700">
            <UserCheck className="h-4 w-4" />
            Start Task
          </button>
        )}
        {canComplete && (
          <button onClick={() => onComplete(request.id)} className="app-button-primary h-10 bg-purple-600 px-4 text-[13px] hover:bg-purple-700">
            <CheckCircle2 className="h-4 w-4" />
            Mark Completed
          </button>
        )}
        {canVerify && (
          <button onClick={() => onVerify(request.id)} className="app-button-primary h-10 bg-emerald-600 px-4 text-[13px] hover:bg-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Verify Completion (Demo)
          </button>
        )}
        {blockedSelfVerify && (
          <span className="inline-flex h-10 items-center rounded-xl border border-red-200 bg-red-50 px-4 text-[13px] font-black text-red-700">
            Cannot verify your own hours
          </span>
        )}
      </div>
    </article>
  );
}

function CreateRequestModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Transportation',
    neighborhood: 'Five Towns',
    estimatedHours: 1,
    type: 'volunteer',
    amount: 25,
    urgency: 'Medium',
  });

  if (!open) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    onCreate(form);
    setForm({
      title: '',
      description: '',
      category: 'Transportation',
      neighborhood: 'Five Towns',
      estimatedHours: 1,
      type: 'volunteer',
      amount: 25,
      urgency: 'Medium',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-0 sm:items-center sm:px-4" onClick={onClose}>
      <form onSubmit={submit} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-black uppercase text-blue-600">New request</p>
            <h2 className="text-xl font-black text-slate-950">Post help needed</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close request form" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-slate-700">Title</span>
            <input required value={form.title} onChange={(event) => update('title', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Example: Pick up groceries" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-slate-700">Description</span>
            <textarea required value={form.description} onChange={(event) => update('description', event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Explain what help is needed" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Category</span>
              <select value={form.category} onChange={(event) => update('category', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none">
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Neighborhood</span>
              <input value={form.neighborhood} onChange={(event) => update('neighborhood', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Hours</span>
              <input type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={(event) => update('estimatedHours', Number(event.target.value))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Type</span>
              <select value={form.type} onChange={(event) => update('type', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none">
                <option value="volunteer">Volunteer</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Urgency</span>
              <select value={form.urgency} onChange={(event) => update('urgency', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </label>
          </div>
          {form.type === 'paid' && (
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Offered amount</span>
              <input type="number" min="1" value={form.amount} onChange={(event) => update('amount', Number(event.target.value))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none" />
            </label>
          )}
        </div>

        <button type="submit" className="mt-5 h-12 w-full rounded-xl bg-blue-600 text-sm font-black text-white active:scale-[0.98]">
          Post Request
        </button>
      </form>
    </div>
  );
}

function ChesedHoursDashboard({ logs, onGenerateText }) {
  const [category, setCategory] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [generated, setGenerated] = useState(null);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    return logs.filter((log) => {
      const categoryOk = category === 'All' || log.category === category;
      if (!categoryOk) return false;
      if (dateRange === 'all') return true;
      const completed = new Date(`${log.dateCompleted}T00:00:00`);
      const days = (now - completed) / 86400000;
      if (dateRange === '30') return days <= 30;
      if (dateRange === '90') return days <= 90;
      return true;
    });
  }, [logs, category, dateRange]);

  const totalHours = filteredLogs.reduce((sum, log) => sum + Number(log.hoursCompleted || 0), 0);
  const verifiedHours = filteredLogs.filter((log) => log.verificationStatus === 'Verified').reduce((sum, log) => sum + Number(log.hoursCompleted || 0), 0);
  const pendingHours = filteredLogs.filter((log) => log.verificationStatus !== 'Verified').reduce((sum, log) => sum + Number(log.hoursCompleted || 0), 0);

  const exportCsv = () => {
    const rows = [
      ['Volunteer', 'Task', 'Category', 'Date Completed', 'Hours', 'Verifier', 'Verification Status', 'Description'],
      ...filteredLogs.map((log) => [
        log.volunteerName,
        log.taskTitle,
        log.category,
        log.dateCompleted,
        log.hoursCompleted,
        log.verifierName,
        log.verificationStatus,
        log.description,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'junited-chesed-hours.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const printSummary = () => {
    const html = `
      <html>
        <head><title>JUnited Chesed Hours Summary</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h1>JUnited Chesed Hours Summary</h1>
          <p><strong>Total hours:</strong> ${totalHours}</p>
          <p><strong>Verified hours:</strong> ${verifiedHours}</p>
          <p><strong>Pending hours:</strong> ${pendingHours}</p>
          <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
            <thead><tr>${['Task', 'Category', 'Date', 'Hours', 'Verifier', 'Status'].map((heading) => `<th style="border:1px solid #ddd; padding:8px; text-align:left;">${heading}</th>`).join('')}</tr></thead>
            <tbody>
              ${filteredLogs.map((log) => `<tr><td style="border:1px solid #ddd; padding:8px;">${log.taskTitle}</td><td style="border:1px solid #ddd; padding:8px;">${log.category}</td><td style="border:1px solid #ddd; padding:8px;">${log.dateCompleted}</td><td style="border:1px solid #ddd; padding:8px;">${log.hoursCompleted}</td><td style="border:1px solid #ddd; padding:8px;">${log.verifierName}</td><td style="border:1px solid #ddd; padding:8px;">${log.verificationStatus}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const generate = () => {
    const text = onGenerateText({ totalHours, verifiedHours, logs: filteredLogs });
    setGenerated(text);
  };

  return (
    <section className="space-y-4">
      <FeatureStatusNotice title="Demo Only: Chesed hours are saved in this browser">
        These hours are useful for testing the workflow, but they are not permanent school/community records yet. A real Supabase verification system still needs to be connected.
      </FeatureStatusNotice>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-black uppercase text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{totalHours}</p>
          <p className="text-[11px] font-bold text-slate-400">hours</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 shadow-sm">
          <p className="text-[11px] font-black uppercase text-emerald-700">Verified</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{verifiedHours}</p>
          <p className="text-[11px] font-bold text-emerald-700">hours</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 shadow-sm">
          <p className="text-[11px] font-black uppercase text-amber-700">Pending</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{pendingHours}</p>
          <p className="text-[11px] font-bold text-amber-700">hours</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
            <option>All</option>
            {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
            <option value="all">All dates</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <button onClick={exportCsv} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[13px] font-black text-slate-700 active:scale-[0.98]"><Download className="h-4 w-4" />Export CSV</button>
          <button onClick={printSummary} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[13px] font-black text-slate-700 active:scale-[0.98]"><Printer className="h-4 w-4" />Print Summary</button>
          <button onClick={generate} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[13px] font-black text-white active:scale-[0.98]"><Sparkles className="h-4 w-4" />Generate Demo Text</button>
        </div>
      </div>

      {generated && (
        <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <TextBlock title="Short resume bullet" text={generated.resumeBullet} />
          <TextBlock title="School/community service description" text={generated.schoolDescription} />
          <TextBlock title="Formal verification summary" text={generated.formalSummary} />
        </div>
      )}

      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <EmptyState title="No hours yet" text="Verified volunteer completions will automatically appear here." />
        ) : filteredLogs.map((log) => (
          <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">{log.taskTitle}</h3>
                <p className="mt-1 text-[13px] font-medium leading-5 text-slate-600">{log.description}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${log.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {log.verificationStatus}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-semibold text-slate-600 sm:grid-cols-4">
              <span className="rounded-xl bg-slate-50 px-2.5 py-2">{log.category}</span>
              <span className="rounded-xl bg-slate-50 px-2.5 py-2">{log.hoursCompleted} hours</span>
              <span className="rounded-xl bg-slate-50 px-2.5 py-2">{log.dateCompleted}</span>
              <span className="rounded-xl bg-slate-50 px-2.5 py-2">Verified by {log.verifierName}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TextBlock({ title, text }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="mb-1 text-[12px] font-black uppercase text-blue-700">{title}</p>
      <p className="text-[13px] font-medium leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <HandHeart className="h-6 w-6" />
      </div>
      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-1 text-[13px] font-medium text-slate-500">{text}</p>
    </div>
  );
}

export default function MitzvahCircle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [state, setState] = useState(readState);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'open');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedMapRequestId, setSelectedMapRequestId] = useState(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab, searchParams]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (tab === 'open') next.delete('tab');
      else next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    const userTimeout = new Promise((resolve) => {
      window.setTimeout(() => resolve({ display_name: 'Demo', full_name: 'Demo' }), 1500);
    });

    Promise.race([dataService.auth.me(), userTimeout])
      .then((user) => setCurrentUser({
        id: CURRENT_USER_ID,
        full_name: user.display_name || user.full_name || 'Demo',
      }))
      .catch(() => setCurrentUser({ id: CURRENT_USER_ID, full_name: 'Demo' }))
      .finally(() => setIsLoadingUser(false));
  }, []);

  const backend = {
    createRequest: async (payload) => {
      const createdAt = nowISO();
      const request = {
        ...payload,
        id: makeId('req'),
        poster_id: currentUser.id,
        poster_name: currentUser.full_name,
        postedById: currentUser.id,
        postedBy: currentUser.full_name,
        amount: payload.type === 'paid' ? Number(payload.amount || 0) : 0,
        status: STATUSES.OPEN,
        createdAt,
        updatedAt: createdAt,
        status_history: addStatusHistory({}, STATUSES.OPEN, currentUser, 'Request created'),
      };
      setState((current) => ({ ...current, mitzvah_requests: [request, ...current.mitzvah_requests] }));
      return request;
    },
    createOffer: async (request, note = 'I am available to help with this request.') => {
      if (getPosterId(request) === currentUser.id) {
        throw new Error('You cannot offer to help on your own request.');
      }
      const createdAt = nowISO();
      const offer = {
        id: makeId('offer'),
        requestId: request.id,
        volunteer_id: currentUser.id,
        volunteer_name: currentUser.full_name,
        volunteerId: currentUser.id,
        volunteerName: currentUser.full_name,
        note,
        status: 'offered',
        createdAt,
        updatedAt: createdAt,
        status_history: addStatusHistory({}, 'offered', currentUser, 'Volunteer offered to help'),
      };
      setState((current) => ({
        ...current,
        mitzvah_offers: current.mitzvah_offers.some((item) => item.requestId === request.id && getVolunteerId(item) === currentUser.id)
          ? current.mitzvah_offers
          : [offer, ...current.mitzvah_offers],
        mitzvah_requests: current.mitzvah_requests.map((item) => item.id === request.id ? {
          ...item,
          status: STATUSES.OFFERED,
          updatedAt: createdAt,
          status_history: addStatusHistory(item, STATUSES.OFFERED, currentUser, 'Volunteer offer received'),
        } : item),
      }));
      notificationsService.notifyMitzvahOffer({
        posterId: getPosterId(request),
        volunteerId: currentUser.id,
        volunteerName: currentUser.full_name,
        requestId: request.id,
        requestTitle: request.title,
      }).catch(() => {});
      return offer;
    },
    acceptPaidTask: async (request) => {
      if (getPosterId(request) === currentUser.id) {
        throw new Error('You cannot accept your own paid task.');
      }
      const createdAt = nowISO();
      const offer = {
        id: makeId('offer'),
        requestId: request.id,
        volunteer_id: currentUser.id,
        volunteer_name: currentUser.full_name,
        volunteerId: currentUser.id,
        volunteerName: currentUser.full_name,
        note: `Accepted paid task. Payment placeholder amount: ${formatMoney(request.amount)}.`,
        status: 'accepted',
        createdAt,
        updatedAt: createdAt,
        status_history: addStatusHistory({}, 'accepted', currentUser, 'Volunteer accepted paid task'),
      };
      setState((current) => ({
        ...current,
        mitzvah_offers: [offer, ...current.mitzvah_offers],
        mitzvah_requests: current.mitzvah_requests.map((item) => item.id === request.id ? {
          ...item,
          status: STATUSES.ACCEPTED,
          acceptedOfferId: offer.id,
          accepted_volunteer_id: currentUser.id,
          accepted_volunteer_name: currentUser.full_name,
          updatedAt: createdAt,
          status_history: addStatusHistory(item, STATUSES.ACCEPTED, currentUser, 'Paid task accepted by helper'),
        } : item),
      }));
      return offer;
    },
    acceptOffer: async (requestId, offerId) => {
      const request = state.mitzvah_requests.find((item) => item.id === requestId);
      const acceptedOffer = state.mitzvah_offers.find((item) => item.id === offerId);
      if (!request || !acceptedOffer) throw new Error('Request or offer was not found.');
      if (getPosterId(request) !== currentUser.id) throw new Error('Only the poster can accept a volunteer.');
      const acceptedAt = nowISO();
      setState((current) => ({
        ...current,
        mitzvah_offers: current.mitzvah_offers.map((offer) => offer.requestId === requestId ? {
          ...offer,
          status: offer.id === offerId ? 'accepted' : 'not_selected',
          updatedAt: acceptedAt,
          status_history: addStatusHistory(offer, offer.id === offerId ? 'accepted' : 'not_selected', currentUser, offer.id === offerId ? 'Poster accepted offer' : 'Poster chose another volunteer'),
        } : offer),
        mitzvah_requests: current.mitzvah_requests.map((request) => request.id === requestId ? {
          ...request,
          status: STATUSES.ACCEPTED,
          acceptedOfferId: offerId,
          accepted_volunteer_id: getVolunteerId(acceptedOffer),
          accepted_volunteer_name: getVolunteerName(acceptedOffer),
          updatedAt: acceptedAt,
          status_history: addStatusHistory(request, STATUSES.ACCEPTED, currentUser, 'Poster accepted volunteer'),
        } : request),
      }));
      notificationsService.notifyMitzvahAccepted({
        volunteerId: getVolunteerId(acceptedOffer),
        posterId: currentUser.id,
        posterName: currentUser.full_name,
        requestId,
        requestTitle: request.title,
      }).catch(() => {});
    },
    startTask: async (requestId) => {
      const request = state.mitzvah_requests.find((item) => item.id === requestId);
      const acceptedOffer = state.mitzvah_offers.find((item) => item.id === request?.acceptedOfferId);
      if (!request || getVolunteerId(acceptedOffer) !== currentUser.id) throw new Error('Only the accepted volunteer can start this task.');
      const startedAt = nowISO();
      setState((current) => ({
        ...current,
        mitzvah_requests: current.mitzvah_requests.map((request) => request.id === requestId ? {
          ...request,
          status: STATUSES.IN_PROGRESS,
          startedAt,
          updatedAt: startedAt,
          status_history: addStatusHistory(request, STATUSES.IN_PROGRESS, currentUser, 'Accepted volunteer started task'),
        } : request),
      }));
    },
    markCompleted: async (requestId) => {
      const existingRequest = state.mitzvah_requests.find((item) => item.id === requestId);
      const existingOffer = state.mitzvah_offers.find((item) => item.id === existingRequest?.acceptedOfferId);
      if (!existingRequest || getVolunteerId(existingOffer) !== currentUser.id) {
        throw new Error('Only the accepted volunteer can mark this complete.');
      }
      if (state.mitzvah_completions.some((item) => item.requestId === requestId && item.volunteer_id === currentUser.id)) {
        throw new Error('This task was already marked complete and is waiting for verification.');
      }
      const completionId = makeId('completion');
      const verificationRequestId = makeId('verification');
      setState((current) => {
        const request = current.mitzvah_requests.find((item) => item.id === requestId);
        const offer = current.mitzvah_offers.find((item) => item.id === request?.acceptedOfferId);
        if (!request || !offer) return current;
        if (current.mitzvah_completions.some((item) => item.requestId === requestId && item.volunteer_id === getVolunteerId(offer))) return current;

        const completedAt = nowISO();
        const completion = {
          id: completionId,
          requestId,
          offerId: offer.id,
          volunteer_id: getVolunteerId(offer),
          volunteer_name: getVolunteerName(offer),
          poster_id: getPosterId(request),
          poster_name: getPosterName(request),
          volunteerId: offer.volunteerId,
          volunteerName: offer.volunteerName,
          requesterId: request.postedById,
          requesterName: request.postedBy,
          hoursCompleted: Number(request.estimatedHours || 0),
          volunteerNotes: `Completed: ${request.title}`,
          requesterNotes: '',
          status: 'pending_verification',
          completedAt,
          createdAt: completedAt,
          updatedAt: completedAt,
          status_history: addStatusHistory({}, 'pending_verification', currentUser, 'Volunteer marked task complete'),
        };
        const verificationRequest = {
          id: verificationRequestId,
          completionId: completion.id,
          requestId,
          volunteer_id: getVolunteerId(offer),
          volunteer_name: getVolunteerName(offer),
          poster_id: getPosterId(request),
          poster_name: getPosterName(request),
          verifier_id: getPosterId(request),
          verifier_name: getPosterName(request),
          volunteerId: getVolunteerId(offer),
          volunteerName: getVolunteerName(offer),
          verifierId: getPosterId(request),
          verifierName: getPosterName(request),
          status: 'pending',
          message: `${getVolunteerName(offer)} marked "${request.title}" complete. Please verify so chesed hours can be logged.`,
          requestedAt: completedAt,
          createdAt: completedAt,
          updatedAt: completedAt,
          status_history: addStatusHistory({}, 'pending', currentUser, 'Verification requested from poster'),
        };

        return {
          ...current,
          mitzvah_completions: [completion, ...current.mitzvah_completions],
          verification_requests: [verificationRequest, ...current.verification_requests],
          mitzvah_requests: current.mitzvah_requests.map((requestItem) => requestItem.id === requestId ? {
            ...requestItem,
            status: STATUSES.PENDING,
            completedAt,
            completionId: completion.id,
            verificationRequestId: verificationRequest.id,
            updatedAt: completedAt,
            status_history: addStatusHistory(requestItem, STATUSES.PENDING, currentUser, 'Task completed and waiting for poster verification'),
          } : requestItem),
        };
      });
      notificationsService.notifyVerificationRequest({
        posterId: getPosterId(existingRequest),
        volunteerId: currentUser.id,
        volunteerName: currentUser.full_name,
        requestId,
        requestTitle: existingRequest.title,
        verificationRequestId,
      }).catch(() => {});
    },
    verifyCompletion: async (requestId) => {
      const existingRequest = state.mitzvah_requests.find((item) => item.id === requestId);
      const existingOffer = state.mitzvah_offers.find((item) => item.id === existingRequest?.acceptedOfferId);
      if (!existingRequest || getPosterId(existingRequest) !== currentUser.id) {
        throw new Error('Only the poster can verify completion.');
      }
      if (getVolunteerId(existingOffer) === currentUser.id) {
        throw new Error('A user cannot verify their own hours.');
      }
      if (state.chesed_hours_logs.some((log) => log.requestId === requestId || log.request_id === requestId)) {
        throw new Error('These hours were already logged.');
      }
      setState((current) => {
        const request = current.mitzvah_requests.find((item) => item.id === requestId);
        const offer = current.mitzvah_offers.find((item) => item.id === request?.acceptedOfferId);
        const completion = current.mitzvah_completions.find((item) => item.id === request?.completionId || item.requestId === requestId);
        const verificationRequest = current.verification_requests.find((item) => item.id === request?.verificationRequestId || item.completionId === completion?.id);
        if (!request || !offer || !completion || !verificationRequest) return current;
        if (getPosterId(request) !== currentUser.id || getVolunteerId(offer) === currentUser.id) return current;
        if (current.chesed_hours_logs.some((log) => log.completionId === completion.id || log.completion_id === completion.id)) return current;

        const verifiedAt = nowISO();

        const log = {
          id: makeId('log'),
          requestId: request.id,
          request_id: request.id,
          completionId: completion.id,
          completion_id: completion.id,
          verificationRequestId: verificationRequest.id,
          verification_request_id: verificationRequest.id,
          volunteer_id: getVolunteerId(offer),
          volunteer_name: getVolunteerName(offer),
          poster_id: getPosterId(request),
          poster_name: getPosterName(request),
          verifier_id: currentUser.id,
          verifier_name: currentUser.full_name,
          volunteerId: getVolunteerId(offer),
          volunteerName: getVolunteerName(offer),
          taskTitle: request.title,
          category: request.category,
          dateCompleted: todayISO(),
          hoursCompleted: Number(completion.hoursCompleted || request.estimatedHours || 0),
          verifierId: currentUser.id,
          verifierName: currentUser.full_name,
          verificationStatus: 'Verified',
          description: request.description,
          createdAt: verifiedAt,
          updatedAt: verifiedAt,
          status_history: addStatusHistory({}, 'verified', currentUser, 'Poster verified completion and hours were logged'),
        };

        return {
          ...current,
          chesed_hours_logs: [log, ...current.chesed_hours_logs],
          mitzvah_completions: current.mitzvah_completions.map((item) => item.id === completion.id ? {
            ...item,
            status: 'verified',
            verifier_id: currentUser.id,
            verifier_name: currentUser.full_name,
            verifiedAt,
            updatedAt: verifiedAt,
            status_history: addStatusHistory(item, 'verified', currentUser, 'Poster verified completion'),
          } : item),
          verification_requests: current.verification_requests.map((item) => item.id === verificationRequest.id ? {
            ...item,
            status: 'verified',
            verifier_id: currentUser.id,
            verifier_name: currentUser.full_name,
            respondedAt: verifiedAt,
            updatedAt: verifiedAt,
            status_history: addStatusHistory(item, 'verified', currentUser, 'Poster responded to verification request'),
          } : item),
          mitzvah_requests: current.mitzvah_requests.map((item) => item.id === requestId ? {
            ...item,
            status: STATUSES.VERIFIED,
            verifier_id: currentUser.id,
            verifier_name: currentUser.full_name,
            verifiedAt,
            updatedAt: verifiedAt,
            status_history: addStatusHistory(item, STATUSES.VERIFIED, currentUser, 'Poster verified task and created Chesed hours log'),
          } : item),
        };
      });
    },
  };

  const filteredRequests = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.mitzvah_requests.filter((request) => {
      const matchesQuery = !needle || [request.title, request.description, request.category, request.neighborhood, request.postedBy]
        .some((value) => String(value || '').toLowerCase().includes(needle));
      const matchesCategory = categoryFilter === 'All' || request.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [state.mitzvah_requests, query, categoryFilter]);

  const openRequests = filteredRequests.filter((request) => ![STATUSES.VERIFIED, STATUSES.CANCELLED].includes(request.status));
  const completedRequests = filteredRequests.filter((request) => [STATUSES.VERIFIED, STATUSES.CANCELLED].includes(request.status));
  const rideRequests = useMemo(() => {
    return openRequests
      .filter((request) => {
        const text = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
        return request.category === 'Transportation' || /ride|carpool|pickup|dropoff|drive|driver|seat|seats|appointment/.test(text);
      })
      .map((request) => ({
        ...request,
        locationLabel: request.neighborhood || request.locationLabel || 'Five Towns',
        pickup_window: request.pickup_window || 'Coordinate time',
      }));
  }, [openRequests]);
  const mapRequests = useMemo(() => openRequests.map((request, index) => {
    const coords = getRequestCoords(request, index);
    return {
      ...request,
      location_lat: coords.lat,
      location_lng: coords.lng,
      location_text: request.neighborhood || request.locationLabel || 'Five Towns',
      created_date: request.created_date || request.createdAt,
    };
  }), [openRequests]);
  const personalizedCommunityPoints = useMemo(() => {
    const joined = new Set(JOINED_COMMUNITY_IDS);
    return COMMUNITY_MAP_POINTS.filter((point) => joined.has(point.community_id));
  }, []);
  const selectedMapRequest = mapRequests.find((request) => request.id === selectedMapRequestId);
  const hubStats = useMemo(() => {
    return [
      { label: 'Joined circles', value: JOINED_COMMUNITY_IDS.length },
      { label: 'Hub pins', value: personalizedCommunityPoints.length + mapRequests.length },
      { label: 'Open needs', value: openRequests.length },
    ];
  }, [mapRequests.length, openRequests.length, personalizedCommunityPoints.length]);
  const myOffers = state.mitzvah_offers
    .filter((offer) => getVolunteerId(offer) === currentUser?.id)
    .map((offer) => ({ offer, request: state.mitzvah_requests.find((request) => request.id === offer.requestId) }))
    .filter((item) => item.request);
  const myPosted = filteredRequests.filter((request) => getPosterId(request) === currentUser?.id);
  const myLogs = state.chesed_hours_logs.filter((log) => (log.volunteer_id || log.volunteerId) === currentUser?.id);

  const totals = useMemo(() => {
    const verifiedHours = state.chesed_hours_logs
      .filter((log) => log.verificationStatus === 'Verified')
      .reduce((sum, log) => sum + Number(log.hoursCompleted || 0), 0);
    const openCount = state.mitzvah_requests.filter((request) => request.status === STATUSES.OPEN).length;
    const paidCount = state.mitzvah_requests.filter((request) => request.type === 'paid').length;
    return { verifiedHours, openCount, paidCount };
  }, [state]);

  const handleOffer = async (request) => {
    try {
      await backend.createOffer(request);
      toast.success('Offer sent to the poster.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAcceptPaid = async (request) => {
    try {
      await backend.acceptPaidTask(request);
      toast.success('Paid task accepted. Payment is still a placeholder.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAcceptOffer = async (requestId, offerId) => {
    try {
      await backend.acceptOffer(requestId, offerId);
      toast.success('Volunteer accepted. The task is ready to begin.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStart = async (requestId) => {
    try {
      await backend.startTask(requestId);
      toast.success('Task marked in progress.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleComplete = async (requestId) => {
    try {
      await backend.markCompleted(requestId);
      toast.success('Completion sent to the poster for verification.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerify = async (requestId) => {
    try {
      await backend.verifyCompletion(requestId);
      toast.success('Completion verified. Chesed hours were logged automatically.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateCarpool = async (type) => {
    const isOffer = type === 'offer';
    try {
      await backend.createRequest({
        title: isOffer ? 'Offering carpool seats' : 'Need a ride',
        description: isOffer
          ? 'Route:\nPickup window:\nSeats available:\nCar seats / bags:\nNotes:'
          : 'Pickup area:\nDestination:\nPickup window:\nRiders / bags:\nNotes:',
        category: 'Transportation',
        neighborhood: 'Five Towns',
        estimatedHours: 1,
        type: 'volunteer',
        amount: 0,
        urgency: 'Medium',
      });
      changeTab('carpool');
      toast.success(isOffer ? 'Carpool offer started.' : 'Ride request started.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const generateHelperText = ({ totalHours, verifiedHours, logs }) => {
    const categories = [...new Set(logs.map((log) => log.category))].slice(0, 4).join(', ') || 'community service';
    return {
      resumeBullet: `Completed ${verifiedHours} verified chesed hours supporting local community needs, including ${categories}.`,
      schoolDescription: `Assisted community members through verified volunteer service, including transportation, event support, errands, tutoring, and chesed-related tasks. Completed ${verifiedHours} verified hours serving local families and organizations through JUnited.`,
      formalSummary: `${currentUser.full_name} has recorded ${totalHours} total chesed hours, including ${verifiedHours} verified hours. Service areas include ${categories}. These entries were verified by the request posters or designated community members in the JUnited volunteer workflow.`,
    };
  };

  if (isLoadingUser || !currentUser) {
    return (
      <main className="app-page flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </main>
    );
  }

  const tabs = [
    { id: 'open', label: 'Help Requests' },
    { id: 'carpool', label: 'Carpool' },
    { id: 'map', label: 'Map' },
    { id: 'offers', label: 'My Offers' },
    { id: 'posted', label: 'My Posted Requests' },
    { id: 'log', label: 'My Log' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <main className="app-page mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="app-card overflow-hidden">
          <div className="relative p-4 sm:p-5">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[48px] bg-blue-50" />
          <div className="relative">
              <p className="mb-2 flex items-center gap-2 text-[12px] font-black uppercase text-blue-600">
                <HandHeart className="h-4 w-4" />
                Five Towns chesed network
                <StatusBadge>Demo Only</StatusBadge>
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">Mitzvah / Chesed Hub</h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                    The Five Towns layer for rides, chesed, errands, events, lost and found, shul help, and verified service, connected back to the communities people join.
                  </p>
                </div>
                <button onClick={() => setShowCreate(true)} className="app-button-primary h-11">
                  <Plus className="h-4 w-4" />
                  Post Request
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Metric icon={HandHeart} label="Open" value={totals.openCount} tone="blue" />
                <Metric icon={HandCoins} label="Paid" value={totals.paidCount} tone="amber" />
                <Metric icon={Award} label="Verified hrs" value={totals.verifiedHours} tone="emerald" />
              </div>
            </div>
          </div>
        </div>

        <FeatureStatusNotice className="mt-3" title="Demo Only">
          This now follows the real table flow: mitzvah_requests, mitzvah_offers, mitzvah_completions, verification_requests, and chesed_hours_logs. No payment is processed, and this browser demo is not permanently saved to Supabase yet.
        </FeatureStatusNotice>

        <div className="sticky top-0 z-20 -mx-3 mt-3 bg-[#F6F8FB]/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
          <div className="app-card mobile-scroll-x flex gap-2 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-black transition ${
                  activeTab === tab.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {(activeTab === 'open' || activeTab === 'posted' || activeTab === 'map') && (
          <div className="app-card mb-3 grid gap-2 p-3 sm:grid-cols-[1fr_220px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests" className="app-input h-11 pl-10 pr-3 text-sm" />
            </label>
            <label className="relative">
              <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="app-input h-11 pl-10 pr-3 text-sm font-black">
                <option>All</option>
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
          </div>
        )}

        <div className="space-y-3">
          {activeTab === 'open' && (
            openRequests.length ? openRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                offers={state.mitzvah_offers}
                completions={state.mitzvah_completions}
                verificationRequests={state.verification_requests}
                currentUser={currentUser}
                onOffer={handleOffer}
                onAcceptPaid={handleAcceptPaid}
                onAcceptOffer={handleAcceptOffer}
                onStart={handleStart}
                onComplete={handleComplete}
                onVerify={handleVerify}
              />
            )) : <EmptyState title="No open requests match this view" text="Try clearing filters or post a new request." />
          )}

          {activeTab === 'carpool' && (
            <CarpoolBoard
              rideRequests={rideRequests}
              signupsByRequest={{}}
              onCreateRide={handleCreateCarpool}
              onSelectRide={(request) => setSelectedMapRequestId(request.id)}
              onClaimRide={(event, request) => handleOffer(request)}
              isClaiming={false}
            />
          )}

          {activeTab === 'map' && (
            <div className="space-y-3">
              <div className="app-card overflow-hidden">
                <div className="border-b border-slate-100 bg-white p-4">
                  <p className="text-[12px] font-black uppercase tracking-wide text-blue-600">Five Towns hub map</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Everything local, filtered to your communities.</h2>
                  <p className="mt-1 text-[13px] font-medium leading-6 text-slate-600">
                    See shuls, kosher food, events, lost and found, rides, chesed needs, and posts from the communities you joined, all in one map.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {hubStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-lg font-black text-slate-950">{stat.value}</p>
                      <p className="text-[10px] font-black uppercase leading-4 text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mobile-scroll-x flex gap-2 border-t border-slate-100 p-3">
                  {['Lawrence', 'Cedarhurst', 'Woodmere', 'Hewlett', 'Inwood'].map((town) => (
                    <span key={town} className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">
                      {town}
                    </span>
                  ))}
                </div>
              </div>
              <div className="app-card overflow-hidden p-2">
                <MitzvahMap
                  requests={mapRequests}
                  userLocation={null}
                  communityPoints={personalizedCommunityPoints}
                  personalized
                  onSelectRequest={(request) => setSelectedMapRequestId(request.id)}
                />
              </div>
              {selectedMapRequest ? (
                <RequestCard
                  request={selectedMapRequest}
                  offers={state.mitzvah_offers}
                  completions={state.mitzvah_completions}
                  verificationRequests={state.verification_requests}
                  currentUser={currentUser}
                  onOffer={handleOffer}
                  onAcceptPaid={handleAcceptPaid}
                  onAcceptOffer={handleAcceptOffer}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onVerify={handleVerify}
                />
              ) : (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[13px] font-semibold text-blue-900">
                  Tap a map pin to preview the request and offer help.
                </div>
              )}
            </div>
          )}

          {activeTab === 'offers' && (
            myOffers.length ? myOffers.map(({ request, offer }) => (
              <div key={offer.id} className="space-y-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[12px] font-black uppercase text-blue-700">Your offer: {offer.status.replace('_', ' ')}</p>
                  <p className="mt-1 text-[13px] font-medium text-blue-900">{offer.note}</p>
                </div>
                <RequestCard
                  request={request}
                  offers={state.mitzvah_offers}
                  completions={state.mitzvah_completions}
                  verificationRequests={state.verification_requests}
                  currentUser={currentUser}
                  onOffer={handleOffer}
                  onAcceptPaid={handleAcceptPaid}
                  onAcceptOffer={handleAcceptOffer}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onVerify={handleVerify}
                />
              </div>
            )) : <EmptyState title="No offers yet" text="Offer to help on an open request and it will show here." />
          )}

          {activeTab === 'posted' && (
            myPosted.length ? myPosted.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                offers={state.mitzvah_offers}
                completions={state.mitzvah_completions}
                verificationRequests={state.verification_requests}
                currentUser={currentUser}
                onOffer={handleOffer}
                onAcceptPaid={handleAcceptPaid}
                onAcceptOffer={handleAcceptOffer}
                onStart={handleStart}
                onComplete={handleComplete}
                onVerify={handleVerify}
              />
            )) : <EmptyState title="You have not posted requests yet" text="Create a volunteer or paid request when you need help." />
          )}

          {activeTab === 'log' && (
            <ChesedHoursDashboard logs={myLogs} onGenerateText={generateHelperText} />
          )}

          {activeTab === 'completed' && (
            completedRequests.length ? completedRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                offers={state.mitzvah_offers}
                completions={state.mitzvah_completions}
                verificationRequests={state.verification_requests}
                currentUser={currentUser}
                onOffer={handleOffer}
                onAcceptPaid={handleAcceptPaid}
                onAcceptOffer={handleAcceptOffer}
                onStart={handleStart}
                onComplete={handleComplete}
                onVerify={handleVerify}
              />
            )) : <EmptyState title="No completed mitzvahs yet" text="Verified or cancelled requests will show here." />
          )}
        </div>
      </section>

      <CreateRequestModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (payload) => {
          await backend.createRequest(payload);
          setShowCreate(false);
          changeTab('posted');
          toast.success('Request posted.');
        }}
      />
    </main>
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
