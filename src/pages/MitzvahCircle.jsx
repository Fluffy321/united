import React, { useEffect, useMemo, useState } from 'react';
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
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import FeatureStatusNotice, { StatusBadge } from '@/components/common/FeatureStatusNotice';

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
  OFFERED: 'Volunteer Offered',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  PENDING: 'Completed Pending Verification',
  VERIFIED: 'Verified Completed',
  CANCELLED: 'Cancelled',
};

const CURRENT_USER_ID = 'local-demo';

const initialState = {
  requests: [
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
  offers: [
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
  chesedLogs: [
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

const readState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialState;
  } catch {
    return initialState;
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(0)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

function RequestCard({ request, offers, currentUser, onOffer, onAcceptPaid, onAcceptOffer, onStart, onComplete, onVerify }) {
  const isPoster = request.postedById === currentUser.id;
  const acceptedOffer = offers.find((offer) => offer.id === request.acceptedOfferId);
  const myOffer = offers.find((offer) => offer.requestId === request.id && offer.volunteerId === currentUser.id);
  const canOffer = !isPoster && request.status === STATUSES.OPEN && !myOffer;
  const canAcceptPaid = canOffer && request.type === 'paid';
  const canStart = acceptedOffer?.volunteerId === currentUser.id && request.status === STATUSES.ACCEPTED;
  const canComplete = acceptedOffer?.volunteerId === currentUser.id && request.status === STATUSES.IN_PROGRESS;
  const canVerify = isPoster && request.status === STATUSES.PENDING;
  const pendingOffers = offers.filter((offer) => offer.requestId === request.id && offer.status === 'offered');

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2"><Users className="h-3.5 w-3.5" />{request.postedBy}</div>
      </div>

      {request.type === 'paid' && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[12px] font-bold leading-5 text-amber-900">
            Payment placeholder: this task is structured for future in-app payment. Stripe can later create a checkout or escrow flow from this request id.
            No money is processed in this demo.
          </p>
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
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-black text-white active:scale-[0.98]"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canOffer && (
          <button onClick={() => onOffer(request)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[13px] font-black text-white active:scale-[0.98]">
            <HandHeart className="h-4 w-4" />
            Offer to Help
          </button>
        )}
        {canAcceptPaid && (
          <button onClick={() => onAcceptPaid(request)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-4 text-[13px] font-black text-white active:scale-[0.98]">
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
          <button onClick={() => onStart(request.id)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-[13px] font-black text-white active:scale-[0.98]">
            <UserCheck className="h-4 w-4" />
            Start Task
          </button>
        )}
        {canComplete && (
          <button onClick={() => onComplete(request.id)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-purple-600 px-4 text-[13px] font-black text-white active:scale-[0.98]">
            <CheckCircle2 className="h-4 w-4" />
            Mark Completed
          </button>
        )}
        {canVerify && (
          <button onClick={() => onVerify(request.id)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-[13px] font-black text-white active:scale-[0.98]">
            <ShieldCheck className="h-4 w-4" />
            Verify Completion (Demo)
          </button>
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
  const [currentUser, setCurrentUser] = useState(null);
  const [state, setState] = useState(readState);
  const [activeTab, setActiveTab] = useState('open');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    base44.auth.me()
      .then((user) => setCurrentUser({
        id: CURRENT_USER_ID,
        full_name: user.display_name || user.full_name || 'Demo',
      }))
      .catch(() => setCurrentUser({ id: CURRENT_USER_ID, full_name: 'Demo' }))
      .finally(() => setIsLoadingUser(false));
  }, []);

  const backend = {
    createRequest: async (payload) => {
      const request = {
        ...payload,
        id: makeId('req'),
        postedById: currentUser.id,
        postedBy: currentUser.full_name,
        amount: payload.type === 'paid' ? Number(payload.amount || 0) : 0,
        status: STATUSES.OPEN,
        createdAt: new Date().toISOString(),
      };
      setState((current) => ({ ...current, requests: [request, ...current.requests] }));
      return request;
    },
    createOffer: async (request, note = 'I am available to help with this request.') => {
      const offer = {
        id: makeId('offer'),
        requestId: request.id,
        volunteerId: currentUser.id,
        volunteerName: currentUser.full_name,
        note,
        status: 'offered',
        createdAt: new Date().toISOString(),
      };
      setState((current) => ({
        ...current,
        offers: [offer, ...current.offers],
        requests: current.requests.map((item) => item.id === request.id ? { ...item, status: STATUSES.OFFERED } : item),
      }));
      return offer;
    },
    acceptPaidTask: async (request) => {
      const offer = {
        id: makeId('offer'),
        requestId: request.id,
        volunteerId: currentUser.id,
        volunteerName: currentUser.full_name,
        note: `Accepted paid task. Payment placeholder amount: ${formatMoney(request.amount)}.`,
        status: 'accepted',
        createdAt: new Date().toISOString(),
      };
      setState((current) => ({
        ...current,
        offers: [offer, ...current.offers],
        requests: current.requests.map((item) => item.id === request.id ? { ...item, status: STATUSES.ACCEPTED, acceptedOfferId: offer.id } : item),
      }));
      return offer;
    },
    acceptOffer: async (requestId, offerId) => {
      setState((current) => ({
        ...current,
        offers: current.offers.map((offer) => offer.requestId === requestId ? { ...offer, status: offer.id === offerId ? 'accepted' : 'not_selected' } : offer),
        requests: current.requests.map((request) => request.id === requestId ? { ...request, status: STATUSES.ACCEPTED, acceptedOfferId: offerId } : request),
      }));
    },
    startTask: async (requestId) => {
      setState((current) => ({
        ...current,
        requests: current.requests.map((request) => request.id === requestId ? { ...request, status: STATUSES.IN_PROGRESS } : request),
      }));
    },
    markCompleted: async (requestId) => {
      setState((current) => ({
        ...current,
        requests: current.requests.map((request) => request.id === requestId ? { ...request, status: STATUSES.PENDING, completedAt: new Date().toISOString() } : request),
      }));
    },
    verifyCompletion: async (requestId) => {
      setState((current) => {
        const request = current.requests.find((item) => item.id === requestId);
        const offer = current.offers.find((item) => item.id === request?.acceptedOfferId);
        if (!request || !offer) return current;

        const log = {
          id: makeId('log'),
          volunteerId: offer.volunteerId,
          volunteerName: offer.volunteerName,
          taskTitle: request.title,
          category: request.category,
          dateCompleted: todayISO(),
          hoursCompleted: Number(request.estimatedHours || 0),
          verifierName: currentUser.full_name,
          verificationStatus: 'Verified',
          description: request.description,
          requestId: request.id,
          createdAt: new Date().toISOString(),
        };

        return {
          ...current,
          chesedLogs: [log, ...current.chesedLogs],
          requests: current.requests.map((item) => item.id === requestId ? { ...item, status: STATUSES.VERIFIED, verifiedAt: new Date().toISOString() } : item),
        };
      });
    },
  };

  const filteredRequests = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.requests.filter((request) => {
      const matchesQuery = !needle || [request.title, request.description, request.category, request.neighborhood, request.postedBy]
        .some((value) => String(value || '').toLowerCase().includes(needle));
      const matchesCategory = categoryFilter === 'All' || request.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [state.requests, query, categoryFilter]);

  const openRequests = filteredRequests.filter((request) => ![STATUSES.VERIFIED, STATUSES.CANCELLED].includes(request.status));
  const myOffers = state.offers
    .filter((offer) => offer.volunteerId === currentUser?.id)
    .map((offer) => ({ offer, request: state.requests.find((request) => request.id === offer.requestId) }))
    .filter((item) => item.request);
  const myPosted = filteredRequests.filter((request) => request.postedById === currentUser?.id);
  const myLogs = state.chesedLogs.filter((log) => log.volunteerId === currentUser?.id);

  const totals = useMemo(() => {
    const verifiedHours = state.chesedLogs
      .filter((log) => log.verificationStatus === 'Verified')
      .reduce((sum, log) => sum + Number(log.hoursCompleted || 0), 0);
    const openCount = state.requests.filter((request) => request.status === STATUSES.OPEN).length;
    const paidCount = state.requests.filter((request) => request.type === 'paid').length;
    return { verifiedHours, openCount, paidCount };
  }, [state]);

  const handleOffer = async (request) => {
    await backend.createOffer(request);
    toast.success('Offer sent to the poster.');
  };

  const handleAcceptPaid = async (request) => {
    await backend.acceptPaidTask(request);
    toast.success('Paid task accepted. Payment is still a placeholder.');
  };

  const handleAcceptOffer = async (requestId, offerId) => {
    await backend.acceptOffer(requestId, offerId);
    toast.success('Volunteer accepted. The task is ready to begin.');
  };

  const handleStart = async (requestId) => {
    await backend.startTask(requestId);
    toast.success('Task marked in progress.');
  };

  const handleComplete = async (requestId) => {
    await backend.markCompleted(requestId);
    toast.success('Completion sent to the poster for verification.');
  };

  const handleVerify = async (requestId) => {
    await backend.verifyCompletion(requestId);
    toast.success('Completion verified. Chesed hours were logged automatically.');
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
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#F6F8FB]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </main>
    );
  }

  const tabs = [
    { id: 'open', label: 'Open Requests' },
    { id: 'offers', label: 'My Offers' },
    { id: 'posted', label: 'My Posted Requests' },
    { id: 'hours', label: 'Chesed Hours' },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#F6F8FB] mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative p-4 sm:p-5">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[48px] bg-blue-50" />
          <div className="relative">
              <p className="mb-2 flex items-center gap-2 text-[12px] font-black uppercase text-blue-600">
                <HandHeart className="h-4 w-4" />
                Community help marketplace
                <StatusBadge>Demo Only</StatusBadge>
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">Mitzvah / Chesed Help</h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                    Post requests, offer help, accept paid tasks, verify completion, and turn verified service into chesed hours reports. This page is currently a demo and saves data in this browser.
                  </p>
                </div>
                <button onClick={() => setShowCreate(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm active:scale-[0.98]">
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
          Requests, offers, paid task acceptance, verification, exports, and Chesed hours on this page are mock data for now. No payment is processed and these records are not permanently saved to Supabase yet.
        </FeatureStatusNotice>

        <div className="sticky top-0 z-20 -mx-3 mt-3 bg-[#F6F8FB]/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
          <div className="mobile-scroll-x flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-black transition ${
                  activeTab === tab.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {(activeTab === 'open' || activeTab === 'posted') && (
          <div className="mb-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_220px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="relative">
              <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-black text-slate-700 outline-none">
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
                offers={state.offers}
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

          {activeTab === 'offers' && (
            myOffers.length ? myOffers.map(({ request, offer }) => (
              <div key={offer.id} className="space-y-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[12px] font-black uppercase text-blue-700">Your offer: {offer.status.replace('_', ' ')}</p>
                  <p className="mt-1 text-[13px] font-medium text-blue-900">{offer.note}</p>
                </div>
                <RequestCard
                  request={request}
                  offers={state.offers}
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
                offers={state.offers}
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

          {activeTab === 'hours' && (
            <ChesedHoursDashboard logs={myLogs} onGenerateText={generateHelperText} />
          )}
        </div>
      </section>

      <CreateRequestModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (payload) => {
          await backend.createRequest(payload);
          setShowCreate(false);
          setActiveTab('posted');
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
