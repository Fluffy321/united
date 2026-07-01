import React, { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { findOrCreateDirectConversation, checkRateLimit, RateLimitError } from '@/services';
import { notificationsService } from '@/services/notificationsService';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { canMessage } from '@/lib/messagingPermissions';

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
      // New conversation — server-side rate limit check
      await checkRateLimit('new_conversation');

      // Check messaging permission (marketplace listings relax the
      // shared-community default — see messagingPermissions.js)
      const { canMessage: allowed } = await canMessage(currentUser, recipientId, {
        context: postType === 'marketplace' ? 'marketplace' : undefined,
      });

      if (allowed) {
        const conv = await findOrCreateDirectConversation(currentUser, { id: recipientId, name: recipientName }, {
          request_id: postId || null,
          request_title: postTitle || null,
          request_type: postType,
        });
        if (postType === 'marketplace' && postId) {
          notificationsService.notifyMarketplaceMessage({
            sellerId: recipientId,
            buyerId: currentUser.id,
            buyerName: currentUser.display_name || currentUser.full_name || '',
            listingId: postId,
            listingTitle: postTitle,
          }).catch(() => {});
        }
        navigate(createPageUrl(`Messages?conversation=${conv.id}`));
        toast.success('Conversation started!');
      } else {
        toast.info('Messaging is available for friends or people who share a community with you.');
      }
    } catch (error) {
      if (error instanceof RateLimitError) { toast.error(error.message); return; }
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
