import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, ImagePlus, X, Lock, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'Schools', label: 'Schools', emoji: '🏫' },
  { value: 'Shuls', label: 'Shuls', emoji: '🕍' },
  { value: 'Neighborhoods', label: 'Neighborhoods', emoji: '🏘️' },
  { value: 'Young Professionals', label: 'Young Professionals', emoji: '💼' },
  { value: 'Parenting', label: 'Parenting', emoji: '👨‍👩‍👧' },
  { value: 'Jobs', label: 'Jobs', emoji: '📋' },
  { value: 'Chessed', label: 'Chessed', emoji: '🤝' },
  { value: 'Learning & Torah', label: 'Learning', emoji: '📚' },
  { value: 'Food', label: 'Food', emoji: '🍽️' },
  { value: 'Events', label: 'Events', emoji: '🎉' },
  { value: 'Israel / Travel', label: 'Israel / Travel', emoji: '✈️' },
  { value: 'Local Interest Groups', label: 'Local Groups', emoji: '🌍' },
];

export default function CreateCommunityModal({ open, onOpenChange, currentUser, onCreated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', description: '', category: '', location: '', privacy: 'public', rules: '' });
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const reset = () => {
    setStep(1);
    setForm({ name: '', description: '', category: '', location: '', privacy: 'public', rules: '' });
    setCoverImage(null);
    setCoverPreview(null);
  };

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
    let logo_url = null;

    if (coverImage) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: coverImage });
      logo_url = file_url;
      setUploading(false);
    }

    const community = await base44.entities.Community.create({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      description_short: form.description.trim().slice(0, 120) || undefined,
      category: form.category,
      location: form.location.trim() || undefined,
      privacy: form.privacy,
      rules: form.rules.trim() || undefined,
      logo_url,
      follower_count: 1,
      created_by_user_id: currentUser?.id,
      created_by_name: currentUser?.full_name,
      is_verified: false,
    });

    // Auto-join as admin
    await base44.entities.UserCommunity.create({
      user_id: currentUser?.id,
      community_id: community.id,
      role: 'Admin',
      user_name: currentUser?.full_name,
    }).catch(() => {});

    toast.success('Community created! 🎉');
    reset();
    onOpenChange(false);
    onCreated?.();
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
          <DialogTitle className="text-[18px] font-bold text-slate-900">Create a Community</DialogTitle>
          <p className="text-[12px] text-slate-400 mt-0.5">Build a real mini-network for your group</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Cover Image */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Cover Photo</label>
            <div onClick={() => fileRef.current?.click()}
              className="relative w-full h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400 transition-colors">
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={e=>{e.stopPropagation();setCoverImage(null);setCoverPreview(null);}}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
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
            <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Community Name *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="e.g. HAFTR Alumni, Five Towns Moms…"
              className="w-full px-4 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              placeholder="What is this community about? Who should join?"
              rows={3}
              className="w-full px-4 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 resize-none" />
          </div>

          {/* Category */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 block mb-2">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => setForm(f=>({...f,category:cat.value}))}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all active:scale-95 ${
                    form.category === cat.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}>
                  <span className="text-xl">{cat.emoji}</span>
                  <span className={`text-[10px] font-semibold leading-tight ${form.category === cat.value ? 'text-blue-600' : 'text-slate-600'}`}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Location <span className="font-normal text-slate-400">(optional)</span></label>
            <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
              placeholder="e.g. Five Towns, NY · Israel · Worldwide"
              className="w-full px-4 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400" />
          </div>

          {/* Privacy */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 block mb-2">Privacy</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can join' },
                { value: 'approval', label: 'Approval Required', icon: Lock, desc: 'Admin approves members' },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} type="button" onClick={() => setForm(f=>({...f,privacy:opt.value}))}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                      form.privacy === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}>
                    <Icon className={`w-4 h-4 ${form.privacy === opt.value ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className={`text-[12px] font-bold ${form.privacy === opt.value ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</span>
                    <span className="text-[10px] text-slate-400">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Community Rules */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Community Rules <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea value={form.rules} onChange={e=>setForm(f=>({...f,rules:e.target.value}))}
              placeholder="Be respectful · No spam · Keep it Jewish-friendly…"
              rows={2}
              className="w-full px-4 py-2.5 text-[13px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 resize-none" />
          </div>

          <button type="submit" disabled={submitting || !form.name.trim() || !form.category}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ background: '#2563EB', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? (uploading ? 'Uploading…' : 'Creating…') : 'Create Community'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}