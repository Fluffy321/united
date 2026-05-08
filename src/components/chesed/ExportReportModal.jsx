import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';

export default function ExportReportModal({ open, onOpenChange, currentUser, logs }) {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  const filteredLogs = logs.filter(l => l.date >= dateFrom && l.date <= dateTo);
  const totalHours = filteredLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Activity', 'Organization', 'Category', 'Hours', 'Verification', 'Verifier', 'Notes'],
      ...filteredLogs.map(l => [
        l.date,
        l.title,
        l.organization_name || '',
        l.category,
        fmt(l.hours),
        l.verification_status,
        l.verifier_name || '',
        (l.notes || '').replace(/,/g, ';'),
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `chesed_hours_${currentUser.full_name?.replace(/\s+/g, '_') || 'report'}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await dataService.functions.invoke('exportChesedReport', {
        userName: currentUser.full_name || currentUser.display_name || 'Student',
        dateFrom,
        dateTo,
        logs: filteredLogs,
      });
      const bytes = res.data;
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `chesed_hours_${(currentUser.full_name || 'report').replace(/\s+/g, '_')}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error('Export failed: ' + e.message);
    }
    setExporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-[17px] font-bold text-[#0F172A]">Export Report</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 space-y-4">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB]" />
            </div>
          </div>

          {/* Summary preview */}
          <div className="bg-[#F5F7FB] rounded-xl p-3.5 space-y-1.5">
            <p className="text-[13px] font-bold text-[#0F172A]">{currentUser.full_name || currentUser.display_name}</p>
            <p className="text-[12px] text-[#6B7280]">{filteredLogs.length} activities · {fmt(totalHours)} total hours</p>
            <div className="flex gap-3 mt-2">
              {['Verified', 'Pending', 'Unverified'].map(s => {
                const count = filteredLogs.filter(l => l.verification_status === s).length;
                if (count === 0) return null;
                return (
                  <span key={s} className="text-[11px] font-semibold text-[#6B7280]">
                    {count} {s}
                  </span>
                );
              })}
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <p className="text-center text-[13px] text-[#9CA3AF] py-2">No logs in this date range</p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              variant="outline"
              className="flex-1 h-11 rounded-xl font-semibold text-[14px] border-[#E8ECF4]"
            >
              <FileText className="w-4 h-4 mr-1.5" /> CSV
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={exporting || filteredLogs.length === 0}
              className="flex-1 h-11 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] font-semibold text-[14px]"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Download className="w-4 h-4 mr-1.5" />}
              PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}