import React, { useState } from 'react';
import { MapPin, Phone, Globe, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function BasicInfoSection({ community }) {
  const [expanded, setExpanded] = useState(false);
  const { address, phone, website, hours, description_short, description_long } = community;

  const hasContactInfo = address || phone || website || hours;
  const hasDescription = description_short || description_long;
  if (!hasContactInfo && !hasDescription) return null;

  const longDesc = description_long || description_short;
  const shortDesc = description_short;
  const needsExpand = longDesc && longDesc.length > 160;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      {/* Description */}
      {hasDescription &&
      <div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {expanded ? longDesc : shortDesc}
          </p>
          {needsExpand &&
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 flex items-center gap-0.5 text-xs font-semibold text-[#0F5ED7]">

              {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />See more</>}
            </button>
        }
        </div>
      }

      {/* Divider if both sections exist */}
      {hasDescription && hasContactInfo &&
      <div className="border-t border-slate-100" />
      }

      {/* Contact info rows */}
      {hasContactInfo &&
      <div className="space-y-2">
          {address &&
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
          target="_blank" rel="noreferrer"
          className="flex items-start gap-2.5 text-sm text-slate-600 hover:text-[#0F5ED7] transition-colors group">

              <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#0F5ED7] flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{address}</span>
            </a>
        }
          {phone &&
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-[#0F5ED7] transition-colors group">

              <Phone className="w-4 h-4 text-slate-400 group-hover:text-[#0F5ED7] flex-shrink-0" />
              <span>{phone}</span>
            </a>
        }
          {website &&
        <a
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-2.5 text-sm text-[#0F5ED7] hover:underline group">

              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>
        }
          {hours &&
        <div className="flex items-start gap-2.5 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              
            </div>
        }
        </div>
      }
    </div>);

}