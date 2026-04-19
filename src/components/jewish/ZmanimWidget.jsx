import React, { useState, useEffect } from 'react';
import { Sun, Sunrise, Sunset, Clock } from 'lucide-react';
import { getZmanim, formatZmanTime, getTodayHebrew } from '@/lib/hebrewDate';

const ZMANIM_LABELS = [
  { key: 'alotHaShachar', label: 'Alot HaShachar', emoji: '🌑' },
  { key: 'sunrise', label: 'Sunrise (Netz)', emoji: '🌅' },
  { key: 'sofZmanShmaMGA', label: 'Sof Zman Shma (MGA)', emoji: '📜' },
  { key: 'sofZmanShma', label: 'Sof Zman Shma (GRA)', emoji: '📜' },
  { key: 'minchaGedola', label: 'Mincha Gedola', emoji: '⏳' },
  { key: 'plagHaMincha', label: 'Plag HaMincha', emoji: '⏱️' },
  { key: 'sunset', label: 'Shkia (Sunset)', emoji: '🌇' },
  { key: 'tzeis85deg', label: "Tzeis (8.5°)", emoji: '🌃' },
];

// Default to Five Towns, NY
const DEFAULT_LAT = 40.6282;
const DEFAULT_LNG = -73.7349;

export default function ZmanimWidget({ lat = DEFAULT_LAT, lng = DEFAULT_LNG, compact = false }) {
  const [zmanim, setZmanim] = useState(null);
  const [hebrewDate, setHebrewDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getZmanim(lat, lng),
      getTodayHebrew(),
    ]).then(([z, hd]) => {
      if (cancelled) return;
      setZmanim(z);
      setHebrewDate(hd);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    );
  }

  if (!zmanim) return null;

  // Show key times always; rest on expand
  const primaryKeys = ['sunrise', 'sofZmanShma', 'minchaGedola', 'sunset'];
  const primaryZmanim = ZMANIM_LABELS.filter(z => primaryKeys.includes(z.key));
  const allZmanim = ZMANIM_LABELS;
  const displayed = (expanded || !compact) ? allZmanim : primaryZmanim;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-300" />
            <span className="text-white font-bold text-[14px]">Zmanim</span>
          </div>
          {hebrewDate && (
            <p className="text-blue-100 text-[11px] mt-0.5">{hebrewDate.hebrewString}</p>
          )}
        </div>
        <div className="text-right text-[11px] text-blue-100">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Times grid */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-slate-100">
        {displayed.map(({ key, label, emoji }) => {
          const time = zmanim[key];
          if (!time) return null;
          return (
            <div key={key} className="px-3 py-2.5 flex items-center gap-2">
              <span className="text-base leading-none">{emoji}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 truncate">{label}</p>
                <p className="text-[13px] font-bold text-slate-900">{formatZmanTime(time)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {compact && (
        <button onClick={() => setExpanded(e => !e)}
          className="w-full text-center text-[12px] text-blue-600 font-semibold py-2 hover:bg-blue-50 transition-colors border-t border-slate-100">
          {expanded ? 'Show less ↑' : 'Show all zmanim ↓'}
        </button>
      )}
    </div>
  );
}