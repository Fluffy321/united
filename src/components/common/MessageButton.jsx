import React, { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

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
    if (!currentUser) {
      toast.error('Please log in to message');
      return;
    }

    if (currentUser.id === recipientId) {
      toast.error("You can't message yourself");
      return;
    }

    setLoading(true);
    try {
      // Find existing direct conversation between these two users
      const allConvs = await base44.entities.Conversation.list('-updated_date', 100);
      const existing = allConvs.find(c =>
        c.participant_ids?.includes(currentUser.id) &&
        c.participant_ids?.includes(recipientId) &&
        c.participant_ids?.length === 2
      );

      let conversationId;
      if (existing) {
        conversationId = existing.id;
      } else {
        const conv = await base44.entities.Conversation.create({
          participant_ids: [currentUser.id, recipientId],
          participant_names: [currentUser.full_name || currentUser.display_name, recipientName],
          participant_ages: [currentUser.age_range || '18+', null],
          request_id: postId || null,
          request_title: postTitle || null,
          request_type: postType,
          unread_count: { [recipientId]: 0 }
        });
        conversationId = conv.id;
      }

      // Navigate to messages with conversation pre-selected
      navigate(createPageUrl(`Messages?conversation=${conversationId}`));
      toast.success('Conversation started!');
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
      style={variant === 'default' ? {
        background: '#F2F4F7',
        color: '#0F1C2E'
      } : {}}
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