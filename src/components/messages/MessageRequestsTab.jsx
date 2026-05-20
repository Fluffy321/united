import React from 'react';
import { dataService } from '@/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function MessageRequestsTab({ currentUser, onAccepted }) {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['message-requests', currentUser.id],
    queryFn: () => dataService.entities.MessageRequest.filter({ recipient_id: currentUser.id, status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser,
  });

  const handleAccept = async (req) => {
    // Create a real conversation
    const existing = await dataService.entities.Conversation.filter({ id: req.sender_id });
    const conv = await dataService.entities.Conversation.create({
      participant_ids: [req.sender_id, currentUser.id],
      participant_names: [req.sender_name, currentUser.full_name || currentUser.display_name],
      participant_ages: [null, currentUser.age_range || '18+'],
      request_type: 'general',
      unread_count: { [currentUser.id]: 0 },
    });
    await dataService.entities.MessageRequest.update(req.id, { status: 'accepted' });
    queryClient.invalidateQueries({ queryKey: ['message-requests', currentUser.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
    toast.success(`Accepted message request from ${req.sender_name}`);
    onAccepted?.(conv);
  };

  const handleDecline = async (req) => {
    await dataService.entities.MessageRequest.update(req.id, { status: 'declined' });
    queryClient.invalidateQueries({ queryKey: ['message-requests', currentUser.id] });
    toast.success('Request declined');
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#0F5ED7]" /></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <span className="text-2xl">📬</span>
        </div>
        <p className="text-slate-700 font-semibold">No message requests</p>
        <p className="text-[13px] text-slate-400 mt-1">Requests from people outside your communities appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {requests.map(req => (
        <div key={req.id} className="px-4 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-lg text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            {req.sender_avatar
              ? <img src={req.sender_avatar} alt="" className="w-full h-full object-cover" />
              : req.sender_name?.charAt(0)?.toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] text-slate-900">{req.sender_name}</p>
            {req.message_preview && (
              <p className="text-[13px] text-slate-400 truncate">{req.message_preview}</p>
            )}
            <p className="text-[11px] text-slate-300 mt-0.5">
              {formatDistanceToNow(new Date(req.created_date), { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleAccept(req)}
              aria-label="Accept message request"
              className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDecline(req)}
              aria-label="Decline message request"
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}