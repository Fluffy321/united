import React, { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { canMessage, checkSpamLimits, recordNewChat } from '@/lib/messagingPermissions';

export default function MessageButton({ 
  recipientId, 
  recipientName, 
  postId, 
  postTitle, 
  postType = 'general',
  currentUser,
  variant = 'default'
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async (e) => {
    e.stopPropagation();
    if (!currentUser) { toast.error('Please log in to message'); return; }
    if (currentUser.id === recipientId) { toast.error("You can't message yourself"); return; }

    setLoading(true);
    try {
      // Check for existing conversation first
      const allConvs = await base44.entities.Conversation.list('-updated_date', 100);
      const existing = allConvs.find(c =>
        c.participant_ids?.includes(currentUser.id) &&
        c.participant_ids?.includes(recipientId) &&
        c.participant_ids?.length === 2
      );

      if (existing) {
        navigate(createPageUrl(`Messages?conversation=${existing.id}`));
        return;
      }

      // New conversation — check spam limits
      const spam = checkSpamLimits(currentUser.id);
      if (!spam.allowed) {
        toast.error(spam.reason);
        return;
      }

      // Check messaging permission
      const { canMessage: allowed } = await canMessage(currentUser, recipientId);

      if (allowed) {
        const conv = await base44.entities.Conversation.create({
          participant_ids: [currentUser.id, recipientId],
          participant_names: [currentUser.full_name || currentUser.display_name, recipientName],
          participant_ages: [currentUser.age_range || '18+', null],
          request_id: postId || null,
          request_title: postTitle || null,
          request_type: postType,
          unread_count: { [recipientId]: 0 }
        });
        recordNewChat(currentUser.id);
        navigate(createPageUrl(`Messages?conversation=${conv.id}`));
        toast.success('Conversation started!');
      } else {
        // Send a message request instead
        const existing = await base44.entities.MessageRequest.filter({
          sender_id: currentUser.id,
          recipient_id: recipientId,
          status: 'pending'
        });
        if (existing.length > 0) {
          toast.info('You already sent a message request to this person.');
          return;
        }
        await base44.entities.MessageRequest.create({
          sender_id: currentUser.id,
          sender_name: currentUser.full_name || currentUser.display_name,
          sender_avatar: currentUser.avatar_url || null,
          recipient_id: recipientId,
          status: 'pending',
        });
        recordNewChat(currentUser.id);
        toast.success('Message request sent! They\'ll be notified to accept.');
      }
    } catch (error) {
      toast.error('Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartConversation}
      disabled={loading}
      className={`flex items-center gap-2 transition-colors ${
        variant === 'compact'
          ? 'p-2 hover:bg-slate-100 rounded-full'
          : 'px-3.5 py-1.5 rounded-full text-sm font-semibold'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={variant === 'default' ? { background: '#F2F4F7', color: '#0F1C2E' } : {}}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <MessageCircle className="w-4 h-4" />
          {variant === 'default' && <span>Message</span>}
        </>
      )}
    </button>
  );
}