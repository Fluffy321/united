# JUnited — Development Instructions for Claude Code

This file is loaded automatically by Claude Code at the start of every session.
Read it fully before starting any task.

---

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Radix UI, React Router v6
- **Data fetching**: TanStack Query (React Query)
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage)
- **Auth bridge**: `src/api/base44Client.js` is a compatibility shim — new code should call `src/api/supabaseClient.js` and `src/services/` directly
- **Email**: Resend (transactional), configured in Supabase Edge Functions
- **Payments**: Stripe (not yet live — see roadmap)

---

## ⚠️ ROADMAP MAINTENANCE — TWO-PART RULE — READ THIS

**The roadmap file is `src/config/roadmap.js`. It is the single source of truth for JUnited feature planning.**
**`src/pages/FutureFeatures.jsx` renders it automatically — only edit the config, never the page.**

---

### Part A — Status updates for work you completed

You MUST update `src/config/roadmap.js` in the same task whenever you:

| What you did | What to update |
|---|---|
| Shipped a feature listed in the roadmap | Change `status` to `'shipped'`, add `shippedNote` |
| Intentionally deferred a feature | Change `status` to `'deferred'`, fill in `why` |
| Removed a not-yet-built feature from scope | Change `status` to `'dropped'`, explain in `why` |
| Introduced a meaningful new feature idea | Add a new entry with `status: 'planned'` or `'deferred'` |
| Unblocked a blocked feature | Update `status`, remove or update `needs` |

---

### Part B — Future-improvements scan (required after applicable tasks)

**Before writing the final report** on any feature implementation, significant bug fix, redesign, architecture or readiness audit, admin tool addition, or any task that surfaces recommendations or deferred work — you must perform a roadmap future-improvements scan:

1. Review the session for anything that qualifies as future work:
   - future improvements mentioned or implied during the task
   - deferred enhancements ("we could also…", "a nice follow-up would be…")
   - gaps or limitations discovered during an audit
   - follow-up features that would naturally build on what was just shipped
   - recommended next steps
2. Open `src/config/roadmap.js` and for each candidate determine:
   - **Already tracked** → no action; note it in the report
   - **Belongs under an existing item** → merge or update the existing entry
   - **Deserves its own entry** → add it with `status: 'planned'` or `'deferred'` and a `why`
   - **Too trivial or already obvious from the code** → skip it, but explain the decision in the report
3. Update the roadmap, then report what you did.

**This scan runs after applicable tasks automatically.** For on-demand use, invoke the `/roadmap-future-improvements-scan` skill.

**Do not list meaningful future improvements in a final report without first reviewing the roadmap.**
This scan does NOT need to run after trivial changes (one-line copy edits, import fixes, etc.) unless future work is actually surfaced.

---

### Final report requirement

Every applicable final report **must** include a roadmap scan section in this format:

```
Roadmap future-improvements scan:
- Added: <item name> — <why it was added>
- Updated: <item name> — <what changed>
- Not added, with reason: <idea> — <why it wasn't tracked>
```

If nothing was found:

```
Roadmap future-improvements scan:
- No new roadmap-worthy future improvements identified.
```

Do not omit this section from applicable final reports, even if the result is "nothing found." A missing section reads as skipped work, not as a clean scan.

---

## Key Architectural Rules

### Authentication
- Auth state lives in `src/lib/AuthContext.jsx`. Use `useAuth()` hook.
- Protected routes wrap with `<ProtectedRoute />`. Admin-only routes use `<AdminRoute />`.
- Supabase OAuth redirect URL helper: `getAuthRedirectUrl()` in `src/api/supabaseClient.js`.
- New OAuth users land on `OnboardingFlow` because `onboarding_complete` defaults to false.

### Data Access
- Use `dataService` from `src/services/` for all entity reads/writes.
- Entity tables are mapped in `src/api/base44Client.js` under `SUPABASE_ENTITY_TABLES`.
- For direct Supabase queries (joins, RPCs), import `supabase` from `src/api/supabaseClient.js`.
- React Query keys follow the pattern `['entity-name', id]`. Invalidate after mutations.

### Community modules
- `allow_resources`, `allow_group_chat`, `allow_member_events`, `allow_member_listings` are columns on `communities`.
- `getSupportedCommunityTabs()` in `src/lib/communityTypes.js` computes visible tabs from these flags.
- The Community Admin Center (`CommunityAdminCenter.jsx`) is the UI for toggling these.

### Migrations
- All schema changes go in `supabase/migrations/` as timestamped SQL files.
- Run `npx supabase db push --linked --dry-run` before pushing to verify.
- After applying via MCP `apply_migration`, check that the local filename timestamp matches what was recorded remotely (`npx supabase migration list --linked`). Rename the local file if there is a mismatch.

### Routes
- Disabled/future pages use `<Navigate to={mainPagePath} replace />` in `App.jsx` rather than being deleted.
- Re-enabling a page = remove the redirect, add the real `<Route>`, add it to `pages.config.js`.

### Responsive App Shell
- Use the shared layout utilities in `src/index.css`: `mobile-page`, `mobile-page-wide`, `mobile-safe-bottom`, `app-fixed-layer`, `app-fixed-frame`, and `app-floating-stack`.
- Do not hardcode new fixed button offsets such as `bottom: calc(144px + env(safe-area-inset-bottom))`.
- Page-level floating buttons should register through `FloatingActionsContext` so global actions like Feedback and page actions like Feed Create Post share one safe, responsive stack.

---

## What to Test After Changes

After any significant change, verify:
- [ ] Login (email + password)
- [ ] Google Sign-In
- [ ] Communities page loads, community detail opens
- [ ] Feed loads and shows posts
- [ ] Messages page opens
- [ ] Settings page opens and saves
- [ ] No console errors on the pages you changed

Run before committing:
```bash
npm run lint
npm run build
```

---

## Deployment

- Production URL: `https://www.junited.us`
- `VITE_AUTH_REDIRECT_URL` must be set to `https://www.junited.us/login` in production env.
- Supabase project ID: `uwbmfmtvjcnuuekiyogu`
- After pushing migrations: `npx supabase db push --linked`
- After code changes: push to `main` and trigger the hosting provider deploy.

---

## File Reference

| Purpose | File |
|---|---|
| Product roadmap | `src/config/roadmap.js` |
| Roadmap UI | `src/pages/FutureFeatures.jsx` |
| Auth context | `src/lib/AuthContext.jsx` |
| Community types / tab logic | `src/lib/communityTypes.js` |
| Supabase client + auth helpers | `src/api/supabaseClient.js` |
| Entity / data service bridge | `src/api/base44Client.js` |
| App routing | `src/App.jsx` |
| Page registry | `src/pages.config.js` |
| DB migrations | `supabase/migrations/` |
