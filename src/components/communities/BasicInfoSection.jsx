import React, { useState } from 'react';
import { MapPin, Phone, Globe, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_SCHEDULE = [
  { label: 'Shacharis', lines: ['Sun: 7:00 / 8:30 AM', 'Mon–Fri: 6:15 / 7:00 AM'] },
  { label: 'Mincha/Maariv', lines: ['Daily — see schedule below'] },
  { label: 'Shabbos', lines: ['Kabbalas Shabbos: 7:00 PM', 'Shacharis: 9:00 AM', 'Mincha: 45 min before sunset'] },
];

function ScheduleSection({ hours }) {
  // If hours text references a website, replace with structured schedule
  const refsWebsite = hours && /website|web site|online|see our/i.test(hours);
  const isEmpty = !hours;

  if (isEmpty || refsWebsite) {
    return (
      <div className="pt-1">
        <h3 className="text-[13px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" /> Services Schedule
        </h3>
        <div className="space-y-2">
          {DEFAULT_SCHEDULE.map(s => (
            <div key={s.label} className="bg-slate-50 rounded-xl px-3 py-2">
              <p className="text-[12px] font-bold text-slate-700 mb-0.5">{s.label}</p>
              {s.lines.map(l => (
                <p key={l} className="text-[12px] text-slate-600">{l}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 text-sm text-slate-600">
      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
      <span className="leading-relaxed whitespace-pre-line">{hours}</span>
    </div>
  );
}

export default function BasicInfoSection({ community }) {
  const [expanded, setExpanded] = useState(false);
  const [showExternal, setShowExternal] = useState(false);
  const { address, phone, website, hours, description_short, description_long } = community;

  const hasContactInfo = address || phone || hours;
  const hasDescription = description_short || description_long;
  if (!hasContactInfo && !hasDescription && !website) return null;

  const longDesc = description_long || description_short;
  const shortDesc = description_short;
  const needsExpand = longDesc && longDesc.length > 160;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      {/* Description */}
      {hasDescription && (
        <div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {expanded ? longDesc : shortDesc}
          </p>
          {needsExpand && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-1 flex items-center gap-0.5 text-xs font-semibold text-[#0F5ED7]"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />See more</>}
            </button>
          )}
        </div>
      )}

      {hasDescription && hasContactInfo && <div className="border-t border-slate-100" />}

      {/* Contact info rows */}
      {(address || phone) && (
        <div className="space-y-2">
          {address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank" rel="noreferrer"
              className="flex items-start gap-2.5 text-sm text-slate-600 hover:text-[#0F5ED7] transition-colors group"
            >
              <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#0F5ED7] flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{address}</span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-[#0F5ED7] transition-colors group"
            >
              <Phone className="w-4 h-4 text-slate-400 group-hover:text-[#0F5ED7] flex-shrink-0" />
              <span>{phone}</span>
            </a>
          )}
        </div>
      )}

      {/* Schedule */}
      <ScheduleSection hours={hours} />

      {/* External link — collapsed by default */}
      {website && (
        <div className="border-t border-slate-100 pt-2">
          <button
            onClick={() => setShowExternal(e => !e)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Globe className="w-3 h-3" />
            External link {showExternal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showExternal && (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank" rel="noreferrer"
              className="block mt-1 text-[12px] text-slate-500 hover:text-[#0F5ED7] hover:underline break-all"
            >
              {website.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}