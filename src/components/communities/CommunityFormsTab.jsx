import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardList, CheckCircle2, ChevronDown, ChevronUp, Calendar, Loader2, Lock } from 'lucide-react';
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
        onClick={() => !alreadySubmitted && !isPastDue && !submitted && setExpanded((v) => !v)}
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
            <span>{sortedFields.length} {sortedFields.length === 1 ? 'field' : 'fields'}</span>
            {form.due_date && (
              <span className={`flex items-center gap-1 ${isPastDue ? 'text-red-500' : ''}`}>
                <Calendar className="h-3 w-3" />
                {isPastDue ? 'Closed' : `Due ${new Date(form.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {(alreadySubmitted || submitted) ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : isPastDue ? (
            <Lock className="h-4 w-4" />
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

      {expanded && !alreadySubmitted && !isPastDue && !submitted && (
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
