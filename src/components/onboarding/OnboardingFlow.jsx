import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, MapPin, Sparkles, Users, Check, Loader2,
  Camera, Bell, HandHeart, BookOpen, School, Star
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ── Constants ─────────────────────────────────────────────────────────────────

const CITIES = [
  { id: 'Five Towns', label: 'Five Towns', emoji: '🏠' },
  { id: 'Brooklyn', label: 'Brooklyn', emoji: '🌉' },
  { id: 'Lakewood', label: 'Lakewood', emoji: '🌲' },
  { id: 'Miami', label: 'Miami', emoji: '🌴' },
  { id: 'Boca Raton', label: 'Boca Raton', emoji: '☀️' },
  { id: 'Manhattan', label: 'Manhattan', emoji: '🗽' },
  { id: 'New Jersey', label: 'New Jersey', emoji: '🏙️' },
  { id: 'Other', label: 'Other', emoji: '📍' },
];

const SUB_NEIGHBORHOODS = {
  'Five Towns': ['Lawrence', 'Cedarhurst', 'Woodmere', 'Hewlett', 'Inwood', 'Far Rockaway'],
  'Brooklyn': ['Flatbush', 'Boro Park', 'Crown Heights', 'Williamsburg', 'Marine Park', 'Midwood'],
  'Lakewood': ['Jackson', 'Howell', 'Toms River', 'Other NJ'],
  'Miami': ['Aventura', 'Bal Harbour', 'Sunny Isles', 'North Miami Beach', 'Miami Beach'],
  'Boca Raton': ['West Boca', 'East Boca', 'Delray Beach'],
  'Manhattan': ['Upper West Side', 'Upper East Side', 'Washington Heights', 'Lower East Side'],
  'New Jersey': ['Passaic', 'Teaneck', 'Bergenfield', 'Fair Lawn', 'Edison'],
  'Other': [],
};

const INTERESTS = [
  { label: 'Daf Yomi', emoji: '📖' },
  { label: 'Torah & Learning', emoji: '📚' },
  { label: 'Chesed & Volunteering', emoji: '🤝' },
  { label: 'Young Professional', emoji: '💼' },
  { label: 'Parent', emoji: '👨‍👩‍👧' },
  { label: 'Baal Teshuva', emoji: '✨' },
  { label: 'Alumni Network', emoji: '🎓' },
  { label: 'Events & Social', emoji: '🎉' },
  { label: 'Sports & Fitness', emoji: '🏀' },
  { label: 'Food & Kosher', emoji: '🍽️' },
  { label: 'Shabbos Hosting', emoji: '🕍' },
  { label: 'Music & Art', emoji: '🎵' },
  { label: 'Dating & Shidduchim', emoji: '💕' },
  { label: 'Israel & Zionism', emoji: '🇮🇱' },
];

const HELP_INTENTS = [
  { id: 'help_others', label: 'Mostly here to help', emoji: '🤲', desc: 'I want to give back and support others' },
  { id: 'get_help', label: 'Mostly here to get help', emoji: '🙏', desc: 'I could use some community support' },
  { id: 'both', label: 'Both — give and receive', emoji: '💛', desc: 'I\'m here to help and be helped' },
];

const STEPS = ['welcome', 'profile', 'location', 'shul', 'schools', 'interests', 'intent', 'communities', 'notifications'];

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// ── Step Components ───────────────────────────────────────────────────────────

function WelcomeStep({ userName }) {
  return (
    <div className="text-center pt-4 pb-8">
      <div className="text-6xl mb-6">🙌</div>
      <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-3">
        Welcome to Kehilla!<br />
        <span className="text-blue-600">{userName?.split(' ')[0] || 'Friend'}</span>
      </h1>
      <p className="text-[15px] text-slate-500 leading-relaxed max-w-xs mx-auto">
        Your Jewish community hub for local news, chesed, events, and connection. Let's get you set up in a few quick steps.
      </p>
      <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
        {[
          { icon: '📍', text: 'Find your neighborhood' },
          { icon: '⭐', text: 'Choose your interests' },
          { icon: '🤝', text: 'Join communities that matter to you' },
          { icon: '🔔', text: 'Stay in the loop' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-blue-100">
            <span className="text-xl">{icon}</span>
            <span className="text-[14px] font-semibold text-slate-700">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileStep({ displayName, setDisplayName, avatarUrl, onUploadAvatar, uploading }) {
  const fileRef = useRef(null);
  return (
    <div className="pb-8">
      <h2 className="text-[22px] font-bold text-slate-900 mb-1">Your profile</h2>
      <p className="text-[14px] text-slate-400 mb-6">Add your name and a photo so neighbors recognize you.</p>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center relative cursor-pointer overflow-hidden"
          onClick={() => fileRef.current?.click()}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-blue-600">{displayName?.[0]?.toUpperCase() || '?'}</span>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
            <Camera className="w-6 h-6 text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUploadAvatar} />
        <button
          className="mt-2 text-[13px] text-blue-600 font-semibold"
          onClick={() => fileRef.current?.click()}
        >
          {avatarUrl ? 'Change photo' : 'Add photo'}
        </button>
      </div>

      {/* Name */}
      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Display name *</label>
      <input
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        placeholder="e.g. Moshe Goldberg"
        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-[15px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
      />
    </div>
  );
}

function LocationStep({ city, setCity, neighborhood, setNeighborhood }) {
  const subs = SUB_NEIGHBORHOODS[city] || [];
  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h2 className="text-[22px] font-bold text-slate-900">Where are you?</h2>
      </div>
      <p className="text-[14px] text-slate-400 mb-5">Pick your home network so we can show you what's nearby.</p>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {CITIES.map(c => (
          <button
            key={c.id}
            onClick={() => { setCity(c.id); setNeighborhood(''); }}
            className="py-3 px-3 rounded-2xl text-[13px] font-semibold text-left transition-all active:scale-[0.97] border flex items-center gap-2"
            style={
              city === c.id
                ? { background: '#2563EB', color: 'white', borderColor: '#2563EB' }
                : { background: 'white', color: '#1E3A5F', borderColor: '#BFDBFE' }
            }
          >
            <span className="text-lg">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {subs.length > 0 && (
        <>
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Sub-neighborhood (optional)</p>
          <div className="flex flex-wrap gap-2">
            {subs.map(s => (
              <button
                key={s}
                onClick={() => setNeighborhood(neighborhood === s ? '' : s)}
                className="px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-all"
                style={
                  neighborhood === s
                    ? { background: '#EFF6FF', borderColor: '#2563EB', color: '#1D4ED8' }
                    : { background: 'white', borderColor: '#BFDBFE', color: '#475569' }
                }
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ShulStep({ shul, setShul }) {
  const [query, setQuery] = useState('');
  const SHULS = [
    'Young Israel of Woodmere', 'Young Israel of Lawrence-Cedarhurst',
    'Congregation Anshei Chesed', 'The Seabreeze Jewish Center',
    'Congregation Beis Medrash Ohr Chaim', 'White Shul (Far Rockaway)',
    'Aish Kodesh', 'Beis Medrash of Hewlett', 'Hebrew Institute of Riverdale',
    'Congregation Shearith Israel', 'Young Israel of Flatbush',
    'Agudath Israel of Flatbush',
  ];
  const filtered = query ? SHULS.filter(s => s.toLowerCase().includes(query.toLowerCase())) : SHULS;

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🕍</span>
        <h2 className="text-[22px] font-bold text-slate-900">Your primary shul</h2>
      </div>
      <p className="text-[14px] text-slate-400 mb-5">We'll connect you with your shul community.</p>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search for your shul…"
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-[14px] focus:outline-none focus:border-blue-400 mb-3 bg-white"
      />

      {shul && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl mb-3">
          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-[14px] font-semibold text-blue-700">{shul}</span>
          <button onClick={() => setShul('')} className="ml-auto text-[12px] text-slate-400">Clear</button>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filtered.map(s => (
          <button
            key={s}
            onClick={() => setShul(s)}
            className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium border transition-all"
            style={
              shul === s
                ? { background: '#EFF6FF', borderColor: '#2563EB', color: '#1D4ED8', fontWeight: 700 }
                : { background: 'white', borderColor: '#E2E8F0', color: '#374151' }
            }
          >
            {s}
          </button>
        ))}
        {query && !SHULS.some(s => s.toLowerCase() === query.toLowerCase()) && (
          <button
            onClick={() => setShul(query)}
            className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold text-blue-600 border border-blue-200 bg-blue-50"
          >
            + Add "{query}"
          </button>
        )}
      </div>
    </div>
  );
}

function SchoolsStep({ schools, setSchools }) {
  const [query, setQuery] = useState('');
  const SCHOOLS = [
    'HAFTR', 'DRS (Davis Renov Stahler)', 'HALB', 'SKA', 'North Shore Hebrew Academy',
    'Rambam Mesivta', 'Torah Academy of the Five Towns', 'Yeshiva Har Torah',
    'Flatbush Yeshiva', 'Torah Vodaath', 'Chaim Berlin', 'Mir Yeshiva',
    'Beth Jacob of Boro Park', 'Bais Yaakov of Brooklyn',
  ];
  const filtered = query ? SCHOOLS.filter(s => s.toLowerCase().includes(query.toLowerCase())) : SCHOOLS;

  const toggle = (school) => {
    setSchools(prev => prev.includes(school) ? prev.filter(s => s !== school) : [...prev, school]);
  };

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-1">
        <School className="w-5 h-5 text-blue-600" />
        <h2 className="text-[22px] font-bold text-slate-900">Schools</h2>
      </div>
      <p className="text-[14px] text-slate-400 mb-2">Add schools you attended, your children attend, or you're connected to.</p>

      {schools.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {schools.map(s => (
            <span
              key={s}
              onClick={() => toggle(s)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-[12px] font-semibold cursor-pointer"
            >
              {s} <span className="opacity-70">×</span>
            </span>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search schools…"
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-[14px] focus:outline-none focus:border-blue-400 mb-3 bg-white"
      />

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {filtered.map(s => {
          const active = schools.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggle(s)}
              className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium border transition-all flex items-center justify-between"
              style={
                active
                  ? { background: '#EFF6FF', borderColor: '#2563EB', color: '#1D4ED8', fontWeight: 700 }
                  : { background: 'white', borderColor: '#E2E8F0', color: '#374151' }
              }
            >
              {s}
              {active && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            </button>
          );
        })}
        {query && !SCHOOLS.some(s => s.toLowerCase() === query.toLowerCase()) && (
          <button
            onClick={() => { toggle(query); setQuery(''); }}
            className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold text-blue-600 border border-blue-200 bg-blue-50"
          >
            + Add "{query}"
          </button>
        )}
      </div>
    </div>
  );
}

function InterestsStep({ selected, onToggle }) {
  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-1">
        <Star className="w-5 h-5 text-blue-600" />
        <h2 className="text-[22px] font-bold text-slate-900">Your interests</h2>
      </div>
      <p className="text-[14px] text-slate-400 mb-5">Pick all that apply — we'll personalize your feed.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {INTERESTS.map(({ label, emoji }) => {
          const active = selected.includes(label);
          return (
            <button
              key={label}
              onClick={() => onToggle(label)}
              className="flex items-center gap-2.5 py-3 px-3.5 rounded-2xl text-left transition-all active:scale-[0.97] border"
              style={
                active
                  ? { background: '#EFF6FF', borderColor: '#2563EB' }
                  : { background: 'white', borderColor: '#BFDBFE' }
              }
            >
              <span className="text-xl flex-shrink-0">{emoji}</span>
              <span className="text-[12px] font-semibold text-slate-800 leading-tight flex-1">{label}</span>
              {active && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IntentStep({ intent, setIntent }) {
  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-1">
        <HandHeart className="w-5 h-5 text-blue-600" />
        <h2 className="text-[22px] font-bold text-slate-900">Why are you here?</h2>
      </div>
      <p className="text-[14px] text-slate-400 mb-5">This helps us match you with the right people and opportunities.</p>
      <div className="space-y-3">
        {HELP_INTENTS.map(({ id, label, emoji, desc }) => (
          <button
            key={id}
            onClick={() => setIntent(id)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-left border-2 transition-all active:scale-[0.98]"
            style={
              intent === id
                ? { background: '#EFF6FF', borderColor: '#2563EB' }
                : { background: 'white', borderColor: '#BFDBFE' }
            }
          >
            <span className="text-3xl flex-shrink-0">{emoji}</span>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-slate-900">{label}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{desc}</p>
            </div>
            {intent === id && <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function CommunitiesStep({ suggestions, selected, onToggle, loading }) {
  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-[22px] font-bold text-slate-900">Suggested for you</h2>
      </div>
      <p className="text-[14px] text-slate-400 mb-5">Based on your answers — join any that interest you.</p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {suggestions.map(({ id, name, emoji, desc, follower_count }) => {
            const active = selected.has(id);
            return (
              <button
                key={id}
                onClick={() => onToggle(id)}
                className="w-full flex items-center gap-3.5 py-3.5 px-4 rounded-2xl text-left transition-all active:scale-[0.99] border"
                style={
                  active
                    ? { background: '#EFF6FF', borderColor: '#2563EB' }
                    : { background: 'white', borderColor: '#BFDBFE' }
                }
              >
                <span className="text-2xl flex-shrink-0">{emoji || '👥'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900 truncate">{name}</p>
                  <p className="text-[11px] text-slate-400">{desc || `${follower_count || 0} members`}</p>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                  style={active
                    ? { background: '#2563EB', borderColor: '#2563EB' }
                    : { background: 'white', borderColor: '#BFDBFE' }
                  }
                >
                  {active && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <button
          className="mt-3 text-[13px] text-blue-600 font-semibold w-full text-center"
          onClick={() => suggestions.forEach(s => !selected.has(s.id) && onToggle(s.id))}
        >
          Join all →
        </button>
      )}
    </div>
  );
}

function NotificationsStep({ enabled, setEnabled }) {
  const handleEnable = async () => {
    if (!('Notification' in window)) { setEnabled(true); return; }
    try {
      const permission = await Notification.requestPermission();
      setEnabled(permission === 'granted');
    } catch {
      setEnabled(false);
    }
  };

  return (
    <div className="pb-8 text-center">
      <div className="text-6xl mb-5">🔔</div>
      <h2 className="text-[22px] font-bold text-slate-900 mb-2">Stay in the loop</h2>
      <p className="text-[14px] text-slate-500 leading-relaxed mb-8 max-w-xs mx-auto">
        Get notified about chesed opportunities, events, and messages from your community.
      </p>
      {enabled ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-[16px] font-bold text-green-700">Notifications enabled! 🎉</p>
        </div>
      ) : (
        <button
          onClick={handleEnable}
          className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
        >
          <Bell className="w-5 h-5" />
          Enable Notifications
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState(0);

  // Profile
  const [displayName, setDisplayName] = useState(user.display_name || user.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Location
  const [city, setCity] = useState(user.cityPreset || '');
  const [neighborhood, setNeighborhood] = useState(user.neighborhood || '');

  // Shul
  const [shul, setShul] = useState(user.primary_shul || '');

  // Schools
  const [schools, setSchools] = useState(user.schools || []);

  // Interests
  const [selectedInterests, setSelectedInterests] = useState(user.interests || []);

  // Intent
  const [intent, setIntent] = useState(user.help_intent || '');

  // Communities
  const [suggestedCommunities, setSuggestedCommunities] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedCommunities, setSelectedCommunities] = useState(new Set());

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [finishing, setFinishing] = useState(false);

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(res.file_url);
    } catch {
      toast.error('Upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  const toggleInterest = (label) => {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const toggleCommunity = (id) => {
    setSelectedCommunities(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // Load community suggestions when we reach that step
  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      // Fetch communities filtered by city
      let communities = [];
      if (city && city !== 'Other') {
        const byCityNeighborhood = await base44.entities.Community.filter(
          { neighborhood: city }, '-follower_count', 20
        );
        communities = byCityNeighborhood;
      }
      if (communities.length < 5) {
        const featured = await base44.entities.Community.filter(
          { is_featured: true }, '-follower_count', 15
        );
        const ids = new Set(communities.map(c => c.id));
        communities = [...communities, ...featured.filter(c => !ids.has(c.id))];
      }
      // Interest-based boost
      const interestKeywords = selectedInterests.map(i => i.toLowerCase());
      const scored = communities.map(c => {
        let score = 0;
        const text = `${c.name} ${c.description_short || ''} ${c.category || ''}`.toLowerCase();
        interestKeywords.forEach(kw => { if (text.includes(kw)) score += 2; });
        score += (c.follower_count || 0) / 100;
        return { ...c, _score: score };
      });
      scored.sort((a, b) => b._score - a._score);
      setSuggestedCommunities(scored.slice(0, 8).map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.logo_url ? null : (c.name?.charAt(0) || '👥'),
        desc: c.description_short || c.description,
        follower_count: c.follower_count || 0,
      })));
    } catch {
      setSuggestedCommunities([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await base44.auth.updateMe({
        display_name: displayName.trim() || user.full_name,
        avatar_url: avatarUrl,
        cityPreset: city,
        city,
        neighborhood,
        primary_shul: shul,
        schools,
        interests: selectedInterests,
        help_intent: intent,
        notifications_enabled: notificationsEnabled,
        onboarding_complete: true,
      });

      // Auto-join selected communities
      if (selectedCommunities.size > 0) {
        const existing = await base44.entities.UserCommunity.filter({ user_id: user.id });
        const existingIds = new Set(existing.map(m => m.community_id));
        await Promise.allSettled(
          [...selectedCommunities]
            .filter(cid => !existingIds.has(cid))
            .map(cid => base44.entities.UserCommunity.create({
              user_id: user.id,
              community_id: cid,
              role: 'Member',
            }))
        );
      }

      localStorage.setItem(`onboarding_done_${user.id}`, '1');
    } catch {
      // Non-blocking
    }
    setFinishing(false);
    onComplete();
  };

  const canAdvance = () => {
    if (step === 1) return displayName.trim().length >= 2;
    if (step === 2) return !!city;
    return true;
  };

  const next = async () => {
    if (step === 6) {
      // Load suggestions before showing communities step
      await loadSuggestions();
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  const isLastStep = step === STEPS.length - 1;
  const isSkippable = [3, 4, 5, 6, 7].includes(step); // shul, schools, interests, intent, communities

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F0F6FF' }}>
      {/* Progress bar */}
      <div className="px-5 pt-10 pb-2">
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i <= step ? '#2563EB' : '#BFDBFE' }}
            />
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 text-right font-medium">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {step === 0 && <WelcomeStep userName={displayName || user.full_name} />}
            {step === 1 && (
              <ProfileStep
                displayName={displayName}
                setDisplayName={setDisplayName}
                avatarUrl={avatarUrl}
                onUploadAvatar={handleUploadAvatar}
                uploading={avatarUploading}
              />
            )}
            {step === 2 && (
              <LocationStep
                city={city}
                setCity={setCity}
                neighborhood={neighborhood}
                setNeighborhood={setNeighborhood}
              />
            )}
            {step === 3 && <ShulStep shul={shul} setShul={setShul} />}
            {step === 4 && <SchoolsStep schools={schools} setSchools={setSchools} />}
            {step === 5 && (
              <InterestsStep selected={selectedInterests} onToggle={toggleInterest} />
            )}
            {step === 6 && <IntentStep intent={intent} setIntent={setIntent} />}
            {step === 7 && (
              <CommunitiesStep
                suggestions={suggestedCommunities}
                selected={selectedCommunities}
                onToggle={toggleCommunity}
                loading={suggestionsLoading}
              />
            )}
            {step === 8 && (
              <NotificationsStep
                enabled={notificationsEnabled}
                setEnabled={setNotificationsEnabled}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-10 pt-4 bg-[#F0F6FF]">
        <button
          onClick={next}
          disabled={!canAdvance() || finishing}
          className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
        >
          {finishing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isLastStep ? (
            <>Let's Go! <Sparkles className="w-4 h-4" /></>
          ) : (
            <>Continue <ChevronRight className="w-5 h-5" /></>
          )}
        </button>

        <div className="flex justify-between mt-2">
          {step > 0 ? (
            <button onClick={back} className="py-2 px-1 text-[14px] font-semibold text-slate-400">
              ← Back
            </button>
          ) : <div />}
          {isSkippable && (
            <button onClick={next} className="py-2 px-1 text-[13px] text-slate-400 font-medium">
              Skip →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}