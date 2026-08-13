# Me Personal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the owner-facing Me destination into the approved personal Jewish community dashboard while preserving the existing other-member profile.

**Architecture:** Keep `Profile.jsx` responsible for deciding owner versus other-member mode and for existing profile data/actions. Add focused Me components for the daily summary, personal alerts, shortcuts, and compact identity; use existing notification, zmanim, bookmark, and route services rather than new backend work.

**Tech Stack:** React 18, React Router, TanStack Query, Supabase services, Tailwind CSS, Vitest, Vite.

## Global Constraints

- Use real existing account data only; do not create fake alerts, times, plans, activity, or counts.
- Design and verify at 390 × 844 first, then 768, 1024, and 1440.
- Preserve the current other-member Profile and all relationship actions.
- No database, migration, RLS, or Supabase policy changes.
- Every new control must have an accessible name and at least a 44-pixel touch target.
- The page must not overflow horizontally or hide content behind bottom navigation.

---

### Task 1: Add personal dashboard data helpers

**Files:**
- Create: `src/lib/profile/meDashboard.js`
- Create: `src/lib/profile/meDashboard.test.js`

**Interfaces:**
- Produces: `selectNextJewishTime(zmanim, shabbatTimes, now)`, `rankPersonalAlerts(notifications, limit)`, `selectNextPersonalPlan(notifications)`, and `isUrgentPersonalAlert(notification)`.

- [ ] **Step 1: Write failing helper tests**

Cover upcoming-time selection, passed-time fallback to candle lighting, unavailable times, help/verification/message/community priority, unread-before-read ordering, three-alert limit, and urgent type classification.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/lib/profile/meDashboard.test.js`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement pure helpers**

Parse only valid dates, choose the earliest future time, preserve the original notification objects, and never manufacture deadlines or routes.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npx vitest run src/lib/profile/meDashboard.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/profile/meDashboard.js src/lib/profile/meDashboard.test.js
git commit -m "feat: derive personal Me dashboard signals"
```

### Task 2: Build the owner Me dashboard components

**Files:**
- Create: `src/components/profile/MeTodaySummary.jsx`
- Create: `src/components/profile/MePersonalAlerts.jsx`
- Create: `src/components/profile/MeShortcutGrid.jsx`
- Create: `src/components/profile/MeIdentityRow.jsx`
- Create: `src/components/profile/MeDashboard.contract.test.jsx`

**Interfaces:**
- `MeTodaySummary({ firstName, jewishTime, jewishLocation, nextPlan, onOpenJewish, onOpenPlan, isLoading, hasError })`.
- `MePersonalAlerts({ alerts, isLoading, isError, onRetry, onOpenAlert, onSeeAll })`.
- `MeShortcutGrid({ communityCount, savedCount, helpCount, onCommunities, onSaved, onHelp, onPlans })`.
- `MeIdentityRow({ user, onEdit })`.

- [ ] **Step 1: Write failing component contracts**

Assert approved headings/copy, no emoji product icons, 44-pixel controls, accessible alert markers, honest empty/error states, and callbacks on each interactive control.

- [ ] **Step 2: Run contracts and verify RED**

Run: `npx vitest run src/components/profile/MeDashboard.contract.test.jsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the four focused components**

Use Lucide icons, existing surface and motion classes, restrained JUnited blue/navy/white styling, and the exact empty/error behavior in the approved spec.

- [ ] **Step 4: Run contracts and lint**

Run: `npx vitest run src/components/profile/MeDashboard.contract.test.jsx && npm run lint`

Expected: PASS with zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/MeTodaySummary.jsx src/components/profile/MePersonalAlerts.jsx src/components/profile/MeShortcutGrid.jsx src/components/profile/MeIdentityRow.jsx src/components/profile/MeDashboard.contract.test.jsx
git commit -m "feat: build personal Me dashboard"
```

### Task 3: Integrate Me without changing public member profiles

**Files:**
- Modify: `src/pages/Profile.jsx`
- Modify: `src/components/profile/ProfileProgressSection.jsx`
- Create: `src/pages/Profile.me-dashboard.contract.test.js`
- Modify: `internal/roadmap.js`

**Interfaces:**
- Consumes: `notificationsService.listForUser`, `getNotificationRoute`, `useShabbatLocation`, `getZmanim`, `getShabbatTimes`, bookmark count, existing profile queries, and all four Me components.
- Produces: owner-only dashboard branch; unchanged other-member profile branch; `ProfileProgressSection({ children, openRequest, onOpenChange })` so Saved can expand private tools.

- [ ] **Step 1: Write the failing page contract**

Assert the owner branch contains the four dashboard components in approved order, notification/zmanim queries are owner-only, Saved opens progress, and the other-member branch still passes every relationship action.

- [ ] **Step 2: Run the page contract and verify RED**

Run: `npx vitest run src/pages/Profile.me-dashboard.contract.test.js`

Expected: FAIL because Profile does not have the owner dashboard branch.

- [ ] **Step 3: Add owner-only data queries**

Load at most 20 notifications, today's zmanim, Shabbat times, and bookmark count only when `isOwnProfile` and the user ID are available. Keep query errors local to their card.

- [ ] **Step 4: Render the approved owner dashboard**

Render summary, alerts, shortcuts, compact identity, and private tools. Route settings/edit, alert rows, Communities, Mitzvah Circle, Search events, Notifications, and Jewish Hub to their current live destinations.

- [ ] **Step 5: Preserve the other-member profile branch**

Keep `ModernProfileHeader`, `ModernStatsRow`, `ModernActionButtons`, Recent Posts, Communities, and all friend/message/share/report/block callbacks for non-owner profiles.

- [ ] **Step 6: Make Saved open private tools**

Extend `ProfileProgressSection` with a controlled open request while keeping its default closed behavior and accessibility attributes.

- [ ] **Step 7: Update the existing redesign roadmap item**

Replace the earlier Profile progress sentence with a truthful note that the owner Me dashboard is implemented on this branch and other-member profiles are preserved.

- [ ] **Step 8: Run focused tests**

Run: `npx vitest run src/lib/profile/meDashboard.test.js src/components/profile/MeDashboard.contract.test.jsx src/pages/Profile.me-dashboard.contract.test.js`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/pages/Profile.jsx src/components/profile/ProfileProgressSection.jsx src/pages/Profile.me-dashboard.contract.test.js internal/roadmap.js
git commit -m "feat: make Me a personal dashboard"
```

### Task 4: Verify, publish, and check production

**Files:**
- Modify only if verification finds a defect in files already in scope.

**Interfaces:**
- Consumes: completed Me dashboard.
- Produces: passing repository checks, merged GitHub PR, and live verified `/Profile`.

- [ ] **Step 1: Run repository checks**

Run: `npm test -- --run && npm run lint && npm run typecheck && npm run check-prompts && npm run check-style && npm run check-jewish-hub && npm run build && git diff --check`

Expected: all checks pass.

- [ ] **Step 2: Verify browser behavior**

At 390 × 844, verify settings, Jewish time, plan/empty plan, alert row, See all, all four shortcuts, Edit, Saved disclosure, another-member profile, and no overflow/errors. Repeat overflow checks at 768, 1024, and 1440.

- [ ] **Step 3: Publish through GitHub**

Push `codex/me-personal-dashboard`, open a PR to `main`, wait for Vercel, and merge only after checks pass.

- [ ] **Step 4: Verify production**

Reload `https://www.junited.us/Profile` at 390 × 844 and confirm the owner dashboard, real data states, exact width, and empty browser errors.
