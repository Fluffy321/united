import React, { useState } from 'react';
import { X, MapPin, Clock, Hand, MessageCircle, CheckCircle2, AlertCircle, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORY_COLORS = {
  'Errand': 'bg-blue-100 text-blue-700',
  'Lost & Found': 'bg-purple-100 text-purple-700',
  'Quick Favor': 'bg-green-100 text-green-700',
  'Tutoring': 'bg-yellow-100 text-yellow-700',
  'Shabbat Help': 'bg-indigo-100 text-indigo-700',
  'Other': 'bg-slate-100 text-slate-600'
};

export default function RequestDetailOverlay({ request, currentUser, onClose, onRefresh }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  if (!request) return null;

  const isRequester = currentUser?.id === request.created_by_user_id;
  const isHelper = currentUser?.id === request.claimed_by_user_id;
  const isOpen = request.status === 'open';
  const isInProgress = request.status === 'in_progress';
  const isCompleted = request.status === 'completed';
  const isCancelled = request.status === 'cancelled';

  const handleIllHelp = async () => {
    setIsProcessing(true);
    try {
      const existingOffers = await base44.entities.HelpOffer.filter({
        request_id: request.id,
        helper_user_id: currentUser.id
      });
      if (existingOffers.length > 0) {
        toast.error("You've already offered to help with this");
        setIsProcessing(false);
        return;
      }

      const convs = await base44.entities.Conversation.filter({
        participant_ids: { $all: [currentUser.id, request.created_by_user_id] },
        request_id: request.id
      });

      let conversation;
      if (convs.length > 0) {
        conversation = convs[0];
      } else {
        const [requester] = await base44.entities.User.filter({ id: request.created_by_user_id });
        conversation = await base44.entities.Conversation.create({
          participant_ids: [currentUser.id, request.created_by_user_id],
          participant_names: [currentUser.display_name, requester?.display_name],
          participant_ages: [currentUser.age_range, requester?.age_range],
          last_message: '',
          last_message_at: new Date().toISOString(),
          request_id: request.id
        });
      }

      await base44.entities.HelpOffer.create({
        request_id: request.id,
        helper_user_id: currentUser.id,
        helper_name: currentUser.display_name,
        status: 'active',
        conversation_id: conversation.id
      });

      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'in_progress',
        claimed_by_user_id: currentUser.id,
        claimed_by_name: currentUser.display_name
      });

      await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        sender_name: currentUser.display_name,
        sender_age_range: currentUser.age_range,
        recipient_id: request.created_by_user_id,
        content: `Hi! I'm available to help with "${request.title}". What details do you need from me?`,
        is_read: false
      });

      await base44.entities.Conversation.update(conversation.id, {
        last_message: `Hi! I'm available to help...`,
        last_message_at: new Date().toISOString()
      });

      toast.success("You've offered to help! Opening chat...");
      onRefresh?.();
      onClose();
      navigate(createPageUrl('Messages') + `?conversation=${conversation.id}`);
    } catch (error) {
      toast.error('Failed to offer help');
    }
    setIsProcessing(false);
  };

  const handleOpenChat = async () => {
    const otherUserId = isRequester ? request.claimed_by_user_id : request.created_by_user_id;
    const [conv] = await base44.entities.Conversation.filter({
      participant_ids: { $all: [currentUser.id, otherUserId] },
      request_id: request.id
    });
    if (conv) navigate(createPageUrl('Messages') + `?conversation=${conv.id}`);
  };

  const handleMarkComplete = async () => {
    setIsProcessing(true);
    try {
      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      const [offer] = await base44.entities.HelpOffer.filter({ request_id: request.id });
      if (offer) await base44.entities.HelpOffer.update(offer.id, { status: 'completed' });
      toast.success('Mitzvah completed! ✨');
      onRefresh?.();
      onClose();
    } catch { toast.error('Failed to complete'); }
    setIsProcessing(false);
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await base44.entities.MitzvahRequest.update(request.id, { status: 'cancelled' });
      toast.success('Request cancelled');
      onRefresh?.();
      onClose();
    } catch { toast.error('Failed to cancel'); }
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
      toast.success('Report submitted.');
      onClose();
    } catch { toast.error('Failed to report'); }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 1,
          background: 'white', borderBottom: '1px solid #F0F3F9',
          display: 'flex', alignItems: 'center', padding: '0 16px', height: 52,
        }}
      >
        <span className="font-bold text-[#0F172A] text-[15px] flex-1">Request Details</span>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F5F9] text-[#6B7280] hover:bg-[#E2E8F0] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-5" style={{ paddingBottom: 32 }}>
        {/* Category + title */}
        <div>
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2 ${CATEGORY_COLORS[request.category] || 'bg-slate-100 text-slate-600'}`}>
            {request.category}
          </span>
          <h1 className="text-[20px] font-bold text-[#0F172A] leading-tight">{request.title}</h1>
        </div>

        {/* Status banners */}
        {isInProgress && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">In Progress</span>
          </div>
        )}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Completed</span>
          </div>
        )}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">Cancelled</span>
          </div>
        )}

        {/* Description */}
        <div>
          <p className="text-[13px] font-semibold text-[#98A2B3] uppercase tracking-wide mb-1">Details</p>
          <p className="text-[15px] text-[#374151] leading-relaxed">{request.description}</p>
        </div>

        {/* Meta */}
        <div className="space-y-2">
          {request.locationLabel && (
            <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{request.locationLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Posted {formatDistanceToNow(new Date(request.created_date), { addSuffix: true })}</span>
          </div>
          <div className="text-[13px] text-[#6B7280]">
            Requested by: <span className="font-medium text-[#0F172A]">
              {request.is_anonymous ? 'Anonymous' : request.created_by_name}
            </span>
          </div>
        </div>

        {/* Safety note */}
        {isOpen && !isRequester && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-800">
              <strong>Safety first:</strong> Exact addresses are shared only after you accept. Always meet in public if unsure.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {isOpen && !isRequester && (
            <button
              onClick={handleIllHelp}
              disabled={isProcessing}
              className="w-full h-12 rounded-full bg-[#0F172A] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <Hand className="w-5 h-5" />
              {isProcessing ? 'Processing...' : "I'll Help 💙"}
            </button>
          )}

          {isInProgress && (isRequester || isHelper) && (
            <button
              onClick={handleOpenChat}
              className="w-full h-12 rounded-full border border-[#E2E8F0] text-[#0F172A] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
              Open Chat
            </button>
          )}

          {isInProgress && (isRequester || isHelper) && (
            <button
              onClick={handleMarkComplete}
              disabled={isProcessing}
              className="w-full h-12 rounded-full bg-green-600 text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isRequester ? 'Confirm Completed' : 'Mark as Completed'}
            </button>
          )}

          {isRequester && isOpen && (
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full h-12 rounded-full border border-[#E2E8F0] text-[#6B7280] font-semibold text-[15px] active:scale-[0.98] transition-transform"
            >
              Cancel Request
            </button>
          )}

          {!isRequester && (
            <button
              onClick={handleReport}
              className="w-full h-10 flex items-center justify-center gap-2 text-[13px] font-medium text-red-500"
            >
              <Flag className="w-4 h-4" />
              Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}