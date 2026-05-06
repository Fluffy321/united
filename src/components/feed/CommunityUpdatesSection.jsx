import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { dataService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function CommunityUpdatesSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['community-updates'],
    queryFn: async () => {
      return dataService.entities.UnifiedPost.filter({ type: 'news' }, '-created_date', 10);
    },
    staleTime: 300000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
  });

  if (!updates || updates.length === 0) return null;

  const displayedUpdates = isExpanded ? updates : updates.slice(0, 3);

  return (
    <div className="rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFC] overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F2F4F7] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[16px]">📢</span>
          <span className="font-semibold text-[#0F172A] text-[14px]">Community Updates</span>
          <span className="text-[12px] text-[#64748B] font-medium">({updates.length})</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-[#64748B] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div className="space-y-1 px-4 py-2">
        {isLoading ? (
          <div className="py-2 text-center text-[13px] text-[#64748B]">Loading updates...</div>
        ) : (
          displayedUpdates.map((update) => (
            <div
              key={update.id}
              className="py-2 px-2 rounded-lg hover:bg-white/50 transition-colors cursor-pointer"
              onClick={() => navigate(createPageUrl('CommunityUpdates'))}
            >
              <p className="text-[13px] font-medium text-[#0F172A] line-clamp-2">
                {update.title || update.body}
              </p>
              <p className="text-[11px] text-[#64748B] mt-1">
                {update.user_name} • {new Date(update.created_date).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {!isExpanded && updates.length > 3 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-2.5 text-center text-[13px] font-semibold text-[#2563EB] border-t border-[#E5E7EB] hover:bg-white/50 transition-colors"
        >
          View All {updates.length} Updates
        </button>
      )}
    </div>
  );
}