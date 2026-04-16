import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MembersListTab({ communityId, isLoading = false }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(isLoading);
  const [currentUser, setCurrentUser] = useState(null);
  const [messagingId, setMessagingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!communityId) return;
    loadMembers();
  }, [communityId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const userCommunities = await base44.entities.UserCommunity.filter(
        { community_id: communityId },
        '-created_date',
        100
      );
      setMembers(userCommunities);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
    setLoading(false);
  };

  const startConversation = async (member) => {
    if (!currentUser) {
      base44.auth.redirectToLogin();
      return;
    }
    if (member.user_id === currentUser.id) return;

    setMessagingId(member.user_id);
    try {
      // Find existing conversation between these two users
      const allConvs = await base44.entities.Conversation.list('-updated_date', 100);
      const existing = allConvs.find(c =>
        c.participant_ids?.includes(currentUser.id) &&
        c.participant_ids?.includes(member.user_id) &&
        c.participant_ids?.length === 2
      );

      if (existing) {
        navigate(`/Messages?conversation=${existing.id}`);
        return;
      }

      // Create a new conversation
      const memberName = member.user_name || member.display_name || 'Community Member';
      const conv = await base44.entities.Conversation.create({
        participant_ids: [currentUser.id, member.user_id],
        participant_names: [currentUser.full_name || 'You', memberName],
        last_message: null,
        unread_count: {},
        request_type: 'general',
      });
      navigate(`/Messages?conversation=${conv.id}`);
    } catch (e) {
      toast.error('Could not start conversation');
    }
    setMessagingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 text-[14px] font-medium">No members yet</p>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-2">
      {members.map(member => {
        const isMe = currentUser && member.user_id === currentUser.id;
        const displayName = member.user_name || member.display_name || member.user_id || 'Member';
        const initials = displayName.slice(0, 2).toUpperCase();
        return (
          <div
            key={member.id}
            className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[13px] font-bold text-blue-600 flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-900">
                  {displayName}
                  {isMe && <span className="ml-1.5 text-[11px] text-slate-400 font-normal">(you)</span>}
                </p>
                {member.role && (
                  <p className="text-[11px] text-slate-500 capitalize">
                    {member.role === 'Admin' ? '👑 ' : ''}{member.role}
                  </p>
                )}
              </div>
            </div>

            {!isMe && currentUser && (
              <button
                onClick={() => startConversation(member)}
                disabled={messagingId === member.user_id}
                className="flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-600 px-3 py-1.5 text-[12px] font-semibold hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-60"
              >
                {messagingId === member.user_id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <MessageCircle className="w-3.5 h-3.5" />}
                Message
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}