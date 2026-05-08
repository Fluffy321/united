import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { dataService } from '@/services';

function SuggestedCard({ community, isJoined, isJoining, onOpen, onJoin }) {
  if (!community?.id || !community?.name) return null;
  const initials = community.name.slice(0, 2).toUpperCase();

  const handleClick = (e) => {
    if (e.target.closest('[data-join-btn]')) return;
    onOpen(community.id);
  };

  return (
    <div
      onClick={handleClick}
      className="flex-shrink-0 w-52 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-150 cursor-pointer overflow-hidden"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2">
          {community.logo_url ? (
            <img src={community.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-slate-900 truncate leading-tight">{community.name}</p>
            <p className="text-[10px] text-slate-400">{(community.follower_count || 0).toLocaleString()} members</p>
          </div>
        </div>
        {community.ai_reason && (
          <p className="text-[11px] text-violet-700 bg-violet-50 rounded-lg px-2 py-1 mb-2 font-medium line-clamp-2">
            ✨ {community.ai_reason}
          </p>
        )}
        <button
          data-join-btn="true"
          onClick={e => { e.stopPropagation(); onJoin(community); }}
          disabled={isJoining}
          className={`w-full rounded-full py-1.5 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-60 ${
            isJoined ? 'bg-slate-100 text-slate-500' : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {isJoining ? '…' : isJoined ? '✓ Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}

export default function SuggestedCommunities({ currentUser, allCommunities, userCommunityIds, joiningId, onOpen, onJoin }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  // Use ref to prevent concurrent or duplicate fetches
  const fetchingRef = useRef(false);

  const fetchSuggestions = async () => {
    if (!allCommunities?.length || fetchingRef.current) return;
    setLoading(true);
    fetchingRef.current = true;

    // Build context for AI
    const myCommunities = allCommunities.filter(c => userCommunityIds.has(c.id));
    const candidateCommunities = allCommunities.filter(c => !userCommunityIds.has(c.id)).slice(0, 30);

    if (candidateCommunities.length === 0) { setLoading(false); setFetched(true); return; }

    const userContext = currentUser
      ? `User interests: ${currentUser.interests?.join(', ') || 'not set'}. Location: ${currentUser.city || currentUser.location || 'Five Towns, NY'}. Already joined: ${myCommunities.map(c => c.name).join(', ') || 'none'}.`
      : `Location: Five Towns, NY. No communities joined yet.`;

    const candidateList = candidateCommunities.map(c =>
      `ID:${c.id} | Name:${c.name} | Type:${c.type || c.category || 'Community'} | Members:${c.follower_count || 0} | Desc:${c.description_short || c.description || ''}`
    ).join('\n');

    let result;
    try {
      result = await dataService.integrations.Core.InvokeLLM({
      prompt: `You are a community recommendation engine for a Jewish social network app focused on the Five Towns, NY area.

User context: ${userContext}

Available communities to recommend (pick the best 4):
${candidateList}

Return a JSON object with a "recommendations" array of exactly 4 items, each with:
- "id": the community ID from the list
- "reason": a short (max 8 words) reason why this community fits the user

Only return IDs from the provided list. Prioritize variety across types.`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      });
    } catch {
      setLoading(false);
      setFetched(true);
      fetchingRef.current = false;
      return;
    }

    const recs = result?.recommendations || [];
    const enriched = recs
      .map(r => {
        const community = candidateCommunities.find(c => c.id === r.id);
        if (!community) return null;
        return { ...community, ai_reason: r.reason };
      })
      .filter(Boolean)
      .slice(0, 4);

    setSuggestions(enriched);
    setLoading(false);
    setFetched(true);
    fetchingRef.current = false;
  };

  useEffect(() => {
    // Only fetch once — when communities first become available
    if (!fetched && !fetchingRef.current && allCommunities?.length > 0) {
      fetchSuggestions();
    }

  }, [fetched, allCommunities?.length > 0]);

  if (!loading && fetched && suggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-[15px] font-bold text-slate-900">Suggested for You</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">Demo</span>
        </div>
        {fetched && !loading && (
          <button
            onClick={() => { fetchingRef.current = false; fetchSuggestions(); }}
            className="p-1.5 rounded-full text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            title="Refresh suggestions"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-5">
          <Loader2 className="w-4 h-4 animate-spin text-violet-500 flex-shrink-0" />
          <p className="text-[13px] text-slate-500">Finding communities tailored for you…</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {suggestions.map(c => (
            <SuggestedCard
              key={c.id}
              community={c}
              isJoined={userCommunityIds.has(c.id)}
              isJoining={joiningId === c.id}
              onOpen={onOpen}
              onJoin={onJoin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
