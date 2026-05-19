import React, { createPortal, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Eye, Lock, Sparkles, X } from 'lucide-react';
import { COMMUNITY_TYPE_CONFIG } from '@/lib/communityTypes';
import CommunityLivePreview from './CommunityLivePreview';

// ── Premium preview constants ─────────────────────────────────────────────────

const TAB_ARRANGEMENTS = {
  neighborhood: [
    { label: 'Default',      tabs: ['home', 'posts', 'events', 'members'] },
    { label: 'Feed-forward', tabs: ['home', 'posts', 'members', 'about'] },
    { label: 'Events-first', tabs: ['home', 'events', 'posts', 'members'] },
  ],
  shul: [
    { label: 'Default',        tabs: ['home', 'events', 'resources', 'members'] },
    { label: 'Announce-first', tabs: ['home', 'announcements', 'events', 'members'] },
    { label: 'Community',      tabs: ['home', 'posts', 'events', 'members'] },
  ],
  chesed: [
    { label: 'Default',    tabs: ['home', 'openNeeds', 'posts', 'members'] },
    { label: 'Needs-first',tabs: ['home', 'openNeeds', 'members', 'about'] },
    { label: 'Community',  tabs: ['home', 'posts', 'openNeeds', 'members'] },
  ],
  parents: [
    { label: 'Default',     tabs: ['home', 'questions', 'events', 'members'] },
    { label: 'Q&A-forward', tabs: ['home', 'questions', 'members', 'about'] },
    { label: 'Events-first',tabs: ['home', 'events', 'questions', 'members'] },
  ],
  learning: [
    { label: 'Default',          tabs: ['home', 'discussions', 'resources', 'members'] },
    { label: 'Resources-first',  tabs: ['home', 'resources', 'discussions', 'members'] },
    { label: 'Discussion-first', tabs: ['home', 'discussions', 'posts', 'members'] },
  ],
  events: [
    { label: 'Default',       tabs: ['home', 'events', 'posts', 'members'] },
    { label: 'Calendar-first',tabs: ['home', 'events', 'members', 'about'] },
    { label: 'Community',     tabs: ['home', 'posts', 'events', 'members'] },
  ],
  marketplace: [
    { label: 'Default',       tabs: ['home', 'listings', 'posts', 'members'] },
    { label: 'Listings-first',tabs: ['home', 'listings', 'members', 'about'] },
    { label: 'Community',     tabs: ['home', 'posts', 'listings', 'members'] },
  ],
  general: [
    { label: 'Default',     tabs: ['home', 'posts', 'members', 'about'] },
    { label: 'Community',   tabs: ['home', 'posts', 'chat', 'members'] },
    { label: 'Open feed',   tabs: ['home', 'posts', 'members', 'about'] },
  ],
};

const HOME_EMPHASIS_OPTIONS = [
  { key: 'feed',          label: 'Feed-first',        emoji: '💬', desc: 'Conversations and updates lead the home' },
  { key: 'announcements', label: 'Announce-first',    emoji: '📣', desc: 'Official posts sit above the feed' },
  { key: 'events',        label: 'Events-forward',    emoji: '📅', desc: 'Upcoming events appear at the top' },
  { key: 'resources',     label: 'Resources-forward', emoji: '📎', desc: 'Links and resources are most prominent' },
  { key: 'chesed',        label: 'Action-forward',    emoji: '🤝', desc: 'Needs and help requests lead' },
];

const EMPHASIS_BY_TYPE = {
  neighborhood: ['feed', 'events'],
  shul:         ['announcements', 'events', 'feed'],
  chesed:       ['chesed', 'feed'],
  parents:      ['feed', 'events'],
  learning:     ['resources', 'feed'],
  events:       ['events', 'feed'],
  marketplace:  ['feed'],
  general:      ['feed'],
};

const PREVIEW_COMPOSER_MODES = [
  { key: 'message',  label: 'Conversational', emoji: '💬' },
  { key: 'post',     label: 'Posts & Content', emoji: '📝' },
  { key: 'official', label: 'Official Updates', emoji: '📣' },
];

const TAB_LABELS_SHORT = {
  home: 'Home', posts: 'Posts', events: 'Events', members: 'Members',
  openNeeds: 'Needs', questions: 'Q&A', discussions: 'Topics',
  resources: 'Resources', about: 'About', listings: 'Listings',
  announcements: 'Announce', chat: 'Chat',
};

const DEFAULT_RULES = 'Be respectful.\nKeep posts relevant.\nProtect member privacy.';

const ARCHETYPES = [
  { key: 'neighborhood', emoji: '🏘️', title: 'Neighborhood Hub', description: 'Local updates, recommendations, and neighbor help.' },
  { key: 'shul',         emoji: '🕍', title: 'Shul / Organization', description: 'Announcements, events, resources, and community life.' },
  { key: 'chesed',       emoji: '🙏', title: 'Chesed Network', description: 'Help requests, offers, and mitzvah coordination.' },
  { key: 'parents',      emoji: '👨‍👩‍👧', title: 'Parents & Families', description: 'Questions, recommendations, and family support.' },
  { key: 'learning',     emoji: '📚', title: 'Learning Community', description: 'Torah discussion, shiurim, and shared resources.' },
  { key: 'events',       emoji: '📅', title: 'Events & Social', description: 'Gatherings, happenings, and social connection.' },
  { key: 'marketplace',  emoji: '🏪', title: 'Marketplace', description: 'Listings, recommendations, and local exchange.' },
  { key: 'general',      emoji: '💬', title: 'General / Other', description: 'A flexible space for any Jewish community purpose.' },
];

const SMART_FIRST_POST = {
  neighborhood: "Welcome neighbors! This is our local hub for updates, questions, and nearby connections. Say hello! 👋",
  shul:         "Welcome to our community hub! We'll post Shabbos times, events, and important announcements here.",
  chesed:       "Welcome to our chesed network! Post your needs, offer your help, and let's build something beautiful together.",
  parents:      "Welcome families! This is your go-to for school questions, babysitter recommendations, and local parenting tips.",
  learning:     "Welcome! Share a dvar Torah, shiur recommendation, or learning question to get the conversation started.",
  events:       "Welcome! This is where we'll share upcoming events, gatherings, and social plans. What are you looking forward to?",
  marketplace:  "Welcome to the community marketplace! Post listings, recommendations, and local gems you want to share.",
  general:      "Welcome everyone! This is your space to connect, share, and build community together. Say hello! 👋",
};

const STEPS = ['Name', 'Type', 'Make it yours', 'Shape it', 'Launch'];

export default function CreateCommunityFlow({ onCreate, onClose }) {
  const [step, setStep] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [error, setError] = useState('');
  const [premiumPreviewEnabled, setPremiumPreviewEnabled] = useState(false);
  const [premiumPreviewLayout, setPremiumPreviewLayout] = useState({});
  const [premiumUpgradeRequested, setPremiumUpgradeRequested] = useState(false);
  const [premiumInterval, setPremiumInterval] = useState('monthly');
  const [form, setForm] = useState({
    name: '',
    archetype: '',
    privacy: 'Public',
    postingMode: 'open',
    description: '',
    rulesText: DEFAULT_RULES,
    firstContent: '',
  });

  const setField = (field, value) => {
    setError('');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setPremiumField = (key, val) => setPremiumPreviewLayout((prev) => ({ ...prev, [key]: val }));
  const togglePremiumPreview = () => {
    setPremiumPreviewEnabled((v) => {
      if (v) {
        setPremiumPreviewLayout({});
        setPremiumUpgradeRequested(false);
      }
      return !v;
    });
  };
  const handleUpgradeRequest = (interval) => {
    setPremiumInterval(interval);
    setPremiumUpgradeRequested(true);
  };
  const handleUpgradeClear = () => setPremiumUpgradeRequested(false);

  const typeConfig = form.archetype ? COMMUNITY_TYPE_CONFIG[form.archetype] : null;
  const progress = ((step + 1) / STEPS.length) * 100;

  const validate = () => {
    if (step === 0 && form.name.trim().length < 2) return 'Give your community a name (at least 2 characters).';
    if (step === 1 && !form.archetype) return 'Choose the kind of community you are creating.';
    if (step === 3 && form.description.trim().length < 10) return 'Add a short description so people know what this space is for.';
    return '';
  };

  const goNext = () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); };

  const submit = (e) => {
    e.preventDefault();
    const msgs = [validate()].filter(Boolean);
    if (msgs.length) { setError(msgs[0]); return; }
    const tc = form.archetype ? COMMUNITY_TYPE_CONFIG[form.archetype] : COMMUNITY_TYPE_CONFIG.general;
    onCreate({
      name: form.name.trim(),
      description: form.description.trim(),
      category: tc.label,
      typeKey: tc.key,
      community_type: tc.key,
      privacy: form.privacy,
      posting_mode: form.postingMode,
      rules: form.rulesText.split('\n').map((r) => r.trim()).filter(Boolean),
      firstPost: form.firstContent.trim() || SMART_FIRST_POST[tc.key] || '',
      settings: {
        archetype: tc.key,
        composer_mode: tc.composerMode,
        home_emphasis: tc.homeEmphasis,
        primary_tabs: tc.primaryTabs,
      },
      premiumLayoutRequest: premiumUpgradeRequested ? premiumPreviewLayout : null,
      premiumInterval: premiumUpgradeRequested ? premiumInterval : null,
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* ── Main dialog ── */}
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/45 p-0 sm:p-4 backdrop-blur-sm">
        <div className="flex h-[min(700px,100dvh)] w-full overflow-hidden rounded-t-[28px] sm:rounded-[28px] shadow-2xl max-w-[520px] lg:max-w-[860px]">

          {/* Form panel */}
          <form
            onSubmit={submit}
            className="flex h-full w-full flex-col bg-white lg:w-[480px] lg:flex-shrink-0"
          >
            {/* Header */}
            <header className="shrink-0 border-b border-slate-100 bg-white px-5 pb-3 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                      <Sparkles className="h-3 w-3" />
                      Launch a community
                    </span>
                    {/* Mobile-only preview toggle */}
                    <button
                      type="button"
                      onClick={() => setShowMobilePreview(true)}
                      className="lg:hidden inline-flex items-center gap-1 text-[11px] font-black text-slate-400 hover:text-blue-600"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                  </div>
                  <h2 className="text-[20px] font-black leading-tight text-slate-950">{STEP_TITLES[step]}</h2>
                  <p className="mt-0.5 text-[13px] font-semibold leading-5 text-slate-500">{STEP_BODIES[step]}</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Progress */}
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-slate-400">
                  <span>Step {step + 1} of {STEPS.length}</span>
                  <span>{STEPS[step]}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </header>

            {/* Step content */}
            <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {step === 0 && <StepName form={form} onField={setField} />}
              {step === 1 && <StepArchetype form={form} onField={setField} />}
              {step === 2 && <StepMakeItYours form={form} typeConfig={typeConfig} onField={setField} />}
              {step === 3 && (
                <StepShape
                  form={form}
                  onField={setField}
                  premiumPreviewEnabled={premiumPreviewEnabled}
                  premiumPreviewLayout={premiumPreviewLayout}
                  onPremiumField={setPremiumField}
                  onPremiumToggle={togglePremiumPreview}
                  premiumUpgradeRequested={premiumUpgradeRequested}
                  premiumInterval={premiumInterval}
                  onUpgradeRequest={handleUpgradeRequest}
                  onUpgradeClear={handleUpgradeClear}
                />
              )}
              {step === 4 && <StepLaunch form={form} typeConfig={typeConfig} onField={setField} premiumUpgradeRequested={premiumUpgradeRequested} premiumInterval={premiumInterval} />}
            </section>

            {error && (
              <div className="mx-5 mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800">
                {error}
              </div>
            )}

            {/* Footer nav */}
            <footer className="shrink-0 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex gap-3">
                <button type="button" onClick={step === 0 ? onClose : goBack} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 hover:bg-slate-50">
                  {step === 0 ? 'Cancel' : <><ArrowLeft className="h-4 w-4" /> Back</>}
                </button>
                {step < 4 ? (
                  <button type="button" onClick={goNext} className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-blue-700 text-sm font-black text-white hover:bg-blue-800">
                    {step === 0 && !form.archetype ? 'Continue' : 'Next'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="submit" className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white hover:bg-slate-800">
                    <Check className="h-4 w-4" />
                    Launch Community
                  </button>
                )}
              </div>
            </footer>
          </form>

          {/* Desktop preview panel */}
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-8 py-8">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">Live Preview</p>
            <CommunityLivePreview form={form} step={step} premiumPreview={{ enabled: premiumPreviewEnabled, layout: premiumPreviewLayout }} />
          </div>

        </div>
      </div>

      {/* ── Mobile preview sheet ── */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 lg:hidden">
          <div
            className="flex flex-shrink-0 items-center justify-between px-4 pb-2"
            style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Live Preview</p>
            <button
              type="button"
              onClick={() => setShowMobilePreview(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-8">
            <CommunityLivePreview form={form} step={step} premiumPreview={{ enabled: premiumPreviewEnabled, layout: premiumPreviewLayout }} />
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

const STEP_TITLES = [
  'Name your community',
  'What kind of community?',
  'Make it yours',
  'Shape the experience',
  'Launch your community',
];

const STEP_BODIES = [
  'Start with a clear name. Your community identity begins here.',
  'Pick the archetype that fits your purpose. This shapes the whole experience.',
  'Add a description and set your vibe.',
  'Choose privacy and posting style.',
  'Set your first content and publish.',
];

// ── Step components ──────────────────────────────────────────────────────────

function StepName({ form, onField }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-[12px] font-black text-slate-900">Community name</label>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => onField('name', e.target.value)}
          placeholder="Example: Five Towns Parents, Woodmere Shul, HAFTR Alumni"
          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[16px] font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {form.name.trim().length > 1 && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-600 mb-1">Community identity preview</p>
          <p className="text-[18px] font-black text-slate-950">{form.name}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">on JUnited</p>
        </div>
      )}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
        <p className="text-[12px] font-black text-slate-600 mb-1">Tips for a great name</p>
        <ul className="space-y-1">
          {['Be specific — "Five Towns Parents" over "Parents Group"', 'Include a location if it matters', 'Match how members would describe you'].map((tip) => (
            <li key={tip} className="text-[12px] font-semibold text-slate-500 flex gap-2">
              <span className="text-emerald-500 flex-shrink-0">✓</span> {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepArchetype({ form, onField }) {
  return (
    <div className="space-y-3">
      <p className="text-[12px] font-semibold text-slate-500">Choose the kind of community you are building. This shapes your navigation, home layout, and posting experience.</p>
      <div className="grid grid-cols-2 gap-2">
        {ARCHETYPES.map((arch) => {
          const tc = COMMUNITY_TYPE_CONFIG[arch.key];
          const active = form.archetype === arch.key;
          return (
            <button
              key={arch.key}
              type="button"
              onClick={() => onField('archetype', arch.key)}
              className={`relative min-h-[100px] rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${
                active ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${tc?.softClass || 'bg-blue-50'}`}>{arch.emoji}</span>
                {active && <Check className="h-4 w-4 text-blue-600" />}
              </div>
              <p className="text-[13px] font-black text-slate-950 leading-tight">{arch.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500 line-clamp-2">{arch.description}</p>
              {active && tc && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tc.primaryTabs.slice(0, 3).map((tab) => (
                    <span key={tab} className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">{tab}</span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepMakeItYours({ form, typeConfig, onField }) {
  return (
    <div className="space-y-4">
      {typeConfig && (
        <div className={`rounded-2xl border p-4 ${typeConfig.softClass}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{ARCHETYPES.find((a) => a.key === form.archetype)?.emoji}</span>
            <div>
              <p className="text-[13px] font-black text-slate-950">{typeConfig.label} community</p>
              <p className="text-[11px] font-semibold text-slate-500">{typeConfig.tagline}</p>
            </div>
          </div>
        </div>
      )}
      <div>
        <label className="mb-2 block text-[12px] font-black text-slate-900">What is this community for? <span className="font-semibold text-slate-400">(optional but recommended)</span></label>
        <textarea
          value={form.description}
          onChange={(e) => onField('description', e.target.value)}
          rows={4}
          placeholder={typeConfig?.cardFallback || 'Who should join, what belongs here, and what makes this space useful?'}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold leading-5 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

function StepShape({ form, onField, premiumPreviewEnabled, premiumPreviewLayout, onPremiumField, onPremiumToggle, premiumUpgradeRequested, premiumInterval, onUpgradeRequest, onUpgradeClear }) {
  const PRIVACY_OPTIONS = [
    { value: 'Public', label: 'Public', emoji: '🌍', body: 'Anyone can discover and join this community.' },
    { value: 'Community-only', label: 'Community-only', emoji: '🏘️', body: 'Discoverable but feels more local and member-focused.' },
    { value: 'Private', label: 'Private', emoji: '🔒', body: 'Not publicly discoverable. Invite or link only.' },
  ];

  const archetype = form.archetype || 'general';
  const typeConfig = COMMUNITY_TYPE_CONFIG[archetype] || COMMUNITY_TYPE_CONFIG.general;
  const tabArrangements = TAB_ARRANGEMENTS[archetype] || TAB_ARRANGEMENTS.general;
  const selectedTabPreset = premiumPreviewLayout.tabPreset ?? 0;
  const emphasisKeys = EMPHASIS_BY_TYPE[archetype] || ['feed'];
  const emphasisOptions = HOME_EMPHASIS_OPTIONS.filter((o) => emphasisKeys.includes(o.key));
  const selectedEmphasis = premiumPreviewLayout.homeEmphasis || emphasisKeys[0];
  const selectedComposerMode = premiumPreviewLayout.composerMode || typeConfig.composerMode || 'message';

  const handleTabPreset = (idx) => {
    onPremiumField('tabPreset', idx);
    onPremiumField('primaryTabs', tabArrangements[idx].tabs);
  };

  return (
    <div className="space-y-4">
      {/* Privacy */}
      <div>
        <p className="mb-2 text-[12px] font-black text-slate-900">Privacy</p>
        <div className="space-y-2">
          {PRIVACY_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => onField('privacy', opt.value)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${form.privacy === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <span className="text-xl mt-0.5">{opt.emoji}</span>
              <span className="flex-1">
                <span className="block text-[13px] font-black text-slate-950">{opt.label}</span>
                <span className="block mt-0.5 text-[12px] font-semibold text-slate-500">{opt.body}</span>
              </span>
              {form.privacy === opt.value && <Check className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Posting mode */}
      <div>
        <p className="mb-2 text-[12px] font-black text-slate-900">Who can post?</p>
        <div className="flex gap-2">
          {[['open', '👥 Everyone'], ['admin', '🔐 Admins only']].map(([val, label]) => (
            <button key={val} type="button" onClick={() => onField('postingMode', val)}
              className={`flex-1 rounded-xl border py-2.5 text-[13px] font-black transition ${form.postingMode === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── Premium layout preview ── */}
      <div className={`rounded-2xl border transition-all ${premiumPreviewEnabled ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}>
        {/* Header row */}
        <button
          type="button"
          onClick={onPremiumToggle}
          className="flex w-full items-center gap-2 px-4 py-3 text-left"
        >
          <span className="text-base">{premiumPreviewEnabled ? '✦' : <Lock className="h-3.5 w-3.5 text-slate-400 inline" />}</span>
          <span className={`flex-1 text-[12px] font-black ${premiumPreviewEnabled ? 'text-violet-900' : 'text-slate-700'}`}>
            Advanced Community Layout
          </span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-700">
            Premium
          </span>
          {premiumPreviewEnabled
            ? <ChevronUp className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
            : <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
        </button>

        {!premiumPreviewEnabled && (
          <div className="px-4 pb-3">
            <ul className="space-y-0.5 mb-3">
              {[
                'Choose your primary navigation tabs',
                'Shape what appears at the top of home',
                'Tune how your community app feels to members',
              ].map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-[11px] font-semibold text-slate-500">
                  <span className="text-violet-400 flex-shrink-0 mt-px">✦</span> {b}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onPremiumToggle}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-4 text-[12px] font-black text-white hover:bg-violet-700 active:scale-[0.98]"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview Premium Layout
            </button>
          </div>
        )}

        {premiumPreviewEnabled && (
          <div className="border-t border-violet-200 px-4 pb-4 pt-3 space-y-4">

            {/* Tab arrangement */}
            <div>
              <p className="mb-2 text-[11px] font-black text-violet-800">Tab arrangement</p>
              <div className="space-y-1.5">
                {tabArrangements.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTabPreset(idx)}
                    className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left transition ${
                      selectedTabPreset === idx
                        ? 'border-violet-400 bg-violet-100'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 text-[11px] font-black w-16 ${selectedTabPreset === idx ? 'text-violet-700' : 'text-slate-500'}`}>
                      {preset.label}
                    </span>
                    <div className="flex flex-1 gap-1 overflow-hidden">
                      {preset.tabs.map((tab) => (
                        <span
                          key={tab}
                          className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide ${
                            selectedTabPreset === idx
                              ? 'bg-violet-200 text-violet-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {TAB_LABELS_SHORT[tab] || tab}
                        </span>
                      ))}
                    </div>
                    {selectedTabPreset === idx && <Check className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Home emphasis */}
            {emphasisOptions.length > 1 && (
              <div>
                <p className="mb-2 text-[11px] font-black text-violet-800">Home emphasis</p>
                <div className="space-y-1">
                  {emphasisOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => onPremiumField('homeEmphasis', opt.key)}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                        selectedEmphasis === opt.key
                          ? 'border-violet-400 bg-violet-100'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      <span className="flex-1">
                        <span className={`block text-[11px] font-black ${selectedEmphasis === opt.key ? 'text-violet-800' : 'text-slate-700'}`}>{opt.label}</span>
                        <span className="block text-[10px] font-semibold text-slate-400 leading-tight">{opt.desc}</span>
                      </span>
                      {selectedEmphasis === opt.key && <Check className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer style */}
            <div>
              <p className="mb-2 text-[11px] font-black text-violet-800">Composer style</p>
              <div className="flex gap-1.5 flex-wrap">
                {PREVIEW_COMPOSER_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => onPremiumField('composerMode', mode.key)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition ${
                      selectedComposerMode === mode.key
                        ? 'border-violet-400 bg-violet-100 text-violet-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mode.emoji} {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upgrade CTA */}
            {premiumUpgradeRequested ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-emerald-800">
                      ✓ Premium layout selected · {premiumInterval === 'annual' ? 'Annual plan' : 'Monthly plan'} · applied after launch
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 leading-tight">
                      Your layout choices will be saved when billing completes. You can manage them in Admin Center → Layout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onUpgradeClear}
                    className="flex-shrink-0 text-[10px] font-black text-emerald-600 underline underline-offset-2 hover:text-emerald-800"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-2">
                <p className="text-[11px] font-black text-amber-800">Upgrade to publish this layout</p>
                <p className="text-[10px] font-semibold text-amber-600 leading-tight">
                  Your layout choices are saved after you upgrade. Launch free, then upgrade — or commit now.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onUpgradeRequest('monthly')}
                    className="flex-1 rounded-lg border border-amber-300 bg-white py-2 text-center"
                  >
                    <span className="block text-[12px] font-black text-slate-900">Monthly</span>
                    <span className="block text-[10px] font-semibold text-slate-500">$9.99 / mo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpgradeRequest('annual')}
                    className="flex-1 rounded-lg border border-amber-300 bg-amber-100 py-2 text-center"
                  >
                    <span className="block text-[12px] font-black text-slate-900">Annual</span>
                    <span className="block text-[10px] font-semibold text-amber-700">$7.99 / mo · save 20%</span>
                  </button>
                </div>
                <p className="text-[9px] font-semibold text-amber-500 text-center">
                  Billing starts after your community is created
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepLaunch({ form, typeConfig, onField, premiumUpgradeRequested, premiumInterval }) {
  const archType = ARCHETYPES.find((a) => a.key === form.archetype);
  const smartPost = SMART_FIRST_POST[form.archetype] || SMART_FIRST_POST.general;
  React.useEffect(() => {
    if (!form.firstContent) onField('firstContent', smartPost);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Final review */}
      <div className={`rounded-2xl border p-4 ${typeConfig?.softClass || 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{archType?.emoji}</span>
          <div>
            <p className="text-[16px] font-black text-slate-950">{form.name || 'Your Community'}</p>
            <p className="text-[12px] font-semibold text-slate-500">{typeConfig?.label} · {form.privacy}</p>
          </div>
        </div>
      </div>

      {/* First post */}
      <div>
        <label className="mb-2 block text-[12px] font-black text-slate-900">
          Start with a welcome post <span className="font-semibold text-slate-400">(strongly encouraged)</span>
        </label>
        <textarea
          value={form.firstContent}
          onChange={(e) => onField('firstContent', e.target.value)}
          rows={4}
          placeholder={smartPost}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold leading-5 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1.5 text-[11px] font-semibold text-slate-400">This will be your community's first post. You can edit or delete it after launch.</p>
      </div>

      {premiumUpgradeRequested && (
        <div className="rounded-2xl border border-violet-300 bg-violet-50 px-4 py-3 flex items-start gap-2">
          <span className="text-violet-600 mt-px text-base flex-shrink-0">✦</span>
          <div>
            <p className="text-[12px] font-black text-violet-900">Premium Layout · {premiumInterval === 'annual' ? 'Annual plan' : 'Monthly plan'}</p>
            <p className="text-[11px] font-semibold text-violet-600 mt-0.5 leading-tight">
              After launch, you'll be redirected to billing. Your layout choices are applied automatically on return.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-blue-900 p-4 text-white">
        <p className="text-[15px] font-black">Ready to launch 🚀</p>
        <p className="mt-1 text-[12px] font-semibold text-white/70">After launch, you'll be taken to your new community with an admin setup panel to invite members, add events, and customize further.</p>
      </div>
    </div>
  );
}
