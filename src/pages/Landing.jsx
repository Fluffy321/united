import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  HandHeart,
  MapPin,
  MessageCircle,
  Navigation,
  Radio,
  Search,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const TOWNS = ['Lawrence', 'Cedarhurst', 'Woodmere', 'Hewlett', 'Inwood'];

const LIVE_ITEMS = [
  { label: 'Mincha in 18 min', meta: 'Need 2 more near Central Ave', tone: 'red' },
  { label: 'Ride offered to Woodmere', meta: '3 seats open until 5:30', tone: 'blue' },
  { label: 'Extra challah available', meta: 'Free pickup before Shabbos', tone: 'green' },
];

const DIFFERENTIATORS = [
  'One local feed instead of 40 disappearing chats',
  'Map, shuls, events, businesses, and needs are connected',
  'Posts stay searchable so people can find answers later',
  'Trust signals show who posted, where it belongs, and what needs review',
];

const USE_CASES = [
  {
    icon: MessageCircle,
    title: 'Talk to neighbors',
    text: 'Ask a local question, share an update, or jump into a thread that matters today.',
  },
  {
    icon: HandHeart,
    title: 'Help and be helped',
    text: 'Post mitzvah opportunities, rides, meals, errands, and urgent needs with clear status.',
  },
  {
    icon: MapPin,
    title: 'Find what is nearby',
    text: 'See shuls, schools, kosher food, Jewish businesses, events, and live activity on the map.',
  },
  {
    icon: CalendarDays,
    title: 'Plan real life',
    text: 'Coordinate events, carpools, minyanim, meetups, and family-friendly plans in one place.',
  },
  {
    icon: Store,
    title: 'Support local businesses',
    text: 'Discover verified Jewish-owned businesses and timely updates without spammy group blasts.',
  },
  {
    icon: Users,
    title: 'Find your people',
    text: 'Connect through interests, shuls, schools, neighborhoods, and shared community values.',
  },
];

function joinPath(path) {
  return `/login?from_url=${encodeURIComponent(path)}`;
}

function LandingButton({ children, variant = 'primary', onClick }) {
  const base = 'motion-press inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition active:scale-[0.98]';
  const styles = variant === 'primary'
    ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/15 hover:bg-slate-800'
    : 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50';

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-white/70 bg-white/88 p-3 shadow-2xl shadow-slate-950/12 backdrop-blur">
      <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-black text-emerald-200">
              <Radio className="h-3 w-3" />
              Live Five Towns
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight">What needs attention now?</h2>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center ring-1 ring-white/10">
            <p className="text-2xl font-black">23</p>
            <p className="text-[10px] font-black uppercase text-slate-300">active</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-[11px] font-black uppercase text-slate-300">Needs today</p>
            <p className="mt-1 text-xl font-black">11</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-[11px] font-black uppercase text-slate-300">Updated</p>
            <p className="mt-1 text-sm font-black">1 min ago</p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {LIVE_ITEMS.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                item.tone === 'red' ? 'bg-red-500' : item.tone === 'green' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-black leading-5 text-slate-950">{item.label}</p>
                <p className="mt-0.5 text-[12px] font-bold text-slate-500">{item.meta}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/Feed', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const goJoin = () => navigate(joinPath('/Feed'));
  const goMap = () => navigate(joinPath('/Map'));

  return (
    <main className="min-h-[100dvh] bg-[#F6F8FB] text-slate-950" style={{ colorScheme: 'light' }}>
      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#EEF6FF_0%,#F6F8FB_72%)]">
        <div className="absolute inset-x-0 top-0 h-40 bg-white/55" />
        <div className="relative mx-auto flex min-h-[92dvh] w-full max-w-6xl flex-col px-5 pb-8 pt-5 sm:px-8 lg:min-h-[86dvh]">
          <header className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => navigate('/welcome')} className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-slate-950 shadow-lg shadow-slate-950/15">
                <img src="/brand-mark.png" alt="JUnited" className="h-7 w-7" />
              </span>
              <span>
                <span className="block text-lg font-black leading-none">JUnited</span>
                <span className="mt-1 block text-[11px] font-black uppercase text-slate-500">Five Towns live</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="motion-press rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-black text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
            >
              Sign in
            </button>
          </header>

          <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.02fr_0.98fr] lg:py-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[12px] font-black text-blue-700 shadow-sm">
                <Navigation className="h-3.5 w-3.5" />
                Built for Lawrence, Cedarhurst, Woodmere, Hewlett, and Inwood
              </div>
              <h1 className="mt-5 text-[42px] font-black leading-[0.98] tracking-normal text-slate-950 sm:text-[58px] lg:text-[70px]">
                The Five Towns, live in one place.
              </h1>
              <p className="mt-5 max-w-xl text-[17px] font-semibold leading-7 text-slate-600 sm:text-[19px]">
                JUnited is the real-time Jewish community network for local questions,
                mitzvah needs, minyanim, events, carpools, kosher spots, businesses,
                and neighbors you would not normally meet.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <LandingButton onClick={goJoin}>
                  Join the Five Towns feed
                  <ArrowRight className="h-4 w-4" />
                </LandingButton>
                <LandingButton variant="secondary" onClick={goMap}>
                  Explore the local map
                  <MapPin className="h-4 w-4" />
                </LandingButton>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {TOWNS.map((town) => (
                  <span key={town} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-black text-slate-600 shadow-sm">
                    {town}
                  </span>
                ))}
              </div>
            </div>

            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p className="text-[12px] font-black uppercase text-blue-700">Why it is different</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Not another WhatsApp group. Not a generic Jewish Facebook.
            </h2>
            <p className="mt-3 text-[15px] font-semibold leading-7 text-slate-600">
              Group chats are fast, but they get noisy. Facebook is broad, but not local enough.
              JUnited keeps local Jewish life organized around what is happening now and what
              someone can actually do.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {DIFFERENTIATORS.map((item) => (
              <div key={item} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-[14px] font-black leading-5 text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-black uppercase text-blue-700">What people use daily</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Everything points back to real connection.</h2>
            </div>
            <p className="max-w-md text-[14px] font-semibold leading-6 text-slate-500">
              Feed, Mitzvah, Map, Shuls, Events, Businesses, Marketplace, and Messages work
              together instead of living in separate silos.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[24px] border border-slate-200 bg-[#F8FAFC] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-[17px] font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-[14px] font-semibold leading-6 text-slate-600">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/12">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-black text-white ring-1 ring-white/10">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Local, trusted, and action-first
              </div>
              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                Open the app and know what matters today.
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] font-semibold leading-7 text-slate-300">
                See who needs help, what is happening tonight, which shul or event needs attention,
                where people are going, and which neighbors are already responding.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { icon: Bell, label: 'Real-time alerts for replies, needs, events, and minyanim' },
                { icon: Search, label: 'Searchable local knowledge instead of lost messages' },
                { icon: Users, label: 'Profiles, communities, and mutual context before messaging' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-[20px] bg-white/8 p-3 ring-1 ring-white/10">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-[13px] font-black leading-5 text-white">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-blue-100 bg-blue-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Ready to see the Five Towns feed?</h2>
            <p className="mt-1 text-[14px] font-semibold leading-6 text-slate-600">
              Join, choose your town, and start with the local conversation.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <LandingButton onClick={goJoin}>
              Get started
              <ArrowRight className="h-4 w-4" />
            </LandingButton>
          </div>
        </div>
      </section>
    </main>
  );
}
