import React from 'react';
import { getPublishingType } from '@/lib/publishing/publishingTypes';

function Input({ field, value, error, onChange }) {
  const base = 'mt-1.5 min-h-12 w-full rounded-[15px] border bg-white px-3.5 text-[15px] text-slate-950 outline-none transition focus:ring-2';
  if (field.id === 'details') {
    return <textarea value={value || ''} onChange={(event) => onChange(field.id, event.target.value)} rows={5} className={`${base} py-3 ${error ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`} />;
  }
  return <input type={field.kind === 'datetime' ? 'datetime-local' : field.kind === 'number' ? 'number' : 'text'} value={value || ''} onChange={(event) => onChange(field.id, event.target.value)} className={`${base} ${error ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`} />;
}

export default function PublishingForm({ draft, errors = {}, onChange }) {
  const type = getPublishingType(draft?.publishingType);
  if (!type) return null;
  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">{type.label}</p>
        <div className="mt-3 space-y-4">
          {type.fields.filter((item) => item.kind !== 'boolean').map((item) => (
            <label key={item.id} className="block text-sm font-bold text-slate-800">
              {item.label}{item.required ? ' *' : ''}
              <Input field={item} value={draft[item.id]} error={errors[item.id]} onChange={onChange} />
              {errors[item.id] && <span className="mt-1 block text-xs font-semibold text-rose-600">{errors[item.id]}</span>}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4">
        <h2 className="text-base font-black text-slate-950">Who should see it?</h2>
        <label className="mt-3 flex min-h-14 items-center gap-3 rounded-[16px] border border-blue-200 bg-blue-50 px-3.5">
          <input type="radio" name="audience" checked={draft.audience.scope === 'area'} onChange={() => onChange('audience', { ...draft.audience, scope: 'area', communityId: null })} />
          <span><strong className="block text-sm text-slate-950">Local area</strong><span className="text-xs font-medium text-slate-600">{draft.audience.network}</span></span>
        </label>
        <p className="mb-1.5 mt-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Optional community</p>
        {(draft.joinedCommunities || []).map((community) => (
          <label key={community.id} className="mb-2 flex min-h-12 items-center gap-3 rounded-[15px] border border-slate-200 px-3.5">
            <input type="radio" name="audience" checked={draft.audience.scope === 'community' && draft.audience.communityId === community.id} onChange={() => onChange('audience', { ...draft.audience, scope: 'community', communityId: community.id })} />
            <span className="text-sm font-bold text-slate-800">{community.name}</span>
          </label>
        ))}
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4">
        <h2 className="text-base font-black text-slate-950">Source</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{type.sourceRequired ? 'Required for this kind of update.' : 'Optional, if people should know where it came from.'}</p>
        <label className="mt-3 block text-sm font-bold text-slate-800">Source name<input value={draft.sourceName || ''} onChange={(event) => onChange('sourceName', event.target.value)} className="mt-1.5 min-h-12 w-full rounded-[15px] border border-slate-200 px-3.5 outline-none focus:ring-2 focus:ring-blue-100" /></label>
        <label className="mt-3 block text-sm font-bold text-slate-800">Source link<input value={draft.sourceUrl || ''} onChange={(event) => onChange('sourceUrl', event.target.value)} placeholder="https://" className="mt-1.5 min-h-12 w-full rounded-[15px] border border-slate-200 px-3.5 outline-none focus:ring-2 focus:ring-blue-100" /></label>
        {(errors.source || errors.sourceUrl) && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.source || errors.sourceUrl}</p>}
      </section>

      {type.allowPublicAuthorHidden && (
        <label className="flex min-h-16 items-center gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4">
          <input type="checkbox" checked={draft.publicAuthorHidden} onChange={(event) => onChange('publicAuthorHidden', event.target.checked)} />
          <span><strong className="block text-sm text-slate-950">Hide my name from the public</strong><span className="text-xs font-medium text-slate-600">JUnited admins can still see who posted.</span></span>
        </label>
      )}
    </div>
  );
}
