import React from 'react';
import { Calendar, HandHeart, MessageSquare, Sparkles } from 'lucide-react';

export default function TodaySummaryCard({ stats }) {
  const items = [
    { label: 'Events Today', value: stats.eventsToday, icon: Calendar, color: 'text-orange-600' },
    { label: 'Mitzvah Needs', value: stats.mitzvahNeeds, icon: HandHeart, color: 'text-purple-600' },
    { label: 'New Posts', value: stats.newPostsToday, icon: MessageSquare, color: 'text-blue-600' },
    { label: 'Actions Done', value: stats.actionsToday, icon: Sparkles, color: 'text-green-600' }
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Today in the Community</h2>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Icon className={`w-5 h-5 mb-2 ${item.color}`} />
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-sm text-white/80">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}