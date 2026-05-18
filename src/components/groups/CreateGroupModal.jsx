import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { dataService } from '@/services';
import { toast } from 'sonner';

const CATEGORIES = ['Torah Learning', 'Shabbat', 'Chesed', 'Events', 'Youth', 'Families', 'Seniors', 'General'];

export default function CreateGroupModal({ open, onOpenChange, currentUser, onCreated, communityId = null }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'General', location: '', is_private: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;
    setLoading(true);
    const group = await dataService.entities.CommunityGroup.create({
      ...form,
      community_id: communityId || null,
      created_by_user_id: currentUser.id,
      created_by_name: currentUser.full_name,
      member_count: 1
    });
    // Auto-join as admin
    await dataService.entities.GroupMember.create({
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
      <DialogContent className="w-[calc(100%-24px)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl max-w-sm">
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
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wide">Privacy</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_private: false }))}
                className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                  !form.is_private ? 'border-[#2563EB] bg-blue-50' : 'border-[#e2e8f0] bg-white'
                }`}
              >
                <span className="text-[18px] mb-1">🌍</span>
                <span className="text-[13px] font-bold text-slate-800">Public</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Anyone can join instantly</span>
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_private: true }))}
                className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                  form.is_private ? 'border-[#2563EB] bg-blue-50' : 'border-[#e2e8f0] bg-white'
                }`}
              >
                <span className="text-[18px] mb-1">🔒</span>
                <span className="text-[13px] font-bold text-slate-800">Private</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Requires approval to join</span>
              </button>
            </div>
          </div>
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
