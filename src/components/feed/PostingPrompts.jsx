import React, { useState } from 'react';
import { Car, ChevronRight, Clock, HandHeart, HelpCircle, MessageCircle, ShoppingBag, Star, UtensilsCrossed } from 'lucide-react';

const PROMPTS = [
  {
    id: 'question',
    icon: HelpCircle,
    emoji: '🙋',
    label: 'Ask a neighbor',
    bg: 'from-blue-600 to-indigo-600',
    light: 'bg-blue-50 border-blue-100',
    ring: 'ring-blue-200',
    text: 'text-blue-700',
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
    emoji: '🤝',
    label: 'Ask for help',
    bg: 'from-rose-500 to-pink-600',
    light: 'bg-rose-50 border-rose-100',
    ring: 'ring-rose-200',
    text: 'text-rose-700',
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
    emoji: '🚗',
    label: 'Carpool',
    bg: 'from-indigo-600 to-violet-600',
    light: 'bg-indigo-50 border-indigo-100',
    ring: 'ring-indigo-200',
    text: 'text-indigo-700',
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
    emoji: '📢',
    label: 'Share something',
    bg: 'from-emerald-600 to-teal-600',
    light: 'bg-emerald-50 border-emerald-100',
    ring: 'ring-emerald-200',
    text: 'text-emerald-700',
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
    emoji: '🌟',
    label: 'Offer something',
    bg: 'from-amber-500 to-orange-500',
    light: 'bg-amber-50 border-amber-100',
    ring: 'ring-amber-200',
    text: 'text-amber-700',
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
    emoji: '🍽️',
    label: 'Food & Shabbos',
    bg: 'from-orange-500 to-red-500',
    light: 'bg-orange-50 border-orange-100',
    ring: 'ring-orange-200',
    text: 'text-orange-700',
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
    emoji: '🛍️',
    label: 'Buy or sell',
    bg: 'from-teal-600 to-cyan-600',
    light: 'bg-teal-50 border-teal-100',
    ring: 'ring-teal-200',
    text: 'text-teal-700',
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

export default function PostingPrompts({ onCreate, onOpenMinyan }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prompt = PROMPTS[activeIdx];
  const Icon = prompt.icon;

  return (
    <section className="mb-3 overflow-hidden rounded-[26px] shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
      {/* Hero header */}
      <div className={`bg-gradient-to-br ${prompt.bg} px-4 pt-4 pb-3 transition-all duration-300`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/60">Start a conversation</p>
            <h2 className="mt-0.5 text-[22px] font-black leading-tight text-white">
              {prompt.emoji} {prompt.label}
            </h2>
          </div>
          {/* Minyan times quick-access */}
          {onOpenMinyan && (
            <button
              type="button"
              onClick={onOpenMinyan}
              className="motion-press mt-1 flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-[11px] font-black text-white/90 backdrop-blur-sm"
            >
              <Clock className="h-3 w-3" />
              Minyan times
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {PROMPTS.map((p, i) => {
            const active = i === activeIdx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`motion-press inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-black transition-all ${
                  active
                    ? 'border-white/30 bg-white text-slate-950'
                    : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Starters */}
      <div className="bg-white">
        <div className="px-3 py-2 border-b border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Tap any prompt to get started</p>
        </div>
        <div className="divide-y divide-slate-100">
          {prompt.starters.map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onCreate(prompt.type, prompt.subtype, starter)}
              className={`motion-press flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:${prompt.light.split(' ')[0]}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${prompt.bg} text-white`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <p className="flex-1 text-[14px] font-semibold leading-snug text-slate-800">{starter}</p>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
