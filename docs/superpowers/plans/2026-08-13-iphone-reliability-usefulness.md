# JUnited iPhone Reliability and Usefulness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current signed-in JUnited destinations reliable and useful on iPhones without replacing existing routes or features.

**Architecture:** Add two small, stateless UI components for the Home empty state and Communities recovery state. Reuse the existing router callbacks, TanStack Query refetch function, shared responsive shell utilities, and current five-tab navigation. Keep all state in the owning pages and make the visual components independently render-testable.

**Tech Stack:** React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, Vitest, React server rendering.

## Global Constraints

- Use the current JUnited routes, data, brand, and five-tab navigation.
- Optimize and verify at 390 × 844 CSS pixels.
- Never fabricate people, posts, counts, needs, or urgency.
- Touch targets must remain at least 44 CSS pixels.
- Use `mobile-safe-bottom`; do not add page-specific fixed bottom offsets.
- Do not change the database schema.
- Preserve unrelated user edits in the main checkout.

---

### Task 1: Shared iPhone content clearance

**Files:**
- Modify: `src/pages/Feed.jsx`
- Modify: `src/pages/Communities.jsx`
- Test: `src/pages/iphoneShell.contract.test.js`

**Interfaces:**
- Consumes: existing `mobile-safe-bottom` CSS utility from `src/index.css`.
- Produces: primary Feed and Communities roots that clear the fixed bottom navigation and iOS safe area.

- [x] **Step 1: Write the failing shell contract test**

Read both page sources and assert that the rendered root class strings include `mobile-safe-bottom`, while `Layout.jsx` continues to use `app-bottom-nav`, `app-fixed-layer`, and `app-floating-stack`.

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run src/pages/iphoneShell.contract.test.js`
Expected: FAIL because Feed and Communities do not both use the shared clearance utility.

- [x] **Step 3: Apply the shared utility**

Add `mobile-safe-bottom` to the existing Feed general-root and Communities page-root class lists. Remove the Communities-only `pb-24` replacement so one shared token defines the clearance.

- [x] **Step 4: Run the focused test**

Run: `npx vitest run src/pages/iphoneShell.contract.test.js`
Expected: PASS.

### Task 2: Useful zero-activity Home actions

**Files:**
- Create: `src/components/feed/HomeStartHere.jsx`
- Create: `src/components/feed/HomeStartHere.test.jsx`
- Modify: `src/pages/Feed.jsx`
- Modify: `src/pages/Feed.contract.test.jsx`

**Interfaces:**
- Consumes: `onShare()`, `onHelp()`, `onCommunities()`, and `onDirectory()` callbacks.
- Produces: `<HomeStartHere />`, a stateless compact action group using only real JUnited actions.

- [x] **Step 1: Write failing render tests**

Assert that the component renders `Start here`, exactly four buttons, the labels `Share an update`, `Ask for help`, `Find communities`, and `Browse directory`, and no activity count.

- [x] **Step 2: Run the component test and verify it fails**

Run: `npx vitest run src/components/feed/HomeStartHere.test.jsx`
Expected: FAIL because the component does not exist.

- [x] **Step 3: Implement the component**

Build a compact two-column action grid with Lucide icons, 44px minimum targets, restrained category tinting, and direct callback buttons.

- [x] **Step 4: Wire it into the real empty Home path**

Render the action group only when `feedCanRender`, `!isError`, and `feedPosts.length === 0`. Wire share to the existing composer, Help to `/MitzvahCircle`, Communities to `/Communities`, and Directory to `/Map`.

- [x] **Step 5: Run the Home tests**

Run: `npx vitest run src/components/feed/HomeStartHere.test.jsx src/pages/Feed.contract.test.jsx`
Expected: PASS.

### Task 3: Communities loading recovery

**Files:**
- Create: `src/components/communities/CommunitiesLoadingRecovery.jsx`
- Create: `src/components/communities/CommunitiesLoadingRecovery.test.jsx`
- Modify: `src/pages/Communities.jsx`

**Interfaces:**
- Consumes: `timedOut`, `isError`, `onRetry()`, and `onGoHome()`.
- Produces: skeletons during ordinary loading and an actionable recovery panel after timeout/error.

- [x] **Step 1: Write failing recovery-state tests**

Assert that ordinary loading renders four skeleton cards without an error message. Assert that timeout and error states render `Communities are taking longer than expected`, plus enabled `Try again` and `Go home` buttons.

- [x] **Step 2: Run the focused tests and verify they fail**

Run: `npx vitest run src/components/communities/CommunitiesLoadingRecovery.test.jsx`
Expected: FAIL because the component does not exist.

- [x] **Step 3: Implement the stateless recovery component**

Use the existing card language and a calm explanation. Do not claim the network is offline unless TanStack Query reports an error.

- [x] **Step 4: Add bounded loading state to Communities**

Destructure `isError` and `refetch` from the communities query. Start a timeout only while the catalog is empty and the query is loading. Clear it when data arrives. Retry resets the timer and calls `refetch`; Home navigates to `/Feed`.

- [x] **Step 5: Run the focused tests**

Run: `npx vitest run src/components/communities/CommunitiesLoadingRecovery.test.jsx`
Expected: PASS.

### Task 4: Documentation, roadmap, and full verification

**Files:**
- Modify: `internal/roadmap.js`
- Verify: all files changed in Tasks 1–3

**Interfaces:**
- Consumes: the completed implementation and audit findings.
- Produces: an accurate roadmap progress note and release evidence.

- [x] **Step 1: Update the existing screen-by-screen redesign roadmap item**

Add a dated progress note for the iPhone reliability pass. Do not create a duplicate roadmap item; broader screen-by-screen work is already tracked.

- [x] **Step 2: Run focused and full validation**

Run:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run check-prompts
npm run check-style
npm run check-jewish-hub
npm run build
```

Expected: all commands pass.

- [x] **Step 3: Run the JUnited self-check**

Execute the repository-required self-check workflow and resolve any failures within scope.

- [x] **Step 4: Verify real iPhone paths**

At 390 × 844, verify `/Feed`, `/MitzvahCircle`, `/Communities`, `/Map`, and `/Profile`. Confirm the bottom nav does not cover final actions, Home empty actions open the real destinations, Communities timeout/error actions work, and no changed page logs console errors.

- [x] **Step 5: Commit the verified work**

Commit the implementation and documentation on `codex/iphone-reliability` with an intentional message after all evidence is green.
