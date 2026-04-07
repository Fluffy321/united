export default function FeaturedCommunityBanner({ community, onOpen }) {
  if (!community) return null;

  const activeNow = community.activeNow || 12;
  const memberCount = community.memberCount || community.follower_count || 0;

  return (
    <div className="relative mb-6 rounded-[28px] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[3px]" />

      <div className="relative p-8">
        <div className="text-xs font-semibold text-white/80 mb-3 tracking-wide">
          ⭐ FEATURED COMMUNITY
        </div>

        <div className="text-3xl font-extrabold leading-tight">
          {community.name}
        </div>

        <div className="mt-3 text-sm text-white/85 max-w-xl">
          {community.description}
        </div>

        <div className="mt-4 text-sm text-white/80">
          🔥 {community.trendingText || "23 new posts this week"}
        </div>

        <div className="mt-5 flex items-center gap-4 text-sm text-white/80">
          <span>{memberCount.toLocaleString()} members</span>
          <span>•</span>
          <span>{activeNow} active now</span>
        </div>

        <button
          onClick={() => onOpen(community.id)}
          className="mt-6 bg-white text-slate-900 rounded-full px-7 py-3.5 font-semibold shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
        >
          View Community
        </button>
      </div>
    </div>
  );
}