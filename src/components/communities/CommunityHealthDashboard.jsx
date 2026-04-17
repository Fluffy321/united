import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Loader2, Brain, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle, Lightbulb, Hash, Shield, RefreshCw, Users, FileText, Calendar, Heart
} from 'lucide-react';

const COLOR_MAP = {
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  ring: 'bg-green-500'  },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   ring: 'bg-blue-500'   },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', ring: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', ring: 'bg-orange-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    ring: 'bg-red-500'    },
};

function HealthScoreRing({ score, color }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color === 'green' ? '#22C55E' : color === 'blue' ? '#3B82F6' : color === 'yellow' ? '#EAB308' : color === 'orange' ? '#F97316' : '#EF4444'}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-black text-slate-900">{score}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">/ 100</p>
      </div>
    </div>
  );
}

function EngagementBar({ label, score, note, icon: Icon }) {
  const pct = Math.max(0, Math.min(100, score || 0));
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-orange-400';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-semibold text-slate-700">{label}</span>
        </div>
        <span className="text-[12px] font-bold text-slate-600">{pct}/100</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

function MetricCard({ label, value, sub, trend }) {
  const trendIcon = trend > 0
    ? <TrendingUp className="w-3 h-3 text-green-500" />
    : trend < 0
    ? <TrendingDown className="w-3 h-3 text-red-400" />
    : <Minus className="w-3 h-3 text-slate-400" />;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-1 mt-1">
          {trend !== undefined && trendIcon}
          {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
        </div>
      )}
    </div>
  );
}

export default function CommunityHealthDashboard({ communityId, community }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-health', communityId, refreshKey],
    queryFn: async () => {
      const res = await base44.functions.invoke('getCommunityHealthInsights', { community_id: communityId });
      return res.data;
    },
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Brain className="w-7 h-7 text-white animate-pulse" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-slate-800">AI is analyzing your community…</p>
          <p className="text-[12px] text-slate-500 mt-1">Reviewing posts, members, and engagement patterns</p>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
        <p className="text-[14px] font-semibold text-slate-700 mb-4">Couldn't load health insights</p>
        <button onClick={() => refetch()} className="bg-blue-600 text-white rounded-full px-5 py-2 text-[13px] font-bold active:scale-95 transition-all">
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, insights, generated_at } = data;
  const colors = COLOR_MAP[insights.health_color] || COLOR_MAP.blue;
  const postTrend = metrics.post_trend_pct;

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-600" />
          <h2 className="text-[16px] font-bold text-slate-900">Community Health</h2>
          <span className="text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">PREMIUM</span>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-full px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Health Score Card */}
      <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-5`}>
        <div className="flex items-center gap-5">
          <HealthScoreRing score={insights.health_score} color={insights.health_color} />
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold mb-2 ${colors.bg} ${colors.text} border ${colors.border}`}>
              <div className={`w-2 h-2 rounded-full ${colors.ring}`} />
              {insights.health_label}
            </div>
            <p className="text-[13px] text-slate-700 leading-relaxed">{insights.summary}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Total Members"
          value={metrics.total_members.toLocaleString()}
          sub={`+${metrics.new_members_this_week} this week`}
          trend={metrics.new_members_this_week}
        />
        <MetricCard
          label="Posts This Week"
          value={metrics.posts_this_week}
          sub={`${postTrend > 0 ? '+' : ''}${postTrend}% vs last week`}
          trend={postTrend}
        />
        <MetricCard
          label="Active Authors (30d)"
          value={metrics.unique_active_authors_month}
          sub={`${metrics.active_member_ratio_pct}% of members`}
          trend={metrics.active_member_ratio_pct > 20 ? 1 : metrics.active_member_ratio_pct > 10 ? 0 : -1}
        />
        <MetricCard
          label="Upcoming Events"
          value={metrics.upcoming_events_count}
          sub={`${metrics.active_mitzvah_opportunities} mitzvah opps`}
        />
      </div>

      {/* Engagement Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <p className="text-[14px] font-bold text-slate-800">Engagement Breakdown</p>
        <EngagementBar
          label="Posting Activity"
          score={insights.engagement_breakdown?.posting?.score}
          note={insights.engagement_breakdown?.posting?.note}
          icon={FileText}
        />
        <EngagementBar
          label="Events"
          score={insights.engagement_breakdown?.events?.score}
          note={insights.engagement_breakdown?.events?.note}
          icon={Calendar}
        />
        <EngagementBar
          label="Mitzvah & Chessed"
          score={insights.engagement_breakdown?.mitzvah?.score}
          note={insights.engagement_breakdown?.mitzvah?.note}
          icon={Heart}
        />
      </div>

      {/* Trending Topics */}
      {insights.trending_topics?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-blue-500" />
            <p className="text-[14px] font-bold text-slate-800">Trending Topics</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.trending_topics.map((topic, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 text-[12px] font-semibold">
                # {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 gap-3">
        {insights.strengths?.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-[13px] font-bold text-green-800">Strengths</p>
            </div>
            <ul className="space-y-1.5">
              {insights.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-green-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insights.concerns?.length > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <p className="text-[13px] font-bold text-orange-800">Areas to Watch</p>
            </div>
            <ul className="space-y-1.5">
              {insights.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-orange-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {insights.recommendations?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <p className="text-[14px] font-bold text-slate-800">AI Recommendations</p>
          </div>
          <ol className="space-y-3">
            {insights.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[12px] text-slate-700 leading-relaxed">{rec}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Moderation Flags */}
      {insights.moderation_flags?.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-500" />
            <p className="text-[13px] font-bold text-red-800">Moderation Focus</p>
          </div>
          <ul className="space-y-1.5">
            {insights.moderation_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-red-700">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-[10px] text-slate-400">
        Analysis generated {generated_at ? new Date(generated_at).toLocaleString() : 'just now'} · Powered by AI
      </p>
    </div>
  );
}