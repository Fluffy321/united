# JUnited — Agent Instructions

This file is read by OpenAI Codex and other AI coding agents.
Claude Code sessions read `CLAUDE.md` instead, but both files share the same rules.

---

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, React Router v6, TanStack Query
- **Backend**: Supabase (Postgres, Auth, Edge Functions, Storage)
- **Auth bridge**: `src/api/base44Client.js` is a compatibility shim — prefer `src/api/supabaseClient.js` and `src/services/` for new code
- **Email**: Resend (via Supabase Edge Functions)
- **Payments**: Stripe (not yet live — see roadmap)

---

## ⚠️ Roadmap Maintenance — Two-Part Rule

**`src/config/roadmap.js` is the single source of truth for the JUnited product roadmap.**
`src/pages/FutureFeatures.jsx` is a pure renderer — it reads from the config. Do not edit the page; only edit the config.

### Part A — Status updates for work you completed

You must update `src/config/roadmap.js` in the same task whenever you:

| Situation | Action |
|---|---|
| Implement a feature listed in the roadmap | Set `status` to `'shipped'`, add a `shippedNote` |
| Intentionally defer a feature | Set `status` to `'deferred'`, fill in `why` |
| Remove a not-yet-built feature from scope | Set `status` to `'dropped'`, explain in `why` |
| Introduce a meaningful new future feature idea | Add a new entry with `status: 'planned'` or `'deferred'` |
| Unblock a blocked feature | Update `status`, update or remove `needs` |

Valid status values: `'planned'`, `'deferred'`, `'exploring'`, `'blocked'`, `'shipped'`, `'dropped'`

### Prompt field rule — REQUIRED for AI-implementable items

The `prompt` field in each roadmap entry powers the **Copy Prompt** button in `/FutureFeatures`. When present, admins can one-click-copy it into an AI agent to implement the feature. When absent, the button silently disappears.

**Any new roadmap entry that an AI agent could reasonably implement MUST include a `prompt` field.** This applies to `planned`, `deferred`, `exploring`, and `blocked` entries.

**Prompt format:**
```
prompt: `You are implementing X for JUnited.

Context: <point to exact files, migrations, and existing code>

Goals:
1. <specific, ordered implementation steps>
N. Update src/config/roadmap.js: change this item's status to 'shipped'.`
```

**When a prompt MAY be omitted:** Only if the item is purely manual (no code to write). If omitting, explain why in `why` or `description`.

**Do not add incomplete shells.** Write the prompt at the same time as the entry. Run `npm run check-prompts` to verify.

---

### Part B — Future-improvements scan (required after applicable tasks)

Before writing the final report on any feature implementation, significant bug fix, redesign, audit, admin tool addition, or any task that surfaces recommendations or deferred work — you must perform a roadmap future-improvements scan:

1. Review the session for anything that qualifies as future work: implied improvements, deferred enhancements, discovered gaps, follow-up features, recommended next steps.
2. Open `src/config/roadmap.js` and for each candidate determine:
   - **Already tracked** → no action; note it in the report
   - **Belongs under an existing item** → merge or update that entry
   - **Deserves its own entry** → add it with `status: 'planned'` or `'deferred'`
   - **Too trivial** → skip it, but explain in the report
3. Update the roadmap, then report what you did.

**Do not list meaningful future improvements in a final report without first reviewing the roadmap.**
This scan is not required for trivial changes (one-line fixes, copy edits) unless future work is surfaced.

### Final report requirement

Every applicable final report must include:

```
Roadmap future-improvements scan:
- Added: <item> — <why>
- Updated: <item> — <what changed>
- Not added, with reason: <idea> — <why not tracked>
```

If nothing was found:

```
Roadmap future-improvements scan:
- No new roadmap-worthy future improvements identified.
```

---

## Key Rules

- **Auth**: Use `useAuth()` from `src/lib/AuthContext.jsx`. Protected routes use `<ProtectedRoute />`. Admin routes use `<AdminRoute />`.
- **Data**: Use `dataService` from `src/services/` for entity reads/writes. Use `supabase` from `src/api/supabaseClient.js` for direct queries and RPCs.
- **Migrations**: All schema changes go in `supabase/migrations/` as timestamped SQL files. Run `npx supabase db push --linked --dry-run` before pushing.
- **Disabled routes**: Future pages use `<Navigate to={mainPagePath} replace />` in `App.jsx` rather than being deleted.
- **Lint/build**: Run `npm run lint` and `npm run build` before completing any task.
- **Responsive shell**: Use the shared layout utilities in `src/index.css` (`mobile-page`, `mobile-page-wide`, `mobile-safe-bottom`, `app-fixed-layer`, `app-fixed-frame`, `app-floating-stack`) instead of hardcoding viewport widths or floating button offsets.
- **Floating actions**: Page-level floating buttons should register through `FloatingActionsContext` so they share one stack with global actions like Feedback and stay above the bottom nav/safe area.
