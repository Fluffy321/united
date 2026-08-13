# Priority Stack Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace JUnited's current mobile Home presentation with the approved Priority Stack: one honestly dominant item when warranted, two compact personal priorities, one contribution entry, a rich two-row category deck, and focused category openings backed by existing JUnited data and actions.

**Architecture:** Add a pure priority-domain module that filters and ranks existing feed candidates and produces human-readable reasons. Render that model through focused React components, then integrate them into `Feed.jsx` without moving persistence, moderation, or navigation logic into presentation components. Reuse the existing Brief category configuration and URL state for focused category destinations.

**Tech Stack:** React 18, Vite 6, Tailwind CSS 3, React Router 6, TanStack React Query 5, Supabase, Lucide React, Vitest 4, Testing Library static rendering patterns already used in the repository.

## Global Constraints

- The authoritative edit root is `/Users/aryehkohn/Downloads/united-supabase/.worktrees/mobile-home-brief` on branch `codex/mobile-home-brief`.
- Preserve the existing uncommitted changes in `src/components/feed/UnifiedPostModal.jsx` and `src/components/feed/UnifiedPostModal.contract.test.jsx`; do not include them in Priority Stack commits.
- Mobile is primary and must render correctly at exactly 390 by 844 CSS pixels.
- Do not invent counts, replies, urgency, distances, attendance, trust, or activity.
- Do not add a machine-learning service or new dependency.
- Do not inspect direct-message text, private help coordination, precise private addresses, or unrelated sensitive profile data.
- Reuse existing composer, post detail, moderation, blocking, report, Help, Communities, map, events, marketplace, minyan, search, messages, notifications, and profile contracts.
- Every interactive target must be at least 44 by 44 CSS pixels or provide an equivalent accessible hit area.
- Priority explanation must be readable without color and must render only true reasons.
- Category navigation must survive refresh and browser back through existing URL state.
- Use test-driven development and commit only the files belonging to each task.

---

## Planned file structure

- `src/lib/feed/homePriority.js` — pure eligibility, scoring, explanation, dominant-threshold, and category-lead functions.
- `src/lib/feed/homePriority.test.js` — deterministic domain tests including empty, privacy, expiry, deduplication, and engagement cases.
- `src/components/feed/HomePriorityStack.jsx` — Community Pulse and priority cards.
- `src/components/feed/HomePriorityStack.test.jsx` — visible copy, accessible names, reasons, calm states, and dominant treatment.
- `src/components/feed/HomeContributionEntry.jsx` — one Home entry that reveals existing posting intentions.
- `src/components/feed/HomeContributionEntry.test.jsx` — one-entry and intention-selection contract.
- `src/components/feed/LiveCategoryDeck.jsx` — two-row horizontal category cards using real lead items or honest actions.
- `src/components/feed/LiveCategoryDeck.test.jsx` — ordering, non-duplication, empty action, and accessibility contract.
- `src/components/feed/BriefCategorySection.jsx` — improve the existing recoverable full-category shell rather than create twelve pages.
- `src/components/feed/BriefCategorySection.test.jsx` — focused category header, Helping privacy, honest counts, tabs, actions, and empty states.
- `src/pages/Feed.jsx` — assemble the domain and new Home components while preserving existing queries and handlers.
- `src/pages/Feed.contract.test.jsx` — enforce the new composition and removal of repeated Home prompt surfaces.
- `src/pages/Communities.jsx` — remove the member-visible reseed control and eliminate duplicate join actions in the owning surface.
- `src/pages/Communities.contract.test.jsx` — production-control and duplicate-action regression checks.

---

### Task 1: Build the explainable priority domain

**Files:**
- Create: `src/lib/feed/homePriority.js`
- Create: `src/lib/feed/homePriority.test.js`
- Reuse: `src/lib/feed/briefRanking.js`
- Reuse: `src/lib/feed/briefCategories.js`

**Interfaces:**
- Consumes: existing post-like records, `classifyBriefCategory(item)`, selected category IDs, category signals, current user ID, primary network, engagement level, and a deterministic `now`.
- Produces: `buildHomePriorityModel(options) -> { priorities, categoryLeads, priorityIds }`.
- Produces: each priority as the original item plus `category_id`, `priority_score`, `priority_reasons: Array<{ id, label }>`, and `is_dominant`.
- Produces: each category lead as `{ category, item, count, stateLabel, action }`.

- [ ] **Step 1: Write failing eligibility and explanation tests**

```js
import { describe, expect, it } from 'vitest';
import { buildHomePriorityModel } from './homePriority';

const post = (overrides = {}) => ({
  id: 'post-1',
  type: 'help',
  title: 'One driver needed before 4 PM',
  city: 'Cedarhurst',
  created_at: '2026-08-10T16:00:00.000Z',
  deadline_at: '2026-08-10T20:00:00.000Z',
  status: 'open',
  ...overrides,
});

describe('buildHomePriorityModel', () => {
  it('makes a nearby unfilled deadline need dominant and explains why', () => {
    const model = buildHomePriorityModel({
      items: [post()],
      primaryNetwork: { cityPreset: 'Cedarhurst', shortLabel: 'Five Towns' },
      engagementLevel: 'active',
      now: new Date('2026-08-10T18:00:00.000Z'),
    });

    expect(model.priorities[0]).toMatchObject({
      id: 'post-1',
      category_id: 'helping',
      is_dominant: true,
    });
    expect(model.priorities[0].priority_reasons.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['ends_soon', 'nearby'])
    );
  });

  it('suppresses expired, filled, unavailable, blocked, reported, and duplicate items', () => {
    const model = buildHomePriorityModel({
      items: [
        post({ id: 'expired', expires_at: '2026-08-10T17:00:00.000Z' }),
        post({ id: 'filled', status: 'filled' }),
        post({ id: 'sold', type: 'marketplace', listing_status: 'sold' }),
        post({ id: 'blocked', user_id: 'blocked-user' }),
        post({ id: 'reported', reported: true }),
        post({ id: 'valid' }),
        post({ id: 'valid' }),
      ],
      blockedUserIds: ['blocked-user'],
      now: new Date('2026-08-10T18:00:00.000Z'),
    });
    expect(model.priorities.map(({ id }) => id)).toEqual(['valid']);
  });
});
```

- [ ] **Step 2: Run the domain test and verify it fails**

Run: `npm test -- src/lib/feed/homePriority.test.js`  
Expected: FAIL because `homePriority.js` does not exist.

- [ ] **Step 3: Implement deterministic ranking and category leads**

```js
import { BRIEF_CATEGORIES } from './briefCategories';
import { aggregateCategorySignals, classifyBriefCategory } from './briefRanking';

const CLOSED_STATES = new Set(['closed', 'filled', 'completed', 'cancelled']);
const LEVEL_LIMITS = { quiet: 1, balanced: 2, active: 3, all_in: 3 };

export function buildHomePriorityModel({
  items = [], selectedCategoryIds = [], events = [], categorySignals = aggregateCategorySignals(events),
  primaryNetwork = null, currentUserId = null, engagementLevel = 'balanced',
  blockedUserIds = [], now = new Date(), limit = LEVEL_LIMITS[engagementLevel] || 2,
} = {}) {
  const blocked = new Set(blockedUserIds);
  const seen = new Set();
  const eligible = items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    if (blocked.has(item.user_id) || item.reported) return false;
    if (CLOSED_STATES.has(String(item.status || '').toLowerCase())) return false;
    if (item.listing_status && item.listing_status !== 'available') return false;
    const expires = new Date(item.expires_at || item.deadline_at || 0).getTime();
    return !expires || expires > now.getTime();
  });

  const ranked = eligible.map((item) => scoreHomeItem(item, {
    selectedCategoryIds, categorySignals, primaryNetwork, currentUserId, now,
  })).sort(compareHomeItems);
  const priorities = ranked.slice(0, limit);
  const priorityIds = new Set(priorities.map(({ id }) => id));
  const categoryLeads = buildCategoryLeads(ranked, priorityIds);
  return { priorities, categoryLeads, priorityIds };
}

export function buildCategoryLeads(rankedItems, excludedIds = new Set()) {
  return BRIEF_CATEGORIES.map((category) => {
    const allMatches = rankedItems.filter((item) => item.category_id === category.id);
    const leadItem = allMatches.find((item) => !excludedIds.has(item.id)) || null;
    return {
      category,
      item: leadItem,
      count: allMatches.length,
      stateLabel: allMatches.length ? `${allMatches.length} current` : null,
      action: leadItem ? null : category.actions[0],
    };
  }).sort((a, b) => (b.item?.priority_score || 0) - (a.item?.priority_score || 0));
}
```

Implement `scoreHomeItem` and `compareHomeItems` in the same file with fixed weights documented beside the constants. Reasons must come from the same conditions that add score. Use emergency override, deadline bands, ownership/unread replies when present, open-help actionability, network match, selected category, verification, and freshness. Set `is_dominant` only for emergencies or an actionable score at or above the named `DOMINANT_PRIORITY_THRESHOLD` constant.

- [ ] **Step 4: Add tie-break, emergency, ownership, engagement, and no-duplication tests**

```js
it('uses newest timestamp then id for deterministic ties', () => {
  const model = buildHomePriorityModel({
    items: [post({ id: 'b' }), post({ id: 'a' })],
    now: new Date('2026-08-10T18:00:00.000Z'),
  });
  expect(model.priorities.map(({ id }) => id)).toEqual(['a', 'b']);
});

it('does not repeat a priority as its category lead', () => {
  const model = buildHomePriorityModel({
    items: [post({ id: 'urgent' }), post({ id: 'next', deadline_at: null })],
    engagementLevel: 'quiet',
    now: new Date('2026-08-10T18:00:00.000Z'),
  });
  expect(model.categoryLeads.find(({ category }) => category.id === 'helping').item.id).toBe('next');
});
```

- [ ] **Step 5: Run focused and existing ranking tests**

Run: `npm test -- src/lib/feed/homePriority.test.js src/lib/feed/briefRanking.test.js src/services/feedRetentionService.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit the priority domain**

```bash
git add src/lib/feed/homePriority.js src/lib/feed/homePriority.test.js
git commit -m "feat: add explainable home priority model"
```

---

### Task 2: Render the Community Pulse Priority Stack

**Files:**
- Create: `src/components/feed/HomePriorityStack.jsx`
- Create: `src/components/feed/HomePriorityStack.test.jsx`

**Interfaces:**
- Consumes: `items`, `networkLabel`, `engagementLevel`, `onOpenItem(item)`, and `onOpenEngagement()`.
- Produces: no data; renders the approved Priority Stack and an accessible priority explanation sheet.

- [ ] **Step 1: Write failing rendering tests**

```jsx
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomePriorityStack from './HomePriorityStack';

it('renders a dominant first item, compact following items, and true reasons', () => {
  const html = renderToStaticMarkup(<HomePriorityStack
    networkLabel="Five Towns"
    engagementLevel="active"
    items={[
      { id: '1', title: 'Driver needed', category_id: 'helping', is_dominant: true,
        priority_reasons: [{ id: 'ends_soon', label: 'Ends in 2h' }] },
      { id: '2', title: 'Road closes', category_id: 'local', is_dominant: false,
        priority_reasons: [{ id: 'verified', label: 'Verified' }] },
    ]}
  />);
  expect(html).toContain('What needs your attention');
  expect(html).toContain('Ends in 2h');
  expect(html).toContain('Verified');
  expect(html).toContain('data-priority-variant="dominant"');
});

it('renders a calm honest state without fabricated rows', () => {
  const html = renderToStaticMarkup(<HomePriorityStack items={[]} networkLabel="Five Towns" />);
  expect(html).toContain('Nothing needs immediate attention');
  expect(html).not.toContain('0 priorities');
});
```

- [ ] **Step 2: Run the component test and verify it fails**

Run: `npm test -- src/components/feed/HomePriorityStack.test.jsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the stack and explanation sheet**

Create a component using static Tailwind class maps for category tones. The first card uses the dominant treatment only when `item.is_dominant` is true. Every card is a `<button>` with an accessible name assembled from its category, title, and true reasons. The explanation control opens an accessible dialog or in-page sheet containing exactly four groups: urgency, personal relevance, action/impact, and trust/freshness.

```jsx
export default function HomePriorityStack({ items = [], networkLabel = 'Your community', engagementLevel = 'balanced', onOpenItem, onOpenEngagement }) {
  return (
    <section aria-labelledby="home-priority-heading" className="overflow-hidden rounded-[24px] border border-[#DDE3EA] bg-white">
      <header className="px-4 pt-4 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#315B8A]">{networkLabel} pulse</p>
        <h1 id="home-priority-heading" className="mt-1 text-[26px] font-black tracking-[-0.035em] text-[#0F1C2E]">What needs your attention</h1>
        <button type="button" onClick={onOpenEngagement} className="min-h-11 text-[11px] font-black text-blue-700">{engagementLevel} engagement</button>
      </header>
      <div className="space-y-2 px-3 pb-3">
        {items.map((item, index) => <PriorityCard key={item.id} item={item} rank={index + 1} onOpen={onOpenItem} />)}
        {items.length === 0 && <CalmPriorityState />}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run component and accessibility contract tests**

Run: `npm test -- src/components/feed/HomePriorityStack.test.jsx`  
Expected: PASS with no React key, role, or accessible-name warnings.

- [ ] **Step 5: Commit the Community Pulse**

```bash
git add src/components/feed/HomePriorityStack.jsx src/components/feed/HomePriorityStack.test.jsx
git commit -m "feat: render mobile home priority stack"
```

---

### Task 3: Replace repeated posting surfaces with one contribution entry

**Files:**
- Create: `src/components/feed/HomeContributionEntry.jsx`
- Create: `src/components/feed/HomeContributionEntry.test.jsx`
- Reuse: `src/lib/feed/feedIntentions.js`

**Interfaces:**
- Consumes: `onSelect(intention)`.
- Produces: one Home button and an accessible chooser that passes an existing `FEED_INTENTIONS` record to `onSelect`.

- [ ] **Step 1: Write the failing one-entry test**

```jsx
it('shows one contribution entry and keeps all five existing intentions in its chooser', () => {
  const html = renderToStaticMarkup(<HomeContributionEntry onSelect={() => {}} />);
  expect(html.match(/Share with your community/g)).toHaveLength(1);
  for (const label of ['Ask', 'Share', 'Need', 'Offer', 'Plan']) expect(html).toContain(label);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- src/components/feed/HomeContributionEntry.test.jsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the single entry and chooser**

Render one visually primary button. On activation, open a dialog titled **What do you want to do?** and map `FEED_INTENTIONS` to five 44-pixel-minimum actions. Selecting an action closes the chooser and calls `onSelect(intention)`; do not duplicate composer logic.

- [ ] **Step 4: Verify chooser-to-composer contracts**

Export the chooser body as `ContributionOptions` and render it with `renderToStaticMarkup`. Assert that all five buttons carry stable `data-feed-intention` values. Keep composer payload correctness in the existing pure `feedIntentions.test.js` by asserting that `getFeedIntention('need').composer` equals `{ type: 'help', subtype: 'need_help', initialBody: '' }`.

Run: `npm test -- src/components/feed/HomeContributionEntry.test.jsx src/lib/feed/feedIntentions.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit the contribution entry**

```bash
git add src/components/feed/HomeContributionEntry.jsx src/components/feed/HomeContributionEntry.test.jsx
git commit -m "feat: simplify home contribution entry"
```

---

### Task 4: Build the rich two-row category deck

**Files:**
- Create: `src/components/feed/LiveCategoryDeck.jsx`
- Create: `src/components/feed/LiveCategoryDeck.test.jsx`
- Modify: `src/lib/feed/briefCategories.js`
- Modify: `src/lib/feed/briefCategories.test.js`

**Interfaces:**
- Consumes: `leads` from `buildHomePriorityModel`, `onOpenCategory(categoryId)`, and `onSeeAll()`.
- Produces: a two-row horizontal deck with one lead item or honest configured action per category.

- [ ] **Step 1: Add failing category-presentation tests**

Extend each category definition with stable presentation fields:

```js
card: {
  shortLabel: 'Helping',
  tone: 'emerald',
  emptyLabel: 'Ask for or offer help',
}
```

Test that every category has `card.shortLabel`, a supported static `card.tone`, and a non-empty `card.emptyLabel`.

- [ ] **Step 2: Run category tests and verify they fail**

Run: `npm test -- src/lib/feed/briefCategories.test.js`  
Expected: FAIL because category card presentation is missing.

- [ ] **Step 3: Add presentation data and implement `LiveCategoryDeck`**

Use a static tone-class map, a CSS grid with `grid-auto-flow: column`, two rows, horizontal snap, and hidden visual scrollbars. Render real `count`, lead title, and one context line when `lead.item` exists. Otherwise render `lead.category.card.emptyLabel` without a zero count.

```jsx
<div className="grid auto-cols-[72%] grid-flow-col grid-rows-2 gap-2 overflow-x-auto snap-x snap-mandatory">
  {leads.map((lead) => (
    <button key={lead.category.id} type="button" onClick={() => onOpenCategory(lead.category.id)}
      aria-label={`Open ${lead.category.label}${lead.item ? `: ${lead.item.title || lead.item.body}` : ''}`}
      className="motion-press min-h-[100px] snap-start rounded-[18px] border bg-white p-3 text-left">
      <span>{lead.category.card.shortLabel}</span>
      <strong>{lead.item?.title || lead.item?.body || lead.category.card.emptyLabel}</strong>
    </button>
  ))}
</div>
```

- [ ] **Step 4: Test real leads, honest empty cards, ordering, and accessible names**

Ensure a lead item already used in priorities never appears in rendered category leads. Ensure no rendered HTML contains `0 posts`, `0 new`, or `Nothing here`.

Run: `npm test -- src/components/feed/LiveCategoryDeck.test.jsx src/lib/feed/briefCategories.test.js src/lib/feed/homePriority.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit the category deck**

```bash
git add src/components/feed/LiveCategoryDeck.jsx src/components/feed/LiveCategoryDeck.test.jsx src/lib/feed/briefCategories.js src/lib/feed/briefCategories.test.js
git commit -m "feat: add live mobile category deck"
```

---

### Task 5: Upgrade the focused full-category destination

**Files:**
- Modify: `src/components/feed/BriefCategorySection.jsx`
- Modify: `src/components/feed/BriefCategorySection.test.jsx`
- Modify: `src/lib/feed/briefRouteState.test.js` only if a discovered refresh/back regression requires a contract addition.

**Interfaces:**
- Consumes: existing `category`, `posts`, `activeTab`, callbacks, and URL-backed category state.
- Produces: a focused category shell with truthful counts, category actions, shared tabs, category-aware empty states, and Helping privacy language.

- [ ] **Step 1: Write failing Helping and truthful-count tests**

```jsx
it('renders Helping as private coordination with truthful open activity', () => {
  const html = renderToStaticMarkup(<BriefCategorySection
    category={getBriefCategory('helping')}
    posts={[{ id: 'need-1', type: 'help', title: 'Driver needed', status: 'open' }]}
    onBack={() => {}} onAction={() => {}} onOpenPost={() => {}}
  />);
  expect(html).toContain('Private coordination');
  expect(html).toContain('1 open');
  expect(html).toContain('Ask for help');
  expect(html).toContain('Offer help');
});
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `npm test -- src/components/feed/BriefCategorySection.test.jsx src/lib/feed/briefRouteState.test.js`  
Expected: FAIL on the new category presentation requirements.

- [ ] **Step 3: Refine the shared category shell**

Add small pure helpers inside the component file or a focused sibling only if required: `isOpenCategoryItem(post, categoryId)`, `categoryCountLabel(posts, category)`, and `categoryPrivacyCopy(categoryId)`. Preserve the current Updates/Discuss/Directory shared structure, 44-pixel tab targets, action callbacks, and map fallback. For Helping, filter filled requests out of the open count but allow a compact filled-activity closure row when real data exists.

- [ ] **Step 4: Verify every category and route contract**

Run: `npm test -- src/components/feed/BriefCategorySection.test.jsx src/components/feed/BriefCategoryLaunchpad.test.jsx src/lib/feed/briefRouteState.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit the focused category destination**

```bash
git add src/components/feed/BriefCategorySection.jsx src/components/feed/BriefCategorySection.test.jsx src/lib/feed/briefRouteState.test.js
git commit -m "feat: refine focused category destinations"
```

---

### Task 6: Integrate Priority Stack C into the real Feed

**Files:**
- Modify: `src/pages/Feed.jsx`
- Modify: `src/pages/Feed.contract.test.jsx`
- Remove from Home composition only: `FiveTownsBrief` and `FeedIntentionRail` imports/usages.
- Preserve: `BriefCategoryLaunchpad`, `BriefCategorySection`, unified composer, community stream, queries, moderation, and navigation handlers.

**Interfaces:**
- Consumes: `buildHomePriorityModel`, query results already available in `Feed.jsx`, new Home components, existing `openComposer`, a focused `handlePriorityOpen`, and URL-backed Brief handlers.
- Produces: the approved Home order and leaves focused Brief/category routes recoverable.

- [ ] **Step 1: Rewrite the Feed contract test first**

```js
it('uses Priority Stack C and removes repeated Home prompt surfaces', () => {
  expect(source).toContain("import HomePriorityStack from '@/components/feed/HomePriorityStack'");
  expect(source).toContain("import HomeContributionEntry from '@/components/feed/HomeContributionEntry'");
  expect(source).toContain("import LiveCategoryDeck from '@/components/feed/LiveCategoryDeck'");
  expect(source).toContain('buildHomePriorityModel');
  expect(source).toContain('<HomePriorityStack');
  expect(source).toContain('<HomeContributionEntry');
  expect(source).toContain('<LiveCategoryDeck');
  expect(source).not.toContain('<FeedIntentionRail');
  expect(source).not.toContain('<FiveTownsBrief');
  expect(source).toContain('From your community');
});
```

- [ ] **Step 2: Run the Feed contract and verify it fails**

Run: `npm test -- src/pages/Feed.contract.test.jsx`  
Expected: FAIL because Feed still uses the older Brief and intention rail.

- [ ] **Step 3: Build the model from existing safe data**

Add one memoized model after `rankedBriefItems` inputs are available:

```jsx
const homePriorityModel = useMemo(() => buildHomePriorityModel({
  items: [...curatedItems, ...feedPosts],
  selectedCategoryIds: briefPreferences?.interests || DEFAULT_BRIEF_CATEGORY_IDS,
  events: briefSignalEvents,
  primaryNetwork,
  currentUserId: currentUser?.id,
  engagementLevel: briefPreferences?.engagement_level || 'balanced',
  blockedUserIds: blockedIds,
}), [blockedIds, briefPreferences?.engagement_level, briefPreferences?.interests, briefSignalEvents, currentUser?.id, feedPosts, primaryNetwork, curatedItems]);
```

Extract `curatedItems` into its own `useMemo` so it is not recreated inline. Do not introduce new network calls in this task.

- [ ] **Step 4: Add safe priority opening and replace the Home composition**

Add a focused handler so editor-curated items without a real post record never navigate to a nonexistent PostDetail page:

```jsx
const handlePriorityOpen = useCallback((item) => {
  if (item.provenance === 'editor' && !item.post_id) {
    handleOpenBriefCategory(item.category_id);
    return;
  }
  handleCardOpen(item);
}, [handleCardOpen, handleOpenBriefCategory]);
```

When no focused Brief/category route is open, render:

```jsx
<HomePriorityStack
  items={homePriorityModel.priorities}
  networkLabel={primaryNetwork.shortLabel || primaryNetwork.cityPreset || 'Your community'}
  engagementLevel={briefPreferences?.engagement_level || 'balanced'}
  onOpenItem={handlePriorityOpen}
  onOpenEngagement={() => navigate('/Settings')}
/>
<HomeContributionEntry onSelect={(intention) => openComposer(intention.composer)} />
<LiveCategoryDeck
  leads={homePriorityModel.categoryLeads}
  onOpenCategory={handleOpenBriefCategory}
  onSeeAll={handleOpenBrief}
/>
```

Keep **From your community** directly below the deck. Preserve current loading, error, cached, empty, pagination, like, reply, save, report, block, and detail behavior.

- [ ] **Step 5: Run the complete focused Home suite**

Run: `npm test -- src/pages/Feed.contract.test.jsx src/components/feed/HomePriorityStack.test.jsx src/components/feed/HomeContributionEntry.test.jsx src/components/feed/LiveCategoryDeck.test.jsx src/components/feed/BriefCategorySection.test.jsx src/lib/feed/homePriority.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit the Feed integration**

```bash
git add src/pages/Feed.jsx src/pages/Feed.contract.test.jsx
git commit -m "feat: integrate priority stack home"
```

---

### Task 7: Remove production-only community controls and duplicate actions

**Files:**
- Modify: `src/pages/Communities.jsx`
- Create: `src/pages/Communities.contract.test.jsx`

**Interfaces:**
- Consumes: existing admin capability and community membership state.
- Produces: no member-visible reseed control and exactly one join/open action per community card.

- [ ] **Step 1: Write regression tests against the Communities source**

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Communities.jsx', import.meta.url), 'utf8');

describe('Communities production contract', () => {
  it('does not expose reseeding in the member experience', () => {
    expect(source).not.toContain('⟳ Reseed');
    expect(source).not.toContain('Reseed featured communities (admin only)');
  });

  it('uses one owned join action component per card', () => {
    expect(source).toContain('function CommunityJoinAction');
  });
});
```

- [ ] **Step 2: Run the contract and verify it fails**

Run: `npm test -- src/pages/Communities.contract.test.jsx`  
Expected: FAIL because the reseed control is visible and join markup is duplicated.

- [ ] **Step 3: Remove member reseed UI and consolidate join action markup**

Delete the member-page reseed button, its local loading state, and invocation handler if unused elsewhere. Keep reseeding in the existing admin-only surface. Extract one local `CommunityJoinAction` used by hero and secondary cards; it renders either **Open room** or **Join room**, never nested duplicate buttons.

- [ ] **Step 4: Run Communities and broad tests**

Run: `npm test -- src/pages/Communities.contract.test.jsx`  
Expected: PASS.

- [ ] **Step 5: Commit the production cleanup**

```bash
git add src/pages/Communities.jsx src/pages/Communities.contract.test.jsx
git commit -m "fix: remove member-only community seed controls"
```

---

### Task 8: Verify the complete real-user story

**Files:**
- Modify only if verification finds a specific failure covered by this plan.
- Audit: entire repository through the JUnited self-check skill.

**Interfaces:**
- Verifies: authenticated Home load -> priority ranking -> explanation -> item detail -> contribution chooser -> real composer -> category deck -> focused category -> back navigation -> community stream.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check-style
npm run check-jewish-hub
npm run check-prompts
```

Expected: every command exits 0. Record warnings separately; do not report a warning as a pass or failure without explaining it.

- [ ] **Step 2: Start the real Vite app and verify at 390 by 844**

Run: `npm run dev -- --host 127.0.0.1`  
Expected: Vite prints a local URL and no startup error.

In the browser, sign in using the user's existing session and verify:

1. Home shows only real loaded priorities.
2. A dominant card appears only for a genuinely urgent actionable candidate.
3. **How priority works** opens and closes.
4. Priority detail navigation works.
5. The one contribution entry opens all five existing intentions.
6. Selecting an intention opens the real composer; do not publish during verification.
7. The two-row deck swipes and cards have real leads or honest actions.
8. Helping opens through URL state; refresh and back preserve expected state.
9. From-your-community cards, replies, and detail opening still work.
10. No horizontal page overflow, clipped bottom navigation, or console error occurs.

- [ ] **Step 3: Verify empty, loading, error, and stale states**

Use existing preview fixtures or focused tests; do not mutate production data. Confirm no state claims nonexistent activity and every failure offers a retry or useful next action.

- [ ] **Step 4: Run the JUnited self-check skill**

Run the required read-only repository-wide consistency and UX contract audit. Fix only failures caused by this implementation, then rerun the smallest failed check and the full relevant suite.

- [ ] **Step 5: Review the final diff and commit verification fixes**

```bash
git diff --check
git status --short
git diff -- src/lib/feed src/components/feed src/pages/Feed.jsx src/pages/Communities.jsx
```

Confirm the two pre-existing `UnifiedPostModal` files remain separate from Priority Stack commits.

If verification requires a code fix, return to the task that owns the failing file, add the exact files listed in that task's commit step, rerun that task's focused tests, and use `git commit -m "fix: verify priority stack home flow"`.

- [ ] **Step 6: Produce the handoff report**

Report exact automated results, browser flows tested, remaining warnings, commit IDs, files intentionally left dirty, and the fact that no push or deployment occurred unless the user separately authorizes those actions.
