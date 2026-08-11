# Personalized Feed Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build JUnited's approved three-step preference setup so each member controls what appears, how much appears, and when Home catches them up.

**Architecture:** Extend the existing `feed_user_preferences` row and `feedRetentionService`; do not create a second preference system. A pure preference model validates setup drafts and expands nine member-facing interest groups into JUnited's canonical categories. The setup, Settings, and Home ranking consume that same normalized model so explicit choices remain explainable and override bounded learned behavior.

**Tech Stack:** React 18, Vite 6, Tailwind CSS 3, TanStack Query 5, Vitest 4, Supabase/Postgres, existing JUnited entity services

## Global Constraints

- Use the approved three-step mobile flow from `.superpowers/brainstorm/77391-1786465244/content/personalization-short-direct-v5.html`.
- Verify the primary layout at exactly 390 by 844 CSS pixels.
- Do not request or enable push, email, or SMS during setup.
- Skip saves balanced defaults and marks setup handled.
- Explicit member choices always outrank learned behavior.
- Unselected onboarding topics remain Normal; onboarding never silently hides a topic.
- Genuine affected-member emergencies, the member's own activity, moderation notices, and legally required notices cannot be hidden.
- Do not inspect direct-message contents, private coordination, precise private addresses, or unrelated sensitive profile data.
- Preserve existing auth, RLS, query-key, privacy, moderation, blocking, expiry, and deduplication contracts.
- Use Supabase CLI discovery and `supabase migration new`; never invent a migration timestamp.
- Preserve the pre-existing unrelated changes in `src/components/feed/UnifiedPostModal.jsx` and `src/components/feed/UnifiedPostModal.contract.test.jsx`.

---

## File map

**Create**

- `src/lib/feed/feedPreferenceModel.js` — canonical groups, validation, setup-draft normalization, timing rules, and ranking helpers.
- `src/lib/feed/feedPreferenceModel.test.js` — pure model contract.
- `src/components/feed/FeedPreferenceSetup.jsx` — three-step setup, review, skip, save, retry, and accessibility.
- `src/components/feed/FeedPreferenceSetup.test.jsx` — component behavior contract.
- `supabase/migrations/*_personalized_feed_preferences.sql` — preference columns and constraints; the exact file is allocated by `supabase migration new personalized_feed_preferences` during Task 2.

**Modify**

- `src/services/feedRetentionService.js` — normalize and save new fields, produce ranking context, preserve compatibility.
- `src/services/feedRetentionService.test.js` — service sanitization and mutation tests.
- `src/lib/feed/homePriority.js` — apply explicit category preferences, group relevance, and current catch-up context.
- `src/lib/feed/homePriority.test.js` — explicit choice, timing, and emergency-override tests.
- `src/components/settings/BriefPreferencesSettings.jsx` — permanent More / Normal / Less / Hide, amount, and timing controls.
- `src/components/settings/BriefPreferencesSettings.test.jsx` — Settings/model parity.
- `src/pages/Feed.jsx` — first-run gate and normalized ranking context.
- `src/pages/Feed.contract.test.jsx` — setup gate and Home wiring contract.
- `internal/roadmap.js` — truthful implementation progress; do not mark shipped until production verification.

## Shared interfaces

All tasks use these names exactly:

```js
// src/lib/feed/feedPreferenceModel.js
export const INTEREST_GROUPS;
export const CATEGORY_PREFERENCE_VALUES;
export const CATCH_UP_WINDOWS;
export const DEFAULT_SETUP_DRAFT;
export function normalizePreferenceProfile(preferences, userId = null);
export function normalizeSetupDraft(draft);
export function buildPreferencePatch(draft, { completedAt } = {});
export function applyCatchUpSelection(currentWindows, nextWindow);
export function getActiveCatchUpWindow(windows, now = new Date());
export function getCategoryPreference(preferences, categoryId);
export function getCategoryPreferenceAdjustment(value);
export function matchesInterestGroup(item, groupId);
```

Normalized preference shape:

```js
{
  user_id: string | null,
  interests: string[],
  engagement_level: 'quiet' | 'balanced' | 'active' | 'all_in',
  interest_groups: string[],
  category_preferences: Record<string, 'more' | 'normal' | 'less' | 'hide'>,
  catch_up_windows: Array<'morning' | 'daytime' | 'evening' | 'important_only'>,
  preference_setup_version: number,
  preference_setup_completed_at: string | null,
}
```

---

### Task 1: Pure preference model

**Files:**

- Create: `src/lib/feed/feedPreferenceModel.js`
- Create: `src/lib/feed/feedPreferenceModel.test.js`
- Read: `src/lib/feed/briefCategories.js`

**Interfaces:**

- Consumes: `BRIEF_CATEGORY_IDS`, `DEFAULT_BRIEF_CATEGORY_IDS`.
- Produces: every shared interface listed above.

- [ ] **Step 1: Write failing tests for group expansion and setup defaults**

```js
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETUP_DRAFT,
  buildPreferencePatch,
  matchesInterestGroup,
  normalizeSetupDraft,
} from './feedPreferenceModel';

describe('feedPreferenceModel', () => {
  it('starts with local updates and plans without hiding anything else', () => {
    expect(DEFAULT_SETUP_DRAFT.interest_groups).toEqual(['local', 'plans']);
    const patch = buildPreferencePatch(DEFAULT_SETUP_DRAFT, { completedAt: '2026-08-11T16:00:00.000Z' });
    expect(patch.interests).toEqual(expect.arrayContaining([
      'local', 'events', 'sports_social', 'shabbos_plans',
    ]));
    expect(Object.values(patch.category_preferences)).not.toContain('hide');
  });

  it('removes unknown values and keeps an empty interest selection valid', () => {
    expect(normalizeSetupDraft({
      interest_groups: ['unknown'],
      engagement_level: 'invalid',
      catch_up_windows: ['later'],
    })).toMatchObject({
      interest_groups: [],
      engagement_level: 'balanced',
      catch_up_windows: [],
    });
  });

  it('matches People and groups from community-source fields only', () => {
    expect(matchesInterestGroup({ community_id: 'community-1' }, 'people')).toBe(true);
    expect(matchesInterestGroup({ title: 'A person is mentioned' }, 'people')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the model tests and verify the missing-module failure**

Run: `npm test -- src/lib/feed/feedPreferenceModel.test.js`

Expected: FAIL because `feedPreferenceModel.js` does not exist.

- [ ] **Step 3: Implement canonical groups, normalization, and patch building**

Use these exact group IDs and mappings:

```js
export const INTEREST_GROUPS = [
  { id: 'local', label: 'Local updates', categoryIds: ['local'] },
  { id: 'plans', label: 'Events and plans', categoryIds: ['events', 'sports_social', 'shabbos_plans'] },
  { id: 'food', label: 'Food and openings', categoryIds: ['kosher_food'] },
  { id: 'help', label: 'Help and chesed', categoryIds: ['helping'] },
  { id: 'learning', label: 'Learning', categoryIds: ['torah_learning'] },
  { id: 'minyan', label: 'Minyanim and times', categoryIds: ['minyanim', 'jewish_times'] },
  { id: 'people', label: 'People and groups', categoryIds: [] },
  { id: 'market', label: 'Marketplace and jobs', categoryIds: ['marketplace', 'jobs_business'] },
  { id: 'family', label: 'Family and schools', categoryIds: ['parents_schools'] },
];

export const CATEGORY_PREFERENCE_VALUES = ['more', 'normal', 'less', 'hide'];
export const CATCH_UP_WINDOWS = ['morning', 'daytime', 'evening', 'important_only'];
export const DEFAULT_SETUP_DRAFT = Object.freeze({
  interest_groups: ['local', 'plans'],
  engagement_level: 'balanced',
  catch_up_windows: ['morning', 'evening'],
});
```

`buildPreferencePatch` must expand selected groups, assign expanded categories `more`, leave every other canonical category `normal`, and return `preference_setup_version: 1` plus the supplied completion timestamp.

The People and groups matcher must use community-source fields only; it must not inspect message content or private profile data.

- [ ] **Step 4: Add failing timing-exclusivity tests**

```js
it('makes important-only mutually exclusive with fixed windows', () => {
  expect(applyCatchUpSelection(['morning', 'evening'], 'important_only')).toEqual(['important_only']);
  expect(applyCatchUpSelection(['important_only'], 'daytime')).toEqual(['daytime']);
});

it('identifies the current selected catch-up window', () => {
  expect(getActiveCatchUpWindow(['morning'], new Date('2026-08-11T08:00:00-04:00'))).toBe('morning');
  expect(getActiveCatchUpWindow(['evening'], new Date('2026-08-11T19:00:00-04:00'))).toBe('evening');
});
```

- [ ] **Step 5: Implement timing and category-adjustment helpers**

Use these deterministic windows: morning `05:00–10:59`, daytime `11:00–16:59`, evening `17:00–22:59`; outside them return `null`. Use category adjustments `more: 30`, `normal: 0`, `less: -20`; return negative infinity for `hide` so callers can suppress ordinary items before sorting.

- [ ] **Step 6: Run the focused tests**

Run: `npm test -- src/lib/feed/feedPreferenceModel.test.js`

Expected: PASS.

- [ ] **Step 7: Commit the pure model**

```bash
git add src/lib/feed/feedPreferenceModel.js src/lib/feed/feedPreferenceModel.test.js
git commit -m "feat: add personalized feed preference model"
```

---

### Task 2: Supabase preference persistence

**Files:**

- Create through CLI: the single file matching `supabase/migrations/*_personalized_feed_preferences.sql` after Task 2 Step 2
- Modify: `src/services/feedRetentionService.js`
- Modify: `src/services/feedRetentionService.test.js`

**Interfaces:**

- Consumes: `normalizePreferenceProfile`, `buildPreferencePatch` from Task 1.
- Produces: `feedRetentionService.getPreferences(userId)` and `savePreferences(userId, patch)` returning the normalized shared shape.

- [ ] **Step 1: Check the installed CLI and current Supabase references**

Run:

```bash
npx supabase --version
npx supabase migration new --help
```

Expected: both commands exit 0. Before SQL is applied anywhere, scan `https://supabase.com/changelog.md` and current migration/RLS documentation as required by the Supabase skill.

- [ ] **Step 2: Generate the migration with the CLI**

Run: `npx supabase migration new personalized_feed_preferences`

Expected: one new file matching `supabase/migrations/*_personalized_feed_preferences.sql`.

- [ ] **Step 3: Add the exact additive SQL to the generated migration**

```sql
alter table public.feed_user_preferences
  add column if not exists interest_groups text[] not null default array[]::text[],
  add column if not exists category_preferences jsonb not null default '{}'::jsonb,
  add column if not exists catch_up_windows text[] not null default array[]::text[],
  add column if not exists preference_setup_version integer not null default 0,
  add column if not exists preference_setup_completed_at timestamptz;

alter table public.feed_user_preferences
  drop constraint if exists feed_user_preferences_catch_up_windows_check;

alter table public.feed_user_preferences
  add constraint feed_user_preferences_catch_up_windows_check
  check (catch_up_windows <@ array['morning','daytime','evening','important_only']::text[]);

alter table public.feed_user_preferences
  drop constraint if exists feed_user_preferences_setup_version_check;

alter table public.feed_user_preferences
  add constraint feed_user_preferences_setup_version_check
  check (preference_setup_version >= 0);
```

Do not add new policies: the existing owner-only SELECT/INSERT/UPDATE policies already cover new columns on the same row.

- [ ] **Step 4: Write failing service tests**

Add tests proving:

```js
it('sanitizes the full preference profile before saving', async () => {
  await feedRetentionService.savePreferences('user-1', {
    interest_groups: ['local', 'unknown'],
    category_preferences: { local: 'more', events: 'wrong', fake: 'hide' },
    catch_up_windows: ['morning', 'later'],
    preference_setup_version: -4,
  });

  expect(updateFeedUserPreference).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    interest_groups: ['local'],
    category_preferences: { local: 'more' },
    catch_up_windows: ['morning'],
    preference_setup_version: 0,
  }));
});
```

- [ ] **Step 5: Run the service tests and verify failure**

Run: `npm test -- src/services/feedRetentionService.test.js`

Expected: FAIL because the new fields are not normalized.

- [ ] **Step 6: Route all reads and writes through the pure normalizer**

Replace the local `normalizeFeedPreferences` logic with `normalizePreferenceProfile`, extend `sanitizePreferencePatch` to whitelist group IDs, canonical category IDs, preference values, catch-up windows, and a nonnegative integer setup version, and preserve the existing create-versus-update behavior.

- [ ] **Step 7: Run persistence tests and inspect the migration**

Run:

```bash
npm test -- src/services/feedRetentionService.test.js src/lib/feed/feedPreferenceModel.test.js
npx supabase migration list --local
```

Expected: tests PASS; the generated migration is listed locally.

- [ ] **Step 8: Commit persistence**

```bash
git add supabase/migrations/*_personalized_feed_preferences.sql src/services/feedRetentionService.js src/services/feedRetentionService.test.js
git commit -m "feat: persist personalized feed settings"
```

---

### Task 3: Explainable ranking integration

**Files:**

- Modify: `src/lib/feed/homePriority.js`
- Modify: `src/lib/feed/homePriority.test.js`
- Modify: `src/services/feedRetentionService.js`
- Modify: `src/services/feedRetentionService.test.js`

**Interfaces:**

- Consumes: normalized `category_preferences`, `interest_groups`, `catch_up_windows`; `getCategoryPreferenceAdjustment`, `getActiveCatchUpWindow`, `matchesInterestGroup`.
- Produces: `buildHomePriorityModel({ preferences, ...existingArgs })` with the existing `{ priorities, categoryLeads, priorityIds }` return contract.

- [ ] **Step 1: Write failing explicit-preference tests**

```js
it('suppresses an ordinary hidden category but keeps an emergency', () => {
  const model = buildHomePriorityModel({
    items: [
      post({ id: 'ordinary-local', category: 'local' }),
      post({ id: 'emergency-local', category: 'safety', urgency: 'emergency' }),
    ],
    preferences: { category_preferences: { local: 'hide' } },
    now: NOW,
  });
  expect(model.priorities.map(({ id }) => id)).toContain('emergency-local');
  expect(model.categoryLeads.flatMap(({ item }) => item?.id || [])).not.toContain('ordinary-local');
});

it('lets explicit more beat bounded learned noise', () => {
  const model = buildHomePriorityModel({
    items: [post({ id: 'event', type: 'event' }), post({ id: 'local', category: 'local' })],
    preferences: { category_preferences: { events: 'more', local: 'less' } },
    events: [{ event_type: 'category_open', metadata: { category_id: 'local' } }],
    now: NOW,
  });
  expect(model.categoryLeads[0].category.id).toBe('events');
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/lib/feed/homePriority.test.js`

Expected: FAIL because ranking does not consume `preferences`.

- [ ] **Step 3: Apply explicit preference filtering and bounded weights**

Normalize `preferences` once at the `buildHomePriorityModel` boundary. Suppress `hide` before scoring unless `isEmergency(item)` or the item belongs to `currentUserId`. Add the category adjustment to the score. Cap aggregate learned category signals to `-10..10` before their existing multiplier so learned behavior cannot erase explicit More/Less.

- [ ] **Step 4: Write failing catch-up-context tests**

Add one morning test showing an overnight local update outranks a later plan, and one evening test showing a near-term plan receives the bounded time-context boost. Assert the returned public reason is truthful, for example `{ id: 'morning_catch_up', label: 'For this morning' }` only during an active selected morning window.

- [ ] **Step 5: Implement time-context scoring without enabling notifications**

Derive the active window through `getActiveCatchUpWindow`. Add no more than 20 score points and one public reason. `important_only` adds no scheduled-time boost; it only prevents optional time-window reasons.

- [ ] **Step 6: Feed the same preferences into chronological feed scoring**

Extend `feedRetentionService.scorePost(post, context)` to accept `preferences`, skip ordinary hidden categories in the caller, and apply More/Less adjustments consistently. Preserve joined-community, recency, and location behavior.

- [ ] **Step 7: Run ranking and service tests**

Run: `npm test -- src/lib/feed/homePriority.test.js src/services/feedRetentionService.test.js`

Expected: PASS.

- [ ] **Step 8: Commit ranking**

```bash
git add src/lib/feed/homePriority.js src/lib/feed/homePriority.test.js src/services/feedRetentionService.js src/services/feedRetentionService.test.js
git commit -m "feat: personalize explainable home ranking"
```

---

### Task 4: Three-step setup component

**Files:**

- Create: `src/components/feed/FeedPreferenceSetup.jsx`
- Create: `src/components/feed/FeedPreferenceSetup.test.jsx`

**Interfaces:**

- Consumes: `initialPreferences`, `networkLabel`, `onSave(patch)`, `onSkip(patch)`.
- Produces: a full-height accessible setup shell; both callbacks return promises and errors remain inside the component.

- [ ] **Step 1: Write failing server-rendered view tests**

```jsx
import { renderToStaticMarkup } from 'react-dom/server';
import { FeedPreferenceSetupView } from './FeedPreferenceSetup';

it('renders the approved nine-interest first step with two defaults selected', () => {
  const html = renderToStaticMarkup(
    <FeedPreferenceSetupView
      step={0}
      draft={DEFAULT_SETUP_DRAFT}
      status="idle"
      onAction={() => {}}
    />
  );
  expect(html.match(/data-interest-group=/g)).toHaveLength(9);
  expect(html).toContain('1 of 3');
  expect(html).toContain('data-interest-group="local"');
  expect(html).toContain('data-interest-group="plans"');
  expect(html.match(/aria-pressed="true"/g)).toHaveLength(2);
});

it('renders the saved draft on review', () => {
  const html = renderToStaticMarkup(
    <FeedPreferenceSetupView
      step={3}
      draft={{ interest_groups: ['food'], engagement_level: 'quiet', catch_up_windows: ['daytime'] }}
      status="idle"
      onAction={() => {}}
    />
  );
  expect(html).toContain('Food and openings');
  expect(html).toContain('Essentials only');
  expect(html).toContain('Daytime');
  expect(html).toContain('Save and open Home');
});
```

- [ ] **Step 2: Add failing view tests for Skip, Back, timing, and retry states**

Render each step through the exported pure `FeedPreferenceSetupView`. Assert Skip is present on steps 0–2, Back is present on steps 1–3, timing buttons expose `aria-pressed`, and `status="error"` displays `Could not save your preferences. Your choices are still here.` plus Retry. The pure model tests from Task 1 prove draft preservation and Important-only exclusivity; the browser acceptance in Task 7 proves actual click navigation.

- [ ] **Step 3: Run component tests and verify failure**

Run: `npm test -- src/components/feed/FeedPreferenceSetup.test.jsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 4: Implement the approved mobile component**

Export a pure `FeedPreferenceSetupView({ step, draft, status, onAction })` for server-rendered contract tests. Wrap it with stateful `FeedPreferenceSetup({ initialPreferences, networkLabel, onSave, onSkip })`. Keep `InterestStep`, `AmountStep`, `TimingStep`, and `ReviewStep` focused and under roughly 80 lines. Use the pure model for defaults, timing changes, and final patches. Controls must use `aria-pressed`, radio semantics, visible focus, minimum 44-pixel targets, a textual `N of 3` indicator, and an independently scrollable content area above a fixed footer.

- [ ] **Step 5: Implement save states**

Disable duplicate submission while pending. On failure render the exact inline copy `Could not save your preferences. Your choices are still here.` and make Retry call the same callback with the unchanged normalized patch.

- [ ] **Step 6: Run component and model tests**

Run: `npm test -- src/components/feed/FeedPreferenceSetup.test.jsx src/lib/feed/feedPreferenceModel.test.js`

Expected: PASS.

- [ ] **Step 7: Commit the setup component**

```bash
git add src/components/feed/FeedPreferenceSetup.jsx src/components/feed/FeedPreferenceSetup.test.jsx
git commit -m "feat: add three-step feed setup"
```

---

### Task 5: First-run gate and Home integration

**Files:**

- Modify: `src/pages/Feed.jsx`
- Modify: `src/pages/Feed.contract.test.jsx`

**Interfaces:**

- Consumes: `FeedPreferenceSetup`, normalized `briefPreferences`, `feedPreferenceKeys`, and `feedRetentionService.savePreferences`.
- Produces: one-time setup before the ordinary Feed body, followed by immediate personalized Home rendering after success.

- [ ] **Step 1: Write failing Feed contract assertions**

```js
expect(source).toContain("import FeedPreferenceSetup from '@/components/feed/FeedPreferenceSetup'");
expect(source).toContain('preference_setup_completed_at');
expect(source).toContain('feedRetentionService.savePreferences');
expect(source).toContain('preferences: briefPreferences');
```

- [ ] **Step 2: Run the Feed contract and verify failure**

Run: `npm test -- src/pages/Feed.contract.test.jsx`

Expected: FAIL on the missing setup wiring.

- [ ] **Step 3: Add the gate only after preferences finish loading**

Do not flash the setup while the preference query is loading. When a signed-in member has a known `primaryNetwork` and a null `preference_setup_completed_at`, return `FeedPreferenceSetup` before the ordinary Feed shell. Preview/guest data must not create a persistent row.

- [ ] **Step 4: Implement atomic Save and Skip handlers**

Both handlers call `feedRetentionService.savePreferences(currentUser.id, patch)`, set the returned normalized row into `feedPreferenceKeys.user(currentUser.id)`, invalidate `feedPreferenceKeys.signals(currentUser.id)`, and then reveal Home. Skip uses `buildPreferencePatch(DEFAULT_SETUP_DRAFT, { completedAt: new Date().toISOString() })` and never calls a notification API.

- [ ] **Step 5: Pass full preferences into both ranking paths**

Pass the normalized preference object to `feedRetentionService.scorePost` and `buildHomePriorityModel`. Filter ordinary hidden categories before the chronological feed slice. Keep emergency, own-activity, blocked, expired, and moderation checks in their existing order.

- [ ] **Step 6: Run Feed, setup, ranking, and service tests**

Run:

```bash
npm test -- src/pages/Feed.contract.test.jsx src/components/feed/FeedPreferenceSetup.test.jsx src/lib/feed/homePriority.test.js src/services/feedRetentionService.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit integration**

```bash
git add src/pages/Feed.jsx src/pages/Feed.contract.test.jsx
git commit -m "feat: gate Home with personalized setup"
```

---

### Task 6: Permanent detailed Settings

**Files:**

- Modify: `src/components/settings/BriefPreferencesSettings.jsx`
- Modify: `src/components/settings/BriefPreferencesSettings.test.jsx`

**Interfaces:**

- Consumes: normalized preference profile and pure preference-model constants.
- Produces: one Settings save patch compatible with first-run setup and Home ranking.

- [ ] **Step 1: Replace binary-interest tests with server-rendered four-state contracts**

```jsx
it('renders all four explicit states for every category', () => {
  const html = renderToStaticMarkup(
    <BriefPreferencesForm
      preferences={normalizePreferenceProfile({ category_preferences: { local: 'hide' } })}
      onChange={() => {}}
      onSave={() => {}}
      isSaving={false}
    />
  );
  expect(html.match(/data-category-preference=/g)).toHaveLength(12);
  expect(html).toContain('aria-label="Local Updates preference"');
  expect(html).toContain('data-category-value="more"');
  expect(html).toContain('data-category-value="normal"');
  expect(html).toContain('data-category-value="less"');
  expect(html).toContain('data-category-value="hide"');
  expect(html).toContain('data-category-id="local" data-category-value="hide" aria-checked="true"');
});
```

Also assert the three amount labels, all timing labels, emergency copy, and the normalized profile reflected by the selected HTML state. Timing exclusivity remains a pure-model test; browser acceptance proves the clicks.

- [ ] **Step 2: Run Settings tests and verify failure**

Run: `npm test -- src/components/settings/BriefPreferencesSettings.test.jsx`

Expected: FAIL because Settings is still binary and has no timing controls.

- [ ] **Step 3: Rebuild Settings around the shared model**

Render each `BRIEF_CATEGORIES` item with a labelled radio group for More, Normal, Less, Hide. Reuse the setup's three user-facing amount labels and timing logic. Continue saving through `feedRetentionService.savePreferences`; do not duplicate sanitization inside the component.

- [ ] **Step 4: Preserve compatibility for legacy rows**

When `category_preferences` is empty, display existing `interests` as More and every other category as Normal. When `engagement_level` is `active`, display Show me everything while preserving the stored value until the member saves.

- [ ] **Step 5: Run Settings and normalization tests**

Run: `npm test -- src/components/settings/BriefPreferencesSettings.test.jsx src/lib/feed/feedPreferenceModel.test.js src/services/feedRetentionService.test.js`

Expected: PASS.

- [ ] **Step 6: Commit Settings**

```bash
git add src/components/settings/BriefPreferencesSettings.jsx src/components/settings/BriefPreferencesSettings.test.jsx
git commit -m "feat: add detailed feed preference settings"
```

---

### Task 7: Full verification and roadmap truth

**Files:**

- Modify: `internal/roadmap.js`
- Review: `docs/superpowers/specs/2026-08-11-personalized-feed-setup-design.md`
- Review: all files changed in Tasks 1–6

**Interfaces:**

- Consumes: the complete feature.
- Produces: verified local implementation and accurate roadmap status, not a production-shipped claim.

- [ ] **Step 1: Run the focused feature suite**

Run:

```bash
npm test -- src/lib/feed/feedPreferenceModel.test.js src/services/feedRetentionService.test.js src/lib/feed/homePriority.test.js src/components/feed/FeedPreferenceSetup.test.jsx src/components/settings/BriefPreferencesSettings.test.jsx src/pages/Feed.contract.test.jsx
```

Expected: PASS.

- [ ] **Step 2: Run the complete repository gates**

Run:

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run check-prompts
git diff --check
```

Expected: every command exits 0. The Browserslist age notice is informational.

- [ ] **Step 3: Run the JUnited self-check skill**

Audit routes, query keys, auth/RLS assumptions, style contracts, duplicate controls, roadmap truth, and regressions. Fix only issues introduced or directly exposed by this feature; preserve unrelated user changes.

- [ ] **Step 4: Test the local app at 390 by 844**

Verify in the visible in-app browser:

1. A member without `preference_setup_completed_at` sees step 1 only after preference loading.
2. Default interests are Local updates and Events and plans.
3. Back preserves the draft.
4. Important only clears other timing choices and vice versa.
5. Review text matches the actual draft.
6. Save survives reload and changes Home ordering.
7. Skip survives reload and enables no notification permission.
8. Settings edits immediately change Home after save.
9. Hide suppresses an ordinary item but not a genuine emergency.
10. No horizontal overflow or console errors occur.

- [ ] **Step 5: Record truthful roadmap progress**

Add a dated note to the existing screen-by-screen redesign/personalization roadmap item: locally implemented and verified on `codex/mobile-home-brief`; still pending merge, deployment, migration application, and production verification. Do not create a duplicate roadmap item.

- [ ] **Step 6: Run roadmap and final diff checks**

Run:

```bash
npm run check-prompts
git diff --check
git status --short
```

Expected: prompt check PASS; only intended feature files plus the two pre-existing `UnifiedPostModal` files are modified.

- [ ] **Step 7: Commit verification records**

```bash
git add internal/roadmap.js
git commit -m "docs: record personalized feed progress"
```

- [ ] **Step 8: Stop before production mutation**

Report the branch, commits, tests, migration filename, and local browser evidence. Do not push, merge, deploy, apply the migration remotely, or change production data without the user's separate authorization.
