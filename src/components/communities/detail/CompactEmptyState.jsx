export const TAB_EMPTY_COPY = {
  events: {
    neighborhood: { title: 'No local events yet', body: 'Add a neighborhood meetup, school event, or community gathering.' },
    shul: { title: 'No upcoming events', body: 'Add a Shabbos event, holiday program, or community gathering.' },
    chesed: { title: 'No volunteer events yet', body: 'Add a volunteer day, chesed gathering, or community help event.' },
    learning: { title: 'No learning events yet', body: 'Schedule a shiur, chavrusa session, or learning event.' },
    parents: { title: 'No family events yet', body: 'Share a school event, camp activity, or family gathering.' },
    events: { title: 'No events posted yet', body: 'Create the first event — gatherings, programs, and socials start here.' },
  },
  resources: {
    neighborhood: { title: 'No local resources yet', body: 'Share guides, community contacts, neighborhood alerts, or helpful local links.' },
    shul: { title: 'No resources shared yet', body: 'Share schedules, forms, weekly guides, or member resources here.' },
    learning: { title: 'No learning resources yet', body: 'Share shiur recordings, source sheets, or useful learning links.' },
    chesed: { title: 'No resources yet', body: 'Add contact lists, volunteer guides, or chesed organization links.' },
    parents: { title: 'No resources yet', body: 'Share school guides, camp info, local recommendations, or family forms.' },
  },
  openNeeds: {
    chesed: { title: 'No open needs right now', body: 'Post a request or invite someone to offer help. Needs coordinated here.' },
  },
  discussions: {
    learning: { title: 'No discussions yet', body: 'Start a Torah question, share a thought, or begin a chavrusa-style thread.' },
  },
  questions: {
    parents: { title: 'No questions yet', body: 'Ask for a school recommendation, babysitter tip, or local parenting help.' },
  },
};

function getTabEmptyState(typeKey, tabKey) {
  const tabMap = TAB_EMPTY_COPY[tabKey] || {};
  return tabMap[typeKey] || null;
}

export default function CompactEmptyState({ typeConfig, tabKey }) {
  const Icon = typeConfig?.icon;
  const custom = getTabEmptyState(typeConfig?.key, tabKey);
  const title = custom?.title || typeConfig?.emptyTitle || 'Nothing here yet';
  const body = custom?.body || typeConfig?.emptyBody || 'Be the first to post.';
  return (
    <div className="app-empty-state">
      {Icon && (
        <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="app-empty-state-title">{title}</p>
      <p className="app-empty-state-body mt-1">{body}</p>
    </div>
  );
}
