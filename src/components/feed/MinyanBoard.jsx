import React, { useState, useMemo } from 'react';
import { Clock, MapPin, ChevronRight } from 'lucide-react';

// ─── Data sourced from: ────────────────────────────────────────────────────
//   5townscentral.com/minyan   (primary aggregator, fetched July 1 2026)
//   yiwoodmere.org             (YIW weekday schedule)
//   yilc.org                   (YILC Today's Calendar)
//   aishkodesh.org             (Aish Kodesh Today's Calendar)
//   bm-hd.com                  (Heichal Dovid M-F schedule)
//   irvingplaceminyan.com      (Irving Place weekday schedule)
//   shaaray-tefilah.org        (Shaaray Tefila Shacharis times)
//   bostoner.org / 5tjt.com    (Bostoner Lawrence)
//   hv5t.org                   (HaChaim VeHashalom — non-stop)
// Times are approximate and zman-dependent. Always verify before davening.
// ─────────────────────────────────────────────────────────────────────────

const SHULS = [
  // ── CEDARHURST / LAWRENCE ──────────────────────────────────────────────
  {
    id: 'hachaim-vehashalom',
    name: 'HaChaim VeHashalom',
    subtitle: 'Non-Stop Minyanim',
    area: 'Cedarhurst',
    address: '125 Cedarhurst Ave #137, Cedarhurst',
    phone: null,
    website: 'https://hv5t.org',
    highlight: true,
    note: 'Sunrise–1 AM · Every 15 min',
    shacharis: ['Netz', 'Every 15 min until noon'],
    mincha: ['Every 15 min · last ~8:00 PM'],
    maariv: ['Every 15 min until 1:00 AM'],
  },
  {
    id: 'yilc',
    name: 'Young Israel of Lawrence-Cedarhurst',
    subtitle: 'YILC',
    area: 'Lawrence',
    address: '1 Spruce Street, Cedarhurst',
    phone: '516-569-3464',
    website: 'https://www.yilc.org',
    shacharis: ['5:50 AM', '6:20 AM', '7:00 AM', '7:15 AM', '8:00 AM', '9:00 AM'],
    mincha: ['Plag / Mincha-Maariv 6:45 PM'],
    maariv: ['8:15 PM', '9:15 PM', '9:45 PM', '10:15 PM'],
  },
  {
    id: 'heichal-dovid',
    name: 'Beis Medrash Heichal Dovid',
    subtitle: null,
    area: 'Lawrence',
    address: '215 Central Ave, Lawrence (corner Herrick Dr)',
    phone: null,
    website: 'https://www.bm-hd.com',
    shacharis: ['6:10 AM', '7:30 AM', '8:30 AM'],
    mincha: ['12–15 min before sunset'],
    maariv: ['8:00 PM', '9:30 PM'],
  },
  {
    id: 'shaaray-tefila',
    name: 'Congregation Shaaray Tefila',
    subtitle: null,
    area: 'Lawrence',
    address: '25 Central Avenue, Lawrence',
    phone: '516-239-2444',
    website: 'http://www.shaaray-tefilah.org',
    shacharis: ['6:00 AM', '7:00 AM', '7:45 AM', '9:30 AM'],
    mincha: ['Before sunset'],
    maariv: ['9:15 PM'],
  },
  {
    id: 'bostoner',
    name: 'Bostoner Bais Medrash',
    subtitle: 'of Lawrence',
    area: 'Lawrence',
    address: '1109 Doughty Blvd, Lawrence',
    phone: '516-371-6848',
    website: 'https://www.bostoner.org',
    note: 'Late-night minyans every 20 min',
    shacharis: ['9:00 AM (Chol Hamoed)'],
    mincha: [],
    maariv: ['8:00 PM (Mon–Thu)', '10:40 PM', '11:00 PM', '11:20 PM', '11:40 PM', '12:00 AM'],
  },
  {
    id: 'agudah-five-towns',
    name: 'Agudath Israel of the Five Towns',
    subtitle: null,
    area: 'Cedarhurst',
    address: 'Cedarhurst',
    phone: null,
    website: null,
    shacharis: ['6:00 AM'],
    mincha: [],
    maariv: [],
  },
  {
    id: 'red-shul',
    name: 'Kehillas Bais Yehudah Tzvi',
    subtitle: 'Red Shul',
    area: 'Cedarhurst',
    address: 'Cedarhurst',
    phone: null,
    website: null,
    shacharis: ['6:20 AM', '7:30 AM', '8:00 AM'],
    mincha: [],
    maariv: ['9:45 PM'],
  },
  {
    id: 'chabad-five-towns',
    name: 'Chabad of the Five Towns',
    subtitle: null,
    area: 'Cedarhurst',
    address: 'Cedarhurst',
    phone: null,
    website: 'https://www.chabadfivetowns.com',
    shacharis: ['6:30 AM'],
    mincha: [],
    maariv: [],
  },
  {
    id: 'bais-medrash-cedarhurst',
    name: 'Bais Medrash of Cedarhurst',
    subtitle: 'The Shteeble',
    area: 'Cedarhurst',
    address: 'Cedarhurst',
    phone: null,
    website: null,
    shacharis: ['6:00 AM', '7:00 AM', '8:00 AM'],
    mincha: [],
    maariv: ['10:00 PM'],
  },

  // ── WOODMERE ────────────────────────────────────────────────────────────
  {
    id: 'yiw',
    name: 'Young Israel of Woodmere',
    subtitle: 'YIW',
    area: 'Woodmere',
    address: '859 Peninsula Blvd, Woodmere',
    phone: '516-295-0950',
    website: 'https://www.yiwoodmere.org',
    shacharis: ['5:45 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM'],
    mincha: ['2:00 PM', '5:00 PM', '6:15 PM'],
    maariv: ['8:20 PM (Mincha-Maariv)', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'],
  },
  {
    id: 'aish-kodesh',
    name: 'Congregation Aish Kodesh',
    subtitle: 'Rabbi Moshe Weinberger',
    area: 'Woodmere',
    address: '894 Woodmere Place, Woodmere',
    phone: '516-374-8596',
    website: 'https://www.aishkodesh.org',
    shacharis: ['6:10 AM', '6:55 AM', '7:35 AM'],
    mincha: [],
    maariv: ['8:15 PM (Mincha-Maariv)'],
  },
  {
    id: 'irving-place',
    name: 'Irving Place Minyan',
    subtitle: null,
    area: 'Woodmere',
    address: '111 Irving Place, Woodmere (Morgenstern School)',
    phone: '516-323-7070',
    website: 'https://www.irvingplaceminyan.com',
    shacharis: ['6:10 AM', '7:30 AM'],
    mincha: ['8:05 PM (Mincha-Maariv)'],
    maariv: [],
  },
  {
    id: 'yeshiva-gedolah',
    name: 'Yeshiva Gedolah of the Five Towns',
    subtitle: 'Mesoras Hatorah',
    area: 'Woodmere',
    address: '218 Mosher Ave, Woodmere',
    phone: '516-295-8900',
    website: null,
    shacharis: ['7:00 AM', '7:35 AM'],
    mincha: ['1:45 PM', '2:45 PM'],
    maariv: ['9:45 PM', '10:30 PM'],
  },
  {
    id: 'bais-medrash-woodmere',
    name: 'Bais Medrash of Woodmere',
    subtitle: null,
    area: 'Woodmere',
    address: 'Woodmere',
    phone: null,
    website: null,
    shacharis: [],
    mincha: [],
    maariv: ['9:15 PM'],
  },
  {
    id: 'bais-ephraim',
    name: 'Bais Ephraim Yitzchok',
    subtitle: null,
    area: 'Woodmere',
    address: 'Woodmere',
    phone: null,
    website: null,
    shacharis: ['6:00 AM', '7:00 AM'],
    mincha: [],
    maariv: ['9:15 PM'],
  },

  // ── HEWLETT / NORTH WOODMERE ─────────────────────────────────────────────
  {
    id: 'yi-hewlett',
    name: 'Young Israel of Hewlett',
    subtitle: null,
    area: 'Hewlett',
    address: 'Hewlett',
    phone: null,
    website: null,
    shacharis: ['6:30 AM'],
    mincha: [],
    maariv: ['9:15 PM'],
  },
  {
    id: 'yi-north-woodmere',
    name: 'Young Israel of North Woodmere',
    subtitle: 'YINW',
    area: 'North Woodmere',
    address: 'North Woodmere',
    phone: '516-791-5099',
    website: 'https://www.yinw.org',
    shacharis: ['6:20 AM'],
    mincha: [],
    maariv: ['8:05 PM'],
  },
  {
    id: 'ohr-torah',
    name: 'Ohr Torah',
    subtitle: null,
    area: 'North Woodmere',
    address: 'North Woodmere',
    phone: null,
    website: null,
    shacharis: ['6:15 AM'],
    mincha: [],
    maariv: [],
  },
];

const AREAS = ['All', 'Cedarhurst', 'Lawrence', 'Woodmere', 'Hewlett', 'North Woodmere'];

const SERVICE_TABS = [
  { id: 'shacharis', label: 'Shacharis' },
  { id: 'mincha', label: 'Mincha' },
  { id: 'maariv', label: 'Maariv' },
];

export default function MinyanBoard() {
  const [area, setArea] = useState('All');
  const [service, setService] = useState('shacharis');

  const visible = useMemo(() => {
    return SHULS.filter(s => {
      if (area !== 'All' && s.area !== area) return false;
      const times = s[service] || [];
      return times.length > 0;
    });
  }, [area, service]);

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Five Towns</p>
            <h2 className="text-[17px] font-black text-slate-950">Minyan Board</h2>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
            {visible.length} minyanim
          </span>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-slate-400">
          Times are approximate — always verify before davening.
        </p>

        {/* Service tabs */}
        <div className="mt-3 flex gap-1.5">
          {SERVICE_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setService(tab.id)}
              className={`motion-press rounded-full px-3.5 py-1.5 text-[12px] font-black transition ${
                service === tab.id
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Area filter */}
        <div className="mobile-scroll-x mt-2.5 flex gap-2 pb-1">
          {AREAS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setArea(a)}
              className={`motion-press inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[11px] font-black transition ${
                area === a
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Shul list */}
      <div className="divide-y divide-slate-100">
        {visible.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] font-semibold text-slate-400">
            No listed {service} times for this area.
          </p>
        )}
        {visible.map(shul => {
          const times = shul[service] || [];
          return (
            <div key={shul.id} className={`px-4 py-3 ${shul.highlight ? 'bg-blue-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[14px] font-black text-slate-950">{shul.name}</p>
                    {shul.subtitle && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                        {shul.subtitle}
                      </span>
                    )}
                    {shul.highlight && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                        Non-Stop
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="font-semibold">{shul.area}</span>
                    {shul.address && shul.address !== shul.area && (
                      <span className="truncate">· {shul.address.replace(`, ${shul.area}`, '')}</span>
                    )}
                  </div>
                  {shul.note && (
                    <p className="mt-0.5 text-[11px] font-bold text-blue-700">{shul.note}</p>
                  )}
                </div>
              </div>

              {/* Times */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {times.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-black text-slate-800"
                  >
                    <Clock className="h-3 w-3 text-slate-400" />
                    {t}
                  </span>
                ))}
              </div>

              {shul.website && (
                <a
                  href={shul.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-blue-600"
                >
                  Website <ChevronRight className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <p className="text-[11px] font-semibold leading-5 text-slate-400">
          Sources: 5townscentral.com · yiwoodmere.org · yilc.org · aishkodesh.org · bm-hd.com · irvingplaceminyan.com · bostoner.org · hv5t.org
          · shaaray-tefilah.org. Is your shul missing or wrong?{' '}
          <a href="mailto:hello@junited.us" className="font-black text-blue-600 underline">Let us know.</a>
        </p>
      </div>
    </section>
  );
}
