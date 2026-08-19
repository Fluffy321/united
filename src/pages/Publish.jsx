import React from 'react';
import { ArrowLeft, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { filterUserCommunity } from '@/services/entityServices';
import PublishingTypePicker from '@/components/publishing/PublishingTypePicker';
import PublishingForm from '@/components/publishing/PublishingForm';
import PublishingPreview from '@/components/publishing/PublishingPreview';
import MyPublishing from '@/components/publishing/MyPublishing';
import { createPublishingDraft, toPublishCommand, validatePublishingDraft } from '@/lib/publishing/publishingDraft';
import { getPublishingType } from '@/lib/publishing/publishingTypes';
import { publishingService } from '@/services/publishingService';

const DRAFT_KEY = 'junited-smart-publishing-draft';

function Header({ step, onBack, onMine }) {
  const stepLabel = { choose: 'Choose', details: 'Details', preview: 'Preview', done: 'Done', mine: 'My posts' }[step];
  const title = step === 'mine' ? 'Your publishing' : 'Create';
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[430px] items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Go back" className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-slate-200 bg-white text-slate-700"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">{stepLabel}</p><h1 className="text-xl font-black tracking-[-0.025em] text-slate-950">{title}</h1></div>
        {step !== 'mine' && <button type="button" onClick={onMine} className="min-h-11 rounded-[15px] px-3 text-sm font-extrabold text-slate-600">My posts</button>}
      </div>
    </header>
  );
}

export function PublishView({ step, draft, expandedGroup, status, errors = {}, result, myPosts = [], myPostsLoading = false, myPostsError = null, myActionError = '', pendingAction = null, editing = false, onAction, onRetryMine }) {
  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-950">
      <Header step={step} onBack={() => onAction('back')} onMine={() => onAction('mine')} />
      <main className="mx-auto w-full max-w-[430px] px-3.5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-5">
        {step === 'mine' && <MyPublishing items={myPosts} loading={myPostsLoading} error={myPostsError} actionError={myActionError} pendingAction={pendingAction} onRetry={onRetryMine} onAction={onAction} />}
        {step === 'choose' && <><h2 className="px-1 text-[28px] font-black leading-[1.02] tracking-[-0.045em]">What are you sharing?</h2><p className="mb-5 mt-2 px-1 text-sm font-medium text-slate-600">Pick the closest fit. JUnited puts it in the right place.</p><PublishingTypePicker expandedGroup={expandedGroup} onGroup={(id) => onAction('group', id)} onType={(id) => onAction('type', id)} /></>}
        {step === 'details' && draft && <><PublishingForm draft={draft} errors={errors} onChange={(field, value) => onAction('change', { field, value })} /><button type="button" onClick={() => onAction('preview')} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#0A1838] text-base font-black text-white shadow-[0_14px_28px_rgba(10,24,56,0.2)]">Preview <ChevronRight className="h-5 w-5" /></button></>}
        {step === 'preview' && draft && <><p className="mb-3 px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Preview</p><PublishingPreview draft={draft} />{status === 'error' && <p className="mt-3 rounded-[14px] bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-700">We couldn’t save that. Your changes are still here.</p>}<button type="button" disabled={status === 'pending'} onClick={() => onAction('publish')} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-blue-600 text-base font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)] disabled:opacity-60">{status === 'pending' ? <><Loader2 className="h-5 w-5 animate-spin" /> {editing ? 'Saving…' : 'Publishing…'}</> : editing ? 'Save changes' : 'Publish now'}</button><button type="button" onClick={() => onAction('edit')} className="mt-2 min-h-12 w-full text-sm font-extrabold text-slate-600">Edit details</button></>}
        {step === 'done' && <div className="pt-12 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"><Check className="h-8 w-8" /></span><h2 className="mt-5 text-3xl font-black tracking-[-0.04em]">Published</h2><p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-slate-600">It’s live in the right part of JUnited. Safety checks continue quietly in the background.</p><button type="button" onClick={() => onAction('view', result?.destinationUrl)} className="mt-7 min-h-14 w-full rounded-[18px] bg-[#0A1838] text-base font-black text-white">View post</button><button type="button" onClick={() => onAction('another')} className="mt-2 min-h-12 w-full text-sm font-extrabold text-blue-600">Post another</button></div>}
      </main>
    </div>
  );
}

export default function Publish() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const mode = searchParams.get('mode');
  const initialType = getPublishingType(searchParams.get('type'))?.id || null;
  const [step, setStep] = React.useState(mode === 'mine' ? 'mine' : initialType ? 'details' : 'choose');
  const [expandedGroup, setExpandedGroup] = React.useState(initialType ? getPublishingType(initialType).group : 'local');
  const [draft, setDraft] = React.useState(null);
  const [errors, setErrors] = React.useState({});
  const [status, setStatus] = React.useState('idle');
  const [result, setResult] = React.useState(null);
  const [pendingAction, setPendingAction] = React.useState(null);
  const [myActionError, setMyActionError] = React.useState('');
  const [editingContentId, setEditingContentId] = React.useState(null);
  const submissionKey = React.useRef(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  const { data: memberships = [] } = useQuery({
    queryKey: ['publish-memberships', user?.id],
    queryFn: () => filterUserCommunity({ user_id: user.id, status: 'active' }, '-created_date', 100),
    enabled: Boolean(user?.id),
  });
  const myPublishingQuery = useQuery({
    queryKey: ['my-publishing', user?.id],
    queryFn: () => publishingService.listMine(null),
    enabled: Boolean(user?.id && mode === 'mine'),
    retry: 1,
  });
  const myPosts = Array.isArray(myPublishingQuery.data) ? myPublishingQuery.data : myPublishingQuery.data?.items || [];
  const userContext = React.useMemo(() => ({
    network: user?.city || user?.neighborhood || user?.public_community || 'Five Towns',
    joinedCommunities: memberships.map((membership) => ({ id: membership.community_id, name: membership.community_name || membership.name || 'Joined community' })),
  }), [memberships, user]);

  React.useEffect(() => {
    if (!initialType || draft) return;
    setDraft(createPublishingDraft(initialType, userContext));
  }, [initialType, draft, userContext]);
  React.useEffect(() => {
    setStep(mode === 'mine' ? 'mine' : initialType ? 'details' : 'choose');
  }, [mode, initialType]);
  React.useEffect(() => {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const action = async (name, payload) => {
    if (name === 'group') setExpandedGroup(payload);
    if (name === 'type') { setDraft(createPublishingDraft(payload, userContext)); setErrors({}); setStep('details'); }
    if (name === 'change') setDraft((current) => ({ ...current, [payload.field]: payload.value }));
    if (name === 'preview') { const check = validatePublishingDraft(draft); setErrors(check.errors); if (check.valid) setStep('preview'); }
    if (name === 'edit' && step !== 'mine') setStep('details');
    if (name === 'back') { if (step === 'choose') navigate(-1); else if (step === 'details') setStep('choose'); else if (step === 'preview') setStep('details'); else if (step === 'mine') navigate('/Profile'); else navigate('/Feed'); }
    if (name === 'mine') navigate('/Publish?mode=mine');
    if (name === 'create') navigate('/Publish');
    if (step === 'mine' && name === 'open') navigate(payload.destinationUrl || payload.destination_url || `/PostDetail?id=${payload.contentId || payload.content_id || payload.id}`);
    if (step === 'mine' && ['edit', 'reuse'].includes(name)) {
      setMyActionError('');
      const publishingType = payload.publishingType || payload.publishing_type;
      if (!getPublishingType(publishingType)) {
        setMyActionError('This older post can’t be edited here yet. You can still open it or create a new one.');
        return;
      }
      const content = payload.content || {};
      const audience = payload.audience || { scope: 'area', network: userContext.network, communityId: null };
      const nextDraft = {
        ...createPublishingDraft(publishingType, userContext),
        ...content,
        headline: payload.headline || content.headline || '',
        details: payload.details || content.details || '',
        audience,
        expiresAt: payload.expiresAt || payload.expires_at || null,
        sourceName: payload.sourceName || payload.source_name || payload.source?.name || '',
        sourceUrl: payload.sourceUrl || payload.source_url || payload.source?.url || '',
        publicAuthorHidden: Boolean(payload.publicAuthorHidden || payload.public_author_hidden),
        ...(content.attributes || payload.attributes || {}),
      };
      setDraft(nextDraft);
      setEditingContentId(name === 'edit' ? payload.contentId || payload.content_id || payload.id : null);
      submissionKey.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      navigate(`/Publish?type=${nextDraft.publishingType}`, { replace: true });
      setStep('details');
    }
    if (step === 'mine' && name === 'end') {
      const contentId = payload.contentId || payload.content_id || payload.id;
      if (!contentId || pendingAction) return;
      if (globalThis.confirm && !globalThis.confirm('End this post? People will no longer see it as active.')) return;
      setMyActionError('');
      setPendingAction({ name, contentId });
      try {
        await publishingService.end(contentId);
        await queryClient.invalidateQueries({ queryKey: ['my-publishing', user?.id] });
      } catch {
        setMyActionError('That post couldn’t be ended. Nothing was changed—please try again.');
      } finally {
        setPendingAction(null);
      }
    }
    if (name === 'view') navigate(payload || '/Feed');
    if (name === 'another') { sessionStorage.removeItem(DRAFT_KEY); submissionKey.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`; setDraft(null); setStatus('idle'); setStep('choose'); }
    if (name === 'publish' && status !== 'pending') {
      setStatus('pending');
      try {
        const command = toPublishCommand(draft, submissionKey.current);
        const published = editingContentId
          ? await publishingService.update(editingContentId, command)
          : await publishingService.publish(command);
        setResult(published); setStatus('success'); setStep('done'); sessionStorage.removeItem(DRAFT_KEY);
        setEditingContentId(null);
      } catch { setStatus('error'); }
    }
  };

  return <PublishView step={step} draft={draft} expandedGroup={expandedGroup} status={status} errors={errors} result={result} myPosts={myPosts} myPostsLoading={myPublishingQuery.isLoading} myPostsError={myPublishingQuery.error} myActionError={myActionError} pendingAction={pendingAction} editing={Boolean(editingContentId)} onRetryMine={() => myPublishingQuery.refetch()} onAction={action} />;
}
