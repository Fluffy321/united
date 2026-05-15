import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, Check, Bold, Italic, List, MessageCircle, HelpCircle, Calendar, Bell, BarChart2, Plus, Trash2, Image, Send, Sparkles } from 'lucide-react';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { dataService, notificationsService, checkRateLimit, RateLimitError } from '@/services';
import { toast } from 'sonner';

const PLACEHOLDERS = {
  feed: [
    'Share something happening near you...',
    'Ask the community a question...',
    'What\'s going on today?',
    'Need something or planning something?'
  ],
  help: [
    'What do you need help with today?',
    'Ask your community something...',
    'Need advice or support?',
    'What\'s going on?'
  ]
};

const HELP_CATEGORIES = [
  { value: 'advice', label: 'Advice', bgColor: '#E8F1FF', textColor: '#1E40AF', selectedBg: '#BFDBFE', emoji: '💡' },
  { value: 'lonely', label: 'Lonely', bgColor: '#F1E6FF', textColor: '#7C3AED', selectedBg: '#DDD6FE', emoji: '🤝' },
  { value: 'school', label: 'School', bgColor: '#FFF6D6', textColor: '#B45309', selectedBg: '#FDE68A', emoji: '📚' },
  { value: 'jobs', label: 'Jobs', bgColor: '#E6F7EC', textColor: '#15803D', selectedBg: '#BBF7D0', emoji: '💼' },
  { value: 'family', label: 'Family', bgColor: '#FFEBD6', textColor: '#C2410C', selectedBg: '#FED7AA', emoji: '👨‍👩‍👧‍👦' },
  { value: 'antisemitism', label: 'Antisemitism', bgColor: '#FFE3E3', textColor: '#991B1B', selectedBg: '#FECACA', emoji: '🛡️' },
  { value: 'other', label: 'Other', bgColor: '#F2F2F2', textColor: '#374151', selectedBg: '#E5E7EB', emoji: '💬' }
];

const FEED_SUBTYPES = [
  { value: 'discussion', label: 'Discussion', icon: MessageCircle, active: 'border-blue-200 bg-blue-600 text-white shadow-blue-200', inactive: 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50' },
  { value: 'question',   label: 'Question',   icon: HelpCircle,    active: 'border-amber-200 bg-amber-500 text-white shadow-amber-200', inactive: 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50' },
  { value: 'event',      label: 'Event',      icon: Calendar,      active: 'border-emerald-200 bg-emerald-600 text-white shadow-emerald-200', inactive: 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50' },
  { value: 'alert',      label: 'Alert',      icon: Bell,          active: 'border-red-200 bg-red-500 text-white shadow-red-200', inactive: 'border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50' },
  { value: 'poll',       label: 'Poll',       icon: BarChart2,     active: 'border-violet-200 bg-violet-600 text-white shadow-violet-200', inactive: 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50' },
];

export default function UnifiedPostModal({ open, onOpenChange, currentUser, postType = 'feed', promptId = null, promptText = null, initialSubtype = null, initialBody = '', initialCommunityId = null, userCommunities = [] }) {
  const userInitials = (currentUser?.display_name || currentUser?.full_name || '?').charAt(0).toUpperCase();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState('');
  const [postSubtype, setPostSubtype] = useState('discussion');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialCommunityId || '');
  const textareaRef = useRef(null);
  const isPoll = postSubtype === 'poll';
  const activeSubtype = FEED_SUBTYPES.find((item) => item.value === postSubtype);

  useEffect(() => {
    if (open) {
      const placeholderList = postType === 'help' ? PLACEHOLDERS.help : PLACEHOLDERS.feed;
      const randomPlaceholder = placeholderList[Math.floor(Math.random() * placeholderList.length)];
      setPlaceholder(randomPlaceholder);
      if (initialSubtype) setPostSubtype(initialSubtype);
      if (initialBody) setBody(initialBody);
      setSelectedCommunityId(initialCommunityId || '');
      // Default city to user's primary network
      setSelectedCity(currentUser?.cityPreset || 'Five Towns');
    }
  }, [open, postType, initialSubtype, initialBody, initialCommunityId, currentUser]);

  const isPromptReply = !!promptId;
  const isHelp = postType === 'help';
  const isEvent = postType === 'event';
  const requiresTitle = isEvent || postType === 'job' || postType === 'housing';
  const categories = HELP_CATEGORIES || [];

  const applyFormatting = (format) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    if (!selectedText) return;
    let formattedText;
    switch (format) {
      case 'bold': formattedText = `**${selectedText}**`; break;
      case 'italic': formattedText = `*${selectedText}*`; break;
      case 'bullet': formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n'); break;
      default: return;
    }
    const newBody = body.substring(0, start) + formattedText + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + formattedText.length;
    }, 0);
  };

  const getModalTitle = () => {
    if (isPromptReply) return 'Reply to Prompt';
    if (isHelp) return 'Need Help?';
    if (isEvent) return 'Create Event';
    if (postType === 'job') return 'Post a Job';
    if (postType === 'housing') return 'Post Housing';
    if (postType === 'food') return 'Food Post';
    if (postType === 'prompt') return 'Ask the Community';
    return 'What\'s happening?';
  };

  const getPlaceholderBySubtype = () => {
    if (postSubtype === 'question') return 'Ask the community something...';
    if (postSubtype === 'event') return 'Tell people about this event...';
    if (postSubtype === 'alert') return 'Share an important update...';
    if (postSubtype === 'poll') return 'What should people vote on?';
    return 'Share something with your community...';
  };

  const getBoardFromType = () => {
    if (postType === 'event') return 'events';
    if (postType === 'job') return 'jobs';
    if (postType === 'housing') return 'housing';
    if (postType === 'food') return 'food';
    if (postType === 'help') return 'help';
    if (postType === 'prompt') return 'feed';
    return 'feed';
  };

  const handleSubmit = async () => {
    if (!body.trim()) { toast.error('Please write something'); return; }
    if (requiresTitle && !title.trim()) { toast.error('Title is required'); return; }
    if (isHelp && !category) { toast.error('Please select a category'); return; }

    setIsSubmitting(true);
    try {
      await checkRateLimit('create_post');

      const isFeedPost = !isPromptReply && postType === 'feed';
      if (isPoll) {
        const validOptions = pollOptions.filter(o => o.trim());
        if (validOptions.length < 2) { toast.error('Add at least 2 poll options'); setIsSubmitting(false); return; }
      }
      const selectedCommunity = userCommunities.find(c => c.id === selectedCommunityId);
      const postData = {
        user_id: currentUser.id,
        user_name: isAnonymous ? 'Anonymous' : currentUser.display_name,
        user_age_range: currentUser.age_range,
        type: isPromptReply ? 'prompt_reply' : postType,
        board: getBoardFromType(),
        title: title.trim() || undefined,
        body: body.trim(),
        location_text: location.trim() || undefined,
        is_anonymous: isAnonymous,
        category: category || undefined,
        city: selectedCity || currentUser?.cityPreset || 'Five Towns',
        event_date: eventDate || undefined,
        event_time: eventTime || undefined,
        prompt_id: promptId || undefined,
        prompt_text: promptText || undefined,
        image_url: imageUrls[0] || attachedFiles[0]?.url || undefined,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        caption: caption.trim() || undefined,
        attachment_urls: attachedFiles.map(f => f.url),
        post_subtype: isFeedPost ? postSubtype : undefined,
        poll_options: isPoll ? pollOptions.filter(o => o.trim()) : undefined,
        community_id: selectedCommunityId || undefined,
        community_name: selectedCommunity?.name || undefined,
      };

      const created = await dataService.entities.UnifiedPost.create(postData);

      if (selectedCommunity?.id) {
        const recipientIds = selectedCommunity.member_ids || selectedCommunity.memberIds || [];
        recipientIds
          .filter((memberId) => memberId && memberId !== currentUser.id)
          .slice(0, 25)
          .forEach((memberId) => {
            notificationsService.notifyCommunityActivity({
              userId: memberId,
              actorId: currentUser.id,
              actorName: currentUser.display_name || currentUser.full_name,
              communityId: selectedCommunity.id,
              communityName: selectedCommunity.name,
              postId: created.id,
            }).catch(() => {});
          });
      }

      // Fire-and-forget AI moderation scan (non-blocking)
      if (created?.id && body.trim().length > 10) {
        dataService.functions.invoke('moderateContent', {
          text: [title, body].filter(Boolean).join(' '),
          content_id: created.id,
          content_type: 'unified_post',
          author_id: currentUser.id,
        }).catch(() => {});
      }

      if (promptId) {
        const prompt = await dataService.entities.DailyFeedPrompt.filter({ id: promptId });
        if (prompt[0]) {
          await dataService.entities.DailyFeedPrompt.update(promptId, { replies_count: (prompt[0].replies_count || 0) + 1 });
        }
      }

      toast.success('Posted!');
      onOpenChange(false);
      setTitle(''); setBody(''); setLocation(''); setIsAnonymous(false);
      setCategory(''); setPostSubtype('discussion'); setEventDate('');
      setEventTime(''); setAttachedFiles([]); setCaption(''); setImageUrls([]);
      setPollOptions(['', '']); setSelectedCommunityId('');
      setSelectedCity(currentUser?.cityPreset || 'Five Towns');
    } catch (error) {
      if (error instanceof RateLimitError) { toast.error(error.message); return; }
      toast.error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 border-0 bg-white p-0 flex flex-col rounded-none overflow-hidden shadow-2xl sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[92dvh] sm:w-[calc(100%-20px)] sm:max-w-[520px] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[26px]">
        <DialogTitle className="sr-only">{getModalTitle()}</DialogTitle>
        {/* Fixed header */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-4">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black leading-tight text-slate-950">{getModalTitle()}</h2>
              <p className="mt-0.5 text-[12px] font-semibold leading-4 text-slate-500">
                Write it, choose where it goes, post.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto bg-[#F7F9FC] px-3 py-3 space-y-3">
          {requiresTitle && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <Label className="text-[12px] font-black text-slate-800">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." className="mt-1 h-10 rounded-xl border-slate-300 font-semibold" />
            </div>
          )}

          {/* Main composer */}
          <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 overflow-hidden">
                {currentUser?.avatar_url
                  ? <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  : userInitials
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-950">{isAnonymous ? 'Posting anonymously' : currentUser?.display_name || currentUser?.full_name || 'Local demo'}</p>
                <p className="truncate text-[12px] font-semibold text-slate-500">
                  {activeSubtype?.label || 'Post'} · {selectedCommunityId ? userCommunities.find(c => c.id === selectedCommunityId)?.name : 'General Feed'} · {location || selectedCity || currentUser?.cityPreset || 'Five Towns'}
                </p>
              </div>
            </div>
            <div className="flex flex-col">
              <Textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={getPlaceholderBySubtype() || "What's going on?"}
                className="min-h-[170px] resize-none rounded-[20px] rounded-b-none border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium leading-6 text-slate-950 focus:ring-0 focus:border-blue-400 focus:bg-white placeholder:text-slate-500 transition-all"
                maxLength={1000}
              />
              {/* Formatting toolbar + char counter */}
              <div className="flex items-center justify-between rounded-b-[20px] border border-t-0 border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-1">
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('bold'); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    title="Bold (select text first)">
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('italic'); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    title="Italic (select text first)">
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('bullet'); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    title="Bullet list (select lines first)">
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className={`text-[11px] font-black tabular-nums ${
                  body.length > 900 ? 'text-red-500' : body.length > 700 ? 'text-amber-500' : 'text-slate-400'
                }`}>{body.length}/1000</span>
              </div>
            </div>
          </div>

          {!isPromptReply && postType === 'feed' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Type</span>
                  <select
                    value={postSubtype}
                    onChange={(event) => setPostSubtype(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-black text-slate-800 outline-none focus:border-blue-400"
                  >
                    {FEED_SUBTYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Post to</span>
                  <select
                    value={selectedCommunityId}
                    onChange={(event) => setSelectedCommunityId(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-black text-slate-800 outline-none focus:border-blue-400"
                  >
                    <option value="">General Feed</option>
                    {userCommunities.map((community) => (
                      <option key={community.id} value={community.id}>{community.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <details className="mt-2 group">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-black text-slate-600 transition hover:bg-slate-100">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  {location || selectedCity || 'Add location'}
                </summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-800 outline-none"
                  >
                    {LOCAL_NETWORKS.map((network) => (
                      <option key={network.id} value={network.cityPreset}>{network.emoji} {network.shortLabel}</option>
                    ))}
                  </select>
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Specific place or neighborhood"
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-800 outline-none"
                  />
                </div>
              </details>
            </div>
          )}

          {/* Poll builder */}
          {isPoll && (
            <div className="space-y-2 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm">
              <p className="text-[12px] font-black uppercase tracking-wide text-violet-700">Poll Options</p>
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={e => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                    placeholder={`Option ${i + 1}`}
                    maxLength={80}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-violet-400 focus:bg-white transition-colors"
                  />
                  {pollOptions.length > 2 && (
                    <button type="button" onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button type="button" onClick={() => setPollOptions(prev => [...prev, ''])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors">
                  <Plus className="w-3 h-3" /> Add option
                </button>
              )}
            </div>
          )}

          {/* Simple attachments */}
          <div className="mobile-scroll-x flex gap-2 pb-1">
            <button type="button" onClick={() => document.querySelector('input[type="file"]')?.click()}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-[13px] font-black text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50">
              <Image className="h-4 w-4 text-blue-600" /> Photo
            </button>
          </div>

          {/* Help categories */}
          {isHelp && (
            <div className="space-y-2">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 py-2">Choose a category</summary>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {categories.map(cat => {
                    const isSelected = category === cat.value;
                    return (
                      <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                        className="relative rounded-xl p-3 text-left transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: isSelected ? cat.selectedBg : cat.bgColor, color: cat.textColor, boxShadow: isSelected ? `0 0 0 2px ${cat.textColor}40` : 'none' }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat.emoji}</span>
                            <span className="font-medium text-sm">{cat.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 animate-in zoom-in duration-150" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </details>
              <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                <Label className="text-sm font-medium cursor-pointer">Post anonymously</Label>
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              </div>
            </div>
          )}

          {isEvent && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 py-2">Event details</summary>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">Time</Label>
                  <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="mt-1 h-8" />
                </div>
              </div>
            </details>
          )}

          {/* Photo upload */}
          {(postType === 'feed' || postType === 'housing') && imageUrls.length > 0 && (
            <div className="flex items-center gap-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative group w-12 h-12">
                  <img src={url} alt="" className="w-full h-full object-cover rounded" />
                  <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">✕</button>
                </div>
              ))}
              {imageUrls.length > 0 && (
                <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption..." maxLength={200}
                  className="flex-1 px-2 py-1.5 text-[12px] rounded border border-slate-200 outline-none focus:border-blue-400" />
              )}
            </div>
          )}
          {(postType === 'feed' || postType === 'housing') && imageUrls.length < 3 && (
            <label className="hidden">
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return;
                setUploadingImages(true);
                const { uploadImage } = await import('@/lib/imageUpload');
                const { url } = await uploadImage(file);
                setImageUrls(prev => [...prev, url]);
                setUploadingImages(false); e.target.value = '';
              }} />
            </label>
          )}
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <Button onClick={handleSubmit} disabled={isSubmitting || !body.trim()}
            className="w-full h-11 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-blue-700 to-emerald-700 hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Send className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Posting...' : 'Post to JUnited'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
