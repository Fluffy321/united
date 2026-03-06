import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORIES = ['Torah Learning', 'Shabbat', 'Chesed', 'Events', 'Youth', 'Families', 'Seniors', 'General'];

export default function CreateGroupModal({ open, onOpenChange, currentUser, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'General', location: '', is_private: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;
    setLoading(true);
    const group = await base44.entities.CommunityGroup.create({
      ...form,
      created_by_user_id: currentUser.id,
      created_by_name: currentUser.full_name,
      member_count: 1
    });
    // Auto-join as admin
    await base44.entities.GroupMember.create({
      group_id: group.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      role: 'admin'
    });
    setLoading(false);
    toast.success('Group created!');
    setForm({ name: '', description: '', category: 'General', location: '', is_private: false });
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold">Create a Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wide">Name</label>
            <input
              className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#2563eb]"
              placeholder="e.g. Five Towns Basketball"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wide">Description</label>
            <textarea
              className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#2563eb] resize-none"
              placeholder="What is this group about?"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wide">Category</label>
            <select
              className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[14px] outline-none bg-white"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wide">Location <span className="normal-case font-normal text-[#94a3b8]">(optional)</span></label>
            <input
              className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#2563eb]"
              placeholder="e.g. Cedarhurst, Miami, Worldwide"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_private}
              onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))}
              className="rounded"
            />
            Private group (invite only)
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-[14px] transition-all active:scale-95"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? 'Creating…' : 'Create Group'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}