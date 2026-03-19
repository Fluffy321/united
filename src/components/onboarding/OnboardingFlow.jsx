import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MapPin, Sparkles, Users, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const NEIGHBORHOODS = [
  'Lawrence', 'Cedarhurst', 'Woodmere', 'Hewlett', 'Inwood',
  'Far Rockaway', 'Brooklyn', 'Manhattan', 'Queens', 'New Jersey', 'Other'
];

const INTERESTS = [
  { label: 'Torah & Learning', emoji: '📚' },
  { label: 'Chesed & Volunteering', emoji: '🤝' },
  { label: 'Events & Social', emoji: '🎉' },
  { label: 'Sports & Fitness', emoji: '🏀' },
  { label: 'Food & Kosher', emoji: '🍽️' },
  { label: 'Shul & Davening', emoji: '🕍' },
  { label: 'Parenting & Family', emoji: '👨‍👩‍👧' },
  { label: 'Business & Career', emoji: '💼' },
  { label: 'Music & Art', emoji: '🎵' },
  { label: 'Travel', emoji: '✈️' },
];

const COMMUNITY_SUGGESTIONS = [
  { name: 'Five Towns Alerts', emoji: '📢', desc: 'Local news & alerts', category: 'Local Life' },
  { name: 'Mitzvah Map Volunteers', emoji: '❤️', desc: 'Help neighbors in need', category: 'Chessed' },
  { name: 'Daf Yomi Chat', emoji: '📖', desc: 'Daily Talmud study group', category: 'Learning' },
  { name: 'Pickup Basketball', emoji: '🏀', desc: 'Casual hoops in the area', category: 'Social' },
  { name: 'Young Adults Hangouts', emoji: '🎉', desc: 'Events for young adults', category: 'Social' },
  { name: 'Young Israel Woodmere Members', emoji: '🕍', desc: 'YI Woodmere community', category: 'Institutional' },
];

const STEPS = ['welcome', 'neighborhood', 'interests', 'communities'];

export default function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [finishing, setFinishing] = useState(false);

  const toggleInterest = (label) => {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const toggleGroup = (name) => {
    setSelectedGroups(prev => {
      const s = new Set(prev);
      s.has(name) ? s.delete(name) : s.add(name);
      return s;
    });
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      // Save neighborhood & interests
      await base44.auth.updateMe({
        cityPreset: neighborhood || user.cityPreset,
        interests: selectedInterests,
        onboarding_complete: true,
      });

      // Join selected groups
      if (selectedGroups.size > 0) {
        const allGroups = await base44.entities.CommunityGroup.list();
        const toJoin = allGroups.filter(g => selectedGroups.has(g.name));
        const existing = await base44.entities.GroupMember.filter({ user_id: user.id });
        const existingIds = new Set(existing.map(m => m.group_id));
        await Promise.allSettled(
          toJoin
            .filter(g => !existingIds.has(g.id))
            .map(g =>
              base44.entities.GroupMember.create({
                group_id: g.id,
                user_id: user.id,
                user_name: user.display_name || user.full_name,
                role: 'member',
              })
            )
        );
      }

      localStorage.setItem(`onboarding_done_${user.id}`, '1');
    } catch (e) {
      // Non-blocking — just finish
    }
    setFinishing(false);
    onComplete();
  };

  const canAdvance = () => {
    if (step === 1) return !!neighborhood;
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleFinish();
  };

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F0F6FF' }}>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-10 pb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === step ? 20 : 8,
              height: 8,
              background: i <= step ? '#2563EB' : '#BFDBFE',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.22 }}
          >
            {step === 0 && <WelcomeStep userName={user.display_name || user.full_name} />}
            {step === 1 && (
              <NeighborhoodStep
                neighborhoods={NEIGHBORHOODS}
                selected={neighborhood}
                onSelect={setNeighborhood}
              />
            )}
            {step === 2 && (
              <InterestsStep
                interests={INTERESTS}
                selected={selectedInterests}
                onToggle={toggleInterest}
              />
            )}
            {step === 3 && (
              <CommunitiesStep
                suggestions={COMMUNITY_SUGGESTIONS}
                selected={selectedGroups}
                onToggle={toggleGroup}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-10 pt-4">
        <button
          onClick={next}
          disabled={!canAdvance() || finishing}
          className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
        >
          {finishing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : step === STEPS.length - 1 ? (
            <>Let's Go! <Sparkles className="w-4 h-4" /></>
          ) : (
            <>Continue <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full mt-3 py-2 text-[14px] font-semibold text-slate-400"
          >
            Back
          </button>
        )}
        {(step === 2 || step === 3) && (
          <button
            onClick={next}
            className="w-full mt-1 py-2 text-[13px] text-slate-400 font-medium"
          >
            Skip this step
          </button>
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ userName }) {
  return (
    <div className="text-center pt-4 pb-8">
      <div className="text-6xl mb-6">🙌</div>
      <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-3">
        Welcome to United,<br />{userName}!
      </h1>
      <p className="text-[15px] text-slate-500 leading-relaxed max-w-xs mx-auto">
        Your Jewish community hub for local news, chesed, events, and connection. Let's get you set up in 3 quick steps.
      </p>
      <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
        {[
          { icon: '📍', text: 'Find your neighborhood' },
          { icon: '⭐', text: 'Choose your interests' },
          { icon: '🤝', text: 'Join communities that matter to you' },
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

function NeighborhoodStep({ neighborhoods, selected, onSelect }) {
  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-[#2563EB]" />
        <h2 className="text-[22px] font-bold text-slate-900">Where are you?</h2>
      </div>
      <p className="text-[14px] text-slate-400 mb-6">Pick your neighborhood so we can show you what's happening nearby.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {neighborhoods.map(n => (
          <button
            key={n}
            onClick={() => onSelect(n)}
            className="py-3.5 px-4 rounded-2xl text-[14px] font-semibold text-left transition-all active:scale-[0.97] border"
            style={
              selected === n
                ? { background: '#2563EB', color: 'white', borderColor: '#2563EB' }
                : { background: 'white', color: '#1E3A5F', borderColor: '#BFDBFE' }
            }
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function InterestsStep({ interests, selected, onToggle }) {
  return (
    <div className="pb-8">
      <h2 className="text-[22px] font-bold text-slate-900 mb-2">What are you into?</h2>
      <p className="text-[14px] text-slate-400 mb-6">Pick all that apply — we'll personalize your feed.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {interests.map(({ label, emoji }) => {
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
              <span className="text-[13px] font-semibold text-slate-800 leading-tight flex-1">{label}</span>
              {active && <Check className="w-4 h-4 text-[#2563EB] flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommunitiesStep({ suggestions, selected, onToggle }) {
  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-[#2563EB]" />
        <h2 className="text-[22px] font-bold text-slate-900">Join communities</h2>
      </div>
      <p className="text-[14px] text-slate-400 mb-6">Start with a few popular groups in the Five Towns.</p>
      <div className="space-y-2.5">
        {suggestions.map(({ name, emoji, desc }) => {
          const active = selected.has(name);
          return (
            <button
              key={name}
              onClick={() => onToggle(name)}
              className="w-full flex items-center gap-3.5 py-3.5 px-4 rounded-2xl text-left transition-all active:scale-[0.99] border"
              style={
                active
                  ? { background: '#EFF6FF', borderColor: '#2563EB' }
                  : { background: 'white', borderColor: '#BFDBFE' }
              }
            >
              <span className="text-2xl flex-shrink-0">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-900">{name}</p>
                <p className="text-[12px] text-slate-400">{desc}</p>
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
    </div>
  );
}