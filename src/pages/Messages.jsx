import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Inbox, Loader2, MessageCircle, Plus, Sparkles, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ChatView from '@/components/messages/ChatView';
import ConversationList from '@/components/messages/ConversationList';
import UserSearchPanel from '@/components/messages/UserSearchPanel';
import MessageRequestsTab from '@/components/messages/MessageRequestsTab';
import NewMessageComposer from '@/components/messages/NewMessageComposer';
import ReportModal from '@/components/common/ReportModal';
import { buildAIConversation } from '@/lib/aiAgent';

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [activeTab, setActiveTab] = useState('inbox');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
    checkUrlParams();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
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
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (e) {
      setCurrentUser({
        id: 'local-demo',
        full_name: 'Local Demo User',
        display_name: 'Demo',
      });
    }
  };

  const checkUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('conversation');
    if (convId) {
      loadConversation(convId);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await base44.entities.Conversation.filter({ id });
      if (conv[0]) {
        setSelectedConversation(conv[0]);
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  };

  const aiConversation = currentUser ? buildAIConversation(currentUser) : null;

  const { data: communityConversations = [] } = useQuery({
    queryKey: ['community-convs', currentUser?.id],
    queryFn: async () => {
      const memberships = await base44.entities.UserCommunity.filter({ user_id: currentUser.id });
      if (!memberships.length) return [];
      const communityIds = memberships.map(m => m.community_id);
      const allComms = await base44.entities.Community.list('-follower_count', 100);
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
    enabled: !!currentUser,
    staleTime: 120000,
  });

  const { data: conversations = [], isLoading, isError: isConversationsError } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: async () => {
      const allConvs = await base44.entities.Conversation.list('-updated_date', 50);
      const userConvs = allConvs.filter((c) => c.participant_ids?.includes(currentUser.id));

      const requestIds = [...new Set(userConvs.map((c) => c.request_id).filter(Boolean))];
      const requestTitleMap = {};
      await Promise.all(requestIds.map(async (rid) => {
        const [req] = await base44.entities.MitzvahRequest.filter({ id: rid });
        if (req) requestTitleMap[rid] = req.title;
      }));

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
    ...(aiConversation ? [aiConversation] : []),
    ...conversations,
    ...communityConversations,
  ];


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
      await base44.entities.Conversation.update(conv.id, { is_archived: true });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      toast.success('Conversation archived');
    } catch (e) {
      toast.error('Failed to archive');
    }
  };

  const handleMarkUnread = async (conv) => {
    try {
      const newUnread = { ...(conv.unread_count || {}), [currentUser.id]: 1 };
      await base44.entities.Conversation.update(conv.id, { unread_count: newUnread });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      toast.success('Marked as unread');
    } catch (e) {
      toast.error('Failed to update');
    }
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
    if (activeFilter === 'communities') return !!conv.community_id;
    if (activeFilter === 'requests') return !!conv.request_id;
    return true;
  });
  const unreadTotal = allConversations.reduce((sum, conv) => sum + (conv.unread_count?.[currentUser?.id] || 0), 0);
  const communityTotal = allConversations.filter((conv) => conv.community_id || conv.is_community_chat).length;

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#F6F8FB] mobile-safe-bottom">
      <div className="mobile-page-wide flex flex-1 min-h-[calc(100dvh-112px)] px-3 pt-3 sm:px-4 sm:pt-4">
        {/* Conversation List */}
        <div className={`flex flex-col w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        selectedConversation ? 'hidden lg:flex lg:w-80 lg:rounded-r-none lg:border-r' : 'flex'}`
        }>
          <div className="flex-shrink-0 border-b border-slate-100 bg-white p-3">
            <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative p-4">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[42px] bg-blue-50" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-blue-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      Inbox hub
                    </p>
                    <h1 className="text-[22px] font-black tracking-normal text-slate-950">Messages</h1>
                    <p className="mt-1 text-[12px] font-medium leading-5 text-slate-500">Chats, requests, and community updates in one place.</p>
                  </div>
                  <button
                    onClick={() => setShowNewMessage(true)}
                    className="mobile-touch shrink-0 rounded-2xl bg-slate-950 px-3 text-[13px] font-black text-white shadow-sm active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <MessageCircle className="mb-1 h-4 w-4 text-blue-600" />
                    <p className="text-[15px] font-black text-slate-950">{allConversations.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Chats</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-3 py-2">
                    <Inbox className="mb-1 h-4 w-4 text-blue-700" />
                    <p className="text-[15px] font-black text-blue-800">{unreadTotal}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Unread</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2">
                    <Users className="mb-1 h-4 w-4 text-emerald-700" />
                    <p className="text-[15px] font-black text-emerald-800">{communityTotal}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Groups</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Filter pills */}
            <div className="mobile-scroll-x flex gap-2 pb-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'communities', label: 'Communities' },
                { key: 'requests', label: 'Requests' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex-shrink-0 rounded-xl border px-4 py-2 text-[13px] font-bold transition-all duration-150 active:scale-95 ${
                    activeFilter === f.key ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="mt-1 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {['inbox', 'requests'].map((tab) =>
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-xl py-2 text-[13px] font-black transition-all capitalize ${
                activeTab === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`
                }>
                  {tab === 'inbox' ? 'Inbox' : 'Requests'}
                </button>
              )}
            </div>
          </div>

          {activeTab === 'inbox' &&
          <UserSearchPanel
            currentUser={currentUser}
            onConversationOpened={(conv) => {setSelectedConversation(conv);setActiveTab('inbox');}} />

          }

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'requests' ?
            <MessageRequestsTab
              currentUser={currentUser}
              onAccepted={(conv) => {setSelectedConversation(conv);setActiveTab('inbox');}} /> :

            isLoading ?
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#0F5ED7]" />
              </div> :

            isConversationsError ?
            <div className="mx-3 my-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <AlertCircle className="mx-auto mb-2 h-5 w-5 text-amber-600" />
                <p className="text-[13px] font-bold text-amber-900">Messages could not refresh.</p>
                <p className="mt-1 text-[12px] font-medium leading-5 text-amber-700">You can keep using the app. Try refreshing this page in a moment.</p>
              </div> :

            <ConversationList
              conversations={visibleConversations}
              currentUser={currentUser}
              selectedId={selectedConversation?.id}
              onSelect={openConversation}
              onArchive={handleArchive}
              onMarkUnread={handleMarkUnread} />

            }
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
