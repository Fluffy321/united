import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Share2, MessageCircle, Flag, Ban } from 'lucide-react';

export default function ModernActionButtons({ isOwnProfile, onEditProfile, onMessage, onShare, onReport, onBlock }) {
  return (
    <div className="px-3 py-1.5 space-y-2">
      {isOwnProfile ? (
        <>
          <Button
            onClick={onEditProfile}
            className="w-full rounded-2xl bg-slate-950 py-3 font-black text-white shadow-sm transition-all duration-200 active:scale-95 gap-2 hover:bg-slate-900"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
          <Button
            onClick={onShare}
            variant="outline"
            className="w-full rounded-2xl border-slate-200 bg-white py-3 font-black text-slate-700 shadow-sm transition-all duration-200 active:scale-95 gap-2 hover:bg-slate-50"
          >
            <Share2 className="w-4 h-4" />
            Share Profile
          </Button>
        </>
      ) : (
        <div className="flex gap-3">
          <Button
            onClick={onMessage}
            className="flex-1 rounded-2xl bg-slate-950 py-3 font-black text-white shadow-sm transition-all duration-200 active:scale-95 gap-2 hover:bg-slate-900"
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </Button>
          <Button
            onClick={onShare}
            variant="outline"
            className="flex-1 rounded-2xl border-slate-200 bg-white py-3 font-black text-slate-700 shadow-sm transition-all duration-200 active:scale-95 gap-2 hover:bg-slate-50"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <div className="flex gap-1">
            <Button
              onClick={onReport}
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-2xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Report"
            >
              <Flag className="w-4 h-4" />
            </Button>
            <Button
              onClick={onBlock}
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-2xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Block"
            >
              <Ban className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
