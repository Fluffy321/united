import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { getParsha, getTodayHebrew } from '@/lib/hebrewDate';

export default function ParshaWidget() {
  const [parsha, setParsha] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getParsha().then(p => { setParsha(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
  );

  if (!parsha) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">Parsha of the Week</span>
        </div>
        {parsha.link && (
          <a href={parsha.link} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-800">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      <p className="font-bold text-slate-900 text-[16px]">{parsha.name}</p>
      {parsha.hebrew && (
        <p className="text-[14px] text-slate-600 mt-0.5" dir="rtl" style={{ fontFamily: 'serif' }}>{parsha.hebrew}</p>
      )}
    </div>
  );
}