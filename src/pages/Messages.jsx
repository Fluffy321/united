import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Inbox, Loader2, MessageCircle, Plus, Users } from 'lucide-react';
import PageHelp from '@/components/common/PageHelp';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { batchFetchByIds } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import ChatView from '@/components/messages/ChatView';
import ConversationList from '@/components/messages/ConversationList';
import UserSearchPanel from '@/components/messages/UserSearchPanel';
import NewMessageComposer from '@/components/messages/NewMessageComposer';
import MessageRequestsTab from '@/components/messages/MessageRequestsTab';
import ReportModal from '@/components/common/ReportModal';
import BackButton from '@/components/common/BackButton';
import { captureError } from '@/lib/analytics';
import { COMMUNITIES_ENABLED } from '@/config/features';
import { createBlock, filterBlock, filterConversation, filterMessageRequest, filterUserCommunity, listCommunity, listConversation, subscribeMessage, updateConversation } from '@/services/entityServices';

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [activeTab, setActiveTab] = useState('inbox');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const convId = new URLSearchParams(window.location.search).get('conversation');
    if (!currentUser || !convId) return;
    if (selectedConversation?.id === convId) return;
    if (convId) loadConversation(convId);
  }, [currentUser?.id, location.search, selectedConversation?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeMessage((event) => {
      if (event.type === 'create') {
        const newMsg = event.data;
        if (newMsg.sender_id !== currentUser.id) {
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
          // Show sender name but not message content — content in a toast is
          // visible to shoulder-surfers and logged by monitoring tools.
          toast.success(`📨 New message from ${newMsg.sender_name}`, {
            duration: 5000,
            action: { label: 'View', onClick: () => loadConversation(newMsg.conversation_id) }
          });
        }
      }
    });
    return unsubscribe;
  }, [currentUser?.id]);

  useEffect(() => {
    if (!COMMUNITIES_ENABLED && activeFilter === 'communities') {
      setActiveFilter('all');
    }
  }, [activeFilter]);

  const loadConversation = async (id) => {
    try {
      const [conv] = await filterConversation({ id });
      if (!conv) {
        toast.error('That conversation could not be found.');
        navigate('/Messages', { replace: true });
        return;
      }
      setSelectedConversation(conv);
    } catch (e) {
      captureError(e, { context: 'Messages: load conversation from URL param' });
      toast.error('Could not open that conversation. Please try again.');
    }
  };

  const { data: communityConversations = [] } = useQuery({
    queryKey: ['community-convs', currentUser?.id],
    queryFn: async () => {
      const memberships = await filterUserCommunity({ user_id: currentUser.id });
      if (!memberships.length) return [];
      const communityIds = memberships.map(m => m.community_id);
      const allComms = await listCommunity('-follower_count', 100);
      const joined = allComms.filter(c => communityIds.includes(c.id));
      return joined.map(c => ({
        id: `community-${c.id}`,
        community_id: c.id,
        is_community_chat: true,
        community_name: c.name,
        community_type: c.type,
        community_logo: c.logo_url || null,
        participant_ids: [currentUser.id],
        participant_names: [currentUser.full_name],
        member_count: c.follower_count || 0,
        last_message: null,
        last_message_at: c.updated_date || null,
        unread_count: {},
      }));
    },
    enabled: !!currentUser && COMMUNITIES_ENABLED,
    staleTime: 120000,
  });

  const { data: conversations = [], isLoading, isError: isConversationsError } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: async () => {
      const [allConvs, myBlocks] = await Promise.all([
        listConversation('-updated_date', 50),
        filterBlock({ blocker_id: currentUser.id }).catch(() => []),
      ]);
      const blockedIds = new Set(myBlocks.map((b) => b.blocked_id));
      const userConvs = allConvs.filter((c) => {
        if (!c.participant_ids?.includes(currentUser.id)) return false;
        // Retroactive block enforcement: hide direct conversations with anyone I've blocked.
        const others = (c.participant_ids || []).filter((id) => id !== currentUser.id);
        if (others.length === 1 && blockedIds.has(others[0])) return false;
        return true;
      });

      const requestIds = [...new Set(userConvs.map((c) => c.request_id).filter(Boolean))];
      let requests = [];
      try {
        if (requestIds.length > 0) requests = await batchFetchByIds('MitzvahRequest', requestIds);
      } catch {}
      const requestTitleMap = Object.fromEntries(requests.map(r => [r.id, r.title]));

      return userConvs.map((conv) => ({
        ...conv,
        participant_avatars: conv.participant_avatars || [],
        request_title: conv.request_id ? requestTitleMap[conv.request_id] : null
      }));
    },
    enabled: !!currentUser,
    staleTime: 60000,
    gcTime: 120000,
    retry: 1
  });

  const allConversations = [
    ...conversations,
    ...(COMMUNITIES_ENABLED ? communityConversations : []),
  ];

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['message-requests', currentUser?.id],
    queryFn: async () => {
      const [requests, myBlocks] = await Promise.all([
        filterMessageRequest({ recipient_id: currentUser.id, status: 'pending' }, '-created_date', 50),
        filterBlock({ blocker_id: currentUser.id }).catch(() => []),
      ]);
      const blockedIds = new Set(myBlocks.map((b) => b.blocked_id));
      return requests.filter((r) => !blockedIds.has(r.sender_id));
    },
    enabled: !!currentUser,
    staleTime: 60000,
  });


  const unreadCount = allConversations.reduce((sum, conv) =>
  sum + (conv.unread_count?.[currentUser?.id] || 0), 0
  );

  const handleReport = (id, type) => {
    setReportTarget({ id, type });
    setShowReport(true);
  };

  const openConversation = (conv) => {
    setSelectedConversation(conv);
    navigate('/Messages?chat=1', { replace: true });
  };

  const closeConversation = () => {
    setSelectedConversation(null);
    navigate('/Messages', { replace: true });
  };

  const handleArchive = async (conv) => {
    try {
      await updateConversation(conv.id, { is_archived: true });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      toast.success('Conversation archived');
    } catch (e) {
      toast.error('Failed to archive');
    }
  };

  const handleMarkUnread = async (conv) => {
    try {
      const newUnread = { ...(conv.unread_count || {}), [currentUser.id]: 1 };
      await updateConversation(conv.id, { unread_count: newUnread });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      toast.success('Marked as unread');
    } catch (e) {
      toast.error('Failed to update');
    }
  };

  const handleBlock = async (userId) => {
    await createBlock({
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
      </div>);

  }

  if (showNewMessage) {
    return (
      <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>
        <NewMessageComposer
          currentUser={currentUser}
          onConversationSelect={(conv) => {
            setSelectedConversation(conv);
            setShowNewMessage(false);
          }}
          onCancel={() => setShowNewMessage(false)} />
        
      </div>);

  }

  const visibleConversations = allConversations.filter(conv => {
    if (conv.is_archived) return false;
    if (activeFilter === 'unread') return (conv.unread_count?.[currentUser?.id] || 0) > 0;
    if (COMMUNITIES_ENABLED && activeFilter === 'communities') return !!conv.community_id;
    if (activeFilter === 'requests') return !!conv.request_id;
    return true;
  });
  const unreadTotal = allConversations.reduce((sum, conv) => sum + (conv.unread_count?.[currentUser?.id] || 0), 0);
  const communityTotal = COMMUNITIES_ENABLED ? allConversations.filter((conv) => conv.community_id || conv.is_community_chat).length : 0;

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#F6F8FB] mobile-safe-bottom">
      <div className="mobile-page-wide flex flex-1 min-h-[calc(100dvh-112px)] px-3 pt-3 sm:px-4 sm:pt-4">
        {/* Conversation List */}
        <div className={`flex flex-col w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        selectedConversation ? 'hidden lg:flex lg:w-80 lg:rounded-r-none lg:border-r' : 'flex'}`
        }>
          <div className="flex-shrink-0 border-b border-slate-100 bg-white px-4 pt-4 pb-3">
            {/* Title row */}
            <div className="flex items-center justify-between gap-2 pb-3">
              <div className="flex min-w-0 items-center gap-1.5">
                <BackButton fallbackTo="/Feed" className="-ml-2 shrink-0" />
                <h1 className="text-[20px] font-black tracking-normal text-slate-950">Messages</h1>
                <PageHelp text="Coordinate privately with people you connect with through JUnited." align="end" />
              </div>
              <button
                onClick={() => setShowNewMessage(true)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-[13px] font-black text-white transition-all hover:bg-slate-800 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            </div>

            {/* Inline stats */}
            <div className="flex items-center gap-3 pb-3 text-[12px]">
              <span className="flex items-center gap-1 text-slate-500">
                <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-black text-slate-800">{allConversations.length}</span> chats
              </span>
              {unreadTotal > 0 && (
                <span className="flex items-center gap-1 font-semibold text-blue-600">
                  <Inbox className="h-3.5 w-3.5" />
                  <span className="font-black">{unreadTotal}</span> unread
                </span>
              )}
              {communityTotal > 0 && (
                <span className="flex items-center gap-1 text-slate-500">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-black text-slate-700">{communityTotal}</span> groups
                </span>
              )}
            </div>

            {/* Tab switcher: Inbox / Requests */}
            <div className="flex gap-1.5 pb-3">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`app-tab-pill ${activeTab === 'inbox' ? 'app-tab-pill-active' : ''}`}
              >
                Inbox
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`relative app-tab-pill ${activeTab === 'requests' ? 'app-tab-pill-active' : ''}`}
              >
                Requests
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'inbox' && (
              <div className="mobile-scroll-x flex gap-1.5 pb-3">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: 'Unread' },
                  ...(COMMUNITIES_ENABLED ? [{ key: 'communities', label: 'Communities' }] : []),
                  { key: 'requests', label: 'Requests' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`app-tab-pill ${activeFilter === f.key ? 'app-tab-pill-active' : ''}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'inbox' && (
            <UserSearchPanel
              currentUser={currentUser}
              onConversationOpened={(conv) => { setSelectedConversation(conv); setActiveTab('inbox'); }} />
          )}

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'requests' ? (
              <MessageRequestsTab
                currentUser={currentUser}
                onAccepted={(conv) => {
                  setActiveTab('inbox');
                  openConversation(conv);
                }}
              />
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#0F5ED7]" />
              </div>
            ) : isConversationsError ? (
              <div className="mx-3 my-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <AlertCircle className="mx-auto mb-2 h-5 w-5 text-amber-600" />
                <p className="text-[13px] font-bold text-amber-900">Messages could not refresh.</p>
                <p className="mt-1 text-[12px] font-medium leading-5 text-amber-700">You can keep using the app. Try refreshing this page in a moment.</p>
              </div>
            ) : (
              <ConversationList
                conversations={visibleConversations}
                currentUser={currentUser}
                selectedId={selectedConversation?.id}
                onSelect={openConversation}
                onArchive={handleArchive}
                onMarkUnread={handleMarkUnread} />
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className={`flex-1 flex-col min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        selectedConversation ? 'flex lg:rounded-l-none lg:border-l-0' : 'hidden'}`
        }>
          {selectedConversation ?
          <ChatView
            conversation={selectedConversation}
            currentUser={currentUser}
            onBack={closeConversation}
            onReport={handleReport}
            onBlock={handleBlock} /> :


          <div className="text-center p-8">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-slate-600 font-medium">Select a conversation</p>
              <p className="text-sm text-slate-400 mt-1">Choose from your existing conversations</p>
            </div>
          }
        </div>
      </div>

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser} />
      
    </div>);

}
