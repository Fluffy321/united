import React, { useState, useEffect } from 'react';
import { X, Loader2, MapPin, Check } from 'lucide-react';
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
  { value: 'discussion',     label: 'Discussion',     emoji: '💬', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'question',       label: 'Question',       emoji: '❓', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
  { value: 'alert',          label: 'Alert',          emoji: '🚨', color: 'bg-red-50 text-red-700 border-red-300' },
  { value: 'recommendation', label: 'Recommendation', emoji: '⭐', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { value: 'lost_found',     label: 'Lost & Found',   emoji: '🔍', color: 'bg-blue-50 text-blue-700 border-blue-300' },
];

export default function UnifiedPostModal({ open, onOpenChange, currentUser, postType = 'feed', promptId = null, promptText = null }) {
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

  useEffect(() => {
    if (open) {
      const placeholderList = postType === 'help' ? PLACEHOLDERS.help : PLACEHOLDERS.feed;
      const randomPlaceholder = placeholderList[Math.floor(Math.random() * placeholderList.length)];
      setPlaceholder(randomPlaceholder);
    }
  }, [open, postType]);

  const isPromptReply = !!promptId;
  const isHelp = postType === 'help';
  const isEvent = postType === 'event';
  const requiresTitle = isEvent || postType === 'job' || postType === 'housing';
  const categories = HELP_CATEGORIES || [];
  const selectedCategory = categories.find(cat => cat.value === category);

  const getModalTitle = () => {
    if (isPromptReply) return 'Reply to Prompt';
    if (isHelp) return 'Need Help';
    if (isEvent) return 'Post Event';
    if (postType === 'job') return 'Post Job';
    if (postType === 'housing') return 'Post Housing';
    if (postType === 'food') return 'Food Post';
    return 'New Post';
  };

  const getBoardFromType = () => {
    if (postType === 'event') return 'events';
    if (postType === 'job') return 'jobs';
    if (postType === 'housing') return 'housing';
    if (postType === 'food') return 'food';
    if (postType === 'help') return 'help';
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
        image_url: attachedFiles[0]?.url || undefined,
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
    } catch (error) {
      toast.error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isPromptReply && promptText && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <p className="text-sm text-indigo-700 font-medium">💭 {promptText}</p>
            </div>
          )}

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

          <div>
            <Label>{requiresTitle ? 'Details' : 'What\'s on your mind?'}</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={placeholder || 'Write here...'}
              className="mt-1 min-h-[120px] resize-none focus:ring-2 focus:ring-indigo-500 transition-all"
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

          {(isEvent || postType === 'housing' || postType === 'job') && (
            <div>
              <Label>Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location..."
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* File upload */}
          <div>
            <Label className="mb-2 block">Attachments <span className="text-slate-400 font-normal">(optional)</span></Label>
            <FileUploadZone 
              onFilesUpload={setAttachedFiles}
              maxFiles={3}
            />
          </div>
          </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-md"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}