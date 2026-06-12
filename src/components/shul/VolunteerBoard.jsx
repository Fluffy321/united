// DEFERRED: no backing table — do not use in beta
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandHeart, Plus, Users, Check } from 'lucide-react';
import { dataService } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function VolunteerBoard({ shulId, currentUser, isAdmin }) {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: opportunities = [] } = useQuery({
    queryKey: ['volunteer-opps', shulId],
    queryFn: async () => {
      return await dataService.entities.VolunteerOpportunity.filter({ 
        shul_id: shulId, 
        is_active: true 
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await dataService.entities.VolunteerOpportunity.create({
        ...data,
        shul_id: shulId,
        created_by: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-opps'] });
      toast.success('Volunteer opportunity posted!');
      setShowCreate(false);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <HandHeart className="w-5 h-5 text-purple-600" />
          Volunteer Opportunities
        </h3>
        {isAdmin && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Volunteer Opportunity</DialogTitle>
              </DialogHeader>
              <VolunteerForm onSubmit={createMutation.mutate} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {opportunities.length === 0 ? (
        <p className="text-center text-slate-500 py-8">No volunteer opportunities</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {opportunities.map(opp => (
            <VolunteerCard key={opp.id} opportunity={opp} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
}

function VolunteerForm({ onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'events',
    date: '',
    time: '',
    slots_needed: 1
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input
        placeholder="Title (e.g., Kiddush Setup)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <Textarea
        placeholder="Description..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="kiddush">Kiddush</SelectItem>
          <SelectItem value="youth">Youth</SelectItem>
          <SelectItem value="events">Events</SelectItem>
          <SelectItem value="chesed">Chesed</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Time</label>
          <Input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </div>
      </div>

      <Input
        type="number"
        placeholder="Volunteers needed"
        value={form.slots_needed}
        onChange={(e) => setForm({ ...form, slots_needed: parseInt(e.target.value) })}
        min={1}
      />
      
      <Button type="submit" className="w-full">Create Opportunity</Button>
    </form>
  );
}

function VolunteerCard({ opportunity, currentUser }) {
  const queryClient = useQueryClient();

  const { data: signups = [] } = useQuery({
    queryKey: ['volunteer-signups', opportunity.id],
    queryFn: async () => {
      return await dataService.entities.VolunteerSignup.filter({ opportunity_id: opportunity.id });
    }
  });

  const signupMutation = useMutation({
    mutationFn: async () => {
      await dataService.entities.VolunteerSignup.create({
        opportunity_id: opportunity.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name
      });
      await dataService.entities.VolunteerOpportunity.update(opportunity.id, {
        slots_filled: (opportunity.slots_filled || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-signups'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-opps'] });
      toast.success('Signed up!');
    }
  });

  const alreadySignedUp = signups.some(s => s.user_id === currentUser?.id);
  const isFull = (opportunity.slots_filled || 0) >= opportunity.slots_needed;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <Badge className="mb-2 capitalize">{opportunity.category}</Badge>
          <h4 className="font-bold">{opportunity.title}</h4>
          {opportunity.description && (
            <p className="text-sm text-slate-600 mt-1">{opportunity.description}</p>
          )}
        </div>
      </div>

      {(opportunity.date || opportunity.time) && (
        <p className="text-sm text-slate-500 mt-2">
          {opportunity.date && format(parseISO(opportunity.date), 'MMM d')}
          {opportunity.time && ` at ${opportunity.time}`}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-slate-500" />
          <span>{opportunity.slots_filled || 0}/{opportunity.slots_needed}</span>
        </div>
        
        {alreadySignedUp ? (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Check className="w-3 h-3 mr-1" />
            Signed up
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={() => signupMutation.mutate()}
            disabled={isFull}
          >
            {isFull ? 'Full' : 'Sign Up'}
          </Button>
        )}
      </div>
    </div>
  );
}
