import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, ImagePlus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORIES = ['School', 'Shul', 'Sports', 'Travel', 'Business', 'Learning', 'Social', 'Other'];

const CATEGORY_EMOJIS = {
  School: '🏫', Shul: '🕍', Sports: '⚽', Travel: '✈️',
  Business: '💼', Learning: '📚', Social: '🎉', Other: '🌍',
};

export default function CreateCommunityModal({ open, onOpenChange, currentUser, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', category: '', location: '' });
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Community name is required');
    if (!form.category) return toast.error('Please select a category');

    setSubmitting(true);
    let cover_image_url = null;

    if (coverImage) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: coverImage });
      cover_image_url = file_url;
      setUploading(false);
    }

    await base44.entities.CommunityGroup.create({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim() || undefined,
      cover_image_url,
      created_by_user_id: currentUser.id,
      created_by_name: currentUser.full_name,
      member_count: 1,
    });

    await base44.entities.GroupMember.create({
      group_id: undefined, // will be filled after creation — handled via onCreated refetch
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      role: 'admin',
    });

    toast.success('Community created!');
    setForm({ name: '', description: '', category: '', location: '' });
    setCoverImage(null);
    setCoverPreview(null);
    setSubmitting(false);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-[18px] font-bold text-slate-900">Create a Community</DialogTitle>
          <p className="text-[13px] text-slate-400 mt-0.5">Start a group for Jewish interests worldwide</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-4 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Cover Image */}
          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Cover Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full h-32 rounded-[14px] border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#2563EB] transition-colors"
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setCoverImage(null); setCoverPreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[12px] font-medium">Add cover photo</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>

          {/* Name */}
          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Community Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Jewish Entrepreneurs"
              className="w-full px-4 py-3 text-[14px] bg-slate-50 border border-slate-200 rounded-[12px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this community about?"
              rows={3}
              className="w-full px-4 py-3 text-[14px] bg-slate-50 border border-slate-200 rounded-[12px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-2">Category *</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-[10px] border text-center transition-all ${
                    form.category === cat
                      ? 'border-[#2563EB] bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg">{CATEGORY_EMOJIS[cat]}</span>
                  <span className={`text-[10px] font-semibold leading-tight ${form.category === cat ? 'text-[#2563EB]' : 'text-slate-600'}`}>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">
              Location <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="e.g. New York, Israel, Worldwide"
              className="w-full px-4 py-3 text-[14px] bg-slate-50 border border-slate-200 rounded-[12px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-white text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-60"
            style={{ background: '#2563EB', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? (uploading ? 'Uploading image…' : 'Creating…') : 'Create Community'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}