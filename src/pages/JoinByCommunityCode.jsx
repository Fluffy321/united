import React, { useState, useEffect } from 'react';
import { dataService, incrementCounter } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Users, MapPin, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// /join?code=ABC123
export default function JoinByCommunityCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const navigate = useNavigate();

  const { user: currentUser } = useAuth();
  const [invite, setInvite] = useState(null);
  const [community, setCommunity] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | preview | joining | joined | error | expired
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [inviterName, setInviterName] = useState('');

  useEffect(() => {
    if (!code) { setStatus('error'); return; }
    loadInvite();
  }, [currentUser?.id]);

  const loadInvite = async () => {
    try {
      const invites = await dataService.entities.InviteLink.filter({ code });
      const inv = invites[0];

      if (!inv) { setStatus('error'); return; }
      if (!inv.is_active) { setStatus('expired'); return; }
      if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
        await dataService.entities.InviteLink.update(inv.id, { is_active: false });
        setStatus('expired');
        return;
      }
      if (inv.max_uses && (inv.uses_count || 0) >= inv.max_uses) {
        setStatus('expired');
        return;
      }

      setInvite(inv);
      setInviterName(inv.inviter_name || 'A community member');

      const comm = await dataService.entities.Community.filter({ id: inv.community_id });
      if (!comm[0]) { setStatus('error'); return; }
      setCommunity(comm[0]);

      if (currentUser) {
        const existing = await dataService.entities.UserCommunity.filter({
          user_id: currentUser.id,
          community_id: inv.community_id
        });
        setAlreadyMember(existing.length > 0);
      }

      setStatus('preview');
    } catch {
      setStatus('error');
    }
  };

  const handleJoin = async () => {
    if (!currentUser) {
      // Redirect to login, come back here after
      dataService.auth.redirectToLogin(window.location.href);
      return;
    }
    if (alreadyMember) {
      navigate(`/communities/${community.id}`);
      return;
    }

    setStatus('joining');
    try {
      const existing = await dataService.entities.UserCommunity.filter({
        user_id: currentUser.id,
        community_id: invite.community_id
      });
      if (existing.length === 0) {
        await dataService.entities.UserCommunity.create({
          user_id: currentUser.id,
          community_id: invite.community_id,
          role: 'Member',
          invited_by: invite.inviter_id,
          invited_by_name: invite.inviter_name,
        });
        // Increment follower count and uses count
        await Promise.all([
          incrementCounter('communities', 'follower_count', invite.community_id, 1),
          dataService.entities.InviteLink.update(invite.id, {
            uses_count: (invite.uses_count || 0) + 1
          }),
        ]);
      }
      setStatus('joined');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-[#F0F6FF] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-[20px] font-bold text-slate-800 mb-2">This invite has expired</h2>
        <p className="text-[14px] text-slate-500 mb-6">Ask your friend for a fresh invite link.</p>
        <button
          onClick={() => navigate('/Communities')}
          className="px-6 py-3 rounded-full bg-blue-600 text-white text-[14px] font-semibold"
        >
          Browse Communities
        </button>
      </div>
    );
  }

  if (status === 'error' || !community) {
    return (
      <div className="min-h-screen bg-[#F0F6FF] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-[20px] font-bold text-slate-800 mb-2">Invalid invite link</h2>
        <p className="text-[14px] text-slate-500 mb-6">This link may be incorrect or no longer valid.</p>
        <button
          onClick={() => navigate('/Communities')}
          className="px-6 py-3 rounded-full bg-blue-600 text-white text-[14px] font-semibold"
        >
          Browse Communities
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F6FF] flex flex-col">
      {/* Cover */}
      <div
        className="h-52 flex-shrink-0 relative"
        style={{
          background: community.cover_image_url
            ? `url(${community.cover_image_url}) center/cover`
            : 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 100%)',
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-4 left-5">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg overflow-hidden flex items-center justify-center">
            {community.logo_url
              ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-blue-600">{community.name?.charAt(0)}</span>
            }
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pt-4 pb-12 max-w-lg mx-auto w-full">
        {/* Invited by banner */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-[13px] text-amber-800 font-medium">
            <span className="font-bold">{inviterName}</span> invited you to join this community
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 mb-4 shadow-sm">
          <h1 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">{community.name}</h1>

          {(community.type || community.category) && (
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 mb-3">
              {community.type || community.category}
            </span>
          )}

          {(community.description_short || community.description) && (
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
              {community.description_short || community.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-[13px] text-slate-500 mb-5">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {(community.follower_count || 0).toLocaleString()} members
            </span>
            {community.neighborhood && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {community.neighborhood}
              </span>
            )}
          </div>

          {/* CTA */}
          {status === 'joined' ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-[17px] font-bold text-slate-900">You're in! 🎉</p>
              <p className="text-[13px] text-slate-500">Welcome to {community.name}!</p>
              <button
                onClick={() => navigate(`/communities/${community.id}`)}
                className="mt-2 flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white text-[14px] font-bold"
              >
                Open Community <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={status === 'joining'}
              className="w-full py-4 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
              style={{
                background: alreadyMember ? '#64748B' : '#2563EB',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
              }}
            >
              {status === 'joining'
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : alreadyMember
                ? '✓ Already a member — Open Community'
                : !currentUser
                ? `Sign in to join ${community.name}`
                : `Join ${community.name}`}
            </button>
          )}
        </div>

        <p className="text-center text-[12px] text-slate-400">
          Powered by <span className="font-semibold text-blue-600">Kehilla</span> — your Jewish community hub
        </p>
      </div>
    </div>
  );
}