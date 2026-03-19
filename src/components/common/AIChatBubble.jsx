import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { AI_AGENT, loadAIMessages, saveAIMessages, getAIReply } from '@/lib/aiAgent';

export default function AIChatBubble({ currentUser, isScrollingDown }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const handleOpen = () => {
    navigate(createPageUrl('Messages'));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput('');

    const userMsg = {
      id: `user-${Date.now()}`,
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      const reply = await getAIReply(text, currentUser, updated);
      const aiMsg = {
        id: `ai-${Date.now()}`,
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
      toast.error('AI failed to respond');
    }
    setAiThinking(false);
  };

  return (
    <button
      onClick={handleOpen}
      className={`fixed bottom-28 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-transform duration-300 flex items-center justify-center z-40 ${isScrollingDown ? 'translate-y-96' : 'translate-y-0'}`}
    >
      <Sparkles className="w-6 h-6" />
    </button>
  );
}