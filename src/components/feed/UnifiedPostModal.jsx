import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, MapPin, Check, Bold, Italic, List, ImagePlus, MessageCircle, HelpCircle, Calendar, Bell, BarChart2, Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileUploadZone from '@/components/common/FileUploadZone';
import { base44 } from '@/api/base44Client';
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
  { value: 'discussion', label: 'Discussion', icon: MessageCircle, active: 'bg-blue-600 text-white border-blue-600', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-blue-300' },
  { value: 'question',   label: 'Question',   icon: HelpCircle,    active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-amber-300' },
  { value: 'event',      label: 'Event',      icon: Calendar,      active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300' },
  { value: 'alert',      label: 'Alert',      icon: Bell,          active: 'bg-red-500 text-white border-red-500', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-red-300' },
  { value: 'poll',       label: 'Poll',       icon: BarChart2,     active: 'bg-violet-600 text-white border-violet-600', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-violet-300' },
];

export default function UnifiedPostModal({ open, onOpenChange, currentUser, postType = 'feed', promptId = null, promptText = null, initialSubtype = null, initialBody = '', initialCommunityId = null, userCommunities = [] }) {
  const userInitials = (currentUser?.display_name || currentUser?.full_name || '?').charAt(0).toUpperCase();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
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

  useEffect(() => {
    if (open) {
      const placeholderList = postType === 'help' ? PLACEHOLDERS.help : PLACEHOLDERS.feed;
      const randomPlaceholder = placeholderList[Math.floor(Math.random() * placeholderList.length)];
      setPlaceholder(randomPlaceholder);
      if (initialSubtype) setPostSubtype(initialSubtype);
      if (initialBody) setBody(initialBody);
      setSelectedCommunityId(initialCommunityId || '');
    }
  }, [open, postType, initialSubtype, initialBody, initialCommunityId]);

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
        city: currentUser.city || 'Five Towns',
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

      await base44.entities.UnifiedPost.create(postData);

      if (promptId) {
        const prompt = await base44.entities.DailyPrompt.filter({ id: promptId });
        if (prompt[0]) {
          await base44.entities.DailyPrompt.update(promptId, { replies_count: (prompt[0].replies_count || 0) + 1 });
        }
      }

      toast.success('Posted!');
      onOpenChange(false);
      setTitle(''); setBody(''); setLocation(''); setIsAnonymous(false);
      setCategory(''); setPostSubtype('discussion'); setEventDate('');
      setEventTime(''); setAttachedFiles([]); setCaption(''); setImageUrls([]);
      setPollOptions(['', '']); setSelectedCommunityId('');
    } catch (error) {
      toast.error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-24px)] sm:max-w-lg bg-white p-0 flex flex-col rounded-3xl overflow-hidden" style={{maxHeight: '92dvh'}}>
        {/* Fixed header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-bold text-slate-900">{getModalTitle()}</h2>
          </div>
          {!isPromptReply && postType === 'feed' && (
            <div className="flex gap-1.5">
              {FEED_SUBTYPES.map(st => {
                const Icon = st.icon;
                const isActive = postSubtype === st.value;
                return (
                  <button key={st.value} type="button" onClick={() => setPostSubtype(st.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${isActive ? st.active : st.inactive}`}>
                    <Icon className="w-3 h-3" />{st.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {requiresTitle && (
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." className="mt-1" />
            </div>
          )}

          {/* Avatar + Textarea */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden mt-2">
              {currentUser?.avatar_url
                ? <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                : userInitials
              }
            </div>
            <div className="flex-1 flex flex-col">
              <Textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={getPlaceholderBySubtype() || "What's going on?"}
                className="flex-1 min-h-[140px] resize-none rounded-3xl rounded-b-none border border-slate-150 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 focus:ring-0 focus:border-blue-300 focus:bg-white placeholder:text-slate-400 transition-all"
                maxLength={1000}
              />
              {/* Formatting toolbar + char counter */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-t-0 border-slate-150 rounded-b-3xl">
                <div className="flex items-center gap-1">
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('bold'); }}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    title="Bold (select text first)">
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('italic'); }}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    title="Italic (select text first)">
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('bullet'); }}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    title="Bullet list (select lines first)">
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className={`text-[11px] font-medium tabular-nums ${
                  body.length > 900 ? 'text-red-500' : body.length > 700 ? 'text-amber-500' : 'text-slate-400'
                }`}>{body.length}/1000</span>
              </div>
            </div>
          </div>

          {/* Poll builder */}
          {isPoll && (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Poll Options</p>
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={e => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                    placeholder={`Option ${i + 1}`}
                    maxLength={80}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[13px] focus:outline-none focus:border-violet-400 focus:bg-white transition-colors"
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

          {/* Quick action buttons */}
          <div className="flex gap-2 justify-center py-2">
            <button type="button" onClick={() => document.querySelector('input[type="file"]')?.click()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
              📸 Photo
            </button>
            <button type="button" onClick={() => {setPostSubtype('question'); setTimeout(() => textareaRef.current?.focus(), 100);}}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
              ❓ Question
            </button>
            <button type="button" onClick={() => {setPostSubtype('event'); setTimeout(() => textareaRef.current?.focus(), 100);}}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
              🎉 Event
            </button>
            <button type="button" onClick={() => document.querySelector('[data-neighborhood-toggle]')?.click()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
              📍 Location
            </button>
          </div>

          {/* Community picker — shown when user has joined communities */}
          {userCommunities.length > 0 && !isPromptReply && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-semibold text-slate-500">Post to:</span>
              <button
                type="button"
                onClick={() => setSelectedCommunityId('')}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-all ${
                  !selectedCommunityId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                }`}
              >
                📣 General Feed
              </button>
              {userCommunities.slice(0, 5).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCommunityId(c.id === selectedCommunityId ? '' : c.id)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-all ${
                    selectedCommunityId === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  👥 {c.name}
                </button>
              ))}
            </div>
          )}

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

          {/* Location */}
          <details className="group" data-neighborhood-toggle>
            <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 py-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Add location
            </summary>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Cedarhurst', 'Woodmere', 'Lawrence', 'Inwood', 'Hewlett'].map(n => (
                <button key={n} type="button" onClick={() => setLocation(location === n ? '' : n)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-all ${
                    location === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </details>

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
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setImageUrls(prev => [...prev, file_url]);
                setUploadingImages(false); e.target.value = '';
              }} />
            </label>
          )}
        </div>

        {/* Fixed footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 bg-white">
          <Button onClick={handleSubmit} disabled={isSubmitting || !body.trim()}
            className="w-full h-10 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}