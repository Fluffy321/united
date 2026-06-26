import React, { useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, CircleDashed, Search, ShieldCheck, Store, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

const VERIFICATION_META = {
  unverified: { label: 'Unverified', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  pending: { label: 'Owner pending', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  verified_owner: { label: 'Verified owner', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Owner rejected', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const JEWISH_OWNED_META = {
  none: { label: 'Jewish-owned: none', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  pending: { label: 'Jewish-owned pending', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  verified: { label: 'Jewish-owned verified', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Jewish-owned rejected', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const KOSHER_META = {
  none: { label: 'Kosher: none', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  pending: { label: 'Kosher pending', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  certified: { label: 'Kosher certified', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  claimed: { label: 'Kosher claimed', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  rejected: { label: 'Kosher rejected', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

function Badge({ children, className = 'bg-slate-100 text-slate-600 border-slate-200' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-black ${className}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      {sub && <p className="mt-1 text-[12px] font-semibold text-slate-500">{sub}</p>}
    </div>
  );
}

function ActionButton({ onClick, disabled, tone = 'default', children }) {
  const tones = {
    default: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    approve: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    reject: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export default function AdminBusinessVerification() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [agencyDrafts, setAgencyDrafts] = useState({});

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['admin-business-verification'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured');
      const { data, error } = await supabase
        .from('business_listings')
        .select('id, name, category, city, neighborhood, status, claim_status, is_claimed, verification_status, jewish_owned_status, kosher_status, kosher_certification, kosher_certifying_agency, verified_owner_id, submitted_by, submitted_by_name, created_at')
        .or('verification_status.eq.pending,jewish_owned_status.eq.pending,kosher_status.eq.pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ businessId, verification_status = null, jewish_owned_status = null, kosher_status = null, kosher_certifying_agency = null }) => {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.rpc('admin_verify_business', {
        p_business_id: businessId,
        p_verification_status: verification_status,
        p_jewish_owned_status: jewish_owned_status,
        p_kosher_status: kosher_status,
        p_review_note: null,
        p_kosher_certifying_agency: kosher_certifying_agency,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification'] });
      queryClient.invalidateQueries({ queryKey: ['business-directory-published'] });
      toast.success('Business updated');
    },
    onError: (error) => toast.error(error.message || 'Could not update business'),
  });

  function agencyFor(item) {
    return agencyDrafts[item.id] ?? item.kosher_certifying_agency ?? '';
  }

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter((item) => [item.name, item.category, item.city, item.neighborhood, item.submitted_by_name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)));
  }, [businesses, query]);

  const isBusy = verifyMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-4 pb-24 pt-5">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Admin</p>
              <h1 className="truncate text-2xl font-black text-slate-950">Verify Businesses</h1>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <Stat label="Pending review" value={businesses.length} sub="owner, Jewish-owned, or kosher pending" />
          <Stat label="Showing" value={visibleItems.length} sub="after search filter" />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search businesses"
              className="h-11 min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
        </section>

        <section className="space-y-3">
          {visibleItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-black leading-tight text-slate-950">{item.name}</h2>
                  <p className="mt-0.5 text-[12px] font-semibold text-slate-500">
                    {[item.category, item.neighborhood || item.city].filter(Boolean).join(' · ')}
                    {item.submitted_by_name ? ` · submitted by ${item.submitted_by_name}` : ''}
                  </p>
                </div>
                <Store className="h-5 w-5 shrink-0 text-slate-300" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className={VERIFICATION_META[item.verification_status]?.className}>{VERIFICATION_META[item.verification_status]?.label ?? item.verification_status}</Badge>
                <Badge className={JEWISH_OWNED_META[item.jewish_owned_status]?.className}>{JEWISH_OWNED_META[item.jewish_owned_status]?.label ?? item.jewish_owned_status}</Badge>
                <Badge className={KOSHER_META[item.kosher_status]?.className}>{KOSHER_META[item.kosher_status]?.label ?? item.kosher_status}</Badge>
              </div>

              {(item.kosher_status === 'pending' || item.kosher_status === 'certified' || item.kosher_certification) && (
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  {item.kosher_certification && (
                    <p className="text-[12px] font-semibold text-slate-600">Claim: &ldquo;{item.kosher_certification}&rdquo;</p>
                  )}
                  <label className="mt-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">
                    Certifying agency (required to mark certified)
                  </label>
                  <input
                    value={agencyFor(item)}
                    onChange={(event) => setAgencyDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    placeholder="Example: OU, Star-K, a local vaad"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <ActionButton
                  tone="approve"
                  disabled={isBusy || item.verification_status === 'verified_owner'}
                  onClick={() => verifyMutation.mutate({ businessId: item.id, verification_status: 'verified_owner' })}
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> Verify owner
                </ActionButton>
                <ActionButton
                  tone="approve"
                  disabled={isBusy || item.jewish_owned_status === 'verified'}
                  onClick={() => verifyMutation.mutate({ businessId: item.id, jewish_owned_status: 'verified' })}
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> Verify Jewish-owned
                </ActionButton>
                <ActionButton
                  tone="approve"
                  disabled={isBusy || item.kosher_status === 'certified' || !agencyFor(item).trim()}
                  onClick={() => verifyMutation.mutate({ businessId: item.id, kosher_status: 'certified', kosher_certifying_agency: agencyFor(item).trim() })}
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> Kosher certified
                </ActionButton>
                <ActionButton
                  tone="reject"
                  disabled={isBusy}
                  onClick={() => verifyMutation.mutate({ businessId: item.id, verification_status: 'rejected', jewish_owned_status: 'rejected' })}
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </ActionButton>
              </div>
            </article>
          ))}

          {!isLoading && visibleItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <CircleDashed className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-black text-slate-700">No businesses are pending verification.</p>
            </div>
          )}
          {isLoading && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-black text-slate-500">Loading…</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
