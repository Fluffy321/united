import React, { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Plus, ImagePlus, X, Lock, Globe, Check, Sparkles, ChevronRight } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'School', label: 'School', emoji: '🏫' },
  { value: 'Shul', label: 'Shul', emoji: '🕍' },
  { value: 'Neighborhood', label: 'Neighborhood', emoji: '🏘️' },
  { value: 'Food', label: 'Food', emoji: '🍽️' },
  { value: 'Jobs', label: 'Jobs', emoji: '💼' },
  { value: 'Chessed', label: 'Chessed', emoji: '🤝' },
  { value: 'Learning', label: 'Learning', emoji: '📚' },
  { value: 'Social', label: 'Social', emoji: '🎉' },
  { value: 'Sports', label: 'Sports', emoji: '🏀' },
  { value: 'Travel', label: 'Travel', emoji: '✈️' },
  { value: 'Youth', label: 'Youth', emoji: '🧒' },
  { value: 'Other', label: 'Other', emoji: '🌐' },
];

const FIRST_POST_SUGGESTIONS = {
  School:       ['Welcome HAFTR families! This is your place for carpools, homework help, and school events.', 'Kicking off our parent community — drop a hello and tell us your child\'s grade!'],
  Shul:         ['Welcome to our community page! Shabbos times, events, and updates will be posted here.', 'Excited to launch this space for our shul. Let\'s keep connected!'],
  Neighborhood: ['Welcome neighbors! Post local updates, recommendations, and anything happening nearby.', 'This is your go-to for everything in our neighborhood. Say hello!'],
  Food:         ['Share your favorite spots, recipes, and food finds here. What\'s everyone craving?', 'Welcome to the foodie community! Drop your top kosher restaurant recommendation below.'],
  Jobs:         ['Post job openings, resumes, and networking opportunities here. Let\'s help each other!', 'Welcome! This is a great place to share career opportunities and connect professionally.'],
  Chessed:      ['Welcome! If you need help or want to offer it — this is the place. No ask is too small.', 'Let\'s build a culture of giving here. Post your needs or offers anytime!'],
  Learning:     ['Welcome to the learning community! Share shiurim, articles, and Torah discussions.', 'Let\'s learn together. Drop a dvar Torah or a shiur recommendation to get started!'],
  Social:       ['Welcome everyone! This is your space to connect, plan hangouts, and meet new people.', 'So excited to kick this off! Introduce yourself below 👋'],
  Sports:       ['Game time! Use this space to organize leagues, find players, and share scores.', 'Welcome to the crew! Who\'s up for a game this week?'],
  Travel:       ['Welcome travelers! Share tips, deals, and trip recommendations here.', 'Where is everyone heading? Drop your travel plans and let\'s connect!'],
  Youth:        ['Welcome parents and youth leaders! Share programs, events, and opportunities here.', 'This is your hub for everything youth-related. Let\'s get the kids engaged!'],
  Other:        ['Welcome to the community! Introduce yourself and tell us what you\'re hoping to connect on.', 'Excited to start this community. Say hello and let\'s get to know each other!'],
};

export default function CreateCommunityModal({ open, onOpenChange, currentUser, onCreated }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = first post prompt
  const [form, setForm] = useState({ name: '', description: '', category: '', location: '', privacy: 'public' });
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdCommunity, setCreatedCommunity] = useState(null);
  const [firstPostBody, setFirstPostBody] = useState('');
  const [postingFirst, setPostingFirst] = useState(false);
  const fileRef = useRef();

  const reset = () => {
    setStep(1);
    setForm({ name: '', description: '', category: '', location: '', privacy: 'public' });
    setCoverImage(null);
    setCoverPreview(null);
    setCreatedCommunity(null);
    setFirstPostBody('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Community name is required');
    if (!form.category) return toast.error('Please select a category');

    setSubmitting(true);
    try {
      let logo_url = null;

      if (coverImage) {
        setUploading(true);
        const { file_url } = await dataService.integrations.Core.UploadFile({ file: coverImage });
        logo_url = file_url;
        setUploading(false);
      }

      const community = await dataService.entities.Community.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        description_short: form.description.trim().slice(0, 120) || undefined,
        category: form.category,
        type: form.category,
        location: form.location.trim() || 'Five Towns',
        neighborhood: form.location.trim() || 'Five Towns',
        privacy: form.privacy,
        logo_url,
        follower_count: 1,
        post_count: 0,
        created_by_user_id: currentUser?.id,
        created_by_name: currentUser?.full_name || currentUser?.display_name,
        is_verified: false,
        is_seeded: false,
      });

      // Auto-join as admin
      await dataService.entities.UserCommunity.create({
        user_id: currentUser?.id,
        community_id: community.id,
        role: 'Admin',
        user_name: currentUser?.full_name || currentUser?.display_name,
      }).catch(() => {});

      setCreatedCommunity(community);
      const suggestions = FIRST_POST_SUGGESTIONS[form.category] || FIRST_POST_SUGGESTIONS.Other;
      setFirstPostBody(suggestions[0]);
      setStep(2);
    } catch {
      toast.error('Could not create community. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handlePostFirst = async () => {
    if (!firstPostBody.trim() || !createdCommunity) return;
    setPostingFirst(true);
    try {
      const name = currentUser?.display_name || currentUser?.full_name || 'Admin';
      await dataService.entities.CommunityPost.create({
        community_id: createdCommunity.id,
        author_name: name,
        author_user_id: currentUser?.id,
        author_avatar_url: currentUser?.avatar_url,
        body: firstPostBody.trim(),
        post_type: 'announcement',
        is_pinned: true,
        is_official: true,
        likes_count: 0,
        comments_count: 0,
      });
      await dataService.entities.Community.update(createdCommunity.id, { post_count: 1 }).catch(() => {});
      toast.success('Community launched! 🎉');
      onCreated?.(createdCommunity);
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Could not post. Your community was created — try posting from the community page.');
    } finally {
      setPostingFirst(false);
    }
  };

  const handleSkipPost = () => {
    toast.success('Community created! Go add your first post anytime.');
    onCreated?.(createdCommunity);
    reset();
    onOpenChange(false);
  };

  const suggestions = FIRST_POST_SUGGESTIONS[form.category] || FIRST_POST_SUGGESTIONS.Other;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="w-[calc(100%-24px)] max-w-md mx-auto rounded-3xl p-0 overflow-hidden">

        {/* ── STEP 1: CREATE FORM ── */}
        {step === 1 && (
          <>
            <div className="px-5 pt-5 pb-3 border-b border-slate-100">
              <h2 className="text-[18px] font-bold text-slate-900">Create a Community</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Build your own mini-network in seconds</p>
            </div>

            <form onSubmit={handleCreate} className="px-5 pb-5 pt-4 space-y-4 max-h-[80dvh] overflow-y-auto">
              {/* Cover Image */}
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Cover Photo <span className="font-normal text-slate-400">(optional)</span></label>
                <div onClick={() => fileRef.current?.click()}
                  className="relative w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400 transition-colors">
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={e=>{e.stopPropagation();if(coverPreview)URL.revokeObjectURL(coverPreview);setCoverImage(null);setCoverPreview(null);}}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[13px] font-medium">Add cover photo</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </div>

              {/* Name */}
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Community Name *</label>
                <input
                  value={form.name}
                  onChange={e=>setForm(f=>({...f, name: e.target.value}))}
                  placeholder="e.g. HAFTR Alumni, Five Towns Moms…"
                  className="w-full px-4 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Description <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea
                  value={form.description}
                  onChange={e=>setForm(f=>({...f, description: e.target.value}))}
                  placeholder="What's this community about? Who should join?"
                  rows={2}
                  className="w-full px-4 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-2">Category *</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm(f=>({...f, category: cat.value}))}
                      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all active:scale-95 ${
                        form.category === cat.value
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className={`text-[10px] font-semibold leading-tight ${form.category === cat.value ? 'text-blue-600' : 'text-slate-600'}`}>{cat.label}</span>
                      {form.category === cat.value && <Check className="w-3 h-3 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Location <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  value={form.location}
                  onChange={e=>setForm(f=>({...f, location: e.target.value}))}
                  placeholder="e.g. Cedarhurst · Woodmere · Worldwide"
                  className="w-full px-4 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Privacy */}
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-2">Privacy</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can join' },
                    { value: 'approval', label: 'Approval', icon: Lock, desc: 'Admin approves' },
                  ].map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.value} type="button" onClick={() => setForm(f=>({...f, privacy: opt.value}))}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          form.privacy === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}>
                        <Icon className={`w-4 h-4 flex-shrink-0 ${form.privacy === opt.value ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                          <p className={`text-[12px] font-bold ${form.privacy === opt.value ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</p>
                          <p className="text-[10px] text-slate-400">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !form.name.trim() || !form.category}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? (uploading ? 'Uploading…' : 'Creating…') : 'Create Community'}
                {!submitting && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: FIRST POST PROMPT ── */}
        {step === 2 && createdCommunity && (
          <div className="px-5 py-6 space-y-5">
            {/* Success banner */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-[20px] font-black text-slate-900">"{createdCommunity.name}" is live!</h2>
              <p className="text-[13px] text-slate-500 mt-1">Make your first post to welcome members 👋</p>
            </div>

            {/* Editable first post */}
            <div>
              <label className="text-[12px] font-semibold text-slate-600 block mb-2">Your welcome post</label>
              <textarea
                value={firstPostBody}
                onChange={e => setFirstPostBody(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 text-[14px] bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                autoFocus
              />
            </div>

            {/* Suggestion chips */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-2">✨ Try a suggestion:</p>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFirstPostBody(s)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[12px] border transition-all ${
                      firstPostBody === s
                        ? 'border-blue-400 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    "{s.slice(0, 80)}{s.length > 80 ? '…' : ''}"
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handlePostFirst}
                disabled={postingFirst || !firstPostBody.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}
              >
                {postingFirst ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀'}
                {postingFirst ? 'Posting…' : 'Post & Open Community'}
              </button>
              <button
                onClick={handleSkipPost}
                className="w-full py-2.5 rounded-2xl text-[13px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}