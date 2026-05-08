import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Camera, Check, ChevronLeft, ChevronRight, Loader2, MapPin, Users, X } from 'lucide-react';
import { communitiesService, dataService, storageService } from '@/services';
import { toast } from 'sonner';

const ONBOARDING_KEY_PREFIX = 'junited_onboarding_complete_';

const NEIGHBORHOODS = [
  'Five Towns',
  'Lawrence',
  'Cedarhurst',
  'Woodmere',
  'Hewlett',
  'Inwood',
  'Far Rockaway',
  'Brooklyn',
  'Lakewood',
  'Teaneck',
  'Other',
];

const DEFAULT_COMMUNITIES = [
  { id: 'demo-community', name: 'Five Towns Community', description: 'Local updates, events, and neighbor-to-neighbor support.' },
  { id: 'demo-chesed', name: 'Chesed Volunteers', description: 'Mitzvah requests, rides, meals, and volunteer opportunities.' },
  { id: 'demo-events', name: 'Community Events', description: 'Shiurim, simchas, school events, and local gatherings.' },
];

export const getOnboardingStorageKey = (userId) => `${ONBOARDING_KEY_PREFIX}${userId || 'guest'}`;

export function hasCompletedOnboarding(user) {
  if (!user?.id) return true;
  return Boolean(user.onboarding_complete || storageService.getItem(getOnboardingStorageKey(user.id)) === '1');
}

function StepShell({ eyebrow, title, text, children }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[12px] font-black uppercase text-blue-600">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{text}</p>
      </div>
      {children}
    </div>
  );
}

function NameStep({ name, setName }) {
  return (
    <StepShell
      eyebrow="Step 1"
      title="What should people call you?"
      text="This is the public name neighbors will see around the app."
    >
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-slate-700">Display name</span>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Example: Sarah Cohen"
          className="app-input"
        />
      </label>
    </StepShell>
  );
}

function PhotoStep({ name, avatarUrl, uploading, onUpload, onSkipPhoto }) {
  const inputRef = useRef(null);
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <StepShell
      eyebrow="Step 2"
      title="Add a photo"
      text="Optional, but it helps people recognize you. You can skip this and add one later."
    >
      <div className="app-card flex flex-col items-center p-6">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-50 text-4xl font-black text-blue-700 shadow-lg"
          aria-label="Upload profile photo"
        >
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
          <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white shadow">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="app-button-primary mt-4 h-11"
        >
          {avatarUrl ? 'Change Photo' : 'Choose Photo'}
        </button>
        <button type="button" onClick={onSkipPhoto} className="mt-2 text-[13px] font-bold text-slate-400">
          Skip for now
        </button>
      </div>
    </StepShell>
  );
}

function NeighborhoodStep({ neighborhood, setNeighborhood }) {
  return (
    <StepShell
      eyebrow="Step 3"
      title="Choose your neighborhood"
      text="This helps the feed show posts, events, and Mitzvah requests near you."
    >
      <div className="grid grid-cols-2 gap-2.5">
        {NEIGHBORHOODS.map((item) => {
          const active = neighborhood === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setNeighborhood(item)}
              className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 text-left text-[13px] font-black transition active:scale-[0.98] ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'app-card-hover border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              {item}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

function CommunitiesStep({ communities, selectedIds, setSelectedIds, loading }) {
  const toggle = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <StepShell
      eyebrow="Step 4"
      title="Join a few communities"
      text="Pick the groups you want in your feed. You can always change this later."
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {communities.map((community) => {
            const active = selectedIds.has(community.id);
            return (
              <button
                key={community.id}
                type="button"
                onClick={() => toggle(community.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
                  active ? 'border-blue-500 bg-blue-50' : 'app-card-hover border-slate-200 bg-white hover:border-blue-200'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {active ? <Check className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-black text-slate-950">{community.name}</p>
                  <p className="line-clamp-2 text-[12px] font-medium leading-5 text-slate-500">{community.description || community.description_short || 'Community updates and local connection.'}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </StepShell>
  );
}

function NotificationsStep({ preferences, setPreferences }) {
  const update = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }));

  return (
    <StepShell
      eyebrow="Step 5"
      title="Choose notification preferences"
      text="Keep important things on, and turn down anything you do not want yet."
    >
      <div className="space-y-2.5">
        {[
          ['messages', 'Messages', 'New direct messages from community members.'],
          ['mitzvah', 'Mitzvah updates', 'Offers, accepted tasks, and verification requests.'],
          ['community', 'Community activity', 'Posts and announcements from communities you join.'],
        ].map(([key, label, description]) => (
          <button
            key={key}
            type="button"
            onClick={() => update(key)}
            className="app-card-hover flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-blue-200 active:scale-[0.99]"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${preferences[key] ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {preferences[key] ? <Check className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-black text-slate-950">{label}</p>
              <p className="text-[12px] font-medium leading-5 text-slate-500">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </StepShell>
  );
}

export default function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.display_name || user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || user?.cityPreset || user?.city || '');
  const [communities, setCommunities] = useState(DEFAULT_COMMUNITIES);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState(new Set());
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    messages: true,
    mitzvah: true,
    community: true,
  });
  const [saving, setSaving] = useState(false);

  const steps = useMemo(() => [
    'Name',
    'Photo',
    'Neighborhood',
    'Communities',
    'Notifications',
  ], []);

  useEffect(() => {
    let mounted = true;
    setLoadingCommunities(true);
    communitiesService.listCommunities('-follower_count', 20)
      .then((items) => {
        if (!mounted) return;
        setCommunities(items.length ? items : DEFAULT_COMMUNITIES);
      })
      .catch(() => {
        if (mounted) setCommunities(DEFAULT_COMMUNITIES);
      })
      .finally(() => {
        if (mounted) setLoadingCommunities(false);
      });
    return () => { mounted = false; };
  }, []);

  const canContinue = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 2) return Boolean(neighborhood);
    return true;
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await dataService.integrations.Core.UploadFile({ file });
      setAvatarUrl(result.file_url);
    } catch {
      toast.error('Photo upload failed. You can skip it for now.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const profilePatch = {
        display_name: name.trim(),
        full_name: name.trim(),
        avatar_url: avatarUrl || undefined,
        neighborhood,
        cityPreset: neighborhood,
        city: neighborhood,
        notifications_enabled: Object.values(notificationPrefs).some(Boolean),
        notification_preferences: notificationPrefs,
        onboarding_complete: true,
        is_profile_complete: true,
      };

      await dataService.auth.updateMe(profilePatch);

      if (selectedCommunityIds.size > 0) {
        const memberships = await communitiesService.listMemberships({ user_id: user.id }, '-created_date', 100);
        const existingIds = new Set(memberships.map((membership) => membership.community_id));
        await Promise.allSettled(
          [...selectedCommunityIds]
            .filter((communityId) => !existingIds.has(communityId))
            .map((communityId) => communitiesService.joinCommunity({
              user_id: user.id,
              community_id: communityId,
              role: 'Member',
            }))
        );
      }

      storageService.setItem(getOnboardingStorageKey(user.id), '1');
      onComplete?.({ ...user, ...profilePatch });
    } catch (error) {
      toast.error(error?.message || 'Could not save onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!canContinue()) return;
    if (step === steps.length - 1) {
      saveProfile();
      return;
    }
    setStep((current) => current + 1);
  };

  const back = () => setStep((current) => Math.max(0, current - 1));
  const skip = () => {
    if (step === 1 || step === 3 || step === 4) next();
  };

  return (
    <div className="app-page fixed inset-0 z-[100] overflow-y-auto px-4 py-5">
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-xl flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-black uppercase text-slate-400">JUnited setup</p>
            <p className="text-sm font-bold text-slate-700">{steps[step]}</p>
          </div>
          <button
            type="button"
            onClick={() => setStep(steps.length - 1)}
            className="app-icon-button h-9 w-9 rounded-full text-slate-400"
            aria-label="Skip to final onboarding step"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-5 gap-1.5">
          {steps.map((item, index) => (
            <div key={item} className={`h-1.5 rounded-full ${index <= step ? 'bg-blue-600' : 'bg-blue-100'}`} />
          ))}
        </div>

        <div className="app-card-soft flex-1 p-4 sm:p-6">
          {step === 0 && <NameStep name={name} setName={setName} />}
          {step === 1 && (
            <PhotoStep
              name={name}
              avatarUrl={avatarUrl}
              uploading={uploadingPhoto}
              onUpload={handleUpload}
              onSkipPhoto={skip}
            />
          )}
          {step === 2 && <NeighborhoodStep neighborhood={neighborhood} setNeighborhood={setNeighborhood} />}
          {step === 3 && (
            <CommunitiesStep
              communities={communities}
              selectedIds={selectedCommunityIds}
              setSelectedIds={setSelectedCommunityIds}
              loading={loadingCommunities}
            />
          )}
          {step === 4 && <NotificationsStep preferences={notificationPrefs} setPreferences={setNotificationPrefs} />}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || saving}
            className="app-button-secondary h-12 w-12 px-0 disabled:opacity-40"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!canContinue() || saving || uploadingPhoto}
            className="app-button-primary h-12 flex-1 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : step === steps.length - 1 ? (
              'Finish Setup'
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
          {(step === 1 || step === 3 || step === 4) && (
            <button type="button" onClick={skip} className="h-12 rounded-2xl px-3 text-[13px] font-bold text-slate-400">
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
