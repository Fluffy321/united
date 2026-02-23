import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Hand, MessageCircle, CheckCircle2, AlertCircle, Flag, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LogHoursFromMitzvahModal from './LogHoursFromMitzvahModal';

const CATEGORY_COLORS = {
  'Errand': 'bg-blue-100 text-blue-700',
  'Lost & Found': 'bg-purple-100 text-purple-700',
  'Quick Favor': 'bg-green-100 text-green-700',
  'Tutoring': 'bg-yellow-100 text-yellow-700',
  'Shabbat Help': 'bg-indigo-100 text-indigo-700',
  'Other': 'bg-slate-100 text-slate-600'
};

export default function RequestDetailOverlay({ request, currentUser, onClose, onRefresh, overlayStyle }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [signup, setSignup] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const navigate = useNavigate();

  const isRequester = currentUser?.id === request?.created_by_user_id;
  const isHelper = currentUser?.id === request?.claimed_by_user_id;
  const isOpen = request?.status === 'open';
  const isInProgress = request?.status === 'in_progress';
  const isCompleted = request?.status === 'completed';
  const isCancelled = request?.status === 'cancelled';

  // Load the current user's signup for this request
  useEffect(() => {
    if (!request?.id || !currentUser?.id) return;
    base44.entities.MitzvahSignup.filter({ request_id: request.id, user_id: currentUser.id })
      .then(results => setSignup(results[0] || null));
  }, [request?.id, currentUser?.id]);

  if (!request) return null;

  const handleIllHelp = async () => {
    setIsProcessing(true);
    try {
      // Upsert signup
      let existingSignup = signup;
      if (!existingSignup) {
        existingSignup = await base44.entities.MitzvahSignup.create({
          request_id: request.id,
          user_id: currentUser.id,
          user_name: currentUser.display_name,
          status: 'JOINED',
          joined_at: new Date().toISOString(),
        });
        setSignup(existingSignup);
      }

      // Set up conversation
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

      toast.success("You've joined this mitzvah! Opening chat...");
      onRefresh?.();
      onClose();
      navigate(createPageUrl('Messages') + `?conversation=${conversation.id}`);
    } catch {
      toast.error('Failed to join');
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

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await base44.entities.MitzvahRequest.update(request.id, { status: 'cancelled' });
      if (signup) await base44.entities.MitzvahSignup.update(signup.id, { status: 'CANCELED' });
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

  const hasLoggedHours = !!signup?.chesed_log_id;

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        ...overlayStyle,
      }}
    >
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 1,
        background: 'white', borderBottom: '1px solid #F0F3F9',
        display: 'flex', alignItems: 'center', padding: '0 16px', height: 52,
      }}>
        <span className="font-bold text-[#0F172A] text-[15px] flex-1">Request Details</span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F5F9] text-[#6B7280] hover:bg-[#E2E8F0] transition-colors">
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
            {hasLoggedHours && <span className="ml-auto text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Hours Logged ✓</span>}
          </div>
        )}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">Cancelled</span>
          </div>
        )}

        {/* Signed-up banner (non-requester who already joined) */}
        {signup && isInProgress && isHelper && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
            <Hand className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">You're helping with this!</span>
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
          {/* I'll Help — only open requests, not the requester, not already joined */}
          {isOpen && !isRequester && !signup && (
            <button
              onClick={handleIllHelp}
              disabled={isProcessing}
              className="w-full h-12 rounded-full bg-[#0F172A] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <Hand className="w-5 h-5" />
              {isProcessing ? 'Processing...' : "I'll Help 💙"}
            </button>
          )}

          {/* Open Chat */}
          {isInProgress && (isRequester || isHelper) && (
            <button
              onClick={handleOpenChat}
              className="w-full h-12 rounded-full border border-[#E2E8F0] text-[#0F172A] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
              Open Chat
            </button>
          )}

          {/* Mark Complete + Log Hours — helper sees this on in-progress */}
          {isInProgress && isHelper && (
            <button
              onClick={() => setShowLogModal(true)}
              disabled={isProcessing}
              className="w-full h-12 rounded-full bg-[#2563EB] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <BookOpen className="w-5 h-5" />
              {hasLoggedHours ? 'Edit Logged Hours' : 'Complete & Log Hours'}
            </button>
          )}

          {/* Requester confirm complete */}
          {isInProgress && isRequester && (
            <button
              onClick={async () => {
                setIsProcessing(true);
                try {
                  await base44.entities.MitzvahRequest.update(request.id, { status: 'completed', completed_at: new Date().toISOString() });
                  toast.success('Mitzvah confirmed completed! ✨');
                  onRefresh?.();
                  onClose();
                } catch { toast.error('Failed'); }
                setIsProcessing(false);
              }}
              disabled={isProcessing}
              className="w-full h-12 rounded-full bg-green-600 text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirm Completed
            </button>
          )}

          {/* Helper: log hours on completed request if not yet logged */}
          {isCompleted && isHelper && !hasLoggedHours && (
            <button
              onClick={() => setShowLogModal(true)}
              className="w-full h-12 rounded-full bg-[#2563EB] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <BookOpen className="w-5 h-5" />
              Log Your Hours
            </button>
          )}

          {/* Cancel */}
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

      {/* Log Hours Modal */}
      {showLogModal && (
        <LogHoursFromMitzvahModal
          open={showLogModal}
          onOpenChange={setShowLogModal}
          request={request}
          signup={signup}
          currentUser={currentUser}
          onSuccess={() => {
            onRefresh?.();
            onClose();
          }}
        />
      )}
    </div>
  );
}