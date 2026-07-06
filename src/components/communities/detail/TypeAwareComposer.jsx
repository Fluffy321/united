import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

export default function TypeAwareComposer({ typeConfig, composeText, setComposeText, submitPost, posting, mode }) {
  const [expanded, setExpanded] = useState(false);
  const composerMode = mode || typeConfig.composerMode || 'post';

  // Chesed mode: two action buttons → expand to form below
  if (composerMode === 'chesed') {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
        {!expanded ? (
          <div className="flex gap-2 p-3">
            <button
              type="button"
              onClick={() => setExpanded('request')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-2.5 text-[13px] font-black text-emerald-700 active:scale-95 transition-all"
            >
              🙏 Request Help
            </button>
            <button
              type="button"
              onClick={() => setExpanded('offer')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 py-2.5 text-[13px] font-black text-blue-700 active:scale-95 transition-all"
            >
              💚 Offer Help
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${expanded === 'request' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {expanded === 'request' ? '🙏 Requesting help' : '💚 Offering help'}
              </span>
              <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="ml-auto text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              rows={3}
              autoFocus
              placeholder={expanded === 'request' ? 'Describe what you need — meal, ride, errand, or something else...' : 'Describe what you can offer or how you can help...'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={submitPost}
                disabled={posting || !composeText.trim()}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-black text-white disabled:opacity-50 ${expanded === 'request' ? 'bg-emerald-600' : 'bg-blue-600'}`}
              >
                <Send className="h-3.5 w-3.5" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Message mode: single-line that expands on focus
  if (composerMode === 'message') {
    return (
      <div className={`rounded-2xl border bg-white shadow-sm transition-all ${expanded ? 'border-blue-300' : 'border-slate-100'}`}>
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <MessageCircle className="h-3.5 w-3.5" />
            </div>
            <span className="text-[13px] font-semibold text-slate-400">{typeConfig.prompts[0] || 'Share something with the community...'}</span>
          </button>
        ) : (
          <div className="p-4">
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              rows={3}
              autoFocus
              placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
              <button onClick={submitPost} disabled={posting || !composeText.trim()} className={`inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}>
                <Send className="h-3.5 w-3.5" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Official mode (admin-only composer for shul/org)
  if (composerMode === 'official') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-wide text-amber-700 flex items-center gap-1">
            📢 Post Announcement
          </span>
        </div>
        <textarea
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          rows={3}
          placeholder="Share an official update with the community..."
          className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400"
        />
        <div className="mt-2 flex justify-end">
          <button onClick={submitPost} disabled={posting || !composeText.trim()} className="inline-flex h-9 items-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-black text-white disabled:opacity-50">
            <Send className="h-3.5 w-3.5" />
            {posting ? 'Posting...' : 'Post Update'}
          </button>
        </div>
      </div>
    );
  }

  // Post mode (default): collapsed pill → expands on tap
  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all ${expanded ? 'border-blue-200' : 'border-slate-100'}`}>
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
            <MessageCircle className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-slate-400">{typeConfig.prompts[0] || 'Share something with the community...'}</span>
        </button>
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <MessageCircle className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-black text-slate-950">{typeConfig.primaryCta}</p>
            <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="ml-auto text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <textarea
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            rows={3}
            autoFocus
            placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
          <div className="mt-2 flex justify-end">
            <button onClick={submitPost} disabled={posting || !composeText.trim()} className={`inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}>
              <Send className="h-3.5 w-3.5" />
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
