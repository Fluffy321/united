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

## ⚠️ ROADMAP MAINTENANCE RULE — READ THIS

**The roadmap file is `src/config/roadmap.js`. It is the single source of truth for JUnited feature planning.**

You MUST update `src/config/roadmap.js` in the same task whenever you:

| What you did | What to update |
|---|---|
| Shipped a feature listed in the roadmap | Change `status` to `'shipped'`, add `shippedNote` |
| Intentionally deferred a feature | Change `status` to `'deferred'`, fill in `why` |
| Removed a not-yet-built feature from scope | Change `status` to `'dropped'`, explain in `why` |
| Introduced a meaningful new feature idea | Add a new entry with `status: 'planned'` or `'deferred'` |
| Unblocked a blocked feature | Update `status`, remove or update `needs` |

Your final report for any such task **must explicitly state**:
- Whether `src/config/roadmap.js` needed updating
- If yes, what changed (which items, what status change)

The `FutureFeatures` admin page (`src/pages/FutureFeatures.jsx`) renders from this file automatically. You do not need to edit the page — only the config.

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
