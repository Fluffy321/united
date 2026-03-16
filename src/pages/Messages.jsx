import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ConversationList from '@/components/messages/ConversationList';
import ChatView from '@/components/messages/ChatView';
import ReportModal from '@/components/common/ReportModal';
import MessageRequestsTab from '@/components/messages/MessageRequestsTab';
import UserSearchPanel from '@/components/messages/UserSearchPanel';
import { toast } from 'sonner';

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [activeTab, setActiveTab] = useState('inbox');
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
    checkUrlParams();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    // Subscribe to message events for real-time notifications
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create') {
        const newMsg = event.data;
        if (newMsg.sender_id !== currentUser.id) {
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
          toast.success(`📨 ${newMsg.sender_name}: ${newMsg.content.substring(0, 50)}${newMsg.content.length > 50 ? '...' : ''}`, {
            duration: 5000,
            action: { label: 'View', onClick: () => loadConversation(newMsg.conversation_id) }
          });
        }
      }
    });
    return unsubscribe;
  }, [currentUser?.id]);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const checkUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('conversation');
    if (convId) {
      loadConversation(convId);
    }
  };

  const loadConversation = async (id) => {
    const conv = await base44.entities.Conversation.filter({ id });
    if (conv[0]) {
      setSelectedConversation(conv[0]);
    }
  };

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: async () => {
      const allConvs = await base44.entities.Conversation.list('-updated_date', 50);
      const userConvs = allConvs.filter(c => c.participant_ids?.includes(currentUser.id));
      
      // Fetch avatar URLs for all participants
      const allUserIds = [...new Set(userConvs.flatMap(c => c.participant_ids))];
      const users = await base44.entities.User.list();
      const userMap = Object.fromEntries(users.map(u => [u.id, u.avatar_url]));

      // Fetch linked request titles
      const requestIds = [...new Set(userConvs.map(c => c.request_id).filter(Boolean))];
      const requestTitleMap = {};
      await Promise.all(requestIds.map(async (rid) => {
        const [req] = await base44.entities.MitzvahRequest.filter({ id: rid });
        if (req) requestTitleMap[rid] = req.title;
      }));
      
      return userConvs.map(conv => ({
        ...conv,
        participant_avatars: conv.participant_ids?.map(id => userMap[id] || null),
        request_title: conv.request_id ? requestTitleMap[conv.request_id] : null
      }));
    },
    enabled: !!currentUser
  });

  const handleReport = (id, type) => {
    setReportTarget({ id, type });
    setShowReport(true);
  };

  const handleBlock = async (userId) => {
    await base44.entities.Block.create({
      blocker_id: currentUser.id,
      blocked_id: userId
    });
    toast.success('User blocked');
    setSelectedConversation(null);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>
      {/* Mobile: show list OR chat. Desktop: side-by-side */}
      <div className="flex flex-1 min-h-0">
        {/* Conversation List */}
        <div className={`flex flex-col w-full lg:w-96 lg:border-r border-slate-200 ${
          selectedConversation ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="px-4 pt-4 pb-0 border-b border-slate-100 flex-shrink-0">
            <h1 className="text-[20px] font-bold text-slate-900">Messages</h1>
            <div className="flex mt-3">
              {['inbox', 'requests'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-[13px] font-semibold border-b-2 transition-colors capitalize ${
                    activeTab === tab ? 'text-[#2563EB] border-[#2563EB]' : 'text-slate-400 border-transparent'
                  }`}
                >
                  {tab === 'inbox' ? 'Inbox' : 'Requests'}
                </button>
              ))}
            </div>
          </div>
          <UserSearchPanel
            currentUser={currentUser}
            onConversationOpened={(conv) => { setSelectedConversation(conv); setActiveTab('inbox'); }}
          />
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'requests' ? (
              <MessageRequestsTab
                currentUser={currentUser}
                onAccepted={(conv) => { setSelectedConversation(conv); setActiveTab('inbox'); }}
              />
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#0F5ED7]" />
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                currentUser={currentUser}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
              />
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className={`flex-1 flex flex-col min-h-0 ${
          selectedConversation ? 'flex' : 'hidden lg:flex lg:items-center lg:justify-center'
        }`}>
          {selectedConversation ? (
            <ChatView
              conversation={selectedConversation}
              currentUser={currentUser}
              onBack={() => setSelectedConversation(null)}
              onReport={handleReport}
              onBlock={handleBlock}
            />
          ) : (
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-slate-600 font-medium">Select a conversation</p>
              <p className="text-sm text-slate-400 mt-1">Choose from your existing conversations</p>
            </div>
          )}
        </div>
      </div>

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser}
      />
    </div>
  );
}