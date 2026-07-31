# Single Production Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the former marketing page and publish the approved redesigned welcome as JUnited’s only signed-out front door.

**Architecture:** Keep `/` entering through the protected Feed and centralize the legacy `/welcome` redirect destination beside `APP_ENTRY_PATH`. Remove the unused `Landing` module and update the only live invite producer plus current product documentation. Release by pushing the verified `main` branch to the Vercel-linked repository and proving the public routes.

**Tech Stack:** React 18, React Router 6, Vite, Vitest, Vercel, Supabase Auth

## Global Constraints

- `/` redirects with replacement to `/Feed`.
- `/welcome` redirects with replacement to `/login` and never renders `Landing.jsx`.
- Direct `/login` keeps the approved redesigned welcome presentation.
- Protected-route `from_url` behavior remains unchanged.
- Unrelated working-tree changes under `.claude/skills/junited-self-check/` must not be modified or committed.
- Completion requires verification on `https://www.junited.us`, not only localhost.

---

### Task 1: Remove the legacy marketing entry

**Files:**
- Modify: `src/lib/appEntry.test.js`
- Modify: `src/lib/appEntry.js`
- Modify: `src/App.jsx`
- Modify: `src/pages.config.js`
- Modify: `src/components/profile/FriendsHub.jsx`
- Delete: `src/pages/Landing.jsx`

**Interfaces:**
- Produces: `LEGACY_WELCOME_REDIRECT_PATH` with the exact value `'/login'`.
- Consumes: `APP_ENTRY_PATH` and `LEGACY_WELCOME_REDIRECT_PATH` in `src/App.jsx`.

- [ ] **Step 1: Write the failing route-policy test**

Add this assertion to `src/lib/appEntry.test.js`:

```js
import { APP_ENTRY_PATH, LEGACY_WELCOME_REDIRECT_PATH } from './appEntry';

it('retires the legacy marketing route into the redesigned login welcome', () => {
  expect(LEGACY_WELCOME_REDIRECT_PATH).toBe('/login');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/appEntry.test.js`

Expected: FAIL because `LEGACY_WELCOME_REDIRECT_PATH` is not exported.

- [ ] **Step 3: Implement the route policy and remove the page**

Update `src/lib/appEntry.js`:

```js
export const APP_ENTRY_PATH = '/Feed';
export const LEGACY_WELCOME_REDIRECT_PATH = '/login';
```

In `src/App.jsx`, remove the lazy `Landing` import, import both entry constants, and replace the `/welcome` route with:

```jsx
<Route path="/welcome" element={<Navigate to={LEGACY_WELCOME_REDIRECT_PATH} replace />} />
```

Delete `src/pages/Landing.jsx`, update `src/pages.config.js` to describe the single entry policy, and change the Friends Hub invite URL suffix from `/welcome` to `/login`.

- [ ] **Step 4: Verify GREEN and absence of live Landing references**

Run:

```bash
npm test -- src/lib/appEntry.test.js src/pages/Login.test.jsx
rg -n "pages/Landing|<Landing|/welcome" src
```

Expected: focused tests pass; `/welcome` appears only as the redirect route and no `Landing` import or component remains.

- [ ] **Step 5: Update current product truth**

Update `internal/roadmap.js` and `internal/master-plan.md` so current descriptions and links no longer identify `Landing.jsx` or `/welcome` as a live marketing destination. Preserve earlier specs/plans as historical records, with the new specification explicitly superseding them.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/lib/appEntry.test.js src/lib/appEntry.js src/App.jsx src/pages.config.js src/components/profile/FriendsHub.jsx src/pages/Landing.jsx internal/roadmap.js internal/master-plan.md
git commit -m "feat: retire legacy marketing entry"
```

### Task 2: Verify and publish production

**Files:**
- No new application files.

**Interfaces:**
- Consumes: the committed single-entry route policy.
- Produces: a verified `origin/main` deployment serving the redesigned entry paths.

- [ ] **Step 1: Run all automated gates**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run check-style
npm run check-jewish-hub
npm run check-prompts
```

Expected: every command exits 0.

- [ ] **Step 2: Run the complete JUnited self-check**

Run checks 0–17 from the working-tree `.claude/skills/junited-self-check/SKILL.md`, recording any pre-existing failures separately from this change.

- [ ] **Step 3: Push the authoritative release branch**

Run: `git push origin main`

Expected: `origin/main` advances to the verified local commit and Vercel begins the linked production deployment.

- [ ] **Step 4: Verify the real production paths**

In a signed-out browser session verify:

- `https://www.junited.us/` reaches the protected Feed flow and redesigned welcome.
- `https://www.junited.us/welcome` redirects to `/login` and never renders the former marketing page.
- `https://www.junited.us/login` renders “Stay close to what matters.”
- No console errors appear on those paths.

- [ ] **Step 5: Record the shipped state**

If production verification passes, update the relevant roadmap shipped note with the deployment date and public-path evidence, commit, push, and verify that final documentation-only deployment.

