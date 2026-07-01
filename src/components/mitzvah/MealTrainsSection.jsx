import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { CalendarDays, CheckCircle2, ChefHat, Loader2, Plus, UtensilsCrossed, X } from 'lucide-react';
import { toast } from 'sonner';
import { notificationsService } from '@/services';
import { supabase } from '@/api/supabaseClient';
import { appParams } from '@/lib/app-params';
import { bulkCreateMealSlot, createMealSlot, createMealTrainRequest, filterMealTrainRequest, listMealSlot } from '@/services/entityServices';

const MEAL_TYPES = [
  { value: 'dinner', label: 'Dinner' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'other', label: 'Other' },
];

function CreateMealTrainModal({ open, onClose, onCreate, isLoading }) {
  const [familyName, setFamilyName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [mealType, setMealType] = useState('dinner');
  const [notes, setNotes] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [hideExactAddress, setHideExactAddress] = useState(true);

  if (!open) return null;

  const reset = () => {
    setFamilyName(''); setPeriodStart(''); setPeriodEnd(''); setMealType('dinner');
    setNotes(''); setDietaryNotes(''); setDeliveryAddress(''); setHideExactAddress(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!familyName.trim() || !periodStart) {
      toast.error('Family name and a start date are required');
      return;
    }
    await onCreate({
      familyName: familyName.trim(),
      periodStart,
      periodEnd: periodEnd || periodStart,
      mealType,
      notes: notes.trim(),
      dietaryNotes: dietaryNotes.trim(),
      deliveryAddress: deliveryAddress.trim(),
      hideExactAddress,
    });
    reset();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg space-y-3 rounded-t-3xl bg-white px-5 pt-4 pb-10 shadow-2xl"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-black text-slate-950">Start a meal train</h2>
          <button type="button" onClick={onClose} className="app-icon-button" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[12px] font-semibold text-slate-500">
          Neighbors will see one open slot per day for the dates you choose, and can claim a day to bring a meal.
        </p>

        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Family / recipient</span>
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="e.g. The Cohen family"
            className="app-input"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Start date</span>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="app-input" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">End date</span>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} min={periodStart} className="app-input" />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Meal</span>
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="app-input">
            {MEAL_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Dietary notes</span>
          <input
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
            placeholder="e.g. Dairy-free, no nuts"
            className="app-input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Delivery address</span>
          <input
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Shared with whoever claims a day"
            className="app-input"
          />
        </label>

        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
          <input type="checkbox" checked={hideExactAddress} onChange={(e) => setHideExactAddress(e.target.checked)} className="h-4 w-4 rounded" />
          <span className="text-[12px] font-bold text-slate-600">Only share exact address after someone claims a day</span>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Notes for helpers</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything helpful to know — drop-off time, allergies, etc."
            className="app-input resize-none"
          />
        </label>

        <button type="submit" disabled={isLoading} className="app-button-primary w-full">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create meal train
        </button>
      </form>
    </div>,
    document.body
  );
}

function MealTrainCard({ train, slots, currentUser, onClaim, onRelease, claimingSlotId }) {
  const claimedCount = slots.filter((s) => s.claimed_by).length;
  const isCreator = currentUser?.id === train.created_by;

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <ChefHat className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-black text-slate-950">{train.family_name}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-500">
            {claimedCount} of {slots.length} day{slots.length === 1 ? '' : 's'} covered
            {train.dietary_notes ? ` · ${train.dietary_notes}` : ''}
          </p>
          {train.notes && <p className="mt-1 text-[12px] leading-5 text-slate-500">{train.notes}</p>}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {slots.map((slot) => {
          const claimed = Boolean(slot.claimed_by);
          const isMine = slot.claimed_by === currentUser?.id;
          const isClaimingThis = claimingSlotId === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              disabled={isClaimingThis || (claimed && !isMine)}
              onClick={() => (isMine ? onRelease(slot) : onClaim(train, slot))}
              className={`motion-press rounded-xl border px-2 py-2 text-left transition ${
                claimed
                  ? isMine
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1 text-[11px] font-black">
                {claimed ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <CalendarDays className="h-3 w-3 shrink-0" />}
                {format(parseISO(slot.slot_date), 'EEE M/d')}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wide opacity-80">
                {isClaimingThis ? 'Saving…' : claimed ? (isMine ? 'You — tap to release' : slot.claimed_by_name || 'Covered') : 'Tap to bring a meal'}
              </span>
            </button>
          );
        })}
      </div>

      {isCreator && (
        <p className="mt-2 text-[11px] font-semibold text-slate-400">You started this meal train — you'll get a notification when a day is claimed.</p>
      )}
    </div>
  );
}

export default function MealTrainsSection({ currentUser }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [claimingSlotId, setClaimingSlotId] = useState(null);

  const { data: trains = [], isLoading: loadingTrains } = useQuery({
    queryKey: ['meal-trains'],
    queryFn: () => filterMealTrainRequest({ status: 'open' }, '-created_date', 50),
  });

  const { data: allSlots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['meal-slots'],
    queryFn: () => listMealSlot('slot_date', 500),
    enabled: trains.length > 0,
  });

  const slotsByTrain = useMemo(() => {
    const map = {};
    for (const slot of allSlots) {
      (map[slot.train_id] ||= []).push(slot);
    }
    Object.values(map).forEach((list) => list.sort((a, b) => (a.slot_date > b.slot_date ? 1 : -1)));
    return map;
  }, [allSlots]);

  const createMutation = useMutation({
    mutationFn: async ({ familyName, periodStart, periodEnd, mealType, notes, dietaryNotes, deliveryAddress, hideExactAddress }) => {
      const train = await createMealTrainRequest({
        created_by: currentUser.id,
        created_by_name: currentUser.display_name || currentUser.full_name || 'A neighbor',
        family_name: familyName,
        period_start: periodStart,
        period_end: periodEnd,
        notes: notes || null,
        dietary_notes: dietaryNotes || null,
        delivery_address: deliveryAddress || null,
        hide_exact_address: hideExactAddress,
        status: 'open',
      });
      const days = eachDayOfInterval({ start: parseISO(periodStart), end: parseISO(periodEnd) });
      const slots = days.map((day) => ({
        train_id: train.id,
        slot_date: format(day, 'yyyy-MM-dd'),
        meal_type: mealType,
      }));
      if (bulkCreateMealSlot) {
        await bulkCreateMealSlot(slots);
      } else {
        await Promise.all(slots.map((slot) => createMealSlot(slot)));
      }
      return train;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-trains'] });
      queryClient.invalidateQueries({ queryKey: ['meal-slots'] });
      toast.success('Meal train created!');
      setShowCreate(false);
    },
    onError: (error) => toast.error(error.message || 'Could not create meal train'),
  });

  const handleClaim = async (train, slot) => {
    setClaimingSlotId(slot.id);
    const claimerName = currentUser?.display_name || currentUser?.full_name || 'A neighbor';
    try {
      if (!appParams.hasBackendConfig || !supabase) {
        queryClient.setQueryData(['meal-slots'], (prev = []) =>
          prev.map((s) => (s.id === slot.id ? { ...s, claimed_by: currentUser?.id, claimed_by_name: claimerName } : s))
        );
        toast.success('Claimed locally for this demo session');
        return;
      }
      const { error } = await supabase.rpc('claim_meal_slot', { p_slot_id: slot.id, p_claimed_by_name: claimerName });
      if (error) throw error;
      toast.success(`You're bringing ${train.family_name} a meal on ${format(parseISO(slot.slot_date), 'EEE M/d')}!`);
      queryClient.invalidateQueries({ queryKey: ['meal-slots'] });
      notificationsService.create({
        userId: train.created_by,
        actorId: currentUser?.id,
        actorDisplayName: claimerName,
        type: 'meal_train_claimed',
        title: 'A meal day was claimed',
        body: `${claimerName} is bringing a meal for ${train.family_name} on ${format(parseISO(slot.slot_date), 'EEE, MMM d')}.`,
        linkUrl: '/MitzvahCircle',
      }).catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Could not claim this day');
    } finally {
      setClaimingSlotId(null);
    }
  };

  const handleRelease = async (slot) => {
    setClaimingSlotId(slot.id);
    try {
      if (!appParams.hasBackendConfig || !supabase) {
        queryClient.setQueryData(['meal-slots'], (prev = []) =>
          prev.map((s) => (s.id === slot.id ? { ...s, claimed_by: null, claimed_by_name: null } : s))
        );
        toast.success('Released locally for this demo session');
        return;
      }
      const { error } = await supabase.rpc('release_meal_slot', { p_slot_id: slot.id });
      if (error) throw error;
      toast.success('Released that day for someone else to take');
      queryClient.invalidateQueries({ queryKey: ['meal-slots'] });
    } catch (err) {
      toast.error(err.message || 'Could not release this day');
    } finally {
      setClaimingSlotId(null);
    }
  };

  const isLoading = loadingTrains || (trains.length > 0 && loadingSlots);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[24px] border border-rose-100 bg-gradient-to-br from-white via-rose-50/70 to-white shadow-sm">
        <div className="relative p-4">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-rose-100/60 blur-2xl" />
          <div className="relative space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-black text-slate-950">Meal trains</p>
                  <p className="text-[12px] font-semibold leading-5 text-slate-500">Coordinate meal deliveries for a family in need, one day at a time.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="app-button-primary w-full"
            >
              <Plus className="h-4 w-4" />
              Start a meal train
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
        </div>
      ) : trains.length === 0 ? (
        <div className="app-empty-state">
          <div className="app-empty-state-icon"><UtensilsCrossed /></div>
          <p className="app-empty-state-title">No meal trains yet</p>
          <p className="app-empty-state-body">Start one for a family who just had a baby, lost a loved one, or is recovering — neighbors can claim a day to bring a meal.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {trains.map((train) => (
            <MealTrainCard
              key={train.id}
              train={train}
              slots={slotsByTrain[train.id] || []}
              currentUser={currentUser}
              onClaim={handleClaim}
              onRelease={handleRelease}
              claimingSlotId={claimingSlotId}
            />
          ))}
        </div>
      )}

      <CreateMealTrainModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(payload) => createMutation.mutateAsync(payload)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
