// DEFERRED: no backing table — do not use in beta
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UtensilsCrossed, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addDays, parseISO } from 'date-fns';
import { bulkCreateMealSlot, createMealTrainRequest, filterMealSlot, filterMealTrainRequest, updateMealSlot } from '@/services/entityServices';

export default function MealTrainBoard({ shulId, currentUser, isAdmin }) {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: mealTrains = [] } = useQuery({
    queryKey: ['meal-trains', shulId],
    queryFn: async () => {
      return await filterMealTrainRequest({ shul_id: shulId, is_active: true });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const train = await createMealTrainRequest({
        ...data,
        shul_id: shulId,
        created_by: currentUser.id
      });

      // Auto-create meal slots
      const start = parseISO(data.start_date);
      const end = parseISO(data.end_date);
      const slots = [];
      
      for (let d = start; d <= end; d = addDays(d, 1)) {
        slots.push({
          meal_train_id: train.id,
          date: format(d, 'yyyy-MM-dd'),
          meal_type: 'dinner'
        });
      }
      
      await bulkCreateMealSlot(slots);
      return train;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-trains'] });
      toast.success('Meal train created!');
      setShowCreate(false);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-orange-600" />
          Meal Train
        </h3>
        {isAdmin && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Meal Train
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Meal Train</DialogTitle>
              </DialogHeader>
              <MealTrainForm onSubmit={createMutation.mutate} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {mealTrains.length === 0 ? (
        <p className="text-center text-slate-500 py-8">No active meal trains</p>
      ) : (
        <div className="space-y-4">
          {mealTrains.map(train => (
            <MealTrainCard key={train.id} train={train} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
}

function MealTrainForm({ onSubmit }) {
  const [form, setForm] = useState({
    family_name: '',
    reason: '',
    dietary_notes: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 7), 'yyyy-MM-dd')
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input
        placeholder="Family Name"
        value={form.family_name}
        onChange={(e) => setForm({ ...form, family_name: e.target.value })}
        required
      />
      <Input
        placeholder="Reason (e.g., New baby, Recovery)"
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
      />
      <Textarea
        placeholder="Dietary restrictions or notes..."
        value={form.dietary_notes}
        onChange={(e) => setForm({ ...form, dietary_notes: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full">Create Meal Train</Button>
    </form>
  );
}

function MealTrainCard({ train, currentUser }) {
  const queryClient = useQueryClient();
  
  const { data: slots = [] } = useQuery({
    queryKey: ['meal-slots', train.id],
    queryFn: async () => {
      return await filterMealSlot({ meal_train_id: train.id });
    }
  });

  const claimMutation = useMutation({
    mutationFn: async (slotId) => {
      await updateMealSlot(slotId, {
        is_claimed: true,
        claimed_by: currentUser.id,
        claimed_by_name: currentUser.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-slots'] });
      toast.success('Meal slot claimed!');
    }
  });

  const availableSlots = slots.filter(s => !s.is_claimed);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-lg">{train.family_name}</h4>
          {train.reason && <p className="text-sm text-slate-600">{train.reason}</p>}
          {train.dietary_notes && (
            <p className="text-xs text-slate-500 mt-1">🍽️ {train.dietary_notes}</p>
          )}
        </div>
        <Badge variant="outline">
          {availableSlots.length} slots open
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {slots.slice(0, 6).map(slot => (
          <div key={slot.id} className="border border-slate-200 rounded p-2 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{format(parseISO(slot.date), 'MMM d')}</span>
              {slot.is_claimed && (
                <p className="text-xs text-green-600 mt-0.5">✓ {slot.claimed_by_name}</p>
              )}
            </div>
            {!slot.is_claimed && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => claimMutation.mutate(slot.id)}
              >
                Claim
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
