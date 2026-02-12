import React from 'react';
import { Home, User, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ShabbatBanner({ onCreatePost }) {
  const today = new Date().getDay();
  const isThursdayOrFriday = today === 4 || today === 5;

  if (!isThursdayOrFriday) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🕯️</span>
        <h3 className="font-bold text-amber-900 text-sm">Shabbat Shalom!</h3>
      </div>
      
      <p className="text-xs text-amber-800 mb-3">
        Connect with your community before Shabbat
      </p>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-white hover:bg-amber-50 border-amber-300 text-amber-900 text-xs h-8"
          onClick={onCreatePost}
        >
          <Home className="w-3 h-3 mr-1" />
          Who's hosting?
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-white hover:bg-amber-50 border-amber-300 text-amber-900 text-xs h-8"
          onClick={onCreatePost}
        >
          <User className="w-3 h-3 mr-1" />
          Need a meal?
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-white hover:bg-amber-50 border-amber-300 text-amber-900 text-xs h-8"
          onClick={onCreatePost}
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Anyone free?
        </Button>
      </div>
    </div>
  );
}