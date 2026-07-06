import React from 'react';
import CommunityPostLaunchPanel from '../CommunityPostLaunchPanel';
import VisitorLanding from './VisitorLanding';
import CommunityHomeLaunchpad from './CommunityHomeLaunchpad';

const POST_LAUNCH_DISMISS_KEY = (id) => `post_launch_dismissed_${id}`;

export default function RoutedCommunityHome({
  community,
  typeConfig,
  posts,
  activeNeeds,
  composeText,
  setComposeText,
  submitPost,
  posting,
  onTabChange,
  canPost,
  members,
  events,
  resources,
  isAdmin,
  isCreator,
  isFollowing,
  lastVisitedAt,
  currentUser,
  onFollow,
  onManage,
  openAdminCenter,
  onOpenEvent,
  visibleTabs,
}) {
  const [panelDismissed, setPanelDismissed] = React.useState(
    () => Boolean(localStorage.getItem(POST_LAUNCH_DISMISS_KEY(community?.id)))
  );

  const handleDismissPanel = () => {
    try { localStorage.setItem(POST_LAUNCH_DISMISS_KEY(community.id), '1'); } catch {}
    setPanelDismissed(true);
  };

  const communityCreatedAt = community?.created_at || community?.created_date;
  const ageMs = communityCreatedAt ? Date.now() - new Date(communityCreatedAt).getTime() : 0;
  const isRecent = !communityCreatedAt || ageMs < 14 * 24 * 60 * 60 * 1000;
  const showPanel = isFollowing && isCreator && !panelDismissed && isRecent;
  if (!isFollowing) {
    return (
      <VisitorLanding
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        events={events}
        resources={resources}
        members={members}
        onFollow={onFollow}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <div className="space-y-3 pt-3">
      {showPanel && (
        <CommunityPostLaunchPanel
          community={community}
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          activeNeeds={activeNeeds}
          members={members}
          currentUser={currentUser}
          onTabChange={onTabChange}
          onDismiss={handleDismissPanel}
        />
      )}
      <CommunityHomeLaunchpad
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        activeNeeds={activeNeeds}
        events={events}
        resources={resources}
        members={members}
        isAdmin={isAdmin}
        lastVisitedAt={lastVisitedAt}
        currentUser={currentUser}
        onTabChange={onTabChange}
        openAdminCenter={openAdminCenter}
        onManage={onManage}
        onOpenEvent={onOpenEvent}
        visibleTabs={visibleTabs}
        composeText={composeText}
        setComposeText={setComposeText}
        submitPost={submitPost}
        posting={posting}
      />
    </div>
  );
}
