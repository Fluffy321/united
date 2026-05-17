import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { dataService } from '@/services';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, TrendingUp, Users, MessageSquare, Calendar, Activity, AlertTriangle, Download, ArrowUpRight, ArrowDownRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { subDays, format, startOfDay } from 'date-fns';

const COLORS = ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444', '#84CC16'];

// Server-authoritative MRR amounts per tier+interval (monthly equivalent)
const MRR_AMOUNTS = {
  supporter: { monthly: 18, annual: 15 },  // $180/yr ÷ 12
  builder:   { monthly: 36, annual: 30 },  // $360/yr ÷ 12
  champion:  { monthly: 72, annual: 60 },  // $720/yr ÷ 12
};

const SUB_TIER_LABELS = {
  supporter: 'Supporter',
  builder:   'Community Builder',
  champion:  'JUnited Champion',
};

const SUB_TIER_COLORS = {
  supporter: 'bg-blue-400',
  builder:   'bg-violet-400',
  champion:  'bg-rose-400',
};

const FUNNEL_META = {
  Signups: {
    label: 'Signups',
    description: 'Total user accounts',
    tone: 'blue',
  },
  'First post': {
    label: 'Posts created',
    description: 'Total posts, not unique posters',
    tone: 'purple',
  },
  'Community join': {
    label: 'Community joins',
    description: 'Total joins; one user can join many communities',
    tone: 'emerald',
  },
  WAU: {
    label: 'WAU',
    description: 'Users active in the last 7 days',
    tone: 'amber',
  },
  MAU: {
    label: 'MAU',
    description: 'Users active in the last 30 days',
    tone: 'teal',
  },
};

const FUNNEL_TONES = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getSignalPercent(count, baseline) {
  if (!baseline) return 0;
  return Math.round((Number(count || 0) / baseline) * 100);
}

function getSignalRows(funnel) {
  const baseline = Number(funnel?.[0]?.count || 0);
  return (funnel || []).map((step) => {
    const pct = step.stage === 'Signups' ? 100 : getSignalPercent(step.count, baseline);
    return {
      ...step,
      meta: FUNNEL_META[step.stage] || { label: step.stage, description: 'Activation signal', tone: 'blue' },
      pct,
      cappedPct: Math.min(Math.max(pct, 0), 100),
      exceedsBaseline: pct > 100,
    };
  });
}

function StatCard({ icon, label, value, sub, trend, color = 'blue' }) {
  const colorMap = { blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', teal: 'bg-teal-50 text-teal-600', rose: 'bg-rose-50 text-rose-600' };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>{icon}</div>
      <p className="text-[12px] text-slate-500 font-medium mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {trend !== undefined && (
          <span className={`text-[12px] font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, onExport }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-blue-600 transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function exportCSV(data, filename) {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function ActivationMetricCard({ row }) {
  const tone = FUNNEL_TONES[row.meta.tone] || FUNNEL_TONES.blue;

  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-slate-500">{row.meta.label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatNumber(row.count)}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-black ${tone}`}>
          {row.pct}%
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-4 text-slate-400">{row.meta.description}</p>
    </div>
  );
}

function ActivationSignalRow({ row }) {
  const tone = row.meta.tone === 'purple'
    ? 'bg-purple-600'
    : row.meta.tone === 'emerald'
      ? 'bg-emerald-600'
      : row.meta.tone === 'amber'
        ? 'bg-amber-500'
        : row.meta.tone === 'teal'
          ? 'bg-teal-600'
          : 'bg-blue-600';

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-black text-slate-900">{row.meta.label}</p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">{row.meta.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[13px] font-black text-slate-900">{formatNumber(row.count)}</p>
          <p className="text-[11px] font-bold text-slate-400">{row.pct}% of signups</p>
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-slate-100">
        <div
          className={`${tone} h-full rounded-full transition-[width] duration-300`}
          style={{ width: `${row.cappedPct}%` }}
        />
      </div>
      {row.exceedsBaseline && (
        <p className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
          Above signup baseline because this counts total activity, not unique users.
        </p>
      )}
    </div>
  );
}

// Build daily buckets for last N days
function buildDailyBuckets(items, dateField, days = 30) {
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MMM d');
    buckets[d] = 0;
  }
  items.forEach(item => {
    const d = format(startOfDay(new Date(item[dateField])), 'MMM d');
    if (buckets[d] !== undefined) buckets[d]++;
  });
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

// Build weekly buckets for last N weeks (week starts on Sunday)
function buildWeeklyBuckets(items, dateField, weeks = 8) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    buckets.push({ weekStart, weekEnd, date: format(weekStart, 'MMM d'), count: 0 });
  }
  (items || []).forEach(item => {
    if (!item[dateField]) return;
    const d = new Date(item[dateField]);
    const bucket = buckets.find(b => d >= b.weekStart && d < b.weekEnd);
    if (bucket) bucket.count++;
  });
  return buckets.map(({ date, count }) => ({ date, count }));
}

export default function AdminAnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('platform');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') loadData();
    else setLoading(false);
  }, [user?.role]);

  const loadData = async () => {
    try {
      const [communities, posts, users, reports, events, userCommunities, subsResult] = await Promise.all([
        dataService.entities.Community.list('-follower_count', 200),
        dataService.entities.UnifiedPost.list('-created_date', 500),
        dataService.entities.User.list('-created_date', 500),
        dataService.entities.Report.list('-created_date', 200),
        dataService.entities.CommunityEvent.list('-created_date', 200),
        dataService.entities.UserCommunity.list('-created_date', 500),
        supabase
          .from('subscriptions')
          .select('id, tier, interval, status, created_at')
          .order('created_at', { ascending: false }),
      ]);

      // subscriptions — gracefully handle if table doesn't exist yet
      const subscriptions = subsResult?.data ?? [];

      const now = Date.now();
      const DAY = 86400000;
      const dau = users.filter(u => u.updated_date && (now - new Date(u.updated_date).getTime()) < DAY).length;
      const wau = users.filter(u => u.updated_date && (now - new Date(u.updated_date).getTime()) < 7 * DAY).length;
      const mau = users.filter(u => u.updated_date && (now - new Date(u.updated_date).getTime()) < 30 * DAY).length;

      // Signups per day (30 days)
      const signupsPerDay = buildDailyBuckets(users, 'created_date', 30);
      // Posts per day
      const postsPerDay = buildDailyBuckets(posts, 'created_date', 30);

      // Post type distribution
      const typeDist = {};
      posts.forEach(p => { const t = p.type || 'feed'; typeDist[t] = (typeDist[t] || 0) + 1; });
      const postTypeData = Object.entries(typeDist).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      // Top 10 communities by activity
      const topCommunities = [...communities]
        .sort((a, b) => ((b.posts_this_week || 0) + (b.follower_count || 0) * 0.1) - ((a.posts_this_week || 0) + (a.follower_count || 0) * 0.1))
        .slice(0, 10)
        .map(c => ({ name: c.name.slice(0, 18), members: c.follower_count || 0, posts: c.posts_this_week || 0 }));

      // Reports per day
      const reportsPerDay = buildDailyBuckets(reports, 'created_date', 14);
      const unresolvedReports = reports.filter(r => !r.resolved).length;
      const resolvedReports = reports.filter(r => r.resolved).length;

      // Growth funnel (approximate from available data)
      const funnel = [
        { stage: 'Signups', count: users.length },
        { stage: 'First post', count: posts.length },
        { stage: 'Community join', count: userCommunities.length },
        { stage: 'WAU', count: wau },
        { stage: 'MAU', count: mau },
      ];

      // Engagement rate per post type
      const engByType = Object.entries(
        posts.reduce((acc, p) => {
          const t = p.type || 'feed';
          if (!acc[t]) acc[t] = { likes: 0, comments: 0, count: 0 };
          acc[t].likes += p.likes_count || 0;
          acc[t].comments += p.comments_count || 0;
          acc[t].count++;
          return acc;
        }, {})
      ).map(([type, v]) => ({ type, avgEngagement: v.count ? ((v.likes + v.comments) / v.count).toFixed(1) : 0 }));

      // Community health table
      const communityHealth = communities.slice(0, 20).map(c => {
        const communityPosts = posts.filter(p => p.community_id === c.id);
        const recentPosts = communityPosts.filter(p => (now - new Date(p.created_date).getTime()) < 7 * DAY).length;
        return { id: c.id, name: c.name, members: c.follower_count || 0, postsThisWeek: recentPosts, type: c.type };
      }).sort((a, b) => b.postsThisWeek - a.postsThisWeek);

      // ── Subscription metrics ──────────────────────────────────────────────
      const activeSubs      = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
      const monthlyActiveSubs = activeSubs.filter(s => s.interval === 'monthly');
      const annualActiveSubs  = activeSubs.filter(s => s.interval === 'annual');
      const pastDueSubs     = subscriptions.filter(s => s.status === 'past_due');

      const totalActiveSubs = activeSubs.length;
      const pastDueCount    = pastDueSubs.length;
      const monthlyCount    = monthlyActiveSubs.length;
      const annualCount     = annualActiveSubs.length;
      const annualPct       = totalActiveSubs > 0 ? Math.round((annualCount / totalActiveSubs) * 100) : 0;

      const monthlyMrr = monthlyActiveSubs.reduce((sum, s) => sum + (MRR_AMOUNTS[s.tier]?.monthly ?? 0), 0);
      const annualMrr  = annualActiveSubs.reduce((sum, s) => sum + (MRR_AMOUNTS[s.tier]?.annual ?? 0), 0);
      const mrr        = monthlyMrr + annualMrr;
      const arr        = mrr * 12;

      const tierBreakdown = ['supporter', 'builder', 'champion'].map(tier => {
        const tierSubs = activeSubs.filter(s => s.tier === tier);
        const amounts  = MRR_AMOUNTS[tier];
        const tierMrr  = tierSubs.reduce((sum, s) => sum + (s.interval === 'annual' ? (amounts?.annual ?? 0) : (amounts?.monthly ?? 0)), 0);
        return {
          tier,
          label: SUB_TIER_LABELS[tier] ?? tier,
          count: tierSubs.length,
          mrr:   tierMrr,
        };
      });

      const subsPerWeek = buildWeeklyBuckets(subscriptions, 'created_at', 8);

      setData({
        dau, wau, mau,
        signupsPerDay, postsPerDay, postTypeData, topCommunities,
        reportsPerDay, unresolvedReports, resolvedReports,
        funnel, engByType, communityHealth,
        totalUsers: users.length, totalPosts: posts.length,
        totalCommunities: communities.length, totalEvents: events.length,
        // subscription metrics
        subscriptions, totalActiveSubs, pastDueCount,
        monthlyCount, annualCount, annualPct,
        mrr, arr, monthlyMrr, annualMrr,
        tierBreakdown, subsPerWeek,
      });
    } catch (e) {
      toast.error('Failed to load analytics');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!user || user.role !== 'admin') return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-600">Admin access required.</p></div>;
  if (!data) return null;

  const TABS = [
    { key: 'platform',    label: 'Platform' },
    { key: 'communities', label: 'Communities' },
    { key: 'feed',        label: 'Feed Health' },
    { key: 'moderation',  label: 'Moderation' },
    { key: 'funnel',      label: 'Growth Funnel' },
    { key: 'supporters',  label: 'Supporters' },
  ];
  const activationRows = getSignalRows(data.funnel);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
              <p className="text-[13px] text-slate-500 mt-0.5">Last updated: {new Date().toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => exportCSV(data.signupsPerDay, 'signups.csv')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Export All
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-slate-100 rounded-xl p-1 w-fit overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PLATFORM TAB */}
        {tab === 'platform' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={<Activity className="w-5 h-5" />} label="DAU" value={data.dau} color="blue" />
              <StatCard icon={<Activity className="w-5 h-5" />} label="WAU" value={data.wau} color="purple" />
              <StatCard icon={<Activity className="w-5 h-5" />} label="MAU" value={data.mau} color="teal" />
              <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={data.totalUsers.toLocaleString()} color="green" />
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Total Posts" value={data.totalPosts.toLocaleString()} color="amber" />
              <StatCard icon={<Calendar className="w-5 h-5" />} label="Events" value={data.totalEvents} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Signups Per Day (30 days)" onExport={() => exportCSV(data.signupsPerDay, 'signups.csv')}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.signupsPerDay}>
                    <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#sg)" strokeWidth={2} name="Signups" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Posts Per Day (30 days)" onExport={() => exportCSV(data.postsPerDay, 'posts-per-day.csv')}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.postsPerDay}>
                    <defs><linearGradient id="pp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15}/><stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="#7C3AED" fill="url(#pp)" strokeWidth={2} name="Posts" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* COMMUNITIES TAB */}
        {tab === 'communities' && (
          <div className="space-y-6">
            <ChartCard title="Top 10 Communities by Activity" onExport={() => exportCSV(data.topCommunities, 'top-communities.csv')}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.topCommunities} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="members" fill="#2563EB" radius={[0, 6, 6, 0]} name="Members" />
                  <Bar dataKey="posts" fill="#7C3AED" radius={[0, 6, 6, 0]} name="Posts this week" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Community Health" onExport={() => exportCSV(data.communityHealth, 'community-health.csv')}>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-slate-500 font-semibold">Community</th>
                      <th className="text-left py-2 text-slate-500 font-semibold">Type</th>
                      <th className="text-right py-2 text-slate-500 font-semibold">Members</th>
                      <th className="text-right py-2 text-slate-500 font-semibold">Posts/week</th>
                      <th className="text-right py-2 text-slate-500 font-semibold">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.communityHealth.map(c => {
                      const health = c.postsThisWeek >= 5 ? '🟢 Active' : c.postsThisWeek >= 1 ? '🟡 Low' : '🔴 Quiet';
                      return (
                        <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2.5 font-medium text-slate-900">{c.name}</td>
                          <td className="py-2.5 text-slate-500">{c.type}</td>
                          <td className="py-2.5 text-right text-slate-700">{c.members.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-slate-700">{c.postsThisWeek}</td>
                          <td className="py-2.5 text-right">{health}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* FEED HEALTH TAB */}
        {tab === 'feed' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Post Type Distribution" onExport={() => exportCSV(data.postTypeData, 'post-types.csv')}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.postTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={e => `${e.name}: ${e.value}`} labelLine={false}>
                      {data.postTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Avg Engagement by Post Type" onExport={() => exportCSV(data.engByType, 'engagement.csv')}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.engByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="avgEngagement" fill="#10B981" radius={[6, 6, 0, 0]} name="Avg likes+comments" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* MODERATION TAB */}
        {tab === 'moderation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Unresolved Reports" value={data.unresolvedReports} color="red" />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Resolved Reports" value={data.resolvedReports} color="green" />
              <StatCard icon={<Activity className="w-5 h-5" />} label="Total Reports" value={data.unresolvedReports + data.resolvedReports} color="amber" />
            </div>

            <ChartCard title="Reports Per Day (14 days)" onExport={() => exportCSV(data.reportsPerDay, 'reports.csv')}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.reportsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#EF4444" radius={[6, 6, 0, 0]} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* FUNNEL TAB */}
        {tab === 'funnel' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-wide text-blue-600">Growth Funnel</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Activation signals, not a strict step-by-step funnel</h2>
                  <p className="mt-2 max-w-3xl text-[13px] font-medium leading-5 text-slate-600">
                    These metrics compare important platform activity against total signups. Some signals can be higher than signups because they count total activity, such as multiple community joins by the same user.
                  </p>
                </div>
                <button
                  onClick={() => exportCSV(data.funnel, 'funnel.csv')}
                  className="inline-flex items-center gap-1.5 self-start rounded-full border border-blue-100 bg-white px-3 py-2 text-[12px] font-bold text-slate-600 shadow-sm hover:text-blue-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {activationRows.map((row) => (
                <ActivationMetricCard key={row.stage} row={row} />
              ))}
            </div>

            <ChartCard title="Activation Signal Counts" onExport={() => exportCSV(data.funnel, 'funnel.csv')}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.funnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis dataKey="stage" type="category" width={120} tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 8, 8, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-[14px] font-black text-slate-950">Signup baseline comparison</h3>
                    <p className="text-[12px] font-medium text-slate-500">
                      Bar fills are capped at 100% so high activity never breaks the layout. The actual percentage is still shown.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {activationRows.map((row) => (
                    <ActivationSignalRow key={row.stage} row={row} />
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        )}

        {/* SUPPORTERS TAB */}
        {tab === 'supporters' && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Heart className="w-5 h-5" />}
                label="Active Subscribers"
                value={data.totalActiveSubs}
                sub={data.totalActiveSubs === 0 ? 'No active subscriptions' : `${data.totalActiveSubs} supporter${data.totalActiveSubs !== 1 ? 's' : ''}`}
                color="rose"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="MRR"
                value={`$${data.mrr.toLocaleString()}`}
                sub={`$${data.arr.toLocaleString()} ARR`}
                color="blue"
              />
              <StatCard
                icon={<Calendar className="w-5 h-5" />}
                label="Annual Plan"
                value={data.annualCount}
                sub={data.totalActiveSubs > 0 ? `${data.annualPct}% of active subscribers` : '—'}
                color="teal"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Past Due"
                value={data.pastDueCount}
                sub={data.pastDueCount > 0 ? 'Need payment update' : 'All payments current'}
                color={data.pastDueCount > 0 ? 'amber' : 'green'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tier breakdown */}
              <ChartCard title="Breakdown by Tier" onExport={() => exportCSV(data.tierBreakdown, 'tier-breakdown.csv')}>
                {data.totalActiveSubs === 0 ? (
                  <p className="py-8 text-center text-[13px] text-slate-400">No active subscribers yet</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.tierBreakdown.map(row => (
                      <div key={row.tier} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-2.5 w-2.5 rounded-full ${SUB_TIER_COLORS[row.tier] ?? 'bg-slate-400'}`} />
                          <span className="text-[13.5px] font-semibold text-slate-700">{row.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[13.5px] font-bold text-slate-900">
                            {row.count} {row.count === 1 ? 'subscriber' : 'subscribers'}
                          </p>
                          <p className="text-[11.5px] text-slate-400">${row.mrr}/mo MRR</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>

              {/* Monthly vs Annual split */}
              <ChartCard title="Monthly vs Annual">
                <div className="space-y-5">
                  {[
                    { label: 'Monthly', count: data.monthlyCount, mrrContrib: data.monthlyMrr, color: 'bg-blue-500' },
                    { label: 'Annual',  count: data.annualCount,  mrrContrib: data.annualMrr,  color: 'bg-emerald-500' },
                  ].map(({ label, count, mrrContrib, color }) => {
                    const pct = data.totalActiveSubs > 0
                      ? Math.round((count / data.totalActiveSubs) * 100)
                      : 0;
                    return (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-semibold text-slate-700">{label}</span>
                            <span className="text-[11.5px] text-slate-400">${mrrContrib}/mo</span>
                          </div>
                          <span className="text-[13px] font-bold text-slate-800">
                            {count} <span className="font-normal text-slate-400">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`${color} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {data.totalActiveSubs === 0 && (
                    <p className="pt-4 text-center text-[13px] text-slate-400">No active subscribers yet</p>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* New subscriptions per week */}
            <ChartCard
              title="New Subscriptions Per Week (last 8 weeks)"
              onExport={() => exportCSV(data.subsPerWeek, 'subs-per-week.csv')}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.subsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#F43F5E" radius={[6, 6, 0, 0]} name="New subscribers" />
                </BarChart>
              </ResponsiveContainer>
              {data.subscriptions.length === 0 && (
                <p className="mt-3 text-center text-[12px] text-slate-400">
                  No subscription data — apply the migration and configure Stripe to see data here.
                </p>
              )}
            </ChartCard>
          </div>
        )}

      </div>
    </div>
  );
}
