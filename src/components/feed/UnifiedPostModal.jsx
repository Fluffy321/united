import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, MapPin, Check, Bold, Italic, List, ImagePlus, MessageCircle, HelpCircle, Calendar, Bell } from 'lucide-react';
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
  { 
    value: 'advice', 
    label: 'Advice', 
    bgColor: '#E8F1FF',
    textColor: '#1E40AF',
    selectedBg: '#BFDBFE',
    emoji: '💡'
  },
  { 
    value: 'lonely', 
    label: 'Lonely', 
    bgColor: '#F1E6FF',
    textColor: '#7C3AED',
    selectedBg: '#DDD6FE',
    emoji: '🤝'
  },
  { 
    value: 'school', 
    label: 'School', 
    bgColor: '#FFF6D6',
    textColor: '#B45309',
    selectedBg: '#FDE68A',
    emoji: '📚'
  },
  { 
    value: 'jobs', 
    label: 'Jobs', 
    bgColor: '#E6F7EC',
    textColor: '#15803D',
    selectedBg: '#BBF7D0',
    emoji: '💼'
  },
  { 
    value: 'family', 
    label: 'Family', 
    bgColor: '#FFEBD6',
    textColor: '#C2410C',
    selectedBg: '#FED7AA',
    emoji: '👨‍👩‍👧‍👦'
  },
  { 
    value: 'antisemitism', 
    label: 'Antisemitism', 
    bgColor: '#FFE3E3',
    textColor: '#991B1B',
    selectedBg: '#FECACA',
    emoji: '🛡️'
  },
  { 
    value: 'other', 
    label: 'Other', 
    bgColor: '#F2F2F2',
    textColor: '#374151',
    selectedBg: '#E5E7EB',
    emoji: '💬'
  }
];

const FEED_SUBTYPES = [
  { value: 'discussion', label: 'Discussion', icon: MessageCircle, active: 'bg-blue-600 text-white border-blue-600', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-blue-300' },
  { value: 'question',   label: 'Question',   icon: HelpCircle,    active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-amber-300' },
  { value: 'event',      label: 'Event',      icon: Calendar,      active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300' },
  { value: 'alert',      label: 'Alert',      icon: Bell,          active: 'bg-red-500 text-white border-red-500', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-red-300' },
];

export default function UnifiedPostModal({ open, onOpenChange, currentUser, postType = 'feed', promptId = null, promptText = null, initialSubtype = null }) {
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
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      const placeholderList = postType === 'help' ? PLACEHOLDERS.help : PLACEHOLDERS.feed;
      const randomPlaceholder = placeholderList[Math.floor(Math.random() * placeholderList.length)];
      setPlaceholder(randomPlaceholder);
      if (initialSubtype) setPostSubtype(initialSubtype);
    }
  }, [open, postType, initialSubtype]);

  const isPromptReply = !!promptId;
  const isHelp = postType === 'help';
  const isEvent = postType === 'event';
  const requiresTitle = isEvent || postType === 'job' || postType === 'housing';
  const categories = HELP_CATEGORIES || [];
  const selectedCategory = categories.find(cat => cat.value === category);

  const applyFormatting = (format) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    
    if (!selectedText) return;
    
    let formattedText;
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'bullet':
        formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      default:
        return;
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
    if (!body.trim()) {
      toast.error('Please write something');
      return;
    }

    if (requiresTitle && !title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (isHelp && !category) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);

    try {
      const isFeedPost = !isPromptReply && postType === 'feed';
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
      };

      await base44.entities.UnifiedPost.create(postData);

      // Update prompt reply count if applicable
      if (promptId) {
        const prompt = await base44.entities.DailyPrompt.filter({ id: promptId });
        if (prompt[0]) {
          await base44.entities.DailyPrompt.update(promptId, {
            replies_count: (prompt[0].replies_count || 0) + 1
          });
        }
      }

      toast.success('Posted!');
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setBody('');
      setLocation('');
      setIsAnonymous(false);
      setCategory('');
      setPostSubtype('discussion');
      setEventDate('');
      setEventTime('');
      setAttachedFiles([]);
      setCaption('');
      setImageUrls([]);
    } catch (error) {
      toast.error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-24px)] sm:max-w-lg bg-white p-0 flex flex-col" style={{maxHeight: '92dvh'}}>
        {/* Fixed header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-bold text-slate-900">{getModalTitle()}</h2>
          </div>
          {!isPromptReply && postType === 'feed' && (
            <div className="flex gap-2">
              {FEED_SUBTYPES.map(st => {
                const Icon = st.icon;
                const isActive = postSubtype === st.value;
                return (
                  <button key={st.value} type="button" onClick={() => setPostSubtype(st.value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${isActive ? st.active : st.inactive}`}>
                    <Icon className="w-3 h-3" />{st.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {requiresTitle && (
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="mt-1"
              />
            </div>
          )}

          {/* Avatar + Textarea row */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1 overflow-hidden">
              {currentUser?.avatar_url
                ? <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                : userInitials
              }
            </div>
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={getPlaceholderBySubtype()}
              className="flex-1 min-h-[80px] resize-none border-0 border-b border-slate-200 rounded-none px-0 text-[15px] focus:ring-0 focus:border-blue-400 bg-transparent placeholder:text-slate-400"
            />
          </div>

          {isHelp && (
            <>
              <div>
                <Label className="mb-3 block">What type of help do you need?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => {
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className="relative rounded-xl p-3 text-left transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: isSelected ? cat.selectedBg : cat.bgColor,
                          color: cat.textColor,
                          boxShadow: isSelected ? `0 0 0 2px ${cat.textColor}40` : 'none'
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat.emoji}</span>
                            <span className="font-medium text-sm">{cat.label}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 animate-in zoom-in duration-150" strokeWidth={3} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                <div>
                  <Label className="text-sm font-medium">Post anonymously</Label>
                  <p className="text-xs text-slate-500">Your identity will be hidden</p>
                </div>
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              </div>
            </>
          )}

          {isEvent && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {/* Location — compact chips */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Neighborhood <span className="normal-case font-normal">(optional)</span></p>
            <div className="flex flex-wrap gap-1.5">
              {['Cedarhurst', 'Woodmere', 'Lawrence', 'Inwood', 'Hewlett'].map(n => (
                <button key={n} type="button" onClick={() => setLocation(location === n ? '' : n)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    location === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300'
                  }`}>
                  <MapPin className="w-2.5 h-2.5" />{n}
                </button>
              ))}
            </div>
          </div>

          {/* Photo upload — compact inline */}
          {(postType === 'feed' || postType === 'housing') && (
            <div className="flex items-center gap-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative group w-14 h-14">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">
                    ✕
                  </button>
                </div>
              ))}
              {imageUrls.length < 3 && (
                <label className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <ImagePlus className="w-4 h-4 text-slate-400" />}
                  <span className="text-[9px] text-slate-400 mt-0.5">Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    setUploadingImages(true);
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    setImageUrls(prev => [...prev, file_url]);
                    setUploadingImages(false); e.target.value = '';
                  }} />
                </label>
              )}
              {imageUrls.length > 0 && (
                <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption..." maxLength={200}
                  className="flex-1 px-3 py-2 text-[12px] rounded-lg border border-slate-200 outline-none focus:border-blue-400 bg-slate-50" />
              )}
            </div>
          )}

        </div>

        {/* Fixed footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 px-4 text-sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}
            className="h-9 px-5 text-sm bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}