import React from 'react';
import { Hand, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_COLORS = {
  'Errand': 'bg-blue-600 text-white font-bold',
  'Lost & Found': 'bg-purple-600 text-white font-bold',
  'Quick Favor': 'bg-green-600 text-white font-bold',
  'Tutoring': 'bg-yellow-500 text-white font-bold',
  'Shabbat Help': 'bg-indigo-600 text-white font-bold',
  'Other': 'bg-slate-600 text-white font-bold'
};

export default function MitzvahRequestCard({ request, currentUser, onClaim, onMessage, onComplete }) {
  const isOpen = request.status === 'Open';
  const isClaimed = request.status === 'Claimed';
  const isCompleted = request.status === 'Completed';
  const isRequester = currentUser?.id === request.created_by_user_id;
  const isHelper = currentUser?.id === request.claimed_by_user_id;
  const timeAgo = formatDistanceToNow(new Date(request.created_date), { addSuffix: true });

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <Badge className={`${CATEGORY_COLORS[request.category]} border-0 mb-1.5 text-xs`}>
            {request.category}
          </Badge>
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
              onClick={() => onClaim(request)}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="sm"
            >
              <Hand className="w-4 h-4 mr-2" />
              I'll Help
            </Button>
          )}

          {isClaimed && (isRequester || isHelper) && (
            <>
              <Button 
                onClick={() => onMessage(isRequester ? request.claimed_by_user_id : request.created_by_user_id)}
                variant="outline"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              
              {isRequester && (
                <Button 
                  onClick={() => onComplete(request)}
                  className="bg-green-600 hover:bg-green-700"
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