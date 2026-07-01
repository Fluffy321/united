import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Share2, RefreshCw, Check, Link2, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { createInviteLink, updateInviteLink } from '@/services/entityServices';

const INVITE_NOUN = {
  neighborhood: 'neighbors',
  shul:         'members',
  chesed:       'volunteers',
  parents:      'parents',
  learning:     'learners',
  events:       'people',
  marketplace:  'buyers & sellers',
  general:      'members',
};

export default function CommunityInviteModal({ open, onClose, community, currentUser, typeConfig }) {
  const [link, setLink]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [copied, setCopied]         = useState(false);
  const [working, setWorking]       = useState(false);
  const [showAdvanced, setAdvanced] = useState(false);
  const [expiresAt, setExpiresAt]   = useState('');
  const [maxUses, setMaxUses]       = useState('');

  const typeKey   = typeConfig?.key || community?.community_type || 'general';
  const noun      = INVITE_NOUN[typeKey] || 'members';
  const inviteUrl = link ? `${window.location.origin}/join?code=${link.code}` : null;

  useEffect(() => {
    if (!open || !community?.id || !currentUser?.id) return;
    setAdvanced(false);
    setExpiresAt('');
    setMaxUses('');
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLink(null);
      try {
        const { data: existing } = await supabase
          .from('invite_links')
          .select('*')
          .eq('community_id', community.id)
          .eq('inviter_id', currentUser.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (existing) {
          setLink(existing);
        } else {
          const created = await createNewLink();
          if (!cancelled) setLink(created);
        }
      } catch {
        if (!cancelled) toast.error('Could not load invite link');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [open, community?.id, currentUser?.id]);

  async function createNewLink() {
    const name = currentUser?.full_name || currentUser?.display_name || currentUser?.email || 'Community Admin';
    const payload = { community_id: community.id, inviter_id: currentUser.id, inviter_name: name };
    if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();
    if (maxUses)   payload.max_uses   = Math.max(1, parseInt(maxUses, 10));
    const data = await createInviteLink(payload);
    return data;
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(inviteUrl);
    }
  }

  async function handleShare() {
    if (!inviteUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: community.name, text: `Join ${community.name} on JUnited`, url: inviteUrl });
      } else {
        handleCopy();
      }
    } catch {}
  }

  async function handleRegenerate() {
    if (!link) return;
    setWorking(true);
    try {
      await updateInviteLink(link.id, { is_active: false });
      setLink(null);
      const fresh = await createNewLink();
      setLink(fresh);
      toast.success('New invite link generated');
    } catch {
      toast.error('Could not regenerate link');
    } finally {
      setWorking(false);
    }
  }

  if (!open) return null;

  const sheet = (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-black text-slate-900 text-[16px]">Invite {noun}</p>
            <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Share your personal invite link</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : inviteUrl ? (
          <>
            {/* Link display */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 mb-3">
              <Link2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <p className="flex-1 text-[12px] font-mono text-slate-600 truncate min-w-0 select-all">{inviteUrl}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleCopy}
                className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-2xl font-bold text-[13px] transition-all active:scale-95 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleShare}
                className="h-11 w-11 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Stats + regenerate */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold text-slate-400">
                {link.max_uses
                  ? `Used ${link.uses_count ?? 0}/${link.max_uses} times`
                  : link.uses_count === 0
                  ? 'Not used yet'
                  : `Used ${link.uses_count} time${link.uses_count !== 1 ? 's' : ''}`}
                {link.expires_at && ` · expires ${new Date(link.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </p>
              <button
                onClick={handleRegenerate}
                disabled={working}
                className="flex items-center gap-1 text-[11px] font-black text-slate-400 hover:text-slate-700 transition disabled:opacity-40"
              >
                <RefreshCw className={`h-3 w-3 ${working ? 'animate-spin' : ''}`} />
                New link
              </button>
            </div>

            {/* Advanced options disclosure */}
            <div className="border-t border-slate-100 pt-3 mt-1">
              <button
                type="button"
                onClick={() => setAdvanced((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-black text-slate-400 hover:text-slate-600 transition"
              >
                <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${showAdvanced ? 'rotate-180' : ''}`} />
                Advanced options
              </button>
              {showAdvanced && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Expiry date</label>
                    <input
                      type="date"
                      value={expiresAt}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold outline-none focus:border-blue-400"
                    />
                    {expiresAt && (
                      <button type="button" onClick={() => setExpiresAt('')} className="mt-1 text-[10px] font-semibold text-slate-400 hover:text-red-500 transition">
                        Clear
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Max uses</label>
                    <input
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Unlimited"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold outline-none focus:border-blue-400"
                    />
                  </div>
                  {(expiresAt || maxUses) && (
                    <p className="col-span-2 text-[11px] font-semibold text-blue-500 -mt-1">
                      These limits apply to your <span className="font-black">next</span> generated link — click New link above to apply.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-400 text-[13px]">
            Could not generate invite link. Please try again.
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
