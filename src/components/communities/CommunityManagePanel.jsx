import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, Settings, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { COMMUNITY_TYPE_OPTIONS, getCommunityTypeKey } from '@/lib/communityTypes';
import { updateCommunity } from '@/services/entityServices';

const PRIVACY_OPTIONS = ['Public', 'Community-only', 'Private', 'Private / Anonymous'];

export default function CommunityManagePanel({ community, open, onClose, onSaved }) {
  const settings = useMemo(
    () => (community?.settings && typeof community.settings === 'object' ? community.settings : {}),
    [community?.settings]
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: community?.name || '',
    description: community?.description || community?.description_short || '',
    location: community?.location || community?.neighborhood || '',
    category: community?.category || COMMUNITY_TYPE_OPTIONS[0]?.label || 'Community',
    privacy: community?.privacy || 'Public',
    rulesText: Array.isArray(settings.rules) ? settings.rules.join('\n') : (settings.rules || community?.rules || ''),
  }));

  if (!open || typeof document === 'undefined') return null;

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const description = form.description.trim();
    if (name.length < 2) {
      toast.error('Add a community name.');
      return;
    }
    if (description.length < 8) {
      toast.error('Add a short description.');
      return;
    }

    const typeKey = getCommunityTypeKey({ category: form.category });
    const rules = form.rulesText
      .split('\n')
      .map((rule) => rule.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const updated = await updateCommunity(community.id, {
        name,
        description,
        description_short: description,
        location: form.location.trim() || null,
        neighborhood: form.location.trim() || null,
        category: form.category,
        type: typeKey,
        template_key: typeKey,
        privacy: form.privacy,
        settings: {
          ...settings,
          rules,
        },
      });
      toast.success('Community updated');
      onSaved?.(updated);
      onClose?.();
    } catch (error) {
      toast.error(error?.message || 'Could not update this community');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-lg sm:rounded-[28px]"
      >
        <header className="shrink-0 border-b border-slate-100 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Owner tools
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">Manage Community</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Update the basic profile people see when they open this community.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              aria-label="Close manage community"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-black text-slate-700">Community name</span>
              <input
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-black text-slate-700">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-black text-slate-700">Type</span>
                <select
                  value={form.category}
                  onChange={(event) => setField('category', event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
                >
                  {COMMUNITY_TYPE_OPTIONS.map((option) => (
                    <option key={option.key} value={option.label}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-black text-slate-700">Privacy</span>
                <select
                  value={form.privacy}
                  onChange={(event) => setField('privacy', event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
                >
                  {PRIVACY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-black text-slate-700">Location / neighborhood</span>
              <input
                value={form.location}
                onChange={(event) => setField('location', event.target.value)}
                placeholder="Five Towns, Cedarhurst, Woodmere..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-black text-slate-700">Rules</span>
              <textarea
                value={form.rulesText}
                onChange={(event) => setField('rulesText', event.target.value)}
                rows={4}
                placeholder="One rule per line"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
              />
            </label>
          </div>
        </section>

        <footer className="shrink-0 flex items-center gap-2 border-t border-slate-100 px-4 py-4">
          <div className="mr-auto hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex">
            <Settings className="h-4 w-4" />
            Creator-only controls
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </footer>
      </form>
    </div>,
    document.body
  );
}
