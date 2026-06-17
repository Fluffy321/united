import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const shuls = [
  {
    id: 'young-israel-woodmere',
    name: 'Young Israel of Woodmere',
    address: '859 Peninsula Blvd, Woodmere',
    neighborhood: 'Woodmere',
    nusach: 'Ashkenaz',
    tags: ['Young Israel', 'Ashkenaz', 'Family'],
    distance: '0.7 mi',
    minyanim: { shacharis: '6:30, 7:30, 8:30', mincha: '7:55 PM', maariv: '9:15, 10:00 PM' },
    about: 'Large central shul with daily minyanim, youth programming, shiurim, and active community announcements.',
    events: [],
  },
  {
    id: 'young-israel-lawrence-cedarhurst',
    name: 'Young Israel of Lawrence-Cedarhurst',
    address: '8 Spruce St, Cedarhurst',
    neighborhood: 'Cedarhurst',
    nusach: 'Ashkenaz',
    tags: ['Young Israel', 'Ashkenaz', 'Central Ave'],
    distance: '1.1 mi',
    minyanim: { shacharis: '6:20, 7:15, 8:15', mincha: '7:50 PM', maariv: '9:05, 10:05 PM' },
    about: 'Central Cedarhurst shul with steady weekday minyanim, shiurim, and local events.',
    events: [],
  },
  {
    id: 'chabad-five-towns',
    name: 'Chabad of the Five Towns',
    address: '74 Maple Ave, Cedarhurst',
    neighborhood: 'Cedarhurst',
    nusach: 'Chabad',
    tags: ['Chabad', 'Outreach', 'Classes'],
    distance: '1.3 mi',
    minyanim: { shacharis: '7:00, 8:00', mincha: '7:45 PM', maariv: '9:00 PM' },
    about: 'Chabad center for minyanim, Torah classes, holiday programs, and community support.',
    events: [],
  },
  {
    id: 'congregation-beth-sholom',
    name: 'Congregation Beth Sholom',
    address: '390 Broadway, Lawrence',
    neighborhood: 'Lawrence',
    nusach: 'Ashkenaz',
    tags: ['Ashkenaz', 'Learning', 'Youth'],
    distance: '1.5 mi',
    minyanim: { shacharis: '6:40, 7:45', mincha: '7:55 PM', maariv: '9:20 PM' },
    about: 'Lawrence shul with regular tefillah, learning, youth programming, and community events.',
    events: [],
  },
  {
    id: 'sephardic-temple',
    name: 'Sephardic Temple',
    address: '775 Branch Blvd, Cedarhurst',
    neighborhood: 'Cedarhurst',
    nusach: 'Sephardic',
    tags: ['Sephardic', 'Community', 'Learning'],
    distance: '1.8 mi',
    minyanim: { shacharis: '6:45, 8:00', mincha: '7:40 PM', maariv: '9:10 PM' },
    about: 'Sephardic community shul with minyanim, Torah learning, and family programming.',
    events: [],
  },
  {
    id: 'congregation-ohr-torah',
    name: 'Congregation Ohr Torah',
    address: '410 Hungry Harbor Rd, North Woodmere',
    neighborhood: 'North Woodmere',
    nusach: 'Ashkenaz',
    tags: ['Ashkenaz', 'North Woodmere', 'Daily Minyan'],
    distance: '2.3 mi',
    minyanim: { shacharis: '6:35, 7:40', mincha: '7:50 PM', maariv: '9:15 PM' },
    about: 'North Woodmere congregation with daily minyanim and neighborhood programming.',
    events: [],
  },
  {
    id: 'inwood-shul',
    name: 'Inwood Shul',
    address: '143 Doughty Blvd, Inwood',
    neighborhood: 'Inwood',
    nusach: 'Ashkenaz',
    tags: ['Inwood', 'Ashkenaz', 'Local'],
    distance: '2.8 mi',
    minyanim: { shacharis: '6:45, 8:00', mincha: '7:35 PM', maariv: '9:05 PM' },
    about: 'Inwood community minyan hub with weekday tefillah and neighborhood announcements.',
    events: [],
  },
];

const initialMinyanim = [
  {
    id: 'minyan-1',
    shulId: 'young-israel-woodmere',
    tefillah: 'Mincha',
    time: '7:55 PM',
    startsIn: 'in 15 min',
    needed: 2,
    coming: 8,
    note: 'Main shul. Organizer wants a clear count before zman.',
    urgency: 'Need 2 more',
  },
  {
    id: 'minyan-2',
    shulId: 'inwood-shul',
    tefillah: 'Maariv',
    time: '9:05 PM',
    startsIn: 'in 1 hr',
    needed: 3,
    coming: 7,
    note: 'Inwood board posted a soft count request.',
    urgency: 'Need 3 more',
  },
  {
    id: 'minyan-3',
    shulId: 'chabad-five-towns',
    tefillah: 'Shacharis',
    time: '8:00 AM',
    startsIn: 'tomorrow',
    needed: 0,
    coming: 14,
    note: 'Steady minyan, tap if you plan to come.',
    urgency: 'Healthy count',
  },
];

const initialRequests = [];
const happenings = [];

const requestTypes = ['Need people for minyan', 'Looking for ride to shul', 'Hosting guests', 'Lost item at shul'];
const HAS_VERIFIED_MINYAN_DATA = false;

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getShul(id) {
  return shuls.find((shul) => shul.id === id) || shuls[0];
}

function Stat({ value, label, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };
  return (
    <div className={classNames('rounded-2xl border px-3 py-2', tones[tone])}>
      <p className="text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}

function MinyanNowCard({ minyan, joined, onJoin, onOpenShul, onOpenMap }) {
  const shul = getShul(minyan.shulId);
  const count = minyan.coming + (joined ? 1 : 0);
  const stillNeeded = Math.max(0, minyan.needed - (joined ? 1 : 0));

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={classNames(
          'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-center',
          stillNeeded > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        )}>
          <span className="text-lg font-black leading-none">{stillNeeded > 0 ? stillNeeded : count}</span>
          <span className="text-[9px] font-black uppercase">{stillNeeded > 0 ? 'need' : 'coming'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-slate-950">{minyan.tefillah}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600">{minyan.time}</span>
            <span className={classNames(
              'rounded-full px-2 py-0.5 text-[11px] font-black',
              stillNeeded > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            )}>
              {minyan.startsIn}
            </span>
          </div>
          <button onClick={() => onOpenShul(shul)} className="mt-1 block truncate text-left text-sm font-bold text-blue-700">
            {shul.name}
          </button>
          <p className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-5 text-slate-500">{minyan.note}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onJoin(minyan.id)}
          className={classNames(
            'motion-press flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-black',
            joined ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          {joined ? 'You are coming' : "I'm coming"}
        </button>
        <button onClick={() => onOpenMap(shul)} className="motion-press flex h-10 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Navigation className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function ShulCard({ shul, onOpen, onOpenMap, showMinyanTimes = false }) {
  return (
    <article className="w-full max-w-full min-w-0 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <button onClick={() => onOpen(shul)} className="min-w-0 flex-1 text-left">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-[15px] font-black text-slate-950">{shul.name}</h3>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{shul.nusach}</span>
          </div>
          <p className="mt-1 flex min-w-0 items-start gap-1 text-[13px] font-semibold leading-5 text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 break-words">{shul.address}</span>
          </p>
        </button>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{shul.distance}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {shul.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-black text-slate-600">{tag}</span>
        ))}
      </div>

      {showMinyanTimes && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <TimeBox label="Shacharis" value={shul.minyanim.shacharis} />
          <TimeBox label="Mincha" value={shul.minyanim.mincha} />
          <TimeBox label="Maariv" value={shul.minyanim.maariv} />
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <button onClick={() => onOpen(shul)} className="motion-press h-9 flex-1 rounded-2xl bg-slate-950 text-sm font-black text-white">
          Open shul
        </button>
        <button onClick={() => onOpenMap(shul)} className="motion-press h-9 rounded-2xl bg-blue-50 px-3 text-sm font-black text-blue-700">
          Map
        </button>
      </div>
    </article>
  );
}

function TimeBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-2.5 py-2">
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-[12px] font-black leading-4 text-slate-800">{value}</p>
    </div>
  );
}

function HappeningCard({ item }) {
  const Icon = item.icon;
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-600">{item.kind} - {item.time}</p>
          <p className="mt-1 text-sm font-black text-slate-950">{item.title}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{item.place}</p>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request }) {
  const Icon = request.icon || MessageCircle;
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase text-amber-700">{request.type}</p>
          <h3 className="mt-1 text-sm font-black text-slate-950">{request.title}</h3>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{request.shul} - {request.meta}</p>
        </div>
        <button className="motion-press rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600">
          Reply
        </button>
      </div>
    </article>
  );
}

function PostRequestModal({ onClose, onPost }) {
  const [type, setType] = React.useState(requestTypes[0]);
  const [title, setTitle] = React.useState('');
  const [shul, setShul] = React.useState(shuls[0].name);
  const [time, setTime] = React.useState('Tonight');

  const submit = () => {
    if (!title.trim()) {
      toast.error('Add a short request first.');
      return;
    }
    onPost({ type, title: title.trim(), shul, meta: time });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-4">
      <div className="w-full rounded-t-[28px] bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-[28px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">Post shul request</h2>
          <button onClick={onClose} className="app-icon-button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[12px] font-black text-slate-500">Request type</span>
            <select value={type} onChange={(event) => setType(event.target.value)} className="app-input mt-1 h-11 text-sm font-bold">
              {requestTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-black text-slate-500">What do you need?</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Need 2 more for Maariv" className="app-input mt-1 h-11 text-sm" />
          </label>
          <label className="block">
            <span className="text-[12px] font-black text-slate-500">Shul</span>
            <select value={shul} onChange={(event) => setShul(event.target.value)} className="app-input mt-1 h-11 text-sm font-bold">
              {shuls.map((item) => <option key={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-black text-slate-500">When</span>
            <input value={time} onChange={(event) => setTime(event.target.value)} placeholder="Tonight, Mincha, Shabbos morning..." className="app-input mt-1 h-11 text-sm" />
          </label>
        </div>

        <button onClick={submit} className="motion-press mt-4 h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
          Post to Shuls & Minyan Board
        </button>
      </div>
    </div>
  );
}

function ShulProfileSheet({ shul, onClose, onOpenMap, onFollow, showMinyanTimes = false }) {
  if (!shul) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-4">
      <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[30px] bg-white shadow-2xl sm:max-w-xl sm:rounded-[30px]">
        <div className="bg-gradient-to-br from-blue-700 to-slate-950 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wide">
                <Building2 className="h-3.5 w-3.5" />
                Shul profile
              </div>
              <h2 className="mt-3 text-2xl font-black leading-7">{shul.name}</h2>
              <p className="mt-2 text-sm font-semibold text-white/80">{shul.address}</p>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {shul.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black">{tag}</span>
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4">
          {showMinyanTimes && (
            <div className="grid grid-cols-3 gap-2">
              <TimeBox label="Shacharis" value={shul.minyanim.shacharis} />
              <TimeBox label="Mincha" value={shul.minyanim.mincha} />
              <TimeBox label="Maariv" value={shul.minyanim.maariv} />
            </div>
          )}

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-black text-slate-950">About</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{shul.about}</p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-black text-slate-950">Events and recent posts</h3>
            {shul.events.length > 0 ? (
            <div className="space-y-2">
              {shul.events.map((event) => (
                <div key={event} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                  {event}
                </div>
              ))}
            </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-500">
                Verified shul updates will appear here when they are available.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onFollow(shul)} className="motion-press h-11 rounded-2xl bg-blue-600 text-sm font-black text-white">
              Join / follow
            </button>
            <button onClick={() => onOpenMap(shul)} className="motion-press h-11 rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
              Open map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShulMinyanBoard({ currentUser }) {
  const navigate = useNavigate();
  const [joinedMinyanim, setJoinedMinyanim] = React.useState(new Set());
  const [selectedShul, setSelectedShul] = React.useState(null);
  const [showPostRequest, setShowPostRequest] = React.useState(false);
  const [requests, setRequests] = React.useState(initialRequests);
  const [query, setQuery] = React.useState('');

  const filteredShuls = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return shuls;
    return shuls.filter((shul) =>
      [shul.name, shul.address, shul.neighborhood, shul.nusach, ...shul.tags]
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [query]);

  const joinMinyan = (minyanId) => {
    setJoinedMinyanim((current) => {
      const next = new Set(current);
      if (next.has(minyanId)) next.delete(minyanId);
      else next.add(minyanId);
      return next;
    });
    toast.success('Minyan count updated.');
  };

  const openMap = (shul) => {
    navigate(`/Map?category=shuls&place=${encodeURIComponent(shul.name)}`);
  };

  const postRequest = (request) => {
    const icon = request.type.includes('ride') ? Car : request.type.includes('Lost') ? Search : Users;
    setRequests((current) => [
      {
        id: `req-${Date.now()}`,
        ...request,
        icon,
      },
      ...current,
    ]);
    setShowPostRequest(false);
    toast.success('Posted to the Shuls & Minyan Board.');
  };

  const followShul = (shul) => {
    toast.success(`Following ${shul.name}.`);
  };

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-sm">
        <div className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Shul directory
              </div>
              <h2 className="mt-2 text-[20px] font-black leading-6 text-slate-950">Shuls & Minyan</h2>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-500">
                Find local shuls, open the map, or post a quick shul request.
              </p>
            </div>
            <button onClick={() => setShowPostRequest(true)} className="motion-press flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              Post
            </button>
          </div>

          <div className={`mt-3 grid gap-2 ${requests.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Stat value={shuls.length} label="Shuls" tone="emerald" />
            {requests.length > 0 && <Stat value={requests.length} label="Requests" tone="amber" />}
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-2.5 shadow-sm">
        <label className="flex h-11 items-center gap-2 rounded-2xl bg-slate-50 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shuls, nusach, neighborhoods..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      {HAS_VERIFIED_MINYAN_DATA && (
        <section className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-black text-slate-950">Minyan Now</h3>
              <p className="text-[12px] font-semibold text-slate-500">Fastest things to act on.</p>
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700">Live counts</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {initialMinyanim.map((minyan) => (
              <MinyanNowCard
                key={minyan.id}
                minyan={minyan}
                joined={joinedMinyanim.has(minyan.id)}
                onJoin={joinMinyan}
                onOpenShul={setSelectedShul}
                onOpenMap={openMap}
              />
            ))}
          </div>
        </section>
      )}

      <section className="min-w-0 overflow-hidden rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-black text-slate-950">Nearby Shuls</h3>
            <p className="text-[12px] font-semibold text-slate-500">Directory, distance, nusach, and map access.</p>
          </div>
          <button onClick={() => navigate('/Map?category=shuls')} className="motion-press rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-black text-blue-700">
            Map pins
          </button>
        </div>
        <div className="grid min-w-0 gap-2 lg:grid-cols-2">
          {filteredShuls.map((shul) => (
            <ShulCard
              key={shul.id}
              shul={shul}
              onOpen={setSelectedShul}
              onOpenMap={openMap}
              showMinyanTimes={HAS_VERIFIED_MINYAN_DATA}
            />
          ))}
        </div>
      </section>

      {(happenings.length > 0 || requests.length > 0) && (
        <section className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          {happenings.length > 0 && (
            <div className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2">
                <h3 className="text-[15px] font-black text-slate-950">What’s Happening</h3>
                <p className="text-[12px] font-semibold text-slate-500">Shiurim, speakers, kiddush, learning nights.</p>
              </div>
              <div className="space-y-2">
                {happenings.map((item) => <HappeningCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {requests.length > 0 && (
            <div className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-black text-slate-950">Requests</h3>
                  <p className="text-[12px] font-semibold text-slate-500">Minyan help, rides, hosting, and lost items.</p>
                </div>
                <button onClick={() => setShowPostRequest(true)} className="motion-press rounded-full bg-slate-950 px-3 py-1.5 text-[12px] font-black text-white">
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {requests.map((request) => <RequestCard key={request.id} request={request} />)}
              </div>
            </div>
          )}
        </section>
      )}

      {requests.length === 0 && (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
          <h3 className="text-[13px] font-black text-slate-950">Need minyan help or a shul ride?</h3>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">
            Post one clear shul request so the right neighbor knows how to help.
          </p>
          <button onClick={() => setShowPostRequest(true)} className="motion-press mt-3 rounded-full bg-slate-950 px-4 py-2 text-[12px] font-black text-white">
            Post request
          </button>
        </div>
      )}

      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-3 py-2.5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-black text-slate-950">Connected to JUnited</h3>
            <p className="mt-0.5 text-[12px] font-semibold leading-5 text-slate-600">
              Urgent minyan requests can surface in Feed, and shul pins open on the Map.
            </p>
          </div>
        </div>
      </div>

      {selectedShul && (
        <ShulProfileSheet
          shul={selectedShul}
          onClose={() => setSelectedShul(null)}
          onOpenMap={openMap}
          onFollow={followShul}
          showMinyanTimes={HAS_VERIFIED_MINYAN_DATA}
        />
      )}

      {showPostRequest && (
        <PostRequestModal
          onClose={() => setShowPostRequest(false)}
          onPost={postRequest}
          currentUser={currentUser}
        />
      )}
    </section>
  );
}
