import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { EyeOff, Sparkles, X } from 'lucide-react';

export default function CreateCommunityForm({ categories, communityTypes, onCreate, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Lifestyle');
  const [communityType, setCommunityType] = useState('user');
  const [privacy, setPrivacy] = useState('Public');
  const [location, setLocation] = useState('');
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [hideMembership, setHideMembership] = useState(false);
  const [rulesText, setRulesText] = useState('Be respectful.\nKeep posts relevant.\nProtect private information.');

  const canCreate = name.trim().length > 1 && description.trim().length > 12;

  const submit = (event) => {
    event.preventDefault();
    if (!canCreate) return;

    onCreate({
      name: name.trim(),
      description: description.trim(),
      category,
      communityType,
      privacy,
      location: location.trim() || 'Local community',
      supportsIncognito: privacy === 'Private / Anonymous' || hideMembership,
      supportsAnonymousPosting: allowAnonymous,
      hideMembershipDefault: privacy === 'Private / Anonymous' || hideMembership,
      identityTags: [category, privacy, communityType === 'lifestyle' ? 'Lifestyle' : 'Member-led'],
      rules: rulesText
        .split('\n')
        .map((rule) => rule.trim())
        .filter(Boolean),
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <form onSubmit={submit} className="flex max-h-[calc(100dvh-24px)] w-full max-w-[500px] flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl">
        <div className="shrink-0 bg-gradient-to-br from-blue-700 via-slate-900 to-emerald-700 px-4 py-3 text-white sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                <Sparkles className="h-3.5 w-3.5" />
                Identity network
              </p>
              <h2 className="text-lg font-black leading-tight text-white sm:text-xl">Create a Community</h2>
              <p className="mt-0.5 max-w-md text-[12px] font-semibold leading-4 text-white/90">
                Build a real social circle around lifestyle, values, support, local needs, or something people want to be part of.
              </p>
            </div>
            <button type="button" onClick={onClose} className="mobile-touch rounded-xl bg-white/12 p-2 text-white transition hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-2.5 overflow-y-auto overscroll-contain px-4 py-3 sm:grid-cols-2 sm:px-5">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-black text-slate-900">Community name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
	              placeholder="Example: Woodmere Runners, Shabbos Hosts, Sephardi Homes"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-black text-slate-900">Community type</span>
            <select
              value={communityType}
              onChange={(event) => {
                const nextType = event.target.value;
                setCommunityType(nextType);
                if (nextType === 'support') {
                  setCategory('Support');
                  setPrivacy('Private / Anonymous');
                  setAllowAnonymous(true);
                  setHideMembership(true);
                } else if (category === 'Support') {
                  setCategory(categories[0] || 'Lifestyle');
                  setPrivacy('Public');
                  setAllowAnonymous(false);
                  setHideMembership(false);
                }
              }}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="user">User-created</option>
              <option value="lifestyle">Lifestyle / interest</option>
              <option value="support">Private support space</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-black text-slate-900">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
              {communityType === 'support' && <option value="Support">Support</option>}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-black text-slate-900">Privacy</span>
            <select
              value={privacy}
              onChange={(event) => setPrivacy(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Public">Public</option>
              <option value="Community-only">Community-only</option>
              <option value="Private">Private</option>
              <option value="Private / Anonymous">Private / Anonymous</option>
            </select>
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-2">
              <EyeOff className="mt-0.5 h-4 w-4 text-violet-600" />
              <div>
                <p className="text-[12px] font-black text-slate-900">Privacy defaults</p>
                <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">For sensitive spaces, members can join quietly and post without exposing identity.</p>
              </div>
            </div>
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-black text-slate-900">Location or neighborhood</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Example: Cedarhurst, Woodmere, Online"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            <ToggleRow
              title="Hide membership from profiles"
              checked={hideMembership || privacy === 'Private / Anonymous'}
              onChange={setHideMembership}
              disabled={privacy === 'Private / Anonymous'}
            />
            <ToggleRow
              title="Allow anonymous posting"
              checked={allowAnonymous}
              onChange={setAllowAnonymous}
            />
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-black text-slate-900">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
	              placeholder="Who should join, what will they get, and what kind of posts belong here?"
              rows={2}
              className="h-[68px] w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold leading-5 text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-black text-slate-900">Rules one per line</span>
            <textarea
              value={rulesText}
              onChange={(event) => setRulesText(event.target.value)}
              rows={2}
              className="h-[68px] w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold leading-5 text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <button type="button" onClick={onClose} className="h-10 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-black text-slate-800 transition hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canCreate}
            className="h-10 flex-1 rounded-xl bg-blue-700 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
          >
            Create
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function ToggleRow({ title, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition ${disabled ? 'opacity-80' : 'hover:bg-slate-100 active:scale-[0.99]'}`}
    >
      <span className="text-[12px] font-black text-slate-800">{title}</span>
      <span className={`relative h-6 w-10 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </span>
    </button>
  );
}
