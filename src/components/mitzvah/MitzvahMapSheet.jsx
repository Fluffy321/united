import React from 'react';
import { Hand, MapPin, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_COLORS = {
  'Errand': 'bg-blue-600 text-white font-bold',
  'Lost & Found': 'bg-purple-600 text-white font-bold',
  'Quick Favor': 'bg-green-600 text-white font-bold',
  'Tutoring': 'bg-yellow-500 text-white font-bold',
  'Shabbat Help': 'bg-indigo-600 text-white font-bold',
  'Other': 'bg-slate-600 text-white font-bold'
};

export default function MitzvahMapSheet({ request, onClose, onClaim, currentUser }) {
  if (!request) return null;

  const timeAgo = formatDistanceToNow(new Date(request.created_date), { addSuffix: true });
  const isRequester = currentUser?.id === request.created_by_user_id;

  const formatDistance = (distance) => {
    if (!distance || distance >= 999) return null;
    if (distance < 0.5) return 'Nearby';
    return `~${distance.toFixed(1)} mi`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
      >
        <div className="max-w-2xl mx-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${CATEGORY_COLORS[request.category]} border-0 text-xs`}>
                    {request.category}
                  </Badge>
                  {formatDistance(request.distance) && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      <MapPin className="w-3 h-3 mr-1" />
                      {formatDistance(request.distance)}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{request.title}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>{timeAgo}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-700 text-sm mb-4 leading-relaxed">
              {request.description}
            </p>

            {request.location_text && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{request.location_text}</span>
              </div>
            )}

            <div className="flex gap-3">
              {!isRequester && (
                <Button 
                  onClick={() => {
                    onClaim(request);
                    onClose();
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <Hand className="w-5 h-5 mr-2" />
                  I'll Help
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={onClose}
                size="lg"
                className={!isRequester ? '' : 'flex-1'}
              >
                Close
              </Button>
            </div>
          </div>

          {/* Safe area for iOS */}
          <div className="h-safe-area-inset-bottom bg-white" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}