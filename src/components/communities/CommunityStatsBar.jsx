export default function CommunityStatsBar({ members, weeklyHours, activePosts }) {
  return (
    <div className="flex justify-between text-center bg-gray-50 rounded-xl p-4 border">
      <div>
        <p className="text-lg font-bold">{members}</p>
        <p className="text-xs text-gray-500">Members</p>
      </div>
      <div>
        <p className="text-lg font-bold">{weeklyHours}</p>
        <p className="text-xs text-gray-500">Hours This Week</p>
      </div>
      <div>
        <p className="text-lg font-bold">{activePosts}</p>
        <p className="text-xs text-gray-500">Active Posts</p>
      </div>
    </div>
  );
}