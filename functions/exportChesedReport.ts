import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { userName, dateFrom, dateTo, logs } = await req.json();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 18;
    const contentW = pageW - margin * 2;

    // ── Header ──────────────────────────────────────────────────────────
    doc.setFillColor(37, 99, 235); // brand blue
    doc.rect(0, 0, pageW, 38, 'F');

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Chesed Hours Report', margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(userName, margin, 27);
    doc.text(`${dateFrom} — ${dateTo}`, pageW - margin, 27, { align: 'right' });

    // ── Summary boxes ────────────────────────────────────────────────────
    const totalHours = logs.reduce((s, l) => s + (l.hours || 0), 0);
    const fmtH = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);
    const verified = logs.filter(l => l.verification_status === 'Verified').length;

    doc.setFillColor(240, 247, 255);
    doc.roundedRect(margin, 44, contentW / 3 - 4, 22, 3, 3, 'F');
    doc.roundedRect(margin + contentW / 3, 44, contentW / 3 - 4, 22, 3, 3, 'F');
    doc.roundedRect(margin + (contentW / 3) * 2, 44, contentW / 3, 22, 3, 3, 'F');

    const boxCenterY = 53;
    doc.setTextColor(15, 23, 42);
    [[fmtH(totalHours) + ' hrs', 'Total Hours', 0], [logs.length, 'Activities', 1], [verified + ' verified', 'Status', 2]].forEach(([val, label, i]) => {
      const cx = margin + (contentW / 3) * i + (contentW / 3) / 2 - (i === 2 ? 2 : 0);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(String(val), cx, boxCenterY, { align: 'center' });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
      doc.text(label, cx, boxCenterY + 5, { align: 'center' });
    });

    // ── Table ────────────────────────────────────────────────────────────
    let y = 76;
    const cols = [16, 52, 38, 22, 20, 22]; // widths
    const headers = ['Date', 'Activity', 'Organization', 'Category', 'Hours', 'Verified'];

    // Header row
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    let cx = margin + 2;
    headers.forEach((h, i) => { doc.text(h, cx, y + 5.5); cx += cols[i]; });

    y += 8;
    doc.setFont('helvetica', 'normal');

    logs.forEach((log, idx) => {
      if (y > 265) { doc.addPage(); y = 20; }
      const bg = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...bg);
      doc.rect(margin, y, contentW, 8, 'F');

      doc.setTextColor(15, 23, 42); doc.setFontSize(8);
      const row = [
        log.date || '',
        log.title?.substring(0, 30) || '',
        (log.organization_name || '—').substring(0, 22),
        log.category || '',
        fmtH(log.hours || 0),
        log.verification_status === 'Verified' ? '✓' : log.verification_status === 'Pending' ? '⏳' : '—',
      ];

      cx = margin + 2;
      row.forEach((val, i) => {
        if (i === 5 && val === '✓') doc.setTextColor(22, 163, 74);
        else if (i === 5 && val === '⏳') doc.setTextColor(217, 119, 6);
        else doc.setTextColor(15, 23, 42);
        doc.text(String(val), cx, y + 5.5);
        cx += cols[i];
      });
      y += 8;
    });

    // ── Footer ───────────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(7); doc.setTextColor(156, 163, 175);
      doc.text(`Generated ${new Date().toLocaleDateString()} · Page ${p} of ${pageCount}`, pageW / 2, 290, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=chesed_hours.pdf' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});