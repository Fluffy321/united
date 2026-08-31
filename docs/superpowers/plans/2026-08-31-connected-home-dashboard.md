# Connected Five Towns Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make the current Five Towns Home one connected iPhone dashboard in this order: Today, Find something, Worth knowing nearby, Useful nearby, People and plans.

**Architecture:** Keep FiveTownsHomeDashboard as the only composition root and preserve every real query and route. Add a shared heading, compact daily panel, persisted place-preference model, and People-and-plans wrapper around existing circle/event behavior.

**Tech Stack:** React 18, Vite, Tailwind CSS, Lucide React, Vitest, React Router, existing JUnited services.

## Global Constraints

- Target 390 by 844 CSS pixels.
- /Feed remains Home.
- No fake content, activity, reviews, counts, road states, or personalization reasons.
- Controls are at least 44 by 44 CSS pixels.
- No page-level horizontal overflow.
- Hidden place subjects remain searchable in the full directory.
- Preserve all real data, routes, listing photos/fallbacks, event rules, and circle rules.
- Never stage the user-owned Supabase files already present in git status.

## File map

- HomeSectionHeading.jsx plus test: shared heading language.
- FiveTownsHomeDashboard.jsx plus test: locked order, four shortcuts, search/Tune, composition.
- Feed.jsx plus contract test: connect Tune to existing preferences.
- FiveTownsDailyPanel.jsx plus test: compact sourced daily overview.
- homePlacePreferences.js plus test: persisted reversible nearby controls.
- HomePreferenceReason.jsx plus test: honest explanation/menu.
- HomePeopleAndPlans.jsx plus test: combined final section.
- HomeCircleActivity.jsx and HomeTonight.jsx plus tests: embedded modes.
- internal/roadmap.js: verified product truth.

---

### Task 1: Shared Home language and shell

**Files:**
- Create: src/components/home/HomeSectionHeading.jsx
- Create: src/components/home/HomeSectionHeading.test.jsx
- Modify: src/components/home/FiveTownsHomeDashboard.jsx
- Modify: src/components/home/FiveTownsHomeDashboard.test.jsx
- Modify: src/pages/Feed.jsx
- Modify: src/pages/Feed.contract.test.jsx

**Interfaces:**
- Produce HomeSectionHeading({ eyebrow, title, action, onAction, titleId, tone }).
- Add FiveTownsHomeDashboard prop onTuneHome.
- Preserve openDirectory and all existing callbacks.

- [ ] **Step 1: Write failing tests**

~~~jsx
const html = renderToStaticMarkup(
  <HomeSectionHeading eyebrow="Everything Jewish" title="Find something" action="All listings" titleId="find-title" />,
);
expect(html).toContain('Everything Jewish');
expect(html).toContain('Find something');
expect(html).toContain('All listings');
expect(html).toContain('min-h-11');
expect(html).toContain('id="find-title"');
~~~

Add dashboard assertions:

~~~jsx
expect(html.indexOf('Today at a glance')).toBeLessThan(html.indexOf('Find something'));
expect(html.indexOf('Find something')).toBeLessThan(html.indexOf('Worth knowing nearby'));
expect(html.indexOf('Worth knowing nearby')).toBeLessThan(html.indexOf('Useful nearby'));
expect(html.indexOf('Useful nearby')).toBeLessThan(html.indexOf('People and plans'));
expect(html.match(/data-home-directory-shortcut=/g)).toHaveLength(4);
expect(html).toContain('Find anything Jewish nearby');
expect(html).toContain('aria-label="Tune Home"');
~~~

Add Feed contract assertion:

~~~js
expect(source).toContain("onTuneHome={() => navigate('/Settings?section=notifications')}");
~~~

- [ ] **Step 2: Run tests and confirm failure**

~~~bash
npx vitest run src/components/home/HomeSectionHeading.test.jsx src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.contract.test.jsx
~~~

Expected: FAIL because the shared component, Tune prop, and labels do not exist.

- [ ] **Step 3: Implement HomeSectionHeading**

~~~jsx
import React from 'react';

const TONES = {
  blue: 'text-[#2861E8]',
  violet: 'text-violet-600',
  orange: 'text-orange-600',
};

export default function HomeSectionHeading({ eyebrow, title, action, onAction, titleId, tone = 'blue' }) {
  return (
    <div className="flex items-end justify-between gap-3 px-0.5">
      <div className="min-w-0">
        <p className={'text-[9px] font-black uppercase tracking-[0.16em] ' + (TONES[tone] || TONES.blue)}>{eyebrow}</p>
        <h2 id={titleId} className="mt-0.5 text-[20px] font-black tracking-[-0.045em] text-[#101A2E]">{title}</h2>
      </div>
      {action && <button type="button" onClick={onAction} className="min-h-11 shrink-0 px-1 text-[11px] font-black text-[#2861E8]">{action}</button>}
    </div>
  );
}
~~~

- [ ] **Step 4: Implement the locked shell**

Replace the local SectionHeading. Render only jewish-life, food, family, and things-to-do shortcuts with data-home-directory-shortcut. Keep the full directory unchanged.

Use headings:

~~~jsx
<HomeSectionHeading eyebrow="Everything Jewish" title="Find something" action="All listings" onAction={() => openDirectory('')} titleId="home-find-title" />
<HomeSectionHeading eyebrow="Close to you" title="Worth knowing nearby" action="See all" onAction={() => openDirectory('')} titleId="home-nearby-title" />
<HomeSectionHeading eyebrow="Pick a mood" title="Useful nearby" action="Everything" onAction={() => openDirectory('')} titleId="home-useful-title" />
~~~

Build search as sibling buttons:

~~~jsx
<div className="flex min-h-12 items-center rounded-2xl border border-slate-200 bg-white">
  <button type="button" onClick={() => openDirectory('')} className="flex min-h-12 min-w-0 flex-1 items-center gap-2 px-4 text-left">
    <Search className="h-[18px] w-[18px] shrink-0 text-[#2861E8]" />
    <span className="truncate text-[13px] font-semibold text-slate-400">Find anything Jewish nearby</span>
  </button>
  <button type="button" aria-label="Tune Home" onClick={onTuneHome} className="min-h-11 shrink-0 border-l border-slate-100 px-3 text-[11px] font-black text-[#2861E8]">Tune</button>
</div>
~~~

Feed passes:

~~~jsx
onTuneHome={() => navigate('/Settings?section=notifications')}
~~~

- [ ] **Step 5: Verify and commit**

~~~bash
npx vitest run src/components/home/HomeSectionHeading.test.jsx src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.contract.test.jsx
git add src/components/home/HomeSectionHeading.jsx src/components/home/HomeSectionHeading.test.jsx src/components/home/FiveTownsHomeDashboard.jsx src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.jsx src/pages/Feed.contract.test.jsx
git commit -m "feat: connect the Five Towns Home shell"
~~~

Expected: focused tests pass before commit.

---

### Task 2: Compact daily overview

**Files:**
- Modify: src/components/home/FiveTownsDailyPanel.jsx
- Modify: src/components/home/FiveTownsDailyPanel.test.jsx

**Interfaces:**
- Keep weather, jewishTimes, and traffic props.
- Produce one dark sourced panel labelled by five-towns-today.

- [ ] **Step 1: Write failing state tests**

~~~jsx
expect(ready).toContain('Your day in Five Towns');
expect(ready).toContain('Today at a glance');
expect(ready).toContain('75°');
expect(ready).toContain('Candle lighting');
expect(ready).toContain('Sunset');
expect(verifiedEmpty).toContain('No nearby incidents');
expect(unavailable).toContain('Roads unavailable');
expect(unavailable).not.toContain('Clear');
~~~

- [ ] **Step 2: Confirm failure**

~~~bash
npx vitest run src/components/home/FiveTownsDailyPanel.test.jsx
~~~

Expected: FAIL on the new presentation/copy.

- [ ] **Step 3: Implement compact truthful panel**

Keep formatTime and add:

~~~jsx
function DailyMetric({ label, value, detail }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.08] px-2 py-2.5">
      <strong className="block truncate text-[13px] font-black text-white">{value}</strong>
      <span className="mt-0.5 block truncate text-[8px] font-bold text-blue-100/70">{label}</span>
      {detail && <span className="sr-only">{detail}</span>}
    </div>
  );
}
~~~

Use one shell:

~~~jsx
<section aria-labelledby="five-towns-today" className="rounded-[23px] bg-[#0A1A39] p-4 text-white shadow-[0_14px_30px_rgba(10,26,57,0.18)]">
  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#90AFFF]">Your day in Five Towns</p>
  <h1 id="five-towns-today" className="mt-1 text-[21px] font-black tracking-[-0.05em]">Today at a glance</h1>
  <div className="mt-3 grid grid-cols-4 gap-1.5">
    <DailyMetric label="Weather" value={weatherValue} detail={weatherDetail} />
    <DailyMetric label="Candle lighting" value={formatTime(times.candleLighting)} detail="This coming Shabbat" />
    <DailyMetric label="Sunset" value={formatTime(times.sunset)} detail="Five Towns local time" />
    <DailyMetric label="Roads" value={roadValue} detail={roadDetail} />
  </div>
  <TrafficSummary traffic={traffic} />
</section>
~~~

TrafficSummary renders one real incident linked to 511NY, Checking roads, No nearby incidents, or Roads unavailable. Never claim Clear from unavailable data.

- [ ] **Step 4: Verify and commit**

~~~bash
npx vitest run src/components/home/FiveTownsDailyPanel.test.jsx src/components/home/FiveTownsHomeDashboard.test.jsx
git add src/components/home/FiveTownsDailyPanel.jsx src/components/home/FiveTownsDailyPanel.test.jsx src/components/home/FiveTownsHomeDashboard.test.jsx
git commit -m "feat: compact the Five Towns daily overview"
~~~

Expected: focused tests pass.

---

### Task 3: Honest nearby personalization

**Files:**
- Create: src/lib/home/homePlacePreferences.js
- Create: src/lib/home/homePlacePreferences.test.js
- Create: src/components/home/HomePreferenceReason.jsx
- Create: src/components/home/HomePreferenceReason.test.jsx
- Modify: src/components/home/FiveTownsHomeDashboard.jsx
- Modify: src/components/home/FiveTownsHomeDashboard.test.jsx

**Interfaces:**
- Produce loadHomePlacePreferences, saveHomePlacePreferences, updateHomePlacePreference, rankHomeListings, and homePlaceReason.
- Produce HomePreferenceReason({ reason, onMore, onLess, onHide }).

- [ ] **Step 1: Write failing model tests**

~~~js
const base = { boosts: {}, hidden: [] };
expect(updateHomePlacePreference(base, 'food', 'more')).toEqual({ boosts: { food: 1 }, hidden: [] });
expect(updateHomePlacePreference({ boosts: { food: 1 }, hidden: [] }, 'food', 'less')).toEqual({ boosts: { food: 0 }, hidden: [] });
expect(updateHomePlacePreference(base, 'food', 'hide')).toEqual({ boosts: {}, hidden: ['food'] });
expect(rankHomeListings([food, park], { boosts: { food: 2 }, hidden: [] })[0]).toBe(food);
expect(rankHomeListings([food, park], { boosts: {}, hidden: ['food'] })).toEqual([park]);
expect(homePlaceReason({ boosts: { food: 1 }, hidden: [] }, 'food')).toBe('Shown because you asked for more food');
expect(homePlaceReason(base, 'food')).toBe('');
~~~

Also prove storage key isolation and malformed JSON fallback.

- [ ] **Step 2: Confirm model failure**

~~~bash
npx vitest run src/lib/home/homePlacePreferences.test.js
~~~

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement pure model**

~~~js
const EMPTY = Object.freeze({ boosts: {}, hidden: [] });
const keyFor = (userId) => 'junited:home-place-preferences:' + (userId || 'guest');

export function normalizeHomePlacePreferences(value = {}) {
  const boosts = Object.fromEntries(
    Object.entries(value.boosts || {})
      .filter(([key, score]) => key && Number.isFinite(Number(score)))
      .map(([key, score]) => [key, Math.max(-2, Math.min(2, Number(score)))]),
  );
  return { boosts, hidden: [...new Set((value.hidden || []).filter(Boolean))] };
}

export function updateHomePlacePreference(value, groupId, action) {
  const current = normalizeHomePlacePreferences(value);
  if (!groupId) return current;
  if (action === 'hide') return { boosts: current.boosts, hidden: [...new Set([...current.hidden, groupId])] };
  const delta = action === 'more' ? 1 : action === 'less' ? -1 : 0;
  return {
    boosts: { ...current.boosts, [groupId]: Math.max(-2, Math.min(2, (current.boosts[groupId] || 0) + delta)) },
    hidden: current.hidden.filter((id) => id !== groupId),
  };
}

export function rankHomeListings(listings = [], value = EMPTY) {
  const preferences = normalizeHomePlacePreferences(value);
  return listings
    .filter((listing) => !preferences.hidden.includes(listing.groupId))
    .map((listing, index) => ({ listing, index, score: preferences.boosts[listing.groupId] || 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ listing }) => listing);
}
~~~

load/save guard missing localStorage and never throw. homePlaceReason returns copy only after a real explicit signal.

- [ ] **Step 4: Write failing reason-row tests**

~~~jsx
expect(renderToStaticMarkup(<HomePreferenceReason reason="" />)).toBe('');
const html = renderToStaticMarkup(<HomePreferenceReason reason="Shown because you asked for more food" />);
expect(html).toContain('Shown because you asked for more food');
expect(html).toContain('aria-label="Tune nearby suggestions"');
expect(html).toContain('More like this');
expect(html).toContain('Less like this');
expect(html).toContain('Hide this subject');
expect(html).toContain('min-h-11');
~~~

- [ ] **Step 5: Implement reason row**

Return null for no reason. Otherwise render a pale-blue row and 44-pixel menu button with aria-expanded, aria-haspopup="menu", role="menu", and buttons for More like this, Less like this, Hide this subject. Each callback closes the menu.

- [ ] **Step 6: Connect model to dashboard**

~~~jsx
const [placePreferences, setPlacePreferences] = useState(() => loadHomePlacePreferences(currentUser?.id));
useEffect(() => setPlacePreferences(loadHomePlacePreferences(currentUser?.id)), [currentUser?.id]);
const rankedFeaturedListings = useMemo(() => rankHomeListings(featuredListings, placePreferences), [featuredListings, placePreferences]);
const reasonGroupId = rankedFeaturedListings[0]?.groupId || '';
const reason = homePlaceReason(placePreferences, reasonGroupId);
const changePlacePreference = (action) => {
  const next = updateHomePlacePreference(placePreferences, reasonGroupId, action);
  setPlacePreferences(next);
  saveHomePlacePreferences(currentUser?.id, next);
};
~~~

Render six ranked real listings followed by HomePreferenceReason. If all are hidden, show a compact Tune Home row. Never remove listings from the full directory.

- [ ] **Step 7: Verify and commit**

~~~bash
npx vitest run src/lib/home/homePlacePreferences.test.js src/components/home/HomePreferenceReason.test.jsx src/components/home/FiveTownsHomeDashboard.test.jsx
git add src/lib/home/homePlacePreferences.js src/lib/home/homePlacePreferences.test.js src/components/home/HomePreferenceReason.jsx src/components/home/HomePreferenceReason.test.jsx src/components/home/FiveTownsHomeDashboard.jsx src/components/home/FiveTownsHomeDashboard.test.jsx
git commit -m "feat: personalize nearby Home places honestly"
~~~

Expected: tests pass and untouched preferences show no invented reason.

---

### Task 4: One People and plans ending

**Files:**
- Create: src/components/home/HomePeopleAndPlans.jsx
- Create: src/components/home/HomePeopleAndPlans.test.jsx
- Modify: src/components/home/HomeCircleActivity.jsx and test
- Modify: src/components/home/HomeTonight.jsx and test
- Modify: src/components/home/FiveTownsHomeDashboard.jsx and test

**Interfaces:**
- Produce HomePeopleAndPlans with current activity/event data and callbacks.
- Add embedded boolean to HomeCircleActivity and HomeTonight.

- [ ] **Step 1: Write failing wrapper tests**

~~~jsx
expect(both).toContain('Your community');
expect(both).toContain('People and plans');
expect(both).toContain('From your circles');
expect(both).toContain('Happening tonight');
expect(both.match(/People and plans/g)).toHaveLength(1);
expect(circlesOnly).toContain('Add event');
expect(eventsOnly).toContain('Browse communities');
expect(empty).toContain('Nothing posted yet');
expect(empty).toContain('Browse communities');
expect(empty).toContain('Add event');
expect(empty).not.toContain('people talking');
~~~

Add child tests that embedded mode omits duplicate major headings but keeps real content and actions.

- [ ] **Step 2: Confirm failure**

~~~bash
npx vitest run src/components/home/HomePeopleAndPlans.test.jsx src/components/home/HomeCircleActivity.test.jsx src/components/home/HomeTonight.test.jsx
~~~

Expected: FAIL because wrapper/embedded modes are missing.

- [ ] **Step 3: Add embedded modes**

Standalone children stay unchanged. Embedded children omit their major header, limit previews to two, retain loading/error/quiet/empty behavior, and use:

~~~jsx
<div className="flex min-h-11 items-center justify-between">
  <h3 className="text-[14px] font-black text-slate-900">{embeddedTitle}</h3>
  <button type="button" onClick={embeddedAction} className="min-h-11 px-1 text-[10px] font-black text-[#2861E8]">{embeddedActionLabel}</button>
</div>
~~~

- [ ] **Step 4: Implement wrapper**

~~~jsx
<HomeSectionHeading
  eyebrow="Your community"
  title="People and plans"
  action="See all"
  onAction={onBrowseCommunities}
  titleId="home-people-plans-title"
  tone="violet"
/>
~~~

Derive hasCircles, hasEvents, and settledEmpty. If both are settled empty, render one compact row with 44-pixel Browse communities and Add event buttons. Otherwise render embedded children; a missing side shows one compact honest action.

- [ ] **Step 5: Replace separate dashboard sections**

Pass existing prepared activity/event values and callbacks to HomePeopleAndPlans. Do not change selection logic, circle URLs, event details, event sheet, or publish route.

- [ ] **Step 6: Verify and commit**

~~~bash
npx vitest run src/components/home
git add src/components/home/HomePeopleAndPlans.jsx src/components/home/HomePeopleAndPlans.test.jsx src/components/home/HomeCircleActivity.jsx src/components/home/HomeCircleActivity.test.jsx src/components/home/HomeTonight.jsx src/components/home/HomeTonight.test.jsx src/components/home/FiveTownsHomeDashboard.jsx src/components/home/FiveTownsHomeDashboard.test.jsx
git commit -m "feat: unite Home people and plans"
~~~

Expected: Home tests pass and one People and plans heading renders.

---

### Task 5: Full verification and push

**Files:**
- Modify: internal/roadmap.js
- Modify the design spec only if iPhone verification proves a real mismatch.

- [ ] **Step 1: Run all checks**

~~~bash
npx vitest run src/components/home src/lib/home/homePlacePreferences.test.js src/pages/Feed.contract.test.jsx
npm test
npm run lint
npm run typecheck
npm run check-style
npm run check-jewish-hub
npm run build
~~~

Expected: every command exits 0; record actual totals.

- [ ] **Step 2: Run junited-self-check**

Inspect every High/Medium finding and fix only regressions from this work. Preserve user-owned Supabase files.

- [ ] **Step 3: Verify at 390 by 844**

Check no page overflow; header/search/daily visibility; working search/Tune; all four shortcuts; real listing detail; more/less/hide persistence without directory removal; Useful nearby; circle/event actions; collapsed empty states; safe bottom navigation.

- [ ] **Step 4: Update roadmap truth**

Record connected Home, quiet place controls, and People-and-plans. Keep standalone Events pages planned while /Events, /MyEvents, and /CommunityCalendar redirect.

- [ ] **Step 5: Review, commit, push**

~~~bash
git diff --check
git status --short
git add internal/roadmap.js
git commit -m "docs: record connected Home dashboard"
git push origin codex/smart-publishing-ai-admin
git rev-parse HEAD
git ls-remote origin refs/heads/codex/smart-publishing-ai-admin
~~~

If roadmap already matches, skip the empty commit. Local and remote hashes must match before reopening /Feed in iPhone view.
