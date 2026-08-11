import { useState } from 'react';
import {
  DEFAULT_SETUP_DRAFT,
  INTEREST_GROUPS,
  applyCatchUpSelection,
  buildPreferencePatch,
  normalizeSetupDraft,
} from '@/lib/feed/feedPreferenceModel';

const INTEREST_DESCRIPTIONS = {
  local: 'News, weather, traffic, closings, and openings',
  plans: 'Events, sports, meetups, and Shabbos plans',
  food: 'New restaurants, kosher updates, and recommendations',
  help: 'Rides, volunteers, quick needs, and chesed',
  learning: 'Short Torah, useful guides, and shiurim',
  minyan: 'Nearby minyanim, zmanim, and candle lighting',
  people: 'Local leaders, groups, and people making things happen',
  market: 'Local work, services, listings, and free stuff',
  family: 'School updates, carpools, and useful parent info',
};

const AMOUNT_OPTIONS = [
  { id: 'quiet', label: 'Essentials only', detail: 'Important local information and your selected topics.' },
  { id: 'balanced', label: 'A balanced feed', detail: 'A useful daily mix without unnecessary noise.' },
  { id: 'all_in', label: 'Show me everything', detail: 'More plans, discussions, and community activity.' },
];

const TIMING_OPTIONS = [
  { id: 'morning', label: 'Morning', detail: 'Start with overnight changes and today’s plans.' },
  { id: 'daytime', label: 'Daytime', detail: 'See current needs and useful updates.' },
  { id: 'evening', label: 'Evening', detail: 'Catch plans and tomorrow’s information.' },
  { id: 'important_only', label: 'Important only', detail: 'Urgency and activity connected to you.' },
];

const amountLabel = (value) => AMOUNT_OPTIONS.find(({ id }) => id === value)?.label
  || (value === 'active' ? 'Show me everything' : 'A balanced feed');

const timingLabel = (windowId) => TIMING_OPTIONS.find(({ id }) => id === windowId)?.label;

function SetupHeader({ step, status, onAction }) {
  const showSkip = step < 3;
  return (
    <>
      <header className="flex min-h-[62px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-blue-700 text-[15px] font-black text-white shadow-[0_6px_16px_rgba(29,78,216,0.22)]">J</span>
          <div>
            <p className="text-[15px] font-black leading-none tracking-[-0.02em] text-slate-950">JUnited</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Set up Home</p>
          </div>
        </div>
        {showSkip && (
          <button
            type="button"
            onClick={() => onAction({ type: 'skip' })}
            disabled={status === 'pending'}
            className="min-h-11 rounded-xl px-3 text-[13px] font-bold text-slate-500 outline-none transition active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Skip setup
          </button>
        )}
      </header>
      <div className="grid h-1 shrink-0 grid-cols-3 gap-1 bg-slate-100 px-5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span key={index} className={`rounded-full ${index <= Math.min(step, 2) ? 'bg-blue-700' : 'bg-slate-200'}`} />
        ))}
      </div>
    </>
  );
}

function InterestStep({ draft, onAction }) {
  return (
    <>
      <StepIntro step="1 of 3" title="What do you want to keep up with?">
        Pick what matters most. You can still find everything in JUnited.
      </StepIntro>
      <div className="grid grid-cols-2 gap-2.5">
        {INTEREST_GROUPS.map((group) => {
          const selected = draft.interest_groups.includes(group.id);
          return (
            <button
              key={group.id}
              type="button"
              data-interest-group={group.id}
              aria-pressed={selected}
              onClick={() => onAction({ type: 'toggle-interest', value: group.id })}
              className={`relative min-h-[82px] rounded-2xl border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${selected ? 'border-blue-700 bg-blue-50 shadow-[inset_0_0_0_1px_#1d4ed8]' : 'border-slate-200 bg-white active:bg-slate-50'}`}
            >
              <span className="block pr-5 text-[12px] font-black leading-[1.2] text-slate-950">{group.label}</span>
              <span className="mt-1.5 block text-[10px] font-medium leading-[1.35] text-slate-500">{INTEREST_DESCRIPTIONS[group.id]}</span>
              <span className={`absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full text-[11px] font-black ${selected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-400'}`} aria-hidden="true">
                {selected ? '✓' : '+'}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] font-medium leading-relaxed text-slate-500">This chooses what comes first. Nothing is hidden unless you choose that later in Settings.</p>
    </>
  );
}

function AmountStep({ draft, onAction }) {
  return (
    <>
      <StepIntro step="2 of 3" title="How much do you want to see?">
        Choose a starting amount. You can change it whenever you want.
      </StepIntro>
      <div className="space-y-2.5" role="radiogroup" aria-label="Feed amount">
        {AMOUNT_OPTIONS.map((option) => {
          const selected = draft.engagement_level === option.id
            || (draft.engagement_level === 'active' && option.id === 'all_in');
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onAction({ type: 'set-amount', value: option.id })}
              className={`flex min-h-[76px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${selected ? 'border-blue-700 bg-blue-50 shadow-[inset_0_0_0_1px_#1d4ed8]' : 'border-slate-200 bg-white active:bg-slate-50'}`}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-blue-700 bg-blue-700' : 'border-slate-300'}`}>
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span>
                <strong className="block text-[14px] font-black text-slate-950">{option.label}</strong>
                <span className="mt-1 block text-[11px] font-medium leading-[1.4] text-slate-500">{option.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function TimingStep({ draft, onAction }) {
  return (
    <>
      <StepIntro step="3 of 3" title="When should Home catch you up?">
        Pick any times that fit your day. This does not turn on notifications.
      </StepIntro>
      <div className="grid grid-cols-2 gap-2.5">
        {TIMING_OPTIONS.map((option) => {
          const selected = draft.catch_up_windows.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              data-catch-up-window={option.id}
              aria-pressed={selected}
              onClick={() => onAction({ type: 'toggle-window', value: option.id })}
              className={`min-h-[96px] rounded-2xl border p-3.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${selected ? 'border-blue-700 bg-blue-50 shadow-[inset_0_0_0_1px_#1d4ed8]' : 'border-slate-200 bg-white active:bg-slate-50'}`}
            >
              <strong className="block text-[13px] font-black text-slate-950">{option.label}</strong>
              <span className="mt-1.5 block text-[10px] font-medium leading-[1.4] text-slate-500">{option.detail}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-l-[3px] border-amber-500 bg-amber-50 px-3.5 py-3 text-[11px] font-medium leading-relaxed text-amber-950">
        <strong>Safety stays on:</strong> Real local emergencies can still appear. Routine posts follow your choices.
      </div>
    </>
  );
}

function ReviewStep({ draft }) {
  const selectedGroups = INTEREST_GROUPS
    .filter(({ id }) => draft.interest_groups.includes(id))
    .map(({ label }) => label);
  const selectedWindows = draft.catch_up_windows.map(timingLabel).filter(Boolean);

  return (
    <>
      <StepIntro step="Review" title="This is your starting Home.">
        Check it once. Every choice stays editable in Settings.
      </StepIntro>
      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
        <div className="bg-[#0F1C2E] px-5 py-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Your feed</p>
          <h2 className="mt-2 text-[21px] font-black leading-tight tracking-[-0.025em]">Useful local information, in your order.</h2>
        </div>
        <ReviewRow label="Prioritize" value={selectedGroups.length ? selectedGroups.join(', ') : 'No specific topics'} />
        <ReviewRow label="Amount" value={amountLabel(draft.engagement_level)} />
        <ReviewRow label="Catch-up" value={selectedWindows.length ? selectedWindows.join(', ') : 'When I open JUnited'} />
      </section>
      <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-[11px] font-medium leading-relaxed text-emerald-950">
        <strong>Your choices stay in control.</strong> JUnited can improve the order from what you use, but it cannot undo a choice you made.
      </div>
    </>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="grid grid-cols-[82px_1fr] gap-3 border-t border-slate-200 px-4 py-3.5 text-[12px]">
      <span className="font-bold text-slate-500">{label}</span>
      <strong className="text-right font-black leading-snug text-slate-950">{value}</strong>
    </div>
  );
}

function StepIntro({ step, title, children }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">{step}</p>
      <h1 className="mt-2 text-[28px] font-black leading-[1.06] tracking-[-0.035em] text-slate-950">{title}</h1>
      <p className="mt-2.5 text-[13px] font-medium leading-[1.5] text-slate-500">{children}</p>
    </div>
  );
}

function SetupFooter({ step, status, onAction }) {
  const pending = status === 'pending';
  const finalStep = step === 3;
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-3">
      {status === 'error' && (
        <div className="mb-2.5 rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] font-bold leading-snug text-rose-800" role="alert">
          Could not save your preferences. Your choices are still here.
        </div>
      )}
      <div className="flex gap-2.5">
        {step > 0 && (
          <button
            type="button"
            onClick={() => onAction({ type: 'back' })}
            disabled={pending}
            className="min-h-12 min-w-[76px] rounded-xl border border-slate-300 bg-white px-4 text-[13px] font-black text-slate-800 outline-none active:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => onAction({ type: finalStep ? (status === 'error' ? 'retry' : 'save') : 'next' })}
          disabled={pending}
          className={`min-h-12 flex-1 rounded-xl px-4 text-[13px] font-black text-white outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${finalStep ? 'bg-emerald-700 active:bg-emerald-800' : 'bg-blue-600 active:bg-blue-700'}`}
        >
          {pending ? 'Saving…' : finalStep ? (status === 'error' ? 'Retry' : 'Save and open Home') : step === 2 ? 'Review' : 'Continue'}
        </button>
      </div>
    </footer>
  );
}

export function FeedPreferenceSetupView({ step, draft, status, onAction, networkLabel = 'your area' }) {
  const normalizedDraft = normalizeSetupDraft(draft);
  return (
    <main className="flex h-[100dvh] min-h-[620px] w-full flex-col overflow-hidden bg-[#F4F6F9] text-slate-950" aria-label={`Set up JUnited Home for ${networkLabel}`}>
      <SetupHeader step={step} status={status} onAction={onAction} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-6">
        <div className="mx-auto w-full max-w-[390px]">
          {step === 0 && <InterestStep draft={normalizedDraft} onAction={onAction} />}
          {step === 1 && <AmountStep draft={normalizedDraft} onAction={onAction} />}
          {step === 2 && <TimingStep draft={normalizedDraft} onAction={onAction} />}
          {step === 3 && <ReviewStep draft={normalizedDraft} />}
        </div>
      </div>
      <SetupFooter step={step} status={status} onAction={onAction} />
    </main>
  );
}

function initialDraftFrom(preferences) {
  if (!preferences) return normalizeSetupDraft(DEFAULT_SETUP_DRAFT);
  return normalizeSetupDraft({
    interest_groups: preferences.interest_groups?.length
      ? preferences.interest_groups
      : DEFAULT_SETUP_DRAFT.interest_groups,
    engagement_level: preferences.engagement_level === 'active'
      ? 'all_in'
      : preferences.engagement_level,
    catch_up_windows: preferences.catch_up_windows?.length
      ? preferences.catch_up_windows
      : DEFAULT_SETUP_DRAFT.catch_up_windows,
  });
}

export default function FeedPreferenceSetup({ initialPreferences, networkLabel, onSave, onSkip }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => initialDraftFrom(initialPreferences));
  const [status, setStatus] = useState('idle');

  const submit = async (callback, nextDraft) => {
    if (status === 'pending') return;
    setStatus('pending');
    try {
      await callback(buildPreferencePatch(nextDraft, { completedAt: new Date().toISOString() }));
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  const handleAction = (action) => {
    if (action.type === 'toggle-interest') {
      setDraft((current) => ({
        ...current,
        interest_groups: current.interest_groups.includes(action.value)
          ? current.interest_groups.filter((groupId) => groupId !== action.value)
          : [...current.interest_groups, action.value],
      }));
      return;
    }
    if (action.type === 'set-amount') {
      setDraft((current) => ({ ...current, engagement_level: action.value }));
      return;
    }
    if (action.type === 'toggle-window') {
      setDraft((current) => ({
        ...current,
        catch_up_windows: applyCatchUpSelection(current.catch_up_windows, action.value),
      }));
      return;
    }
    if (action.type === 'back') {
      setStatus('idle');
      setStep((current) => Math.max(0, current - 1));
      return;
    }
    if (action.type === 'next') {
      setStep((current) => Math.min(3, current + 1));
      return;
    }
    if (action.type === 'skip') {
      submit(onSkip, normalizeSetupDraft(DEFAULT_SETUP_DRAFT));
      return;
    }
    if (action.type === 'save' || action.type === 'retry') submit(onSave, draft);
  };

  return (
    <FeedPreferenceSetupView
      step={step}
      draft={draft}
      status={status}
      onAction={handleAction}
      networkLabel={networkLabel}
    />
  );
}
