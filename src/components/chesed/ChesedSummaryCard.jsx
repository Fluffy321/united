import React from 'react';
import { Clock, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';

export default function ChesedSummaryCard({ logs }) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const totalHours = logs.reduce((s, l) => s + (l.hours || 0), 0);
  const totalActivities = logs.length;
  const thisMonthHours = logs
    .filter(l => {
      const d = new Date(l.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((s, l) => s + (l.hours || 0), 0);
  const thisYearHours = logs
    .filter(l => new Date(l.date).getFullYear() === thisYear)
    .reduce((s, l) => s + (l.hours || 0), 0);

  const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);

  return (
    <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Main stat */}
      <div className="flex items-end gap-1 mb-4">
        <span className="text-[44px] font-black text-[#0F172A] leading-none">{fmt(totalHours)}</span>
        <span className="text-[16px] font-semibold text-[#6B7280] mb-1">hrs total</span>
      </div>

      {/* Sub stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#F5F7FB] rounded-xl p-2.5 text-center">
          <p className="text-[18px] font-bold text-[#0F172A]">{totalActivities}</p>
          <p className="text-[10px] font-medium text-[#6B7280] mt-0.5">Activities</p>
        </div>
        <div className="bg-[#F0F7FF] rounded-xl p-2.5 text-center">
          <p className="text-[18px] font-bold text-[#2563EB]">{fmt(thisMonthHours)}</p>
          <p className="text-[10px] font-medium text-[#6B7280] mt-0.5">This Month</p>
        </div>
        <div className="bg-[#F0FDF4] rounded-xl p-2.5 text-center">
          <p className="text-[18px] font-bold text-[#16A34A]">{fmt(thisYearHours)}</p>
          <p className="text-[10px] font-medium text-[#6B7280] mt-0.5">This Year</p>
        </div>
      </div>
    </div>
  );
}