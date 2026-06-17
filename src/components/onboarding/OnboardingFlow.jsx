import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Camera, Check, ChevronLeft, ChevronRight, Home, Loader2, Map, MapPin, MessageCircle, School, Shield, Sparkles, Users, UserRoundPlus, X } from 'lucide-react';
import { communitiesService, dataService, friendsService, storageService } from '@/services';
import { supabase, shouldUseSupabase } from '@/api/supabaseClient';
import { requestPushPermission, subscribeToPush } from '@/lib/pushSubscription';
import { toast } from 'sonner';
import { COMMUNITIES_ENABLED } from '@/config/features';

const ONBOARDING_KEY_PREFIX = 'junited_onboarding_complete_';
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
const suggestUsername = (displayName) =>
  String(displayName || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 28);

const NEIGHBORHOODS = [
  'Five Towns',
  'Lawrence',
  'Cedarhurst',
  'Woodmere',
  'Hewlett',
  'Inwood',
];

const DEFAULT_COMMUNITIES = [
  { id: 'demo-community', name: 'Five Towns Community', description: 'Local updates, events, and neighbor-to-neighbor support.' },
  { id: 'demo-chesed', name: 'Chesed Volunteers', description: 'Mitzvah requests, rides, meals, and volunteer opportunities.' },
  { id: 'demo-events', name: 'Community Events', description: 'Shiurim, simchas, school events, and local gatherings.' },
];
const SHUL_OPTIONS = ['Not sure yet', 'Young Israel', 'Chabad', 'Sephardic minyan', 'Yeshiva minyan', 'Other'];
const SCHOOL_OPTIONS = ['No school connection', 'HAFTR', 'HALB', 'DRS', 'Shulamith', 'YOSS', 'TAG', 'Other'];
const PRIVACY_OPTIONS = [
  { key: 'public', label: COMMUNITIES_ENABLED ? 'Public community profile' : 'Public local profile', body: COMMUNITIES_ENABLED ? 'People can see your name, interests, and public communities.' : 'People can see your name and interests.' },
  { key: 'friends', label: 'Friends first', body: COMMUNITIES_ENABLED ? 'Keep more personal info limited to friends and joined communities.' : 'Keep more personal info limited to friends.' },
  { key: 'private', label: 'More private', body: 'Hide sensitive memberships and prefer private posting controls.' },
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

function NameStep({ name, setName, username, setUsername, onUsernameTouched, usernameAvailable, checkingUsername }) {
  const hint = checkingUsername
    ? 'Checking…'
    : usernameAvailable === true
    ? 'Username available ✓'
    : usernameAvailable === false
    ? 'That username is already taken'
    : 'Letters, numbers, and underscores · 3–30 characters';

  const hintColor =
    checkingUsername || usernameAvailable === null
      ? 'text-slate-400'
      : usernameAvailable
      ? 'text-emerald-600'
      : 'text-rose-500';

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
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-bold text-slate-700">Username</span>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">@</span>
          <input
            value={username}
            onChange={(event) => {
              onUsernameTouched();
              setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30));
            }}
            placeholder="sarah_cohen"
            className="app-input pl-7"
          />
        </div>
        <p className={`mt-1.5 text-[12px] font-semibold ${hintColor}`}>{hint}</p>
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

function IdentityContextStep({ shulPreference, setShulPreference, schoolPreference, setSchoolPreference, privacyPreference, setPrivacyPreference }) {
  return (
    <StepShell
      eyebrow="Step 4"
      title="Personalize your Jewish community world"
      text="Your town, shul, school, and privacy preferences help JUnited tune the Feed, Map, Mitzvah Circle, and Communities."
    >
      <div className="space-y-4">
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-black text-slate-700"><Home className="h-4 w-4 text-blue-600" /> Shul / minyan style</p>
          <div className="grid grid-cols-2 gap-2">
            {SHUL_OPTIONS.map((item) => (
              <button key={item} type="button" onClick={() => setShulPreference(item)} className={`rounded-2xl border px-3 py-2 text-left text-[12px] font-black ${shulPreference === item ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                {item}
              </button>
            ))}
          </div>
        </section>
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-black text-slate-700"><School className="h-4 w-4 text-blue-600" /> School connection</p>
          <div className="grid grid-cols-2 gap-2">
            {SCHOOL_OPTIONS.map((item) => (
              <button key={item} type="button" onClick={() => setSchoolPreference(item)} className={`rounded-2xl border px-3 py-2 text-left text-[12px] font-black ${schoolPreference === item ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                {item}
              </button>
            ))}
          </div>
        </section>
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-black text-slate-700"><Shield className="h-4 w-4 text-blue-600" /> Privacy default</p>
          <div className="space-y-2">
            {PRIVACY_OPTIONS.map((item) => (
              <button key={item.key} type="button" onClick={() => setPrivacyPreference(item.key)} className={`w-full rounded-2xl border p-3 text-left ${privacyPreference === item.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                <p className="text-[13px] font-black text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-[12px] font-medium leading-5 text-slate-500">{item.body}</p>
              </button>
            ))}
          </div>
        </section>
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
      title="Choose the communities that feel like you"
      text="These shape your feed, your map, and what the app learns to prioritize first."
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

function normalizeContactValue(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9@.+]/g, '');
}

function ContactsStep({ matches, selectedIds, setSelectedIds, loading, error, onFindContacts }) {
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
      title="Find friends already here"
      text="Tap once to check your contacts for people who already use JUnited. We only look after you approve access."
    >
      <button
        type="button"
        onClick={onFindContacts}
        disabled={loading}
        className="app-button-primary h-12 w-full"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}
        {loading ? 'Checking contacts...' : 'Find Friends From Contacts'}
      </button>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-[12px] font-semibold text-amber-700">
          {error}
        </div>
      )}

      {matches.length > 0 ? (
        <div className="space-y-2.5">
          {matches.map((friend) => {
            const active = selectedIds.has(friend.id);
            return (
              <button
                key={`contact-friend-${friend.id}`}
                type="button"
                onClick={() => toggle(friend.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
                  active ? 'border-emerald-500 bg-emerald-50' : 'app-card-hover border-slate-200 bg-white hover:border-emerald-200'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {active ? <Check className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-black text-slate-950">{friend.display_name || friend.full_name || 'JUnited member'}</p>
                  <p className="truncate text-[12px] font-medium text-slate-500">{friend.email || friend.phone || 'Matched from your contacts'}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[12px] font-semibold text-slate-500">
          Contact matches will appear here after you grant access. You can also skip this and add friends later from profiles.
        </div>
      )}
    </StepShell>
  );
}

const APP_TOUR_ITEMS = [
  { icon: Home,          label: 'Feed',            desc: 'See community updates, posts, and announcements from people nearby.' },
  { icon: Sparkles,      label: 'Mitzvah Circle',  desc: 'Ask for help, offer help, and track mitzvahs from open to completed.' },
  ...(COMMUNITIES_ENABLED ? [{ icon: Users, label: 'Communities', desc: 'Join local Jewish communities. Tap the message icon here for private chats.' }] : []),
  { icon: Map,           label: 'Businesses',      desc: 'Explore nearby shuls, businesses, places, and useful local references.' },
  { icon: Bell,          label: 'Notifications',   desc: 'Keep up with replies, requests, and important updates.' },
  { icon: MessageCircle, label: 'Messages',        desc: 'Coordinate privately with people you connect with through JUnited.' },
];

function AppTourStep() {
  return (
    <StepShell
      eyebrow="Almost there"
      title="Here's what you can do"
      text="A quick look at the main sections of the app."
    >
      <div className="space-y-2">
        {APP_TOUR_ITEMS.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-slate-900">{label}</p>
              <p className="text-[12px] font-medium leading-5 text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </StepShell>
  );
}

function NotificationsStep({ preferences, setPreferences }) {
  const update = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }));

  return (
    <StepShell
      eyebrow="Step 5"
      title="Choose notification preferences"
      text="Keep important things on, and turn down anything you do not want yet. We'll ask permission to send push notifications when you finish setup."
    >
      <div className="space-y-2.5">
        {[
          ['messages', 'Messages', 'New direct messages from community members.'],
          ['replies', 'Replies & mentions', 'Follow-up messages in threads you joined.'],
          ['mitzvah', 'Mitzvah updates', 'Offers, accepted tasks, and verification requests.'],
          ...(COMMUNITIES_ENABLED ? [['community', 'Community activity', 'Posts and announcements from communities you join.']] : []),
          ['localBrief', 'Daily brief', 'A useful recap of what matters nearby.'],
          ['mapActivity', 'Nearby map activity', 'Posts and local updates that appear on your community map.'],
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
  const [shulPreference, setShulPreference] = useState(user?.shul_preference || 'Not sure yet');
  const [schoolPreference, setSchoolPreference] = useState(user?.school_preference || 'No school connection');
  const [privacyPreference, setPrivacyPreference] = useState(user?.privacy_preference || 'friends');
  const [communities, setCommunities] = useState(DEFAULT_COMMUNITIES);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState(new Set());
  const [contactMatches, setContactMatches] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState(new Set());
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    messages: true,
    replies: true,
    mitzvah: true,
    community: true,
    localBrief: true,
    mapActivity: true,
  });
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState(() => suggestUsername(user?.display_name || user?.full_name || ''));
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const steps = useMemo(() => [
    'Name',
    'Photo',
    'Neighborhood',
    'Identity',
    'Friends',
    ...(COMMUNITIES_ENABLED ? ['Communities'] : []),
    'App Tour',
    'Notifications',
  ], []);

  useEffect(() => {
    if (!COMMUNITIES_ENABLED) return undefined;
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

  // Auto-suggest username from display name when user hasn't typed one yet.
  useEffect(() => {
    if (!usernameTouched) {
      setUsername(suggestUsername(name));
      setUsernameAvailable(null);
    }
  }, [name, usernameTouched]);

  // Debounced username availability check.
  useEffect(() => {
    if (!shouldUseSupabase || !supabase) return;
    const raw = username.trim();
    if (!USERNAME_REGEX.test(raw)) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(true);
    setUsernameAvailable(null);
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc('check_username_available', { p_username: raw });
        setUsernameAvailable(data === true);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const canContinue = () => {
    if (step === 0) {
      return (
        name.trim().length >= 2 &&
        USERNAME_REGEX.test(username.trim()) &&
        (!shouldUseSupabase || usernameAvailable === true) &&
        !checkingUsername
      );
    }
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

  const handleFindContacts = async () => {
    setContactsError('');
    setContactsLoading(true);
    try {
      if (!navigator.contacts?.select) {
        setContactsError('This browser cannot read contacts here yet. You can skip this and add friends from profiles.');
        return;
      }

      const contacts = await navigator.contacts.select(['name', 'email', 'tel'], { multiple: true });
      const values = new Set(
        contacts.flatMap((contact) => [
          ...(contact.email || []),
          ...(contact.tel || []),
        ]).map(normalizeContactValue).filter(Boolean)
      );

      if (values.size === 0) {
        setContactsError('No usable email or phone details were found in the selected contacts.');
        return;
      }

      const users = await dataService.entities.User.list('-created_date', 500);
      const matches = users.filter((candidate) => {
        if (candidate.id === user?.id) return false;
        const candidateValues = [
          candidate.email,
          candidate.phone,
          candidate.phone_number,
        ].map(normalizeContactValue).filter(Boolean);
        return candidateValues.some((value) => values.has(value));
      });

      setContactMatches(matches);
      if (matches.length === 0) setContactsError('No current JUnited members matched those contacts yet.');
    } catch {
      setContactsError('Contacts access was not completed. You can safely skip this step.');
    } finally {
      setContactsLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const profilePatch = {
        display_name: name.trim(),
        full_name: name.trim(),
        username: username.trim() || undefined,
        avatar_url: avatarUrl || undefined,
        neighborhood,
        cityPreset: neighborhood,
        city: neighborhood,
        notifications_enabled: Object.values(notificationPrefs).some(Boolean),
        notification_preferences: notificationPrefs,
        shul_preference: shulPreference,
        school_preference: schoolPreference,
        privacy_preference: privacyPreference,
        personalization_profile: {
          town: neighborhood,
          shul: shulPreference,
          school: schoolPreference,
          privacy: privacyPreference,
          interests: user?.interests || [],
        },
        onboarding_complete: true,
        is_profile_complete: true,
      };

      await dataService.auth.updateMe(profilePatch);

      if (COMMUNITIES_ENABLED && selectedCommunityIds.size > 0) {
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

      if (selectedFriendIds.size > 0) {
        await Promise.allSettled(
          contactMatches
            .filter((friend) => selectedFriendIds.has(friend.id))
            .map((friend) => friendsService.addFriend(user, friend))
        );
      }

      // Request push permission if user enabled at least one notification type
      if (Object.values(notificationPrefs).some(Boolean)) {
        const perm = await requestPushPermission();
        if (perm === 'granted') {
          await subscribeToPush(user.id);
        }
      }

      storageService.setItem(getOnboardingStorageKey(user.id), '1');
      onComplete?.({ ...user, ...profilePatch, _joinedCount: selectedCommunityIds.size });
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
    if (['Photo', 'Identity', 'Friends', 'Communities', 'App Tour'].includes(steps[step])) next();
  };

  const currentStep = steps[step];

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

        <div className="mb-5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((item, index) => (
            <div key={item} className={`h-1.5 rounded-full ${index <= step ? 'bg-blue-600' : 'bg-blue-100'}`} />
          ))}
        </div>

        <div className="app-card-soft flex-1 p-4 sm:p-6">
          {currentStep === 'Name' && (
            <NameStep
              name={name}
              setName={setName}
              username={username}
              setUsername={setUsername}
              onUsernameTouched={() => setUsernameTouched(true)}
              usernameAvailable={usernameAvailable}
              checkingUsername={checkingUsername}
            />
          )}
          {currentStep === 'Photo' && (
            <PhotoStep
              name={name}
              avatarUrl={avatarUrl}
              uploading={uploadingPhoto}
              onUpload={handleUpload}
              onSkipPhoto={skip}
            />
          )}
          {currentStep === 'Neighborhood' && <NeighborhoodStep neighborhood={neighborhood} setNeighborhood={setNeighborhood} />}
          {currentStep === 'Identity' && (
            <IdentityContextStep
              shulPreference={shulPreference}
              setShulPreference={setShulPreference}
              schoolPreference={schoolPreference}
              setSchoolPreference={setSchoolPreference}
              privacyPreference={privacyPreference}
              setPrivacyPreference={setPrivacyPreference}
            />
          )}
          {currentStep === 'Friends' && (
            <ContactsStep
              matches={contactMatches}
              selectedIds={selectedFriendIds}
              setSelectedIds={setSelectedFriendIds}
              loading={contactsLoading}
              error={contactsError}
              onFindContacts={handleFindContacts}
            />
          )}
          {currentStep === 'Communities' && (
            <CommunitiesStep
              communities={communities}
              selectedIds={selectedCommunityIds}
              setSelectedIds={setSelectedCommunityIds}
              loading={loadingCommunities}
            />
          )}
          {currentStep === 'App Tour' && <AppTourStep />}
          {currentStep === 'Notifications' && <NotificationsStep preferences={notificationPrefs} setPreferences={setNotificationPrefs} />}
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
          {(step === 1 || step === 3 || step === 4 || step === 5 || step === 6 || step === 7) && (
            <button type="button" onClick={skip} className="h-12 rounded-2xl px-3 text-[13px] font-bold text-slate-400">
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
