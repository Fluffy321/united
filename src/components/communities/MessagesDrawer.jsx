import { createPortal } from 'react-dom';
import { ArrowRight, Loader2, MessageCircle, Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { batchFetchByIds } from '@/services';
import { buildAIConversation } from '@/lib/aiAgent';
import ConversationList from '@/components/messages/ConversationList';
import { listConversation } from '@/services/entityServices';

export default function MessagesDrawer({ currentUser, open, onClose }) {
  const navigate = useNavigate();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: async () => {
      const allConvs = await listConversation('-updated_date', 50);
      const userConvs = allConvs.filter((c) => c.participant_ids?.includes(currentUser.id));
      const requestIds = [...new Set(userConvs.map((c) => c.request_id).filter(Boolean))];
      const requests = await batchFetchByIds('MitzvahRequest', requestIds);
      const requestTitleMap = Object.fromEntries(requests.map((r) => [r.id, r.title]));
      return userConvs.map((conv) => ({
        ...conv,
        participant_avatars: conv.participant_avatars || [],
        request_title: conv.request_id ? requestTitleMap[conv.request_id] : null,
      }));
    },
    enabled: !!currentUser && open,
    staleTime: 60000,
  });

  const aiConversation = currentUser ? buildAIConversation(currentUser) : null;
  const allConversations = [...(aiConversation ? [aiConversation] : []), ...conversations];

  const handleSelect = (conv) => {
    onClose();
    navigate(`/Messages?conversation=${conv.id}`);
  };

  const goToMessages = () => {
    onClose();
    navigate('/Messages');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-[100dvh] w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-[380px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-[17px] font-black text-slate-950">Messages</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToMessages}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
            >
              Open full view
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <ConversationList
              conversations={allConversations}
              currentUser={currentUser}
              selectedId={null}
              onSelect={handleSelect}
              onArchive={() => {}}
              onMarkUnread={() => {}}
            />
          )}
        </div>

        {/* Footer CTA */}
        <div className="shrink-0 border-t border-slate-100 p-4">
          <button
            onClick={goToMessages}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-sm font-black text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Message
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
