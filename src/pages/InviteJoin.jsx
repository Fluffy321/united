import React, { useState, useEffect } from 'react';
import { dataService, incrementCounter } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Users, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function InviteJoin() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type'); // 'community' | 'group'
  const id   = params.get('id');

  const { user: currentUser } = useAuth();
  const [resource, setResource] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | preview | joining | joined | error
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    if (!id || !type) { setStatus('error'); return; }

    const loadResource = async () => {
      try {
        const res = type === 'community'
          ? await dataService.entities.Community.filter({ id }).then(r => r[0])
          : await dataService.entities.CommunityGroup.filter({ id }).then(r => r[0]);

        if (!res) { setStatus('error'); return; }
        setResource(res);

        if (currentUser) {
          // Check if already member
          if (type === 'community') {
            const existing = await dataService.entities.UserCommunity.filter({ user_id: currentUser.id, community_id: id });
            if (existing.length > 0) { setAlreadyMember(true); }
          } else {
            const existing = await dataService.entities.GroupMember.filter({ user_id: currentUser.id, group_id: id });
            if (existing.length > 0) { setAlreadyMember(true); }
          }
        }
        setStatus('preview');
      } catch { setStatus('error'); }
    };
    loadResource();
  }, [currentUser?.id]);

  const handleJoin = async () => {
    if (!currentUser) {
      dataService.auth.redirectToLogin(window.location.href);
      return;
    }
    if (alreadyMember) {
      window.location.href = createPageUrl('Communities');
      return;
    }
    setStatus('joining');
    if (type === 'community') {
      const existing = await dataService.entities.UserCommunity.filter({ user_id: currentUser.id, community_id: id });
      if (existing.length === 0) {
        await dataService.entities.UserCommunity.create({ user_id: currentUser.id, community_id: id, role: 'Member' });
        await incrementCounter('communities', 'follower_count', id, 1);
      }
    } else {
      if (resource.is_private) {
        await dataService.entities.GroupJoinRequest.create({
          group_id: id, group_name: resource.name,
          user_id: currentUser.id, user_name: currentUser.full_name, status: 'pending',
        });
      } else {
        const existing = await dataService.entities.GroupMember.filter({ user_id: currentUser.id, group_id: id });
        if (existing.length === 0) {
          await dataService.entities.GroupMember.create({ group_id: id, user_id: currentUser.id, user_name: currentUser.full_name, role: 'member' });
          await incrementCounter('community_groups', 'member_count', id, 1);
        }
      }
    }
    setStatus('joined');
  };

  const goToCommunities = () => {
    window.location.href = createPageUrl('Communities');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (status === 'error' || !resource) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-[18px] font-bold text-slate-800 mb-2">Invalid invite link</h2>
        <p className="text-[14px] text-slate-500 mb-6">This link may have expired or is no longer valid.</p>
        <button onClick={goToCommunities} className="px-6 py-3 rounded-full text-white text-[14px] font-semibold" style={{ background: '#2563EB' }}>
          Browse Communities
        </button>
      </div>
    );
  }

  const isGroup = type === 'group';
  const memberCount = isGroup ? (resource.member_count || 0) : (resource.follower_count || 0);
  const coverBg = resource.cover_image_url || null;
  const logo = resource.logo_url || null;
  const isPending = isGroup && resource.is_private;

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      {/* Cover */}
      <div
        className="h-48 flex-shrink-0 relative flex items-end"
        style={{
          background: coverBg ? `url(${coverBg}) center/cover` : 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 100%)',
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative px-5 pb-5 w-full">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-white shadow-lg overflow-hidden flex items-center justify-center">
            {logo
              ? <img src={logo} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-[#2563EB]">{resource.name?.charAt(0)}</span>
            }
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 pt-4 pb-10 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 mb-4" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <div className="flex items-start gap-2 mb-1">
            <h1 className="text-[20px] font-bold text-slate-900 leading-tight flex-1">{resource.name}</h1>
          </div>

          {(resource.type || resource.category) && (
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 mb-3">
              {resource.type || resource.category}
            </span>
          )}

          {(resource.description_short || resource.description) && (
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
              {resource.description_short || resource.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-[13px] text-slate-500 mb-5">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {memberCount.toLocaleString()} member{memberCount !== 1 ? 's' : ''}
            </span>
            {(resource.neighborhood || resource.location) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {resource.neighborhood || resource.location}
              </span>
            )}
          </div>

          {/* CTA */}
          {status === 'joined' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-[16px] font-bold text-slate-900">
                {isPending ? 'Request sent!' : "You're in! 🎉"}
              </p>
              <p className="text-[13px] text-slate-500 text-center">
                {isPending
                  ? 'The admin will review your request shortly.'
                  : `Welcome to ${resource.name}!`}
              </p>
              <button
                onClick={goToCommunities}
                className="mt-1 flex items-center gap-2 px-6 py-3 rounded-full text-white text-[14px] font-semibold"
                style={{ background: '#2563EB' }}
              >
                Open App <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={status === 'joining'}
              className="w-full py-4 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
              style={{ background: alreadyMember ? '#64748B' : '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
            >
              {status === 'joining'
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : alreadyMember
                ? '✓ Already a member — Open App'
                : !currentUser
                ? `Sign in to join ${resource.name}`
                : isPending
                ? `🔒 Request to join`
                : `Join ${resource.name}`}
            </button>
          )}
        </div>

        <p className="text-center text-[12px] text-slate-400">
          You were invited to join this community on <span className="font-semibold text-[#2563EB]">Kehilla</span>
        </p>
      </div>
    </div>
  );
}