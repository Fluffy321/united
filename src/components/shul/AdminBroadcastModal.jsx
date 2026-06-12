// DEFERRED: no backing table — do not use in beta
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bell, Loader2 } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';

export default function AdminBroadcastModal({ open, onOpenChange, shul, currentUser, memberCount }) {
  const [message, setMessage] = useState('');
  const [isPinned, setIsPinned] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBroadcast = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setIsSubmitting(true);
    try {
      await dataService.entities.ShulPost.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name,
        type: 'announcement',
        title: '📢 Broadcast',
        content: message.trim(),
        is_pinned: isPinned
      });
      toast.success(`Broadcast sent to ${memberCount || 0} members`);
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to send broadcast');
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            Broadcast to Community
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            This message will be posted as a pinned announcement visible to all <strong>{memberCount || 0} members</strong>.
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pin-broadcast"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <Label htmlFor="pin-broadcast" className="cursor-pointer">Pin to top of dashboard</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBroadcast}
              disabled={isSubmitting || !message.trim()}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <><Bell className="w-4 h-4 mr-2" />Send Broadcast</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
