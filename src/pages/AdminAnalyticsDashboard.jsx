import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp, Users, MessageSquare, Calendar, Activity, AlertTriangle, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { subDays, format, startOfDay } from 'date-fns';

const COLORS = ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444', '#84CC16'];

function StatCard({ icon, label, value, sub, trend, color = 'blue' }) {
  const colorMap = { blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', teal: 'bg-teal-50 text-teal-600' };
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

export default function AdminAnalyticsDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('platform');
  const [data, setData] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === 'admin') loadData();
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadData = async () => {
    try {
      const [communities, posts, users, reports, events, userCommunities] = await Promise.all([
        base44.entities.Community.list('-follower_count', 200),
        base44.entities.UnifiedPost.list('-created_date', 500),
        base44.entities.User.list('-created_date', 500),
        base44.entities.Report.list('-created_date', 200),
        base44.entities.CommunityEvent.list('-created_date', 200),
        base44.entities.UserCommunity.list('-created_date', 500),
      ]);

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

      setData({ dau, wau, mau, signupsPerDay, postsPerDay, postTypeData, topCommunities, reportsPerDay, unresolvedReports, resolvedReports, funnel, engByType, communityHealth, totalUsers: users.length, totalPosts: posts.length, totalCommunities: communities.length, totalEvents: events.length });
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
    { key: 'platform', label: 'Platform' },
    { key: 'communities', label: 'Communities' },
    { key: 'feed', label: 'Feed Health' },
    { key: 'moderation', label: 'Moderation' },
    { key: 'funnel', label: 'Growth Funnel' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Last updated: {new Date().toLocaleString()}</p>
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
            <ChartCard title="Growth Funnel" onExport={() => exportCSV(data.funnel, 'funnel.csv')}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.funnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis dataKey="stage" type="category" width={120} tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 8, 8, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {data.funnel.map((step, i) => {
                  const pct = i === 0 ? 100 : Math.round((step.count / data.funnel[0].count) * 100);
                  return (
                    <div key={step.stage} className="flex items-center gap-3">
                      <span className="text-[12px] font-semibold text-slate-600 w-32 flex-shrink-0">{step.stage}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[12px] text-slate-500 w-16 text-right">{step.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
}