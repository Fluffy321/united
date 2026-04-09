import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp, Users, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const CHART_COLORS = ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];

export default function AdminAnalyticsDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState({
    postFrequency: [],
    memberGrowth: [],
    popularTopics: [],
    stats: { totalPosts: 0, totalMembers: 0, activeCommunities: 0, avgPostsPerCommunity: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Check if user is admin
        if (user?.role !== 'admin') {
          toast.error('Admin access required');
          return;
        }

        // Fetch all communities
        const allCommunities = await base44.entities.Community.list('-updated_date', 100);
        setCommunities(allCommunities);

        // Fetch all posts
        const allPosts = await base44.entities.UnifiedPost.list('-created_date', 200);
        setPosts(allPosts);

        // Process analytics data
        processAnalytics(allCommunities, allPosts);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processAnalytics = (communitiesData, postsData) => {
    // Post frequency over time (last 7 days)
    const postFreqData = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      postFreqData[dateStr] = 0;
    }

    postsData.forEach(post => {
      if (post.created_date) {
        const postDate = new Date(post.created_date);
        const dateStr = postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (postFreqData[dateStr] !== undefined) {
          postFreqData[dateStr]++;
        }
      }
    });

    const postFrequency = Object.entries(postFreqData).map(([date, count]) => ({ date, posts: count }));

    // Member growth trends
    const memberGrowth = communitiesData
      .sort((a, b) => (a.follower_count || 0) - (b.follower_count || 0))
      .slice(-10)
      .map(c => ({ name: c.name.substring(0, 12), members: c.follower_count || 0 }));

    // Popular discussion topics (posts by type)
    const topicCounts = {};
    postsData.forEach(post => {
      const type = post.type || 'other';
      topicCounts[type] = (topicCounts[type] || 0) + 1;
    });

    const popularTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ name: topic.charAt(0).toUpperCase() + topic.slice(1), value: count }));

    // Calculate stats
    const activeCommunities = communitiesData.filter(c => c.post_count > 0).length;
    const totalMembers = communitiesData.reduce((sum, c) => sum + (c.follower_count || 0), 0);
    const avgPostsPerCommunity = communitiesData.length > 0 ? Math.round(postsData.length / communitiesData.length) : 0;

    setAnalytics({
      postFrequency,
      memberGrowth,
      popularTopics,
      stats: {
        totalPosts: postsData.length,
        totalMembers,
        activeCommunities,
        avgPostsPerCommunity
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You need admin permissions to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Analytics Dashboard</h1>
          <p className="text-slate-600">Track engagement metrics and community growth</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<MessageSquare className="w-6 h-6" />}
            label="Total Posts"
            value={analytics.stats.totalPosts}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Members"
            value={analytics.stats.totalMembers.toLocaleString()}
            color="bg-purple-50 text-purple-600"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Active Communities"
            value={analytics.stats.activeCommunities}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            label="Avg Posts/Community"
            value={analytics.stats.avgPostsPerCommunity}
            color="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Post Frequency Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Post Frequency (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.postFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip 
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(37,99,235,0.1)' }}
                />
                <Bar dataKey="posts" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Member Growth Trends */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Top Communities by Members</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.memberGrowth} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" stroke="#64748B" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} stroke="#64748B" />
                <Tooltip 
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(37,99,235,0.1)' }}
                />
                <Bar dataKey="members" fill="#7C3AED" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Topics */}
        {analytics.popularTopics.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Popular Discussion Topics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.popularTopics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.popularTopics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              {/* Topics List */}
              <div className="space-y-3">
                {analytics.popularTopics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="font-medium text-slate-900">{topic.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-600">{topic.value} posts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}