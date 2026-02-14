import React from 'react';
import { HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MitzvahNowCard({ request, onHelp }) {
  const getCategoryEmoji = (category) => {
    const map = {
      'Errand': '🚗',
      'Lost & Found': '🔍',
      'Quick Favor': '🤝',
      'Tutoring': '📚',
      'Shabbat Help': '✨',
      'Other': '💡'
    };
    return map[category] || '💡';
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{getCategoryEmoji(request.category)}</span>
            <h3 className="font-semibold text-slate-900">{request.title}</h3>
          </div>
          <p className="text-sm text-slate-600 line-clamp-1">{request.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full font-medium">
              {request.category}
            </span>
            <span className="text-xs text-slate-500">• Posted today</span>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => onHelp(request)}
          className="bg-purple-600 hover:bg-purple-700 gap-1"
        >
          <HandHeart className="w-4 h-4" />
          Help
        </Button>
      </div>
    </div>
  );
}