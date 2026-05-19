import React, { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsService, FRIEND_STATUS } from '@/services/friendsService';
import { supabase, shouldUseSupabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, UserRound, UserRoundX, UserRoundPlus, UserRoundCheck, X, Check, Clock, Search, ContactRound, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { dataService, findOrCreateDirectConversation } from '@/services';

const TABS = [
  { key: 'find',     label: 'Find' },
  { key: 'friends',  label: 'Friends' },
  { key: 'requests', label: 'Requests' },
  { key: 'sent',     label: 'Sent' },
];

const DEBOUNCE_MS = 280;
const escapeIlike = (s) => s.replace(/[\\%_]/g, '\\$&');
const normalizeContactValue = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9@.+]/g, '');

function Avatar({ user, size = 'w-10 h-10' }) {
  const initials = (user?.display_name || '?').slice(0, 2).toUpperCase();
  const colors = ['bg-blue-200 text-blue-800', 'bg-emerald-200 text-emerald-800', 'bg-violet-200 text-violet-800', 'bg-amber-200 text-amber-800'];
  const color = colors[(user?.id?.charCodeAt(0) || 0) % colors.length];

  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt="" className={`${size} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center py-12 px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-[14px] font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-[13px] text-slate-400">{body}</p>
    </div>
  );
}

export default function FriendsHub({ open, onOpenChange, currentUser }) {
  const [tab, setTab] = useState('find');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const uid = currentUser?.id;

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsMessage, setContactsMessage] = useState('');
  const debounceRef = useRef(null);
  const latestRef = useRef('');
  // Track which user IDs have in-flight request actions
  const [actionLoading, setActionLoading] = useState(null);

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends-list', uid],
    queryFn: () => friendsService.listFriends(uid),
    enabled: !!uid && open,
    staleTime: 30000,
  });

  const { data: incoming = [], isLoading: loadingIncoming } = useQuery({
    queryKey: ['friends-incoming', uid],
    queryFn: () => friendsService.getIncomingRequests(uid),
    enabled: !!uid && open,
    staleTime: 30000,
  });

  const { data: outgoing = [], isLoading: loadingOutgoing } = useQuery({
    queryKey: ['friends-outgoing', uid],
    queryFn: () => friendsService.getOutgoingRequests(uid),
    enabled: !!uid && open,
    staleTime: 30000,
  });

  const invalidate = useCallback(() => {
    ['friends-list', 'friends-incoming', 'friends-outgoing'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key, uid] })
    );
    queryClient.invalidateQueries({ queryKey: ['profile-friend-count', uid] });
  }, [uid, queryClient]);

  // Pre-computed lookup sets for O(1) relationship checks in search results
  const friendSet = new Set(friends.map((f) => f.friend_id));
  const sentSet   = new Map(outgoing.map((r) => [r.recipient_id, r.id]));
  const recvSet   = new Map(incoming.map((r) => [r.requester_id, r.id]));

  function getRelStatus(userId) {
    if (friendSet.has(userId))       return { status: FRIEND_STATUS.FRIENDS,          requestId: null };
    if (sentSet.has(userId))         return { status: FRIEND_STATUS.PENDING_SENT,      requestId: sentSet.get(userId) };
    if (recvSet.has(userId))         return { status: FRIEND_STATUS.PENDING_RECEIVED,  requestId: recvSet.get(userId) };
    return                                  { status: FRIEND_STATUS.NONE,              requestId: null };
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const acceptMutation = useMutation({
    mutationFn: ({ requestId, requesterUser }) =>
      friendsService.acceptRequest(requestId, currentUser, requesterUser),
    onSuccess: () => { invalidate(); toast.success('Friend request accepted!'); },
    onError:   () => toast.error('Could not accept request'),
  });

  const declineMutation = useMutation({
    mutationFn: (requestId) => friendsService.declineRequest(requestId),
    onSuccess: () => invalidate(),
    onError:   () => toast.error('Could not decline request'),
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId) => friendsService.cancelRequest(requestId),
    onSuccess: () => invalidate(),
    onError:   () => toast.error('Could not cancel request'),
  });

  const removeMutation = useMutation({
    mutationFn: (friendUserId) => friendsService.removeFriend(uid, friendUserId),
    onSuccess: () => { invalidate(); toast.success('Friend removed'); },
    onError:   () => toast.error('Could not remove friend'),
  });

  // ── Search ────────────────────────────────────────────────────────────────
  const runSearch = async (q) => {
    try {
      let results = [];
      if (shouldUseSupabase && supabase) {
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_url, username, city')
          .ilike('display_name', `%${escapeIlike(q)}%`)
          .neq('id', uid)
          .limit(25);
        if (error) throw error;
        results = data || [];
      } else {
        const users = await dataService.entities.User.list('-created_date', 200);
        const needle = q.toLowerCase();
        results = users
          .filter((user) => user.id !== uid)
          .filter((user) => (
            user.display_name?.toLowerCase().includes(needle) ||
            user.full_name?.toLowerCase().includes(needle) ||
            user.username?.toLowerCase().includes(needle)
          ))
          .slice(0, 25);
      }
      if (q !== latestRef.current) return;
      setSearchResults(results);
    } catch {
      if (q === latestRef.current) toast.error('Search failed');
    } finally {
      if (q === latestRef.current) setSearching(false);
    }
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) {
      latestRef.current = '';
      setSearchResults([]);
      setSearching(false);
      return;
    }
    latestRef.current = q;
    setSearching(true);
    debounceRef.current = setTimeout(() => runSearch(q), DEBOUNCE_MS);
  };

  const handleSendFromSearch = async (user) => {
    setActionLoading(user.id);
    try {
      await friendsService.sendRequest(currentUser, user);
      invalidate();
      toast.success('Friend request sent!');
    } catch (e) {
      toast.error(e.message === 'blocked' ? 'Cannot send request' : 'Could not send request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelFromSearch = async (requestId, userId) => {
    setActionLoading(userId);
    try {
      await friendsService.cancelRequest(requestId);
      invalidate();
    } catch {
      toast.error('Could not cancel');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptFromSearch = async (requestId, requesterUser) => {
    setActionLoading(requesterUser.id);
    try {
      await friendsService.acceptRequest(requestId, currentUser, requesterUser);
      invalidate();
      toast.success('You are now friends!');
    } catch {
      toast.error('Could not accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportContacts = async () => {
    setContactsMessage('');
    setContactsLoading(true);
    try {
      if (!navigator.contacts?.select) {
        setContactsMessage('Contact linking is not supported in this browser yet. You can still search by name.');
        return;
      }

      const contacts = await navigator.contacts.select(['name', 'email', 'tel'], { multiple: true });
      const emails = [...new Set(contacts.flatMap((contact) => contact.email || []).map(normalizeContactValue).filter(Boolean))];
      const phones = [...new Set(contacts.flatMap((contact) => contact.tel || []).map(normalizeContactValue).filter(Boolean))];
      const values = new Set([...emails, ...phones]);

      if (values.size === 0) {
        setContactsMessage('No usable email or phone details were found in those contacts.');
        return;
      }

      let matches = [];

      if (shouldUseSupabase && supabase) {
        const { data, error } = await supabase.rpc('match_contact_profiles', {
          p_emails: emails,
          p_phones: phones,
        });
        if (error) throw error;
        matches = data || [];
      } else {
        const users = await dataService.entities.User.list('-created_date', 500);
        matches = users.filter((candidate) => {
          if (candidate.id === uid) return false;
          const candidateValues = [candidate.email, candidate.phone, candidate.phone_number]
            .map(normalizeContactValue)
            .filter(Boolean);
          return candidateValues.some((value) => values.has(value));
        });
      }

      setSearchResults(matches);
      setSearchQuery('');
      setContactsMessage(matches.length
        ? `${matches.length} JUnited ${matches.length === 1 ? 'member' : 'members'} matched your contacts.`
        : 'No current JUnited members matched those contacts yet.'
      );
    } catch {
      setContactsMessage('Contacts access was not completed. You can still search by name.');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleMessageFriend = async (friendProfile) => {
    if (!friendProfile?.id || !currentUser?.id) return;
    setActionLoading(friendProfile.id);
    try {
      const conv = await findOrCreateDirectConversation(currentUser, {
        id: friendProfile.id,
        name: friendProfile.display_name || friendProfile.full_name?.split(' ')[0] || 'Friend',
        avatar_url: friendProfile.avatar_url || '',
        age_range: friendProfile.age_range || '18+',
      });
      onOpenChange(false);
      navigate(createPageUrl('Messages') + `?conversation=${conv.id}`);
    } catch {
      toast.error('Could not open messages');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openProfile = (userId) => {
    onOpenChange(false);
    navigate(createPageUrl('Profile') + `?id=${userId}`);
  };

  const incomingCount = incoming.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[88dvh] rounded-t-3xl p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-0 shrink-0">
          <SheetTitle className="text-[18px] font-black text-slate-950">Friends</SheetTitle>
        </SheetHeader>

        {/* Tab bar */}
        <div className="flex gap-1 px-5 pt-3 pb-0 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-black transition-all ${
                tab === t.key ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t.label}
              {t.key === 'requests' && incomingCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                  {incomingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-3 flex-1 overflow-y-auto">

          {/* ── Find tab ────────────────────────────────────────── */}
          {tab === 'find' && (
            <div className="flex flex-col h-full">
              {/* Search input */}
              <div className="px-5 pb-3">
                <button
                  type="button"
                  onClick={handleImportContacts}
                  disabled={contactsLoading}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] font-black text-blue-700 transition hover:bg-blue-100 active:scale-[0.99] disabled:opacity-60"
                >
                  {contactsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ContactRound className="h-4 w-4" />}
                  {contactsLoading ? 'Checking contacts...' : 'Link contacts to find friends'}
                </button>
                {contactsMessage && (
                  <p className="mb-3 rounded-2xl bg-slate-50 px-3 py-2 text-center text-[12px] font-semibold text-slate-500">
                    {contactsMessage}
                  </p>
                )}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name…"
                    className="w-full pl-10 pr-10 py-2.5 text-[14px] rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <ul className="divide-y divide-slate-100 px-5">
                  {searchResults.map((user) => {
                    const rel = getRelStatus(user.id);
                    const busy = actionLoading === user.id;
                    return (
                      <li key={user.id} className="flex items-center gap-3 py-3">
                        <button
                          onClick={() => openProfile(user.id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <Avatar user={user} />
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-slate-900 truncate">
                              {user.display_name || 'User'}
                            </p>
                            {user.city && (
                              <p className="text-[12px] text-slate-400 truncate">{user.city}</p>
                            )}
                          </div>
                        </button>

                        {/* Relationship action */}
                        <div className="shrink-0">
                          {rel.status === FRIEND_STATUS.FRIENDS && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-[12px] font-black text-emerald-700">
                              <UserRoundCheck className="h-3.5 w-3.5" />
                              Friends
                            </span>
                          )}

                          {rel.status === FRIEND_STATUS.PENDING_SENT && (
                            <button
                              onClick={() => handleCancelFromSearch(rel.requestId, user.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[12px] font-black text-slate-500 transition hover:bg-red-50 hover:text-red-500 hover:border-red-200 disabled:opacity-50"
                            >
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                              Requested
                            </button>
                          )}

                          {rel.status === FRIEND_STATUS.PENDING_RECEIVED && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAcceptFromSearch(rel.requestId, user)}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-2.5 py-1.5 text-[12px] font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                              >
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                Accept
                              </button>
                              <button
                                onClick={() => declineMutation.mutate(rel.requestId)}
                                disabled={declineMutation.isPending}
                                className="flex items-center justify-center rounded-xl border border-slate-200 px-2 py-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                title="Decline"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          {rel.status === FRIEND_STATUS.NONE && (
                            <button
                              onClick={() => handleSendFromSearch(user)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-2.5 py-1.5 text-[12px] font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                            >
                              {busy
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <UserRoundPlus className="h-3.5 w-3.5" />
                              }
                              Add
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {searchQuery.trim() && !searching && searchResults.length === 0 && (
                <p className="px-5 py-8 text-center text-[13px] text-slate-400">No users found for "{searchQuery}"</p>
              )}

              {!searchQuery.trim() && searchResults.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="Search for people"
                  body="Type a name to find someone and send them a friend request."
                />
              )}
            </div>
          )}

          {/* ── My Friends ──────────────────────────────────────── */}
          {tab === 'friends' && (
            <>
              {loadingFriends ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : friends.length === 0 ? (
                <EmptyState
                  icon={UserRound}
                  title="No friends yet"
                  body="Use the Find tab to search for people and send friend requests."
                />
              ) : (
                <ul className="divide-y divide-slate-100 px-5">
                  {friends.map((f) => {
                    const profile = f.friend;
                    return (
                      <li key={f.id} className="flex items-center gap-3 py-3">
                        <button
                          onClick={() => openProfile(f.friend_id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <Avatar user={profile} />
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-slate-900 truncate">
                              {profile?.display_name || 'User'}
                            </p>
                            {profile?.city && (
                              <p className="text-[12px] text-slate-400 truncate">{profile.city}</p>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(f.friend_id)}
                          disabled={removeMutation.isPending}
                          className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:opacity-50"
                          title="Remove friend"
                        >
                          <UserRoundX className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMessageFriend(profile)}
                          disabled={actionLoading === profile?.id}
                          className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                          title="Message friend"
                        >
                          {actionLoading === profile?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* ── Incoming Requests ───────────────────────────────── */}
          {tab === 'requests' && (
            <>
              {loadingIncoming ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : incoming.length === 0 ? (
                <EmptyState
                  icon={UserRound}
                  title="No pending requests"
                  body="Friend requests from others will appear here."
                />
              ) : (
                <ul className="divide-y divide-slate-100 px-5">
                  {incoming.map((req) => {
                    const profile = req.requester;
                    return (
                      <li key={req.id} className="flex items-center gap-3 py-3">
                        <button
                          onClick={() => openProfile(req.requester_id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <Avatar user={profile} />
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-slate-900 truncate">
                              {profile?.display_name || 'User'}
                            </p>
                            {profile?.city && (
                              <p className="text-[12px] text-slate-400 truncate">{profile.city}</p>
                            )}
                          </div>
                        </button>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => acceptMutation.mutate({ requestId: req.id, requesterUser: profile })}
                            disabled={acceptMutation.isPending}
                            className="flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-[12px] font-black text-white transition active:scale-95 disabled:opacity-50 hover:bg-slate-800"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => declineMutation.mutate(req.id)}
                            disabled={declineMutation.isPending}
                            className="flex items-center justify-center rounded-xl border border-slate-200 px-2 py-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:opacity-50"
                            title="Decline"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* ── Sent Requests ───────────────────────────────────── */}
          {tab === 'sent' && (
            <>
              {loadingOutgoing ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : outgoing.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No pending requests sent"
                  body="Requests you've sent that haven't been accepted yet will appear here."
                />
              ) : (
                <ul className="divide-y divide-slate-100 px-5">
                  {outgoing.map((req) => {
                    const profile = req.recipient;
                    return (
                      <li key={req.id} className="flex items-center gap-3 py-3">
                        <button
                          onClick={() => openProfile(req.recipient_id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <Avatar user={profile} />
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-slate-900 truncate">
                              {profile?.display_name || 'User'}
                            </p>
                            {profile?.city && (
                              <p className="text-[12px] text-slate-400 truncate">{profile.city}</p>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => cancelMutation.mutate(req.id)}
                          disabled={cancelMutation.isPending}
                          className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
