import { useState, useEffect } from 'react';
import { Loader2, MessageCircle, X, Plus } from 'lucide-react';
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

const now = Date.now();
const DEMO_CONVERSATIONS = [
  {
    id: 'demo-1', is_demo: true, demo_user_name: 'Yael Goldstein',
    last_message: 'Are you going tonight?',
    last_message_at: new Date(now - 4 * 60 * 1000).toISOString(),
    unread_count: {},
    participant_ids: [], participant_names: ['Yael Goldstein'], participant_avatars: [null],
    _demo_unread: 2,
  },
  {
    id: 'demo-2', is_demo: true, demo_user_name: 'Moshe Levy',
    last_message: "I'll send it in a bit",
    last_message_at: new Date(now - 38 * 60 * 1000).toISOString(),
    unread_count: {},
    participant_ids: [], participant_names: ['Moshe Levy'], participant_avatars: [null],
    _demo_unread: 0,
  },
  {
    id: 'demo-3', is_demo: true, demo_user_name: 'Rivka Cohen',
    last_message: 'Thanks again 🙏',
    last_message_at: new Date(now - 2.5 * 60 * 60 * 1000).toISOString(),
    unread_count: {},
    participant_ids: [], participant_names: ['Rivka Cohen'], participant_avatars: [null],
    _demo_unread: 1,
  },
  {
    id: 'demo-4', is_demo: true, demo_user_name: 'Ari Shapiro',
    last_message: 'Did you see the post?',
    last_message_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    unread_count: {},
    participant_ids: [], participant_names: ['Ari Shapiro'], participant_avatars: [null],
    _demo_unread: 3,
  },
  {
    id: 'demo-5', is_demo: true, demo_user_name: 'Dina Rosen',
    last_message: 'Shabbos at 7 still?',
    last_message_at: new Date(now - 22 * 60 * 60 * 1000).toISOString(),
    unread_count: {},
    participant_ids: [], participant_names: ['Dina Rosen'], participant_avatars: [null],
    _demo_unread: 0,
  },
  {
    id: 'demo-6', is_demo: true, demo_user_name: 'Nachum Weiss',
    last_message: 'Can you cover for me?',
    last_message_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: {},
    participant_ids: [], participant_names: ['Nachum Weiss'], participant_avatars: [null],
    _demo_unread: 0,
  },
];

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [activeTab, setActiveTab] = useState('inbox');
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
      // User not authenticated — redirect to login
      base44.auth.redirectToLogin(window.location.href);
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

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: async () => {
      const allConvs = await base44.entities.Conversation.list('-updated_date', 50);
      const userConvs = allConvs.filter(c => c.participant_ids?.includes(currentUser.id));
      
      const requestIds = [...new Set(userConvs.map(c => c.request_id).filter(Boolean))];
      const requestTitleMap = {};
      await Promise.all(requestIds.map(async (rid) => {
        const [req] = await base44.entities.MitzvahRequest.filter({ id: rid });
        if (req) requestTitleMap[rid] = req.title;
      }));
      
      return userConvs.map(conv => ({
        ...conv,
        participant_avatars: conv.participant_avatars || [],
        request_title: conv.request_id ? requestTitleMap[conv.request_id] : null
      }));
    },
    enabled: !!currentUser,
    staleTime: 60000,
    gcTime: 120000,
  });

  // Inject demo conversations when inbox is sparse
  const demoWithUnread = DEMO_CONVERSATIONS.map(d => ({
    ...d,
    unread_count: d._demo_unread > 0 ? { [currentUser?.id]: d._demo_unread } : {},
  }));
  const realConvs = conversations;
  const fillCount = Math.max(0, 4 - realConvs.length);
  const demoPadding = demoWithUnread.slice(0, fillCount + demoWithUnread.length); // always show demos

  const allConversations = [
    ...(aiConversation ? [aiConversation] : []),
    ...realConvs,
    ...demoWithUnread,
  ];

  const unreadCount = allConversations.reduce((sum, conv) => 
    sum + (conv.unread_count?.[currentUser?.id] || 0), 0
  );

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

  if (showNewMessage) {
    return (
      <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>
        <NewMessageComposer
          currentUser={currentUser}
          onConversationSelect={(conv) => {
            setSelectedConversation(conv);
            setShowNewMessage(false);
          }}
          onCancel={() => setShowNewMessage(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50 relative" style={{ height: '100dvh' }}>
      <div className="flex flex-1 min-h-0">
        {/* Conversation List */}
        <div className={`flex flex-col w-full lg:w-96 lg:border-r border-slate-200 bg-slate-50 ${
          selectedConversation ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="px-5 pt-5 pb-0 border-b border-slate-200 bg-white flex-shrink-0 shadow-sm">
            <h1 className="text-[22px] font-extrabold text-slate-900 mb-3">Messages</h1>
            <div className="flex gap-1">
              {['inbox', 'requests'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-[13px] font-bold rounded-t-xl transition-all capitalize ${
                    activeTab === tab
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                      : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'
                  }`}
                >
                  {tab === 'inbox' ? 'Inbox' : 'Requests'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'inbox' && (
            <UserSearchPanel
              currentUser={currentUser}
              onConversationOpened={(conv) => { setSelectedConversation(conv); setActiveTab('inbox'); }}
            />
          )}

          <div className="flex-1 overflow-y-auto bg-slate-50">
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
                conversations={allConversations}
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

      {/* New Message FAB */}
      {activeTab === 'inbox' && !selectedConversation && (
        <button
          onClick={() => setShowNewMessage(true)}
          className="absolute bottom-28 right-5 w-16 h-16 rounded-full text-white flex items-center justify-center active:scale-90 transition-all duration-150"
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            boxShadow: '0 8px 24px rgba(37,99,235,0.45), 0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

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