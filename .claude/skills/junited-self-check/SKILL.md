---
name: junited-self-check
description: >
  JUnited codebase consistency checker. Use this skill automatically after implementing any feature, fix, migration, or roadmap change in the JUnited repo. Also invoke it whenever the user asks to "check the code", "self-check", "make sure nothing is broken", "verify consistency", or "audit the codebase". This skill is JUnited-specific and knows the exact conventions of the stack (React + Supabase + roadmap.js). Run it proactively — don't wait to be asked if you just shipped something.
---

# JUnited Self-Check

You are auditing the JUnited codebase for internal contradictions and consistency issues. This is not a lint pass — it's a cross-file consistency check. The goal is to catch things that compile cleanly but are wrong in practice.

Work through each check below in order. For each one, report findings as **PASS**, **WARN**, or **FAIL**:
- **PASS** — nothing wrong found
- **WARN** — something looks off but may be intentional; flag it for human review
- **FAIL** — clear contradiction or broken invariant

At the end, print a summary table and a prioritized list of action items. Only include checks with WARN or FAIL in the summary — omit clean passes to reduce noise.

---

## Check 1 — Roadmap vs. Code

**File:** `internal/roadmap.js`

For every entry with `status: STATUS.SHIPPED`:
1. Does the `shippedNote` describe where the code lives? If not, flag as WARN.
2. Does at least one of the files mentioned in `shippedNote` actually exist in the repo? Spot-check 2–3 shipped items.

For every entry with `status: STATUS.PLANNED` or `STATUS.EXPLORING`:
1. Is there already code in the repo that appears to implement it? If so, flag as WARN — the roadmap may need updating.

Run `npm run check-prompts` (defined in package.json) and include its output. Any AI-implementable entry missing a `prompt` field is a FAIL.

---

## Check 2 — Routes vs. Pages Config

**Files:** `src/App.jsx`, `src/pages.config.js`

Every `<Route path="..." element={<PageComponent />} />` in App.jsx should have a corresponding entry in pages.config.js — and vice versa. Flag any route that exists in one but not the other as WARN.

Exception: `<Navigate>` redirect routes don't need pages.config.js entries — those are intentionally disabled pages.

---

## Check 3 — VALID_VIEWS Whitelists

**Files:** `src/pages/MitzvahCircle.jsx` (and any other page that uses a `VALID_VIEWS` or similar array to gate tab IDs)

Every tab ID in the `workflowTabs` array (or equivalent) must also appear in `VALID_VIEWS`. A tab ID present in `workflowTabs` but missing from `VALID_VIEWS` means clicking that tab silently bounces back to the default — this is a silent runtime bug that won't show up in lint or build. Flag any mismatch as FAIL.

---

## Check 4 — Entity Table Mapping

**File:** `src/api/base44Client.js` (the `SUPABASE_ENTITY_TABLES` object)

Scan application source files for `dataService.entities.<Name>` and `base44.entities.<Name>` usage patterns, excluding `src/docs/`. Every `<Name>` used must have a corresponding key in `SUPABASE_ENTITY_TABLES`. A missing mapping throws at runtime in production. Flag any unmapped entity in production-reachable code as FAIL; flag references confined to confirmed unimported scaffolding as WARN.

Conversely, check for entity names in `SUPABASE_ENTITY_TABLES` that are never referenced in any component or service — flag as WARN (dead mapping, not harmful but noisy).

---

## Check 5 — Direct Supabase Calls in Components

**Rule** (from CLAUDE.md): Direct `supabase.from()` calls in component files are only acceptable for RPCs, multi-table joins, admin endpoints, storage uploads, and auth operations. Basic CRUD that `dataService` already handles should not use direct `supabase.from()`.

Grep for `supabase.from(` in `src/components/` and `src/pages/`. For each match:
- If it's a `.select('*, relatedTable(*)')` join or an `.rpc(` call → PASS
- If it's a plain `.select()`, `.insert()`, `.update()`, or `.delete()` on a single table that `dataService` covers → WARN with the file and line

---

## Check 6 — Migration vs. Code References

**Files:** `supabase/migrations/*.sql`, `src/`

Pick any new table or column names introduced in recent migrations (focus on the 3–5 most recently modified migration files). Verify they're referenced correctly in the code:
- Table name in `SUPABASE_ENTITY_TABLES` or in a direct `supabase.from('table_name')` call
- Column names in select/insert/update calls match what the migration actually created

Flag any mismatch between migration column name and code usage as FAIL.

---

## Check 7 — Feature Flag Gating

**File:** `src/config/features.js`

`COMMUNITIES_ENABLED` must remain `true`: Communities is a live production feature. Spot-check `src/pages.config.js` and `src/App.jsx` to confirm the Communities page, community detail routes, invite route, and post-onboarding navigation remain enabled. Flag a false value, removed route, or redirect that prevents users from reaching Communities as FAIL.

---

## Check 8 — Duplicate / Shadowed Components

Known historical issue: duplicate components with similar names do different things (e.g. `CommunityHubDetail` vs `CommunityDetailView`). After any large refactor, check for:
- Two components in different files with near-identical names
- A component that is imported and rendered in App.jsx/routing but also has a sibling with nearly the same name that is no longer used

Flag any pair that looks like one might be a stale copy of the other as WARN.

---

## Check 9 — React Hooks Rules in Modified Files

For any file you edited in this session, quickly scan for the most common hooks violation: a `return` statement *before* a `useState`, `useEffect`, `useQuery`, or other hook call in the same function component. This won't always be caught by the build if ESLint isn't run. Flag any occurrence as FAIL.

If you didn't edit any files in this session, skip this check.

---

## Check 10 — Build + Lint

Run these commands from the repository root. Determine it with `git rev-parse --show-toplevel`; do not assume a machine-specific absolute path.

Run:
```bash
cd "$(git rev-parse --show-toplevel)"
npm run lint 2>&1 | tail -20
npm run build
```

Report lint errors as FAIL and warnings as WARN. If the user's environment blocks a full `npm run build` (e.g., native binary mismatch in sandbox), note that and recommend the user run it locally — do not mark this as FAIL due to environment limitations.

---

## Output format

After all checks, print:

```
## JUnited Self-Check Results — [date]

| Check | Status | Notes |
|---|---|---|
| Roadmap vs. Code | ✅ PASS / ⚠️ WARN / ❌ FAIL | ... |
| Routes vs. Pages Config | ... | ... |
...

## Action items (priority order)
1. [FAIL] <specific fix needed> — <file:line>
2. [WARN] <review needed> — <file>
...

## What looks good
- <brief list of checks that passed cleanly>
```

Keep the action items concrete — file names, line numbers, and the exact thing to change where possible. Do not pad the output with things that are fine.
