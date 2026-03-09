import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Users } from 'lucide-react';

export default function MembersListTab({ communityId, isLoading = false }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(isLoading);

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
      {members.map(member => (
        <div
          key={member.id}
          className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[13px] font-bold text-blue-600 flex-shrink-0">
              {member.user_id?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-slate-900">{member.user_id}</p>
              {member.role && (
                <p className="text-[11px] text-slate-500 capitalize">
                  {member.role === 'Admin' ? '👑 ' : ''}{member.role}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}