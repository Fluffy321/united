import React, { useState } from 'react';
import { dataService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { X, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_EMOJI = {
  power_outage: '⚡',
  shiva: '🕯️',
  missing_item: '🔍',
  urgent_ride: '🚗',
  medical: '🏥',
  other: '📢',
};

export default function CommunityAlertBanner({ currentUser }) {
  const [dismissed, setDismissed] = useState([]);

  const { data: alerts = [] } = useQuery({
    queryKey: ['community-alerts'],
    queryFn: () => dataService.entities.CommunityAlert.filter({ is_resolved: false }, '-created_date', 5),
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const handleResolve = async (alert) => {
    if (alert.posted_by !== currentUser?.id && currentUser?.role !== 'admin') return;
    await dataService.entities.CommunityAlert.update(alert.id, {
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    });
    setDismissed(prev => [...prev, alert.id]);
  };

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  if (!visible.length) return null;

  return (
    <div className="space-y-2 mb-3">
      {visible.map(alert => (
        <div
          key={alert.id}
          className="rounded-[14px] overflow-hidden border border-red-200"
          style={{ background: 'linear-gradient(135deg, #FFF1F1 0%, #FFF5F5 100%)', boxShadow: '0 2px 12px rgba(220,38,38,0.1)' }}
        >
          <div className="flex items-start gap-3 p-3.5">
            {/* Icon */}
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">{TYPE_EMOJI[alert.type] || '📢'}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">🚨 Community Alert</span>
                <span className="text-[10px] text-red-400">· {formatDistanceToNow(new Date(alert.created_date), { addSuffix: true })}</span>
              </div>
              <p className="font-bold text-[14px] text-[#0F1C2E] leading-snug">{alert.title}</p>
              <p className="text-[12.5px] text-slate-600 mt-0.5 leading-relaxed">{alert.body}</p>
              {alert.contact_info && (
                <p className="text-[12px] text-red-700 font-semibold mt-1">📞 {alert.contact_info}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Posted by {alert.posted_by_name}</p>
            </div>

            {/* Dismiss / resolve */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                onClick={() => setDismissed(prev => [...prev, alert.id])}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {(alert.posted_by === currentUser?.id || currentUser?.role === 'admin') && (
                <button
                  onClick={() => handleResolve(alert)}
                  className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                  title="Mark resolved"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}