import { MapPin } from 'lucide-react';
import CompactEmptyState from './CompactEmptyState';

export default function RoutedOpenNeedsTab({ activeNeeds, typeConfig }) {
  if (!activeNeeds.length) {
    return (
      <div className="pt-4">
        <CompactEmptyState typeConfig={typeConfig} tabKey="openNeeds" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.status || 'open'}</span>
          <h3 className="mt-3 text-[15px] font-black text-slate-950">{need.title}</h3>
          {need.description && <p className="mt-1 text-sm leading-6 text-slate-600">{need.description}</p>}
          {(need.location_label || need.neighborhood) && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {need.location_label || need.neighborhood}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
