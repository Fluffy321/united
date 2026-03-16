import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowLeft, MoreVertical, Flag, Ban, CheckCircle2, HandHeart, Bot, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import FileAttachmentButton from '@/components/common/FileAttachmentButton';
import { AttachmentPreview, PendingAttachmentChip } from '@/components/common/FileAttachmentPreview';
import { AI_AGENT, isAIConversation, loadAIMessages, saveAIMessages, getAIReply } from '@/lib/aiAgent';

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

  const getOtherParticipant = () => {
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
      // Load from localStorage for AI chats
      const saved = loadAIMessages(currentUser.id);
      setMessages(saved);
      setIsLoading(false);
      return;
    }

    loadMessages();
    markAsRead();
    loadMitzvahContext();

    // Subscribe to new messages in this conversation
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data.conversation_id === conversation.id) {
        setMessages(prev => {
          // Avoid duplicates
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
    const data = await base44.entities.Message.filter({ conversation_id: conversation.id }, 'created_date');
    setMessages(data);
    if (!silent) setIsLoading(false);
  };

  const markAsRead = async () => {
    const unreadCount = { ...conversation.unread_count, [currentUser.id]: 0 };
    await base44.entities.Conversation.update(conversation.id, { unread_count: unreadCount });
  };

  const loadMitzvahContext = async () => {
    if (conversation.request_id) {
      try {
        const [request] = await base44.entities.MitzvahRequest.filter({ id: conversation.request_id });
        setMitzvahRequest(request || null);

        if (request) {
          const [offer] = await base44.entities.HelpOffer.filter({ request_id: request.id });
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
      await base44.entities.HelpOffer.update(helpOffer.id, {
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
      await base44.entities.MitzvahRequest.update(mitzvahRequest.id, {
        status: 'Completed',
        completed_at: new Date().toISOString()
      });

      // Award points
      await base44.entities.MitzvahAction.create({
        user_id: mitzvahRequest.claimed_by_user_id,
        user_name: mitzvahRequest.claimed_by_name,
        request_id: mitzvahRequest.id,
        request_title: mitzvahRequest.title,
        points_awarded: 10
      });

      const [points] = await base44.entities.MitzvahPoints.filter({ user_id: mitzvahRequest.claimed_by_user_id });
      if (points) {
        await base44.entities.MitzvahPoints.update(points.id, {
          total_points: points.total_points + 10
        });
      } else {
        await base44.entities.MitzvahPoints.create({
          user_id: mitzvahRequest.claimed_by_user_id,
          user_name: mitzvahRequest.claimed_by_name,
          total_points: 10
        });
      }

      // Update offer
      await base44.entities.HelpOffer.update(helpOffer.id, { status: 'completed' });

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

    const msg = await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name || currentUser.full_name?.split(' ')[0],
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

    await base44.entities.Conversation.update(conversation.id, {
      last_message: text,
      last_message_at: new Date().toISOString(),
      unread_count: unreadCount
    });

    setIsSending(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold overflow-hidden">
          {isAI ? (
            <Bot className="w-5 h-5 text-white" />
          ) : other.avatar ? (
            <img src={other.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            other.name?.charAt(0)?.toUpperCase()
          )}
        </div>
        
        <div className="flex-1">
          <span className="font-semibold text-slate-900 text-[16px]">{other.name}</span>
          {isAI && <p className="text-[11px] text-indigo-500 font-medium">AI Assistant • Always available</p>}
        </div>

        {!isAI && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            {isAI ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <p className="font-semibold text-slate-800">United AI Assistant</p>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">Ask me about local events, shuls, schools, chesed opportunities, or anything about the Five Towns community!</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4 mb-4">
                  {["What's happening this Shabbat?", "Find local chesed opportunities", "Recommend a shul near me"].map(s => (
                    <button key={s} onClick={() => setNewMessage(s)} className="text-[12px] px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">Or type your own question below ↓</p>
              </div>
            ) : (
              <p className="text-slate-500">Start the conversation!</p>
            )}
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_id === currentUser.id;
            const isAIMsg = msg.sender_id === AI_AGENT.id;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {isAIMsg && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    isOwn 
                      ? 'text-white rounded-br-md' 
                      : 'bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100'
                  }`}
                  style={isOwn ? { background: '#2563EB' } : {}}>
                    {msg.content && !msg.attachment && <p className="text-[15px] leading-relaxed">{msg.content}</p>}
                   {msg.attachment && (
                     <div className={msg.content && msg.content !== `📎 ${msg.attachment.name}` ? 'mt-2' : ''}>
                       {msg.content && msg.content !== `📎 ${msg.attachment.name}` && (
                         <p className="text-[15px] leading-relaxed mb-2">{msg.content}</p>
                       )}
                       <AttachmentPreview attachment={msg.attachment} compact />
                     </div>
                   )}
                  </div>
                  <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                    {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {/* AI thinking indicator */}
        {aiThinking && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-800 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 px-4 py-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span className="text-[14px] text-slate-500 italic">United AI is thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Completion Actions */}
      {mitzvahRequest && mitzvahRequest.status === 'InProgress' && (
        <div className="px-4 py-3 bg-white border-t border-slate-100">
          {currentUser.id === mitzvahRequest.claimed_by_user_id && !helpOffer?.completed_by_helper && (
            <Button
              onClick={handleMarkCompleted}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Mark as Completed'}
            </Button>
          )}
          
          {currentUser.id === mitzvahRequest.created_by_user_id && helpOffer?.completed_by_helper && (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                <p className="text-xs text-green-900">
                  <strong>{mitzvahRequest.claimed_by_name}</strong> marked this as completed. Please confirm!
                </p>
              </div>
              <Button
                onClick={handleConfirmCompleted}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Confirm Completed'}
              </Button>
            </div>
          )}

          {currentUser.id === mitzvahRequest.created_by_user_id && !helpOffer?.completed_by_helper && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-900">
                Waiting for helper to mark this as completed.
              </p>
            </div>
          )}
        </div>
      )}

      {mitzvahRequest && mitzvahRequest.status === 'Completed' && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-100">
          <div className="flex items-center gap-2 justify-center text-green-900">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">Mitzvah Completed!</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-white">
        {pendingAttachment && (
          <div className="mb-2">
            <PendingAttachmentChip attachment={pendingAttachment} onRemove={() => setPendingAttachment(null)} />
          </div>
        )}
        <div className="flex gap-2 items-end">
          <FileAttachmentButton onAttached={setPendingAttachment} />
          <textarea
            rows={1}
            placeholder="Type a message…"
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
            disabled={(!newMessage.trim() && !pendingAttachment) || isSending}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all"
            style={{ background: '#2563EB' }}
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}