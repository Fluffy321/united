import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { Avatar, EmptyState, SectionHeader, fmtDate, fmtRelative, REASON_LABEL_MAP } from './shared';

// ─── Moderation tab ───────────────────────────────────────────────────────────

const REPORT_REASON_LABELS = {
  spam:          'Spam or scam',
  harassment:    'Harassment',
  hate_speech:   'Hate speech',
  misinformation:'Misinformation',
  inappropriate: 'Inappropriate content',
  violence:      'Violence or threats',
  other:         'Other',
};

const CONTENT_TYPE_LABELS = {
  post:    'Post',
  comment: 'Comment',
  user:    'User',
  request: 'Request',
};

export default function ModerationTab({ communityId }) {
  const [section, setSection] = useState('removals');

  const { data: removals = [], isLoading: removalsLoading } = useQuery({
    queryKey: ['admin-removals', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_member_removals')
        .select(`
          id, removed_user_id, reason_code, reason_note, removed_at, community_privacy,
          removed_user:removed_user_id(display_name, avatar_url),
          remover:removed_by_user_id(display_name),
          appeal:community_member_appeals(id, status)
        `)
        .eq('community_id', communityId)
        .order('removed_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-community-reports', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('reports')
        .select('id, content_type, content_preview, reason, details, resolved, created_at, target_user_name, reporter:reporter_id(display_name)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const isLoading = removalsLoading || reportsLoading;

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const appealStatus = (r) => r.appeal?.[0]?.status ?? null;
  const appealBadge = (status) => {
    if (!status) return null;
    const cfg = {
      pending:  'bg-amber-50 text-amber-700',
      approved: 'bg-green-50 text-green-700',
      denied:   'bg-slate-100 text-slate-500',
    }[status] || 'bg-slate-100 text-slate-500';
    return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${cfg}`}>Appeal: {status}</span>;
  };

  const openReports = reports.filter(r => !r.resolved);
  const resolvedReports = reports.filter(r => r.resolved);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {/* Section toggle */}
      <div className="flex gap-2">
        {[
          { key: 'removals', label: `Removals (${removals.length})` },
          { key: 'reports',  label: `Content Reports (${openReports.length} open)` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
              section === key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Removals ── */}
      {section === 'removals' && (
        <>
          <SectionHeader title={`${removals.length} removal${removals.length !== 1 ? 's' : ''}`} />
          {removals.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No removals" body="Member removal records will appear here." />
          ) : (
            <div className="space-y-2">
              {removals.map(r => {
                const name = r.removed_user?.display_name || 'Former member';
                const removerName = r.remover?.display_name || 'Admin';
                const status = appealStatus(r);
                return (
                  <div key={r.id} className="rounded-2xl bg-white border border-slate-100 px-4 py-3.5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Avatar name={name} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-bold text-slate-900">{name}</p>
                          {status && appealBadge(status)}
                        </div>
                        <p className="text-[12px] text-slate-600 mt-0.5">
                          {REASON_LABEL_MAP[r.reason_code] || r.reason_code}
                        </p>
                        {r.reason_note && (
                          <p className="text-[12px] text-slate-400 mt-1 italic">"{r.reason_note}"</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Removed by {removerName} · {fmtDate(r.removed_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Content Reports ── */}
      {section === 'reports' && (
        <>
          <SectionHeader title={`${openReports.length} open · ${resolvedReports.length} resolved`} />
          {reports.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No reports" body="Content reported in this community will appear here." />
          ) : (
            <div className="space-y-2">
              {reports.map(rpt => (
                <div key={rpt.id} className={`rounded-2xl bg-white border px-4 py-3.5 shadow-sm ${rpt.resolved ? 'border-slate-100 opacity-60' : 'border-amber-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          {CONTENT_TYPE_LABELS[rpt.content_type] || rpt.content_type}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {REPORT_REASON_LABELS[rpt.reason] || rpt.reason}
                        </span>
                        {rpt.resolved && (
                          <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Resolved</span>
                        )}
                      </div>
                      {rpt.content_preview && (
                        <p className="text-[12px] text-slate-700 italic mb-1 line-clamp-2">"{rpt.content_preview}"</p>
                      )}
                      {rpt.target_user_name && (
                        <p className="text-[12px] text-slate-500">Reported user: <span className="font-semibold">{rpt.target_user_name}</span></p>
                      )}
                      {rpt.details && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{rpt.details}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Reported by {rpt.reporter?.display_name || 'member'} · {fmtRelative(rpt.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mt-2">
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Report resolution is handled by platform admins. Community admins can view reports filed against content in this community.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
