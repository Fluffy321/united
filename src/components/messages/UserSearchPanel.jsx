import React, { useState, useEffect } from 'react';
import React, { useState } from 'react';
import { Search, Loader2, MessageCircle, Users, Bot } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { canMessage, checkSpamLimits, recordNewChat } from '@/lib/messagingPermissions';
import { AI_AGENT, buildAIConversation, isAIConversation } from '@/lib/aiAgent';
import { toast } from 'sonner';

export default function UserSearchPanel({ currentUser, onConversationOpened }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [userGroups, setUserGroups] = useState(null);

  const handleSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const allUsers = await base44.entities.User.list();
      const filtered = allUsers.filter(u =>
        u.id !== currentUser.id &&
        u.message_settings?.searchable !== false &&
        u.full_name?.toLowerCase().includes(q.toLowerCase())
      );

      // Inject AI agent if query matches
      const lq = q.toLowerCase();
      const showAI = ['ai', 'assistant', 'united', 'bot', 'help'].some(kw => kw.includes(lq) || lq.includes(kw));
      const results = showAI ? [AI_AGENT, ...filtered.slice(0, 19)] : filtered.slice(0, 20);
      setResults(results);

      // Lazily load current user's groups for mutual count
      if (!userGroups) {
        const memberships = await base44.entities.GroupMember.filter({ user_id: currentUser.id });
        setUserGroups(new Set(memberships.map(m => m.group_id)));
      }
    } catch {
      toast.error('Search failed');
    }
    setSearching(false);
  };

  const getMutualCount = async (userId) => {
    if (!userGroups) return 0;
    const theirMemberships = await base44.entities.GroupMember.filter({ user_id: userId });
    const theirGroups = new Set(theirMemberships.map(m => m.group_id));
    return [...userGroups].filter(id => theirGroups.has(id)).length;
  };

  const handleUserClick = async (recipient) => {
    if (actionLoading) return;
    setActionLoading(recipient.id);
    try {
      // AI agent — open directly without DB conversation
      if (recipient.id === AI_AGENT.id) {
        onConversationOpened(buildAIConversation(currentUser));
        setQuery('');
        setResults([]);
        setActionLoading(null);
        return;
      }

      // Check for existing conversation
      const allConvs = await base44.entities.Conversation.list('-updated_date', 100);
      const existing = allConvs.find(c =>
        c.participant_ids?.includes(currentUser.id) &&
        c.participant_ids?.includes(recipient.id) &&
        c.participant_ids?.length === 2
      );
      if (existing) {
        onConversationOpened(existing);
        setQuery('');
        setResults([]);
        return;
      }

      // Spam check
      const spam = checkSpamLimits(currentUser.id);
      if (!spam.allowed) {
        toast.error(spam.reason);
        return;
      }

      // Permission check
      const { canMessage: allowed } = await canMessage(currentUser, recipient.id);

      if (allowed) {
        const conv = await base44.entities.Conversation.create({
          participant_ids: [currentUser.id, recipient.id],
          participant_names: [currentUser.full_name, recipient.full_name],
          participant_ages: [currentUser.age_range || '18+', recipient.age_range || '18+'],
          request_type: 'general',
          unread_count: { [recipient.id]: 0 }
        });
        recordNewChat(currentUser.id);
        onConversationOpened(conv);
        setQuery('');
        setResults([]);
        toast.success('Conversation started!');
      } else {
        const existing = await base44.entities.MessageRequest.filter({
          sender_id: currentUser.id,
          recipient_id: recipient.id,
          status: 'pending'
        });
        if (existing.length > 0) {
          toast.info('You already sent a message request to this person.');
          return;
        }
        await base44.entities.MessageRequest.create({
          sender_id: currentUser.id,
          sender_name: currentUser.full_name,
          sender_avatar: currentUser.avatar_url || null,
          recipient_id: recipient.id,
          status: 'pending',
        });
        recordNewChat(currentUser.id);
        toast.success("Message request sent!");
        setQuery('');
        setResults([]);
      }
    } catch {
      toast.error('Something went wrong');
    }
    setActionLoading(null);
  };

  return (
    <div className="px-4 py-3 border-b border-slate-100">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search people…"
          className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
          {results.map(user => (
            <UserResultRow
              key={user.id}
              user={user}
              currentUserGroups={userGroups}
              loading={actionLoading === user.id}
              onClick={() => handleUserClick(user)}
            />
          ))}
        </div>
      )}

      {query.trim() && !searching && results.length === 0 && (
        <p className="text-center text-[13px] text-slate-400 py-4">No users found</p>
      )}
    </div>
  );
}

function UserResultRow({ user, currentUserGroups, loading, onClick }) {
  const [mutualCount, setMutualCount] = useState(null);
  const isAI = user.id === AI_AGENT.id;

  React.useEffect(() => {
    if (isAI || !currentUserGroups) return;
    base44.entities.GroupMember.filter({ user_id: user.id }).then(memberships => {
      const theirGroups = new Set(memberships.map(m => m.group_id));
      const count = [...currentUserGroups].filter(id => theirGroups.has(id)).length;
      setMutualCount(count);
    }).catch(() => setMutualCount(0));
  }, [user.id, currentUserGroups]);

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left disabled:opacity-50 ${isAI ? 'bg-indigo-50 border border-indigo-100' : ''}`}
    >
      <div className={`w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center ${isAI ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-blue-100'}`}>
        {isAI
          ? <Bot className="w-5 h-5 text-white" />
          : user.avatar_url
          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-blue-600 font-bold text-[14px]">{user.full_name?.charAt(0)}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-slate-900 truncate">{user.full_name}</p>
        {isAI
          ? <p className="text-[11px] text-indigo-500 font-medium">AI • Ask anything about the community</p>
          : mutualCount !== null && mutualCount > 0 && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {mutualCount} mutual communit{mutualCount === 1 ? 'y' : 'ies'}
            </p>
          )
        }
      </div>
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin text-slate-400 flex-shrink-0" />
        : <MessageCircle className={`w-4 h-4 flex-shrink-0 ${isAI ? 'text-indigo-400' : 'text-slate-300'}`} />
      }
    </button>
  );
}