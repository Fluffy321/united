import React from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIChatBubble({ currentUser, isScrollingDown }) {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(createPageUrl('Messages'));
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