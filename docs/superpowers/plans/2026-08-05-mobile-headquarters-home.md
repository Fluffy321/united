# Mobile Headquarters Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn JUnited’s existing Feed into a mobile-first Jewish community headquarters with a three-item personalized Daily Brief, a complete twelve-category Brief launchpad, five fast posting intentions, a calmer community stream, and permanently adjustable engagement preferences.

**Architecture:** Keep `/Feed` as the home route and use its existing query-string state for the Brief and category views. Add pure category/ranking modules, compose small feed components around the existing `FeedComposer` and compact `UnifiedPostCard`, and persist explicit preferences through the existing Supabase `feed_user_preferences` row. Preserve the current post schema and routes; only add one constrained preference column and richer engagement-event reads.

**Tech Stack:** React 18, Vite 6, React Router 6, TanStack Query 5, Tailwind CSS 3, Lucide React, Supabase/Postgres, Vitest 4, server-rendered React component tests.

## Global Constraints

- Work only in `/Users/aryehkohn/Downloads/united-supabase/.worktrees/mobile-home-brief` on branch `codex/mobile-home-brief`.
- Follow the approved specification at `docs/superpowers/specs/2026-08-04-mobile-headquarters-home-design.md`.
- Keep `/Feed`, `/Feed?brief=1`, `/Feed?brief=1&category=<id>`, and `/Settings?section=notifications` as the route contract; do not add a new top-level page.
- The home order is fixed: three-item Brief preview, five posting intentions, then `From your community` posts.
- The Brief launchpad always exposes all twelve categories. It is a launchpad, not another vertically stacked feed.
- Emergency and safety items may override preference ranking. Privacy, membership, moderation, category access, and emergency alerts must never depend on engagement level.
- Do not inspect or derive personalization from DM contents, private help conversations, private helping history, or sensitive profile fields.
- Preserve the existing Supabase post schema and existing composer submission pipeline.
- Every interactive target added by this work must be at least 44px high or wide, keyboard reachable, and visibly focused.
- Build mobile-first at 320px, 375px, and 430px widths; desktop should constrain the feed rather than introduce a separate information architecture.
- Do not delete legacy components until repository search proves they have no remaining consumers. Removing imports and render sites from `Feed.jsx` is sufficient for this release.
- Use test-driven development: write a failing focused test, run it and observe the expected failure, add the minimum implementation, then rerun it.
- Commit after each task using the exact commit message specified below.

---

### Task 1: Establish the Brief category and ranking domain

**Files:**
- Create: `src/lib/feed/briefCategories.js`
- Create: `src/lib/feed/briefCategories.test.js`
- Create: `src/lib/feed/briefRanking.js`
- Create: `src/lib/feed/briefRanking.test.js`

- [ ] **Step 1: Write the failing category-contract tests**

Create `src/lib/feed/briefCategories.test.js` with assertions that the exported registry has these IDs in this order:

```js
[
  'local', 'helping', 'jewish_times', 'events', 'kosher_food', 'minyanim',
  'parents_schools', 'torah_learning', 'marketplace', 'jobs_business',
  'sports_social', 'shabbos_plans',
]
```

Assert that every entry has a non-empty `label`, `description`, `icon`, `accent`, `tabs`, and `actions`, and that every category uses exactly `['updates', 'discuss', 'directory']` as its tabs.

- [ ] **Step 2: Run the category test and observe the expected module failure**

Run:

```bash
npx vitest run src/lib/feed/briefCategories.test.js
```

Expected: FAIL because `briefCategories.js` does not exist.

- [ ] **Step 3: Implement the canonical twelve-category registry**

Export `BRIEF_CATEGORIES`, `BRIEF_CATEGORY_IDS`, `DEFAULT_BRIEF_CATEGORY_IDS`, and `getBriefCategory`. Use four defaults: `local`, `helping`, `events`, and `jewish_times`. Store Lucide icon names as strings so this pure module remains render-independent.

```js
export const DEFAULT_BRIEF_CATEGORY_IDS = ['local', 'helping', 'events', 'jewish_times'];

export function getBriefCategory(categoryId) {
  return BRIEF_CATEGORIES.find(({ id }) => id === categoryId) || null;
}
```

Give each category two concrete actions. Examples: Local Updates → `Share update`, `Report an issue`; Helping → `Ask for help`, `Offer help`; Minyanim → `Find a minyan`, `Share a minyan`; Shabbos Plans → `Find a host`, `Offer a seat`.

- [ ] **Step 4: Write failing ranking tests for the locked personalization rules**

Test these exact behaviors in `briefRanking.test.js`:

- a selected interest contributes 60 points;
- five matching allowed behavior events contribute 25 points;
- verified/curated, urgent, fresh, and local context contribute 5, 5, 3, and 2 points;
- a safety or emergency item receives an override score above every normal item;
- the output contains at most three items with distinct IDs;
- `show_less` is the only negative event and reduces that category signal;
- unknown category IDs are ignored;
- message bodies and private-help metadata are not read.

Use a fixed `now = new Date('2026-08-05T16:00:00.000Z')` so freshness is deterministic.

- [ ] **Step 5: Run the ranking test and observe the expected module failure**

Run:

```bash
npx vitest run src/lib/feed/briefRanking.test.js
```

Expected: FAIL because `briefRanking.js` does not exist.

- [ ] **Step 6: Implement deterministic category classification and ranking**

Export `classifyBriefCategory`, `aggregateCategorySignals`, `scoreBriefItem`, and `rankBriefItems`. Use this normal-score formula:

```js
const score =
  (selectedCategoryIds.includes(categoryId) ? 60 : 0) +
  Math.min(25, Math.max(-25, categorySignal * 5)) +
  (item.verified || item.provenance === 'editor' ? 5 : 0) +
  (item.urgency === 'urgent' ? 5 : 0) +
  (ageHours <= 24 ? 3 : 0) +
  (matchesNetwork(item, primaryNetwork) ? 2 : 0);
```

Return `10_000 + score` for `post_subtype === 'alert'`, `category === 'safety'`, or `urgency === 'emergency'`. Allowed positive event types are `save`, `reply`, `join`, and `category_open`; `show_less` subtracts one. Use only `event.metadata.category_id`, post type/subtype, public title/body text, timestamps, verification, urgency, and public locality.

- [ ] **Step 7: Run both domain tests**

Run:

```bash
npx vitest run src/lib/feed/briefCategories.test.js src/lib/feed/briefRanking.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit the domain layer**

```bash
git add src/lib/feed/briefCategories.js src/lib/feed/briefCategories.test.js src/lib/feed/briefRanking.js src/lib/feed/briefRanking.test.js
git commit -m "feat: add daily brief ranking domain"
```

### Task 2: Persist engagement level and safe category signals

**Files:**
- Create: `supabase/migrations/20260805090000_add_feed_engagement_level.sql`
- Modify: `src/services/entityServices.js`
- Modify: `src/services/feedRetentionService.js`
- Modify: `src/services/feedRetentionService.test.js`
- Modify: `src/lib/queryKeys.js`

- [ ] **Step 1: Extend the service mocks and write failing preference/signal tests**

Add `filterFeedEngagementEvent` to the mocked entity operations. Test that:

- missing preferences normalize to `engagement_level: 'balanced'` and the four default category IDs;
- `savePreferences` filters interests to canonical category IDs and rejects an invalid engagement level by replacing it with `balanced`;
- `getCategorySignals` requests only the signed-in user’s recent rows and returns only the five allowed event types;
- `recordEvent` stores `metadata.category_id` only when it is canonical.

- [ ] **Step 2: Run the focused service test and observe the failures**

```bash
npx vitest run src/services/feedRetentionService.test.js
```

Expected: FAIL because preference normalization and engagement-event reads are not implemented.

- [ ] **Step 3: Add the non-destructive Supabase migration**

Create a migration containing:

```sql
alter table public.feed_user_preferences
  add column if not exists engagement_level text not null default 'balanced';

alter table public.feed_user_preferences
  drop constraint if exists feed_user_preferences_engagement_level_check;

alter table public.feed_user_preferences
  add constraint feed_user_preferences_engagement_level_check
  check (engagement_level in ('quiet', 'balanced', 'active', 'all_in'));
```

Do not change existing RLS policies; the column remains protected by the existing own-row policies.

- [ ] **Step 4: Add the missing read operation and stable query keys**

Add this named operation beside the existing create operation:

```js
export const filterFeedEngagementEvent = (...args) =>
  supabaseBackend.entities.FeedEngagementEvent.filter(...args);
```

Add query keys:

```js
export const feedPreferenceKeys = {
  all: ['feed-preferences'],
  user: (userId) => ['feed-preferences', userId],
  signals: (userId) => ['feed-preferences', userId, 'signals'],
};
```

- [ ] **Step 5: Implement normalized preference and signal service methods**

Add `normalizePreferences`, have `getPreferences` always return normalized data, sanitize patches in `savePreferences`, and add:

```js
async getCategorySignals(userId) {
  if (!userId) return [];
  const events = await filterFeedEngagementEvent({ user_id: userId }, '-created_at', 100);
  return (events || []).filter(({ event_type }) =>
    ['save', 'reply', 'join', 'category_open', 'show_less'].includes(event_type)
  );
}
```

Keep persistence failures visible to callers; components may show retry UI rather than silently pretending the save worked.

- [ ] **Step 6: Run service and domain tests**

```bash
npx vitest run src/services/feedRetentionService.test.js src/lib/feed/briefRanking.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit the persistence layer**

```bash
git add supabase/migrations/20260805090000_add_feed_engagement_level.sql src/services/entityServices.js src/services/feedRetentionService.js src/services/feedRetentionService.test.js src/lib/queryKeys.js
git commit -m "feat: persist brief engagement preferences"
```

### Task 3: Replace the old Brief card with the three-item mobile preview

**Files:**
- Modify: `src/components/feed/FiveTownsBrief.jsx`
- Modify: `src/components/feed/FiveTownsBrief.test.jsx`

- [ ] **Step 1: Replace legacy markup expectations with the approved contract**

Write server-rendered tests asserting that the component:

- renders `Your Daily Brief`, the network label, exactly three ranked item rows, and `Open Brief`;
- renders the category label and one-line context for each row;
- renders a truthful empty state when fewer than three real items exist;
- never renders `Why these three?`, `Today’s mitzvah`, `Explore today`, a carousel, fabricated counts, or an engagement slider;
- gives the open button and each item an accessible label.

Change the import to `FiveTownsBrief, { buildBriefingItems }`; remove tests for `findUrgentNeed` because urgent ordering now belongs to `briefRanking.js`.

- [ ] **Step 2: Run the component test and observe the expected failures**

```bash
npx vitest run src/components/feed/FiveTownsBrief.test.jsx
```

Expected: FAIL on the new title, exact item limit, and removed disclosure modules.

- [ ] **Step 3: Implement the compact preview**

Keep the existing filename to minimize integration churn, but reduce its public props to:

```jsx
<FiveTownsBrief
  items={rankedBriefItems}
  networkLabel={networkLabel}
  onOpenBrief={openBrief}
  onOpenItem={openPost}
/>
```

Use one calm white card, a compact header, three 44px minimum rows, and one full-width `Open Brief` button. For zero items, show `No trusted updates are ready yet` and `Check back soon or share what your community should know.` Do not render invented fallback activity.

- [ ] **Step 4: Run the component test**

```bash
npx vitest run src/components/feed/FiveTownsBrief.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit the preview**

```bash
git add src/components/feed/FiveTownsBrief.jsx src/components/feed/FiveTownsBrief.test.jsx
git commit -m "feat: simplify the mobile daily brief"
```

### Task 4: Build the complete Brief launchpad and focused category section

**Files:**
- Create: `src/components/feed/BriefCategoryLaunchpad.jsx`
- Create: `src/components/feed/BriefCategoryLaunchpad.test.jsx`
- Create: `src/components/feed/BriefCategorySection.jsx`
- Create: `src/components/feed/BriefCategorySection.test.jsx`
- Create: `src/lib/feed/briefRouteState.js`
- Create: `src/lib/feed/briefRouteState.test.js`

- [ ] **Step 1: Write failing route-state tests**

Test that `readBriefRouteState` and `writeBriefRouteState` implement:

```js
new URLSearchParams('')                           // { isBriefOpen: false, categoryId: null }
new URLSearchParams('brief=1')                    // { isBriefOpen: true, categoryId: null }
new URLSearchParams('brief=1&category=minyanim')  // { isBriefOpen: true, categoryId: 'minyanim' }
new URLSearchParams('brief=1&category=unknown')   // { isBriefOpen: true, categoryId: null }
```

Closing a category must retain `brief=1`; closing the Brief must remove both parameters while preserving unrelated query parameters.

- [ ] **Step 2: Write failing launchpad and section markup tests**

The launchpad test must find all twelve category labels once, `Choose what you need`, and a link to `/Settings?section=notifications`. The focused-section test must find one selected category title, all three tabs, only the selected tab panel, and the selected category’s two actions. It must not render all categories’ update streams.

- [ ] **Step 3: Run the new tests and observe the expected module failures**

```bash
npx vitest run src/lib/feed/briefRouteState.test.js src/components/feed/BriefCategoryLaunchpad.test.jsx src/components/feed/BriefCategorySection.test.jsx
```

Expected: FAIL because the three implementation modules do not exist.

- [ ] **Step 4: Implement query-string helpers**

Use pure functions that clone `URLSearchParams`; never mutate the caller’s object. Export `readBriefRouteState`, `openBriefParams`, `openBriefCategoryParams`, `closeBriefCategoryParams`, and `closeBriefParams`.

- [ ] **Step 5: Implement the launchpad**

Render a 2-column grid at mobile widths. Each tile displays icon, label, one-line description, and a 44px minimum clickable surface. Put a compact `Tune your Brief` link below the grid. Do not show previews beneath category tiles.

- [ ] **Step 6: Implement the focused category shell**

Accept `category`, `posts`, `activeTab`, `onTabChange`, `onBack`, `onOpenPost`, and `onAction`. Filter with `classifyBriefCategory(post)`. Render:

- a back control to all categories;
- the category title and description;
- `Updates`, `Discuss`, and `Directory` tabs;
- compact `UnifiedPostCard` rows for Updates;
- discussion-oriented rows for posts with comments or question subtype;
- a Directory panel with a button to `/Map` and truthful copy when structured directory data is unavailable;
- the category’s two action buttons wired through `onAction`.

- [ ] **Step 7: Run launchpad, section, and route tests**

```bash
npx vitest run src/lib/feed/briefRouteState.test.js src/components/feed/BriefCategoryLaunchpad.test.jsx src/components/feed/BriefCategorySection.test.jsx
```

Expected: PASS.

- [ ] **Step 8: Commit the Brief explorer**

```bash
git add src/components/feed/BriefCategoryLaunchpad.jsx src/components/feed/BriefCategoryLaunchpad.test.jsx src/components/feed/BriefCategorySection.jsx src/components/feed/BriefCategorySection.test.jsx src/lib/feed/briefRouteState.js src/lib/feed/briefRouteState.test.js
git commit -m "feat: add the daily brief category explorer"
```

### Task 5: Add the five-intention posting rail and composer support

**Files:**
- Create: `src/components/feed/FeedIntentionRail.jsx`
- Create: `src/components/feed/FeedIntentionRail.test.jsx`
- Create: `src/lib/feed/feedIntentions.js`
- Create: `src/lib/feed/feedIntentions.test.js`
- Modify: `src/components/feed/UnifiedPostModal.jsx`

- [ ] **Step 1: Write failing intention-map and rail tests**

Lock these mappings:

```js
{
  ask:   { type: 'feed', subtype: 'question', initialBody: '' },
  share: { type: 'feed', subtype: 'local_update', initialBody: '' },
  need:  { type: 'help', subtype: 'need_help', initialBody: '' },
  offer: { type: 'feed', subtype: 'offer_help', initialBody: 'I can help with…' },
  plan:  { type: 'event', subtype: 'plan', initialBody: '' },
}
```

Assert that the rail renders exactly `Ask`, `Share`, `Need`, `Offer`, and `Plan`, in that order, as 44px minimum buttons with accessible labels.

- [ ] **Step 2: Run the tests and observe the expected module failures**

```bash
npx vitest run src/lib/feed/feedIntentions.test.js src/components/feed/FeedIntentionRail.test.jsx
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the pure intention registry and mobile rail**

Export `FEED_INTENTIONS` and `getFeedIntention`. Render a five-column compact rail at 375px and a horizontally scrollable row at 320px without clipping the last action. Use text plus distinct icons; do not use five unrelated gradients.

- [ ] **Step 4: Teach the existing composer to present Offer correctly**

Add an `offer` entry to `POST_TYPES`, make `typeFromLegacyProps` return `offer` for `initialSubtype === 'offer_help'`, use `Share Offer` as its submit label, and persist it as a normal feed post with `post_subtype: 'offer_help'`. Keep Plan mapped to the existing Event form so date, time, and location remain available.

- [ ] **Step 5: Run the focused tests and existing post-modal tests if present**

```bash
npx vitest run src/lib/feed/feedIntentions.test.js src/components/feed/FeedIntentionRail.test.jsx
```

Expected: PASS.

- [ ] **Step 6: Commit posting intentions**

```bash
git add src/components/feed/FeedIntentionRail.jsx src/components/feed/FeedIntentionRail.test.jsx src/lib/feed/feedIntentions.js src/lib/feed/feedIntentions.test.js src/components/feed/UnifiedPostModal.jsx
git commit -m "feat: add five fast community posting actions"
```

### Task 6: Add permanently adjustable Brief preferences in Settings

**Files:**
- Create: `src/components/settings/BriefPreferencesSettings.jsx`
- Create: `src/components/settings/BriefPreferencesSettings.test.jsx`
- Modify: `src/pages/Settings.jsx`

- [ ] **Step 1: Write failing preference-control markup tests**

Export a stateless `BriefPreferencesForm` from the same module so it can be server-rendered without a Query Client. Assert that the form renders all twelve category toggles and four engagement choices with these descriptions:

- Quiet: essential updates and emergency alerts;
- Balanced: the default daily rhythm;
- Active: more prompts and community activity;
- All-in: the fullest non-emergency update volume.

Assert that the copy explicitly says the setting can be changed anytime and that emergency alerts are unaffected.

- [ ] **Step 2: Run the test and observe the expected module failure**

```bash
npx vitest run src/components/settings/BriefPreferencesSettings.test.jsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the focused settings component**

Use `useQuery` with `feedPreferenceKeys.user(currentUser.id)` and `feedRetentionService.getPreferences`. Use a mutation that saves both `interests` and `engagement_level`, invalidates `feedPreferenceKeys.all`, and shows success/error toasts. Keep emergency-alert copy outside the selectable controls.

Disable save while the mutation runs. On error, retain the unsaved local selection so the user can retry.

- [ ] **Step 4: Make Settings query-string addressable**

Import `useSearchParams`, validate `section` against the six section IDs, and initialize/synchronize `activeSection`. When a section chip is tapped, set both React state and `section=<id>` while preserving unrelated parameters.

- [ ] **Step 5: Insert Brief preferences at the top of Notifications**

Render:

```jsx
<BriefPreferencesSettings currentUser={currentUser} />
```

before the existing `Notification Settings` card so `/Settings?section=notifications` lands on the relevant controls without hiding current notification settings.

- [ ] **Step 6: Run the settings test and typecheck**

```bash
npx vitest run src/components/settings/BriefPreferencesSettings.test.jsx
npm run typecheck
```

Expected: both commands PASS.

- [ ] **Step 7: Commit settings**

```bash
git add src/components/settings/BriefPreferencesSettings.jsx src/components/settings/BriefPreferencesSettings.test.jsx src/pages/Settings.jsx
git commit -m "feat: add adjustable brief preferences"
```

### Task 7: Integrate the headquarters flow into `/Feed`

**Files:**
- Modify: `src/pages/Feed.jsx`
- Create: `src/pages/Feed.contract.test.jsx`

- [ ] **Step 1: Write a failing structural contract test**

Read `Feed.jsx` as source text and assert that it imports and renders `FeedIntentionRail`, `BriefCategoryLaunchpad`, and `BriefCategorySection`; uses `readBriefRouteState`; renders `From your community`; and no longer imports or renders `PostingPrompts`, `FiveTownsConversationHub`, or `useFloatingActions`.

This source-level test protects the page composition without requiring a full authenticated router/backend harness.

- [ ] **Step 2: Run the contract test and observe the expected failures**

```bash
npx vitest run src/pages/Feed.contract.test.jsx
```

Expected: FAIL because the new home composition is not integrated.

- [ ] **Step 3: Query preferences and safe engagement signals**

Add TanStack queries keyed by `feedPreferenceKeys.user(currentUser?.id)` and `feedPreferenceKeys.signals(currentUser?.id)`. Disable them for guests. Rank `dailyBrief.topLocalUpdates` and `feedPosts` together with `rankBriefItems`, passing normalized preferences, safe events, network, and a memoized current time bucket.

Do not use private messages, private help records, profile sensitivity fields, or public mitzvah points.

- [ ] **Step 4: Wire URL state without creating a second route**

Use `readBriefRouteState(searchParams)` to choose among:

- normal Home when `brief` is absent;
- all-category launchpad when `brief=1` and category is absent;
- focused category section when both values are valid.

Use the pure route writers with `setSearchParams`. On category open, call `recordEvent` with `eventType: 'category_open'` and canonical `metadata.category_id`.

- [ ] **Step 5: Replace the home module stack**

On normal Home, render this exact order:

```jsx
<FiveTownsBrief
  items={rankedBriefItems}
  networkLabel={primaryNetwork.shortLabel || primaryNetwork.cityPreset || 'Your community'}
  onOpenBrief={handleOpenBrief}
  onOpenItem={handleCardOpen}
/>
<FeedIntentionRail onSelect={(intent) => openComposer(intent.composer)} />
<section aria-labelledby="from-your-community-heading">
  <h2 id="from-your-community-heading">From your community</h2>
  {feedPosts.map((post) => (
    <UnifiedPostCard
      key={post.id}
      variant="compact"
      post={post}
      liked={userLikes.includes(post.id)}
      onLike={handleLike}
      onReply={handleCardReply}
      onOpen={handleCardOpen}
      onShowLess={handleShowLess}
      onMap={() => navigate('/Map')}
    />
  ))}
</section>
```

Put all existing compact `UnifiedPostCard` rows inside that section. Remove `FiveTownsConversationHub` and `PostingPrompts` from the page. Remove the Feed floating composer action registration because the five intentions are always visible. Keep the composer component itself, comments, report, minyan, event, and calendar sheets that still have active call sites.

- [ ] **Step 6: Wire category and intention actions to existing destinations**

Use the existing composer for posting actions. Use `/Map` for directory discovery, `/Marketplace` for marketplace browsing, and existing sheets for events/minyanim when the category action requests them. Do not create dead buttons.

- [ ] **Step 7: Record only allowed personalization actions**

Change the current generic `engaged` write to `reply` inside the existing reply handler and attach the canonical `metadata.category_id`. Record `category_open` on category selection; Task 8 adds `show_less`. The aggregator may consume existing `save` and `join` events written by other public product surfaces, but this task must not invent new save/join callbacks. Likes may continue to affect public post engagement but must not become a category-learning signal.

- [ ] **Step 8: Run the contract and all focused feature tests**

```bash
npx vitest run src/pages/Feed.contract.test.jsx src/components/feed/FiveTownsBrief.test.jsx src/components/feed/BriefCategoryLaunchpad.test.jsx src/components/feed/BriefCategorySection.test.jsx src/components/feed/FeedIntentionRail.test.jsx src/lib/feed/briefRanking.test.js
```

Expected: PASS.

- [ ] **Step 9: Commit Feed integration**

```bash
git add src/pages/Feed.jsx src/pages/Feed.contract.test.jsx
git commit -m "feat: make feed the mobile community headquarters"
```

### Task 8: Refine compact posts and add `Show less` without public gamification

**Files:**
- Modify: `src/components/feed/UnifiedPostCard.jsx`
- Create: `src/components/feed/UnifiedPostCard.contract.test.jsx`
- Modify: `src/pages/Feed.jsx`

- [ ] **Step 1: Write failing compact-card contract tests**

Assert from rendered compact markup and source that:

- context is constrained to one line;
- body is capped at three lines before expansion;
- action buttons have accessible labels and 44px touch dimensions;
- the overflow menu contains `Show less like this` for non-owners when `onShowLess` exists;
- no public `mitzvah points`, score, leaderboard, or rank appears.

- [ ] **Step 2: Run the test and observe the expected failures**

```bash
npx vitest run src/components/feed/UnifiedPostCard.contract.test.jsx
```

Expected: FAIL on the new `Show less like this` contract and any undersized controls.

- [ ] **Step 3: Make the minimum compact-card changes**

Add optional `onShowLess(post)` to `CompactPostCard` and the dispatcher. Put `Show less like this` beside Report/Block in the existing overflow menu. Preserve author, timestamp, one context line, body, and Helpful/Reply/Open actions. Do not lead with rich media; images remain after text.

- [ ] **Step 4: Wire `Show less` to safe learning**

From `Feed.jsx`, record:

```js
feedRetentionService.recordEvent({
  userId: currentUser.id,
  post,
  eventType: 'show_less',
  metadata: { category_id: classifyBriefCategory(post), source: 'feed' },
});
```

Optimistically remove the post from the visible session and invalidate `feedPreferenceKeys.signals(currentUser.id)` after the write settles.

- [ ] **Step 5: Run card and Feed tests**

```bash
npx vitest run src/components/feed/UnifiedPostCard.contract.test.jsx src/pages/Feed.contract.test.jsx
```

Expected: PASS.

- [ ] **Step 6: Commit post refinements**

```bash
git add src/components/feed/UnifiedPostCard.jsx src/components/feed/UnifiedPostCard.contract.test.jsx src/pages/Feed.jsx
git commit -m "feat: refine community posts for mobile"
```

### Task 9: Verify mobile behavior in the real app

**Files:**
- Modify only files implicated by a reproducible defect found during this task.

- [ ] **Step 1: Run the complete automated suite**

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: all four commands exit 0. The known npm audit vulnerability count is baseline package metadata, not a reason to change dependencies in this feature.

- [ ] **Step 2: Start the development server**

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL and remains running.

- [ ] **Step 3: Verify the unauthenticated boundary**

At 375px width, open `/Feed` signed out. Confirm the app either shows its existing sign-in boundary or public preview without console errors. Do not bypass auth or fabricate a session.

- [ ] **Step 4: Verify the signed-in home at three mobile widths**

Using the existing signed-in browser session, inspect 320×700, 375×812, and 430×932. Confirm:

- no horizontal page scroll;
- three Brief rows fit and remain readable;
- the five intentions remain reachable;
- `From your community` begins immediately after the rail;
- all added touch targets are at least 44px;
- focus states are visible with keyboard navigation.

- [ ] **Step 5: Verify the complete click path**

Click `Open Brief`, each of the twelve category tiles, each category tab, category back, Brief close, each posting intention, and `Tune your Brief`. Confirm URLs update correctly, browser Back restores prior state, each composer opens with the right intention, Plan shows event fields, Offer says `Share Offer`, and settings persist after refresh.

- [ ] **Step 6: Verify truthfulness and privacy boundaries**

Confirm an empty category says that no trusted updates are available, no invented people/counts appear, no public mitzvah score appears, and emergency content remains present at every engagement level.

- [ ] **Step 7: Fix only reproduced defects test-first**

For each defect, add or extend the smallest failing test, run it to observe failure, patch the implicated file, and rerun the focused test before continuing.

- [ ] **Step 8: Stop the development server and commit verified fixes if any**

```bash
git status --short
```

If files changed, stage the explicit paths and commit:

```bash
git commit -m "fix: polish mobile headquarters interactions"
```

If no files changed, do not create an empty commit.

### Task 10: Run JUnited’s repository-wide audit and finalize documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-08-04-mobile-headquarters-home-design.md`
- Modify: `docs/superpowers/plans/2026-08-05-mobile-headquarters-home.md`

- [ ] **Step 1: Run the JUnited self-check skill read-only**

Invoke the repository’s `junited-self-check` skill and complete every required check against this worktree. Record concrete failures rather than general impressions.

- [ ] **Step 2: Run targeted searches for forbidden or incomplete remnants**

```bash
rg -n "TODO|TBD|FIXME|placeholder|Why these three|Today’s mitzvah|Explore today|mitzvah points|Community progress" src docs/superpowers/specs/2026-08-04-mobile-headquarters-home-design.md
rg -n "PostingPrompts|FiveTownsConversationHub|useFloatingActions" src/pages/Feed.jsx
rg -n "DM|direct message|private help|private helping|message body" src/lib/feed/briefRanking.js src/services/feedRetentionService.js
```

Expected: no incomplete markers in new implementation; no removed home modules in `Feed.jsx`; no prohibited private signal access. Existing unrelated copy may remain only if the self-check confirms it is outside this feature’s surface.

- [ ] **Step 3: Verify interface consistency**

Check that every new export has a real consumer, every modified callback is passed at all required render sites, all category IDs match across registry/ranking/routes/settings/events, and the migration value `all_in` maps to the user-facing label `All-in` without leaking a second spelling into storage.

- [ ] **Step 4: Mark implementation status in the spec and this plan**

Add a dated implementation note to the spec listing the final commit range and verified commands. Check every completed `- [ ]` item in this plan to `- [x]`; leave no completed action unchecked.

- [ ] **Step 5: Run final verification before claiming completion**

```bash
npm test && npm run lint && npm run typecheck && npm run build
git status --short
git log --oneline --decorate -12
```

Expected: all checks exit 0; status contains only the intended documentation update before the final commit; log shows the task commits in order.

- [ ] **Step 6: Commit the audit record**

```bash
git add docs/superpowers/specs/2026-08-04-mobile-headquarters-home-design.md docs/superpowers/plans/2026-08-05-mobile-headquarters-home.md
git commit -m "docs: record mobile headquarters verification"
```

- [ ] **Step 7: Present the branch for user review**

Report the worktree path, branch, exact verification results, migration name, and the local URL used for visual review. Do not merge, push, deploy, or apply the migration without a separate user request.
