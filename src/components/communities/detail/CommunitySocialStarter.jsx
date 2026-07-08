import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import MemberAvatarStack from './MemberAvatarStack';
import CommunityPresenceStrip from './CommunityPresenceStrip';
import CommunityMomentumPanel from './CommunityMomentumPanel';
import CommunityStarterFeed from './CommunityStarterFeed';
import CommunityRhythmStrip from './CommunityRhythmStrip';
import { formatRelativeActivity, getCommunityEngagementKit, getCommunityRoomModel } from './shared';

export default function CommunitySocialStarter({
  community,
  typeConfig,
  posts,
  activeNeeds,
  events,
  members,
  composeText,
  setComposeText,
  submitPost,
  posting,
  onTabChange,
  visibleTabs = [],
}) {
  const roomModel = getCommunityRoomModel(community, typeConfig);
  const engagementKit = getCommunityEngagementKit(community, typeConfig, roomModel);
  const prompts = roomModel.prompts.slice(0, 3);
  const [activePrompt, setActivePrompt] = useState(prompts[0] || 'Share something useful people can act on today...');
  const memberCount = members.length > 0 ? members.length : (community?.follower_count || 0);
  const latestPost = posts[0];
  const latestAge = formatRelativeActivity(latestPost?.created_at || latestPost?.created_date);
  const upcomingCount = events.filter((event) => {
    const value = event.start_date || event.event_date;
    return !value || new Date(value) >= new Date();
  }).length;
  const roomState = activeNeeds.length
    ? `${activeNeeds.length} open need${activeNeeds.length === 1 ? '' : 's'} need attention`
    : latestPost
      ? `Last update ${latestAge || 'recently'}`
      : roomModel.body;

  const actionColors = [
    'from-blue-50 to-cyan-50 text-blue-700 border-blue-100',
    'from-amber-50 to-orange-50 text-amber-800 border-amber-100',
    'from-emerald-50 to-teal-50 text-emerald-800 border-emerald-100',
  ];
  const promptStyles = [
    { label: 'Need now', className: 'border-red-100 bg-red-50 text-red-700' },
    { label: 'Ask fast', className: 'border-blue-100 bg-blue-50 text-blue-700' },
    { label: 'Make happen', className: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  ];
  const starterActions = roomModel.actions.map((action, index) => ({
    ...action,
    className: actionColors[index % actionColors.length],
    helper: action.label === 'Make a plan' && upcomingCount
      ? `${upcomingCount} event${upcomingCount === 1 ? '' : 's'} listed`
      : action.helper,
  }));
  const progressItems = [
    {
      label: 'Right now',
      value: activeNeeds.length ? `${activeNeeds.length} needs` : latestAge || 'Open',
    },
    {
      label: 'Next win',
      value: posts.length ? `${posts.length} posts` : roomModel.emptyWin,
    },
    {
      label: 'People',
      value: `${memberCount || 0} here`,
    },
  ];

  useEffect(() => {
    setActivePrompt(prompts[0] || 'Share something useful people can act on today...');
  }, [community?.id, prompts[0]]);

  const applyPrompt = (prompt) => {
    if (!prompt) return;
    setActivePrompt(prompt);
  };

  const openAction = (action) => {
    applyPrompt(action.prompt);
    const targetTab = visibleTabs.includes(action.tab) ? action.tab : 'posts';
    onTabChange(targetTab);
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-sm">
      <div className={`relative bg-gradient-to-br ${typeConfig.accent} px-5 py-5 text-white`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(255,255,255,0.18),transparent_26%)]" />
        <div className="relative flex items-start gap-4">
          <MemberAvatarStack members={members} typeConfig={typeConfig} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white/75">{roomModel.label}</p>
            <h2 className="mt-1 text-[23px] font-black leading-tight">{roomModel.headline}</h2>
            <p className="mt-2 text-[13px] font-semibold leading-5 text-white/82">{roomState}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          {progressItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-1 truncate text-[12px] font-black text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {prompts.map((prompt, index) => {
            const style = promptStyles[index % promptStyles.length];
            return (
            <button
              key={prompt}
              type="button"
              onClick={() => applyPrompt(prompt)}
              className={`flex-shrink-0 rounded-2xl border px-3 py-2 text-left active:scale-95 transition-all ${style.className}`}
            >
              <span className="block text-[9px] font-black uppercase tracking-wide opacity-70">{style.label}</span>
              <span className="block max-w-[210px] truncate text-[12px] font-black">{prompt}</span>
            </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
          <textarea
            value={composeText}
            onChange={(event) => setComposeText(event.target.value)}
            rows={2}
            placeholder={activePrompt}
            className="w-full resize-none bg-transparent px-1 text-[15px] font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-400"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onTabChange('posts')}
              className="text-[12px] font-black text-slate-500 active:text-slate-800"
            >
              View posts
            </button>
            <button
              type="button"
              onClick={submitPost}
              disabled={posting || !composeText.trim()}
              className={`motion-press inline-flex h-10 items-center gap-2 rounded-2xl bg-gradient-to-r ${typeConfig.accent} px-4 text-[13px] font-black text-white shadow-sm disabled:opacity-45`}
            >
              <Send className="h-3.5 w-3.5" />
              {posting ? 'Posting...' : roomModel.primaryCta}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {starterActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => openAction(action)}
              className={`rounded-2xl border bg-gradient-to-br p-3 text-left active:scale-[0.98] transition-all ${action.className}`}
            >
              <p className="text-[12px] font-black leading-tight">{action.label}</p>
              <p className="mt-1 text-[10px] font-bold leading-snug opacity-75">{action.helper}</p>
            </button>
          ))}
        </div>
      </div>
      </section>

      <CommunityPresenceStrip
        community={community}
        members={members}
        engagementKit={engagementKit}
        roomModel={roomModel}
        typeConfig={typeConfig}
        onPrompt={applyPrompt}
      />

      <CommunityMomentumPanel
        kit={engagementKit}
        posts={posts}
        activeNeeds={activeNeeds}
        events={events}
        memberCount={memberCount}
        onPrompt={applyPrompt}
        onTabChange={onTabChange}
        visibleTabs={visibleTabs}
      />

      <CommunityStarterFeed
        kit={engagementKit}
        posts={posts}
        typeConfig={typeConfig}
        onPrompt={applyPrompt}
        onTabChange={onTabChange}
      />

      <CommunityRhythmStrip kit={engagementKit} onPrompt={applyPrompt} />
    </div>
  );
}
