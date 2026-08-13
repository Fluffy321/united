import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Loader2, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { BRIEF_CATEGORIES, BRIEF_CATEGORY_IDS } from '@/lib/feed/briefCategories';
import {
  CATEGORY_PREFERENCE_VALUES,
  INTEREST_GROUPS,
  applyCatchUpSelection,
  normalizePreferenceProfile,
} from '@/lib/feed/feedPreferenceModel';
import { feedPreferenceKeys } from '@/lib/queryKeys';
import { feedRetentionService } from '@/services';

const AMOUNT_OPTIONS = [
  { id: 'quiet', label: 'Essentials only', detail: 'Important information and your top topics.' },
  { id: 'balanced', label: 'A balanced feed', detail: 'A useful daily mix without extra noise.' },
  { id: 'all_in', label: 'Show me everything', detail: 'More plans, posts, and community activity.' },
];

const TIMING_OPTIONS = [
  { id: 'morning', label: 'Morning' },
  { id: 'daytime', label: 'Daytime' },
  { id: 'evening', label: 'Evening' },
  { id: 'important_only', label: 'Important only' },
];

const VALUE_LABELS = {
  more: 'More',
  normal: 'Normal',
  less: 'Less',
  hide: 'Hide',
};

function SettingsSection({ title, description, children }) {
  return (
    <fieldset className="border-t border-slate-200 pt-5 first:border-0 first:pt-0">
      <legend className="text-[12px] font-black text-slate-950">{title}</legend>
      {description && <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">{description}</p>}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

function InterestGroupControls({ preferences, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {INTEREST_GROUPS.map((group) => {
        const selected = preferences.interest_groups.includes(group.id);
        return (
          <button
            key={group.id}
            type="button"
            data-interest-group={group.id}
            aria-pressed={selected}
            onClick={() => onChange({
              ...preferences,
              interest_groups: selected
                ? preferences.interest_groups.filter((groupId) => groupId !== group.id)
                : [...preferences.interest_groups, group.id],
            })}
            className={`min-h-11 rounded-xl border px-3 py-2 text-left text-[11px] font-black outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${selected ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            {group.label}
          </button>
        );
      })}
    </div>
  );
}

function CategoryControls({ preferences, onChange }) {
  const setCategoryValue = (categoryId, value) => {
    const categoryPreferences = {
      ...preferences.category_preferences,
      [categoryId]: value,
    };
    onChange({
      ...preferences,
      category_preferences: categoryPreferences,
      interests: BRIEF_CATEGORY_IDS.filter((id) => categoryPreferences[id] === 'more'),
    });
  };

  return (
    <div className="space-y-3">
      {BRIEF_CATEGORIES.map((category) => (
        <div key={category.id} data-category-preference={category.id}>
          <p className="mb-1.5 text-[11px] font-black text-slate-800">{category.label}</p>
          <div role="radiogroup" aria-label={`${category.label} preference`} className="grid grid-cols-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
            {CATEGORY_PREFERENCE_VALUES.map((value) => {
              const selected = preferences.category_preferences[category.id] === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  data-category-id={category.id}
                  data-category-value={value}
                  aria-checked={selected}
                  onClick={() => setCategoryValue(category.id, value)}
                  className={`min-h-11 rounded-lg px-1 text-[10px] font-black outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${selected ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 active:bg-white/70'}`}
                >
                  {VALUE_LABELS[value]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AmountControls({ preferences, onChange }) {
  return (
    <div role="radiogroup" aria-label="Feed amount" className="space-y-2">
      {AMOUNT_OPTIONS.map((option) => {
        const selected = preferences.engagement_level === option.id
          || (preferences.engagement_level === 'active' && option.id === 'all_in');
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            data-engagement-level={option.id}
            aria-checked={selected}
            onClick={() => onChange({ ...preferences, engagement_level: option.id })}
            className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}
          >
            <span className={`h-4 w-4 shrink-0 rounded-full border-[4px] ${selected ? 'border-blue-600 bg-white' : 'border-slate-300 bg-white'}`} />
            <span>
              <strong className="block text-[12px] font-black text-slate-900">{option.label}</strong>
              <span className="mt-0.5 block text-[10.5px] font-medium leading-snug text-slate-500">{option.detail}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TimingControls({ preferences, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TIMING_OPTIONS.map((option) => {
        const selected = preferences.catch_up_windows.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange({
              ...preferences,
              catch_up_windows: applyCatchUpSelection(preferences.catch_up_windows, option.id),
            })}
            className={`min-h-11 rounded-xl border px-3 py-2 text-[11px] font-black outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${selected ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function BriefPreferencesForm({ preferences, onChange, onSave, isSaving }) {
  const normalized = normalizePreferenceProfile(preferences);
  return (
    <section aria-labelledby="brief-preferences-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#EAF0F8] text-[#315B8A]">
          <SlidersHorizontal aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h3 id="brief-preferences-heading" className="text-[15px] font-black text-slate-950">Your Home feed</h3>
          <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-slate-500">Control what comes first, how much you see, and when Home catches you up.</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <SettingsSection title="Topics to prioritize" description="These are broad signals. The category controls below are exact.">
          <InterestGroupControls preferences={normalized} onChange={onChange} />
        </SettingsSection>
        <SettingsSection title="Every category" description="More raises it. Less lowers it. Hide removes ordinary posts.">
          <CategoryControls preferences={normalized} onChange={onChange} />
        </SettingsSection>
        <SettingsSection title="How much do you want to see?">
          <AmountControls preferences={normalized} onChange={onChange} />
        </SettingsSection>
        <SettingsSection title="When should Home catch you up?" description="This changes ordering when you open JUnited. It does not turn on notifications.">
          <TimingControls preferences={normalized} onChange={onChange} />
        </SettingsSection>
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-amber-900">
        <BellRing aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Real local emergencies can still appear. Your own activity and required notices stay visible too.</span>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="motion-press mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-[12.5px] font-black text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {isSaving && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        {isSaving ? 'Saving…' : 'Save Home preferences'}
      </button>
    </section>
  );
}

export default function BriefPreferencesSettings({ currentUser }) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(() => normalizePreferenceProfile(null, currentUser?.id));

  const { data: savedPreferences } = useQuery({
    queryKey: feedPreferenceKeys.user(currentUser?.id),
    queryFn: () => feedRetentionService.getPreferences(currentUser.id),
    enabled: Boolean(currentUser?.id),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (savedPreferences) setPreferences(normalizePreferenceProfile(savedPreferences, currentUser?.id));
  }, [currentUser?.id, savedPreferences]);

  const saveMutation = useMutation({
    mutationFn: () => feedRetentionService.savePreferences(currentUser.id, {
      interests: preferences.interests,
      engagement_level: preferences.engagement_level,
      interest_groups: preferences.interest_groups,
      category_preferences: preferences.category_preferences,
      catch_up_windows: preferences.catch_up_windows,
      preference_setup_version: preferences.preference_setup_version,
      preference_setup_completed_at: preferences.preference_setup_completed_at,
    }),
    onSuccess: (saved) => {
      queryClient.setQueryData(feedPreferenceKeys.user(currentUser.id), saved);
      queryClient.invalidateQueries({ queryKey: feedPreferenceKeys.all });
      toast.success('Home preferences saved');
    },
    onError: () => toast.error('Could not save Home preferences. Try again.'),
  });

  return (
    <BriefPreferencesForm
      preferences={preferences}
      onChange={setPreferences}
      onSave={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
    />
  );
}
