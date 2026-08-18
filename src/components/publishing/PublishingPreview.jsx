import React from 'react';
import { Clock3, MapPin, ShieldCheck } from 'lucide-react';
import { getPublishingType } from '@/lib/publishing/publishingTypes';

export default function PublishingPreview({ draft }) {
  const type = getPublishingType(draft.publishingType);
  const audience = draft.audience.scope === 'community'
    ? draft.joinedCommunities?.find((community) => community.id === draft.audience.communityId)?.name || 'Selected community'
    : draft.audience.network;
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">{type.label}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Publishes now</span>
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-[22px] font-black leading-[1.05] tracking-[-0.035em] text-slate-950">{draft.headline}</h2>
        <p className="mt-3 whitespace-pre-wrap text-[14px] font-medium leading-6 text-slate-650">{draft.details}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5"><MapPin className="h-3.5 w-3.5" /> {audience}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5"><Clock3 className="h-3.5 w-3.5" /> Ends automatically</span>
        </div>
        {draft.publicAuthorHidden && <p className="mt-3 text-xs font-semibold text-emerald-700">Your public name will be hidden.</p>}
      </div>
    </div>
  );
}
