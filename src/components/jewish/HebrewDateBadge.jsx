import React, { useState, useEffect } from 'react';
import { gregorianToHebrew } from '@/lib/hebrewDate';

/**
 * Displays a date with its Hebrew equivalent inline.
 * Usage: <HebrewDateBadge date={new Date(post.created_date)} />
 */
export default function HebrewDateBadge({ date, className = '', showHebrew = true }) {
  const [hebrewStr, setHebrewStr] = useState(null);

  const d = date instanceof Date ? date : new Date(date);

  useEffect(() => {
    if (!showHebrew) return;
    gregorianToHebrew(d).then(h => {
      if (h) setHebrewStr(`${h.hd} ${h.hm}`);
    }).catch(() => {});
  }, [d?.toDateString(), showHebrew]);

  const civil = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{civil}</span>
      {hebrewStr && (
        <span className="text-[11px] text-slate-400 font-normal">· {hebrewStr}</span>
      )}
    </span>
  );
}