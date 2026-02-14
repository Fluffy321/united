import React from 'react';
import { Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MitzvahSharePrompt({ onClose }) {
  const handleShare = () => {
    const shareUrl = window.location.origin;
    const shareText = "Join me in doing mitzvahs! Let's help our community together 💜";
    
    if (navigator.share) {
      navigator.share({ title: 'United Community', text: shareText, url: shareUrl })
        .then(() => toast.success('Shared!'))
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('Link copied to clipboard!');
    }
    onClose();
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 px-4">
      <div className="max-w-2xl mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Amazing! 🎉</h3>
            <p className="text-white/90 text-sm">Invite someone else to help do mitzvahs</p>
          </div>
          <Button 
            size="sm"
            onClick={handleShare}
            className="bg-white text-purple-600 hover:bg-white/90 gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}