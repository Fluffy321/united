import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Download, Clock } from 'lucide-react';
import ChesedSummaryCard from './ChesedSummaryCard';
import ChesedLogItem from './ChesedLogItem';
import LogHoursModal from './LogHoursModal';
import ExportReportModal from './ExportReportModal';

const STATUS_FILTERS = ['All', 'Verified', 'Pending', 'Unverified'];
const CATEGORIES = ['All', 'Chesed', 'Volunteering', 'Tutoring', 'Visiting Sick', 'Food Drive', 'Other'];

export default function ChesedHoursTab({ currentUser }) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingLog, setEditingLog] = useState(null);
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['chesed-logs', currentUser?.id],
    queryFn: () => base44.entities.ChesedLog.filter({ user_id: currentUser.id }, '-date', 200),
    enabled: !!currentUser,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['chesed-logs', currentUser?.id] });

  const filtered = logs.filter(l => {
    const statusOk = statusFilter === 'All' || l.verification_status === statusFilter;
    const catOk = categoryFilter === 'All' || l.category === categoryFilter;
    return statusOk && catOk;
  });

  return (
    <div className="pt-4 pb-28">
      {/* Summary */}
      <div className="px-4">
        <ChesedSummaryCard logs={logs} />
      </div>

      {/* Action buttons */}
      <div className="px-4 flex gap-2 mb-5">
        <button
          onClick={() => setShowLogModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-[#2563EB] text-white text-[13px] font-semibold rounded-xl active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
        >
          <Plus className="w-4 h-4" /> Log Hours
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          disabled={logs.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-white border border-[#E8ECF4] text-[#374151] text-[13px] font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide mb-1">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`whitespace-nowrap text-[12px] font-semibold px-3.5 py-1.5 rounded-full border transition-all flex-shrink-0 ${
              statusFilter === f
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white text-[#6B7280] border-[#E8ECF4] hover:border-[#2563EB] hover:text-[#2563EB]'
            }`}
          >{f}</button>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {CATEGORIES.map(f => (
          <button key={f} onClick={() => setCategoryFilter(f)}
            className={`whitespace-nowrap text-[11px] font-semibold px-3 py-1 rounded-full border transition-all flex-shrink-0 ${
              categoryFilter === f
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-white text-[#9CA3AF] border-[#E8ECF4] hover:border-[#6B7280] hover:text-[#374151]'
            }`}
          >{f}</button>
        ))}
      </div>

      {/* Logs list */}
      <div className="px-4 space-y-2.5 mt-2">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="w-14 h-14 rounded-full bg-[#F0F7FF] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-[#93C5FD]" />
            </div>
            <p className="text-[15px] font-semibold text-[#0F172A]">
              {logs.length === 0 ? 'No hours logged yet' : 'No logs match filters'}
            </p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">
              {logs.length === 0 ? 'Tap "Log Hours" to start tracking' : 'Try adjusting your filters'}
            </p>
            {logs.length === 0 && (
              <button onClick={() => setShowLogModal(true)}
                className="mt-4 px-5 py-2 bg-[#2563EB] text-white text-[13px] font-semibold rounded-full">
                + Log Hours
              </button>
            )}
          </div>
        ) : (
          filtered.map(log => (
            <ChesedLogItem key={log.id} log={log} onDelete={refresh} onEdit={setEditingLog} />
          ))
        )}
      </div>

      <LogHoursModal
        open={showLogModal || !!editingLog}
        onOpenChange={(v) => { setShowLogModal(v); if (!v) setEditingLog(null); }}
        currentUser={currentUser}
        onSuccess={refresh}
      />

      <ExportReportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        currentUser={currentUser}
        logs={logs}
      />
    </div>
  );
}