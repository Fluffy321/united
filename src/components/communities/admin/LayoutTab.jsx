import React, { useState } from 'react';
import { toast } from 'sonner';
import { Crown, ChevronUp, ChevronDown, Loader2, Save } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { getCommunityTypeConfig, getCommunityTabLabel } from '@/lib/communityTypes';
import { isCommunityPremium } from '@/lib/communityPlans';

// ─── Layout tab ───────────────────────────────────────────────────────────────

const LAYOUT_PRESETS = [
  {
    key: 'balanced',
    label: 'Balanced',
    desc: 'Default for your type. Equal blend of feed and features.',
    icon: '⚖️',
    settings: {},
  },
  {
    key: 'social',
    label: 'Social-first',
    desc: 'Conversation and updates front and center.',
    icon: '💬',
    settings: { composerMode: 'message', homeSections: ['digest', 'importantNow', 'composer', 'personalization', 'feed', 'adminTools'] },
  },
  {
    key: 'announcements',
    label: 'Announcements-forward',
    desc: 'Critical updates and events lead the home.',
    icon: '📢',
    settings: { homeSections: ['importantNow', 'digest', 'personalization', 'adminTools', 'composer', 'feed'] },
  },
  {
    key: 'action',
    label: 'Action-first',
    desc: 'Needs, requests, and help front and center.',
    icon: '🤝',
    settings: { composerMode: 'chesed', homeSections: ['importantNow', 'personalization', 'composer', 'feed', 'digest', 'adminTools'] },
  },
];

const DEFAULT_SECTION_ORDER = ['digest', 'importantNow', 'adminTools', 'personalization', 'composer', 'feed'];
const REQUIRED_SECTIONS = new Set(['composer', 'feed']);

const HOME_SECTION_LABELS = {
  digest: 'Since Last Visit digest',
  importantNow: 'Important Right Now strip',
  adminTools: 'Admin quick tools',
  personalization: 'For You module',
  composer: 'Post composer',
  feed: 'Community feed',
};

const COMPOSER_MODES = [
  { key: 'message', label: 'Conversational', desc: 'Simple message-style post' },
  { key: 'post', label: 'Standard post', desc: 'Post with optional title' },
  { key: 'official', label: 'Official update', desc: 'Admin-only announcement style' },
  { key: 'chesed', label: 'Help requests', desc: 'Request / Offer help buttons' },
];

export default function LayoutTab({ community, communityId, onCommunityUpdated }) {
  const isPremium = isCommunityPremium(community);
  const typeConfig = getCommunityTypeConfig(community || {});

  const existingLayout = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.layout || {})
    : {};

  const [localLayout, setLocalLayout] = useState(() => ({
    preset: existingLayout.preset || 'balanced',
    primaryTabs: existingLayout.primaryTabs || null,
    homeSections: existingLayout.homeSections?.length ? existingLayout.homeSections : [...DEFAULT_SECTION_ORDER],
    hiddenSections: existingLayout.hiddenSections || [],
    composerMode: existingLayout.composerMode || null,
  }));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (patch) => {
    setLocalLayout((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const applyPreset = (presetKey) => {
    const preset = LAYOUT_PRESETS.find((p) => p.key === presetKey) || LAYOUT_PRESETS[0];
    const ps = preset.settings || {};
    update({
      preset: presetKey,
      homeSections: ps.homeSections ? [...ps.homeSections] : [...DEFAULT_SECTION_ORDER],
      composerMode: ps.composerMode || null,
      primaryTabs: null,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newSettings = { ...(community?.settings || {}), layout: localLayout };
      const { data, error } = await supabase
        .from('communities')
        .update({ settings: newSettings })
        .eq('id', communityId)
        .select()
        .single();
      if (error) throw error;
      onCommunityUpdated?.(data);
      setDirty(false);
      toast.success('Layout saved');
    } catch {
      toast.error('Could not save layout');
    } finally {
      setSaving(false);
    }
  };

  const currentPrimaryTabs = localLayout.primaryTabs || typeConfig.primaryTabs || ['home', 'posts', 'members', 'about'];
  const hiddenSet = new Set(localLayout.hiddenSections);

  const moveSectionUp = (i) => {
    if (i === 0) return;
    const s = [...localLayout.homeSections];
    [s[i - 1], s[i]] = [s[i], s[i - 1]];
    update({ homeSections: s });
  };

  const moveSectionDown = (i) => {
    if (i === localLayout.homeSections.length - 1) return;
    const s = [...localLayout.homeSections];
    [s[i], s[i + 1]] = [s[i + 1], s[i]];
    update({ homeSections: s });
  };

  const toggleSection = (key) => {
    if (REQUIRED_SECTIONS.has(key)) return;
    const hidden = new Set(localLayout.hiddenSections);
    if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
    update({ hiddenSections: [...hidden] });
  };

  const movePrimaryTabUp = (i) => {
    if (i === 0) return;
    const t = [...currentPrimaryTabs];
    [t[i - 1], t[i]] = [t[i], t[i - 1]];
    update({ primaryTabs: t });
  };

  const movePrimaryTabDown = (i) => {
    if (i === currentPrimaryTabs.length - 1) return;
    const t = [...currentPrimaryTabs];
    [t[i], t[i + 1]] = [t[i + 1], t[i]];
    update({ primaryTabs: t });
  };

  const togglePrimaryTab = (tab) => {
    if (tab === 'home') return;
    const current = [...currentPrimaryTabs];
    if (current.includes(tab)) {
      if (current.length <= 2) return;
      update({ primaryTabs: current.filter((t) => t !== tab) });
    } else {
      if (current.length >= 5) return;
      update({ primaryTabs: [...current, tab] });
    }
  };

  const previewMoreTabs = currentPrimaryTabs.length < 5
    ? ['posts', 'events', 'resources', 'members', 'about', 'announcements']
        .filter((t) => !currentPrimaryTabs.includes(t))
        .slice(0, 2)
    : [];

  return (
    <div className="pb-28">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-[17px] font-black text-slate-950">Community Layout</h2>
        <p className="text-[13px] font-semibold text-slate-500 mt-0.5 leading-5">
          Choose what members see first and how your community works.
        </p>
      </div>

      {/* Preset selector */}
      <section className="px-4 pb-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Layout preset</p>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset.key)}
              className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                localLayout.preset === preset.key
                  ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-xl mb-1.5">{preset.icon}</div>
              <p className="text-[13px] font-black text-slate-900 leading-tight">{preset.label}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-4">{preset.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Primary navigation */}
      <section className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex-1">Primary navigation</p>
          {!isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              <Crown className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>
        {isPremium ? (
          <div className="space-y-1.5">
            {currentPrimaryTabs.map((tab, i) => (
              <div key={tab} className="flex items-center gap-2 rounded-xl bg-white border border-slate-100 px-3 py-2">
                <span className="flex-1 text-[13px] font-semibold text-slate-800">{getCommunityTabLabel(tab)}</span>
                {tab !== 'home' && (
                  <button type="button" onClick={() => togglePrimaryTab(tab)} className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex-shrink-0">
                    Remove
                  </button>
                )}
                <div className="flex gap-0.5 flex-shrink-0">
                  <button type="button" onClick={() => movePrimaryTabUp(i)} disabled={i === 0} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 disabled:opacity-30 hover:text-slate-700">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => movePrimaryTabDown(i)} disabled={i === currentPrimaryTabs.length - 1} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 disabled:opacity-30 hover:text-slate-700">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {currentPrimaryTabs.length < 5 && (
              <div className="mt-2 pt-1">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Add tab (max 5 primary)</p>
                <div className="flex flex-wrap gap-1.5">
                  {['posts', 'events', 'resources', 'members', 'about', 'announcements', 'questions', 'discussions', 'openNeeds', 'chat']
                    .filter((t) => !currentPrimaryTabs.includes(t))
                    .map((t) => (
                      <button key={t} type="button" onClick={() => togglePrimaryTab(t)}
                        className="h-7 px-2.5 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        + {getCommunityTabLabel(t)}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[13px] font-semibold text-slate-600 leading-5">
              Choose which tabs appear in primary navigation, in what order, and which overflow to More.
            </p>
            <p className="text-[12px] font-bold text-blue-600 mt-2">Upgrade to customize navigation →</p>
          </div>
        )}
      </section>

      {/* Home sections */}
      <section className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex-1">Home sections</p>
          {!isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              <Crown className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>
        {isPremium ? (
          <div className="space-y-1.5">
            {localLayout.homeSections.map((key, i) => {
              const isHidden = hiddenSet.has(key);
              const isRequired = REQUIRED_SECTIONS.has(key);
              return (
                <div key={key} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-opacity ${isHidden ? 'opacity-50 bg-slate-50 border-slate-100' : 'bg-white border-slate-100'}`}>
                  <button type="button" onClick={() => toggleSection(key)} disabled={isRequired} className="flex-shrink-0 disabled:opacity-40">
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${!isHidden ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}`}>
                      {!isHidden && <span className="text-white text-[8px] font-black leading-none">✓</span>}
                    </div>
                  </button>
                  <span className="flex-1 text-[12px] font-semibold text-slate-800">
                    {HOME_SECTION_LABELS[key] || key}
                    {isRequired && <span className="ml-1 text-[10px] text-slate-400">(required)</span>}
                  </span>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button type="button" onClick={() => moveSectionUp(i)} disabled={i === 0} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 disabled:opacity-30 hover:text-slate-700">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveSectionDown(i)} disabled={i === localLayout.homeSections.length - 1} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 disabled:opacity-30 hover:text-slate-700">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[13px] font-semibold text-slate-600 leading-5">
              Show, hide, and reorder the modules on your community home: digest, highlights, For You, composer, and feed.
            </p>
            <p className="text-[12px] font-bold text-blue-600 mt-2">Upgrade to customize home sections →</p>
          </div>
        )}
      </section>

      {/* Composer style */}
      <section className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex-1">Composer style</p>
          {!isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              <Crown className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>
        {isPremium ? (
          <div className="grid grid-cols-2 gap-2">
            {COMPOSER_MODES.map((mode) => {
              const isActive = (localLayout.composerMode || typeConfig.composerMode || 'message') === mode.key;
              return (
                <button key={mode.key} type="button" onClick={() => update({ composerMode: mode.key })}
                  className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${isActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <p className="text-[13px] font-black text-slate-900">{mode.label}</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-4">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[13px] font-semibold text-slate-600 leading-5">
              Switch the composer between conversational, standard post, official-only, or chesed help-request mode.
            </p>
            <p className="text-[12px] font-bold text-blue-600 mt-2">Upgrade to customize the composer →</p>
          </div>
        )}
      </section>

      {/* Live preview */}
      <section className="border-t border-slate-100 px-4 py-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Preview</p>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">Primary nav</p>
            <div className="flex flex-wrap gap-1.5">
              {currentPrimaryTabs.map((tab) => (
                <span key={tab} className="h-7 px-3 rounded-lg bg-blue-50 text-[12px] font-bold text-blue-700 flex items-center">
                  {getCommunityTabLabel(tab)}
                </span>
              ))}
              {previewMoreTabs.map((tab) => (
                <span key={tab} className="h-7 px-3 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-500 flex items-center">
                  {getCommunityTabLabel(tab)}
                </span>
              ))}
              <span className="h-7 px-3 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-400 flex items-center">More ···</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">Home stack</p>
            <div className="space-y-1">
              {localLayout.homeSections.filter((s) => !hiddenSet.has(s)).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 w-4 text-right">{i + 1}</span>
                  <span className="h-6 flex-1 px-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-600 flex items-center">
                    {HOME_SECTION_LABELS[s] || s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-100 bg-white px-4 py-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="w-full h-12 rounded-2xl bg-[#2563EB] text-white font-black text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : dirty ? 'Save Layout' : 'Layout Saved'}
        </button>
      </div>
    </div>
  );
}
