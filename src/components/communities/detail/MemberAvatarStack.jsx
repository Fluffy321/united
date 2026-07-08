import { Users } from 'lucide-react';

export default function MemberAvatarStack({ members = [], limit = 4, typeConfig }) {
  const visible = members.slice(0, limit);
  if (!visible.length) {
    const Icon = typeConfig?.icon || Users;
    return (
      <div className="flex -space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-50 text-blue-600">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex -space-x-2">
      {visible.map((member, index) => {
        const name = member.profile?.display_name || member.user_name || member.display_name || member.full_name || 'Member';
        const initial = name.trim()[0]?.toUpperCase() || 'M';
        return (
          <div
            key={member.id || member.user_id || `${initial}-${index}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-600 to-slate-900 text-[10px] font-black text-white shadow-sm"
            title={name}
          >
            {initial}
          </div>
        );
      })}
    </div>
  );
}
