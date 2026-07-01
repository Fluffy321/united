import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { storageService } from '@/services';
import { listPost } from '@/services/entityServices';

export default function ActivityIndicator({ currentUser }) {
  const [newPostsCount, setNewPostsCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const checkNewPosts = async () => {
      const lastCheck = storageService.getItem('lastPostCheck');
      const lastCheckTime = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 3600000);
      
      const allPosts = await listPost('-created_date', 50);
      const newPosts = allPosts.filter(p => new Date(p.created_date) > lastCheckTime);
      
      setNewPostsCount(newPosts.length);
    };

    checkNewPosts();
    const interval = setInterval(checkNewPosts, 60000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleClick = () => {
    storageService.setItem('lastPostCheck', new Date().toISOString());
    setNewPostsCount(0);
  };

  if (newPostsCount === 0) return null;

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg mb-4 mx-auto hover:shadow-xl transition-all animate-pulse"
    >
      <Sparkles className="w-4 h-4" />
      <span className="text-sm font-semibold">{newPostsCount} new posts near you</span>
    </button>
  );
}
