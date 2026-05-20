import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowLeft, MoreVertical, Flag, Ban, CheckCircle2, HandHeart, Bot, Sparkles, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dataService, messagesService, checkRateLimit, RateLimitError } from '@/services';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import FileAttachmentButton from '@/components/common/FileAttachmentButton';
import { AttachmentPreview, PendingAttachmentChip } from '@/components/common/FileAttachmentPreview';
import { AI_AGENT, isAIConversation, loadAIMessages, saveAIMessages, getAIReply } from '@/lib/aiAgent';
import UserAvatar from '@/components/common/UserAvatar';

export default function ChatView({ conversation, currentUser, onBack, onReport, onBlock }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [mitzvahRequest, setMitzvahRequest] = useState(null);
  const [helpOffer, setHelpOffer] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const isAI = isAIConversation(conversation);
  const isCommunityChat = !!conversation.is_community_chat;

  const getOtherParticipant = () => {
    if (isCommunityChat) {
      return {
        id: `community-${conversation.community_id}`,
        name: conversation.community_name,
        avatar: conversation.community_logo || null,
        isCommunity: true,
        memberCount: conversation.member_count || 0,
      };
    }
    const idx = conversation.participant_ids?.indexOf(currentUser.id);
    const otherIdx = idx === 0 ? 1 : 0;
    return {
      id: conversation.participant_ids?.[otherIdx],
      name: conversation.participant_names?.[otherIdx] || 'Unknown',
      age: conversation.participant_ages?.[otherIdx] || '18+',
      avatar: conversation.participant_avatars?.[otherIdx] || null
    };
  };

  const other = getOtherParticipant();

  useEffect(() => {
    if (isAI) {
      const saved = loadAIMessages(currentUser.id);
      setMessages(saved);
      setIsLoading(false);
      return;
    }

    loadMessages();
    if (!isCommunityChat) {
      markAsRead();
      loadMitzvahContext();
    }

    const unsubscribe = messagesService.subscribeToMessages((event) => {
      if (event.type === 'create' && event.data.conversation_id === conversation.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
      }
    });

    return unsubscribe;
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await messagesService.listMessages(conversation.id, 'created_date');
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      if (!conversation?.id) return;
      const unreadCount = { ...conversation.unread_count, [currentUser.id]: 0 };
      await messagesService.updateConversation(conversation.id, { unread_count: unreadCount });
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const loadMitzvahContext = async () => {
    if (conversation.request_id) {
      try {
        const [request] = await dataService.entities.MitzvahRequest.filter({ id: conversation.request_id });
        setMitzvahRequest(request || null);

        if (request) {
          const [offer] = await dataService.entities.HelpOffer.filter({ request_id: request.id });
          setHelpOffer(offer || null);
        }
      } catch (error) {
        console.error('Failed to load mitzvah context:', error);
      }
    }
  };

  const handleMarkCompleted = async () => {
    if (!helpOffer || !mitzvahRequest) return;
    
    setIsProcessing(true);
    try {
      await dataService.entities.HelpOffer.update(helpOffer.id, {
        completed_by_helper: true
      });
      
      toast.success('Marked as completed. Waiting for requester confirmation.');
      loadMitzvahContext();
    } catch (error) {
      toast.error('Failed to mark as completed');
    }
    setIsProcessing(false);
  };

  const handleConfirmCompleted = async () => {
    if (!mitzvahRequest || !helpOffer) return;
    
    setIsProcessing(true);
    try {
      // Update request status
      await dataService.entities.MitzvahRequest.update(mitzvahRequest.id, {
        status: 'Completed',
        completed_at: new Date().toISOString()
      });

      // Award points
      await dataService.entities.MitzvahAction.create({
        user_id: mitzvahRequest.claimed_by_user_id,
        user_name: mitzvahRequest.claimed_by_name,
        request_id: mitzvahRequest.id,
        request_title: mitzvahRequest.title,
        points_awarded: 10
      });

      const [points] = await dataService.entities.MitzvahPoints.filter({ user_id: mitzvahRequest.claimed_by_user_id });
      if (points) {
        await dataService.entities.MitzvahPoints.update(points.id, {
          total_points: points.total_points + 10
        });
      } else {
        await dataService.entities.MitzvahPoints.create({
          user_id: mitzvahRequest.claimed_by_user_id,
          user_name: mitzvahRequest.claimed_by_name,
          total_points: 10
        });
      }

      // Update offer
      await dataService.entities.HelpOffer.update(helpOffer.id, { status: 'completed' });

      toast.success('Mitzvah completed! Helper earned 10 points ✨');
      loadMitzvahContext();
    } catch (error) {
      toast.error('Failed to confirm completion');
    }
    setIsProcessing(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !pendingAttachment) return;

    const text = newMessage.trim();
    const attachment = pendingAttachment;
    setNewMessage('');
    setPendingAttachment(null);

    // AI conversation — local messages + InvokeLLM
    if (isAI) {
      const userMsg = {
        id: `user-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        sender_name: currentUser.display_name || currentUser.full_name,
        recipient_id: AI_AGENT.id,
        content: text,
        created_date: new Date().toISOString(),
      };
      const updated = [...messages, userMsg];
      setMessages(updated);
      saveAIMessages(currentUser.id, updated);

      setAiThinking(true);
       try {
         // Wait 1-2 seconds for typing animation effect
         await new Promise(resolve => setTimeout(resolve, 1500));
         const reply = await getAIReply(text, currentUser, updated);
         const aiMsg = {
           id: `ai-${Date.now()}`,
           conversation_id: conversation.id,
           sender_id: AI_AGENT.id,
           sender_name: AI_AGENT.full_name,
           recipient_id: currentUser.id,
           content: reply,
           created_date: new Date().toISOString(),
         };
         const withReply = [...updated, aiMsg];
         setMessages(withReply);
         saveAIMessages(currentUser.id, withReply);
       } catch {
         toast.error('AI failed to respond, try again.');
       }
       setAiThinking(false);
      return;
    }

    setIsSending(true);

    try {
      await checkRateLimit('send_message');

      const msg = await messagesService.createMessage({
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        sender_name: currentUser.display_name || currentUser.full_name?.split(' ')[0],
        sender_avatar_url: currentUser.avatar_url || null,
        sender_age_range: currentUser.age_range || '18+',
        recipient_id: other.id,
        content: text || (attachment ? `📎 ${attachment.name}` : ''),
        attachment: attachment || null,
      });

      // Optimistically append
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);

      const unreadCount = {
        ...conversation.unread_count,
        [other.id]: (conversation.unread_count?.[other.id] || 0) + 1
      };

      await messagesService.updateConversation(conversation.id, {
        last_message: text || (attachment ? `📎 ${attachment.name}` : ''),
        last_message_at: new Date().toISOString(),
        unread_count: unreadCount
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        toast.error(error.message);
      } else {
        setNewMessage(text);
        setPendingAttachment(attachment);
        toast.error(error?.message || 'Message failed to send. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white flex-shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar — matches ConversationList styling */}
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden font-bold text-white shadow-sm ${
            isAI ? 'h-10 w-10 rounded-2xl' : isCommunityChat ? 'h-10 w-10 rounded-xl' : 'h-10 w-10 rounded-full'
          }`}
          style={{
            background: isAI
              ? 'linear-gradient(135deg, #2563EB, #0F172A)'
              : isCommunityChat
              ? 'linear-gradient(135deg, #0EA5E9, #2563EB)'
              : 'linear-gradient(135deg, #2563EB, #0F172A)',
          }}
        >
          {isAI ? (
            <Bot className="w-5 h-5 text-white" />
          ) : isCommunityChat ? (
            other.avatar
              ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
              : <Users className="w-5 h-5 text-white" />
          ) : other.avatar ? (
            <img src={other.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[15px]">{other.name?.charAt(0)?.toUpperCase()}</span>
          )}
          {isAI && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-amber-400">
              <Sparkles className="h-2 w-2 text-white" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-slate-900">{other.name}</p>
          {isAI && <p className="text-[11px] font-semibold text-amber-500">AI Assistant</p>}
          {isCommunityChat && (
            <p className="text-[11px] font-medium text-slate-400">
              {other.memberCount?.toLocaleString()} members
            </p>
          )}
        </div>

        {!isAI && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 active:scale-95">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onReport(other.id, 'user')}>
                <Flag className="w-4 h-4 mr-2" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBlock(other.id)} className="text-red-600">
                <Ban className="w-4 h-4 mr-2" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Mitzvah Context Banner */}
        {mitzvahRequest && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-3">
            <div className="flex items-start gap-2">
              <HandHeart className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-900">{mitzvahRequest.title}</p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Status: {mitzvahRequest.status === 'InProgress' ? 'In Progress' : mitzvahRequest.status}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="min-h-full p-4 space-y-3 bg-[#F6F8FB]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              {isCommunityChat ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-4 shadow-md">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-bold text-slate-800 text-[15px]">{other.name}</p>
                  <p className="text-[13px] text-slate-500 mt-1 max-w-xs">Say hello to your community!</p>
                </>
              ) : isAI ? (
                <>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-900 flex items-center justify-center mb-4 shadow-md">
                    <Bot className="w-8 h-8 text-white" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-400 shadow">
                      <Sparkles className="h-3 w-3 text-white" />
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-[15px]">United AI Assistant</p>
                  <p className="text-[13px] text-slate-500 mt-1 max-w-[240px]">Ask me anything about your community, events, or local resources.</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-5">
                    {[
                      "What's happening this Shabbat?",
                      "Find local chesed opportunities",
                      "Help me find a carpool",
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => setNewMessage(s)}
                        className="text-[12px] px-3 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-slate-800 flex items-center justify-center mb-3 shadow-md">
                    <span className="text-[22px] font-black text-white">{other.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <p className="font-bold text-slate-800">{other.name}</p>
                  <p className="text-[13px] text-slate-400 mt-1">Start the conversation</p>
                </>
              )}
            </div>
          ) : (
            messages.map(msg => {
              const isOwn = msg.sender_id === currentUser.id;
              const isAIMsg = msg.sender_id === AI_AGENT.id;
              const senderAvatar = isOwn
                ? { ...currentUser, display_name: msg.sender_name || currentUser.display_name }
                : { avatar_url: msg.sender_avatar_url || msg.sender_avatar || other.avatar, display_name: msg.sender_name || other.name };
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {isAIMsg ? (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : !isOwn && (
                    <UserAvatar user={senderAvatar} name={senderAvatar.display_name} size="sm" className="mb-5" />
                  )}
                  <div className={`max-w-[76%] ${isOwn ? 'order-2' : ''}`}>
                    <div className={`px-4 py-2.5 text-[14px] leading-relaxed ${
                      isOwn
                        ? 'rounded-2xl rounded-br-sm bg-blue-600 text-white'
                        : 'rounded-2xl rounded-bl-sm bg-white text-slate-800 shadow-sm border border-slate-100'
                    }`}>
                      {msg.content && !msg.attachment && <p>{msg.content}</p>}
                      {msg.attachment && (
                        <div className={msg.content && msg.content !== `📎 ${msg.attachment.name}` ? 'mt-2' : ''}>
                          {msg.content && msg.content !== `📎 ${msg.attachment.name}` && (
                            <p className="mb-2">{msg.content}</p>
                          )}
                          <AttachmentPreview attachment={msg.attachment} compact />
                        </div>
                      )}
                    </div>
                    <p className={`text-[11px] text-slate-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                      {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  {isOwn && (
                    <UserAvatar user={senderAvatar} name={senderAvatar.display_name} size="sm" className="order-3 mb-5" />
                  )}
                </div>
              );
            })
          )}
          {/* AI thinking indicator */}
          {aiThinking && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 px-4 py-3 flex items-center gap-2">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-[13px] text-slate-400">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mitzvah Completion Actions */}
      {mitzvahRequest && mitzvahRequest.status === 'InProgress' && (
        <div className="flex-shrink-0 space-y-2 border-t border-slate-100 bg-white px-4 py-3 text-center text-xs">
          {currentUser.id === mitzvahRequest.claimed_by_user_id && !helpOffer?.completed_by_helper && (
            <button
              onClick={handleMarkCompleted}
              disabled={isProcessing}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark as Completed
            </button>
          )}
          {currentUser.id === mitzvahRequest.created_by_user_id && helpOffer?.completed_by_helper && (
            <>
              <p className="rounded-xl bg-emerald-50 p-2 text-emerald-900">
                <strong>{mitzvahRequest.claimed_by_name}</strong> marked as completed
              </p>
              <button
                onClick={handleConfirmCompleted}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                Confirm Completed
              </button>
            </>
          )}
          {currentUser.id === mitzvahRequest.created_by_user_id && !helpOffer?.completed_by_helper && (
            <p className="rounded-xl bg-amber-50 p-2 text-amber-900">Waiting for helper to confirm…</p>
          )}
        </div>
      )}
      {mitzvahRequest && mitzvahRequest.status === 'Completed' && (
        <div className="flex-shrink-0 px-3 py-2 bg-green-50 border-t border-green-100 flex items-center justify-center gap-1 text-xs text-green-900">
          <CheckCircle2 className="w-3 h-3" /> Mitzvah Completed!
        </div>
      )}

      {/* Input Bar */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white p-3">
        {pendingAttachment && (
          <div className="mb-2">
            <PendingAttachmentChip attachment={pendingAttachment} onRemove={() => setPendingAttachment(null)} />
          </div>
        )}
        <div className="flex gap-2 items-end">
          <FileAttachmentButton onAttached={setPendingAttachment} />
          <textarea
            rows={1}
            placeholder={isAI ? 'Ask the AI assistant…' : isCommunityChat ? 'Message the community…' : 'Type a message…'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-[14px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400 max-h-28 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !pendingAttachment) || isSending || aiThinking}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all"
            style={{ background: isAI ? 'linear-gradient(135deg, #2563EB, #0F172A)' : '#2563EB' }}
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
