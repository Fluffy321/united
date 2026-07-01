# JUnited — Development Instructions for Claude Code

This file is loaded automatically by Claude Code at the start of every session.
Read it fully before starting any task.

---

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Radix UI, React Router v6
- **Data fetching**: TanStack Query (React Query)
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage)
- **Data services**: named operations in `src/services/entityServices.js` provide the app's Supabase entity access
- **Email**: Resend (transactional), configured in Supabase Edge Functions
- **Payments**: Stripe (not yet live — see roadmap)

---

## ⚠️ ROADMAP MAINTENANCE — TWO-PART RULE — READ THIS

**The roadmap file is `internal/roadmap.js`. It is the single source of truth for JUnited feature planning.**
**`src/pages/AdminRoadmap.jsx` renders it automatically — only edit the config, never the page.**

---

### ⛔ Real UI Path Verification — REQUIRED before marking any visible feature SHIPPED

**Before changing status to `'shipped'` for any feature that adds, moves, or modifies visible UI:**

You MUST verify the feature is reachable through the real user-facing path, not just that the code compiles. Failure to do this has caused repeated false "shipped" entries.

Checklist (run mentally before writing `status: STATUS.SHIPPED`):

1. **Which route renders this feature?** Trace from `App.jsx` → page component → the component you edited.
2. **Is that the component that's actually mounted?** Confirm the import chain. Look for legacy duplicate components (e.g., `CommunityHubDetail` vs `CommunityDetailView`) that might shadow your changes.
3. **What conditions must be true for it to appear?** (auth, plan, data, state flags, tab selection)
4. **If it's inside a tab or modal, can you reach it?** Name the exact button/action the user must click.

**Do not mark shipped based on:**
- The feature compiling and building cleanly
- The component existing in code
- A grep or bundle check
- The fact that you wrote it

**Mark shipped only if you can complete this sentence:**  
*"A logged-in user can see [feature] by going to [exact path] and [clicking/tapping X]."*

---

### Part A — Status updates for work you completed

You MUST update `internal/roadmap.js` in the same task whenever you:

| What you did | What to update |
|---|---|
| Shipped a feature listed in the roadmap | Change `status` to `'shipped'`, add `shippedNote` |
| Intentionally deferred a feature | Change `status` to `'deferred'`, fill in `why` |
| Removed a not-yet-built feature from scope | Change `status` to `'dropped'`, explain in `why` |
| Introduced a meaningful new feature idea | Add a new entry with `status: 'planned'` or `'deferred'` |
| Unblocked a blocked feature | Update `status`, remove or update `needs` |

---

### Prompt field rule — REQUIRED for AI-implementable items

The `prompt` field in each roadmap entry powers the **Copy Prompt** button in `/AdminRoadmap`. When present, admins can one-click-copy it into Claude Code or Codex to implement the feature. When absent, the button silently disappears — the entry becomes actionable only by someone who writes the prompt from scratch.

**Any new roadmap entry that an AI agent could reasonably implement MUST include a `prompt` field.** This applies equally whether the entry is `planned`, `deferred`, `exploring`, or `blocked`.

**Prompt format:**
```
prompt: `You are implementing X for JUnited.

Context: <point to the exact files, migrations, and existing code that are relevant>

Goals:
1. <specific, ordered implementation steps>
N. Update internal/roadmap.js: change this item's status to 'shipped'.`
```

**When a prompt MAY be omitted:**
- The item is purely manual (e.g., "set up App Store Connect account", "configure billing")
- No code needs to be written at all
- If omitting, you MUST add an explanatory comment in the entry's `why` or `description` field

**Do not add incomplete shells.** A new entry without a prompt is not a complete entry — it is a placeholder that will silently break the AdminRoadmap UI. Write the prompt at the same time as the entry.

Run `npm run check-prompts` to verify all applicable entries have prompts.

---

### Part B — Future-improvements scan (required after applicable tasks)

**Before writing the final report** on any feature implementation, significant bug fix, redesign, architecture or readiness audit, admin tool addition, or any task that surfaces recommendations or deferred work — you must perform a roadmap future-improvements scan:

1. Review the session for anything that qualifies as future work:
   - future improvements mentioned or implied during the task
   - deferred enhancements ("we could also…", "a nice follow-up would be…")
   - gaps or limitations discovered during an audit
   - follow-up features that would naturally build on what was just shipped
   - recommended next steps
2. Open `internal/roadmap.js` and for each candidate determine:
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
- Use named functions from `src/services/` for all entity reads and writes.
- Entity tables and shared query behavior live in `src/services/supabaseRepository.js`.
- For direct Supabase queries (joins, RPCs), import `supabase` from `src/api/supabaseClient.js`.
- React Query keys follow the pattern `['entity-name', id]`. Invalidate after mutations.

#### When direct `supabase` calls are acceptable (exceptions to the dataService rule)

Direct `supabase.from()` / `supabase.rpc()` calls outside of `src/services/` are acceptable **only** in these cases:

| Case | Example | Why |
|---|---|---|
| RPC calls with custom business logic | `supabase.rpc('vote_on_community_deletion', ...)` | No equivalent in dataService entity API |
| Multi-table joins in a single query | `supabase.from('x').select('*, y(*)')` | dataService doesn't support nested selects |
| Admin-only moderation endpoints | `supabase.rpc('approve_business_listing', ...)` | Admin surfaces with separate access patterns |
| Storage uploads | `supabase.storage.from(...).upload(...)` | Storage API not wrapped in dataService |
| Auth-level operations in service files | `supabase.auth.getUser()` | Auth calls belong at the service layer |

**Do not** add direct calls for basic CRUD in components. Add or reuse a named function in the appropriate service module.

**If adding a new RPC or complex join**, add it as a named function in the appropriate `src/services/` file (e.g., `communitiesService.js`) so it's reusable and testable rather than inlining it in a component.

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
- Feed, Communities, and Map share a persistent `DestinationHeader` glass-toolbar. Keep primary destination utility headers stable and consistent; do not bring back one-off hide-on-scroll behavior for only some main tabs.
- Mitzvah Circle and Profile are intentionally hero-led. Align them with the shared shell spacing/card rhythm, but avoid duplicate top utility bars unless a future full shell redesign calls for it.

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
| Product roadmap | `internal/roadmap.js` |
| Roadmap UI | `src/pages/AdminRoadmap.jsx` |
| App Store readiness data | `internal/iosReadiness.js` |
| App Store readiness UI | `src/pages/AdminiOSReadiness.jsx` |
| Copy Prompt button | `src/components/common/CopyPromptButton.jsx` |
| Auth context | `src/lib/AuthContext.jsx` |
| Community types / tab logic | `src/lib/communityTypes.js` |
| Supabase client + auth helpers | `src/api/supabaseClient.js` |
| Named entity operations | `src/services/entityServices.js` |
| Shared Supabase repository behavior | `src/services/supabaseRepository.js` |
| App routing | `src/App.jsx` |
| Page registry | `src/pages.config.js` |
| DB migrations | `supabase/migrations/` |
