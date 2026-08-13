# Communities iPhone Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/Communities` understandable and immediately useful in one iPhone screen while preserving every existing community action and data path.

**Architecture:** Reorder the existing page instead of replacing it. Turn the existing Discover category component into a compact filter rail, simplify `FiveTownsRoomsHub` into three recommendations followed by the remaining catalog, and move Jewish tools below the community experience. All join, open, create, search, loading, and query behavior stays in `Communities.jsx`.

**Tech Stack:** React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, Vitest.

## Global Constraints

- Optimize and verify at 390 × 844 CSS pixels.
- Preserve `/Communities`, community detail routes, joining, Create, search, filters, groups, caching, and recovery.
- Show exactly three recommendations when at least three communities exist.
- Use existing community data only; never fabricate activity or counts.
- Keep 44px minimum touch targets and `mobile-safe-bottom`.
- No database or migration changes.

---

### Task 1: Compact category filter rail

**Files:**
- Modify: `src/components/communities/DiscoverCategoriesScreen.jsx`
- Create: `src/components/communities/DiscoverCategoriesScreen.test.jsx`

**Interfaces:**
- Consumes: `activeCategory: string`, `onSelectCategory(key: string): void`.
- Produces: `DiscoverCategoryCards`, a horizontal compact category filter including an `all` option.

- [x] **Step 1: Write a failing render test**

Render the component to static markup and assert it contains `Explore by category`, all ten category labels, `All`, `aria-pressed`, `min-h-11`, and does not contain the old copy `Join a room with a reason` or `min-w-[178px]`.

- [x] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/components/communities/DiscoverCategoriesScreen.test.jsx`

Expected: FAIL because the current component is a large card deck.

- [x] **Step 3: Implement the compact rail**

Render one horizontally scrollable row of pill buttons. Each pill uses the existing category emoji and label, toggles to `all`, exposes `aria-pressed`, and keeps `min-h-11` touch height.

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run src/components/communities/DiscoverCategoriesScreen.test.jsx`

Expected: PASS.

### Task 2: Put community choice and recommendations first

**Files:**
- Modify: `src/pages/Communities.jsx`
- Create: `src/pages/Communities.iphone.contract.test.js`

**Interfaces:**
- Consumes: existing `FiveTownsRoomsHub`, `DiscoverTabContent`, query state, membership sets, navigation and mutation callbacks.
- Produces: the approved page hierarchy and real three-community recommendation path.

- [x] **Step 1: Write a failing source contract**

Assert that the source order is `community-mode-switch` before `community-search`, the main result before `community-jewish-tools`, and that `FiveTownsRoomsHub` uses `rooms.slice(0, 3)`, the heading `Recommended for you`, and a `categoryRail` between recommendations and the remaining catalog. Assert the old top-level featured card imports are gone.

- [x] **Step 2: Run the contract and verify RED**

Run: `npx vitest run src/pages/Communities.iphone.contract.test.js`

Expected: FAIL on hierarchy and old featured imports.

- [x] **Step 3: Reorder the real page**

Move the My/Discover switch directly below `DestinationHeader`, place search second, render loading or tab content next, and put Jewish Content last. Delete the duplicate top-level featured hero/secondary block while preserving the same communities in the catalog.

- [x] **Step 4: Simplify Discover hierarchy**

Change `FiveTownsRoomsHub` to show `Recommended for you`, exactly the first three current rooms, then the category rail, then `More communities`. Pass the compact category rail through `DiscoverTabContent`; when a filter is active, keep the rail above filtered results.

- [x] **Step 5: Run focused tests**

Run: `npx vitest run src/pages/Communities.iphone.contract.test.js src/components/communities/DiscoverCategoriesScreen.test.jsx src/components/communities/CommunitiesLoadingRecovery.test.jsx`

Expected: PASS.

### Task 3: Roadmap, complete verification, and release

**Files:**
- Modify: `internal/roadmap.js`
- Verify: all Task 1–2 files.

**Interfaces:**
- Consumes: completed UI and tests.
- Produces: accurate roadmap progress, GitHub PR, Vercel deployment, and live iPhone evidence.

- [x] **Step 1: Update the existing redesign roadmap item**

Add a dated Communities iPhone progress note to `screen-by-screen-world-class-redesign`; do not create a duplicate item.

- [ ] **Step 2: Run all repository checks**

Run: `npm test -- --run && npm run lint && npm run typecheck && npm run check-prompts && npm run check-style && npm run check-jewish-hub && npm run build && git diff --check`

Expected: all pass.

- [ ] **Step 3: Verify the local iPhone route**

At 390 × 844, test My Communities, Discover, category filtering, opening a room, joining behavior, Create, recovery rendering, no horizontal page overflow, no bottom-nav overlap, and no console errors.

- [ ] **Step 4: Commit and publish**

Commit intentionally on `codex/communities-iphone-focus`, push it to GitHub, and open a pull request into `main`.

- [ ] **Step 5: Deploy and verify production**

After Vercel preview passes, merge the PR, wait for production, then repeat the 390 × 844 Communities verification on `https://www.junited.us/Communities`.
