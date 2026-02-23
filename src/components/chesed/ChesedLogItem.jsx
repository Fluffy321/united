import React, { useState } from 'react';
import { CheckCircle2, Clock, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORY_COLORS = {
  'Chesed': 'bg-blue-100 text-blue-700',
  'Volunteering': 'bg-green-100 text-green-700',
  'Tutoring': 'bg-purple-100 text-purple-700',
  'Visiting Sick': 'bg-orange-100 text-orange-700',
  'Food Drive': 'bg-yellow-100 text-yellow-700',
  'Other': 'bg-slate-100 text-slate-600',
};

const STATUS_CONFIG = {
  Verified: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Verified' },
  Pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Pending Verification' },
  Unverified: { icon: null, color: 'text-slate-400', bg: '', label: '' },
};

export default function ChesedLogItem({ log, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const status = STATUS_CONFIG[log.verification_status] || STATUS_CONFIG.Unverified;
  const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);

  const handleDelete = async () => {
    setShowMenu(false);
    await base44.entities.ChesedLog.delete(log.id);
    toast.success('Log deleted');
    if (onDelete) onDelete();
  };

  const dateStr = log.date ? new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="bg-white rounded-xl p-3.5 relative" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start gap-3">
        {/* Hours pill */}
        <div className="flex-shrink-0 w-12 h-12 bg-[#F0F7FF] rounded-xl flex flex-col items-center justify-center">
          <span className="text-[15px] font-black text-[#2563EB] leading-none">{fmt(log.hours)}</span>
          <span className="text-[9px] font-semibold text-[#93C5FD]">hrs</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] text-[#0F172A] truncate">{log.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {log.organization_name && (
              <span className="text-[11px] text-[#6B7280]">{log.organization_name}</span>
            )}
            {log.organization_name && <span className="text-[10px] text-[#D1D5DB]">·</span>}
            <span className="text-[11px] text-[#9CA3AF]">{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[log.category] || CATEGORY_COLORS.Other}`}>
              {log.category}
            </span>
            {status.icon && (
              <span className={`text-[10px] font-semibold flex items-center gap-1 border px-1.5 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                <status.icon className="w-3 h-3" />
                {status.label}
              </span>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F7FB]">
            <MoreVertical className="w-4 h-4 text-[#9CA3AF]" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-[#E8ECF4] rounded-xl shadow-lg z-20 py-1 min-w-[130px]">
              <button onClick={() => { setShowMenu(false); onEdit && onEdit(log); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#374151] hover:bg-[#F5F7FB]">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-500 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {log.notes && (
        <p className="text-[12px] text-[#6B7280] mt-2 pl-[60px] leading-relaxed">{log.notes}</p>
      )}
    </div>
  );
}