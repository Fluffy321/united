import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  EyeOff,
  Globe2,
  Lightbulb,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { COMMUNITY_TYPE_OPTIONS, getCommunityTypeConfig } from '@/lib/communityTypes';

const DEFAULT_RULES = 'Be respectful.\nKeep posts relevant.\nProtect private information.';

const STEPS = [
  { key: 'basics', label: 'Basics' },
  { key: 'discovery', label: 'Discovery' },
  { key: 'settings', label: 'Settings' },
  { key: 'about', label: 'About' },
  { key: 'ai', label: 'AI Assist' },
];

const PRIVACY_OPTIONS = [
  {
    value: 'Public',
    label: 'Public',
    icon: Globe2,
    body: 'Anyone can discover this community and ask to join.',
  },
  {
    value: 'Community-only',
    label: 'Community-only',
    icon: Users,
    body: 'Best for spaces that should feel local and member-focused.',
  },
  {
    value: 'Private',
    label: 'Private',
    icon: Lock,
    body: 'Harder to discover. Good for sensitive or invite-first spaces.',
  },
  {
    value: 'Private / Anonymous',
    label: 'Private / Anonymous',
    icon: EyeOff,
    body: 'Members can participate more quietly by default.',
  },
];

const COMMUNITY_STYLE_OPTIONS = [
  { value: 'user', label: 'Member-led', body: 'A flexible space created by someone in the community.' },
  { value: 'lifestyle', label: 'Interest-based', body: 'Best for hobbies, routines, and shared interests.' },
  { value: 'support', label: 'Support space', body: 'Best for sensitive help, advice, or quieter participation.' },
];

export default function CreateCommunityForm({ categories = [], onCreate, onClose }) {
  const categoryOptions = useMemo(() => {
    const allowed = new Set(categories);
    const options = COMMUNITY_TYPE_OPTIONS.filter((option) => !allowed.size || allowed.has(option.label));
    return options.length ? options : COMMUNITY_TYPE_OPTIONS;
  }, [categories]);

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: categoryOptions[0]?.label || 'Community',
    communityType: 'user',
    privacy: 'Public',
    location: '',
    allowAnonymous: false,
    hideMembership: false,
    rulesText: DEFAULT_RULES,
  });

  const selectedType = getCommunityTypeConfig({ category: form.category });
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const isFinalStep = stepIndex === STEPS.length - 1;
  const isPrivateAnonymous = form.privacy === 'Private / Anonymous';

  const setField = (field, value) => {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applyCommunityStyle = (value) => {
    setError('');
    setForm((current) => {
      if (value === 'support') {
        return {
          ...current,
          communityType: value,
          category: 'Chesed',
          privacy: 'Private / Anonymous',
          allowAnonymous: true,
          hideMembership: true,
        };
      }
      return {
        ...current,
        communityType: value,
      };
    });
  };

  const validateStep = (index = stepIndex) => {
    if (index === 0) {
      if (form.name.trim().length < 2) return 'Add a community name with at least 2 characters.';
      if (!form.category) return 'Choose the kind of community you are creating.';
    }
    if (index === 3 && form.description.trim().length < 12) {
      return 'Add a short description so people know what this community is for.';
    }
    return '';
  };

  const goNext = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError('');
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const submit = (event) => {
    event.preventDefault();

    const firstInvalidStep = [0, 3].find((index) => validateStep(index));
    if (firstInvalidStep !== undefined) {
      setStepIndex(firstInvalidStep);
      setError(validateStep(firstInvalidStep));
      return;
    }

    const rules = form.rulesText
      .split('\n')
      .map((rule) => rule.trim())
      .filter(Boolean);

    onCreate({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      typeKey: selectedType.key,
      communityType: form.communityType,
      privacy: form.privacy,
      location: form.location.trim() || 'Local community',
      supportsIncognito: isPrivateAnonymous || form.hideMembership,
      supportsAnonymousPosting: form.allowAnonymous,
      hideMembershipDefault: isPrivateAnonymous || form.hideMembership,
      identityTags: [form.category, form.privacy, form.communityType === 'lifestyle' ? 'Interest-based' : 'Member-led'],
      rules,
      aiSetupPrompt: aiPrompt.trim(),
      tagline: selectedType.tagline,
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="flex h-[min(680px,calc(100dvh-24px))] w-full max-w-[520px] flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl"
      >
        <header className="shrink-0 border-b border-slate-100 bg-white px-4 pb-3 pt-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Create a community
              </p>
              <h2 className="text-[20px] font-black leading-tight text-slate-950">
                {getStepTitle(stepIndex)}
              </h2>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-500">
                {getStepBody(stepIndex)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mobile-touch rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              aria-label="Close create community"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wide text-slate-400">
              <span>Step {stepIndex + 1} of {STEPS.length}</span>
              <span>{STEPS[stepIndex].label}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-[#0F5ED7] to-emerald-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {STEPS.map((step, index) => (
                <span
                  key={step.key}
                  className={`h-1.5 rounded-full transition ${index <= stepIndex ? 'bg-blue-600' : 'bg-slate-100'}`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {stepIndex === 0 && (
            <BasicsStep
              form={form}
              selectedType={selectedType}
              categoryOptions={categoryOptions}
              onField={setField}
              onStyle={applyCommunityStyle}
            />
          )}
          {stepIndex === 1 && (
            <DiscoveryStep
              form={form}
              privacyOptions={PRIVACY_OPTIONS}
              onField={setField}
            />
          )}
          {stepIndex === 2 && (
            <SettingsStep
              allowAnonymous={form.allowAnonymous}
              hideMembership={isPrivateAnonymous || form.hideMembership}
              hideMembershipLocked={isPrivateAnonymous}
              onField={setField}
            />
          )}
          {stepIndex === 3 && (
            <AboutStep
              description={form.description}
              rulesText={form.rulesText}
              selectedType={selectedType}
              onField={setField}
            />
          )}
          {stepIndex === 4 && (
            <AiAssistStep
              aiPrompt={aiPrompt}
              setAiPrompt={setAiPrompt}
              selectedType={selectedType}
            />
          )}
        </section>

        {error && (
          <div className="mx-4 mb-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800 sm:mx-5">
            {error}
          </div>
        )}

        <footer className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={stepIndex === 0 ? onClose : goBack}
              className="mobile-touch inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 transition hover:bg-slate-100"
            >
              {stepIndex === 0 ? 'Cancel' : (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </>
              )}
            </button>

            {isFinalStep ? (
              <button
                type="submit"
                className="mobile-touch inline-flex h-11 flex-[1.25] items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm shadow-slate-950/20 transition hover:bg-slate-800"
              >
                <Check className="h-4 w-4" />
                Create Community
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="mobile-touch inline-flex h-11 flex-[1.25] items-center justify-center gap-2 rounded-2xl bg-blue-700 text-sm font-black text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </footer>
      </form>
    </div>,
    document.body
  );
}

function getStepTitle(index) {
  return [
    "Let's start with the basics",
    'Who should be able to find this?',
    'Choose how this community should work',
    'Tell people what this space is about',
    'Want help shaping your community?',
  ][index];
}

function getStepBody(index) {
  return [
    'Give it a clear name and choose the kind of space you are creating.',
    'Set the neighborhood and access level so the right people can discover it.',
    'Pick a couple of privacy defaults without turning this into a giant form.',
    'Add a helpful description and simple rules members can understand quickly.',
    'AI setup is ready for a future backend. You can write a vision here or skip it.',
  ][index];
}

function BasicsStep({ form, selectedType, categoryOptions, onField, onStyle }) {
  const Icon = selectedType.icon;

  return (
    <div className="space-y-4">
      <FieldLabel label="Community name">
        <input
          value={form.name}
          onChange={(event) => onField('name', event.target.value)}
          placeholder="Example: Five Towns Parents"
          className={inputClassName}
        />
      </FieldLabel>

      <div>
        <p className="mb-2 text-[12px] font-black text-slate-900">Community category</p>
        <div className="grid grid-cols-2 gap-2">
          {categoryOptions.map((option) => {
            const OptionIcon = option.icon;
            const active = form.category === option.label;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onField('category', option.label)}
                className={`min-h-[88px] rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                  active ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${option.softClass || 'bg-blue-50 text-blue-700'}`}>
                    <OptionIcon className="h-4 w-4" />
                  </span>
                  {active && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                </div>
                <p className="mt-2 text-[13px] font-black text-slate-950">{option.label}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">{option.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${selectedType.softClass}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[13px] font-black text-slate-950">{selectedType.label} community</p>
            <p className="mt-0.5 text-[12px] font-semibold leading-5 text-slate-500">{selectedType.cardFallback}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-black text-slate-900">Community style</p>
        <div className="space-y-2">
          {COMMUNITY_STYLE_OPTIONS.map((option) => (
            <ChoiceRow
              key={option.value}
              active={form.communityType === option.value}
              title={option.label}
              body={option.body}
              onClick={() => onStyle(option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DiscoveryStep({ form, privacyOptions, onField }) {
  return (
    <div className="space-y-4">
      <FieldLabel label="Location or neighborhood" helper="Optional, but helpful for local discovery.">
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={form.location}
            onChange={(event) => onField('location', event.target.value)}
            placeholder="Example: Cedarhurst, Woodmere, Online"
            className={`${inputClassName} pl-9`}
          />
        </div>
      </FieldLabel>

      <div>
        <p className="mb-2 text-[12px] font-black text-slate-900">Privacy</p>
        <div className="space-y-2">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            return (
              <ChoiceRow
                key={option.value}
                active={form.privacy === option.value}
                title={option.label}
                body={option.body}
                icon={Icon}
                onClick={() => onField('privacy', option.value)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsStep({ allowAnonymous, hideMembership, hideMembershipLocked, onField }) {
  return (
    <div className="space-y-3">
      <ToggleCard
        icon={EyeOff}
        title="Hide membership from profiles"
        body={hideMembershipLocked
          ? 'Private / Anonymous communities keep membership hidden by default.'
          : 'Members can join without this community showing on their public profile.'}
        checked={hideMembership}
        disabled={hideMembershipLocked}
        onChange={() => onField('hideMembership', !hideMembership)}
      />
      <ToggleCard
        icon={ShieldCheck}
        title="Allow anonymous posting"
        body="Useful for sensitive questions or support spaces. Members can still post normally."
        checked={allowAnonymous}
        onChange={() => onField('allowAnonymous', !allowAnonymous)}
      />
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
        <p className="text-[12px] font-black text-blue-800">Good defaults can change later</p>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-blue-700">
          This step only sets the starting behavior. Admin settings can grow as the community becomes more active.
        </p>
      </div>
    </div>
  );
}

function AboutStep({ description, rulesText, selectedType, onField }) {
  return (
    <div className="space-y-4">
      <FieldLabel label="Description" helper={selectedType.cardFallback}>
        <textarea
          value={description}
          onChange={(event) => onField('description', event.target.value)}
          placeholder="Who should join, what belongs here, and what makes this space useful?"
          rows={5}
          className={textareaClassName}
        />
      </FieldLabel>

      <FieldLabel label="Simple rules" helper="One rule per line. Keep these clear and human.">
        <textarea
          value={rulesText}
          onChange={(event) => onField('rulesText', event.target.value)}
          rows={5}
          className={textareaClassName}
        />
      </FieldLabel>
    </div>
  );
}

function AiAssistStep({ aiPrompt, setAiPrompt, selectedType }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-blue-900 p-4 text-white">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/12">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-black">AI setup is not connected yet</p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-white/75">
              The app has the UI ready, but there is no secure server-side AI function wired up yet. Your community can still be created normally.
            </p>
          </div>
        </div>
      </div>

      <FieldLabel label="Describe your ideal community" helper="Optional. This can be used later when the AI helper is connected.">
        <textarea
          value={aiPrompt}
          onChange={(event) => setAiPrompt(event.target.value)}
          placeholder="Example: A Five Towns parents group for babysitter recommendations, school questions, and local activities."
          rows={6}
          className={textareaClassName}
        />
      </FieldLabel>

      <button
        type="button"
        disabled
        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-400"
      >
        <Lightbulb className="h-4 w-4" />
        Generate community setup coming soon
      </button>

      <button
        type="submit"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 text-sm font-black text-blue-700 transition hover:bg-blue-100"
      >
        Skip AI and create normally
      </button>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[12px] font-black text-slate-900">Current setup</p>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">
          This will create a {selectedType.label.toLowerCase()} community using the details you reviewed in the previous steps.
        </p>
      </div>
    </div>
  );
}

function FieldLabel({ label, helper, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-black text-slate-900">{label}</span>
      {children}
      {helper && <span className="mt-1.5 block text-[11px] font-semibold leading-4 text-slate-500">{helper}</span>}
    </label>
  );
}

function ChoiceRow({ active, title, body, icon: Icon = UserRound, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
        active ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100' : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-black text-slate-950">{title}</span>
        <span className="mt-0.5 block text-[12px] font-semibold leading-5 text-slate-500">{body}</span>
      </span>
      {active && <Check className="mt-2 h-4 w-4 shrink-0 text-blue-600" />}
    </button>
  );
}

function ToggleCard({ icon: Icon, title, body, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
        disabled ? 'border-blue-100 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${checked ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-black text-slate-950">{title}</span>
        <span className="mt-0.5 block text-[12px] font-semibold leading-5 text-slate-500">{body}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  );
}

const inputClassName = 'h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-[15px] font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const textareaClassName = 'w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[14px] font-semibold leading-5 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
