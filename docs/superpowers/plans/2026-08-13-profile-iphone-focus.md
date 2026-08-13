# Profile iPhone Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn JUnited's existing Profile into a compact, activity-first member identity on iPhone without removing existing profile behavior.

**Architecture:** Keep `Profile.jsx` as the data and action owner. Simplify the existing profile components, reorder existing sections, and add one focused disclosure component that groups owner-only progress content without changing its data sources or actions.

**Tech Stack:** React 18, React Router, TanStack Query, Tailwind CSS, Vitest, Vite.

## Global Constraints

- Use existing JUnited profile data and actions; do not create fake activity.
- Design and verify at 390 × 844 first.
- Preserve friend, message, share, report, block, settings, community, post, impact, and saved-post behavior.
- No database, Supabase policy, or migration changes.
- New primary touch controls must be at least 44 pixels tall.
- The page must not overflow horizontally.

---

### Task 1: Lock the Profile hierarchy

**Files:**
- Create: `src/pages/Profile.iphone.contract.test.js`
- Modify: `src/pages/Profile.jsx`

**Interfaces:**
- Consumes: existing `ModernProfileHeader`, `ModernStatsRow`, `ModernActionButtons`, `RecentPostsSection`, and `CommunitiesSection` props and handlers.
- Produces: `data-testid="profile-identity"`, `profile-recent-posts`, `profile-communities`, and `profile-progress` in that source order.

- [ ] **Step 1: Write the failing source contract**

Assert the four test IDs exist in the required order, the progress content remains owner-only, and all other-member relationship handlers are still passed into `ModernActionButtons`.

- [ ] **Step 2: Run the contract to verify it fails**

Run: `npx vitest run src/pages/Profile.iphone.contract.test.js`

Expected: FAIL because the hierarchy test IDs and progress disclosure do not exist.

- [ ] **Step 3: Reorder the existing sections**

Keep identity first, move `RecentPostsSection` directly beneath it, move `CommunitiesSection` next, and group owner-only progress content last. Preserve existing scroll target IDs.

- [ ] **Step 4: Run the contract to verify it passes**

Run: `npx vitest run src/pages/Profile.iphone.contract.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Profile.jsx src/pages/Profile.iphone.contract.test.js
git commit -m "refactor: focus Profile on member activity"
```

### Task 2: Build the compact member identity

**Files:**
- Modify: `src/components/profile/ModernProfileHeader.jsx`
- Modify: `src/components/profile/ModernStatsRow.jsx`
- Modify: `src/components/profile/ModernActionButtons.jsx`
- Modify: `src/pages/Profile.iphone.contract.test.js`

**Interfaces:**
- Consumes: the same public component props currently supplied by `Profile.jsx`.
- Produces: a cover-free member header and one compact four-item stats row with the same click handlers.

- [ ] **Step 1: Add failing compact-layout assertions**

Assert `ModernProfileHeader.jsx` no longer contains `FALLBACK_COVER_IMAGE`, `PATTERN_OVERLAY`, or the 112-pixel cover; assert the stats row keeps Friends, Communities, Posts, and Impact but removes tier progress markup; assert own-profile action labels remain.

- [ ] **Step 2: Run the contract to verify it fails**

Run: `npx vitest run src/pages/Profile.iphone.contract.test.js`

Expected: FAIL on the old cover and tall stats details.

- [ ] **Step 3: Simplify the member card**

Render the avatar beside name and username, followed by bio and compact location/member metadata. Retain verification, teen, streak, community, and other-member activity labels only when their existing data is present.

- [ ] **Step 4: Simplify stats and actions**

Render the four statistics as quiet equal-width buttons with 44-pixel minimum height and their existing handlers. Keep Edit Profile / Find friends and all other-member relationship actions unchanged, while tightening spacing for iPhone.

- [ ] **Step 5: Run focused tests and lint**

Run: `npx vitest run src/pages/Profile.iphone.contract.test.js && npm run lint`

Expected: PASS with zero lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/profile/ModernProfileHeader.jsx src/components/profile/ModernStatsRow.jsx src/components/profile/ModernActionButtons.jsx src/pages/Profile.iphone.contract.test.js
git commit -m "feat: create compact iPhone member card"
```

### Task 3: Group owner tools under Your progress

**Files:**
- Create: `src/components/profile/ProfileProgressSection.jsx`
- Modify: `src/pages/Profile.jsx`
- Modify: `src/components/profile/RecentPostsSection.jsx`
- Modify: `src/pages/Profile.iphone.contract.test.js`
- Modify: `internal/roadmap.js`

**Interfaces:**
- Consumes: React children containing the existing owner-only progress sections.
- Produces: `ProfileProgressSection({ children })`, a closed-by-default disclosure with `aria-expanded`, plus a correct own/other-profile empty post action.

- [ ] **Step 1: Add failing disclosure and empty-state assertions**

Assert `ProfileProgressSection` owns an `open` boolean initialized to false, exposes `aria-expanded`, and renders its children only when open. Assert `RecentPostsSection` gates “Write your first post” behind `isOwnProfile`.

- [ ] **Step 2: Run the contract to verify it fails**

Run: `npx vitest run src/pages/Profile.iphone.contract.test.js`

Expected: FAIL because the disclosure is missing and another member's empty profile currently shows the owner's post action.

- [ ] **Step 3: Implement Your progress**

Create a focused button-and-panel component with a 44-pixel touch target, visible expanded state, and no fake totals. Wrap the existing Streak, Interests, Impact/Get Started, Badges, Mitzvah Journey, and Saved Posts sections with it on own profiles only.

- [ ] **Step 4: Correct the empty-post action**

Show “Write your first post” only when `isOwnProfile` is true. For another member, show only “Nothing shared yet.” Keep post navigation unchanged.

- [ ] **Step 5: Update the existing screen-by-screen roadmap item**

Add a concise Profile progress note to `screen-by-screen-world-class-redesign`. Do not create a duplicate roadmap item.

- [ ] **Step 6: Run focused tests**

Run: `npx vitest run src/pages/Profile.iphone.contract.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/profile/ProfileProgressSection.jsx src/components/profile/RecentPostsSection.jsx src/pages/Profile.jsx src/pages/Profile.iphone.contract.test.js internal/roadmap.js
git commit -m "feat: organize private Profile progress"
```

### Task 4: Verify, release, and check production

**Files:**
- Modify only if verification finds a defect in files already in scope.

**Interfaces:**
- Consumes: the finished Profile implementation.
- Produces: passing repository checks, a merged GitHub PR, and a live verified `https://www.junited.us/Profile`.

- [ ] **Step 1: Run full repository checks**

Run: `npm test -- --run && npm run lint && npm run typecheck && npm run check-prompts && npm run check-style && npm run check-jewish-hub && npm run build && git diff --check`

Expected: all checks pass.

- [ ] **Step 2: Verify phone and responsive behavior**

Inspect `/Profile` at 390 × 844, 768, 1024, and 1440. At 390 × 844, verify settings/share, stats scroll targets, progress expand/collapse, post action, and no page overflow.

- [ ] **Step 3: Publish through GitHub**

Push `codex/profile-iphone-focus`, create a PR to `main`, wait for Vercel checks, and merge only after they pass.

- [ ] **Step 4: Verify the real live site**

Reload `https://www.junited.us/Profile` at 390 × 844. Confirm compact identity, recent posts before communities, closed progress section, page width 390, and no browser errors.
