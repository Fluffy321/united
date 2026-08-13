import React from 'react';
import UserAvatar from '@/components/common/UserAvatar';

export default function MeIdentityRow({ user, onEdit }) {
  const handle = user.username || user.display_name?.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'member';
  const location = user.cityPreset || user.location_text;
  return (
    <section data-testid="me-identity" className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
      <UserAvatar user={user} size="md" className="!h-11 !w-11 !rounded-[14px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-black text-slate-950">{user.display_name || user.full_name?.split(' ')[0] || 'Member'}</p>
        <p className="truncate text-[10px] font-semibold text-slate-400">@{handle}{location ? ` · ${location}` : ''}</p>
      </div>
      <button type="button" onClick={onEdit} className="min-h-11 rounded-full bg-blue-50 px-4 text-[11px] font-black text-blue-700">Edit</button>
    </section>
  );
}
