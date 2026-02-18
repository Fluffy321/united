import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Shield, User } from 'lucide-react';

export default function MembersTab({ members, currentUserId }) {
  const [search, setSearch] = useState('');

  const filtered = members.filter(m =>
    m.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const admins = filtered.filter(m => m.role === 'admin');
  const regularMembers = filtered.filter(m => m.role !== 'admin');

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="pl-9"
        />
      </div>

      {admins.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Leaders</p>
          <div className="space-y-1">
            {admins.map(member => (
              <MemberRow key={member.id} member={member} isMe={member.user_id === currentUserId} />
            ))}
          </div>
        </div>
      )}

      {regularMembers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Members ({regularMembers.length})
          </p>
          <div className="space-y-1">
            {regularMembers.map(member => (
              <MemberRow key={member.id} member={member} isMe={member.user_id === currentUserId} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No members found</p>
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, isMe }) {
  return (
    <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#EEF4FF] flex items-center justify-center text-[#0F5ED7] font-bold text-sm">
          {member.user_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="font-medium text-slate-900 text-sm">
          {member.user_name}
          {isMe && <span className="text-slate-400 font-normal ml-1">(you)</span>}
        </span>
      </div>
      {member.role === 'admin' && (
        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs flex items-center gap-1">
          <Shield className="w-3 h-3" /> Admin
        </Badge>
      )}
    </div>
  );
}