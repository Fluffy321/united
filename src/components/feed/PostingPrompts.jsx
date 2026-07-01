import React, { useState } from 'react';
import { Car, ChevronRight, HandHeart, HelpCircle, MessageCircle, ShoppingBag, Star, UtensilsCrossed } from 'lucide-react';

const PROMPTS = [
  {
    id: 'question',
    icon: HelpCircle,
    tone: 'blue',
    label: 'Ask a neighbor',
    starters: [
      'Anyone know a reliable plumber in Lawrence?',
      'Best kosher pizza in the Five Towns right now?',
      'Looking for a good pediatrician near Woodmere — any recs?',
      'Who does alterations locally? Need something by Shabbos.',
      'Anyone know if the Lawrence eruv is up this week?',
    ],
    type: 'question',
    subtype: 'recommendation',
  },
  {
    id: 'need',
    icon: HandHeart,
    tone: 'rose',
    label: 'Ask for help',
    starters: [
      'Need a ride to JFK this Thursday morning — anyone heading that way?',
      'Looking to borrow a lulav and esrog for a few minutes.',
      'Anyone have a folding table I could borrow for Shabbos?',
      'Could use a meal this week — family situation, would really appreciate.',
      'Need someone to walk my dog Friday afternoon before Shabbos.',
    ],
    type: 'help',
    subtype: 'need',
  },
  {
    id: 'carpool',
    icon: Car,
    tone: 'indigo',
    label: 'Arrange a carpool',
    starters: [
      'Driving to HAFTR pickup at 3:45 — anyone want to share?',
      'Heading to DRS dropoff tomorrow 7:45am from Woodmere.',
      'Going to the city Sunday morning — can take 1-2 people.',
      'Anyone carpooling to HALB? I have 2 spots.',
      'Driving to the airport Friday — can split the trip.',
    ],
    type: 'feed',
    subtype: 'carpool',
  },
  {
    id: 'share',
    icon: MessageCircle,
    tone: 'emerald',
    label: 'Share something local',
    starters: [
      'Heads up — major pothole on Central Ave near the bank.',
      'The new kosher BBQ spot in Cedarhurst is really good.',
      'Shabbos flowers at the Woodmere market are beautiful this week.',
      'FYI there\'s a street fair on Broadway tomorrow.',
      'Just a reminder: the library is open late tonight.',
    ],
    type: 'feed',
    subtype: 'local_update',
  },
  {
    id: 'offer',
    icon: Star,
    tone: 'amber',
    label: 'Offer something',
    starters: [
      'Happy to give rides to anyone who needs — just DM me.',
      'Have extra Shabbos food — if anyone needs, reach out.',
      'I\'m a doctor — happy to answer general health questions here.',
      'Offering free tutoring for bar mitzvah prep this summer.',
      'Extra lulav sets available — first come first served.',
    ],
    type: 'help',
    subtype: 'offer',
  },
  {
    id: 'food',
    icon: UtensilsCrossed,
    tone: 'orange',
    label: 'Food & Shabbos',
    starters: [
      'Anyone doing a Shabbos guest swap? We have room for one more.',
      'Looking for a good caterer for a simcha — any recommendations?',
      'Who makes the best kugel deliveries locally?',
      'Need to place a Shabbos order — which butcher has the best prices?',
      'Anyone know where to get fresh challos late Friday in Woodmere?',
    ],
    type: 'question',
    subtype: 'food',
  },
  {
    id: 'marketplace',
    icon: ShoppingBag,
    tone: 'teal',
    label: 'Buy or sell',
    starters: [
      'Selling a like-new double stroller — great condition, $120.',
      'Looking to buy a used dining room table — anyone selling?',
      'Have kids\' clothing sizes 4-6 to give away.',
      'Selling a set of Artscroll Shas — full set, great condition.',
      'Anyone have a used bike for a 7-year-old?',
    ],
    type: 'feed',
    subtype: 'marketplace',
  },
];

const TONE_STYLES = {
  blue:   { pill: 'bg-blue-600',   card: 'border-blue-100 bg-blue-50',   icon: 'text-blue-600',   starter: 'border-blue-100 hover:border-blue-300 hover:bg-blue-100' },
  rose:   { pill: 'bg-rose-500',   card: 'border-rose-100 bg-rose-50',   icon: 'text-rose-500',   starter: 'border-rose-100 hover:border-rose-300 hover:bg-rose-100' },
  indigo: { pill: 'bg-indigo-600', card: 'border-indigo-100 bg-indigo-50', icon: 'text-indigo-600', starter: 'border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100' },
  emerald:{ pill: 'bg-emerald-600',card: 'border-emerald-100 bg-emerald-50', icon: 'text-emerald-600', starter: 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100' },
  amber:  { pill: 'bg-amber-500',  card: 'border-amber-100 bg-amber-50',  icon: 'text-amber-600',  starter: 'border-amber-100 hover:border-amber-300 hover:bg-amber-100' },
  orange: { pill: 'bg-orange-500', card: 'border-orange-100 bg-orange-50', icon: 'text-orange-600', starter: 'border-orange-100 hover:border-orange-300 hover:bg-orange-100' },
  teal:   { pill: 'bg-teal-600',   card: 'border-teal-100 bg-teal-50',   icon: 'text-teal-600',   starter: 'border-teal-100 hover:border-teal-300 hover:bg-teal-100' },
};

export default function PostingPrompts({ onCreate }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prompt = PROMPTS[activeIdx];
  const styles = TONE_STYLES[prompt.tone];
  const Icon = prompt.icon;

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Header with category pills */}
      <div className="border-b border-slate-100 px-4 pt-4 pb-3">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-3">Start a conversation</p>
        <div className="mobile-scroll-x flex gap-2 pb-1">
          {PROMPTS.map((p, i) => {
            const PIcon = p.icon;
            const s = TONE_STYLES[p.tone];
            const active = i === activeIdx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`motion-press inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-black transition ${
                  active
                    ? `${s.pill} border-transparent text-white`
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <PIcon className="h-3 w-3" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active prompt starters */}
      <div className={`p-3 ${styles.card} border-0`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-xl bg-white/80 ${styles.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-[12px] font-black text-slate-700">{prompt.label} — tap to post</p>
        </div>
        <div className="space-y-2">
          {prompt.starters.map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onCreate(prompt.type, prompt.subtype, starter)}
              className={`motion-press flex w-full items-center justify-between gap-3 rounded-[16px] border bg-white px-4 py-3 text-left transition ${styles.starter}`}
            >
              <p className="text-[13px] font-semibold leading-snug text-slate-800">{starter}</p>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
