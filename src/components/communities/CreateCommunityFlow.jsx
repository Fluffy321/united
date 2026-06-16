import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Lock, MessageCircle, Sparkles, X } from 'lucide-react';
import { COMMUNITY_TYPE_CONFIG } from '@/lib/communityTypes';
import CommunityLivePreview from './CommunityLivePreview';

const DEFAULT_RULES = 'Be respectful.\nKeep posts relevant.\nProtect member privacy.';

export default function CreateCommunityFlow({ onCreate, onClose }) {
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    privacy: 'Public',
  });

  const setField = (field, value) => {
    setError('');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (form.name.trim().length < 2) return 'Give your community a name (at least 2 characters).';
    if (!form.privacy) return 'Choose public or private.';
    return '';
  };

  const submit = (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) { setError(msg); return; }
    const tc = COMMUNITY_TYPE_CONFIG.general;
    onCreate({
      name: form.name.trim(),
      description: '',
      category: tc.label,
      typeKey: tc.key,
      community_type: tc.key,
      privacy: form.privacy,
      posting_mode: 'open',
      rules: DEFAULT_RULES.split('\n').map((r) => r.trim()).filter(Boolean),
      firstPost: '',
      settings: {
        archetype: tc.key,
        composer_mode: tc.composerMode,
        home_emphasis: tc.homeEmphasis,
        primary_tabs: ['chat', 'posts', 'members', 'about'],
      },
      coverFile: null,
      premiumLayoutRequest: null,
      premiumInterval: null,
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[100dvh] w-full max-w-[860px] overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[720px] sm:rounded-[28px]">
        <form onSubmit={submit} className="flex min-h-0 w-full flex-col lg:w-[480px] lg:flex-shrink-0">
          <header className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                  <Sparkles className="h-3 w-3" />
                  Launch a community
                </span>
                <h2 className="mt-3 text-[22px] font-black leading-tight text-slate-950">Name it. Choose privacy. Start chatting.</h2>
                <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-500">
                  Everything else can be tuned later in community settings.
                </p>
              </div>
              <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <section className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
            <div>
              <label className="mb-2 block text-[12px] font-black text-slate-900">Community name</label>
              <input
                autoFocus
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                placeholder="Example: Woodmere Shul Chat"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[16px] font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <p className="mb-2 text-[12px] font-black text-slate-900">Privacy</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'Public', label: 'Public', Icon: MessageCircle, body: 'Anyone can discover and join.' },
                  { value: 'Private', label: 'Private', Icon: Lock, body: 'Invite or link only.' },
                ].map(({ value, label, Icon, body }) => {
                  const active = form.privacy === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField('privacy', value)}
                      className={`rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                        active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                        {active && <Check className="h-4 w-4 text-blue-600" />}
                      </div>
                      <p className="mt-2 text-[13px] font-black text-slate-950">{label}</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">{body}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[13px] font-black text-emerald-900">Created with chat on</p>
              <p className="mt-1 text-[12px] font-semibold leading-5 text-emerald-700">
                You will land directly in the group chat. Description, category, posting rules, layout, modules, and premium options live in settings after creation.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800">
                {error}
              </div>
            )}
          </section>

          <footer className="shrink-0 border-t border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white hover:bg-slate-800">
                <Check className="h-4 w-4" />
                Create & Open Chat
              </button>
            </div>
          </footer>
        </form>

        <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-8 py-8 lg:flex">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">Preview</p>
          <CommunityLivePreview form={{ ...form, archetype: 'general', postingMode: 'open' }} step={4} premiumPreview={{ enabled: false, layout: {} }} />
        </div>
      </div>
    </div>,
    document.body
  );
}
