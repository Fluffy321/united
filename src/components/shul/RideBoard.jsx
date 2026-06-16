// DEFERRED: no backing table — do not use in beta
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Plus, MapPin, Clock } from 'lucide-react';
import { dataService } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function RideBoard({ shulId, currentUser }) {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: rides = [] } = useQuery({
    queryKey: ['rides', shulId],
    queryFn: async () => {
      return await dataService.entities.RideRequest.filter({ shul_id: shulId, is_active: true });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await dataService.entities.RideRequest.create({
        ...data,
        shul_id: shulId,
        posted_by: currentUser.id,
        posted_by_name: currentUser.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      toast.success('Ride posted!');
      setShowCreate(false);
    }
  });

  const needRides = rides.filter(r => r.type === 'need_ride');
  const offeringRides = rides.filter(r => r.type === 'offering_ride');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-600" />
          Ride Board
        </h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Post Ride
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post a Ride</DialogTitle>
            </DialogHeader>
            <RideForm onSubmit={createMutation.mutate} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Need a Ride</h4>
          {needRides.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No requests</p>
          ) : (
            <div className="space-y-2">
              {needRides.map(ride => <RideCard key={ride.id} ride={ride} />)}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Offering Rides</h4>
          {offeringRides.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No offers</p>
          ) : (
            <div className="space-y-2">
              {offeringRides.map(ride => <RideCard key={ride.id} ride={ride} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RideForm({ onSubmit }) {
  const [form, setForm] = useState({
    type: 'need_ride',
    from_location: '',
    to_location: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    seats_available: 1,
    notes: ''
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="need_ride">I Need a Ride</SelectItem>
          <SelectItem value="offering_ride">I'm Offering a Ride</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="From (e.g., JFK Airport)"
        value={form.from_location}
        onChange={(e) => setForm({ ...form, from_location: e.target.value })}
        required
      />
      <Input
        placeholder="To (e.g., Woodmere)"
        value={form.to_location}
        onChange={(e) => setForm({ ...form, to_location: e.target.value })}
        required
      />
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Time</label>
          <Input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
          />
        </div>
      </div>

      {form.type === 'offering_ride' && (
        <Input
          type="number"
          placeholder="Seats available"
          value={form.seats_available}
          onChange={(e) => setForm({ ...form, seats_available: parseInt(e.target.value) })}
          min={1}
        />
      )}

      <Textarea
        placeholder="Additional notes..."
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      
      <Button type="submit" className="w-full">Post Ride</Button>
    </form>
  );
}

function RideCard({ ride }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold text-sm">{ride.posted_by_name}</p>
        <Badge variant={ride.type === 'offering_ride' ? 'default' : 'outline'}>
          {ride.type === 'offering_ride' ? `${ride.seats_available} seats` : 'Need ride'}
        </Badge>
      </div>
      <div className="space-y-1 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3" />
          <span>{ride.from_location} → {ride.to_location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>{format(parseISO(ride.date), 'MMM d')} at {ride.time}</span>
        </div>
        {ride.notes && <p className="text-xs mt-2">{ride.notes}</p>}
      </div>
    </div>
  );
}
