import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Users, TrendingUp, Activity, Gavel, ShieldCheck, Clock,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { filterCommunityAdminAuditLog } from '@/services/entityServices';
import { EmptyState, SectionHeader, fmtRelative, isPublicCommunity } from './shared';

const ACTION_LABELS = {
  member_removed:  'Removed member',
  appeal_submitted:'Member submitted appeal',
  appeal_approved: 'Appeal approved — member reinstated',
  appeal_denied:   'Appeal denied',
  role_promoted:   'Promoted member',
  role_demoted:    'Demoted member',
  settings_changed:'Updated community settings',
  community_updated:'Updated community profile',
};

function StatCard({ label, value, sub, Icon, accent = 'blue', onClick }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    slate:  'bg-slate-100 text-slate-600',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm text-left w-full disabled:cursor-default active:scale-[0.98] transition-transform"
    >
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 ${colors[accent]}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="text-2xl font-black text-slate-950">{value ?? '—'}</div>
      <div className="text-[12px] font-semibold text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
    </button>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

export default function OverviewTab({ communityId, community, onNavigateTo }) {
  const oneWeekAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), []);

  const { data: memberCount = community?.follower_count ?? 0 } = useQuery({
    queryKey: ['admin-ov-members', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).eq('status', 'active');
      return count ?? 0;
    },
  });

  const { data: newMembersCount = 0 } = useQuery({
    queryKey: ['admin-ov-new-members', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).eq('status', 'active')
        .gte('joined_at', oneWeekAgo);
      return count ?? 0;
    },
  });

  const { data: postsThisWeek = 0 } = useQuery({
    queryKey: ['admin-ov-posts', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).gte('created_at', oneWeekAgo);
      return count ?? 0;
    },
  });

  const { data: pendingAppeals = 0 } = useQuery({
    queryKey: ['admin-ov-appeals', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('community_member_appeals')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).eq('status', 'pending');
      return count ?? 0;
    },
  });

  const { data: adminCount = 0 } = useQuery({
    queryKey: ['admin-ov-admins', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).eq('status', 'active')
        .in('role', ['admin', 'owner', 'moderator', 'Admin', 'Owner', 'Moderator']);
      return count ?? 0;
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['admin-ov-activity', communityId],
    queryFn: async () => {
      return filterCommunityAdminAuditLog({ community_id: communityId }, '-created_at', 8);
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
      {/* Privacy badge */}
      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
        isPublicCommunity(community)
          ? 'bg-green-50 text-green-700'
          : 'bg-slate-100 text-slate-600'
      }`}>
        <Shield className="h-3 w-3" />
        {community?.privacy || 'Public'} community
        {isPublicCommunity(community) && (
          <span className="ml-1 text-green-600">· removal reasons required</span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total members" value={memberCount.toLocaleString()} Icon={Users} accent="blue"
          onClick={() => onNavigateTo('members')} />
        <StatCard label="Joined this week" value={newMembersCount} Icon={TrendingUp} accent="green" />
        <StatCard label="Posts this week" value={postsThisWeek} Icon={Activity} accent="purple" />
        <StatCard
          label="Pending appeals"
          value={pendingAppeals}
          Icon={Gavel}
          accent={pendingAppeals > 0 ? 'amber' : 'slate'}
          sub={pendingAppeals > 0 ? 'Needs review' : undefined}
          onClick={pendingAppeals > 0 ? () => onNavigateTo('appeals') : undefined}
        />
        <StatCard label="Admins & mods" value={adminCount} Icon={ShieldCheck} accent="blue"
          onClick={() => onNavigateTo('members')} />
      </div>

      {/* Recent activity */}
      <div>
        <SectionHeader title="Recent admin activity" />
        {activity.length === 0 ? (
          <EmptyState icon={Clock} title="No activity yet" body="Admin actions will appear here." />
        ) : (
          <div className="space-y-2">
            {activity.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-white border border-slate-100 px-4 py-3 flex items-start gap-3 shadow-sm">
                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">
                    {ACTION_LABELS[entry.action_type] || entry.action_type}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmtRelative(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
