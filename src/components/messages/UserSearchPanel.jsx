import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, MessageCircle, Users, Bot } from 'lucide-react';
import { dataService, findOrCreateDirectConversation, checkRateLimit, RateLimitError } from '@/services';
import { shouldUseSupabase, supabase } from '@/api/supabaseClient';
import { canMessage } from '@/lib/messagingPermissions';
import { AI_AGENT, buildAIConversation } from '@/lib/aiAgent';
import { toast } from 'sonner';
import { COMMUNITIES_ENABLED } from '@/config/features';

const DEBOUNCE_MS = 300;

// Escape characters with special meaning in a Postgres ILIKE pattern.
const escapeIlike = (s) => s.replace(/[\\%_]/g, '\\$&');

export default function UserSearchPanel({ currentUser, onConversationOpened }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [userCommunities, setUserCommunities] = useState(null);

  // Debounce timer and in-flight query tracker (stale-result guard).
  const debounceRef = useRef(null);
  const latestQueryRef = useRef('');

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const runSearch = async (q) => {
    try {
      let filtered;

      if (shouldUseSupabase && supabase) {
        // Server-side ILIKE: only rows matching the name prefix travel over the wire.
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id,display_name,avatar_url,username,city,created_at')
          .ilike('display_name', `%${escapeIlike(q)}%`)
          .neq('id', currentUser.id)
          .limit(20);
        if (error) throw error;
        filtered = (data || []).map(row => ({
          ...row,
          full_name: row.display_name || 'User',
          created_date: row.created_at,
        }));
      } else {
        // Local/demo mode: bounded fetch, client-side filter.
        const allUsers = await dataService.entities.User.list('-created_date', 200);
        const lq = q.toLowerCase();
        filtered = allUsers.filter(u =>
          u.id !== currentUser.id &&
          u.message_settings?.searchable !== false &&
          u.full_name?.toLowerCase().includes(lq)
        ).slice(0, 20);
      }

      // Discard if a newer keystroke has already superseded this fetch.
      if (q !== latestQueryRef.current) return;

      setResults(filtered.slice(0, 20));

      // Lazily load current user's communities for mutual community counts.
      if (COMMUNITIES_ENABLED && !userCommunities) {
        const memberships = await dataService.entities.UserCommunity.filter({ user_id: currentUser.id });
        setUserCommunities(new Set(memberships.map(m => m.community_id)));
      }
    } catch {
      if (q === latestQueryRef.current) toast.error('Search failed');
    } finally {
      if (q === latestQueryRef.current) setSearching(false);
    }
  };

  const handleSearch = (q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);

    if (!q.trim()) {
      latestQueryRef.current = '';
      setResults([]);
      setSearching(false);
      return;
    }

    latestQueryRef.current = q;
    setSearching(true);
    debounceRef.current = setTimeout(() => runSearch(q), DEBOUNCE_MS);
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

      // Server-side rate limit check for new conversations
      await checkRateLimit('new_conversation');

      // Permission check
      const { canMessage: allowed } = await canMessage(currentUser, recipient.id);

      if (allowed) {
        const conv = await findOrCreateDirectConversation(currentUser, {
          id: recipient.id,
          name: recipient.full_name,
          avatar_url: recipient.avatar_url || '',
          age_range: recipient.age_range,
        });
        onConversationOpened(conv);
        setQuery('');
        setResults([]);
        toast.success('Conversation started!');
      } else {
        toast.info('You can message people you are allowed to contact on JUnited.');
      }
    } catch (err) {
      if (err instanceof RateLimitError) { toast.error(err.message); return; }
      toast.error('Something went wrong');
    }
    setActionLoading(null);
  };

  return (
    <div className="px-4 py-4 border-b border-slate-100 bg-white">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search people…"
          className="w-full pl-11 pr-4 py-3.5 text-[15px] bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 shadow-md font-medium"
        />
        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
          {results.map(user => (
            <UserResultRow
              key={user.id}
              user={user}
              currentUserCommunities={userCommunities}
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

function UserResultRow({ user, currentUserCommunities, loading, onClick }) {
  const [mutualCount, setMutualCount] = useState(null);
  const isAI = user.id === AI_AGENT.id;

  React.useEffect(() => {
    if (isAI || !COMMUNITIES_ENABLED || !currentUserCommunities) return;
    dataService.entities.UserCommunity.filter({ user_id: user.id }).then(memberships => {
      const theirCommunities = new Set(memberships.map(m => m.community_id));
      const count = [...currentUserCommunities].filter(id => theirCommunities.has(id)).length;
      setMutualCount(count);
    }).catch(() => setMutualCount(0));
  }, [user.id, currentUserCommunities]);

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
          ? <p className="text-[11px] text-indigo-500 font-medium">AI • Jewish knowledge helper</p>
          : COMMUNITIES_ENABLED && mutualCount !== null && mutualCount > 0 && (
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
