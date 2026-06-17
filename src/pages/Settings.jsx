import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Camera,
  ChevronRight,
  Clock,
  CreditCard,
  Globe2,
  Heart,
  HeartHandshake,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Save,
  Search,
  Shield,
  Smartphone,
  Trash2,
  UserRound,
  Users,
  Wrench,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { dataService, paymentsService } from '@/services';
import { supabase, shouldUseSupabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { getStoredConsent, saveConsent } from '@/lib/cookieConsent';
import { enableAnalytics, optOutAnalytics } from '@/lib/analytics';
import {
  isPushSupported,
  isPushSubscribed,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushSubscription';
import useShabbatLocation from '@/hooks/useShabbatLocation';
import { forwardGeocode, PRESET_LOCATIONS } from '@/lib/shabbatLocation';
import { COMMUNITIES_ENABLED } from '@/config/features';

// ── Constants ─────────────────────────────────────────────────────────────────

const interestOptions = [
  'Torah & Learning', 'Chesed', 'Shuls', 'Schools', 'Events',
  'Parents', 'Singles', 'Neighborhoods', 'Food', 'Business',
  'Volunteering', 'Youth Programs',
];

const sections = [
  { id: 'profile',       label: 'Profile',        icon: UserRound },
  { id: 'community',    label: COMMUNITIES_ENABLED ? 'Community' : 'Local', icon: Users },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'privacy',      label: 'Privacy',         icon: Shield },
  { id: 'app',          label: 'App',             icon: Moon },
  { id: 'account',      label: 'Account',         icon: Lock },
];

const defaultSettings = {
  notification_settings: {
    messages: true, comments: true, communityPosts: true,
    eventReminders: true, chesedRequests: true,
    mitzvahDailyReminders: true, shabbatReminders: true, weeklyDigest: false,
  },
  message_settings: { allowMessagesFrom: 'communities', searchable: true, showOnlineStatus: true },
  app_settings:     { compactCards: false, reduceMotion: false, hebrewDates: true, quietMode: false },
  community_settings: {
    primaryNeighborhood: 'Five Towns',
    showSuggestedCommunities: true,
    showPublicProfileToCommunities: true,
    autoFollowJoinedCommunities: true,
  },
};

function sectionTitle(id) {
  return {
    profile:       'Your public profile',
    community:     'How communities work for you',
    notifications: 'What should get your attention',
    privacy:       'Control who can find and contact you',
    app:           'Make the app feel comfortable',
    account:       'Login and account actions',
  }[id] ?? '';
}

function sectionDescription(id) {
  return {
    profile:       "This is what people see when you post, join a community, or send a message.",
    community:     "Tune the app around your neighborhood and the types of groups you care about.",
    notifications: "Keep important messages on, and turn down the noise where you want calm.",
    privacy:       "Messaging and search settings help you stay reachable without feeling exposed.",
    app:           "Small quality-of-life preferences for how JUnited looks and behaves.",
    account:       "Basic account controls for your JUnited login.",
  }[id] ?? '';
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user: currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving]           = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [analyticsConsent, setAnalyticsConsent]   = useState(
    () => getStoredConsent()?.analytics ?? false,
  );
  const [form, setForm] = useState({ display_name: '', bio: '', username: '',
    cityPreset: 'Five Towns', email: '', avatar_url: '', interests: [], ...defaultSettings });

  const [pushSupported, setPushSupported]   = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading]       = useState(false);

  const [activeSubscription,    setActiveSubscription]    = useState(null);
  const [subscriptionLoading,   setSubscriptionLoading]   = useState(false);
  const [portalLoading,         setPortalLoading]         = useState(false);

  const {
    location: candleLocation,
    locationLoading: candleLocationLoading,
    locationError: candleLocationError,
    isDefault: candleIsDefault,
    requestGPS: requestCandleGPS,
    setManualCity: setCandleManualCity,
    resetToDefault: resetCandleLocation,
  } = useShabbatLocation({ autoRequest: false });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [searchingCity, setSearchingCity] = useState(false);

  const handleCandleGPS = useCallback(async () => {
    await requestCandleGPS();
    setShowLocationPicker(false);
    toast.success('Location updated');
  }, [requestCandleGPS]);

  const handleCitySearch = useCallback(async () => {
    if (!cityQuery.trim()) return;
    setSearchingCity(true);
    const results = await forwardGeocode(cityQuery);
    setCityResults(results.slice(0, 4));
    setSearchingCity(false);
  }, [cityQuery]);

  const handleCitySelect = useCallback((result) => {
    setCandleManualCity(result.lat, result.lng, result.label);
    setShowLocationPicker(false);
    setCityQuery('');
    setCityResults([]);
    toast.success(`Candle-lighting location set to ${result.label}`);
  }, [setCandleManualCity]);

  useEffect(() => {
    setPushSupported(isPushSupported());
    isPushSubscribed().then(setPushSubscribed);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setSubscriptionLoading(true);
    paymentsService.getActiveSubscription()
      .then(setActiveSubscription)
      .catch(() => setActiveSubscription(null))
      .finally(() => setSubscriptionLoading(false));
  }, [currentUser]);

  const handlePushToggle = async (enable) => {
    setPushLoading(true);
    try {
      if (enable) {
        const perm = await requestPushPermission();
        if (perm === 'granted') {
          const ok = await subscribeToPush(currentUser.id);
          if (ok) { setPushSubscribed(true); toast.success('Push notifications enabled'); }
          else toast.error('Could not subscribe — try again');
        } else if (perm === 'denied') {
          toast.message('Notifications are blocked. Enable them in your browser settings.');
        }
      } else {
        await unsubscribeFromPush(currentUser.id);
        setPushSubscribed(false);
        toast.success('Push notifications disabled');
      }
    } catch {
      toast.error('Could not update push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await paymentsService.createPortalSession();
      const portalUrl = res.data?.portalUrl;
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        toast.error('Could not open subscription portal — please try again.');
      }
    } catch {
      toast.error('Could not open subscription portal — please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formInitialized = useRef(false);
  useEffect(() => {
    if (!currentUser || formInitialized.current) return;
    formInitialized.current = true;
    setForm({
      display_name: currentUser.display_name || currentUser.full_name || 'User',
      bio:          currentUser.bio || '',
      username:     currentUser.username || '',
      cityPreset:   currentUser.cityPreset || 'Five Towns',
      email:        currentUser.email || '',
      avatar_url:   currentUser.avatar_url || '',
      interests:    currentUser.interests || [],
      notification_settings: { ...defaultSettings.notification_settings, ...(currentUser.notification_settings || {}) },
      message_settings:      { ...defaultSettings.message_settings,      ...(currentUser.message_settings || {}) },
      app_settings:          { ...defaultSettings.app_settings,          ...(currentUser.app_settings || {}) },
      community_settings: {
        ...defaultSettings.community_settings,
        ...(currentUser.community_settings || {}),
        primaryNeighborhood: currentUser.cityPreset || defaultSettings.community_settings.primaryNeighborhood,
      },
    });
  }, [currentUser]);

  // Username availability check
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername,  setCheckingUsername]  = useState(false);
  useEffect(() => {
    if (!shouldUseSupabase || !supabase || !currentUser?.id) return;
    const raw = (form.username || '').trim();
    if (!raw || !/^[a-z0-9_]{3,30}$/.test(raw)) {
      setUsernameAvailable(null); setCheckingUsername(false); return;
    }
    setCheckingUsername(true); setUsernameAvailable(null);
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc('check_username_available',
          { p_username: raw, p_exclude_user_id: currentUser.id });
        setUsernameAvailable(data === true);
      } catch { setUsernameAvailable(null); } finally { setCheckingUsername(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.username, currentUser?.id]);

  const updateForm   = (k, v)      => setForm(s => ({ ...s, [k]: v }));
  const updateNested = (g, k, v)   => setForm(s => ({ ...s, [g]: { ...s[g], [k]: v } }));

  const handleShabbatReminderToggle = async (value) => {
    updateNested('notification_settings', 'shabbatReminders', value);
    if (!value || typeof Notification === 'undefined') return;
    try {
      const p = await Notification.requestPermission();
      if (p === 'granted') toast.success('Shabbat reminders enabled');
      else toast.message('Enable browser notifications to receive Shabbat reminders');
    } catch { toast.message('Open browser notification permissions to receive Shabbat reminders'); }
  };

  const handleMitzvahReminderToggle = async (value) => {
    updateNested('notification_settings', 'mitzvahDailyReminders', value);
    if (!value || typeof Notification === 'undefined') return;
    try {
      const p = await Notification.requestPermission();
      if (p === 'granted') toast.success('Daily mitzvah reminders enabled');
      else toast.message('Enable browser notifications to receive mitzvah reminders');
    } catch { toast.message('Open browser notification permissions to receive mitzvah reminders'); }
  };

  const toggleInterest = (interest) => setForm(s => {
    const has = s.interests.includes(interest);
    return { ...s, interests: has
      ? s.interests.filter(i => i !== interest)
      : [...s.interests, interest].slice(0, 6) };
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    const { file_url } = await dataService.integrations.Core.UploadFile({ file, bucket: 'avatars' });
    updateForm('avatar_url', file_url);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataService.auth.updateMe({
        display_name: form.display_name.trim(),
        bio:          form.bio.trim(),
        username:     form.username.trim() || null,
        cityPreset:   form.cityPreset,
        avatar_url:   form.avatar_url,
        interests:    form.interests,
        notification_settings: form.notification_settings,
        message_settings:      form.message_settings,
        app_settings:          form.app_settings,
        community_settings:    form.community_settings,
      });
      toast.success('Settings saved');
    } catch { toast.error('Could not save settings'); }
    setIsSaving(false);
  };

  const handleLogout = async () => { await logout(); toast.success('Logged out'); };

  if (!currentUser) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
    </div>
  );

  const n = form.notification_settings;
  const a = form.app_settings;

  return (
    <main className="min-h-screen bg-slate-50 mobile-safe-bottom">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mobile-page-wide flex items-center gap-3 px-4 py-3">
          <Link
            to={createPageUrl('Profile')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Account</p>
            <h1 className="text-[17px] font-bold text-slate-950">Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-[13px] font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </header>

      <div className="mobile-page-wide space-y-3 px-4 py-4">

        {/* ── Sidebar: profile summary + section nav ── */}
        <ProfileSummary form={form} onAvatarChange={handleAvatarChange} />

        <nav className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {sections.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 transition ${
                  active ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`text-[11px] font-semibold leading-none ${active ? 'text-blue-700' : 'text-slate-500'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── Section content ── */}
        <div className="space-y-3">

          {/* Section heading */}
          <div className="px-1 pt-1">
            <h2 className="text-base font-bold text-slate-900">{sectionTitle(activeSection)}</h2>
            <p className="mt-0.5 text-[13px] leading-5 text-slate-500">{sectionDescription(activeSection)}</p>
          </div>

          {/* ─── Profile ─────────────────────────────── */}
          {activeSection === 'profile' && (
            <SettingsCard title="Profile Information" icon={UserRound}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Display name" value={form.display_name} onChange={v => updateForm('display_name', v)} />
                <div className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Username</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">@</span>
                    <input
                      value={form.username}
                      onChange={e => updateForm('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))}
                      placeholder="your_handle"
                      className="h-11 w-full min-w-0 rounded-xl border border-slate-200 pl-8 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <p className={`mt-1 text-xs font-semibold ${
                    checkingUsername ? 'text-slate-400' :
                    usernameAvailable === true  ? 'text-emerald-600' :
                    usernameAvailable === false ? 'text-rose-500' : 'text-slate-400'
                  }`}>
                    {checkingUsername ? 'Checking…' :
                     usernameAvailable === true  ? 'Username available ✓' :
                     usernameAvailable === false ? 'That username is already taken' :
                     'Letters, numbers, underscores · 3–30 chars'}
                  </p>
                </div>
                <TextField label="Email" value={form.email} onChange={v => updateForm('email', v)} disabled />
                <TextField label="Neighborhood" value={form.cityPreset} onChange={v => updateForm('cityPreset', v)} icon={MapPin} />
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Bio</span>
                  <textarea
                    value={form.bio}
                    onChange={e => updateForm('bio', e.target.value)}
                    rows={3}
                    maxLength={220}
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/220</p>
                </label>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-2.5 text-[13px] font-semibold text-slate-700">Interests <span className="font-normal text-slate-400">(up to 6)</span></p>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map(interest => {
                    const active = form.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
                          active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SettingsCard>
          )}

          {/* ─── Community / Local ─────────────────────── */}
          {activeSection === 'community' && (
            <SettingsCard title={COMMUNITIES_ENABLED ? 'Community Preferences' : 'Local Preferences'} icon={Users}>
              <div className="mb-4">
                <TextField
                  label="Primary neighborhood"
                  value={form.community_settings.primaryNeighborhood}
                  onChange={v => updateNested('community_settings', 'primaryNeighborhood', v)}
                  icon={MapPin}
                />
              </div>
              <div className="divide-y divide-slate-100">
                {COMMUNITIES_ENABLED ? (
                  <>
                    <SettingsRow icon={Users} title="Show suggested communities" description="Recommend shuls, schools, chesed groups, and neighborhood boards.">
                      <Toggle checked={form.community_settings.showSuggestedCommunities} onChange={v => updateNested('community_settings', 'showSuggestedCommunities', v)} label="Show suggested communities" />
                    </SettingsRow>
                    <SettingsRow icon={Search} title="Show profile to shared communities" description="Let members of your joined communities discover your profile.">
                      <Toggle checked={form.community_settings.showPublicProfileToCommunities} onChange={v => updateNested('community_settings', 'showPublicProfileToCommunities', v)} label="Show profile to communities" />
                    </SettingsRow>
                    <SettingsRow icon={HeartHandshake} title="Follow joined communities automatically" description="Add new joined communities to your Feed and notifications.">
                      <Toggle checked={form.community_settings.autoFollowJoinedCommunities} onChange={v => updateNested('community_settings', 'autoFollowJoinedCommunities', v)} label="Auto-follow joined communities" />
                    </SettingsRow>
                  </>
                ) : (
                  <SettingsRow icon={MapPin} title="Use local context" description="Keep nearby updates and reminders focused on your primary neighborhood.">
                    <Toggle checked={form.community_settings.showSuggestedCommunities} onChange={v => updateNested('community_settings', 'showSuggestedCommunities', v)} label="Use local context" />
                  </SettingsRow>
                )}
              </div>
            </SettingsCard>
          )}

          {/* ─── Notifications ────────────────────────── */}
          {activeSection === 'notifications' && (
            <>
            <SettingsCard title="Notification Settings" icon={Bell}>
              <div className="divide-y divide-slate-100">
                {pushSupported && (
                  <SettingsRow
                    icon={Smartphone}
                    title="Push notifications"
                    description={pushSubscribed ? 'Notifications are delivered to this device.' : 'Enable to receive alerts even when the app is closed.'}
                  >
                    <Toggle
                      checked={pushSubscribed}
                      onChange={handlePushToggle}
                      label="Push notifications"
                      disabled={pushLoading}
                    />
                  </SettingsRow>
                )}
                <SettingsRow icon={Mail} title="Messages" description="Get notified when someone sends you a direct message.">
                  <Toggle checked={n.messages} onChange={v => updateNested('notification_settings', 'messages', v)} label="Messages" />
                </SettingsRow>
                <SettingsRow icon={Bell} title="Comments" description="Replies to your posts and comments.">
                  <Toggle checked={n.comments} onChange={v => updateNested('notification_settings', 'comments', v)} label="Comments" />
                </SettingsRow>
                <SettingsRow icon={Users} title="Community posts" description="Updates from communities you've joined.">
                  <Toggle checked={n.communityPosts} onChange={v => updateNested('notification_settings', 'communityPosts', v)} label="Community posts" />
                </SettingsRow>
                <SettingsRow icon={Globe2} title="Event reminders" description="Upcoming events in your communities.">
                  <Toggle checked={n.eventReminders} onChange={v => updateNested('notification_settings', 'eventReminders', v)} label="Event reminders" />
                </SettingsRow>
                <SettingsRow icon={HeartHandshake} title="Chesed requests" description="Help requests posted near you.">
                  <Toggle checked={n.chesedRequests} onChange={v => updateNested('notification_settings', 'chesedRequests', v)} label="Chesed requests" />
                </SettingsRow>
                <SettingsRow icon={HeartHandshake} title="Daily mitzvah tracker" description="Morning and evening nudges to log your mitzvot and keep your streak.">
                  <Toggle checked={n.mitzvahDailyReminders} onChange={handleMitzvahReminderToggle} label="Daily mitzvah tracker" />
                </SettingsRow>
                <SettingsRow icon={Clock} title="Shabbat reminders" description="Alert 20 minutes before candle lighting and when Shabbat ends.">
                  <Toggle checked={n.shabbatReminders} onChange={handleShabbatReminderToggle} label="Shabbat reminders" />
                </SettingsRow>
                <SettingsRow icon={Mail} title="Weekly digest" description="A calm weekly summary of your communities.">
                  <Toggle checked={n.weeklyDigest} onChange={v => updateNested('notification_settings', 'weeklyDigest', v)} label="Weekly digest" />
                </SettingsRow>
              </div>
            </SettingsCard>

            {/* ─── Candle-lighting location ───────────── */}
            <SettingsCard title="Candle-lighting location" icon={MapPin}>
              <p className="mb-3 text-[12.5px] text-slate-500 leading-relaxed">
                Candle-lighting and Shabbat reminder times are calculated for this location.
                Times use the standard 18-minute candle-lighting offset before sunset.
              </p>

              {/* Current location status */}
              <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-rose-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-900 truncate">{candleLocation.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {candleLocationLoading
                      ? 'Detecting location…'
                      : candleLocation.type === 'gps'
                        ? 'Using your device location'
                        : candleLocation.type === 'manual'
                          ? 'Manually set'
                          : 'Default location'}
                  </p>
                  {candleLocationError === 'declined' && (
                    <p className="text-[11px] text-amber-600 mt-0.5">Location permission denied — using default.</p>
                  )}
                </div>
              </div>

              {!showLocationPicker ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowLocationPicker(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition"
                  >
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    Change location
                  </button>
                  {!candleIsDefault && (
                    <button
                      onClick={() => { resetCandleLocation(); toast.success('Reset to Five Towns default'); }}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-500 hover:bg-slate-50 active:scale-[0.98] transition"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleCandleGPS}
                    disabled={candleLocationLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white disabled:opacity-60 active:scale-[0.98] transition"
                  >
                    {candleLocationLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <MapPin className="h-4 w-4" />}
                    Use my device's location
                  </button>

                  <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wide">or choose a city</p>

                  {/* Preset cities */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_LOCATIONS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleCitySelect(preset)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left text-[12px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 active:scale-[0.98] transition truncate"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Free-text search */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cityQuery}
                      onChange={e => { setCityQuery(e.target.value); setCityResults([]); }}
                      onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                      placeholder="Search any city…"
                      className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      onClick={handleCitySearch}
                      disabled={searchingCity || !cityQuery.trim()}
                      className="h-10 rounded-xl bg-slate-100 px-3 text-[12px] font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-200 transition"
                    >
                      {searchingCity ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                    </button>
                  </div>
                  {cityResults.length > 0 && (
                    <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                      {cityResults.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => handleCitySelect(r)}
                          className="w-full px-3 py-2.5 text-left text-[13px] font-medium text-slate-800 hover:bg-blue-50 transition"
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {cityResults.length === 0 && cityQuery && !searchingCity && (
                    <p className="text-[12px] text-slate-400 text-center py-1">No results found — try a different search.</p>
                  )}

                  <button
                    onClick={() => { setShowLocationPicker(false); setCityQuery(''); setCityResults([]); }}
                    className="w-full text-center text-[12.5px] text-slate-400 py-1 hover:text-slate-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </SettingsCard>
            </>
          )}

          {/* ─── Privacy ──────────────────────────────── */}
          {activeSection === 'privacy' && (
            <>
              <SettingsCard title="Privacy & Safety" icon={Shield}>
                <div className="mb-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Who can message you?</span>
                    <select
                      value={form.message_settings.allowMessagesFrom}
                      onChange={e => updateNested('message_settings', 'allowMessagesFrom', e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="everyone">Anyone</option>
                      <option value="communities">People in my communities</option>
                      <option value="connections">Only connections</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </label>
                </div>
                <div className="divide-y divide-slate-100">
                  <SettingsRow icon={Search} title="Show profile in search" description="Allow others to find you by name or username.">
                    <Toggle checked={form.message_settings.searchable} onChange={v => updateNested('message_settings', 'searchable', v)} label="Show profile in search" />
                  </SettingsRow>
                  <SettingsRow icon={Users} title="Show online status" description="Let community members see when you're active.">
                    <Toggle checked={form.message_settings.showOnlineStatus} onChange={v => updateNested('message_settings', 'showOnlineStatus', v)} label="Show online status" />
                  </SettingsRow>
                </div>
              </SettingsCard>

              <SettingsCard title="Cookie Preferences" icon={Lock}>
                {/* Essential — locked */}
                <div className="flex items-center gap-3 border-b border-slate-100 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-slate-900">Essential cookies</p>
                    <p className="mt-0.5 text-xs text-slate-500">Login, security, and core features. Required for the app to work.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                    Always on
                  </span>
                </div>
                {/* Analytics — user-controlled */}
                <div className="flex items-center gap-3 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Globe2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-slate-900">Analytics cookies</p>
                    <p className="mt-0.5 text-xs text-slate-500">Help us improve the app. Your content is never shared. Optional.</p>
                  </div>
                  <Toggle
                    checked={analyticsConsent}
                    label="Analytics cookies"
                    onChange={next => {
                      setAnalyticsConsent(next);
                      saveConsent(next);
                      if (next) { enableAnalytics(); toast.success('Analytics enabled'); }
                      else      { optOutAnalytics(); toast.success('Analytics disabled'); }
                    }}
                  />
                </div>
                <p className="pb-2 text-xs text-slate-400">
                  Your preference is saved in this browser.{' '}
                  <Link to="/privacy" className="text-blue-500 underline underline-offset-2">Privacy Policy</Link>
                </p>
              </SettingsCard>
            </>
          )}

          {/* ─── App ──────────────────────────────────── */}
          {activeSection === 'app' && (
            <>
              <SettingsCard title="App Preferences" icon={Moon}>
                <div className="divide-y divide-slate-100">
                  <SettingsRow icon={Moon} title="Quiet mode" description="Reduce attention-grabbing alerts and motion.">
                    <Toggle checked={a.quietMode} onChange={v => updateNested('app_settings', 'quietMode', v)} label="Quiet mode" />
                  </SettingsRow>
                  <SettingsRow icon={Users} title="Compact cards" description="Show denser Feed and community cards.">
                    <Toggle checked={a.compactCards} onChange={v => updateNested('app_settings', 'compactCards', v)} label="Compact cards" />
                  </SettingsRow>
                  <SettingsRow icon={Shield} title="Reduce motion" description="Limit animations and page transitions.">
                    <Toggle checked={a.reduceMotion} onChange={v => updateNested('app_settings', 'reduceMotion', v)} label="Reduce motion" />
                  </SettingsRow>
                  <SettingsRow icon={Globe2} title="Hebrew dates" description="Show the Hebrew calendar date where available.">
                    <Toggle checked={a.hebrewDates} onChange={v => updateNested('app_settings', 'hebrewDates', v)} label="Hebrew dates" />
                  </SettingsRow>
                </div>
              </SettingsCard>

              <SettingsCard>
                <Link
                  to="/MitzvahCircle"
                  className="flex items-center gap-3 py-3.5 text-slate-700 transition hover:text-slate-900"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                    <Heart className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-slate-900">Mitzvah Circle</p>
                    <p className="mt-0.5 text-[12px] leading-4 text-slate-500">Find ways to help or post a local need.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              </SettingsCard>
            </>
          )}

          {/* ─── Account ──────────────────────────────── */}
          {activeSection === 'account' && (
            <>
              {/* Admin Tools — only for admins */}
              {currentUser.role === 'admin' && (
                <SettingsCard title="Admin Tools" icon={Wrench}>
                  <div className="divide-y divide-slate-100">
                    {[
                      { to: '/AdminModerationQueue',   icon: Flag,        label: 'Moderation Queue',         color: 'text-rose-500' },
                      { to: '/AdminAnalyticsDashboard', icon: Shield,     label: 'Analytics Dashboard',      color: 'text-blue-500' },
                      { to: '/AdminFeedbackInbox',      icon: Inbox,      label: 'Feedback Inbox',           color: 'text-violet-500' },
                    ].map(({ to, icon: Icon, label, color }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-3 py-3.5 text-slate-700 transition hover:text-slate-900"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <span className="flex-1 text-[13.5px] font-semibold">{label}</span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </Link>
                    ))}
                  </div>
                </SettingsCard>
              )}

              {/* Account info */}
              <SettingsCard title="Account" icon={Lock}>
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-[13.5px] font-semibold text-slate-700">Account type</span>
                    <span className="text-[13px] text-slate-500 capitalize">{currentUser.role ?? 'member'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-3.5">
                    <span className="shrink-0 text-[13.5px] font-semibold text-slate-700">User ID</span>
                    <span className="min-w-0 truncate text-right font-mono text-[11px] text-slate-400">{currentUser.id}</span>
                  </div>
                  {/* Manage Subscription — visible only when an active subscription exists */}
                  {!subscriptionLoading && activeSubscription && (
                    <div className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 shrink-0 text-rose-400" />
                        <div>
                          <p className="text-[13.5px] font-semibold text-slate-700">Manage Subscription</p>
                          <p className="text-[11.5px] text-slate-400 capitalize">
                            {activeSubscription.tier} · {activeSubscription.interval}
                            {activeSubscription.cancel_at_period_end ? ' · Cancels at period end' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleOpenPortal}
                        disabled={portalLoading}
                        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                      >
                        {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                        {portalLoading ? 'Opening…' : 'Manage'}
                      </button>
                    </div>
                  )}
                </div>
              </SettingsCard>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-[13.5px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
                Sign out
              </button>

              {/* Danger zone */}
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-red-500">Danger Zone</p>
                <p className="mb-3 text-[13px] text-red-700">Permanently delete your account and all your data.</p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[13px] font-bold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete my account
                </button>
              </div>
            </>
          )}

        </div>{/* end space-y-3 content */}
      </div>{/* end mobile-page-wide */}

      {/* ── Delete confirmation sheet ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl">
            <h2 className="text-lg font-bold text-slate-950">Delete account</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              To permanently delete your account and all associated data, email{' '}
              <a href="mailto:support@junited.org" className="font-semibold text-blue-600 underline">
                support@junited.org
              </a>{' '}
              from the address you used to sign up. We process deletion requests within 30 days.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="mt-5 h-11 w-full rounded-xl bg-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileSummary({ form, onAvatarChange }) {
  const initials = (form.display_name || 'U')
    .split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="relative shrink-0">
        {form.avatar_url ? (
          <img src={form.avatar_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-base font-black text-white">
            {initials}
          </div>
        )}
        <label className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-slate-800 text-white shadow-sm transition hover:bg-slate-700">
          <Camera className="h-3.5 w-3.5" />
          <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        </label>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-slate-950">{form.display_name || 'Your Name'}</p>
        <p className="truncate text-[13px] text-slate-500">{form.cityPreset}</p>
      </div>
    </div>
  );
}

/** White card with a header row (icon + title) and padded content below */
function SettingsCard({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-blue-600" />}
          <h3 className="text-[13px] font-bold text-slate-800">{title}</h3>
        </div>
      )}
      <div className="px-4 pb-1">{children}</div>
    </section>
  );
}

/** Full-width settings row: icon + label/description on left, children (toggle) on right.
 *  Used inside a divide-y container inside SettingsCard. */
function SettingsRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex min-w-0 min-h-[52px] items-center gap-3 py-3.5">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-[17px] w-[17px]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold leading-tight text-slate-900">{title}</p>
        {description && <p className="mt-0.5 text-[12px] leading-4 text-slate-500">{description}</p>}
      </div>
      {children && <div className="ml-2 shrink-0">{children}</div>}
    </div>
  );
}

/** The toggle switch control — used inside SettingsRow */
function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );
}

function TextField({ label, value, onChange, disabled = false, icon: Icon }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</span>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400 ${Icon ? 'pl-10' : ''}`}
        />
      </div>
    </label>
  );
}
