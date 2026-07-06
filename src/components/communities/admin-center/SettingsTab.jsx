import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X, Loader2, Save, CheckCircle2, Trash2, AlertTriangle, Image, Lock, Globe, Upload,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { dataService } from '@/services';
import { notificationsService } from '@/services/notificationsService';
import { COMMUNITY_TYPE_OPTIONS, getCommunityTypeKey } from '@/lib/communityTypes';
import { isCommunityPremium } from '@/lib/communityPlans';
import { updateCommunity } from '@/services/entityServices';
import { SETTINGS_SECTIONS, MODULE_CONFIG, PRIVACY_OPTIONS, SectionHeader, Avatar, RoleBadge } from './shared';

export default function SettingsTab({ communityId, community, currentUser, onCommunityUpdated, onClose, onDeleted }) {
  const [section, setSection] = useState('profile');
  const settings = useMemo(
    () => (community?.settings && typeof community.settings === 'object' ? community.settings : {}),
    [community?.settings]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {SETTINGS_SECTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${
              section === key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'profile' && (
        <ProfileSection
          communityId={communityId}
          community={community}
          settings={settings}
          onCommunityUpdated={onCommunityUpdated}
          onClose={onClose}
          currentUser={currentUser}
          onDeleted={onDeleted}
        />
      )}
      {section === 'appearance' && (
        <AppearanceSection
          communityId={communityId}
          community={community}
          onCommunityUpdated={onCommunityUpdated}
        />
      )}
      {section === 'modules' && (
        <ModulesSection
          communityId={communityId}
          community={community}
          onCommunityUpdated={onCommunityUpdated}
        />
      )}
      {section === 'permissions' && (
        <PermissionsSection
          communityId={communityId}
          community={community}
          onCommunityUpdated={onCommunityUpdated}
        />
      )}
    </div>
  );
}

function ProfileSection({ communityId, community, settings, onCommunityUpdated, onClose, currentUser, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name:        community?.name || '',
    description: community?.description || community?.description_short || '',
    location:    community?.location || community?.neighborhood || '',
    category:    community?.category || COMMUNITY_TYPE_OPTIONS[0]?.label || 'Community',
    privacy:     community?.privacy || 'Public',
    welcomeMessage: settings.welcome_message || community?.welcome_message || '',
    rulesText:   Array.isArray(settings.rules) ? settings.rules.join('\n') : (settings.rules || community?.rules || ''),
  }));

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    const name        = form.name.trim();
    const description = form.description.trim();
    if (name.length < 2)        { toast.error('Community name is required.'); return; }
    if (description.length < 8) { toast.error('Add a short description.'); return; }

    const typeKey = getCommunityTypeKey({ category: form.category });
    const rules   = form.rulesText.split('\n').map(r => r.trim()).filter(Boolean);

    setSaving(true);
    try {
      const updated = await updateCommunity(communityId, {
        name,
        description,
        description_short: description,
        location:    form.location.trim() || null,
        neighborhood: form.location.trim() || null,
        category:    form.category,
        type:        typeKey,
        template_key: typeKey,
        privacy:     form.privacy,
        settings:    { ...settings, rules, welcome_message: form.welcomeMessage.trim() || null },
      });
      toast.success('Community updated');
      onCommunityUpdated?.(updated);
    } catch (err) {
      toast.error(err?.message || 'Could not update community');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {[
        { field: 'name', label: 'Community name', type: 'input' },
        { field: 'description', label: 'Description', type: 'textarea', rows: 4 },
      ].map(({ field, label, type, rows }) => (
        <label key={field} className="block">
          <span className="mb-1.5 block text-[13px] font-black text-slate-700">{label}</span>
          {type === 'textarea' ? (
            <textarea
              value={form[field]}
              onChange={e => setField(field, e.target.value)}
              rows={rows}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          ) : (
            <input
              value={form[field]}
              onChange={e => setField(field, e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          )}
        </label>
      ))}

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-black text-slate-700">Welcome message</span>
        <textarea
          value={form.welcomeMessage}
          onChange={e => setField('welcomeMessage', e.target.value)}
          rows={3}
          placeholder="A short welcome note that appears at the top of your community home."
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-black text-slate-700">Type</span>
          <select
            value={form.category}
            onChange={e => setField('category', e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
          >
            {COMMUNITY_TYPE_OPTIONS.map(o => (
              <option key={o.key} value={o.label}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-black text-slate-700">Privacy</span>
          <select
            value={form.privacy}
            onChange={e => setField('privacy', e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
          >
            {PRIVACY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-black text-slate-700">Location / neighborhood</span>
        <input
          value={form.location}
          onChange={e => setField('location', e.target.value)}
          placeholder="Five Towns, Cedarhurst…"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-black text-slate-700">Rules</span>
        <textarea
          value={form.rulesText}
          onChange={e => setField('rulesText', e.target.value)}
          rows={5}
          placeholder="One rule per line"
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
        />
      </label>

      <div className="pt-2 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <DangerZone
        communityId={communityId}
        community={community}
        currentUser={currentUser}
        onDeleted={onDeleted}
      />
    </div>
  );
}

function AppearanceSection({ communityId, community, onCommunityUpdated }) {
  const [coverFile, setCoverFile]     = useState(null);
  const [coverPreview, setCoverPreview] = useState(community?.cover_url || null);
  const [logoFile, setLogoFile]       = useState(null);
  const [logoPreview, setLogoPreview] = useState(community?.logo_url || null);
  const [saving, setSaving]           = useState(false);

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!coverFile && !logoFile) { toast.info('No changes to save'); return; }
    setSaving(true);
    try {
      const updates = {};
      if (coverFile) {
        const result = await dataService.integrations.Core.UploadFile({ file: coverFile, bucket: 'community-images' });
        updates.cover_url = typeof result === 'string' ? result : (result?.url || result?.publicUrl);
      }
      if (logoFile) {
        const result = await dataService.integrations.Core.UploadFile({ file: logoFile, bucket: 'community-images' });
        updates.logo_url = typeof result === 'string' ? result : (result?.url || result?.publicUrl);
      }
      const updated = await updateCommunity(communityId, updates);
      toast.success('Appearance updated');
      onCommunityUpdated?.(updated);
      setCoverFile(null);
      setLogoFile(null);
    } catch (err) {
      toast.error(err?.message || 'Could not update appearance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Cover photo" />
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-800 relative" style={{ aspectRatio: '3/1' }}>
          {coverPreview && (
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
          )}
          <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-colors group">
            <div className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Image className="h-5 w-5 text-slate-700" />
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={handleCoverChange} />
          </label>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">Recommended: 1200×400px. Click to change.</p>
      </div>

      <div>
        <SectionHeader title="Community logo" />
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden flex-shrink-0 relative">
            {logoPreview && (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            )}
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors group">
              <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <input type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
            </label>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-700">Community logo</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Square image, min 200×200px.<br />Click to upload.</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || (!coverFile && !logoFile)}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save appearance'}
      </button>
    </div>
  );
}

function ModulesSection({ communityId, community, onCommunityUpdated }) {
  const premiumActive = isCommunityPremium(community);
  const [flags, setFlags] = useState({
    allow_member_events:   Boolean(community?.allow_member_events),
    allow_resources:       Boolean(community?.allow_resources),
    allow_forms:           Boolean(community?.allow_forms),
    allow_member_listings: Boolean(community?.allow_member_listings),
    allow_group_chat:      Boolean(community?.allow_group_chat),
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    const moduleConfig = MODULE_CONFIG.find((module) => module.key === key);
    if (moduleConfig?.premium && !premiumActive && !flags[key]) {
      toast.info('Upgrade to Premium to enable this module.');
      return;
    }
    setFlags(f => ({ ...f, [key]: !f[key] }));
  };

  const handleSave = async () => {
    if (!premiumActive && MODULE_CONFIG.some(({ key, premium }) => premium && flags[key])) {
      toast.info('Premium modules need an active community plan.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateCommunity(communityId, flags);
      toast.success('Modules updated');
      onCommunityUpdated?.(updated);
    } catch (err) {
      toast.error(err?.message || 'Could not update modules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!premiumActive && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-[13px] font-black text-blue-900">Free includes limited events and resources</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-5 text-blue-700">
            Free communities can run up to 3 upcoming events and share up to 10 resources. Marketplace unlocks after upgrading in Billing.
          </p>
        </div>
      )}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[14px] font-bold text-slate-900">Posts</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Community discussion feed — always enabled</p>
          </div>
          <div className="w-11 h-6 rounded-full bg-blue-600 flex items-center justify-end px-0.5 flex-shrink-0 opacity-50 cursor-not-allowed">
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </div>
        </div>
        {MODULE_CONFIG.map(({ key, label, description, premium }, idx) => {
          const locked = premium && !premiumActive;
          return (
          <div
            key={key}
            className={`px-4 py-3.5 flex items-center justify-between ${idx < MODULE_CONFIG.length - 1 ? 'border-b border-slate-100' : ''} ${locked ? 'bg-slate-50/70' : ''}`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900">
                {label}
                {premium && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700">
                    Premium
                  </span>
                )}
              </p>
              <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={locked && !flags[key]}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                flags[key] ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
              }`}
              aria-checked={flags[key]}
              role="switch"
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save modules'}
      </button>
    </div>
  );
}

function PermissionsSection({ communityId, community, onCommunityUpdated }) {
  const [postingMode, setPostingMode] = useState(community?.posting_mode || 'open');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateCommunity(communityId, { posting_mode: postingMode });
      toast.success('Permissions updated');
      onCommunityUpdated?.(updated);
    } catch (err) {
      toast.error(err?.message || 'Could not update permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Who can post?" />
      <div className="space-y-2">
        {[
          {
            value: 'open',
            label: 'All members',
            description: 'Any member can create posts in this community',
            Icon: Globe,
          },
          {
            value: 'admin_only',
            label: 'Admins & mods only',
            description: 'Only admins and moderators can post — ideal for announcement-only communities',
            Icon: Lock,
          },
        ].map(({ value, label, description, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPostingMode(value)}
            className={`w-full text-left rounded-2xl border px-4 py-3.5 flex items-start gap-3 transition-colors ${
              postingMode === value
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              postingMode === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] font-bold ${postingMode === value ? 'text-blue-900' : 'text-slate-900'}`}>{label}</p>
              <p className={`text-[12px] mt-0.5 leading-relaxed ${postingMode === value ? 'text-blue-700' : 'text-slate-400'}`}>{description}</p>
            </div>
            <div className={`mt-1 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              postingMode === value ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
            }`}>
              {postingMode === value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save permissions'}
      </button>
    </div>
  );
}

// ─── Danger Zone (delete community) ──────────────────────────────────────────

function DangerZone({ communityId, community, currentUser, onDeleted }) {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: pendingRequest = null } = useQuery({
    queryKey: ['deletion-request', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_deletion_requests')
        .select('id, initiated_by, status, total_admins, created_at, initiator:initiated_by(display_name)')
        .eq('community_id', communityId)
        .eq('status', 'pending')
        .maybeSingle();
      return data;
    },
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['community-admins-for-deletion', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_memberships')
        .select('user_id, role, profile:user_id(display_name, avatar_url)')
        .eq('community_id', communityId)
        .eq('status', 'active')
        .in('role', ['owner', 'admin']);
      return data ?? [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['deletion-request', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-admins-for-deletion', communityId] });
  };

  return (
    <div className="mt-8 pt-6 border-t border-red-100">
      <p className="text-[12px] font-black text-red-500 uppercase tracking-widest mb-3">Danger Zone</p>

      {pendingRequest ? (
        <DeletionVoteBanner
          request={pendingRequest}
          admins={admins}
          communityId={communityId}
          currentUser={currentUser}
          onDeleted={onDeleted}
          onCancelled={invalidate}
        />
      ) : (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-[13px] font-black text-red-800 mb-1">Delete this community</p>
          <p className="text-[12px] text-red-600 mb-3 leading-relaxed">
            Permanently removes all content, posts, and memberships.
            {admins.length > 1
              ? ` All ${admins.length} admins must vote to approve.`
              : ' This action cannot be undone.'}
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[13px] font-black text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Community
          </button>
        </div>
      )}

      {showDeleteModal && (
        <DeleteCommunityModal
          community={community}
          currentUser={currentUser}
          admins={admins}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={onDeleted}
          onVoteInitiated={() => {
            setShowDeleteModal(false);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

// ─── Delete community modal ───────────────────────────────────────────────────

function DeleteCommunityModal({ community, currentUser, admins, onClose, onDeleted, onVoteInitiated }) {
  const isMultiAdmin = admins.length > 1;
  const [step, setStep]               = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const handleConfirm = async () => {
    if (!isMultiAdmin && confirmText !== community.name) {
      toast.error('Community name does not match.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('initiate_community_deletion', {
        p_community_id: community.id,
      });
      if (error) throw error;

      if (data.status === 'deleted') {
        toast.success('Community permanently deleted.');
        onDeleted?.();
      } else if (data.status === 'pending') {
        // Notify other admins about the vote
        const otherAdmins = admins.filter(a => a.user_id !== currentUser.id);
        const initiatorName = currentUser.display_name || currentUser.full_name || currentUser.user_name || 'An admin';
        await Promise.allSettled(
          otherAdmins.map(a =>
            notificationsService.notifyDeletionVoteStarted({
              recipientId:   a.user_id,
              initiatorId:   currentUser.id,
              initiatorName,
              communityId:   community.id,
              communityName: community.name,
              requestId:     data.request_id,
            })
          )
        );
        toast.success(`Deletion vote started. All ${data.total_admins} admins must approve.`);
        onVoteInitiated?.();
      }
    } catch (err) {
      toast.error(err.message || 'Could not initiate deletion');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end bg-slate-950/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
              Delete Community
            </p>
            <h2 className="mt-2 text-[18px] font-black text-slate-950">
              {step === 1 ? `Delete "${community.name}"?` : isMultiAdmin ? 'Start deletion vote' : 'Confirm deletion'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {step === 1 ? (
            <>
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-2">
                <p className="text-[13px] font-black text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  This action is permanent and irreversible
                </p>
                <ul className="space-y-1.5 text-[12px] font-semibold text-red-700 pl-1">
                  <li>• All posts and content will be permanently deleted</li>
                  <li>• All members will immediately lose access</li>
                  <li>• Invite links and community URLs will stop working</li>
                  <li>• This cannot be undone by anyone, including support</li>
                </ul>
              </div>
              {isMultiAdmin && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <p className="text-[12px] font-semibold text-blue-700">
                    This community has <strong>{admins.length} admins</strong>. A deletion vote will
                    be started — the community is only deleted once <strong>every admin approves</strong>.
                    Any admin can cancel the vote at any time.
                  </p>
                </div>
              )}
            </>
          ) : isMultiAdmin ? (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-slate-600">
                The following admins will each need to approve before deletion proceeds:
              </p>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                {admins.map((a, i) => (
                  <div
                    key={a.user_id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < admins.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <Avatar name={a.profile?.display_name || 'Admin'} size={30} />
                    <p className="flex-1 text-[13px] font-semibold text-slate-800">
                      {a.profile?.display_name || 'Admin'}
                    </p>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={a.role} />
                      {a.user_id === currentUser.id && (
                        <span className="text-[11px] text-slate-400">(you)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-slate-600">
                Type <strong className="text-slate-900">{community.name}</strong> to confirm:
              </p>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={community.name}
                autoFocus
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white"
              />
              {confirmText.length > 0 && confirmText !== community.name && (
                <p className="text-[12px] text-red-500 font-semibold">Name does not match.</p>
              )}
            </div>
          )}
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          {step === 1 ? (
            <>
              <button type="button" onClick={onClose}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600">
                Cancel
              </button>
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-2xl bg-red-600 text-sm font-black text-white hover:bg-red-700">
                I understand, continue
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setStep(1)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600">
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting || (!isMultiAdmin && confirmText !== community.name)}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white disabled:opacity-50 hover:bg-red-700"
              >
                {submitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
                {submitting
                  ? 'Processing…'
                  : isMultiAdmin
                  ? 'Start Deletion Vote'
                  : 'Permanently Delete'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ─── Deletion vote banner (shown inside DangerZone when a vote is pending) ────

function DeletionVoteBanner({ request, admins, currentUser, onDeleted, onCancelled }) {
  const queryClient = useQueryClient();
  const [voting, setVoting] = useState(false);

  const { data: votes = [] } = useQuery({
    queryKey: ['deletion-votes', request.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_deletion_votes')
        .select('admin_user_id, vote, voted_at')
        .eq('request_id', request.id);
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  const yesVotes      = votes.filter(v => v.vote === true);
  const myVote        = votes.find(v => v.admin_user_id === currentUser?.id);
  const iHaveVotedYes = myVote?.vote === true;
  const isInitiator   = request.initiated_by === currentUser?.id;
  const initiatorName = request.initiator?.display_name || 'An admin';
  const remaining     = request.total_admins - yesVotes.length;

  const handleVote = async (voteYes) => {
    setVoting(true);
    try {
      const { data, error } = await supabase.rpc('vote_on_community_deletion', {
        p_request_id: request.id,
        p_vote:       voteYes,
      });
      if (error) throw error;

      if (data.status === 'deleted') {
        toast.success('All admins approved. Community permanently deleted.');
        onDeleted?.();
      } else if (data.status === 'cancelled') {
        toast.success('Deletion vote cancelled.');
        onCancelled?.();
      } else {
        queryClient.invalidateQueries({ queryKey: ['deletion-votes', request.id] });
        toast.success(voteYes ? `Approved — waiting for ${remaining - 1} more.` : 'Vote recorded.');
      }
    } catch (err) {
      toast.error(err.message || 'Could not register vote');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Trash2 className="h-4 w-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-red-800">Deletion vote in progress</p>
          <p className="text-[12px] text-red-600 mt-0.5">
            {isInitiator ? 'You initiated' : `${initiatorName} initiated`} a vote to permanently delete this community.
            {' '}<strong>{yesVotes.length} of {request.total_admins}</strong> admins have approved.
          </p>
        </div>
      </div>

      {/* Per-admin vote status */}
      {admins.length > 0 && (
        <div className="rounded-xl bg-white border border-red-100 overflow-hidden">
          {admins.map((a, i) => {
            const voted = votes.find(v => v.admin_user_id === a.user_id);
            const approvedByThisAdmin = voted?.vote === true;
            return (
              <div
                key={a.user_id}
                className={`flex items-center gap-3 px-3 py-2.5 ${i < admins.length - 1 ? 'border-b border-red-50' : ''}`}
              >
                <Avatar name={a.profile?.display_name || 'Admin'} size={26} />
                <p className="flex-1 text-[13px] font-semibold text-slate-700 truncate">
                  {a.profile?.display_name || 'Admin'}
                  {a.user_id === currentUser?.id && (
                    <span className="ml-1.5 text-[11px] text-slate-400">(you)</span>
                  )}
                </p>
                {approvedByThisAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Approved
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">Pending</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      {!iHaveVotedYes ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleVote(false)}
            disabled={voting}
            className="flex-1 h-9 rounded-xl border border-red-200 bg-white text-[13px] font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Vote
          </button>
          <button
            type="button"
            onClick={() => handleVote(true)}
            disabled={voting}
            className="flex-1 h-9 rounded-xl bg-red-600 text-[13px] font-black text-white hover:bg-red-700 disabled:opacity-50"
          >
            {voting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
              : 'Approve Deletion'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleVote(false)}
            disabled={voting}
            className="h-9 rounded-xl border border-red-200 bg-white px-4 text-[13px] font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Vote
          </button>
          <p className="flex-1 text-[12px] font-semibold text-slate-500 text-center">
            {remaining > 0
              ? `Waiting for ${remaining} more admin${remaining !== 1 ? 's' : ''}…`
              : 'All admins approved — deleting…'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Remove member modal ──────────────────────────────────────────────────────

