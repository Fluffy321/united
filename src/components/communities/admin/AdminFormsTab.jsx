import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FilePlus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import {
  bulkCreateCommunityFormField,
  bulkCreateCommunityVolunteerSlot,
  createCommunityForm,
  deleteCommunityForm,
  filterCommunityFormSubmission,
  filterCommunityVolunteerSlot,
  updateCommunityForm,
} from '@/services/entityServices';

// ─── Admin Forms tab ──────────────────────────────────────────────────────────

const FIELD_TYPES = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text',  label: 'Paragraph' },
  { value: 'select',     label: 'Dropdown' },
  { value: 'checkbox',   label: 'Checkbox (Yes/No)' },
  { value: 'date',       label: 'Date' },
  { value: 'phone',      label: 'Phone' },
  { value: 'email',      label: 'Email' },
  { value: 'number',     label: 'Number' },
];

const FORM_TYPES = [
  { value: 'general',   label: 'General form' },
  { value: 'signup',    label: 'Signup sheet' },
  { value: 'volunteer', label: 'Volunteer coordination' },
];

function newFieldDraft(order) {
  return { _id: crypto.randomUUID(), label: '', field_type: 'short_text', required: false, options: '', placeholder: '', field_order: order };
}

function CreateFormPanel({ communityId, currentUser, onCreated, onCancel }) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [formType, setFormType] = useState('general');
  const [dueDate, setDueDate]   = useState('');
  const [maxSubs, setMaxSubs]   = useState('');
  const [allowMulti, setMulti]  = useState(false);
  const [fields, setFields]     = useState([newFieldDraft(0)]);
  const [saving, setSaving]     = useState(false);
  const [slots, setSlots]       = useState([]);

  const addField    = () => setFields((f) => [...f, newFieldDraft(f.length)]);
  const removeField = (idx) => setFields((f) => f.filter((_, i) => i !== idx));
  const updateField = (idx, patch) => setFields((f) => f.map((x, i) => i === idx ? { ...x, ...patch } : x));
  const addSlot    = () => setSlots((s) => [...s, { _id: crypto.randomUUID(), label: '', start_time: '', end_time: '', capacity: '1' }]);
  const removeSlot = (idx) => setSlots((s) => s.filter((_, i) => i !== idx));
  const updateSlot = (idx, patch) => setSlots((s) => s.map((x, i) => i === idx ? { ...x, ...patch } : x));

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Form title is required'); return; }
    if (fields.some((f) => !f.label.trim())) { toast.error('All field labels are required'); return; }
    setSaving(true);
    try {
      const form = await createCommunityForm({
        community_id:    communityId,
        created_by:      currentUser.id,
        title:           title.trim(),
        description:     description.trim() || null,
        form_type:       formType,
        status:          'open',
        allow_multiple:  allowMulti,
        max_submissions: maxSubs ? parseInt(maxSubs, 10) : null,
        due_date:        dueDate || null,
      });
      if (fields.length) {
        const fieldRows = fields.map((f, i) => ({
          form_id:     form.id,
          label:       f.label.trim(),
          field_type:  f.field_type,
          required:    f.required,
          placeholder: f.placeholder.trim() || null,
          field_order: i,
          options: f.field_type === 'select'
            ? f.options.split(',').map((o) => o.trim()).filter(Boolean)
            : null,
        }));
        await bulkCreateCommunityFormField(fieldRows);
      }
      if (formType === 'volunteer' && slots.length > 0) {
        const slotRows = slots
          .filter((s) => s.label.trim())
          .map((s) => ({
            form_id:    form.id,
            label:      s.label.trim(),
            start_time: s.start_time || null,
            end_time:   s.end_time || null,
            capacity:   Math.max(1, parseInt(s.capacity, 10) || 1),
          }));
        if (slotRows.length > 0) {
          await bulkCreateCommunityVolunteerSlot(slotRows);
        }
      }
      toast.success('Form created');
      onCreated?.();
    } catch (err) {
      toast.error(err.message || 'Could not create form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-black text-slate-900">New form</h2>
        <button type="button" onClick={onCancel} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
      </div>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm divide-y divide-slate-50">
        <div className="px-4 py-3">
          <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Shabbaton Signup" maxLength={100}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white" />
        </div>
        <div className="px-4 py-3">
          <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="What is this form for?"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white" />
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-50">
          <div className="px-4 py-3">
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Type</label>
            <select value={formType} onChange={(e) => setFormType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400">
              {FORM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="px-4 py-3">
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-50">
          <div className="px-4 py-3">
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Max submissions</label>
            <input type="number" min="1" value={maxSubs} onChange={(e) => setMaxSubs(e.target.value)} placeholder="Unlimited"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400" />
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Allow re-submit</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Multiple per member</p>
            </div>
            <button type="button" onClick={() => setMulti((v) => !v)}>
              {allowMulti ? <ToggleRight className="h-6 w-6 text-blue-600" /> : <ToggleLeft className="h-6 w-6 text-slate-300" />}
            </button>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-black text-slate-700">Fields</p>
          <button type="button" onClick={addField} className="flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700">
            <FilePlus className="h-3.5 w-3.5" /> Add field
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field._id} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <input value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })}
                  placeholder={`Field ${idx + 1} label`} maxLength={80}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white" />
                {fields.length > 1 && (
                  <button type="button" onClick={() => removeField(idx)} className="shrink-0 text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={field.field_type} onChange={(e) => updateField(idx, { field_type: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-blue-400">
                  {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <label className="flex items-center gap-1 cursor-pointer select-none text-[12px] font-semibold text-slate-600">
                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, { required: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600" />
                  Required
                </label>
              </div>
              {field.field_type === 'select' && (
                <input value={field.options} onChange={(e) => updateField(idx, { options: e.target.value })}
                  placeholder="Option 1, Option 2, Option 3 (comma-separated)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold outline-none focus:border-blue-400 focus:bg-white" />
              )}
            </div>
          ))}
        </div>
      </div>
      {formType === 'volunteer' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-black text-slate-700">Volunteer Slots</p>
            <button type="button" onClick={addSlot} className="flex items-center gap-1 text-[12px] font-bold text-violet-600 hover:text-violet-700">
              <FilePlus className="h-3.5 w-3.5" /> Add slot
            </button>
          </div>
          {slots.length === 0 ? (
            <p className="text-[12px] font-semibold text-slate-400 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-center">
              No slots yet — add named shifts volunteers can claim.
            </p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, idx) => (
                <div key={slot._id} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={slot.label}
                      onChange={(e) => updateSlot(idx, { label: e.target.value })}
                      placeholder={`Slot ${idx + 1} label (e.g. "Setup Crew 9am")`}
                      maxLength={80}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400 focus:bg-white"
                    />
                    <button type="button" onClick={() => removeSlot(idx)} className="shrink-0 text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Start</label>
                      <input
                        type="datetime-local"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(idx, { start_time: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">End</label>
                      <input
                        type="datetime-local"
                        value={slot.end_time}
                        onChange={(e) => updateSlot(idx, { end_time: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-violet-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={slot.capacity}
                      onChange={(e) => updateSlot(idx, { capacity: e.target.value })}
                      className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-violet-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button type="button" onClick={handleCreate} disabled={saving}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-white font-bold text-[14px] disabled:opacity-60 active:scale-[0.98] transition-all">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
        {saving ? 'Creating…' : 'Create form'}
      </button>
    </div>
  );
}

function SubmissionsPanel({ form, fields, onBack, onFormUpdated }) {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-form-submissions', form.id],
    queryFn: async () => {
      return filterCommunityFormSubmission({ form_id: form.id }, '-submitted_at', 500);
    },
  });

  const { data: slotSummary = { slots: [], claimsBySubmitter: {} } } = useQuery({
    queryKey: ['admin-form-slot-summary', form.id],
    queryFn: async () => {
      if (form.form_type !== 'volunteer') return { slots: [], claimsBySubmitter: {} };
      const sl = await filterCommunityVolunteerSlot({ form_id: form.id }, 'created_at');
      if (!sl.length) return { slots: sl, claimsBySubmitter: {} };
      const { data: claimsData } = await supabase
        .from('community_volunteer_claims')
        .select('slot_id, submitter_id')
        .in('slot_id', sl.map((s) => s.id));
      const slotLabelById = Object.fromEntries(sl.map((s) => [s.id, s.label]));
      const claimsBySubmitter = {};
      for (const c of (claimsData ?? [])) {
        if (!claimsBySubmitter[c.submitter_id]) claimsBySubmitter[c.submitter_id] = [];
        claimsBySubmitter[c.submitter_id].push(slotLabelById[c.slot_id] || c.slot_id);
      }
      return { slots: sl, claimsBySubmitter };
    },
    enabled: form.form_type === 'volunteer',
  });
  const { slots: formSlots, claimsBySubmitter } = slotSummary;

  const sortedFields = [...fields].sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0));

  const toggleStatus = async () => {
    const next = form.status === 'open' ? 'closed' : 'open';
    try {
      await updateCommunityForm(form.id, { status: next, updated_at: new Date().toISOString() });
    } catch (error) { toast.error(error.message); return; }
    toast.success(next === 'open' ? 'Form reopened' : 'Form closed');
    onFormUpdated?.();
  };

  const deleteForm = async () => {
    if (!window.confirm('Delete this form and all its submissions? This cannot be undone.')) return;
    try {
      await deleteCommunityForm(form.id);
    } catch (error) { toast.error(error.message); return; }
    toast.success('Form deleted');
    onBack?.();
  };

  const exportCSV = () => {
    const hasSlots = form.form_type === 'volunteer' && formSlots.length > 0;
    const headers = ['Submitter', 'Date', ...sortedFields.map((f) => f.label), ...(hasSlots ? ['Claimed Slot(s)'] : [])];
    const rows = submissions.map((s) => [
      s.submitter_name || s.submitter_id,
      new Date(s.submitted_at).toLocaleDateString('en-US'),
      ...sortedFields.map((f) => {
        const val = s.answers?.[f.id];
        if (val === null || val === undefined) return '';
        return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val).replace(/,/g, ';');
      }),
      ...(hasSlots ? [(claimsBySubmitter[s.submitter_id] || []).join('; ') || 'None'] : []),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title.replace(/[^a-z0-9]/gi, '-')}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">← Back</button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <p className="text-[13px] font-black text-slate-900 truncate">{form.title}</p>
      </div>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-black text-slate-900 truncate">{form.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
              form.status === 'open' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
            }`}>{form.status}</span>
            <span className="text-[11px] text-slate-400">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {submissions.length > 0 && (
            <button type="button" onClick={exportCSV}
              className="flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-100 px-3 py-1.5 text-[12px] font-bold text-blue-700 hover:bg-blue-100">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          )}
          <button type="button" onClick={toggleStatus}
            className={`rounded-xl border px-3 py-1.5 text-[12px] font-bold ${
              form.status === 'open' ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
            }`}>{form.status === 'open' ? 'Close' : 'Reopen'}</button>
        </div>
      </div>
      {form.form_type === 'volunteer' && formSlots.length > 0 && (
        <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-violet-700">Slot Signups</p>
          {formSlots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-800">{slot.label}</span>
              <span className={`text-[12px] font-semibold ${slot.claimed_count >= slot.capacity ? 'text-red-500' : 'text-emerald-600'}`}>
                {slot.claimed_count} / {slot.capacity}
              </span>
            </div>
          ))}
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
      ) : submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
          <Eye className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-[13px] font-black text-slate-700">No submissions yet</p>
          <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Responses will appear here as members submit.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => {
            const submitterSlots = claimsBySubmitter[s.submitter_id] ?? [];
            return (
              <div key={s.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-black text-slate-900">{s.submitter_name || 'Member'}</p>
                  <p className="text-[11px] text-slate-400">{new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="space-y-1">
                  {submitterSlots.length > 0 && (
                    <div className="flex gap-2 text-[12px]">
                      <span className="font-black text-violet-500 shrink-0">Slot:</span>
                      <span className="font-semibold text-slate-800">{submitterSlots.join(', ')}</span>
                    </div>
                  )}
                  {sortedFields.map((field) => {
                    const val = s.answers?.[field.id];
                    if (val === null || val === undefined || val === '') return null;
                    return (
                      <div key={field.id} className="flex gap-2 text-[12px]">
                        <span className="font-black text-slate-500 shrink-0">{field.label}:</span>
                        <span className="font-semibold text-slate-800">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button type="button" onClick={deleteForm}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-red-500 hover:text-red-600 hover:underline">
        <Trash2 className="h-3.5 w-3.5" /> Delete this form
      </button>
    </div>
  );
}

export default function AdminFormsTab({ communityId, community, currentUser }) {
  const [view, setView] = useState(null);

  const { data: forms = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-forms', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_forms')
        .select('*, community_form_fields(*)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  if (!community?.allow_forms) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-[15px] font-black text-slate-700">Forms & Signups is not enabled</p>
        <p className="mt-1 text-[13px] font-semibold text-slate-400 leading-5 max-w-xs mx-auto">
          Enable the Forms module in Settings → Modules to start creating forms.
        </p>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <CreateFormPanel
        communityId={communityId}
        currentUser={currentUser}
        onCreated={() => { refetch(); setView(null); }}
        onCancel={() => setView(null)}
      />
    );
  }

  if (view && view !== 'new') {
    return (
      <SubmissionsPanel
        form={view.form}
        fields={view.fields}
        onBack={() => setView(null)}
        onFormUpdated={() => { refetch(); setView(null); }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <button type="button" onClick={() => setView('new')}
        className="flex w-full items-center justify-center gap-2 h-10 rounded-2xl bg-slate-950 text-white font-bold text-[13px] active:scale-95 transition-all hover:bg-slate-800">
        <FilePlus className="h-4 w-4" /> New form
      </button>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
      ) : forms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-[13px] font-black text-slate-700">No forms yet</p>
          <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Create your first signup sheet, survey, or volunteer form.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => {
            const fields = form.community_form_fields ?? [];
            return (
              <button key={form.id} type="button" onClick={() => setView({ form, fields })}
                className="w-full text-left rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 hover:bg-slate-50 active:scale-[0.99] transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-black text-slate-900 truncate">{form.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        form.status === 'open' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}>{form.status}</span>
                      <span className="text-[11px] text-slate-400">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
                      {form.due_date && (
                        <span className="text-[11px] text-slate-400">
                          Due {new Date(form.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
