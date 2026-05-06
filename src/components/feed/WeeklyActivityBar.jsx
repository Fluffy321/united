import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { startOfWeek } from 'date-fns';

export default function WeeklyActivityBar() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();

  const { data } = useQuery({
    queryKey: ['weekly-activity-bar'],
    queryFn: async () => {
      const [requests, actions] = await Promise.all([
        dataService.entities.MitzvahRequest.list('-created_date', 200),
        dataService.entities.MitzvahAction.list('-created_date', 200),
      ]);
      const thisWeek = (arr) => arr.filter(r => r.created_date >= weekStart);
      const weekRequests = thisWeek(requests);
      return {
        helpRequests:     weekRequests.length,
        fulfilled:        weekRequests.filter(r => r.status === 'completed' || r.status === 'Completed').length,
        volunteerActions: thisWeek(actions).length,
      };
    },
    staleTime: 600000,
    gcTime: 1800000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const stats = data ?? { helpRequests: 0, fulfilled: 0, volunteerActions: 0 };

  const items = [
    { value: stats.helpRequests,     label: 'Help Requests' },
    { value: stats.fulfilled,        label: 'Fulfilled' },
    { value: stats.volunteerActions, label: 'Volunteer Actions' },
  ];

  return (
    <div
      className="rounded-2xl px-4 py-3 mb-3 flex items-center gap-1 bg-white"
      style={{ border: '1px solid #E8ECF4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mr-2 whitespace-nowrap">This week</span>
      <div className="flex items-center gap-0 flex-1">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-[#0F1C2E] font-extrabold text-[20px] leading-none">{item.value}</span>
              <span className="text-[#94a3b8] text-[10px] font-semibold mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
            {i < items.length - 1 && (
              <div className="w-px h-8 bg-[#E8ECF4] flex-shrink-0 mx-1" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}