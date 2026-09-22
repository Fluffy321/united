/**
 * Public meal train page — /meals/:id
 *
 * Renders OUTSIDE ProtectedRoute, so logged-out visitors reach it. All data
 * comes from the public_meal_train / public_meal_train_slots RPCs, which are
 * by-id only and open-trains only, and which never return the delivery
 * address, contact phone, creator identity, free-text notes, or claimer names.
 * The one privileged branch is meal_train_for_claimer, which returns the
 * delivery address and phone only to a caller who holds a claimed slot on this
 * train. Everyone else — signed in or not — sees the anonymous payload.
 *
 * Claiming requires auth. A logged-out visitor tapping an open slot is sent to
 * /login with a from_url carrying ?slot=<uuid> — a query param, not a hash,
 * because Login rebuilds the target as pathname + search and drops the hash
 * (src/pages/Login.jsx:113).
 */
import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CalendarDays, CheckCircle2, ChefHat, Loader2, Lock, MapPin, Phone, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  other: 'Meal',
};

const safeDate = (value, pattern) => {
  if (!value) return null;
  try {
    return format(parseISO(value), pattern);
  } catch {
    return null;
  }
};

const rangeLabel = (start, end) => {
  const from = safeDate(start, 'MMM d');
  const to = safeDate(end, 'MMM d, yyyy');
  if (from && to) return `${from} – ${to}`;
  return from || to || 'Dates to be confirmed';
};

export default function PublicMealTrain() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [claimingSlotId, setClaimingSlotId] = useState(null);

  const highlightedSlotId = searchParams.get('slot');

  const { data: train, isLoading: loadingTrain, isError } = useQuery({
    queryKey: ['public-meal-train', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_meal_train', { p_train_id: id });
      if (error) throw error;
      return (data || [])[0] || null;
    },
    enabled: Boolean(id && supabase),
  });

  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['public-meal-train-slots', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_meal_train_slots', { p_train_id: id });
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(id && supabase && train),
  });

  // Privileged read. Returns a row only when auth.uid() holds a claimed slot on
  // this train; anon is not granted EXECUTE at all, so this never fires for them.
  const { data: claimerDetails, refetch: refetchClaimerDetails } = useQuery({
    queryKey: ['meal-train-claimer-details', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('meal_train_for_claimer', { p_train_id: id });
      if (error) throw error;
      return (data || [])[0] || null;
    },
    enabled: Boolean(id && supabase && isAuthenticated && train),
  });

  const { openCount, takenCount } = useMemo(() => ({
    openCount: slots.filter((slot) => !slot.is_claimed).length,
    takenCount: slots.filter((slot) => slot.is_claimed).length,
  }), [slots]);

  const sendToSignup = (slotId) => {
    // Query param, not a hash — Login preserves search and discards hash.
    const fromUrl = `/meals/${encodeURIComponent(id)}?slot=${encodeURIComponent(slotId)}`;
    navigate(`/login?from_url=${encodeURIComponent(fromUrl)}`);
  };

  const handleSlotClick = async (slot) => {
    if (slot.is_claimed) return;

    // A logged-out visitor never reaches the claim RPC.
    if (!isAuthenticated) {
      sendToSignup(slot.id);
      return;
    }

    setClaimingSlotId(slot.id);
    try {
      const claimerName = user?.display_name || user?.full_name || 'A neighbor';
      const { error } = await supabase.rpc('claim_meal_slot', {
        p_slot_id: slot.id,
        p_claimed_by_name: claimerName,
      });
      if (error) throw error;
      toast.success(`You're bringing a meal on ${safeDate(slot.slot_date, 'EEE M/d') || 'that day'}!`);
      queryClient.invalidateQueries({ queryKey: ['public-meal-train-slots', id] });
      // The claim is what unlocks the delivery details — refetch so they appear
      // without a reload.
      await refetchClaimerDetails();
    } catch (err) {
      // claim_meal_slot raises a readable message — surface it verbatim.
      toast.error(err?.message || 'Could not claim this day');
    } finally {
      setClaimingSlotId(null);
    }
  };

  if (loadingTrain) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FB]">
        <Loader2 className="h-7 w-7 animate-spin text-rose-600" />
      </div>
    );
  }

  // A closed, cancelled, or nonexistent train is indistinguishable here by
  // design — the RPC returns nothing in all three cases.
  if (isError || !train) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FB] p-6">
        <div className="w-full max-w-sm text-center">
          <UtensilsCrossed className="mx-auto h-8 w-8 text-slate-300" />
          <h1 className="mt-3 text-lg font-black text-slate-900">Meal train not available</h1>
          <p className="mt-2 text-sm text-slate-500">
            This meal train has closed, or the link isn&apos;t valid.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
          >
            Go to JUnited
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-3">
        <div className="overflow-hidden rounded-[24px] border border-rose-100 bg-white shadow-sm">
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wide text-rose-500">Meal train</p>
                <h1 className="truncate text-[19px] font-black text-slate-950">{train.family_name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {rangeLabel(train.period_start, train.period_end)}
            </div>

            {train.dietary_notes && (
              <div className="rounded-2xl bg-amber-50 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-amber-700">
                  <ChefHat className="h-3.5 w-3.5" /> Dietary notes
                </p>
                <p className="mt-1 text-[13px] font-semibold leading-5 text-amber-900">{train.dietary_notes}</p>
              </div>
            )}

            {slots.length > 0 && (
              <p className="text-[12px] font-semibold text-slate-500">
                {takenCount} of {slots.length} day{slots.length === 1 ? '' : 's'} covered
                {openCount > 0 && ` · ${openCount} still open`}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[11px] font-black uppercase tracking-wide text-slate-400">Days</p>

          {loadingSlots ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : slots.length === 0 ? (
            <p className="py-4 text-center text-[13px] font-semibold text-slate-400">
              No days have been set up yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {slots.map((slot) => {
                const isClaiming = claimingSlotId === slot.id;
                const isHighlighted = highlightedSlotId === slot.id;
                return (
                  <li key={slot.id}>
                    <button
                      type="button"
                      onClick={() => handleSlotClick(slot)}
                      disabled={slot.is_claimed || isClaiming}
                      aria-label={`${safeDate(slot.slot_date, 'EEEE, MMMM d') || 'Day'} — ${slot.is_claimed ? 'taken' : 'open'}`}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        slot.is_claimed
                          ? 'cursor-not-allowed border-slate-100 bg-slate-50'
                          : isHighlighted
                            ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-200'
                            : 'border-slate-200 bg-white hover:border-rose-300'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-black text-slate-900">
                          {safeDate(slot.slot_date, 'EEE, MMM d') || 'Day'}
                        </span>
                        <span className="block text-[12px] font-semibold text-slate-500">
                          {MEAL_LABELS[slot.meal_type] || MEAL_LABELS.other}
                        </span>
                      </span>

                      {isClaiming ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-rose-600" />
                      ) : slot.is_claimed ? (
                        <span className="flex shrink-0 items-center gap-1 text-[12px] font-black text-slate-400">
                          <CheckCircle2 className="h-4 w-4" /> Taken
                        </span>
                      ) : (
                        <span className="shrink-0 text-[12px] font-black text-rose-600">
                          {isAuthenticated ? 'Claim' : 'Open'}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {claimerDetails && (claimerDetails.delivery_address || claimerDetails.contact_phone) && (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Delivery details
            </p>
            <p className="mt-1 text-[12px] font-semibold text-emerald-800/80">
              Shared with you because you claimed a day.
            </p>
            <div className="mt-3 space-y-2">
              {claimerDetails.delivery_address && (
                <p className="flex items-start gap-2 text-[14px] font-bold leading-5 text-emerald-950">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {claimerDetails.delivery_address}
                </p>
              )}
              {claimerDetails.contact_phone && (
                <a
                  href={`tel:${claimerDetails.contact_phone}`}
                  className="flex items-center gap-2 text-[14px] font-bold text-emerald-950 underline"
                >
                  <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                  {claimerDetails.contact_phone}
                </a>
              )}
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="rounded-[24px] border border-slate-100 bg-white p-4 text-center shadow-sm">
            <Lock className="mx-auto h-4 w-4 text-slate-300" />
            <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-600">
              Sign in to bring a meal. Delivery details are shared with neighbors who claim a day.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/login?from_url=${encodeURIComponent(`/meals/${encodeURIComponent(id)}`)}`)}
              className="mt-3 w-full rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Sign in to help
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
