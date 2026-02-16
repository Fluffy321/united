import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreateShulPostModal({ open, onOpenChange, shul, currentUser, onSuccess }) {
  const [type, setType] = useState('announcement');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.ShulPost.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: currentUser.id,
        user_name: currentUser.display_name,
        type,
        title: title.trim() || undefined,
        content: content.trim(),
        event_date: type === 'event' ? eventDate : undefined,
        event_time: type === 'event' ? eventTime : undefined,
        is_pinned: isPinned
      });

      toast.success('Post created!');
      setTitle('');
      setContent('');
      setEventDate('');
      setEventTime('');
      setIsPinned(false);
      onSuccess();
    } catch (error) {
      toast.error('Failed to create post');
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Post Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="discussion">Discussion</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
            />
          </div>

          <div>
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in the community?"
              rows={4}
              required
            />
          </div>

          {type === 'event' && (
            <>
              <div>
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Event Time</Label>
                <Input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="e.g., 7:00 PM"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="pin">Pin this post</Label>
            <Switch
              id="pin"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}