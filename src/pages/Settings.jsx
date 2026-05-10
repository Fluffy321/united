import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Camera,
  ChevronRight,
  Globe2,
  HeartHandshake,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Save,
  Search,
  Shield,
  Trash2,
  UserRound,
  Users,
  Wrench,
  Flag,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '@/services';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';

const interestOptions = [
  'Torah & Learning',
  'Chesed',
  'Shuls',
  'Schools',
  'Events',
  'Parents',
  'Singles',
  'Neighborhoods',
  'Food',
  'Business',
  'Volunteering',
  'Youth Programs',
];

const sections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'app', label: 'App', icon: Moon },
  { id: 'account', label: 'Account', icon: Lock },
];

const defaultSettings = {
  notification_settings: {
    messages: true,
    comments: true,
    communityPosts: true,
    eventReminders: true,
    chesedRequests: true,
    weeklyDigest: false,
  },
  message_settings: {
    allowMessagesFrom: 'communities',
    searchable: true,
    showOnlineStatus: true,
  },
  app_settings: {
    compactCards: false,
    reduceMotion: false,
    hebrewDates: true,
    quietMode: false,
  },
  community_settings: {
    primaryNeighborhood: 'Five Towns',
    showSuggestedCommunities: true,
    showPublicProfileToCommunities: true,
    autoFollowJoinedCommunities: true,
  },
};

export default function Settings() {
  const { user: currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    cityPreset: 'Five Towns',
    email: '',
    avatar_url: '',
    interests: [],
    ...defaultSettings,
  });

  const formInitialized = useRef(false);
  useEffect(() => {
    if (!currentUser || formInitialized.current) return;
    formInitialized.current = true;
    setForm({
      display_name: currentUser.display_name || currentUser.full_name || 'Local Demo User',
      bio: currentUser.bio || 'Building stronger Jewish community connections.',
      cityPreset: currentUser.cityPreset || 'Five Towns',
      email: currentUser.email || 'demo@junited.local',
      avatar_url: currentUser.avatar_url || '',
      interests: currentUser.interests || ['Chesed', 'Events', 'Community'],
      notification_settings: {
        ...defaultSettings.notification_settings,
        ...(currentUser.notification_settings || {}),
      },
      message_settings: {
        ...defaultSettings.message_settings,
        ...(currentUser.message_settings || {}),
      },
      app_settings: {
        ...defaultSettings.app_settings,
        ...(currentUser.app_settings || {}),
      },
      community_settings: {
        ...defaultSettings.community_settings,
        ...(currentUser.community_settings || {}),
        primaryNeighborhood: currentUser.cityPreset || defaultSettings.community_settings.primaryNeighborhood,
      },
    });
  }, [currentUser]);

  const activeLabel = useMemo(
    () => sections.find((section) => section.id === activeSection)?.label || 'Settings',
    [activeSection]
  );

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const updateNested = (group, key, value) => {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value,
      },
    }));
  };

  const toggleInterest = (interest) => {
    setForm((current) => {
      const exists = current.interests.includes(interest);
      const nextInterests = exists
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest].slice(0, 6);
      return { ...current, interests: nextInterests };
    });
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    const { file_url } = await dataService.integrations.Core.UploadFile({ file });
    updateForm('avatar_url', file_url);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataService.auth.updateMe({
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
        cityPreset: form.cityPreset,
        avatar_url: form.avatar_url,
        interests: form.interests,
        notification_settings: form.notification_settings,
        message_settings: form.message_settings,
        app_settings: form.app_settings,
        community_settings: form.community_settings,
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Could not save settings');
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 mobile-safe-bottom">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mobile-page-wide flex min-w-0 items-center justify-between gap-2 px-3 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to={createPageUrl('Profile')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Account</p>
              <h1 className="truncate text-xl font-bold text-slate-950">Settings</h1>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:px-4"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </header>

      <div className="mobile-page-wide grid min-w-0 gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="min-w-0 space-y-3">
          <ProfileSummary form={form} onAvatarChange={handleAvatarChange} />

          <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-3 lg:block lg:p-0">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold transition lg:w-full lg:rounded-none lg:border-b lg:border-slate-100 lg:last:border-b-0 ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </span>
                  <ChevronRight className="hidden h-4 w-4 opacity-50 lg:block" />
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-bold text-blue-700">{activeLabel}</p>
            <h2 className="mt-1 text-xl font-bold leading-tight text-slate-950 sm:text-2xl">{sectionTitle(activeSection)}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{sectionDescription(activeSection)}</p>
          </div>

          {activeSection === 'profile' && (
            <SettingsCard title="Profile Information" icon={UserRound}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Display name" value={form.display_name} onChange={(value) => updateForm('display_name', value)} />
                <TextField label="Email" value={form.email} onChange={(value) => updateForm('email', value)} disabled />
                <TextField label="Neighborhood" value={form.cityPreset} onChange={(value) => updateForm('cityPreset', value)} icon={MapPin} />
                <TextField label="Profile photo URL" value={form.avatar_url} onChange={(value) => updateForm('avatar_url', value)} />
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Bio</span>
                  <textarea
                    value={form.bio}
                    onChange={(event) => updateForm('bio', event.target.value)}
                    rows={4}
                    maxLength={220}
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/220</p>
                </label>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-bold text-slate-700">Interests up to 6</p>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => {
                    const active = form.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                          active
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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

          {activeSection === 'community' && (
            <SettingsCard title="Community Preferences" icon={HeartHandshake}>
              <div className="space-y-3">
                <TextField
                  label="Primary neighborhood"
                  value={form.community_settings.primaryNeighborhood}
                  onChange={(value) => updateNested('community_settings', 'primaryNeighborhood', value)}
                  icon={MapPin}
                />
                <ToggleRow
                  icon={Users}
                  title="Show suggested communities"
                  description="Recommend shuls, schools, chesed groups, and neighborhood boards."
                  checked={form.community_settings.showSuggestedCommunities}
                  onChange={(value) => updateNested('community_settings', 'showSuggestedCommunities', value)}
                />
                <ToggleRow
                  icon={Search}
                  title="Show profile to shared communities"
                  description="Let members of your joined communities discover your profile."
                  checked={form.community_settings.showPublicProfileToCommunities}
                  onChange={(value) => updateNested('community_settings', 'showPublicProfileToCommunities', value)}
                />
                <ToggleRow
                  icon={HeartHandshake}
                  title="Follow joined communities automatically"
                  description="Add new joined communities to your Feed and notifications."
                  checked={form.community_settings.autoFollowJoinedCommunities}
                  onChange={(value) => updateNested('community_settings', 'autoFollowJoinedCommunities', value)}
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === 'notifications' && (
            <SettingsCard title="Notification Settings" icon={Bell}>
              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleRow icon={Mail} title="Messages" description="New direct messages." checked={form.notification_settings.messages} onChange={(value) => updateNested('notification_settings', 'messages', value)} />
                <ToggleRow icon={Bell} title="Comments" description="Replies to your posts." checked={form.notification_settings.comments} onChange={(value) => updateNested('notification_settings', 'comments', value)} />
                <ToggleRow icon={Users} title="Community posts" description="Updates from joined groups." checked={form.notification_settings.communityPosts} onChange={(value) => updateNested('notification_settings', 'communityPosts', value)} />
                <ToggleRow icon={Globe2} title="Event reminders" description="Upcoming local events." checked={form.notification_settings.eventReminders} onChange={(value) => updateNested('notification_settings', 'eventReminders', value)} />
                <ToggleRow icon={HeartHandshake} title="Chesed requests" description="Nearby help requests." checked={form.notification_settings.chesedRequests} onChange={(value) => updateNested('notification_settings', 'chesedRequests', value)} />
                <ToggleRow icon={Mail} title="Weekly digest" description="A calm weekly summary." checked={form.notification_settings.weeklyDigest} onChange={(value) => updateNested('notification_settings', 'weeklyDigest', value)} />
              </div>
            </SettingsCard>
          )}

          {activeSection === 'privacy' && (
            <SettingsCard title="Privacy & Safety" icon={Shield}>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Who can message you?</span>
                  <select
                    value={form.message_settings.allowMessagesFrom}
                    onChange={(event) => updateNested('message_settings', 'allowMessagesFrom', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="everyone">Anyone</option>
                    <option value="communities">People in my communities</option>
                    <option value="connections">Only connections</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </label>
                <ToggleRow icon={Search} title="Show profile in search" description="Allow others to find you by name." checked={form.message_settings.searchable} onChange={(value) => updateNested('message_settings', 'searchable', value)} />
                <ToggleRow icon={Users} title="Show online status" description="Let community members see when you are active." checked={form.message_settings.showOnlineStatus} onChange={(value) => updateNested('message_settings', 'showOnlineStatus', value)} />
              </div>
            </SettingsCard>
          )}

          {activeSection === 'app' && (
            <SettingsCard title="App Preferences" icon={Moon}>
              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleRow icon={Moon} title="Quiet mode" description="Reduce attention-grabbing alerts." checked={form.app_settings.quietMode} onChange={(value) => updateNested('app_settings', 'quietMode', value)} />
                <ToggleRow icon={Users} title="Compact cards" description="Show denser Feed and community cards." checked={form.app_settings.compactCards} onChange={(value) => updateNested('app_settings', 'compactCards', value)} />
                <ToggleRow icon={Shield} title="Reduce motion" description="Limit animations and transitions." checked={form.app_settings.reduceMotion} onChange={(value) => updateNested('app_settings', 'reduceMotion', value)} />
                <ToggleRow icon={Globe2} title="Hebrew dates" description="Show Hebrew dates where available." checked={form.app_settings.hebrewDates} onChange={(value) => updateNested('app_settings', 'hebrewDates', value)} />
              </div>
            </SettingsCard>
          )}

          {activeSection === 'account' && currentUser.role === 'admin' && (
            <SettingsCard title="Admin Tools" icon={Wrench}>
              <div className="space-y-2">
                <Link to="/AdminModerationQueue" className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Flag className="h-4 w-4 text-rose-500" />
                  Moderation Queue
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </Link>
                <Link to="/AdminAnalyticsDashboard" className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Analytics Dashboard
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </Link>
                <Link to="/FutureFeatures" className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Future Features
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </Link>
              </div>
            </SettingsCard>
          )}

          {activeSection === 'account' && (
            <SettingsCard title="Account Actions" icon={Lock}>
              <div className="space-y-3">
                <InfoRow title="Account type" value={currentUser.role === 'admin' ? 'Admin' : 'Local demo member'} />
                <InfoRow title="User ID" value={currentUser.id} />
                <button
                  onClick={handleLogout}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out locally
                </button>
                <button
                  onClick={() => {
                    setDeleteText('');
                    setShowDeleteConfirm(true);
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </button>
              </div>
            </SettingsCard>
          )}
        </section>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/40 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl">
            <h2 className="text-lg font-bold text-slate-950">Delete account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              To permanently delete your account and all associated data, email{' '}
              <a href="mailto:support@junited.org" className="font-semibold text-blue-600 underline">
                support@junited.org
              </a>{' '}
              from the address you used to sign up. We process deletion requests within 30 days.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleDeleteAccount}
                className="h-11 flex-1 rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function sectionTitle(section) {
  const titles = {
    profile: 'Your public profile',
    community: 'How communities work for you',
    notifications: 'What should get your attention',
    privacy: 'Control who can find and contact you',
    app: 'Make the app feel comfortable',
    account: 'Login and account actions',
  };
  return titles[section];
}

function sectionDescription(section) {
  const descriptions = {
    profile: 'This is what people see when you post, join a community, or send a message.',
    community: 'Tune the app around your neighborhood and the types of groups you care about.',
    notifications: 'Keep important messages on, and turn down the noise where you want calm.',
    privacy: 'Messaging and search settings help you stay reachable without feeling exposed.',
    app: 'Small quality-of-life preferences for how JUnited looks and behaves.',
    account: 'Basic local account controls while the app is still running in demo mode.',
  };
  return descriptions[section];
}

function ProfileSummary({ form, onAvatarChange }) {
  const initials = (form.display_name || 'User')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
              {initials}
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </label>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-950">{form.display_name}</p>
          <p className="truncate text-sm text-slate-500">{form.cityPreset}</p>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, icon: Icon, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 flex min-w-0 items-center gap-2 text-base font-bold text-slate-950 sm:text-lg">
        <Icon className="h-5 w-5 shrink-0 text-blue-600" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange, disabled = false, icon: Icon }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={`h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400 ${Icon ? 'pl-10' : ''}`}
        />
      </div>
    </label>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-slate-950">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function InfoRow({ title, value }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
      <p className="shrink-0 text-sm font-bold text-slate-700">{title}</p>
      <p className="min-w-0 truncate text-right text-sm text-slate-500">{value}</p>
    </div>
  );
}
