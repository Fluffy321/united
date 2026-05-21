import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardList, CheckCircle2, ChevronDown, ChevronUp, Calendar, Loader2, Lock, Clock } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const FIELD_TYPE_LABEL = {
  short_text: 'Text',
  long_text:  'Paragraph',
  select:     'Dropdown',
  checkbox:   'Checkbox',
  date:       'Date',
  phone:      'Phone',
  email:      'Email',
  number:     'Number',
};

const FORM_TYPE_META = {
  general:   { label: 'Form',     color: 'bg-blue-50 text-blue-700 border-blue-100' },
  signup:    { label: 'Signup',   color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  volunteer: { label: 'Volunteer',color: 'bg-violet-50 text-violet-700 border-violet-100' },
};

function fieldInitialValue(field) {
  if (field.field_type === 'checkbox') return false;
  return '';
}

function FieldInput({ field, value, onChange }) {
  const base = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 transition';
  if (field.field_type === 'long_text') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        rows={3}
        className={`${base} resize-none`}
      />
    );
  }
  if (field.field_type === 'select') {
    const opts = Array.isArray(field.options) ? field.options : [];
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      >
        <option value="">Select…</option>
        {opts.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  if (field.field_type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        <span className="text-sm font-semibold text-slate-700">Yes</span>
      </label>
    );
  }
  const typeMap = {
    date:   'date',
    phone:  'tel',
    email:  'email',
    number: 'number',
  };
  return (
    <input
      type={typeMap[field.field_type] || 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      className={base}
    />
  );
}

function FormCard({ form, fields, currentUser }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.id, fieldInitialValue(f)]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [claimingSlotId, setClaimingSlotId] = useState(null);

  // Check if user already submitted
  const { data: mySubmissions = [] } = useQuery({
    queryKey: ['my-form-submissions', form.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data } = await supabase
        .from('community_form_submissions')
        .select('id, submitted_at')
        .eq('form_id', form.id)
        .eq('submitter_id', currentUser.id);
      return data ?? [];
    },
    enabled: !!currentUser?.id,
  });

  // Volunteer slots + my claims (combined to avoid dependent query chaining)
  const { data: slotData = { slots: [], myClaims: [] } } = useQuery({
    queryKey: ['volunteer-slots', form.id, currentUser?.id],
    queryFn: async () => {
      const { data: slotsData } = await supabase
        .from('community_volunteer_slots')
        .select('id, label, start_time, end_time, capacity, claimed_count')
        .eq('form_id', form.id)
        .order('created_at');
      const sl = slotsData ?? [];
      if (!sl.length || !currentUser?.id) return { slots: sl, myClaims: [] };
      const { data: claimsData } = await supabase
        .from('community_volunteer_claims')
        .select('slot_id')
        .eq('submitter_id', currentUser.id)
        .in('slot_id', sl.map((s) => s.id));
      return { slots: sl, myClaims: (claimsData ?? []).map((c) => c.slot_id) };
    },
    enabled: form.form_type === 'volunteer' && !!currentUser?.id,
  });
  const { slots: volunteerSlots, myClaims: myClaimedSlotIds } = slotData;

  const handleClaimSlot = async (slotId) => {
    setClaimingSlotId(slotId);
    try {
      const { error } = await supabase.rpc('claim_volunteer_slot', { p_slot_id: slotId });
      if (error) throw error;
      toast.success('Slot claimed!');
      qc.invalidateQueries({ queryKey: ['volunteer-slots', form.id] });
    } catch (err) {
      toast.error(err.message || 'Could not claim slot');
    } finally {
      setClaimingSlotId(null);
    }
  };

  const alreadySubmitted = mySubmissions.length > 0 && !form.allow_multiple;
  const meta = FORM_TYPE_META[form.form_type] || FORM_TYPE_META.general;
  const isPastDue = form.due_date && new Date(form.due_date) < new Date();
  const sortedFields = [...fields].sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    for (const field of sortedFields) {
      if (field.required) {
        const val = answers[field.id];
        if (val === '' || val === null || val === undefined || val === false) {
          toast.error(`"${field.label}" is required`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_community_form', {
        p_form_id: form.id,
        p_answers: answers,
      });
      if (error) throw error;
      setSubmitted(true);
      setExpanded(false);
      toast.success('Submitted!');
      qc.invalidateQueries({ queryKey: ['my-form-submissions', form.id] });
    } catch (err) {
      toast.error(err.message || 'Could not submit form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => {
          if (isPastDue) return;
          if ((alreadySubmitted || submitted) && form.form_type !== 'volunteer') return;
          setExpanded((v) => !v);
        }}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ClipboardList className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-black text-slate-900">{form.title}</p>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          {form.description && (
            <p className="mt-0.5 text-[12px] font-semibold leading-4 text-slate-500 line-clamp-2">{form.description}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-400">
            {sortedFields.length > 0 && <span>{sortedFields.length} {sortedFields.length === 1 ? 'field' : 'fields'}</span>}
            {form.form_type === 'volunteer' && volunteerSlots.length > 0 && (
              <span>{volunteerSlots.length} {volunteerSlots.length === 1 ? 'slot' : 'slots'}</span>
            )}
            {form.due_date && (
              <span className={`flex items-center gap-1 ${isPastDue ? 'text-red-500' : ''}`}>
                <Calendar className="h-3 w-3" />
                {isPastDue ? 'Closed' : `Due ${new Date(form.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {isPastDue ? (
            <Lock className="h-4 w-4" />
          ) : (alreadySubmitted || submitted) && form.form_type !== 'volunteer' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {(alreadySubmitted || submitted) && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-2.5">
          <p className="text-[12px] font-black text-emerald-700">
            {submitted ? 'Submitted — thank you!' : `Already submitted on ${new Date(mySubmissions[0].submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </p>
        </div>
      )}

      {expanded && form.form_type === 'volunteer' && volunteerSlots.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Volunteer Slots</p>
          {volunteerSlots.map((slot) => {
            const remaining = slot.capacity - slot.claimed_count;
            const isClaimed = myClaimedSlotIds.includes(slot.id);
            const isFull = remaining <= 0 && !isClaimed;
            return (
              <div key={slot.id} className="flex items-center gap-3 rounded-xl bg-violet-50 border border-violet-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-900">{slot.label}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {slot.start_time && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(slot.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        {slot.end_time && `–${new Date(slot.end_time).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold ${isClaimed ? 'text-emerald-600' : isFull ? 'text-red-500' : 'text-emerald-600'}`}>
                      {isClaimed ? 'You claimed this' : isFull ? 'Full' : `${remaining} of ${slot.capacity} spot${slot.capacity !== 1 ? 's' : ''} left`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleClaimSlot(slot.id)}
                  disabled={isFull || isClaimed || claimingSlotId === slot.id}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                    isClaimed
                      ? 'bg-emerald-100 text-emerald-700 cursor-default'
                      : isFull
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95'
                  }`}
                >
                  {claimingSlotId === slot.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isClaimed ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : null}
                  {isClaimed ? 'Claimed' : isFull ? 'Full' : 'Claim'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {expanded && !alreadySubmitted && !isPastDue && !submitted && sortedFields.length > 0 && (
        <form onSubmit={handleSubmit} className="border-t border-slate-100 px-4 py-4 space-y-4">
          {sortedFields.map((field) => (
            <div key={field.id}>
              <label className="mb-1.5 block text-[12px] font-black text-slate-700">
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              <FieldInput
                field={field}
                value={answers[field.id]}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [field.id]: val }))}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={submitting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-white text-[13px] font-bold disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function CommunityFormsTab({ communityId, currentUser }) {
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['community-forms', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_forms')
        .select('*, community_form_fields(*)')
        .eq('community_id', communityId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!communityId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!forms.length) {
    return (
      <div className="pt-4">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <p className="text-[14px] font-black text-slate-900">No open forms right now</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-400 leading-5">
            When community managers publish signup sheets or forms, they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {forms.map((form) => (
        <FormCard
          key={form.id}
          form={form}
          fields={form.community_form_fields ?? []}
          currentUser={currentUser}
        />
      ))}
    </div>
  );
}
