# Five Towns Home Dashboard and Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved large Five Towns dashboard the JUnited Home screen and give it a populated, sourced, kosher-aware Jewish directory that works cleanly on iPhone.

**Architecture:** Keep `/Feed` as the authenticated Home route, but move the main Home composition into a focused `FiveTownsHomeDashboard` component. Put category definitions, listing normalization, verification rules, and map links in a separate directory module so the dashboard and category screens share one source of truth. Existing JUnited routes remain intact and are opened from dashboard cards; real feed content becomes one dashboard destination instead of controlling Home.

**Tech Stack:** React 18, React Router 6, TanStack Query, Tailwind CSS, Lucide React, Vitest, Vite, Supabase-backed entity services.

## Global Constraints

- Design for a 390-pixel-wide iPhone viewport first with no sideways page scrolling.
- Use real sourced listings; never invent hours, certification, ownership, popularity, reviews, attendance, or activity.
- A food listing may show a kosher label only when its verification record includes a current public certification source.
- Non-food businesses may be described as serving Jewish life, but JUnited must not guess an owner's religion.
- Physical listings with public addresses must expose Google Maps, Apple Maps, and Waze links.
- Personalized ordering may change prominence but must not hide directory availability.
- Preserve existing publishing, messages, profile, communities, help, and map capabilities.
- Do not stage or modify the unrelated local Supabase files already present in the worktree.

---

### Task 1: Directory taxonomy and normalized listing model

**Files:**
- Create: `src/lib/directory/fiveTownsDirectory.js`
- Create: `src/lib/directory/fiveTownsDirectory.test.js`
- Create: `src/data/fiveTownsDirectory.json`

**Interfaces:**
- Consumes: the 121 sourced prototype records in `.superpowers/brainstorm/33410-1787685410/content/five-towns-directory-data.json`.
- Produces: `DIRECTORY_GROUPS`, `FIVE_TOWNS_LISTINGS`, `normalizeDirectoryListing(record)`, `filterDirectoryListings(listings, filters)`, `directoryMapLinks(listing)`, and `canShowKosherVerification(listing)`.

- [ ] **Step 1: Write failing taxonomy and verification tests**

```js
import { describe, expect, it } from 'vitest';
import {
  DIRECTORY_GROUPS,
  FIVE_TOWNS_LISTINGS,
  canShowKosherVerification,
  directoryMapLinks,
  filterDirectoryListings,
} from './fiveTownsDirectory';

describe('Five Towns directory', () => {
  it('exposes the eight approved groups with populated subcategories', () => {
    expect(DIRECTORY_GROUPS).toHaveLength(8);
    expect(DIRECTORY_GROUPS.map((group) => group.id)).toEqual([
      'jewish-life', 'food', 'family', 'shopping',
      'health', 'services', 'community', 'things-to-do',
    ]);
    expect(DIRECTORY_GROUPS.every((group) => group.categories.length > 0)).toBe(true);
  });

  it('keeps every imported listing sourced and categorized', () => {
    expect(FIVE_TOWNS_LISTINGS.length).toBeGreaterThanOrEqual(121);
    expect(FIVE_TOWNS_LISTINGS.every((item) => item.sourceUrl && item.groupId && item.categoryId)).toBe(true);
  });

  it('shows kosher verification only with a certification source', () => {
    expect(canShowKosherVerification({ kosher: true, kosherSourceUrl: '' })).toBe(false);
    expect(canShowKosherVerification({ kosher: true, kosherSourceUrl: 'https://certifier.example/place' })).toBe(true);
  });

  it('builds all three map links for a public physical address', () => {
    const links = directoryMapLinks({ name: 'Test', address: '1 Central Ave, Cedarhurst, NY' });
    expect(links.google).toContain('google.com/maps');
    expect(links.apple).toContain('maps.apple.com');
    expect(links.waze).toContain('waze.com');
  });

  it('filters by group, category, town, and search text', () => {
    const results = filterDirectoryListings(FIVE_TOWNS_LISTINGS, {
      groupId: 'food', categoryId: 'restaurants', town: 'Cedarhurst', query: 'pizza',
    });
    expect(results.every((item) => item.groupId === 'food' && item.categoryId === 'restaurants')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: FAIL because the directory module and normalized data do not exist.

- [ ] **Step 3: Import and normalize the existing records**

Create `src/data/fiveTownsDirectory.json` from the saved 121-record dataset without changing factual values. Implement the approved eight-group taxonomy and map legacy record types into specific categories. Use this record shape:

```js
{
  id: String,
  name: String,
  description: String,
  groupId: String,
  categoryId: String,
  address: String,
  town: String,
  latitude: Number | null,
  longitude: Number | null,
  phone: String,
  website: String,
  sourceUrl: String,
  sourceLabel: String,
  kosher: Boolean,
  kosherCertifier: String,
  kosherSourceUrl: String,
  lastChecked: String,
}
```

`canShowKosherVerification` must return true only when `kosher === true` and `kosherSourceUrl` is a valid HTTP(S) URL. `directoryMapLinks` must return an empty object when the address is missing.

- [ ] **Step 4: Run the test and verify success**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: PASS for taxonomy, sourcing, kosher verification, map links, and filtering.

- [ ] **Step 5: Commit the normalized directory foundation**

```bash
git add src/data/fiveTownsDirectory.json src/lib/directory/fiveTownsDirectory.js src/lib/directory/fiveTownsDirectory.test.js
git commit -m "feat: add sourced Five Towns directory model"
```

### Task 2: Expand and verify real Five Towns listings

**Files:**
- Modify: `src/data/fiveTownsDirectory.json`
- Create: `docs/directory/five-towns-source-audit.md`
- Modify: `src/lib/directory/fiveTownsDirectory.test.js`

**Interfaces:**
- Consumes: official business and organization pages, public kosher-certifier lists, school/shul sites, and reputable local directories used for discovery.
- Produces: expanded records for every approved group and a human-readable audit of source coverage.

- [ ] **Step 1: Add a failing coverage test**

```js
it('provides real options across all approved groups', () => {
  const counts = Object.fromEntries(DIRECTORY_GROUPS.map((group) => [
    group.id,
    FIVE_TOWNS_LISTINGS.filter((item) => item.groupId === group.id).length,
  ]));
  expect(counts['jewish-life']).toBeGreaterThan(0);
  expect(counts.food).toBeGreaterThan(0);
  expect(counts.family).toBeGreaterThan(0);
  expect(counts.shopping).toBeGreaterThan(0);
  expect(counts.health).toBeGreaterThan(0);
  expect(counts.services).toBeGreaterThan(0);
  expect(counts.community).toBeGreaterThan(0);
  expect(counts['things-to-do']).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the coverage test and identify empty groups**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: FAIL with the names of groups not covered by the imported dataset.

- [ ] **Step 3: Research and add sourced listings**

For each new record, confirm the current public name, category, address or service area, public website, and source. For food records, add `kosherCertifier` and `kosherSourceUrl` only when the current certifier supports the claim. Record the check date as `2026-08-28`. Do not add unverifiable records just to increase counts.

- [ ] **Step 4: Write the source audit**

Document group counts, source hierarchy, food certification rules, records excluded for uncertainty, and any incomplete categories. The audit must explicitly state that directory inclusion does not claim Jewish ownership.

- [ ] **Step 5: Run data tests and inspect duplicate IDs and addresses**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: PASS with every group populated and all records sourced.

- [ ] **Step 6: Commit the researched dataset**

```bash
git add src/data/fiveTownsDirectory.json src/lib/directory/fiveTownsDirectory.test.js docs/directory/five-towns-source-audit.md
git commit -m "data: expand verified Five Towns directory"
```

### Task 3: Build the grouped iPhone directory experience

**Files:**
- Create: `src/components/home/FiveTownsDirectory.jsx`
- Create: `src/components/home/FiveTownsDirectory.test.jsx`
- Create: `src/components/home/DirectoryListingCard.jsx`

**Interfaces:**
- Consumes: exports from `src/lib/directory/fiveTownsDirectory.js`.
- Produces: `<FiveTownsDirectory initialGroupId onClose />` and reusable listing cards with source, verification, correction, and map actions.

- [ ] **Step 1: Write failing render and interaction tests**

```jsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsDirectory from './FiveTownsDirectory';

describe('FiveTownsDirectory', () => {
  it('renders all eight groups and accurate result language', () => {
    const html = renderToStaticMarkup(<FiveTownsDirectory />);
    expect(html).toContain('Jewish life');
    expect(html).toContain('Things to do');
    expect(html).toContain('Search the Five Towns');
    expect(html).toContain('Source');
  });

  it('does not print an unsourced kosher badge', () => {
    const html = renderToStaticMarkup(<FiveTownsDirectory />);
    expect(html).not.toContain('data-kosher-unverified="true"');
  });
});
```

- [ ] **Step 2: Run the component test and verify failure**

Run: `npm test -- src/components/home/FiveTownsDirectory.test.jsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement group, subcategory, search, town, and detail states**

Use one mobile sheet/page surface. The initial state shows eight group cards. Selecting a group shows subcategory chips and real results. Selecting a listing opens detail information, its source, correction reporting, and map buttons. Empty filters show `No verified listings match this search yet` plus `Suggest a missing listing`.

- [ ] **Step 4: Run directory component tests**

Run: `npm test -- src/components/home/FiveTownsDirectory.test.jsx src/lib/directory/fiveTownsDirectory.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the directory UI**

```bash
git add src/components/home/FiveTownsDirectory.jsx src/components/home/FiveTownsDirectory.test.jsx src/components/home/DirectoryListingCard.jsx
git commit -m "feat: build grouped Five Towns directory"
```

### Task 4: Build the approved large Home dashboard

**Files:**
- Create: `src/components/home/FiveTownsHomeDashboard.jsx`
- Create: `src/components/home/FiveTownsHomeDashboard.test.jsx`
- Modify: `src/pages/Feed.jsx`
- Modify: `src/pages/Feed.contract.test.jsx`

**Interfaces:**
- Consumes: real posts and loading/error state already owned by `Feed.jsx`, directory exports, current user preferences, and React Router navigation.
- Produces: `<FiveTownsHomeDashboard user posts isLoading isError onRetry onPublish onOpenPost />` as the primary closed-brief Home surface.

- [ ] **Step 1: Replace the old source contract with a failing dashboard contract**

```js
it('uses the approved large dashboard as Home', () => {
  expect(source).toContain("import FiveTownsHomeDashboard from '@/components/home/FiveTownsHomeDashboard'");
  expect(source).toContain('<FiveTownsHomeDashboard');
  expect(source).not.toContain('<HomePriorityStack');
  expect(source).not.toContain('<LiveCategoryDeck');
});
```

Add component tests that assert the dashboard exposes search, directory groups, local information, people and groups, Jewish life, opportunities, help, and the real-content state without fake copy.

- [ ] **Step 2: Run the dashboard tests and verify failure**

Run: `npm test -- src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.contract.test.jsx`

Expected: FAIL because the production dashboard is not wired.

- [ ] **Step 3: Implement the approved Home composition**

Match the saved `five-towns-complete-v2.html` hierarchy while using production routes and data:

- Universal search opens `/Search`.
- Directory groups open the in-dashboard directory.
- Publish opens `/Publish`.
- Inbox opens `/Messages`.
- Me opens `/Profile`.
- Jewish life routes to verified shul/minyan and directory content.
- Opportunities route to marketplace/jobs/housing filters already supported by JUnited.
- Help routes to `/MitzvahCircle`.
- Real posts render only when returned by the backend; otherwise show an honest calm state.

Remove `HomePriorityStack` and `LiveCategoryDeck` from the default Home composition without deleting the reusable modules.

- [ ] **Step 4: Run the dashboard and Feed tests**

Run: `npm test -- src/components/home/FiveTownsHomeDashboard.test.jsx src/components/home/FiveTownsDirectory.test.jsx src/pages/Feed.contract.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the Home replacement**

```bash
git add src/components/home/FiveTownsHomeDashboard.jsx src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.jsx src/pages/Feed.contract.test.jsx
git commit -m "feat: make Five Towns dashboard the Home screen"
```

### Task 5: Verify iPhone behavior and complete the branch

**Files:**
- Modify only files required by failures found during verification.

**Interfaces:**
- Consumes: the completed Home and directory flow.
- Produces: a tested branch, visible iPhone preview, and pushed GitHub commits.

- [ ] **Step 1: Run focused and full automated checks**

Run:

```bash
npm test -- src/lib/directory/fiveTownsDirectory.test.js src/components/home/FiveTownsDirectory.test.jsx src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.contract.test.jsx
npm test
npm run lint
npm run typecheck
npm run build
npm run check-prompts
npm run check-style
npm run check-jewish-hub
```

Expected: every command exits 0.

- [ ] **Step 2: Run the JUnited self-check**

Run the repository self-check skill against the changed files and fix any blocking regression it finds. Do not stage unrelated Supabase files.

- [ ] **Step 3: Verify the browser flow at 390 × 844**

Open `/Feed` while authenticated and verify:

1. The large dashboard is the initial Home screen.
2. No horizontal overflow occurs.
3. Every group opens.
4. Search and town/category filters work.
5. At least one physical listing exposes Google, Apple, and Waze.
6. A verified food listing shows its certifier and source.
7. An unverified food listing does not show a kosher badge.
8. Search, Publish, Inbox, Me, Help, and correction-report actions open their real destinations.
9. Bottom navigation never covers the last result.
10. No invented community content appears.

- [ ] **Step 4: Commit verification fixes**

```bash
git add src/components/home src/lib/directory src/data/fiveTownsDirectory.json src/pages/Feed.jsx src/pages/Feed.contract.test.jsx
git commit -m "fix: harden Five Towns Home on iPhone"
```

If verification required no code changes, skip this commit.

- [ ] **Step 5: Push the existing branch**

Run: `git push origin codex/smart-publishing-ai-admin`

Expected: the remote branch and existing pull request contain the completed dashboard and directory work.
