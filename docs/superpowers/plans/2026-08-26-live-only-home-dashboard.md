# Live-Only Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the personalized dashboard as JUnited Home while ensuring only real backend posts can populate its community stream and priority ranking.

**Architecture:** Preserve the existing `/Feed` route, priority stack, category deck, and post rendering. Remove the development fallback at the single point where `Feed` substitutes `DEMO_POSTS`, then delete the unused fixture so fake activity cannot return accidentally.

**Tech Stack:** React 18, React Router, Vite, Vitest, React Query, Supabase

## Global Constraints

- `/Feed` remains the main authenticated page and `/` continues to redirect there.
- Preserve the approved dashboard layout, personalization, navigation, and iPhone shell.
- Never display invented community posts or engagement as product activity.
- Real loading, error, empty, and success states must remain truthful.

---

### Task 1: Remove Fake Feed Activity

**Files:**
- Modify: `src/pages/Feed.contract.test.jsx`
- Modify: `src/pages/Feed.jsx`
- Delete: `src/lib/feed/demoPosts.js`

**Interfaces:**
- Consumes: `useFeedData()` returning the real `posts` collection and query state.
- Produces: `feedPosts`, derived only from real `posts`, for priority, category, and community-stream components.

- [ ] **Step 1: Write the failing contract test**

Add a test that reads `Feed.jsx` and asserts:

```jsx
it('uses only real backend posts on Home', () => {
  expect(source).not.toContain("import { DEMO_POSTS }");
  expect(source).not.toContain('Preview content');
  expect(source).not.toContain('Showing sample Five Towns posts');
  expect(source).not.toContain('feedSourcePosts');
  expect(source).toContain('const visiblePosts = posts.filter');
});
```

- [ ] **Step 2: Verify the new test fails**

Run:

```bash
npx vitest run src/pages/Feed.contract.test.jsx
```

Expected: FAIL because `Feed.jsx` still imports and substitutes `DEMO_POSTS`.

- [ ] **Step 3: Implement the live-only Feed**

In `Feed.jsx`:

```jsx
// Remove the DEMO_POSTS import and the development preview flag.
const feedCanRender = !isLoading || loadTimedOut;
const visiblePosts = posts.filter((post) => {
  // Preserve the existing visibility, age, block, and neighborhood filters.
});
```

Remove the preview banner and delete `src/lib/feed/demoPosts.js`. Preserve the existing community-stream condition so a successful zero-post result renders no fake section.

- [ ] **Step 4: Verify focused behavior**

Run:

```bash
npx vitest run src/pages/Feed.contract.test.jsx src/lib/appEntry.test.js
```

Expected: both files PASS and `/Feed` remains the entry route.

- [ ] **Step 5: Verify the full JUnited application**

Run:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm run check-prompts
npm run check-style
npm run check-jewish-hub
```

Expected: every command exits 0.

- [ ] **Step 6: Verify iPhone runtime behavior**

Open `/Feed` at 390 × 844 and confirm the priority dashboard and category deck remain visible, no preview banner or invented post appears, and the bottom navigation remains reachable.

- [ ] **Step 7: Commit and push**

```bash
git add docs/superpowers/plans/2026-08-26-live-only-home-dashboard.md src/pages/Feed.jsx src/pages/Feed.contract.test.jsx src/lib/feed/demoPosts.js
git commit -m "fix: remove fake Home feed activity"
git push origin codex/smart-publishing-ai-admin
```
