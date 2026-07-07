---
name: junited-self-check
description: >
  Use after implementing any feature, fix, migration, refactor, or roadmap change in the JUnited repo, and whenever the user asks to "check the code", "self-check", "make sure nothing is broken", "verify consistency", or "audit the codebase". Catches cross-file contradictions that compile cleanly but break at runtime — stale mappings, orphaned routes, committed conflict markers, stale doc paths, unpaired React Query keys. JUnited-specific (React 18 + Vite + React Query + Supabase). Run proactively after shipping — don't wait to be asked.
---

# JUnited Self-Check (v2, authored by Fable 5, 2026-07-07)

Cross-file consistency audit for the JUnited repo. Not a lint pass — every check here targets a class of bug that lint and build have historically let through in this exact codebase. Each check notes the real incident that motivated it.

Run every check. Report each as **PASS** / **WARN** (looks off, may be intentional) / **FAIL** (broken invariant). All file paths below were verified to exist on 2026-07-07 — if one is missing, the codebase moved under the skill: flag that as WARN and update this file in the same session.

**Run from the repo root:** `cd "$(git rev-parse --show-toplevel)"`.

---

## Check 0 — Sync & conflict state *(new in v2)*

Motivated by: the June 22 audit ran 7 commits behind production, and committed `<<<<<<<` markers shipped to main **twice** in one week (FriendsHub.jsx, master-plan.md).

```bash
git fetch -q && git status -sb | head -1     # behind origin? WARN — findings may not match production
grep -rln '^<<<<<<< \|^>>>>>>> ' src internal supabase 2>/dev/null   # any hit = FAIL
```

## Check 1 — Lint, tests, build

```bash
npm run lint          # errors = FAIL, warnings = WARN
npm run test          # vitest; failures = FAIL
npm run build         # also runs prebuild ratchets (see Check 2)
```

If the sandbox can't run the build (rollup native-binary mismatch), say so and tell the user to run it locally — that is not a FAIL.

## Check 2 — Style & regression ratchets

`prebuild` runs `scripts/check-jewish-hub-regressions.cjs` and `scripts/check-style.mjs` (a bg-slate-950 count ratchet: may drop, never grow). If build passed, these passed — just confirm nobody edited the baseline number upward in `check-style.mjs` to sneak past it. Baseline raised without justification = FAIL.

## Check 3 — Roadmap vs. code

`internal/roadmap.js` is the single source of truth (see CLAUDE.md rules).

- Spot-check 2–3 `STATUS.SHIPPED` entries: do the files their `shippedNote` names exist? Missing file = WARN.
- Spot-check `PLANNED`/`EXPLORING` entries against the code: already implemented = WARN (roadmap stale).
- `npm run check-prompts` — an AI-implementable entry missing its `prompt` field = FAIL.
- Cross-check `internal/master-plan.md` checkboxes against reality for items touched this session; a `[x]` on unshipped work = FAIL.

## Check 4 — Stale internal-doc paths *(new in v2)*

Motivated by: CLAUDE.md/AGENTS.md pointed at deleted `src/config/roadmap.js` for weeks, and this very skill's v1 pointed at deleted `src/api/base44Client.js`.

For every file path mentioned in `CLAUDE.md`, `AGENTS.md`, and this skill, verify it exists:

```bash
for f in CLAUDE.md AGENTS.md .claude/skills/junited-self-check/SKILL.md; do
  grep -oE '(src|internal|supabase|scripts)/[A-Za-z0-9_./-]+\.[a-z]+' "$f" | sort -u \
    | while read p; do [ -e "$p" ] || echo "STALE in $f: $p"; done
done
```

Any STALE line = WARN (FAIL if it's in a rule an agent is expected to follow). Paths quoted as historical incidents (like the two in this check's first paragraph) are expected to be missing — skip those.

## Check 5 — Routes vs. pages config

Every `<Route path=...>` in `src/App.jsx` should have a matching entry in `src/pages.config.js`, and vice versa. Exception: `<Navigate>` redirects are intentionally disabled pages. Mismatch = WARN.

## Check 6 — Tab whitelists

`src/pages/MitzvahCircle.jsx` gates tabs through `VALID_VIEWS` (~line 1271). Every tab ID offered in the UI must be in the whitelist — a missing one silently bounces to the default (invisible to lint/build). Mismatch = FAIL. Apply the same test to any other page using a views whitelist.

## Check 7 — Entity table mapping

The map is `SUPABASE_ENTITY_TABLES` in `src/services/supabaseRepository.js` (moved from the old base44Client). Every entity name used via `dataService.entities.<Name>` / repository helpers must have a key there — a missing mapping throws in production (unit tests in `src/services/supabaseRepository.test.js` cover the warning path, not every call site). Unmapped entity reachable in production = FAIL; mapped-but-never-referenced entity = WARN.

## Check 8 — Direct Supabase calls in components

Per CLAUDE.md, direct `supabase.from()` in `src/components/` or `src/pages/` is only for RPCs, nested-select joins, admin endpoints, storage, and auth. Plain single-table CRUD that belongs in `src/services/` = WARN with file:line.

## Check 9 — React Query key pairing *(new in v2)*

Motivated by: Communities' `['communities-list']` key was invalidated by CommunityDetailView for months before anything actually read it.

For query keys touched this session:
- Every `invalidateQueries` key should have at least one `useQuery` reader — invalidating a key nobody reads = WARN (dead invalidation or missing reader).
- Every mutation that changes data shown elsewhere should invalidate (or optimistically update) the relevant key — missing invalidation = FAIL (stale UI).

## Check 10 — Hooks order in modified files

Motivated by: UnifiedPostCard shipped with 9 suppressed rules-of-hooks violations; the fix pattern is a hook-free dispatcher above the hooks (see `src/components/feed/UnifiedPostCard.jsx`).

In files edited this session: any early `return` before a hook call in the same component = FAIL. Any new `eslint-disable.*rules-of-hooks` = FAIL — restructure instead (dispatcher pattern).

## Check 11 — Undefined identifiers in event handlers *(new in v2)*

Motivated by: `onClick={() => navigate(...)}` shipped inside a component that never defined `navigate` — a ReferenceError only on tap, invisible to build. In files edited this session, confirm identifiers used inside JSX callbacks are actually defined in scope (eslint `no-undef` catches most, but check moved/extracted code where the definition may have stayed behind).

## Check 12 — Duplicate / shadowed components

Historical trap: `CommunityHubDetail` vs `CommunityDetailView`. After any refactor, look for near-identical component names where one is routed and the sibling is stale, and for extracted modules whose originals were left behind (this week: two parallel splits of CommunityAdminCenter had to be reconciled). Suspected stale copy = WARN; two live copies both imported = FAIL.

---

## Output format

```
## JUnited Self-Check Results — [date]

| Check | Status | Notes |
|---|---|---|
(only WARN/FAIL rows — omit clean passes)

## Action items (priority order)
1. [FAIL] <exact fix> — <file:line>
2. [WARN] <what to review> — <file>

## What looks good
- <one-line list of clean checks>
```

Keep action items concrete (file, line, exact change). Don't pad the report with things that are fine.
