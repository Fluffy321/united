import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Loader2, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { BRIEF_CATEGORIES, DEFAULT_BRIEF_CATEGORY_IDS } from '@/lib/feed/briefCategories';
import { feedPreferenceKeys } from '@/lib/queryKeys';
import { feedRetentionService } from '@/services';

const ENGAGEMENT_LEVELS = [
  { id: 'quiet', label: 'Quiet', description: 'Essential updates and emergency alerts.' },
  { id: 'balanced', label: 'Balanced', description: 'The default daily rhythm.' },
  { id: 'active', label: 'Active', description: 'More prompts and community activity.' },
  { id: 'all_in', label: 'All-in', description: 'The fullest non-emergency update volume.' },
];

export function BriefPreferencesForm({
  interests,
  engagementLevel,
  onToggleInterest,
  onEngagementChange,
  onSave,
  isSaving,
}) {
  return (
    <section aria-labelledby="brief-preferences-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#EAF0F8] text-[#315B8A]">
          <SlidersHorizontal aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h3 id="brief-preferences-heading" className="text-[15px] font-black text-slate-950">Your Daily Brief</h3>
          <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-slate-500">
            Choose what you want to see and how involved you want JUnited to feel.
          </p>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">What matters to you</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {BRIEF_CATEGORIES.map((category) => {
            const selected = interests.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                data-brief-interest={category.id}
                aria-pressed={selected}
                onClick={() => onToggleInterest(category.id)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-left text-[11.5px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  selected ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">How engaged do you want to be?</legend>
        <div role="radiogroup" aria-label="Brief engagement level" className="mt-2 space-y-2">
          {ENGAGEMENT_LEVELS.map((level) => {
            const selected = engagementLevel === level.id;
            return (
              <button
                key={level.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onEngagementChange(level.id)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                }`}
              >
                <span className={`h-4 w-4 shrink-0 rounded-full border-[4px] ${selected ? 'border-blue-600 bg-white' : 'border-slate-300 bg-white'}`} />
                <span className="min-w-0">
                  <span className={`block text-[12.5px] font-black ${selected ? 'text-blue-800' : 'text-slate-800'}`}>{level.label}</span>
                  <span className="mt-0.5 block text-[11px] font-medium leading-snug text-slate-500">{level.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-amber-900">
        <BellRing aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Change this anytime. Emergency alerts are unaffected.</span>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="motion-press mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F1C2E] px-4 text-[12.5px] font-black text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {isSaving && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        Save Brief preferences
      </button>
    </section>
  );
}

export default function BriefPreferencesSettings({ currentUser }) {
  const queryClient = useQueryClient();
  const [interests, setInterests] = useState(DEFAULT_BRIEF_CATEGORY_IDS);
  const [engagementLevel, setEngagementLevel] = useState('balanced');

  const { data: preferences } = useQuery({
    queryKey: feedPreferenceKeys.user(currentUser?.id),
    queryFn: () => feedRetentionService.getPreferences(currentUser.id),
    enabled: Boolean(currentUser?.id),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!preferences) return;
    setInterests(preferences.interests);
    setEngagementLevel(preferences.engagement_level);
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: () => feedRetentionService.savePreferences(currentUser.id, {
      interests,
      engagement_level: engagementLevel,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedPreferenceKeys.all });
      toast.success('Brief preferences saved');
    },
    onError: () => toast.error('Could not save Brief preferences. Try again.'),
  });

  const toggleInterest = (categoryId) => {
    setInterests((current) => current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]);
  };

  return (
    <BriefPreferencesForm
      interests={interests}
      engagementLevel={engagementLevel}
      onToggleInterest={toggleInterest}
      onEngagementChange={setEngagementLevel}
      onSave={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
    />
  );
}
