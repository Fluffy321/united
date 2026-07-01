import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { messagesService, findOrCreateDirectConversation } from '@/services';
import UserAvatar from '@/components/common/UserAvatar';
import { toast } from 'sonner';
import { captureError } from '@/lib/analytics';
import { listUser } from '@/services/entityServices';

export default function NewMessageComposer({ currentUser, onConversationSelect, onCancel }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingConversations, setExistingConversations] = useState(new Set());

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      // Get all users (simplified - in production would filter by shared communities)
      const users = await listUser('-created_date', 50);
      setMembers(users.filter(u => u.id !== currentUser.id));

      // Get existing conversation IDs to mark them
      const conversations = await messagesService.listConversations('-updated_date', 100);
      const existingIds = new Set(
        conversations
          .filter(c => c.participant_ids?.includes(currentUser.id))
          .map(c => {
            const idx = c.participant_ids.indexOf(currentUser.id);
            return c.participant_ids[idx === 0 ? 1 : 0];
          })
      );
      setExistingConversations(existingIds);
    } catch (e) {
      captureError(e, { context: 'NewMessageComposer: load members' });
    }
  };

  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMember = async (member) => {
    try {
      const conversation = await findOrCreateDirectConversation(currentUser, {
        id: member.id,
        name: member.display_name || member.full_name || 'User',
        avatar_url: member.avatar_url || '',
        age_range: member.age_range || '18+',
      });
      onConversationSelect(conversation);
    } catch (e) {
      captureError(e, { context: 'NewMessageComposer: create or find conversation' });
      toast.error(e?.message || 'Could not start conversation');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 flex-shrink-0">
        <button onClick={onCancel} aria-label="Cancel" className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-[18px] font-bold text-slate-900">New Message</h2>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search members…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-slate-100 rounded-full text-[13px] outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <span className="text-3xl mb-3">🔍</span>
            <p className="text-slate-600 font-medium">{searchQuery ? 'No members found' : 'Start typing to search'}</p>
          </div>
        ) : (
          filteredMembers.map(member => (
            <button
              key={member.id}
              onClick={() => handleSelectMember(member)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <UserAvatar user={member} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-slate-900">{member.full_name}</p>
                {existingConversations.has(member.id) && (
                  <p className="text-[11px] text-slate-400 mt-0.5">Conversation exists</p>
                )}
              </div>
              <span className="text-slate-300">›</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
