import React, { useEffect } from 'react';
import { Hand, MessageCircle, CheckCircle2, Clock, MapPin, Eye, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { dataService } from '@/services';
import StatusPipeline from './StatusPipeline';
import ThankYouBanner from './ThankYouBanner';

const CATEGORY_COLORS = {
  'Errand':       'bg-blue-100 text-blue-700',
  'Lost & Found': 'bg-amber-100 text-amber-700',
  'Quick Favor':  'bg-purple-100 text-purple-700',
  'Tutoring':     'bg-green-100 text-green-700',
  'Shabbat Help': 'bg-indigo-100 text-indigo-700',
  'Ride':         'bg-sky-100 text-sky-700',
  'Meal':         'bg-orange-100 text-orange-700',
  'Moving':       'bg-rose-100 text-rose-700',
  'Other':        'bg-slate-100 text-slate-600',
};

const CATEGORY_BG = {
  'Errand':       'bg-blue-50',
  'Lost & Found': 'bg-amber-50',
  'Quick Favor':  'bg-purple-50',
  'Tutoring':     'bg-green-50',
  'Shabbat Help': 'bg-indigo-50',
  'Ride':         'bg-sky-50',
  'Meal':         'bg-orange-50',
  'Moving':       'bg-rose-50',
  'Other':        'bg-slate-50',
};

const CATEGORY_EMOJI = {
  'Errand': '🛒', 'Lost & Found': '🔍', 'Quick Favor': '⚡',
  'Tutoring': '📚', 'Shabbat Help': '🕯️', 'Ride': '🚗',
  'Meal': '🍲', 'Moving': '📦', 'Other': '🤝',
};

export default function MitzvahRequestCard({ request, currentUser, onClaim, onMessage, onComplete, showDistance }) {
  const isOpen = request.status === 'open' || request.status === 'Open';
  const isClaimed = request.status === 'in_progress' || request.status === 'Claimed';
  const isCompleted = request.status === 'completed' || request.status === 'Completed';
  const isRequester = currentUser?.id === request.created_by_user_id;
  const isHelper = currentUser?.id === request.claimed_by_user_id;
  const timeAgo = formatDistanceToNow(new Date(request.created_date), { addSuffix: true });

  // Track view
  useEffect(() => {
    if (!isRequester && isOpen) {
      dataService.entities.MitzvahRequest.update(request.id, {
        views_count: (request.views_count || 0) + 1
      }).catch(() => {});
    }
  }, [request.id]);

  const formatDistance = (distance) => {
    if (!distance || distance >= 999) return null;
    if (distance < 0.5) return 'Nearby';
    return `${distance.toFixed(1)} mi`;
  };

  // Normalize status
  const normalizedStatus = request.status === 'Claimed' ? 'in_progress'
    : request.status === 'Completed' ? 'completed'
    : request.status;

  return (
    <div className={`rounded-2xl p-4 border hover:shadow-md transition-shadow ${CATEGORY_BG[request.category] || CATEGORY_BG['Other']}`} style={{ borderColor: 'rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {/* Status pipeline — always visible */}
      <StatusPipeline status={normalizedStatus} />

      {/* Thank-you banner on fulfilled */}
      {(normalizedStatus === 'completed') && request.claimed_by_name && (
        <ThankYouBanner
          helperName={request.claimed_by_name}
          requesterName={!request.is_anonymous ? request.created_by_name : null}
        />
      )}

      {/* Category + metadata row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[request.category] || CATEGORY_COLORS['Other']}`}>
          {CATEGORY_EMOJI[request.category] || '🤝'} {request.category}
        </span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />{timeAgo}
        </span>
        {showDistance && formatDistance(request.distance) && (
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />{formatDistance(request.distance)}
          </span>
        )}
        {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
        {isClaimed && <Clock className="w-4 h-4 text-amber-500 ml-auto" />}
      </div>

      <h3 className="font-bold text-[15px] text-slate-900 mb-1 leading-snug line-clamp-2">{request.title}</h3>
      <p className="text-slate-600 text-[13px] mb-2 leading-relaxed line-clamp-3">{request.description}</p>

      {/* Social proof signals */}
      {isOpen && (request.views_count > 0 || request.offers_count > 0) && (
        <div className="flex items-center gap-3 mb-2">
          {request.views_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Eye className="w-3 h-3" />{request.views_count} viewed
            </span>
          )}
          {request.offers_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <Users className="w-3 h-3" />{request.offers_count} offered help
            </span>
          )}
          {request.bump_count > 0 && (
            <span className="text-[11px] text-orange-500 font-semibold">🔔 Re-surfaced</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-[12px] text-slate-400">
          {request.is_anonymous ? 'Anonymous' : request.created_by_name}
        </div>

        <div className="flex gap-2">
          {isOpen && !isRequester && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaim(e, request); }}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Hand className="w-3.5 h-3.5" />
              I'll Help
            </button>
          )}

          {isClaimed && (isRequester || isHelper) && (
            <>
              <Button 
                onClick={(e) => { e.stopPropagation(); onMessage(request); }}
                variant="outline"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              
              {isRequester && (
                <Button 
                  onClick={() => onComplete(request)}
                  className="btn-primary !px-3 !py-1.5 !rounded-lg text-sm"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              )}
            </>
          )}

          {isCompleted && (
            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
              Completed
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}