# Directory iPhone-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make business search the default, first-screen experience of JUnited's Directory on iPhone while preserving the existing Community Map and business workflows.

**Architecture:** Keep `/Map` and its existing `MapPage`, `BusinessDirectoryExperience`, and `CommunityMapExperience` boundaries. Change only the initial view and the presentation/order inside `BusinessDirectoryExperience`; add source-level contract tests that lock the hierarchy and existing behavior without introducing new data or backend work.

**Tech Stack:** React 18, React Router, TanStack Query, Tailwind CSS, Vitest, Vite.

## Global Constraints

- Use the existing JUnited code and data; do not create fake listings.
- Design and verify at 390 × 844 first.
- Preserve all current business search, filter, map, details, submission, claim, owner, verification, and Community Map behavior.
- No database, Supabase policy, or migration changes.
- New touch controls must be at least 44 pixels tall and expose pressed state.
- The page itself must not overflow horizontally.

---

### Task 1: Lock the Directory hierarchy and default view

**Files:**
- Create: `src/pages/Map.iphone.contract.test.js`
- Modify: `src/pages/Map.jsx`

**Interfaces:**
- Consumes: `MapPage`, `BusinessDirectoryExperience`, `CommunityMapExperience`, and existing `switchView(view)` behavior in `src/pages/Map.jsx`.
- Produces: `/Map` initializes `activeView` to `businesses`; the Businesses / Community Map switch still calls `switchView` with the same values.

- [ ] **Step 1: Write the failing default-view contract**

Create a source contract test that reads `Map.jsx` and asserts `useState('businesses')`, the existing `switchView('businesses')` and `switchView('community')` calls, and both experience components remain present.

- [ ] **Step 2: Run the contract to verify it fails**

Run: `npx vitest run src/pages/Map.iphone.contract.test.js`

Expected: FAIL because `activeView` currently initializes to `community`.

- [ ] **Step 3: Change the default view only**

Change `const [activeView, setActiveView] = useState('community')` to `useState('businesses')`. Do not change the `view` URL parameter behavior or `switchView` implementation.

- [ ] **Step 4: Run the contract to verify it passes**

Run: `npx vitest run src/pages/Map.iphone.contract.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Map.jsx src/pages/Map.iphone.contract.test.js
git commit -m "feat: open Directory to business search"
```

### Task 2: Put search and compact categories first

**Files:**
- Modify: `src/pages/Map.jsx`
- Modify: `src/pages/Map.iphone.contract.test.js`

**Interfaces:**
- Consumes: existing `search`, `category`, `type`, `mode`, `BUSINESS_CATEGORIES`, `LISTING_TYPES`, and their setters.
- Produces: `data-testid="directory-search"`, `data-testid="directory-categories"`, and `data-testid="directory-results"` in that source order.

- [ ] **Step 1: Add failing hierarchy and removed-hero assertions**

Assert search appears before categories and results; assert the old `Support Jewish` hero, `Listed`, `Verified`, and `Online` statistic labels are absent from `BusinessDirectoryExperience`; assert category buttons include `min-h-11` and `aria-pressed`.

- [ ] **Step 2: Run the contract to verify it fails**

Run: `npx vitest run src/pages/Map.iphone.contract.test.js`

Expected: FAIL on missing test IDs, old hero copy, and category touch-state requirements.

- [ ] **Step 3: Replace the hero and category grid**

Remove the dark promotional hero and statistics. Add a compact intro row with “Find something nearby” and a secondary `List a Business` button. Move the existing search toolbar directly beneath it. Render categories as a labeled horizontal `mobile-scroll-x` rail of pill buttons; keep the existing category keys, icons, colors, and setter.

- [ ] **Step 4: Keep advanced filters compact**

Keep the existing listing-type and List / Map controls below search in the same toolbar. Give each interactive button `min-h-11`, `aria-pressed`, and readable labels; do not remove any filter or mode.

- [ ] **Step 5: Run the contract and lint**

Run: `npx vitest run src/pages/Map.iphone.contract.test.js && npm run lint`

Expected: PASS with zero lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Map.jsx src/pages/Map.iphone.contract.test.js
git commit -m "feat: focus Directory search for iPhone"
```

### Task 3: Make empty and filtered states honest

**Files:**
- Modify: `src/pages/Map.jsx`
- Modify: `src/pages/Map.iphone.contract.test.js`
- Modify: `internal/roadmap.js`

**Interfaces:**
- Consumes: raw `businesses`, `filteredBusinesses`, `category`, `search`, and `type` state.
- Produces: distinct zero-directory and filtered-no-match messages plus one reset action for the filtered state.

- [ ] **Step 1: Add failing state assertions**

Assert `businesses.length === 0` has dedicated copy, filtered no-results has different copy, and a reset handler returns `category`, `search`, and `type` to their defaults.

- [ ] **Step 2: Run the contract to verify it fails**

Run: `npx vitest run src/pages/Map.iphone.contract.test.js`

Expected: FAIL because both situations currently share one empty state.

- [ ] **Step 3: Implement the two states**

When `businesses.length === 0`, show “The directory is getting started” and one `List a Business` button. When approved listings exist but filters return none, show “No matches for these filters” and a `Clear filters` button that restores `category='all'`, `search=''`, and `type='all'`.

- [ ] **Step 4: Update the existing screen-by-screen roadmap item**

Add a concise progress note to `screen-by-screen-world-class-redesign` describing this Directory iPhone pass. Do not create a duplicate roadmap item.

- [ ] **Step 5: Run focused tests**

Run: `npx vitest run src/pages/Map.iphone.contract.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Map.jsx src/pages/Map.iphone.contract.test.js internal/roadmap.js
git commit -m "fix: keep Directory empty states honest"
```

### Task 4: Verify, release, and check production

**Files:**
- Modify only if verification finds a defect in files already in scope.

**Interfaces:**
- Consumes: the finished Directory implementation.
- Produces: passing repository checks, a merged GitHub PR, and a live verified `https://www.junited.us/Map`.

- [ ] **Step 1: Run full repository checks**

Run: `npm test -- --run && npm run lint && npm run typecheck && npm run check-prompts && npm run check-style && npm run check-jewish-hub && npm run build && git diff --check`

Expected: all checks pass.

- [ ] **Step 2: Verify phone and responsive behavior**

Run the local app and inspect `/Map` at 390 × 844, 768, 1024, and 1440. Confirm no page overflow. At 390 × 844, test Businesses default, search input, category selection, List / Map mode, List a Business modal, Community Map switch, and return to Businesses.

- [ ] **Step 3: Publish through GitHub**

Push `codex/directory-iphone-first`, create a PR to `main`, wait for Vercel checks, and merge only after they pass.

- [ ] **Step 4: Verify the real live site**

Reload `https://www.junited.us/Map` at 390 × 844. Confirm Businesses opens first, search/categories fit, the Community Map remains available, page width is 390, and browser errors are empty.
