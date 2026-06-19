import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, LibraryBig, RefreshCw, ScrollText } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import JewishHubBackButton from './JewishHubBackButton';
import { useAuth } from '@/lib/AuthContext';
import { getWeeklyParshaReading } from '@/lib/hebrewDate';
import {
  approveDvarTorah,
  canModerateDvarTorah,
  listDvarTorahPosts,
  rejectDvarTorah,
  submitDvarTorah,
} from '@/services/divreiTorahService';

function cleanParshaName(value) {
  return value?.replace(/^Parashat\s+/i, '') || 'This week’s parsha';
}

function firstVerseRef(torahRef) {
  const match = torahRef?.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!match) return null;
  return `${match[1]} ${match[2]}:${match[3]}`;
}

function sefariaUrl(ref) {
  return `https://www.sefaria.org/${encodeURIComponent(ref).replace(/%20/g, '_').replace(/%3A/g, '.')}`;
}

function commentaryLinks(reading) {
  const firstVerse = firstVerseRef(reading?.torah);
  if (!firstVerse) return [];
  return [
    {
      title: 'Rashi',
      subtitle: 'Classic peshat commentary, starting at the first pasuk.',
      ref: `Rashi on ${firstVerse}`,
    },
    {
      title: 'Ramban',
      subtitle: 'A deeper medieval commentary with textual and conceptual analysis.',
      ref: `Ramban on ${firstVerse}`,
    },
    {
      title: 'Sforno',
      subtitle: 'Concise commentary with careful attention to meaning.',
      ref: `Sforno on ${firstVerse}`,
    },
  ];
}

export default function DivreiTorahPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({ title: '', body: '', authorTitle: '' });
  const readingQuery = useQuery({
    queryKey: ['jewish-hub-divrei-torah', new Date().toDateString()],
    queryFn: () => getWeeklyParshaReading(new Date(), 'America/New_York'),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const reading = readingQuery.data;
  const links = commentaryLinks(reading);
  const canModerate = canModerateDvarTorah(currentUser);
  const dvarTorahQuery = useQuery({
    queryKey: ['jewish-hub-human-divrei-torah', reading?.title, reading?.date, currentUser?.id, canModerate],
    queryFn: () => listDvarTorahPosts(reading, { includePending: canModerate, currentUserId: currentUser?.id }),
    enabled: Boolean(reading),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const invalidatePosts = () => queryClient.invalidateQueries({ queryKey: ['jewish-hub-human-divrei-torah'] });
  const submitMutation = useMutation({
    mutationFn: () => submitDvarTorah({ reading, currentUser, ...form }),
    onSuccess: () => {
      setForm({ title: '', body: '', authorTitle: '' });
      invalidatePosts();
    },
  });
  const approveMutation = useMutation({ mutationFn: approveDvarTorah, onSuccess: invalidatePosts });
  const rejectMutation = useMutation({ mutationFn: rejectDvarTorah, onSuccess: invalidatePosts });

  const submitDisabled = !reading || !form.title.trim() || form.body.trim().length < 40 || submitMutation.isPending;

  return (
    <main className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <JewishHubBackButton />
      <div className="space-y-4">
        <DailyJewishHome compact />

        <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,28,46,0.07)]">
          <div className="border-b border-slate-100 bg-[#FDFCF8] px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-violet-100 bg-white text-violet-700 shadow-sm">
                <LibraryBig className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Divrei Torah</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Weekly Sources
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  A quiet doorway into the parsha: primary text and classic commentaries on Sefaria.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            {readingQuery.isLoading && (
              <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="skeleton h-6 w-32 rounded" />
                <div className="skeleton mt-3 h-4 w-48 rounded" />
              </div>
            )}

            {!readingQuery.isLoading && reading && (
              <>
                <article className="rounded-[26px] border border-slate-100 bg-white px-4 py-5 shadow-sm sm:px-5">
                  <div className="flex items-start gap-3">
                    <ScrollText className="mt-1 h-4 w-4 shrink-0 text-violet-700" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">This week</p>
                      <h2 className="mt-2 text-[24px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                        {cleanParshaName(reading.title)}
                      </h2>
                      {reading.hebrew && (
                        <p
                          dir="rtl"
                          lang="he"
                          className="mt-2 text-right text-[24px] font-semibold leading-9 text-slate-950"
                          style={{ fontFamily: 'var(--font-hebrew)', fontKerning: 'normal' }}
                        >
                          {reading.hebrew}
                        </p>
                      )}
                      {reading.torah && (
                        <a
                          href={sefariaUrl(reading.torah)}
                          target="_blank"
                          rel="noreferrer"
                          className="motion-press mt-4 inline-flex items-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-[13px] font-black text-white"
                        >
                          Open {reading.torah}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>

                {dvarTorahQuery.isLoading ? (
                  <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="skeleton h-6 w-40 rounded" />
                    <div className="skeleton mt-3 h-4 w-full rounded" />
                    <div className="skeleton mt-2 h-4 w-4/5 rounded" />
                  </div>
                ) : dvarTorahQuery.data?.length > 0 ? (
                  <div className="grid gap-3">
                    {dvarTorahQuery.data.map((post) => (
                      <article key={post.id} className="rounded-[26px] border border-violet-100 bg-violet-50/60 px-4 py-5 shadow-sm sm:px-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">
                          {post.dvar_torah_status === 'pending' ? 'Pending review' : 'Human dvar Torah'}
                        </p>
                        <h2 className="mt-2 text-[24px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                          {post.title}
                        </h2>
                        <p className="mt-2 text-[12px] font-bold leading-5 text-violet-800">
                          By {post.author_name || post.submitted_by_name || 'Community member'}
                          {post.dvar_torah_author_title ? ` · ${post.dvar_torah_author_title}` : ''}
                          {post.created_date ? ` · ${new Date(post.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                        </p>
                        <div className="mt-4 space-y-3 text-[14px] font-semibold leading-7 text-slate-700">
                          {String(post.body || post.content || '').split(/\n{2,}/).filter(Boolean).map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                        </div>
                        {canModerate && post.dvar_torah_status === 'pending' && (
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => approveMutation.mutate(post.id)}
                              className="motion-press rounded-[16px] bg-violet-700 px-3 py-2 text-[12px] font-black text-white"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectMutation.mutate(post.id)}
                              className="motion-press rounded-[16px] border border-violet-200 bg-white px-3 py-2 text-[12px] font-black text-violet-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <article className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                    <p className="text-[12px] font-semibold leading-5 text-slate-500">
                      No human-written dvar Torah has been posted for this week yet. Be the first to share a short thought for review.
                    </p>
                  </article>
                )}

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!submitDisabled) submitMutation.mutate();
                  }}
                  className="rounded-[26px] border border-slate-100 bg-white px-4 py-5 shadow-sm sm:px-5"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">Share from a person</p>
                  <h2 className="mt-2 text-[20px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                    Submit a dvar Torah
                  </h2>
                  <p className="mt-2 text-[12px] font-semibold leading-5 text-slate-500">
                    Human-written submissions only. New posts are held for light review unless submitted by a designated contributor.
                  </p>
                  <div className="mt-4 grid gap-3">
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Title"
                      className="h-11 rounded-[18px] border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                    <input
                      value={form.authorTitle}
                      onChange={(event) => setForm((current) => ({ ...current, authorTitle: event.target.value }))}
                      placeholder="Optional title, e.g. Rabbi, Morah, Contributor"
                      className="h-11 rounded-[18px] border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                    <textarea
                      value={form.body}
                      onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                      placeholder="Write the dvar Torah in your own words."
                      rows={6}
                      className="resize-none rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-[13px] font-semibold leading-6 text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                    {submitMutation.error && (
                      <p className="rounded-[16px] border border-rose-100 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-700">
                        {submitMutation.error.message}
                      </p>
                    )}
                    {submitMutation.isSuccess && (
                      <p className="rounded-[16px] border border-emerald-100 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700">
                        Submitted for review.
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={submitDisabled}
                      className="motion-press inline-flex items-center justify-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-[13px] font-black text-white disabled:opacity-40"
                    >
                      {submitMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin" />}
                      Submit for review
                    </button>
                  </div>
                </form>

                <div className="grid gap-3">
                  {links.map((item) => (
                    <a
                      key={item.ref}
                      href={sefariaUrl(item.ref)}
                      target="_blank"
                      rel="noreferrer"
                      className="motion-press rounded-[24px] border border-slate-100 bg-white px-4 py-4 shadow-sm transition-colors active:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[16px] font-black leading-tight text-slate-950">{item.title}</h3>
                          <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{item.subtitle}</p>
                          <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-violet-600">{item.ref}</p>
                        </div>
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {!readingQuery.isLoading && !reading && (
              <p className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-[12px] font-semibold leading-5 text-slate-500">
                This week’s source links are unavailable right now.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
