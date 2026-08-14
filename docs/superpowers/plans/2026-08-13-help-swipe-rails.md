# Help Swipe Rails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the large Help empty-state box with separate iPhone-first swipe rails for public needs and public offers.

**Architecture:** Reuse `mitzvah_requests` for both public directions with a constrained `direction` column while leaving private `mitzvah_offers` untouched. A small pure helper splits normalized requests, a focused rail component renders both directions, and the existing form/detail flows receive a direction-aware mode.

**Tech Stack:** React 18, React Query, Vite, Tailwind CSS, Vitest, Supabase Postgres.

## Global Constraints

- `mitzvah_offers` remains private response data and never supplies the public offer rail.
- Existing rows default to `direction = 'need'`.
- iPhone 390px is the primary viewport; rails use touch momentum and scroll snapping.
- No sample activity, fake counts, or fabricated urgency in production.
- Preserve existing owner, response, category, search, loading, error, and detail behavior.

---

### Task 1: Persist public request direction

**Files:**
- Create: `supabase/migrations/<generated>_add_mitzvah_request_direction.sql`
- Modify: `src/components/mitzvah/circle/shared.js`
- Test: `src/components/mitzvah/circle/shared.test.js`

**Interfaces:**
- Consumes: existing `mitzvah_requests` rows and `normalizeRequest(row)`.
- Produces: `request.direction` with exact values `need | offer`.

- [ ] Write a failing normalization test proving missing direction becomes `need` and stored `offer` remains `offer`.
- [ ] Run `npx vitest run src/components/mitzvah/circle/shared.test.js`; expect the direction assertions to fail.
- [ ] Generate the migration with `npx supabase migration new add_mitzvah_request_direction` and add a non-null defaulted checked text column.
- [ ] Update `normalizeRequest` with `direction: request.direction === 'offer' ? 'offer' : 'need'`.
- [ ] Run the focused test; expect PASS.

### Task 2: Build compact horizontal rails

**Files:**
- Create: `src/components/mitzvah/circle/HelpSwipeRails.jsx`
- Create: `src/components/mitzvah/circle/HelpSwipeRails.test.jsx`
- Modify: `src/components/mitzvah/circle/BrowseTab.jsx`

**Interfaces:**
- Consumes: normalized `browseRequests`, loading state, quick-view callback, need/offer posting callbacks.
- Produces: `HelpSwipeRails` with `Help needed` and `Help offered` sections.

- [ ] Write failing render tests for two labeled rails, direction separation, posting actions, snap scrolling, honest empty cards, and absence of private offer records.
- [ ] Run `npx vitest run src/components/mitzvah/circle/HelpSwipeRails.test.jsx`; expect FAIL because the component does not exist.
- [ ] Implement compact cards with category, title, urgency/timing, neighborhood, and one Open action; use `mobile-scroll-x`, `snap-x`, `snap-mandatory`, and card width that exposes the next card at 390px.
- [ ] Replace BrowseTab's full `RequestCard` mapping and large EmptyState with `HelpSwipeRails`; preserve the loading state and quick-view callback.
- [ ] Run the focused rail and Browse tests; expect PASS.

### Task 3: Add public Offer help creation

**Files:**
- Modify: `src/components/mitzvah/circle/CreateRequestModal.jsx`
- Modify: `src/pages/MitzvahCircle.jsx`
- Test: `src/components/mitzvah/circle/CreateRequestModal.test.jsx`
- Test: `src/pages/MitzvahCircle.contract.test.js`

**Interfaces:**
- Consumes: `openRequestForm(defaults, direction)` and existing `createRequestMutation`.
- Produces: request payload `direction`, direction-aware copy, and separate rail CTA handlers.

- [ ] Write failing tests for Need and Offer headings, prompts, submit labels, and payload direction.
- [ ] Run the focused tests; expect the new mode assertions to fail.
- [ ] Add a `direction` prop to CreateRequestModal, reset copy/state on open, and keep fields shared.
- [ ] Store `requestDirection` in MitzvahCircle, pass `direction` into request creation, and connect `Post a need` and `Offer help` buttons.
- [ ] Prevent the `I can help` private-response action on public offer cards while retaining poster controls and quick view.
- [ ] Run focused tests; expect PASS.

### Task 4: Verify and publish

**Files:**
- Modify: `internal/roadmap.js`

**Interfaces:**
- Consumes: completed feature and current redesign roadmap entry.
- Produces: truthful roadmap progress and deployed GitHub main.

- [ ] Update the existing screen-by-screen redesign roadmap progress; do not add a duplicate item.
- [ ] Run lint, all tests, typecheck, prompts, style, Jewish Hub, build, strict `no-undef`, and `git diff --check`; expect all to pass.
- [ ] Run Supabase linked dry-run and verify the migration is the only pending schema change.
- [ ] Start the local app and verify 390, 768, 1024, and 1440 widths; at 390 verify both rails, horizontal overflow only inside rails, both posting modes, and quick-view behavior.
- [ ] Commit, push, open PR, wait for checks, merge, wait for production, apply the migration through the approved repository deployment flow, and verify `https://www.junited.us/MitzvahCircle` at 390px.
