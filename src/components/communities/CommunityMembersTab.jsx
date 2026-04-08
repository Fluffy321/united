import React, { useState } from 'react';
import { Search, Shield, Star } from 'lucide-react';

const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];
const MOCK_BIOS = [
  'Five Towns local. Love Shabbos gatherings.',
  'Educator, parent, community enthusiast.',
  'Newcomer to the area, excited to connect!',
  'Long-time member. Happy to help newcomers.',
  'Working in tech. Torah learning on weekdays.',
  'Parent of 3. Involved in school & shul.',
  'Recent graduate. Looking to get involved.',
  'Retired professional. Lots of time to volunteer.',
];

function MemberCard({ member, index, currentUserId }) {
  const name = member.user_name || member.full_name || 'Member';
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const isAdmin = member.role === 'admin' || member.role === 'Admin' || member.role === 'creator';
  const bio = MOCK_BIOS[index % MOCK_BIOS.length];
  const isNew = index < 3; // first few are "new"

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0" style={{ background: color }}>
        {name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-slate-900 truncate">{name}</p>
          {isAdmin && <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
          {isNew && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">New</span>}
        </div>
        <p className="text-[11px] text-slate-400 truncate">{bio}</p>
        {member.role && member.role !== 'member' && member.role !== 'Member' && (
          <span className="text-[10px] font-bold text-blue-600">{member.role}</span>
        )}
      </div>
    </div>
  );
}

export default function CommunityMembersTab({ members, currentUser }) {
  const [search, setSearch] = useState('');

  const filtered = members.filter(m => {
    const name = (m.user_name || m.full_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const admins = filtered.filter(m => m.role === 'admin' || m.role === 'Admin' || m.role === 'creator');
  const regular = filtered.filter(m => m.role !== 'admin' && m.role !== 'Admin' && m.role !== 'creator');

  if (members.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center mb-4">
        <div className="text-4xl mb-3">👥</div>
        <p className="text-[15px] font-bold text-slate-900">No members yet</p>
        <p className="text-[13px] text-slate-500 mt-1">Be the first to join this community!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Members', value: members.length, icon: '👥' },
          { label: 'Active', value: Math.min(members.length, 12), icon: '🟢' },
          { label: 'New This Week', value: Math.min(members.length, 3), icon: '✨' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-sm">
            <div className="text-xl mb-0.5">{s.icon}</div>
            <div className="text-[18px] font-black text-slate-900">{s.value}</div>
            <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Admins */}
      {admins.length > 0 && (
        <div>
          <p className="text-[12px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Admins & Leaders
          </p>
          <div className="space-y-2">
            {admins.map((m, i) => <MemberCard key={m.id || i} member={m} index={i} currentUserId={currentUser?.id} />)}
          </div>
        </div>
      )}

      {/* Members */}
      <div>
        {admins.length > 0 && <p className="text-[12px] font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> All Members</p>}
        <div className="space-y-2">
          {regular.slice(0, 30).map((m, i) => <MemberCard key={m.id || i} member={m} index={i} currentUserId={currentUser?.id} />)}
        </div>
        {regular.length > 30 && (
          <p className="text-center text-[12px] text-slate-400 pt-2">+ {regular.length - 30} more members</p>
        )}
      </div>
    </div>
  );
}