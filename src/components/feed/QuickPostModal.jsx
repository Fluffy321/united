import React, { useState } from 'react';
import { Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dataService } from '@/services';
import { toast } from 'sonner';

const QUICK_CATEGORIES = [
  { emoji: '💭', label: 'Thought' },
  { emoji: '❓', label: 'Question' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '🎉', label: 'Good News' },
  { emoji: '🙏', label: 'Grateful' }
];

export default function QuickPostModal({ open, onOpenChange, currentUser }) {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const postData = {
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name,
        user_age_range: currentUser.age_range || '18+',
        avatar_url: currentUser.avatar_url,
        avatar_type: currentUser.avatar_type,
        avatar_preset_id: currentUser.avatar_preset_id,
        avatar_theme: currentUser.avatar_theme,
        type: 'feed',
        board: 'feed',
        body: selectedCategory ? `${selectedCategory.emoji} ${content}` : content,
        city: currentUser.city || 'Five Towns'
      };

      await dataService.entities.UnifiedPost.create(postData);
      
      setContent('');
      setSelectedCategory(null);
      onOpenChange(false);
      toast.success('Posted!');
    } catch (error) {
      toast.error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setSelectedCategory(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="resize-none min-h-[100px]"
            maxLength={280}
            autoFocus
          />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Optional tag</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.label}
                  variant={selectedCategory?.label === cat.label ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    selectedCategory?.label === cat.label
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory?.label === cat.label ? null : cat)}
                >
                  {cat.emoji} {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {content.length}/280
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}