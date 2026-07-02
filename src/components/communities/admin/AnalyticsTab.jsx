import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

function SimpleBarChart({ data, color = '#2563EB', label }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {label && <p className="text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-wide">{label}</p>}
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[10px] font-bold text-slate-500">{d.value || ''}</div>
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${Math.max(d.value > 0 ? 4 : 0, (d.value / max) * 80)}px`,
                background: color,
                opacity: 0.75 + 0.25 * (i / data.length),
              }}
            />
            <div className="text-[9px] text-slate-400 text-center leading-tight">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly bucket helper ─────────────────────────────────────────────────────

function buildWeeklyBuckets(rows, dateField, weekCount = 8) {
  const buckets = [];
  const now = new Date();
  for (let i = weekCount - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1 - i * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const value = rows.filter(r => {
      const d = new Date(r[dateField] || r.created_at);
      return d >= start && d < end;
    }).length;
    buckets.push({ label, value, start });
  }
  return buckets;
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

export default function AnalyticsTab({ communityId }) {
  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['admin-analytics-members', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_memberships')
        .select('joined_at, created_at, role')
        .eq('community_id', communityId).eq('status', 'active');
      return data ?? [];
    },
  });

  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['admin-analytics-posts', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('posts')
        .select('created_at')
        .eq('community_id', communityId)
        .gte('created_at', new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString());
      return data ?? [];
    },
  });

  const joinBuckets  = useMemo(() => buildWeeklyBuckets(allMembers, 'joined_at'), [allMembers]);
  const postBuckets  = useMemo(() => buildWeeklyBuckets(allPosts,   'created_at'), [allPosts]);
  const totalMembers = allMembers.length;
  const totalPosts   = allPosts.length;
  const adminsCount  = allMembers.filter(m => ['admin','owner','moderator'].includes(String(m.role).toLowerCase())).length;

  if (membersLoading || postsLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total members', value: totalMembers.toLocaleString() },
          { label: 'Posts (8 wks)',  value: totalPosts },
          { label: 'Admins & mods', value: adminsCount },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm text-center">
            <div className="text-2xl font-black text-slate-950">{s.value}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Member join chart */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
        <SimpleBarChart data={joinBuckets} color="#2563EB" label="New members by week" />
        <p className="text-[11px] text-slate-400 mt-3">Based on join timestamps — last 8 weeks</p>
      </div>

      {/* Posts chart */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
        <SimpleBarChart data={postBuckets} color="#7C3AED" label="Posts by week" />
        <p className="text-[11px] text-slate-400 mt-3">Community posts in the last 8 weeks</p>
      </div>

      {/* Future note */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5 mb-1">
          <AlertCircle className="h-3.5 w-3.5" /> Future analytics
        </p>
        <p className="text-[12px] text-slate-400 leading-relaxed">
          Retention rates, engagement trends, and daily active member metrics
          require a <code className="bg-slate-200 px-1 rounded">community_daily_metrics</code> table
          populated by scheduled jobs. Not yet implemented.
        </p>
      </div>
    </div>
  );
}
