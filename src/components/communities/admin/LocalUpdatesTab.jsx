import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Activity, AlertCircle, CheckCircle2, ExternalLink, Save, XCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { EmptyState, SectionHeader, fmtRelative } from './shared';
import { postKeys } from '@/lib/queryKeys';

// ─── Automated local updates tab ─────────────────────────────────────────────

export default function LocalUpdatesTab({ communityId }) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState({});

  const { data: sources = [], isLoading: sourcesLoading, error: sourcesError } = useQuery({
    queryKey: ['local-update-sources', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_update_sources')
        .select('id, name, source_type, source_url, category, enabled, requires_review, auto_publish, last_checked_at')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(communityId),
  });

  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ['local-update-items', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_update_items')
        .select(`
          id,
          source_id,
          community_id,
          title,
          short_description,
          category,
          source_url,
          source_name,
          source_published_at,
          status,
          created_at,
          approved_at,
          rejected_at,
          published_post_id,
          source:source_id(name, source_type)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(communityId),
  });

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      items.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = {
            title: item.title || '',
            short_description: item.short_description || '',
            category: item.category || '',
          };
        }
      });
      return next;
    });
  }, [items]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['local-update-items', communityId] });
    queryClient.invalidateQueries({ queryKey: postKeys.community(communityId) });
  };

  const updateDraft = (itemId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] || {}),
        [field]: value,
      },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async ({ item }) => {
      const draft = drafts[item.id] || {};
      const { data, error } = await supabase.rpc('update_local_update_item', {
        p_item_id: item.id,
        p_title: draft.title || item.title,
        p_short_description: draft.short_description || '',
        p_category: draft.category || '',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Queue item updated');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Could not update queue item'),
  });

  const publishMutation = useMutation({
    mutationFn: async ({ item }) => {
      const draft = drafts[item.id] || {};
      const { data, error } = await supabase.rpc('publish_local_update_item', {
        p_item_id: item.id,
        p_title: draft.title || item.title,
        p_short_description: draft.short_description || item.short_description || '',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Published as a community post');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Could not publish update'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ item }) => {
      const { data, error } = await supabase.rpc('reject_local_update_item', {
        p_item_id: item.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Update rejected');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Could not reject update'),
  });

  const isLoading = sourcesLoading || itemsLoading;
  const error = sourcesError || itemsError;
  const pendingItems = items.filter((item) => item.status === 'pending');
  const reviewedItems = items.filter((item) => item.status !== 'pending').slice(0, 8);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-900">Automated updates are not ready yet.</p>
          <p className="mt-1 text-[13px] font-semibold leading-5 text-amber-800">
            {error.message || 'The local updates tables or permissions are not available.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-blue-950">Automated Updates Queue</p>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-blue-800">
              Official public sources land here first. Review, edit, then publish only what belongs in the community.
            </p>
          </div>
        </div>
      </div>

      <section>
        <SectionHeader title={`Sources (${sources.length})`} />
        {sources.length === 0 ? (
          <EmptyState icon={AlertCircle} title="No sources configured" body="A platform admin needs to seed official sources for this community." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {sources.map((source) => (
              <div key={source.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-slate-900">{source.name}</p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {source.source_type} · {source.category || 'Local Update'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${source.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {source.enabled ? 'On' : 'Off'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">
                  Last checked: {source.last_checked_at ? fmtRelative(source.last_checked_at) : 'Not yet'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={`Pending review (${pendingItems.length})`} />
        {pendingItems.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No pending updates" body="New official updates will appear here after the next ingestion run." />
        ) : (
          <div className="space-y-3">
            {pendingItems.map((item) => {
              const draft = drafts[item.id] || {};
              const busy = saveMutation.isPending || publishMutation.isPending || rejectMutation.isPending;
              return (
                <article key={item.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                      {item.category || 'Local Update'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                      {item.source_name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {fmtRelative(item.source_published_at || item.created_at)}
                    </span>
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Post title</span>
                    <input
                      value={draft.title ?? item.title}
                      onChange={(event) => updateDraft(item.id, 'title', event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-blue-300 focus:bg-white"
                    />
                  </label>

                  <label className="mt-3 block">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Summary / post body</span>
                    <textarea
                      rows={4}
                      value={draft.short_description ?? item.short_description ?? ''}
                      onChange={(event) => updateDraft(item.id, 'short_description', event.target.value)}
                      className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-black text-blue-700 hover:text-blue-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Read source
                    </a>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => saveMutation.mutate({ item })}
                        className="motion-press inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => rejectMutation.mutate({ item })}
                        className="motion-press inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 text-[12px] font-black text-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy || !String(draft.title ?? item.title).trim()}
                        onClick={() => publishMutation.mutate({ item })}
                        className="motion-press inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[12px] font-black text-white disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve & Publish
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {reviewedItems.length > 0 && (
        <section>
          <SectionHeader title="Recently reviewed" />
          <div className="space-y-2">
            {reviewedItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      {item.source_name} · {fmtRelative(item.approved_at || item.rejected_at || item.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                    item.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
