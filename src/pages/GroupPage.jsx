import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { dataService, incrementCounter } from '@/services';
import { toast } from 'sonner';
import CommunityGroupPage from '@/components/communities/CommunityGroupPage';

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [joinLoading, setJoinLoading] = useState(false);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  const { data: membership = null } = useQuery({
    queryKey: ['group-membership', groupId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_members')
        .select('id, role')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .maybeSingle();
      return data;
    },
    enabled: !!currentUser?.id && !!groupId,
  });

  const { data: pendingRequest = null } = useQuery({
    queryKey: ['group-join-request', groupId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_join_requests')
        .select('id, status')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .eq('status', 'pending')
        .maybeSingle();
      return data;
    },
    enabled: !!currentUser?.id && !!groupId && !membership,
  });

  const handleJoin = async (g) => {
    if (!currentUser) return;
    setJoinLoading(true);
    try {
      if (g.is_private) {
        await dataService.entities.GroupJoinRequest.create({
          group_id: g.id,
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.display_name,
        });
        queryClient.invalidateQueries({ queryKey: ['group-join-request', groupId, currentUser.id] });
        toast.success('Join request sent');
      } else {
        await dataService.entities.GroupMember.create({
          group_id: g.id,
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.display_name,
          role: 'member',
        });
        await incrementCounter('community_groups', 'member_count', g.id, 1);
        queryClient.invalidateQueries({ queryKey: ['group-membership', groupId, currentUser.id] });
        queryClient.invalidateQueries({ queryKey: ['group', groupId] });
        toast.success(`Joined ${g.name}!`);
      }
    } catch {
      toast.error('Could not join group');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async (g) => {
    if (!currentUser || !membership) return;
    setJoinLoading(true);
    try {
      await dataService.entities.GroupMember.delete(membership.id);
      await incrementCounter('community_groups', 'member_count', g.id, -1);
      queryClient.invalidateQueries({ queryKey: ['group-membership', groupId, currentUser.id] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success(`Left ${g.name}`);
    } catch {
      toast.error('Could not leave group');
    } finally {
      setJoinLoading(false);
    }
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-bold text-slate-800">Group not found</p>
        <button
          onClick={() => navigate('/Groups')}
          className="bg-blue-600 text-white rounded-full px-6 py-2.5 font-semibold text-sm"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <CommunityGroupPage
        group={group}
        currentUser={currentUser}
        isMember={!!membership}
        isPendingRequest={!!pendingRequest}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
