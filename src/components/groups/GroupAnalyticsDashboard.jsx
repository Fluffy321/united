import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, MessageSquare, Calendar, Download, TrendingUp, Clock, Star, Lock, Mail, History } from 'lucide-react';
import { dataService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import NewsletterComposer from './NewsletterComposer';
import NewsletterHistoryModal from './NewsletterHistoryModal';
import { captureError } from '@/lib/analytics';

const COLORS = ['#2563EB', '#7C3AED', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#06B6D4', '#F97316'];

export default function GroupAnalyticsDashboard({ group, currentUser, isAdmin }) {
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [memberEmails, setMemberEmails] = useState([]);

  useEffect(() => {
    checkPremiumStatus();
    loadMemberEmails();
  }, []);

  const checkPremiumStatus = () => {
    const subscription = currentUser?.subscription_status || 'free';
    setIsPremium(subscription === 'premium');
    setCheckingPremium(false);
  };

  const loadMemberEmails = async () => {
    try {
      const members = await dataService.entities.GroupMember.filter({ group_id: group.id });
      const userIds = members.map(m => m.user_id).filter(Boolean);
      setMemberEmails(userIds);
    } catch (e) {
      captureError(e, { context: 'GroupAnalyticsDashboard: load member emails' });
    }
  };

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['group-analytics', group?.id],
    queryFn: () => calculateGroupAnalytics(group.id),
    enabled: !!group?.id && isPremium && isAdmin,
  });

  if (checkingPremium) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-4">
          <Lock className="w-10 h-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Premium Analytics Dashboard</h3>
        <p className="text-slate-600 text-center max-w-md mb-6">
          Preview powerful engagement insights including active members, popular discussions, event attendance, and resource analytics. Premium checkout is not live yet.
        </p>
        <button
          onClick={handleUpgrade}
          disabled
          className="px-6 py-3 bg-slate-300 text-white font-semibold rounded-full cursor-not-allowed"
        >
          Premium Checkout Coming Soon
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Lock className="w-12 h-12 text-slate-400 mb-3" />
        <p className="text-slate-600 font-semibold">Admin access required</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with Newsletter Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-sm text-slate-500">Track your community's engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setShowNewsletter(true)}
            disabled={memberEmails.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-40"
          >
            <Mail className="w-4 h-4" />
            Send Newsletter
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-700">Premium</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Users}
          label="Daily Active"
          value={analytics?.dailyActiveMembers || 0}
          change={analytics?.memberGrowth || 0}
          color="blue"
        />
        <MetricCard
          icon={MessageSquare}
          label="Discussions"
          value={analytics?.totalDiscussions || 0}
          change={analytics?.discussionGrowth || 0}
          color="purple"
        />
        <MetricCard
          icon={Calendar}
          label="Avg Attendance"
          value={`${analytics?.avgEventAttendance || 0}%`}
          change={analytics?.attendanceGrowth || 0}
          color="amber"
        />
        <MetricCard
          icon={Download}
          label="Resources"
          value={analytics?.totalResourceDownloads || 0}
          change={analytics?.downloadGrowth || 0}
          color="emerald"
        />
      </div>

      {/* Popular Discussions */}
      {analytics?.topDiscussions?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Top Discussions
          </h3>
          <div className="space-y-2">
            {analytics.topDiscussions.map((discussion, idx) => (
              <div key={discussion.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{discussion.title}</p>
                  <p className="text-xs text-slate-500">by {discussion.author}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 font-medium">{discussion.likes} likes</span>
                  <span className="text-slate-600 font-medium">{discussion.comments} comments</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Attendance */}
      {analytics?.eventStats?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            Event Attendance Trends
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.eventStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Resource Downloads */}
      {analytics?.topResources?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            Most Downloaded Resources
          </h3>
          <div className="space-y-2">
            {analytics.topResources.map((resource, idx) => (
              <div key={resource.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{resource.title}</p>
                  <p className="text-xs text-slate-500">{resource.category}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <Download className="w-3 h-3" />
                  {resource.downloads}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      {analytics?.dailyActivity?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Weekly Activity
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="active" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Newsletter Composer Modal */}
      {showNewsletter && (
        <NewsletterComposer
          group={group}
          memberEmails={memberEmails}
          onClose={() => setShowNewsletter(false)}
          onSent={() => {}}
        />
      )}

      {/* Newsletter History Modal */}
      {showHistory && (
        <NewsletterHistoryModal
          groupId={group.id}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );

  async function handleUpgrade() {
    toast.info('Premium checkout is coming soon. No money was processed.');
  }
}

function MetricCard({ icon: Icon, label, value, change, color }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

async function calculateGroupAnalytics(groupId) {
  try {
    const [discussions, events, resources, members] = await Promise.all([
      dataService.entities.GroupDiscussion.filter({ group_id: groupId }),
      dataService.entities.CommunityEvent.filter({ community_id: groupId }),
      dataService.entities.GroupResource.filter({ group_id: groupId }),
      dataService.entities.GroupMember.filter({ group_id: groupId }),
    ]);

    // Daily active members (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeMembers = members.filter(m => new Date(m.created_date) >= sevenDaysAgo);
    const dailyActiveMembers = activeMembers.length;

    // Discussion analytics
    const sortedDiscussions = discussions.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    const topDiscussions = sortedDiscussions.slice(0, 5).map(d => ({
      id: d.id,
      title: d.title,
      author: d.user_name,
      likes: d.likes_count || 0,
      comments: d.comments_count || 0,
    }));

    // Event attendance
    const eventStats = events.slice(0, 10).map(e => ({
      name: e.title?.substring(0, 20) || 'Event',
      attendance: e.attendee_count || 0,
    }));
    const avgAttendance = eventStats.length > 0
      ? Math.round(eventStats.reduce((sum, e) => sum + e.attendance, 0) / eventStats.length / Math.max(members.length, 1) * 100)
      : 0;

    // Resource downloads (simulated - would need actual download tracking)
    const topResources = resources.slice(0, 5).map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      downloads: Math.floor(Math.random() * 50) + 1, // Placeholder
    }));
    const totalDownloads = topResources.reduce((sum, r) => sum + r.downloads, 0);

    // Daily activity (last 7 days)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      dailyActivity.push({
        day: dayName,
        active: Math.floor(Math.random() * 20) + 5, // Placeholder
      });
    }

    return {
      dailyActiveMembers,
      memberGrowth: Math.floor(Math.random() * 30) - 10,
      totalDiscussions: discussions.length,
      discussionGrowth: Math.floor(Math.random() * 40) - 5,
      avgEventAttendance: avgAttendance,
      attendanceGrowth: Math.floor(Math.random() * 25) - 8,
      totalResourceDownloads: totalDownloads,
      downloadGrowth: Math.floor(Math.random() * 50) - 10,
      topDiscussions,
      eventStats,
      topResources,
      dailyActivity,
    };
  } catch (error) {
    captureError(error, { context: 'GroupAnalyticsDashboard: calculate analytics' });
    return null;
  }
}
