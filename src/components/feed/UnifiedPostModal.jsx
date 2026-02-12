import React, { useState, useEffect } from 'react';
import { X, Loader2, MapPin } from 'lucide-react';
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
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PLACEHOLDERS = [
  'Share something happening near you...',
  'Ask the community a question...',
  'What\'s going on today?',
  'Need something or planning something?'
];

const HELP_CATEGORIES = [
  { value: 'advice', label: 'Advice', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'lonely', label: 'Lonely', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'school', label: 'School', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'jobs', label: 'Jobs', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'family', label: 'Family', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'antisemitism', label: 'Antisemitism', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700 border-slate-200' }
];

export default function UnifiedPostModal({ open, onOpenChange, currentUser, postType = 'feed', promptId = null, promptText = null }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    if (open) {
      const randomPlaceholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
      setPlaceholder(randomPlaceholder);
    }
  }, [open]);

  const isPromptReply = !!promptId;
  const isHelp = postType === 'help';
  const isEvent = postType === 'event';
  const requiresTitle = isEvent || postType === 'job' || postType === 'housing';
  const selectedCategory = HELP_CATEGORIES.find(cat => cat.value === category);

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
        prompt_text: promptText || undefined
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
      setEventDate('');
      setEventTime('');
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
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {HELP_CATEGORIES.map(cat => (
                      <SelectItem 
                        key={cat.value} 
                        value={cat.value}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${cat.color.split(' ')[0].replace('bg-', 'bg-')}`} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedCategory && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Badge className={`${selectedCategory.color} border font-medium`}>
                      {selectedCategory.label}
                    </Badge>
                  </div>
                )}
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