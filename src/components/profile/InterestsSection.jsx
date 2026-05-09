import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const KEYWORD_COLORS = {
  torah:        'bg-amber-100 text-amber-800 border-amber-200',
  shabbat:      'bg-amber-100 text-amber-800 border-amber-200',
  shabbos:      'bg-amber-100 text-amber-800 border-amber-200',
  davening:     'bg-amber-100 text-amber-800 border-amber-200',
  prayer:       'bg-amber-100 text-amber-800 border-amber-200',
  shiur:        'bg-amber-100 text-amber-800 border-amber-200',
  learning:     'bg-amber-100 text-amber-800 border-amber-200',
  daf:          'bg-amber-100 text-amber-800 border-amber-200',
  chesed:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  volunteer:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  helping:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  tzedakah:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  community:    'bg-violet-100 text-violet-800 border-violet-200',
  minyan:       'bg-violet-100 text-violet-800 border-violet-200',
  shul:         'bg-violet-100 text-violet-800 border-violet-200',
  synagogue:    'bg-violet-100 text-violet-800 border-violet-200',
  events:       'bg-rose-100 text-rose-800 border-rose-200',
  simcha:       'bg-rose-100 text-rose-800 border-rose-200',
  weddings:     'bg-rose-100 text-rose-800 border-rose-200',
  neighbors:    'bg-cyan-100 text-cyan-800 border-cyan-200',
  neighborhood: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  cooking:      'bg-orange-100 text-orange-800 border-orange-200',
  food:         'bg-orange-100 text-orange-800 border-orange-200',
  music:        'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  sports:       'bg-lime-100 text-lime-800 border-lime-200',
  fitness:      'bg-lime-100 text-lime-800 border-lime-200',
};

const FALLBACK_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-slate-100 text-slate-700 border-slate-200',
];

function pillColor(interest, index) {
  const key = interest.toLowerCase().replace(/[^a-z]/g, '');
  return KEYWORD_COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export default function InterestsSection({ interests, onAddInterest }) {
  const navigate = useNavigate();

  if (!interests || interests.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Interests</p>
      <div className="flex flex-wrap gap-2">
        {interests.map((interest, i) => (
          <button
            key={i}
            onClick={() => navigate(createPageUrl('Feed') + `?interest=${encodeURIComponent(interest)}`)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition active:scale-95 hover:opacity-80 ${pillColor(interest, i)}`}
          >
            {interest}
          </button>
        ))}
        <button
          onClick={onAddInterest}
          className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-[12px] font-bold text-slate-400 transition hover:border-slate-400 hover:text-slate-500 active:scale-95"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
    </div>
  );
}
