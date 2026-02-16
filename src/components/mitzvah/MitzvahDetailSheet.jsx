import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hand, MessageCircle, CheckCircle2, Clock, MapPin, AlertCircle, X, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORY_COLORS = {
  'Errand': 'bg-blue-600 text-white',
  'Lost & Found': 'bg-purple-600 text-white',
  'Quick Favor': 'bg-green-600 text-white',
  'Tutoring': 'bg-yellow-500 text-white',
  'Shabbat Help': 'bg-indigo-600 text-white',
  'Other': 'bg-slate-600 text-white'
};

export default function MitzvahDetailSheet({ request, currentUser, open, onClose, onRefresh }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const isRequester = currentUser?.id === request?.created_by_user_id;
  const isHelper = currentUser?.id === request?.claimed_by_user_id;
  const isOpen = request?.status === 'open' || request?.status === 'Open';
  const isInProgress = request?.status === 'in_progress' || request?.status === 'InProgress';
  const isCompleted = request?.status === 'completed' || request?.status === 'Completed';
  const isCancelled = request?.status === 'cancelled' || request?.status === 'Cancelled';

  const calculateDistance = () => {
    if (!currentUser?.location_lat || !request?.approxLat) return null;
    const R = 3959;
    const dLat = (request.approxLat - currentUser.location_lat) * Math.PI / 180;
    const dLon = (request.approxLng - currentUser.location_lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currentUser.location_lat * Math.PI / 180) * Math.cos(request.approxLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    if (distance < 0.5) return 'Nearby';
    return `${distance.toFixed(1)} mi away`;
  };

  const handleIllHelp = async () => {
    setIsProcessing(true);
    try {
      // Check if help offer already exists
      const existingOffers = await base44.entities.HelpOffer.filter({ 
        request_id: request.id,
        helper_user_id: currentUser.id 
      });

      if (existingOffers.length > 0) {
        toast.error('You\'ve already offered to help with this');
        setIsProcessing(false);
        return;
      }

      // Get or create conversation
      let conversation;
      const existingConversations = await base44.entities.Conversation.filter({
        participant_ids: { $all: [currentUser.id, request.created_by_user_id] },
        request_id: request.id
      });

      if (existingConversations.length > 0) {
        conversation = existingConversations[0];
      } else {
        const [requester] = await base44.entities.User.filter({ id: request.created_by_user_id });
        conversation = await base44.entities.Conversation.create({
          participant_ids: [currentUser.id, request.created_by_user_id],
          participant_names: [currentUser.display_name, requester.display_name],
          participant_ages: [currentUser.age_range, requester.age_range],
          last_message: '',
          last_message_at: new Date().toISOString(),
          request_id: request.id
        });
      }

      // Create help offer
      await base44.entities.HelpOffer.create({
        request_id: request.id,
        helper_user_id: currentUser.id,
        helper_name: currentUser.display_name,
        status: 'active',
        conversation_id: conversation.id
      });

      // Update request status
      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'in_progress',
        claimed_by_user_id: currentUser.id,
        claimed_by_name: currentUser.display_name
      });

      // Send auto message
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        sender_name: currentUser.display_name,
        sender_age_range: currentUser.age_range,
        recipient_id: request.created_by_user_id,
        content: `Hi! I'm available to help with "${request.title}". What details do you need from me?`,
        is_read: false
      });

      // Update conversation
      await base44.entities.Conversation.update(conversation.id, {
        last_message: `Hi! I'm available to help...`,
        last_message_at: new Date().toISOString()
      });

      // Send notification
      try {
        await base44.functions.invoke('sendMitzvahNotification', {
          type: 'help_accepted',
          recipientId: request.created_by_user_id,
          helperName: currentUser.display_name,
          requestTitle: request.title
        });
      } catch (error) {
        console.error('Notification failed:', error);
      }

      toast.success('You\'ve offered to help! Opening chat...');
      onRefresh?.();
      onClose();
      navigate(createPageUrl('Messages') + `?conversation=${conversation.id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to offer help');
    }
    setIsProcessing(false);
  };

  const handleMarkComplete = async () => {
    setIsProcessing(true);
    try {
      const [offer] = await base44.entities.HelpOffer.filter({
        request_id: request.id,
        helper_user_id: currentUser.id
      });

      if (offer) {
        await base44.entities.HelpOffer.update(offer.id, {
          completed_by_helper: true
        });
        toast.success('Marked as completed. Waiting for requester confirmation.');
      }
    } catch (error) {
      toast.error('Failed to mark complete');
    }
    setIsProcessing(false);
  };

  const handleConfirmComplete = async () => {
    setIsProcessing(true);
    try {
      // Update request
      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      // Award points
      await base44.entities.MitzvahAction.create({
        user_id: request.claimed_by_user_id,
        user_name: request.claimed_by_name,
        request_id: request.id,
        request_title: request.title,
        points_awarded: 10
      });

      const [points] = await base44.entities.MitzvahPoints.filter({ user_id: request.claimed_by_user_id });
      if (points) {
        await base44.entities.MitzvahPoints.update(points.id, {
          total_points: points.total_points + 10
        });
      } else {
        await base44.entities.MitzvahPoints.create({
          user_id: request.claimed_by_user_id,
          user_name: request.claimed_by_name,
          total_points: 10
        });
      }

      // Update offer
      const [offer] = await base44.entities.HelpOffer.filter({ request_id: request.id });
      if (offer) {
        await base44.entities.HelpOffer.update(offer.id, { status: 'completed' });
      }

      // Send completion notification to helper
      try {
        await base44.functions.invoke('sendMitzvahNotification', {
          type: 'mitzvah_completed',
          recipientId: request.claimed_by_user_id,
          helperName: request.claimed_by_name,
          requestTitle: request.title
        });
      } catch (error) {
        console.error('Notification failed:', error);
      }

      toast.success('Mitzvah completed! Helper earned 10 points ✨');
      onRefresh?.();
      onClose();
    } catch (error) {
      toast.error('Failed to confirm completion');
    }
    setIsProcessing(false);
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'cancelled'
      });
      toast.success('Request cancelled');
      onRefresh?.();
      onClose();
    } catch (error) {
      toast.error('Failed to cancel');
    }
    setIsProcessing(false);
  };

  const handleReopen = async () => {
    setIsProcessing(true);
    try {
      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'open',
        claimed_by_user_id: null,
        claimed_by_name: null
      });
      toast.success('Request reopened');
      onRefresh?.();
      onClose();
    } catch (error) {
      toast.error('Failed to reopen');
    }
    setIsProcessing(false);
  };

  const handleReport = async () => {
    try {
      await base44.entities.Report.create({
        reporter_id: currentUser.id,
        reported_content_id: request.id,
        content_type: 'request',
        reason: 'safety_concern',
        details: 'Reported from mitzvah detail view'
      });
      toast.success('Report submitted. Our team will review it.');
      onClose();
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  const handleReportUser = async () => {
    try {
      await base44.entities.Report.create({
        reporter_id: currentUser.id,
        reported_content_id: request.created_by_user_id,
        content_type: 'user',
        reason: 'safety_concern',
        details: 'Reported from mitzvah request'
      });
      toast.success('User reported. Our team will review it.');
      onClose();
    } catch (error) {
      toast.error('Failed to report user');
    }
  };

  const handleMessage = async () => {
    const otherUserId = isRequester ? request.claimed_by_user_id : request.created_by_user_id;
    const [conversation] = await base44.entities.Conversation.filter({
      participant_ids: { $all: [currentUser.id, otherUserId] },
      request_id: request.id
    });
    
    if (conversation) {
      navigate(createPageUrl('Messages') + `?conversation=${conversation.id}`);
    }
  };

  if (!request) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className={`${CATEGORY_COLORS[request.category]} mb-2`}>
                {request.category}
              </Badge>
              <SheetTitle className="text-xl mb-2">{request.title}</SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Status Badge */}
          {isInProgress && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">In Progress</span>
            </div>
          )}
          {isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Completed</span>
            </div>
          )}
          {isCancelled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">Cancelled</span>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Details</h3>
            <p className="text-slate-700 leading-relaxed">{request.description}</p>
          </div>

          {/* Location & Time */}
          <div className="flex flex-wrap gap-3">
            {request.locationLabel && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span>{request.locationLabel}</span>
                {calculateDistance() && (
                  <Badge variant="outline" className="ml-1">{calculateDistance()}</Badge>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>Posted {formatDistanceToNow(new Date(request.created_date), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Requester Info */}
          <div className="border-t pt-4">
            <p className="text-sm text-slate-600">
              Requested by: <span className="font-medium text-slate-900">
                {request.is_anonymous ? 'Anonymous' : request.created_by_name}
              </span>
            </p>
          </div>

          {/* Safety Note */}
          {isOpen && !isRequester && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Safety first:</strong> Exact addresses are shared only after you accept. Always meet in public if unsure.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-4">
            {isOpen && !isRequester && (
              <Button 
                onClick={handleIllHelp}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                <Hand className="w-5 h-5 mr-2" />
                {isProcessing ? 'Processing...' : 'I\'ll Help'}
              </Button>
            )}

            {isInProgress && (isRequester || isHelper) && (
              <Button 
                onClick={handleMessage}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Open Chat
              </Button>
            )}

            {isInProgress && isHelper && (
              <Button 
                onClick={handleMarkComplete}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark as Completed
              </Button>
            )}

            {isInProgress && isRequester && (
              <Button 
                onClick={handleConfirmComplete}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirm Completed
              </Button>
            )}

            {isRequester && (isOpen || isCancelled) && (
              <div className="flex gap-2">
                {isOpen && (
                  <Button 
                    onClick={handleCancel}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel Request
                  </Button>
                )}
                {isCancelled && (
                  <Button 
                    onClick={handleReopen}
                    disabled={isProcessing}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Reopen Request
                  </Button>
                )}
              </div>
            )}

            {!isRequester && (
              <div className="space-y-2">
                <Button 
                  onClick={handleReport}
                  variant="ghost"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report Request
                </Button>
                <Button 
                  onClick={handleReportUser}
                  variant="ghost"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report User
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}