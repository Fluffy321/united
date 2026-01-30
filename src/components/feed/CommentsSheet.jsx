import React, { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function CommentsSheet({ open, onOpenChange, post, currentUser, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && post) {
      loadComments();
    }
  }, [open, post]);

  const loadComments = async () => {
    setIsLoading(true);
    const data = await base44.entities.Comment.filter({ post_id: post.id, post_type: 'feed' }, '-created_date');
    setComments(data);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    await base44.entities.Comment.create({
      post_id: post.id,
      post_type: 'feed',
      content: newComment.trim(),
      author_name: currentUser.display_name || currentUser.full_name?.split(' ')[0],
      author_id: currentUser.id,
      author_age_range: currentUser.age_range || '18+'
    });
    
    await base44.entities.Post.update(post.id, { 
      comments_count: (post.comments_count || 0) + 1 
    });
    
    setNewComment('');
    setIsSubmitting(false);
    loadComments();
    onCommentAdded?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No comments yet. Be the first!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {comment.author_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 text-sm">{comment.author_name}</span>
                      <Badge variant="outline" className="text-xs font-normal scale-90 origin-left">
                        {comment.author_age_range}
                      </Badge>
                    </div>
                    <p className="text-slate-700 text-sm mt-1">{comment.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 pb-6">
            <div className="flex gap-2">
              <Input 
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleSubmit} 
                disabled={!newComment.trim() || isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}