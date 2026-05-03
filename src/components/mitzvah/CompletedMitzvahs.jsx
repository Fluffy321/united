import React from 'react';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CompletedMitzvahs({ currentUser }) {
  const { data: completedMitzvahs = [] } = useQuery({
    queryKey: ['completed-mitzvahs', currentUser?.id],
    queryFn: async () => {
      const logs = await base44.entities.MitzvahLog.filter({ user_id: currentUser.id }, '-created_date', 100);
      return logs.filter(log => log.hours_completed > 0 || log.date);
    },
    enabled: !!currentUser,
    staleTime: 300000,
    gcTime: 600000,
    retry: 0
  });

  const totalHours = completedMitzvahs.reduce((sum, log) => sum + (log.hours_completed || 0), 0);

  const categoryBreakdown = completedMitzvahs.reduce((acc, log) => {
    const category = log.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const handleExport = () => {
    const lines = [
      `Community Service Hours Report`,
      `User: ${currentUser.full_name}`,
      `Report Date: ${format(new Date(), 'MMMM d, yyyy')}`,
      ``,
      `Total Hours Completed: ${totalHours}`,
      `Total Activities: ${completedMitzvahs.length}`,
      ``,
      `Activities by Category:`
    ];

    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      lines.push(`  • ${category}: ${count}`);
    });

    lines.push(``, `Activity Details:`);
    completedMitzvahs.forEach(log => {
      lines.push(`  • ${log.description} (${log.hours_completed || 0} hours) - ${log.date || format(new Date(log.created_date), 'MMM d, yyyy')}`);
    });

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mitzvah_report_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Header & Export */}
      <div className="bg-white border-b border-[#E8ECF4]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-slate-900">Completed Mitzvahs</h2>
            {completedMitzvahs.length > 0 && (
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>

          {completedMitzvahs.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-[12px] border border-green-200 p-3">
                <p className="text-[11px] text-slate-600 font-semibold mb-1">Total Hours</p>
                <p className="text-[24px] font-bold text-green-600">{totalHours}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[12px] border border-blue-200 p-3">
                <p className="text-[11px] text-slate-600 font-semibold mb-1">Activities</p>
                <p className="text-[24px] font-bold text-blue-600">{completedMitzvahs.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completed List */}
      <div className="flex-1 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {completedMitzvahs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[16px] border border-[#EAECF0]">
              <div className="text-[40px] mb-3">✅</div>
              <p className="text-[14px] font-semibold text-slate-900">No completed mitzvahs yet</p>
              <p className="text-[12px] text-slate-500 mt-1">Start logging your community service</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {completedMitzvahs.map(log => (
                <div key={log.id} className="bg-white rounded-[12px] border border-[#EAECF0] p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-[20px] flex-shrink-0">✅</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900">{log.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {log.hours_completed > 0 && (
                          <span className="text-[11px] bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                            {log.hours_completed} hour{log.hours_completed !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          {log.date ? `Completed ${log.date}` : `Completed ${format(new Date(log.created_date), 'MMM d')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}