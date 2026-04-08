const GRADIENTS = [
  'from-blue-600 via-indigo-600 to-purple-600',
  'from-emerald-500 via-teal-600 to-cyan-600',
  'from-rose-500 via-pink-600 to-fuchsia-600',
  'from-amber-500 via-orange-500 to-red-500',
];

export default function FeaturedCommunityBanner({ communities = [], community, onOpen }) {
  // Support both `communities` (array) and legacy `community` (single)
  const items = communities.length > 0 ? communities.slice(0, 4) : (community ? [community] : []);
  if (items.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3">
      {items.map((c, i) => {
        const memberCount = c.follower_count || 0;
        const gradient = GRADIENTS[i % GRADIENTS.length];
        return (
          <div
            key={c.id}
            onClick={() => onOpen(c.id)}
            className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} text-white shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer`}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative p-4">
              <div className="text-[9px] font-bold text-white/70 mb-2 tracking-widest uppercase">⭐ Featured</div>
              <div className="text-[14px] font-extrabold leading-tight line-clamp-2">{c.name}</div>
              <div className="mt-2 text-[11px] text-white/80 line-clamp-2">{c.description_short || c.description}</div>
              <div className="mt-3 text-[11px] text-white/70">{memberCount.toLocaleString()} members</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}