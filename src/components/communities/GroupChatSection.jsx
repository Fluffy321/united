import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Loader2, Share2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import UserAvatar from '@/components/common/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { captureError } from '@/lib/analytics';
import { createCommunityGroupChat, filterCommunityGroupChat, subscribeCommunityGroupChat } from '@/services/entityServices';

export default function GroupChatSection({ communityId, currentUser, onInvite }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [searchParams] = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['community-chat', communityId],
    queryFn: () => filterCommunityGroupChat(
      { community_id: communityId },
      '-created_date',
      50
    ),
    enabled: !!communityId,
    staleTime: 5000,
    refetchInterval: 8000,
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchParams.get('focus') !== 'message') return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (!communityId) return;
    const unsubscribe = subscribeCommunityGroupChat((event) => {
      if (event.data?.community_id === communityId) {
        refetch();
      }
    });
    return unsubscribe;
  }, [communityId, refetch]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    setSending(true);
    try {
      await createCommunityGroupChat({
        community_id: communityId,
        author_id: currentUser.id,
        author_name: currentUser.display_name || currentUser.full_name,
        author_avatar_url: currentUser.avatar_url,
        message: message.trim(),
      });
      setMessage('');
      await refetch();
    } catch (error) {
      toast.error('Failed to send message');
      captureError(error, { context: 'GroupChatSection: send message' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="text-[13px] font-black text-slate-900">Group chat</p>
          <p className="truncate text-[11px] font-semibold text-slate-400">Invite people into this conversation</p>
        </div>
        {onInvite && (
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-slate-950 px-3 text-[12px] font-black text-white transition hover:bg-slate-800 active:scale-95"
          >
            <Share2 className="h-3.5 w-3.5" />
            Invite
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.slice().reverse().map((msg) => (
            <div key={msg.id} className="flex gap-2.5 group">
              <UserAvatar user={msg} name={msg.author_name} size="sm" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-slate-900">{msg.author_name}</span>
                  <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}</span>
                </div>
                <p className="text-sm text-slate-700 mt-0.5 break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      {currentUser ? (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say something..."
              className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 transition-colors"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-sm text-slate-500">
          Sign in to chat
        </div>
      )}
    </div>
  );
}
