import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { AI_AGENT, loadAIMessages, saveAIMessages, getAIReply } from '@/lib/aiAgent';

export default function AIChatBubble({ currentUser, isScrollingDown }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);

  const handleOpen = () => {
    if (!isOpen) {
      const saved = loadAIMessages(currentUser.id);
      setMessages(saved);
    }
    setIsOpen(!isOpen);
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
    <>
      {/* Chat Bubble */}
      {isOpen && (
        <div className={`fixed bottom-28 right-6 w-80 bg-white rounded-2xl shadow-2xl flex flex-col z-40 h-96 transition-transform duration-300 ${isScrollingDown ? 'translate-y-96' : 'translate-y-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900 text-sm">United AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-2">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <p className="text-[12px] text-slate-600 font-medium">Ask me anything!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isOwn = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-[12px] ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            {aiThinking && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-600 rounded-lg px-3 py-2 text-[12px] border border-slate-200">
                  <span className="inline-block">Thinking</span>
                  <span className="inline-block ml-1 animate-pulse">•••</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3 flex gap-2 flex-shrink-0">
            <input
              type="text"
              placeholder="Ask something…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 text-[12px] px-2.5 py-1.5 bg-slate-100 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || aiThinking}
              className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-90 transition-all"
            >
              {aiThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {/* FAB Button — Only show on Feed page */}
      {!isOpen && (typeof window !== 'undefined' && window.location.pathname.includes('Feed')) && (
        <button
          onClick={handleOpen}
          className={`fixed bottom-48 right-6 w-12 h-12 rounded-full bg-slate-700 text-white shadow-lg hover:shadow-xl active:scale-95 transition-transform duration-300 flex items-center justify-center z-40 text-xs font-semibold ${isScrollingDown ? 'translate-y-96' : 'translate-y-0'}`}
        >
          AI
        </button>
      )}
    </>
  );
}