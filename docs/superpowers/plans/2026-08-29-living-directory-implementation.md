# Living Five Towns Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved option-1 visual treatment to the existing Five Towns directory without changing the approved Home dashboard or weakening source integrity.

**Architecture:** Keep `FiveTownsDirectory` as the full-screen directory controller. Add declarative intent definitions and filtering helpers to the existing directory library, then add two focused presentation components for intent chips/category cards and featured listing rails. Existing listing cards remain the source of detail, map, kosher-source, and correction actions.

**Tech Stack:** React 18, Vite 6, Tailwind CSS, Lucide React, Vitest, React server rendering tests

## Global Constraints

- `/Feed` remains the approved Five Towns dashboard.
- Optimize for a 390-pixel iPhone viewport and safe-area spacing.
- Keep every current sourced listing, photo, map link, correction control, filter, and listing detail.
- Never invent reviews, ratings, popularity, operating hours, open-now claims, or community activity.
- Counts use “sourced places” or “listings,” not “verified options,” unless an explicit current verification source exists.
- Intent shortcuts are real filters over existing listings.

---

## File structure

- `src/lib/directory/fiveTownsDirectory.js`: owns directory groups, intent definitions, filters, and featured selection.
- `src/lib/directory/fiveTownsDirectory.test.js`: proves intent matching uses real listing metadata and remains source-safe.
- `src/components/home/DirectoryIntentRail.jsx`: renders the touch-scroll intent shortcuts.
- `src/components/home/DirectoryFeaturedRail.jsx`: renders sourced, photo-backed starting points.
- `src/components/home/FiveTownsDirectory.jsx`: controls root, group, category, town, query, intent, and selected-listing states.
- `src/components/home/FiveTownsDirectory.test.jsx`: verifies the approved copy, categories, shortcuts, rails, and existing actions.

### Task 1: Real intent filtering

**Files:**
- Modify: `src/lib/directory/fiveTownsDirectory.js`
- Test: `src/lib/directory/fiveTownsDirectory.test.js`

**Interfaces:**
- Produces: `DIRECTORY_INTENTS: Array<{ id, label, groupIds, categoryIds, tags, queryTerms }>`
- Produces: `filterListingsByIntent(listings, intentId): Listing[]`
- Consumes: normalized `Listing` records already exported as `FIVE_TOWNS_LISTINGS`

- [ ] **Step 1: Write the failing intent tests**

Add tests that import `DIRECTORY_INTENTS` and `filterListingsByIntent`, assert the exact initial labels `Dinner tonight`, `Kids`, `Coffee`, and `Shabbat shopping`, and assert every returned item is one of the supplied sample listings and matches a declared group, category, tag, or query term. Include a missing-intent assertion that returns the original array unchanged.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: FAIL because `DIRECTORY_INTENTS` and `filterListingsByIntent` are not exported.

- [ ] **Step 3: Add the intent definitions and matcher**

Implement four declarative objects. Match case-insensitively against `groupId`, `categoryId`, `tags`, `name`, `description`, and `whyGo`. Return only existing objects; do not clone, synthesize, or score fake results. Return the input list for an empty or unknown intent.

- [ ] **Step 4: Run the focused test and confirm success**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: PASS with all current directory tests plus the new intent cases.

- [ ] **Step 5: Commit the intent layer**

```bash
git add src/lib/directory/fiveTownsDirectory.js src/lib/directory/fiveTownsDirectory.test.js
git commit -m "feat: add real directory intent filters"
```

### Task 2: Living directory root

**Files:**
- Create: `src/components/home/DirectoryIntentRail.jsx`
- Create: `src/components/home/DirectoryFeaturedRail.jsx`
- Modify: `src/components/home/FiveTownsDirectory.jsx`
- Test: `src/components/home/FiveTownsDirectory.test.jsx`

**Interfaces:**
- Consumes: `DIRECTORY_INTENTS`, `DIRECTORY_GROUPS`, `featuredDirectoryListings`
- Produces: `DirectoryIntentRail({ intents, activeIntentId, onSelect })`
- Produces: `DirectoryFeaturedRail({ title, listings, onOpen })`

- [ ] **Step 1: Write failing presentation tests**

Extend the static-render test to expect the four intent labels, `Good starting points`, all eight category descriptions, `sourced places`, and the absence of `verified options`. Keep assertions for all eight group labels.

- [ ] **Step 2: Run the component test and confirm failure**

Run: `npm test -- src/components/home/FiveTownsDirectory.test.jsx`

Expected: FAIL because the new shortcuts, rail, and sourcing copy are not rendered.

- [ ] **Step 3: Build the intent rail**

Create a horizontal, snap-enabled button rail. Use `min-h-11`, `shrink-0`, rounded pills, a blue selected state, and `aria-pressed`. Calls to `onSelect(intent.id)` are the only behavior.

- [ ] **Step 4: Build the sourced featured rail**

Create a horizontal rail that renders only supplied listings. Each card uses `listing.imageUrl` when present, otherwise a neutral category fallback; displays `listing.name`, `listing.whyGo`, and a source-safe tag; and calls `onOpen(listing)`.

- [ ] **Step 5: Apply option-1 category styling**

Update the directory root to render the intent rail, two-column tinted category cards, the group description, and the `Good starting points` rail. Preserve the existing fixed iPhone shell, header, search, back, and close behaviors. Change `{count} verified options` to `{count} sourced places`.

- [ ] **Step 6: Run the component test and confirm success**

Run: `npm test -- src/components/home/FiveTownsDirectory.test.jsx`

Expected: PASS, including the existing source, correction, map, kosher, and direct-listing assertions.

- [ ] **Step 7: Commit the root redesign**

```bash
git add src/components/home/DirectoryIntentRail.jsx src/components/home/DirectoryFeaturedRail.jsx src/components/home/FiveTownsDirectory.jsx src/components/home/FiveTownsDirectory.test.jsx
git commit -m "feat: bring the Five Towns directory to life"
```

### Task 3: Useful category results

**Files:**
- Modify: `src/components/home/FiveTownsDirectory.jsx`
- Modify: `src/components/home/FiveTownsDirectory.test.jsx`

**Interfaces:**
- Consumes: `filterListingsByIntent`, `featuredDirectoryListings`, current group/category/town/query state
- Produces: one final `results` array passed to existing `DirectoryListingCard` components

- [ ] **Step 1: Write failing group-view tests**

Render with `initialGroupId="food"` and assert `Good for dinner`, `Quick and casual`, `Shabbat shopping`, subcategory chips, town filtering copy, `Google`, `Apple`, `Waze`, `Source`, and `Report a correction` remain present.

- [ ] **Step 2: Run the component test and confirm failure**

Run: `npm test -- src/components/home/FiveTownsDirectory.test.jsx`

Expected: FAIL on the new group-view shortcut labels.

- [ ] **Step 3: Add category shortcut and photo rails**

Derive group-relevant shortcuts from the approved intent definitions. Render a sourced featured rail above the complete results, keep subcategory and town controls directly below it, and apply intent filtering before existing group/category/town/query filters. Clearing the intent must restore the complete result set.

- [ ] **Step 4: Run directory tests**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js src/components/home/FiveTownsDirectory.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the category experience**

```bash
git add src/components/home/FiveTownsDirectory.jsx src/components/home/FiveTownsDirectory.test.jsx
git commit -m "feat: add useful directory category discovery"
```

### Task 4: Directory regression and iPhone verification

**Files:**
- Modify only if a failing check reveals a directory-owned regression.

**Interfaces:**
- Consumes: completed directory UI
- Produces: verified iPhone flow with no dashboard regressions

- [ ] **Step 1: Run all automated checks**

Run: `npm test && npm run lint && npm run typecheck && npm run build`

Expected: all commands exit 0.

- [ ] **Step 2: Run the JUnited self-check**

Follow `/Users/aryehkohn/.codex/skills/junited-self-check/SKILL.md` and resolve only issues caused by this directory change.

- [ ] **Step 3: Verify the full iPhone flow**

At a 390 × 844 viewport, open `/Feed`, confirm the dashboard layout is unchanged, open Jewish Directory, use every intent shortcut, open each category, change a town and subcategory, open a listing, and activate Google, Apple, and Waze links. Confirm no sideways page scrolling and no browser console errors.

- [ ] **Step 4: Commit any verification-only fixes**

```bash
git add src/lib/directory src/components/home
git commit -m "fix: finish iPhone directory verification"
```

