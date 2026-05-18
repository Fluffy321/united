import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Plus, Users } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { dataService, incrementCounter } from '@/services';
import { toast } from 'sonner';
import CreateGroupModal from '@/components/groups/CreateGroupModal';

const CATEGORY_EMOJI = {
  'Torah Learning': '📖', Shabbat: '🕯️', Chesed: '🤝', Events: '📅',
  Youth: '⭐', Families: '👨‍👩‍👧', Seniors: '💛', General: '💬',
};

export default function CommunityGroupsTab({ communityId, currentUser, isAdmin }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['community-group-list', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_groups')
        .select('*')
        .eq('community_id', communityId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!communityId,
    staleTime: 60000,
  });

  const { data: myMembershipSet = new Set() } = useQuery({
    queryKey: ['community-group-memberships', communityId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return new Set();
      const groupIds = groups.map((g) => g.id);
      if (!groupIds.length) return new Set();
      const { data } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUser.id)
        .in('group_id', groupIds);
      return new Set((data ?? []).map((r) => r.group_id));
    },
    enabled: !!currentUser?.id && groups.length > 0,
    staleTime: 30000,
  });

  const handleJoin = async (group) => {
    if (!currentUser) return;
    try {
      if (group.is_private) {
        await dataService.entities.GroupJoinRequest.create({
          group_id: group.id,
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.display_name,
        });
        toast.success('Join request sent');
      } else {
        await dataService.entities.GroupMember.create({
          group_id: group.id,
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.display_name,
          role: 'member',
        });
        await incrementCounter('community_groups', 'member_count', group.id, 1);
        queryClient.invalidateQueries({ queryKey: ['community-group-memberships', communityId, currentUser.id] });
        queryClient.invalidateQueries({ queryKey: ['community-group-list', communityId] });
        toast.success(`Joined ${group.name}!`);
      }
    } catch {
      toast.error('Could not join group');
    }
  };

  if (isLoading) {
    return (
      <div className="pt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-3">
      {isAdmin && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-2 justify-center py-3 rounded-2xl border-2 border-dashed border-blue-200 text-[13px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      )}

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white mb-4">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-[15px] font-black text-slate-900">No groups yet</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-500">
            {isAdmin ? 'Create the first group for this community.' : 'Groups will appear here once an admin creates them.'}
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <GroupRow
            key={group.id}
            group={group}
            isMember={myMembershipSet.has(group.id)}
            onJoin={handleJoin}
            onOpen={() => navigate(`/groups/${group.id}`)}
          />
        ))
      )}

      <CreateGroupModal
        open={showCreate}
        onOpenChange={setShowCreate}
        currentUser={currentUser}
        communityId={communityId}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['community-group-list', communityId] })}
      />
    </div>
  );
}

function GroupRow({ group, isMember, onJoin, onOpen }) {
  const emoji = CATEGORY_EMOJI[group.category] || '💬';
  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm cursor-pointer active:scale-[0.99] transition-all hover:border-blue-200"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-slate-800 text-2xl">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-bold text-slate-900 truncate">{group.name}</p>
          {group.is_private && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
        </div>
        <p className="text-[12px] text-slate-500 line-clamp-1">{group.description}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {group.member_count || 0} members
        </p>
      </div>
      {isMember ? (
        <span className="flex-shrink-0 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          ✓ Joined
        </span>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(group); }}
          className="flex-shrink-0 text-[12px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full active:scale-95 transition-all"
        >
          {group.is_private ? 'Request' : 'Join'}
        </button>
      )}
    </div>
  );
}
