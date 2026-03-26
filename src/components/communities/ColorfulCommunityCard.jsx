import { categoryColors } from '@/lib/theme';

export default function ColorfulCommunityCard({ community, onJoin }) {
  const gradient = categoryColors[community.category] || "from-blue-500 to-indigo-600";

  return (
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold shadow-sm`}>
            {community.name?.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="font-bold text-slate-900">{community.name}</div>
            <div className="text-sm text-slate-500">{community.category}</div>
          </div>

          <button
            onClick={() => onJoin?.(community)}
            className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Join
          </button>
        </div>

        {community.description && (
          <div className="mt-3 text-sm text-slate-600">{community.description}</div>
        )}
      </div>
    </div>
  );
}