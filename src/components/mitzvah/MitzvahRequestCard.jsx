import React, { useEffect } from 'react';
import { Hand, MessageCircle, CheckCircle2, Clock, MapPin, Eye, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import StatusPipeline from './StatusPipeline';
import ThankYouBanner from './ThankYouBanner';

const CATEGORY_COLORS = {
  'Errand': 'bg-slate-700 text-white font-bold',
  'Lost & Found': 'bg-slate-600 text-white font-bold',
  'Quick Favor': 'bg-slate-700 text-white font-bold',
  'Tutoring': 'bg-slate-600 text-white font-bold',
  'Shabbat Help': 'bg-slate-700 text-white font-bold',
  'Other': 'bg-slate-600 text-white font-bold'
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
      base44.entities.MitzvahRequest.update(request.id, {
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
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      {/* Status pipeline — always visible */}
      <StatusPipeline status={normalizedStatus} />

      {/* Thank-you banner on fulfilled */}
      {(normalizedStatus === 'completed') && request.claimed_by_name && (
        <ThankYouBanner
          helperName={request.claimed_by_name}
          requesterName={!request.is_anonymous ? request.created_by_name : null}
        />
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className={`${CATEGORY_COLORS[request.category]} border-0 text-xs`}>
              {request.category}
            </Badge>
            {showDistance && formatDistance(request.distance) && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <MapPin className="w-3 h-3 mr-1" />
                {formatDistance(request.distance)}
              </Badge>
            )}
          </div>
          <h3 className="font-bold text-[15px] text-black">{request.title}</h3>
        </div>
        
        {isCompleted && (
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        )}
        {isClaimed && (
          <Clock className="w-6 h-6 text-amber-600" />
        )}
      </div>

      <p className="text-black text-sm mb-2 leading-relaxed font-bold">{request.description}</p>

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
        <div className="text-sm text-slate-500">
          {request.is_anonymous ? (
            <span>Anonymous • {timeAgo}</span>
          ) : (
            <span>{request.created_by_name} • {timeAgo}</span>
          )}
        </div>

        <div className="flex gap-2">
          {isOpen && !isRequester && (
            <Button 
              onClick={(e) => { e.stopPropagation(); onClaim(e, request); }}
              className="btn-primary !px-3 !py-1.5 !rounded-lg text-sm"
              size="sm"
            >
              <Hand className="w-4 h-4 mr-2" />
              I'll Help
            </Button>
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
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Completed
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}