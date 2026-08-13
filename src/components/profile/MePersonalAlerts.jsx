import React from 'react';
import { AlertCircle, Bell, CheckCircle2, ChevronRight, HandHeart, Loader2, MessageCircle, RefreshCw, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { isUrgentPersonalAlert } from '@/lib/profile/meDashboard';

function AlertIcon({ type }) {
  const Icon = type === 'new_message' || type === 'marketplace_message'
    ? MessageCircle
    : type === 'community_activity' || type === 'announcement'
      ? Users
      : isUrgentPersonalAlert({ type })
        ? HandHeart
        : Bell;
  return <Icon className="h-4 w-4" />;
}

function timeAgo(alert) {
  const date = new Date(alert.updated_at || alert.created_date || alert.created_at || 0);
  return Number.isNaN(date.getTime()) ? '' : formatDistanceToNow(date, { addSuffix: true });
}

export default function MePersonalAlerts({ alerts, isLoading, isError, onRetry, onOpenAlert, onSeeAll }) {
  return (
    <section data-testid="me-personal-alerts">
      <div className="mb-2 flex items-end justify-between px-1">
        <h2 className="text-[15px] font-black text-slate-950">Personal alerts</h2>
        <button type="button" onClick={onSeeAll} className="min-h-11 px-2 text-[11px] font-black text-blue-600">See all</button>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-24 items-center justify-center gap-2 text-[12px] font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading alerts</div>
        ) : isError ? (
          <div className="flex min-h-28 flex-col items-center justify-center px-4 text-center">
            <AlertCircle className="h-5 w-5 text-slate-400" />
            <p className="mt-2 text-[13px] font-black text-slate-800">Alerts couldn't load</p>
            <button type="button" onClick={onRetry} className="mt-1 flex min-h-11 items-center gap-1.5 text-[11px] font-black text-blue-600"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex min-h-28 flex-col items-center justify-center px-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="mt-2 text-[13px] font-black text-slate-800">You're caught up</p>
            <p className="mt-1 text-[11px] text-slate-400">Personal alerts will appear here.</p>
          </div>
        ) : alerts.map((alert, index) => {
          const urgent = isUrgentPersonalAlert(alert);
          const unread = !alert.is_read;
          return (
            <button
              key={alert.id || index}
              type="button"
              onClick={() => onOpenAlert(alert)}
              className={`flex min-h-[62px] w-full items-center gap-3 px-3 py-2.5 text-left transition active:bg-slate-50 ${index ? 'border-t border-slate-100' : ''}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${urgent ? 'bg-orange-50 text-orange-600' : unread ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><AlertIcon type={alert.type} /></span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 block text-[12px] font-black text-slate-900">{alert.title || 'Personal update'}</span>
                <span className="line-clamp-1 block text-[10px] text-slate-500">{alert.body || alert.message}{timeAgo(alert) ? ` · ${timeAgo(alert)}` : ''}</span>
              </span>
              {(urgent || unread) && <span aria-label={urgent ? 'Needs attention' : 'Unread'} className={`h-2 w-2 shrink-0 rounded-full ${urgent ? 'bg-orange-500' : 'bg-blue-600'}`} />}
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
