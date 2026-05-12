import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  MapPin,
  MessageCircle,
  Shield,
  Users,
} from 'lucide-react';
import { categoryAccent } from './CommunityHubCard';

const categoryStyles = {
  Shuls:         'bg-violet-50 text-violet-700',
  Chesed:        'bg-emerald-50 text-emerald-700',
  Learning:      'bg-amber-50 text-amber-700',
  Events:        'bg-rose-50 text-rose-700',
  Singles:       'bg-fuchsia-50 text-fuchsia-700',
  Parents:       'bg-orange-50 text-orange-700',
  Neighborhoods: 'bg-cyan-50 text-cyan-700',
  Hobbies:       'bg-lime-50 text-lime-700',
  Lifestyle:     'bg-teal-50 text-teal-700',
  Values:        'bg-indigo-50 text-indigo-700',
  'Buy/Sell':    'bg-stone-50 text-stone-700',
};

const TYPE_PROMPTS = {
  Shuls:         ['Share a minyan time or shiur update', 'Post a community announcement', 'Ask a halacha question'],
  Chesed:        ['Post a chesed need or request', 'Offer help for meals or rides', 'Share a volunteer opportunity'],
  Learning:      ['Share a Torah thought or dvar', 'Start a Daf Yomi discussion', 'Recommend a shiur or sefer'],
  Events:        ['Post an upcoming community event', 'Share a mazel tov announcement', 'Coordinate volunteers or setup'],
  Singles:       ['Share an upcoming singles event', 'Post a question for the group', 'Suggest a social activity'],
  Parents:       ['Find carpool availability', 'Organize a Shabbos playdate', 'Ask for babysitter leads'],
  Neighborhoods: ['Post a local neighborhood update', 'Share lost and found', 'Report closures or safety info'],
  Hobbies:       ['Organize a pickup game or activity', 'Share schedule or location', 'Invite members to join'],
  Lifestyle:     ['Share a Shabbos hosting opportunity', 'Connect with new community members', 'Post a helpful local tip'],
  Values:        ['Start a thoughtful discussion', 'Share a family parenting question', 'Recommend a resource or shiur'],
  'Buy/Sell':    ['Post an item for sale or giveaway', 'Request something you need', 'Share a gemach listing'],
};
const DEFAULT_PROMPTS = ['Introduce yourself to the group', 'Share something helpful or relevant', 'Ask a question for community members'];

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function CommunityHubDetail({ community, currentUser, onBack, onToggleJoin, joiningId }) {
  const [activeTab, setActiveTab] = useState('posts');
  const accent = categoryAccent[community.category] || 'from-blue-500 to-slate-700';
  const prompts = TYPE_PROMPTS[community.category] || DEFAULT_PROMPTS;
  const isJoining = joiningId === community.id;

  return (
    <main className="min-h-screen bg-[#F7F9FC] mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 pb-8 sm:px-4 sm:pt-4">
        <button
          onClick={onBack}
          className="mb-3 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Communities
        </button>

        {/* Header card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Cover / gradient banner */}
          <div
            className={`relative h-24 bg-gradient-to-br ${accent}`}
            style={
              community.cover_url
                ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
            }
          >
            {community.cover_url && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />}
            {/* Avatar overlapping banner */}
            <div
              className={`absolute -bottom-5 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-[14px] font-black text-white shadow-md ring-2 ring-white`}
            >
              {community.logo_url ? (
                <img src={community.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                initials(community.name)
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black leading-tight text-slate-950">{community.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {community.category && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${categoryStyles[community.category] || 'bg-slate-100 text-slate-600'}`}>
                    {community.category}
                  </span>
                )}
                {community.location && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="h-3 w-3" />
                    {community.location}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onToggleJoin}
              disabled={isJoining}
              className={`h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${
                community.joined
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isJoining ? '...' : community.joined ? 'Leave' : 'Join'}
            </button>
          </div>

          {community.description && (
            <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600">{community.description}</p>
          )}

          {/* Stats bar */}
          <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              {(community.memberCount || 0).toLocaleString()} members
            </span>
            {community.joined && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                <Shield className="h-3.5 w-3.5" />
                You're a member
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-t border-slate-100">
            {['posts', 'members', 'about'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[13px] font-bold capitalize transition ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-3">
          {activeTab === 'posts' && (
            <PostsTab community={community} prompts={prompts} />
          )}
          {activeTab === 'members' && (
            <MembersTab community={community} />
          )}
          {activeTab === 'about' && (
            <AboutTab community={community} accent={accent} />
          )}
        </div>
      </section>
    </main>
  );
}

function PostsTab({ community, prompts }) {
  if (!community.joined) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <MessageCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <h3 className="text-base font-bold text-slate-800">Join to see posts</h3>
        <p className="mt-1 text-sm text-slate-500">Members can post, comment, and participate in this community.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Empty state with post idea prompts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <MessageCircle className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-600">What's on your mind? Start a conversation.</p>
        </div>
        <div className="mt-4 space-y-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-[13px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 active:scale-[0.99]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-500">No posts yet — be the first to post!</p>
      </div>
    </div>
  );
}

function MembersTab({ community }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{(community.memberCount || 0).toLocaleString()} members</p>
          <p className="text-xs text-slate-500">in this community</p>
        </div>
      </div>

      {community.joined ? (
        <p className="mt-4 text-sm text-slate-500">
          You're a member of this community. Member profiles are visible to other members.
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Join this community to connect with its members.
        </p>
      )}
    </div>
  );
}

function AboutTab({ community, accent }) {
  return (
    <div className="space-y-3">
      {community.description && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-black text-slate-900">About this community</h3>
          <p className="text-sm leading-relaxed text-slate-600">{community.description}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-slate-900">Details</h3>
        <div className="space-y-2.5">
          {community.category && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Type</span>
              <span className="font-semibold text-slate-700">{community.category}</span>
            </div>
          )}
          {community.location && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Location</span>
              <span className="font-semibold text-slate-700">{community.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Privacy</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              {community.privacy || 'Public'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Members</span>
            <span className="font-semibold text-slate-700">{(community.memberCount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
