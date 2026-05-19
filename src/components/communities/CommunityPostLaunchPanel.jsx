import React, { useState } from 'react';
import { BookOpen, Calendar, CheckCircle2, HelpCircle, MessageCircle, Users, X } from 'lucide-react';
import CommunityInviteModal from './CommunityInviteModal';

// ── Type-aware activation actions ────────────────────────────────────────────

const LAUNCH_ACTIONS = {
  neighborhood: [
    { id: 'invite',  icon: Users,          title: 'Invite neighbors',       desc: 'Share the community link so neighbors can find it',    tab: null },
    { id: 'post',    icon: MessageCircle,  title: 'Share a local update',   desc: 'Start the conversation with something nearby',          tab: 'posts' },
    { id: 'event',   icon: Calendar,       title: 'Add a community event',  desc: 'Block parties, meetups, or local happenings',           tab: 'events' },
  ],
  shul: [
    { id: 'invite',    icon: Users,        title: 'Invite members',          desc: 'Share the community link',                              tab: null },
    { id: 'announce',  icon: MessageCircle,title: 'Post an announcement',    desc: 'Shabbos times, community news, or upcoming events',     tab: 'announcements' },
    { id: 'event',     icon: Calendar,     title: 'Add an upcoming event',   desc: 'A shiur, program, or holiday event',                    tab: 'events' },
    { id: 'resource',  icon: BookOpen,     title: 'Upload a resource',       desc: 'Schedule, guide, or member document',                   tab: 'resources' },
  ],
  chesed: [
    { id: 'invite',  icon: Users,          title: 'Invite volunteers',      desc: 'Share the link so people can join and help',            tab: null },
    { id: 'need',    icon: HelpCircle,     title: 'Post the first need',    desc: 'Open needs are the heart of a chesed community',        tab: 'openNeeds' },
    { id: 'event',   icon: Calendar,       title: 'Add a volunteer event',  desc: 'Organize your first chesed gathering',                  tab: 'events' },
  ],
  parents: [
    { id: 'invite',  icon: Users,          title: 'Invite parents',         desc: 'Share the community link',                              tab: null },
    { id: 'post',    icon: HelpCircle,     title: 'Ask the first question', desc: 'Start with something parents are wondering about',      tab: 'questions' },
    { id: 'event',   icon: Calendar,       title: 'Share a family event',   desc: 'School events, activities, or playdates',               tab: 'events' },
  ],
  learning: [
    { id: 'invite',    icon: Users,        title: 'Invite learners',         desc: 'Share the community link',                              tab: null },
    { id: 'resource',  icon: BookOpen,     title: 'Share a source or class', desc: 'Add a shiur, source sheet, or learning link',           tab: 'resources' },
    { id: 'post',      icon: MessageCircle, title: 'Post a discussion prompt', desc: 'Start the learning conversation',                    tab: 'discussions' },
  ],
  events: [
    { id: 'invite',  icon: Users,          title: 'Invite people',          desc: 'Share the community link',                              tab: null },
    { id: 'event',   icon: Calendar,       title: 'Add the first event',    desc: 'A gathering, party, or happening',                      tab: 'events' },
    { id: 'post',    icon: MessageCircle,  title: 'Share a preview',        desc: 'Get people excited about what\'s coming',               tab: 'posts' },
  ],
  marketplace: [
    { id: 'invite',  icon: Users,          title: 'Invite buyers & sellers', desc: 'Share the community link',                           tab: null },
    { id: 'post',    icon: MessageCircle,  title: 'Welcome members',        desc: 'Set the vibe with an intro post',                       tab: 'posts' },
    { id: 'event',   icon: Calendar,       title: 'Add a market event',     desc: 'A swap, sale, or community gathering',                  tab: 'events' },
  ],
  general: [
    { id: 'invite',  icon: Users,          title: 'Invite members',         desc: 'Share the community link',                              tab: null },
    { id: 'post',    icon: MessageCircle,  title: 'Start the conversation', desc: 'Post a welcome message or question',                    tab: 'posts' },
    { id: 'event',   icon: Calendar,       title: 'Add an event',           desc: 'Bring people together in person',                       tab: 'events' },
  ],
};

function isComplete(actionId, tab, { posts, events, resources, activeNeeds, members }) {
  if (actionId === 'invite')                                    return members.length > 1;
  if (tab === 'events'       || actionId === 'event')           return events.length > 0;
  if (tab === 'resources'    || actionId === 'resource')        return resources.length > 0;
  if (tab === 'openNeeds'    || actionId === 'need')            return activeNeeds.length > 0;
  if (tab === 'announcements'|| actionId === 'announce')        return posts.some((p) => ['announcement'].includes(String(p.type || p.post_type || '')));
  if (tab === 'discussions')                                    return posts.some((p) => ['discussion', 'learning'].includes(String(p.type || p.post_type || '')));
  if (tab === 'questions')                                      return posts.some((p) => ['question', 'ask'].includes(String(p.type || p.post_type || '')));
  if (tab === 'posts'        || actionId === 'post')            return posts.length > 1;
  return false;
}

export default function CommunityPostLaunchPanel({
  community,
  typeConfig,
  posts,
  events,
  resources,
  activeNeeds,
  members,
  currentUser,
  onTabChange,
  onDismiss,
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const typeKey = typeConfig?.key || community?.community_type || 'general';
  const actions = LAUNCH_ACTIONS[typeKey] || LAUNCH_ACTIONS.general;
  const data = { posts, events, resources, activeNeeds, members };
  const completedCount = actions.filter((a) => isComplete(a.id, a.tab, data)).length;
  const allDone = completedCount === actions.length;

  const handleAction = (action) => {
    if (action.id === 'invite') {
      setShowInviteModal(true);
      return;
    }
    if (action.tab) {
      onTabChange(action.tab);
    }
  };

  return (
    <>
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg select-none">
          🚀
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-black text-slate-950 leading-tight truncate">{community.name} is live!</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight">
            {allDone
              ? 'All done — great start! 🎉'
              : `${completedCount} of ${actions.length} steps complete · activate your community`}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-emerald-200 text-slate-400 hover:bg-slate-50 active:scale-95 transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="px-4 pb-3">
        <div className="h-1 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: actions.length ? `${(completedCount / actions.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* ── Action rows ── */}
      <div className="border-t border-emerald-100 divide-y divide-emerald-50">
        {actions.map((action) => {
          const done = isComplete(action.id, action.tab, data);
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => !done && handleAction(action)}
              disabled={done}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${done ? 'opacity-60 cursor-default' : 'hover:bg-emerald-50/80 active:bg-emerald-100'}`}
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${done ? 'border-emerald-200 bg-emerald-100' : 'border-emerald-200 bg-white'}`}>
                {done
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  : <Icon className="h-4 w-4 text-emerald-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-black leading-tight ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {action.title}
                </p>
                {!done && (
                  <p className="text-[11px] font-semibold text-slate-400 leading-tight mt-0.5">{action.desc}</p>
                )}
              </div>
              {!done && (
                <span className="flex-shrink-0 text-[11px] font-black text-emerald-600">
                  {action.id === 'invite' ? 'Share' : 'Go →'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Dismiss footer ── */}
      <div className="flex items-center justify-between border-t border-emerald-100 px-4 py-2.5">
        <p className="text-[10px] font-semibold text-slate-400">Find these actions in Admin Center anytime</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] font-black text-slate-400 hover:text-slate-600 transition active:opacity-70"
        >
          Skip for now
        </button>
      </div>

    </div>

    {showInviteModal && (
      <CommunityInviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        community={community}
        currentUser={currentUser}
        typeConfig={typeConfig}
      />
    )}
    </>
  );
}
