import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

const boardEmojis = {
  help_needed: '🆘',
  events: '📅',
  dating: '💕',
  jobs: '💼',
  roommates: '🏠',
  kosher_food: '🍽️',
  all: '📋'
};

const boardMessages = {
  help_needed: 'No help requests yet. Be supportive—start a conversation.',
  events: 'No events scheduled. Create one to bring the community together!',
  dating: 'No posts yet. Take a chance—you never know!',
  jobs: 'No job postings yet. Share opportunities to help others.',
  roommates: 'No housing posts yet. Help someone find a home.',
  kosher_food: 'No food recommendations yet. Share your favorite spots!',
  all: 'No posts yet. Be the first to share something!'
};

export default function EmptyBoardState({ boardType, onCreatePost }) {
  const emoji = boardEmojis[boardType] || '📋';
  const message = boardMessages[boardType] || 'No posts yet';

  return (
    <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
      <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">{emoji}</span>
      </div>
      <p className="text-slate-600 font-medium mb-2">Nothing here yet</p>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">{message}</p>
      <Button 
        size="lg"
        className="bg-indigo-600 hover:bg-indigo-700"
        onClick={onCreatePost}
      >
        <Plus className="w-5 h-5 mr-2" />
        Be the First to Post
      </Button>
    </div>
  );
}