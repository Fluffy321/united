import React from 'react';
import { Mail, X, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { dataService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function NewsletterHistoryModal({ groupId, onClose }) {
  const { data: newsletters, isLoading } = useQuery({
    queryKey: ['newsletter-history', groupId],
    queryFn: async () => {
      const logs = await dataService.entities.NewsletterLog.filter({ group_id: groupId }, '-sent_date', 20);
      return logs;
    },
    enabled: !!groupId,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Newsletter History</h2>
              <p className="text-xs text-slate-500">Past newsletters sent to your community</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            </div>
          ) : newsletters?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Mail className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-600 font-semibold">No newsletters sent yet</p>
              <p className="text-sm text-slate-400 mt-1">Your first community newsletter awaits!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newsletters.map((newsletter, idx) => (
                <NewsletterCard key={newsletter.id} newsletter={newsletter} index={idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsletterCard({ newsletter, index }) {
  const successRate = newsletter.recipients_count > 0 
    ? Math.round((newsletter.sent_count / newsletter.recipients_count) * 100) 
    : 0;

  return (
    <div className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 mb-1">{newsletter.subject}</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(newsletter.sent_date), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Sent by {newsletter.sent_by_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-600">{newsletter.recipients_count} recipients</p>
            <p className="text-xs text-slate-500">{successRate}% delivery rate</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">{newsletter.sent_count}</p>
            <p className="text-[10px] text-slate-500">Sent</p>
          </div>
        </div>
        {newsletter.failed_count > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">{newsletter.failed_count}</p>
              <p className="text-[10px] text-slate-500">Failed</p>
            </div>
          </div>
        )}
        <div className="ml-auto">
          <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}