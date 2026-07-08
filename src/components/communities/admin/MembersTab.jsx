import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X, Search, Loader2, UserMinus, UserCheck, UserPlus, Crown, Shield, ShieldCheck,
  MoreVertical, Users, Tag,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { notificationsService } from '@/services/notificationsService';
import CommunityInviteModal from '../CommunityInviteModal';
import {
  Avatar, RoleBadge, EmptyState, SectionHeader, fmtDate, isPublicCommunity,
  PUBLIC_REMOVAL_REASONS, PRIVATE_REMOVAL_REASONS,
} from './shared';

// ─── Members tab ──────────────────────────────────────────────────────────────

export default function MembersTab({ communityId, community, currentUser }) {
  const queryClient = useQueryClient();
  const [search, setSearch]               = useState('');
  const [removingMember, setRemoving]     = useState(null);
  const [roleMenuOpen, setRoleMenuOpen]   = useState(null);
  const [showInviteModal, setShowInvite]  = useState(false);
  // contact title inline edit: memberId → draft title string (null = not editing)
  const [editingTitle, setEditingTitle]   = useState(null);
  const [titleDraft, setTitleDraft]       = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin-members', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_memberships')
        .select('id, user_id, role, status, user_name, joined_at, created_at, contact_title, contact_order, profile:user_id(id, display_name, avatar_url)')
        .eq('community_id', communityId).eq('status', 'active')
        .order('joined_at', { ascending: true });
      return data ?? [];
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      const { data, error } = await supabase.rpc('update_community_member_role', {
        p_community_id: communityId,
        p_user_id: userId,
        p_new_role: newRole,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { newRole }) => {
      toast.success(`Role updated to ${newRole}`);
      queryClient.invalidateQueries({ queryKey: ['admin-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['admin-ov-admins', communityId] });
      setRoleMenuOpen(null);
    },
    onError: (err) => toast.error(err.message || 'Could not update role'),
  });

  const contactTitleMutation = useMutation({
    mutationFn: async ({ userId, title }) => {
      const { error } = await supabase.rpc('set_member_contact_title', {
        p_community_id: communityId,
        p_user_id: userId,
        p_title: title || null,
        p_order: 0,
      });
      if (error) throw error;
    },
    onSuccess: (_, { title }) => {
      toast.success(title ? `Contact title set to "${title}"` : 'Contact title removed');
      queryClient.invalidateQueries({ queryKey: ['admin-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      setEditingTitle(null);
    },
    onError: (err) => toast.error(err.message || 'Could not save contact title'),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return members;
    return members.filter(m => {
      const name = String(m.profile?.display_name || m.user_name || '').toLowerCase();
      return name.includes(q);
    });
  }, [members, search]);

  const isOwner = (m) => m.user_id === community?.created_by_user_id;
  const isSelf  = (m) => m.user_id === currentUser?.id;

  // Close role menu on outside click
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-role-menu]')) setRoleMenuOpen(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {/* Invite button */}
      <button
        type="button"
        onClick={() => setShowInvite(true)}
        className="flex w-full items-center justify-center gap-2 h-10 rounded-2xl bg-slate-950 text-white font-bold text-[13px] active:scale-95 transition-all hover:bg-slate-800"
      >
        <UserPlus className="h-4 w-4" />
        Invite Members
      </button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-blue-400"
        />
      </div>

      <SectionHeader title={`${filtered.length} member${filtered.length !== 1 ? 's' : ''}`} />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No members found" body="Try a different search term." />
      ) : (
        <div className="space-y-2">
          {filtered.map(m => {
            const name  = m.profile?.display_name || m.user_name || 'Member';
            const role  = String(m.role || 'member').toLowerCase();
            const owner = isOwner(m);
            const self  = isSelf(m);
            const canAct = !owner && !self;

            const isEditingTitle = editingTitle === m.id;

            return (
              <div key={m.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3">
                  <Avatar name={name} size={38} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-slate-900 truncate">{name}</p>
                      {owner && <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                      {self && <span className="text-[11px] text-slate-400">(you)</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <RoleBadge role={role} />
                      {m.contact_title && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-800">
                          <Tag className="h-2.5 w-2.5" />
                          {m.contact_title}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        Joined {fmtDate(m.joined_at || m.created_at)}
                      </span>
                    </div>
                  </div>

                  {canAct && (
                    <div className="relative flex-shrink-0" data-role-menu>
                      <button
                        type="button"
                        onClick={() => setRoleMenuOpen(roleMenuOpen === m.id ? null : m.id)}
                        className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                        aria-label="Member actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {roleMenuOpen === m.id && (
                        <div className="absolute right-0 top-9 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl w-52 py-1.5 overflow-hidden">
                          {[
                            { label: 'Promote to Admin',     role: 'admin',     disabled: role === 'admin', Icon: ShieldCheck },
                            { label: 'Promote to Moderator', role: 'moderator', disabled: role === 'moderator', Icon: Shield },
                            { label: 'Demote to Member',     role: 'member',    disabled: role === 'member', Icon: UserCheck },
                          ].map(action => (
                            <button
                              key={action.role}
                              type="button"
                              disabled={action.disabled || roleChangeMutation.isPending}
                              onClick={() => roleChangeMutation.mutate({ userId: m.user_id, newRole: action.role })}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <action.Icon className="h-4 w-4 text-slate-400" />
                              {action.label}
                            </button>
                          ))}
                          <div className="mx-3 my-1 h-px bg-slate-100" />
                          <button
                            type="button"
                            onClick={() => {
                              setRoleMenuOpen(null);
                              setEditingTitle(m.id);
                              setTitleDraft(m.contact_title ?? '');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Tag className="h-4 w-4 text-slate-400" />
                            {m.contact_title ? 'Edit contact title' : 'Set contact title'}
                          </button>
                          <div className="mx-3 my-1 h-px bg-slate-100" />
                          <button
                            type="button"
                            onClick={() => { setRoleMenuOpen(null); setRemoving(m); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4" />
                            Remove from community
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline contact title editor */}
                {isEditingTitle && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                      Contact title (e.g. Rabbi, President, Volunteer Coordinator)
                    </p>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') contactTitleMutation.mutate({ userId: m.user_id, title: titleDraft.trim() });
                          if (e.key === 'Escape') setEditingTitle(null);
                        }}
                        placeholder="Enter title or leave blank to clear"
                        maxLength={60}
                        className="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        disabled={contactTitleMutation.isPending}
                        onClick={() => contactTitleMutation.mutate({ userId: m.user_id, title: titleDraft.trim() })}
                        className="h-9 px-3 rounded-xl bg-slate-950 text-white text-[12px] font-bold disabled:opacity-50"
                      >
                        {contactTitleMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTitle(null)}
                        className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {m.contact_title && (
                      <button
                        type="button"
                        onClick={() => contactTitleMutation.mutate({ userId: m.user_id, title: '' })}
                        className="mt-2 text-[11px] font-semibold text-red-600 hover:underline"
                      >
                        Remove title
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {removingMember && (
        <RemoveMemberModal
          member={removingMember}
          community={community}
          currentUser={currentUser}
          onClose={() => setRemoving(null)}
          onRemoved={() => {
            setRemoving(null);
            queryClient.invalidateQueries({ queryKey: ['admin-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['admin-ov-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
          }}
        />
      )}

      <CommunityInviteModal
        open={showInviteModal}
        onClose={() => setShowInvite(false)}
        community={community}
        currentUser={currentUser}
      />
    </div>
  );
}

// ─── Remove member modal ──────────────────────────────────────────────────────

function RemoveMemberModal({ member, community, currentUser, onClose, onRemoved }) {
  const isPublic    = isPublicCommunity(community);
  const reasons     = isPublic ? PUBLIC_REMOVAL_REASONS : PRIVATE_REMOVAL_REASONS;
  const [reasonCode, setReasonCode]   = useState('');
  const [reasonNote, setReasonNote]   = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const name = member.profile?.display_name || member.user_name || 'this member';

  const handleRemove = async () => {
    if (!reasonCode) { toast.error('Select a removal reason.'); return; }
    if (reasonCode === 'other' && isPublic && !reasonNote.trim()) {
      toast.error('A written explanation is required for "Other".'); return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('remove_community_member', {
        p_community_id: community.id,
        p_user_id:      member.user_id,
        p_reason_code:  reasonCode,
        p_reason_note:  reasonNote.trim() || null,
      });
      if (error) throw error;

      // Notify removed user
      try {
        await notificationsService.notifyMemberRemoved({
          removedUserId: member.user_id,
          adminId:       currentUser.id,
          communityName: community.name,
          communityId:   community.id,
          removalId:     data?.removal_id,
        });
      } catch { /* notification failure is non-fatal */ }

      toast.success(`${name} was removed from the community.`);
      onRemoved();
    } catch (err) {
      toast.error(err.message || 'Could not remove member');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-700">
                <UserMinus className="h-3.5 w-3.5" />
                Remove member
              </p>
              <h2 className="mt-2 text-[18px] font-black text-slate-950">Remove {name}?</h2>
              {isPublic && (
                <p className="mt-1 text-[12px] font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 mt-2">
                  This is a public community — a valid reason is required and the member can appeal.
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-[13px] font-black text-slate-700 mb-2">
              {isPublic ? 'Removal reason (required)' : 'Removal reason'}
            </p>
            <div className="space-y-2">
              {reasons.map(r => (
                <label key={r.code} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.code}
                    checked={reasonCode === r.code}
                    onChange={() => setReasonCode(r.code)}
                    className="mt-0.5 accent-blue-600"
                  />
                  <span className="text-[13px] font-semibold text-slate-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[13px] font-black text-slate-700 mb-1.5 block">
              Admin note
              {isPublic && reasonCode === 'other' ? ' (required)' : ' (optional)'}
            </span>
            <textarea
              value={reasonNote}
              onChange={e => setReasonNote(e.target.value)}
              rows={3}
              placeholder="Add context for your records…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={submitting || (!reasonCode && isPublic)}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
            {submitting ? 'Removing…' : 'Remove member'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
