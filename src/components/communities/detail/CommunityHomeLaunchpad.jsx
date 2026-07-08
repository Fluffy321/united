import { Hash } from 'lucide-react';
import { getCommunityTabLabel } from '@/lib/communityTypes';
import { CommunityAdminQuickActions } from '../CommunityOperatingSystem';
import CommunityPersonalizationHub from '../CommunityPersonalizationHub';
import CommunitySocialStarter from './CommunitySocialStarter';
import { TAB_ICON_MAP, getCardData, getCommunityActionCopy } from './shared';

export default function CommunityHomeLaunchpad({
  community, typeConfig, posts, activeNeeds, events, resources, members,
  isAdmin, lastVisitedAt, currentUser, onTabChange, openAdminCenter, onManage,
  onOpenEvent, visibleTabs, composeText, setComposeText, submitPost, posting,
}) {
  const layoutSettings = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.layout || {}) : {};
  const hiddenSections = new Set(layoutSettings.hiddenSections || []);

  const cardTabs = visibleTabs.filter((t) => t !== 'home');
  const memberCount = members.length > 0 ? members.length : (community?.follower_count || 0);
  const toolTabs = cardTabs.filter((tab) => !['posts'].includes(tab));

  return (
    <div className="space-y-4">
      <CommunitySocialStarter
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        activeNeeds={activeNeeds}
        events={events}
        members={members}
        composeText={composeText}
        setComposeText={setComposeText}
        submitPost={submitPost}
        posting={posting}
        onTabChange={onTabChange}
        visibleTabs={visibleTabs}
      />

      {toolTabs.length > 0 && (
        <section className="rounded-[26px] border border-slate-100 bg-white/80 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Community tools</p>
            <span className="text-[11px] font-black text-slate-400">Secondary</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {toolTabs.map((tab) => {
              const Icon = TAB_ICON_MAP[tab] || Hash;
              const data = getCardData(tab, { posts, events, activeNeeds, resources, memberCount });
              const hasData = data.stat || data.preview;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className="flex min-w-[150px] flex-shrink-0 items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left active:scale-[0.98] transition-all"
                >
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-black text-slate-900">{getCommunityTabLabel(tab)}</span>
                    <span className={`block truncate text-[10px] font-bold ${hasData ? 'text-blue-600' : 'text-slate-400'}`}>
                      {hasData ? (data.stat || data.preview) : getCommunityActionCopy(tab, typeConfig).action}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Admin tools */}
      {isAdmin && !hiddenSections.has('adminTools') && (
        <CommunityAdminQuickActions
          onAnnouncement={() => onTabChange('announcements')}
          onEvent={() => onTabChange('events')}
          onResource={() => onTabChange('resources')}
          onAdminCenter={() => openAdminCenter?.('overview') ?? onManage?.()}
        />
      )}

      {/* Personalization hub — user's RSVPs and chesed items */}
      {!hiddenSections.has('personalization') && (
        <CommunityPersonalizationHub
          communityId={community.id}
          currentUser={currentUser}
          events={events}
          typeConfig={typeConfig}
          onTabChange={onTabChange}
          onOpenEvent={onOpenEvent}
        />
      )}
    </div>
  );
}
