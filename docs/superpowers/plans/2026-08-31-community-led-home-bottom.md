# Community-Led Five Towns Home Bottom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repetitive lower half of the Five Towns Home dashboard with real joined-circle activity and real tonight/upcoming events that work on iPhone and open registered JUnited destinations.

**Architecture:** Add one pure Home activity model for deterministic selection and route building. Keep fetching in `Feed.jsx`, presentation in two focused Home components, and final composition in `FiveTownsHomeDashboard`. Reuse the existing feed, communities, event publisher, event detail sheet, and upcoming-events sheet rather than creating another data system.

**Tech Stack:** React 18, React Router 6, TanStack Query, Tailwind CSS, Lucide React, Vitest, Vite, Supabase repository services.

## Global Constraints

- Preserve the current Home exactly through **Useful nearby**.
- Use only real posts, joined communities, and event records.
- Never invent people, messages, events, counts, attendance, popularity, urgency, or live status.
- Open communities through `/Communities?community=<encoded-id>`.
- Open event publishing through `/Publish?type=event`.
- Keep `/Feed` as Home and preserve the existing bottom navigation.
- Primary viewport is 390 by 844 CSS pixels with no horizontal page overflow.
- Preserve the unrelated local Supabase files already present in the worktree.

---

### Task 1: Build the pure Home activity model

**Files:**
- Create: `src/lib/home/homeActivity.js`
- Create: `src/lib/home/homeActivity.test.js`

**Interfaces:**
- Consumes: `{ communities, posts, limit }` and `{ events, now, timeZone, limit }`.
- Produces: `buildCircleActivity(options)`, `communityRoute(id)`, and `buildHomeEventWindow(options)`.

- [ ] **Step 1: Write failing circle-selection and route tests**

```js
import { describe, expect, it } from 'vitest';
import { buildCircleActivity, communityRoute } from './homeActivity';

it('selects only posts from joined circles and uses the registered route', () => {
  const communities = [{ id: 'joined-1', name: 'Young adults' }, { id: 'joined-2', name: 'Local parents' }];
  const posts = [
    { id: 'old', community_id: 'joined-1', body: 'Earlier', created_date: '2026-08-30T12:00:00Z' },
    { id: 'new', community_id: 'joined-1', body: 'Newest', created_date: '2026-08-31T12:00:00Z' },
    { id: 'leak', community_id: 'not-joined', body: 'Do not show', created_date: '2026-08-31T13:00:00Z' },
  ];
  expect(buildCircleActivity({ communities, posts }).active.map((item) => item.post.id)).toEqual(['new']);
  expect(communityRoute('joined 1')).toBe('/Communities?community=joined%201');
});
```

- [ ] **Step 2: Write failing tonight, passed-event, and seven-day fallback tests**

```js
import { buildHomeEventWindow } from './homeActivity';

it('shows tonight first and falls back to the next seven local calendar days', () => {
  const now = new Date('2026-08-31T22:00:00Z'); // 6 PM Five Towns
  const tonight = buildHomeEventWindow({
    now,
    events: [{ id: 'tonight', type: 'event', event_date: '2026-08-31', event_time: '8:00 PM' }],
  });
  expect(tonight.mode).toBe('tonight');
  expect(tonight.items.map((event) => event.id)).toEqual(['tonight']);

  const upcoming = buildHomeEventWindow({
    now,
    events: [{ id: 'later', type: 'event', event_date: '2026-09-02', event_time: '7:30 PM' }],
  });
  expect(upcoming.mode).toBe('upcoming');
  expect(upcoming.items.map((event) => event.id)).toEqual(['later']);
});

it('excludes an event only when a known end time has passed', () => {
  const result = buildHomeEventWindow({
    now: new Date('2026-08-31T22:00:00Z'),
    events: [
      { id: 'ended', type: 'event', event_date: '2026-08-31', event_time: '4:00 PM', event_end_time: '5:00 PM' },
      { id: 'unknown-end', type: 'event', event_date: '2026-08-31', event_time: '4:00 PM' },
    ],
  });
  expect(result.items.map((event) => event.id)).toEqual(['unknown-end']);
});
```

- [ ] **Step 3: Run the model test and verify failure**

Run: `npx vitest run src/lib/home/homeActivity.test.js`

Expected: FAIL because `homeActivity.js` does not exist.

- [ ] **Step 4: Implement deterministic selection and date helpers**

```js
const HOME_TIME_ZONE = 'America/New_York';

export const communityRoute = (id) => `/Communities?community=${encodeURIComponent(String(id || ''))}`;

export function buildCircleActivity({ communities = [], posts = [], limit = 3 } = {}) {
  const joinedById = new Map(communities.filter((item) => item?.id).map((item) => [String(item.id), item]));
  const latestByCommunity = new Map();
  [...posts]
    .filter((post) => joinedById.has(String(post?.community_id || '')))
    .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0))
    .forEach((post) => {
      const communityId = String(post.community_id);
      if (!latestByCommunity.has(communityId)) latestByCommunity.set(communityId, post);
    });
  const active = [...latestByCommunity.entries()].slice(0, limit).map(([communityId, post]) => ({
    community: joinedById.get(communityId),
    post,
    href: communityRoute(communityId),
  }));
  return { active, quiet: active.length ? [] : communities.slice(0, limit).map((community) => ({ community, href: communityRoute(community.id) })) };
}
```

Implement the event window with these exact rules:

1. Build the Five Towns `YYYY-MM-DD` key for `now` with `Intl.DateTimeFormat('en-CA', { timeZone })`.
2. Treat an `event_date` beginning with `YYYY-MM-DD` as that literal calendar date; never pass a date-only value through UTC conversion.
3. Convert 12-hour `event_time` and `event_end_time` strings into minutes after midnight. An unparsable or missing end time is `null`.
4. Keep only `type === 'event'` records from today through the seventh local calendar day, inclusive.
5. Exclude a same-day event only when its parsed end minute is earlier than the current local clock minute. Missing end times stay visible for the whole event date.
6. Sort by calendar date, parsed start minute, then original array position so ties remain stable.
7. Return at most `limit` same-day records as `{ mode: 'tonight', items }`. If none remain, return the next seven-day records as `{ mode: 'upcoming', items }`. If neither exists, return `{ mode: 'empty', items: [] }`.

- [ ] **Step 5: Run the model tests and verify success**

Run: `npx vitest run src/lib/home/homeActivity.test.js`

Expected: PASS for joined-circle isolation, registered routes, tonight, passed known-end events, upcoming fallback, stable ordering, limits, and empty state.

- [ ] **Step 6: Commit the activity model**

```bash
git add src/lib/home/homeActivity.js src/lib/home/homeActivity.test.js
git commit -m "feat: model circle and tonight Home activity"
```

---

### Task 2: Build the real circle and tonight UI sections

**Files:**
- Create: `src/components/home/HomeCircleActivity.jsx`
- Create: `src/components/home/HomeCircleActivity.test.jsx`
- Create: `src/components/home/HomeTonight.jsx`
- Create: `src/components/home/HomeTonight.test.jsx`

**Interfaces:**
- `HomeCircleActivity({ activity, isLoading, onOpenCommunity, onBrowseCommunities })`
- `HomeTonight({ window, isLoading, isError, onRetry, onOpenEvent, onOpenAll, onAddEvent })`

- [ ] **Step 1: Write failing render and interaction tests**

```jsx
const circleHtml = renderToStaticMarkup(<HomeCircleActivity activity={{ active: [{
  community: { id: 'c1', name: 'Five Towns 20s' },
  post: { id: 'p1', author_name: 'Ari', body: 'Game tonight', created_date: '2026-08-31T20:00:00Z' },
  href: '/Communities?community=c1',
}], quiet: [] }} />);
expect(circleHtml).toContain('From your circles');
expect(circleHtml).toContain('Five Towns 20s');
expect(circleHtml).toContain('Game tonight');
expect(circleHtml).not.toContain('active now');

const tonightHtml = renderToStaticMarkup(<HomeTonight window={{ mode: 'tonight', items: [{
  id: 'e1', title: 'Shiur', event_date: '2026-08-31', event_time: '8:00 PM', location_text: 'Cedarhurst',
}] }} />);
expect(tonightHtml).toContain('Happening tonight');
expect(tonightHtml).toContain('8:00 PM');
expect(tonightHtml).toContain('Cedarhurst');
```

Because this repository intentionally has no DOM testing library, keep these component tests server-rendered. Verify every action renders as a semantic `button` with a stable accessible label (`Open <circle>`, `Browse all circles`, `Open <event>`, `See all events`, `Retry events`, and `Add an event`). Callback behavior is then covered by the real-browser pass in Task 4.

- [ ] **Step 2: Run the component tests and verify failure**

Run: `npx vitest run src/components/home/HomeCircleActivity.test.jsx src/components/home/HomeTonight.test.jsx`

Expected: FAIL because both components do not exist.

- [ ] **Step 3: Implement compact horizontal circle cards**

Use `feedText`, `formatPostAge`, and `postDate` for truthful post text and age. Render active cards when present, real quiet joined-circle cards when no recent post exists, and one compact Browse communities row when the member joined none. Cards use horizontal snap scrolling, 44-pixel minimum targets, and no invented counters.

- [ ] **Step 4: Implement tonight/upcoming/error/empty cards**

Render `Happening tonight` for `mode === 'tonight'`, `Coming up` for `mode === 'upcoming'`, and a compact `No events posted yet` row for `mode === 'empty'`. Keep Add event in the heading or empty row so events remain the final Home content. Use real event title/body, time, location, and community/source only when present.

- [ ] **Step 5: Run the component tests and verify success**

Run: `npx vitest run src/components/home/HomeCircleActivity.test.jsx src/components/home/HomeTonight.test.jsx`

Expected: PASS with real content, honest empty/loading/error states, and all callbacks covered.

- [ ] **Step 6: Commit the focused components**

```bash
git add src/components/home/HomeCircleActivity.jsx src/components/home/HomeCircleActivity.test.jsx src/components/home/HomeTonight.jsx src/components/home/HomeTonight.test.jsx
git commit -m "feat: add circle and tonight Home sections"
```

---

### Task 3: Replace the repetitive Home bottom and wire real event data

**Files:**
- Modify: `src/components/home/FiveTownsHomeDashboard.jsx`
- Modify: `src/components/home/FiveTownsHomeDashboard.test.jsx`
- Modify: `src/pages/Feed.jsx`
- Modify: `src/pages/Feed.contract.test.jsx`

**Interfaces:**
- `FiveTownsHomeDashboard` adds `events`, `eventsLoading`, `eventsError`, `onRetryEvents`, `onOpenEvent`, `onOpenEvents`, and `onAddEvent`.
- `Feed.jsx` owns the event query and existing sheets.

- [ ] **Step 1: Replace the Home hierarchy test with the approved lower order**

Assert that the rendered dashboard contains `Useful nearby`, `From your circles`, and `Happening tonight` in that order. Assert absence of `Your city today`, `People and groups`, `Jewish life`, `Opportunities`, `Help nearby`, `Complete Jewish directory`, and `Add something useful` below the dashboard.

- [ ] **Step 2: Add a failing Feed contract for real event wiring and registered routes**

```js
expect(source).toContain("filterUnifiedPost({ type: 'event' }, '-event_date', 60)");
expect(source).toContain('events={homeEvents}');
expect(source).toContain('onOpenEvents={() => setShowEventsSheet(true)}');
expect(source).toContain("onAddEvent={() => navigate('/Publish?type=event')}");
expect(source).not.toContain('`/communities/${group.id}`');
```

- [ ] **Step 3: Run focused tests and verify failure**

Run: `npx vitest run src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.contract.test.jsx`

Expected: FAIL because the old lower Home and no dedicated event query remain.

- [ ] **Step 4: Wire one focused real event query in Feed**

```jsx
const {
  data: homeEvents = [],
  isLoading: homeEventsLoading,
  isError: homeEventsError,
  refetch: refetchHomeEvents,
} = useQuery({
  queryKey: ['home-events', primaryNetwork.cityPreset || 'Five Towns'],
  queryFn: () => filterUnifiedPost({ type: 'event' }, '-event_date', 60),
  enabled: appParams.hasBackendConfig,
  staleTime: 60_000,
});
```

Pass the query results and exact callbacks into `FiveTownsHomeDashboard`. Keep `UpcomingEventsSheet` as the all-events destination and `setReplyPost(event)` as event detail.

- [ ] **Step 5: Replace everything after Useful nearby**

Remove the old city, people, Jewish life, opportunities, Help, complete-directory, and bottom publishing sections from `FiveTownsHomeDashboard`. Render `HomeCircleActivity` followed by `HomeTonight`. Use `buildCircleActivity` and `buildHomeEventWindow` inside memoized boundaries.

- [ ] **Step 6: Run the complete focused Home suite**

Run: `npx vitest run src/lib/home/homeActivity.test.js src/components/home/HomeCircleActivity.test.jsx src/components/home/HomeTonight.test.jsx src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.contract.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit the production Home integration**

```bash
git add src/components/home/FiveTownsHomeDashboard.jsx src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.jsx src/pages/Feed.contract.test.jsx
git commit -m "feat: make Home community and tonight focused"
```

---

### Task 4: Prove production and iPhone readiness

**Files:**
- Modify only if verification reveals a scoped defect in the changed Home flow.

**Interfaces:**
- Consumes: completed Home integration.
- Produces: test/build/browser evidence and a pushed PR #17 branch.

- [ ] **Step 1: Run the complete automated gates**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run check-style
```

Expected: every command exits zero.

- [ ] **Step 2: Run the JUnited self-check**

Follow the repository JUnited self-check workflow and record route, security, roadmap, responsive, and production-build evidence. Do not stage the unrelated local Supabase files.

- [ ] **Step 3: Verify the real app at 390 by 844**

Open `/Feed` in the branch preview or local Vite app and verify:

1. No horizontal overflow.
2. Everything through Useful nearby is unchanged.
3. From your circles uses only joined real communities/posts.
4. A circle opens `/Communities?community=<id>`.
5. Happening tonight or Coming up uses real event records.
6. An event opens detail/replies.
7. See all opens Upcoming Events.
8. Add event opens event publishing.
9. Final content remains above the bottom navigation.
10. Browser console has no new errors.

- [ ] **Step 4: Push and verify PR checks**

```bash
git push origin codex/smart-publishing-ai-admin
gh pr checks 17 --watch
```

Expected: the branch is pushed and Vercel reports success. Do not merge without a separate user request.
