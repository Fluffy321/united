import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DailyPromptCard({ prompt, onReply }) {
  if (!prompt) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg text-white mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6" />
        <Badge className="bg-white/20 text-white border-0">Daily Prompt</Badge>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 leading-relaxed">
        {prompt.question}
      </h2>
      
      <div className="flex items-center gap-3">
        <Button 
          onClick={onReply}
          className="bg-white text-indigo-600 hover:bg-white/90 font-semibold"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Reply
        </Button>
        
        <span className="text-white/90 text-sm">
          {prompt.replies_count || 0} {prompt.replies_count === 1 ? 'reply' : 'replies'}
        </span>
      </div>
    </div>
  );
}