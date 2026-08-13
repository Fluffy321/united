---
name: junited-self-check
description: >
  Run after implementing any JUnited feature, fix, migration, refactor, route, visible UI change, redesign work, or roadmap update, and whenever the user asks to check, verify, audit, self-check, or make sure nothing is broken. Performs a read-only, repository-wide consistency and UX contract audit for JUnited's React 18 + Vite + Tailwind + React Query + Supabase app. Detects build regressions, stale roadmap claims, route and deep-link mismatches, tab whitelist drift, entity mapping gaps, React Query invalidation errors, responsive-shell violations, design-token drift, accessibility regressions, and misleading loading/empty/error states.
---

# JUnited Self-Check v3

Run a read-only consistency and user-experience audit from the repository root. Do not modify application files. If a finding requires a fix, report it with exact evidence and leave implementation to a separate task.

Use the working-tree version of this skill when it has uncommitted changes and say so. Record the checked commit SHA and whether the worktree was clean before and after the audit.

## Sources of truth

Read these before interpreting findings:

1. `AGENTS.md` or `CLAUDE.md` for repository rules.
2. `internal/roadmap.js` for product status and implementation prompts.
3. `internal/master-plan.md` for standing product priorities.
4. `STYLE_GUIDE.md` and `src/index.css` for the production visual system.
5. [references/redesign-contract.md](references/redesign-contract.md) for the approved redesign invariants when checking routes, shells, visual work, accessibility, or UI states.

Run every check. Use **PASS**, **WARN** (suspicious or unverified), or **FAIL** (a broken invariant). Never convert missing evidence into PASS.

## Check 0 — Evidence, sync, and conflict state

```bash
git rev-parse HEAD
git status --short --branch
git fetch -q
git status -sb | head -1
grep -rln '^<<<<<<< \|^>>>>>>> ' src internal supabase .claude 2>/dev/null
```

- Behind the configured upstream: WARN because findings may not match production.
- Conflict marker in committed or working code: FAIL.
- Preserve the initial status and compare it with the final status. The audit must not create changes.

## Check 1 — Lint, tests, typecheck, and build

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

Any command failure is FAIL unless the environment itself is proven incompatible. An unavailable native build dependency is WARN with the exact local command the user should run; do not mislabel it as an application failure.

## Check 2 — Regression ratchets and baseline integrity

`prebuild` runs the Jewish-hub and style ratchets. If build passed, confirm the ratchets passed and inspect changes to their baselines:

```bash
git diff -- scripts/check-jewish-hub-regressions.cjs scripts/check-style.mjs package.json
npm run check-style
npm run check-jewish-hub
```

- Baseline raised without a documented, intentional exception: FAIL.
- Count dropped but baseline was not lowered: WARN.
- A ratchet removed from `prebuild`: FAIL.

## Check 3 — Roadmap and master-plan truthfulness

- Run `npm run check-prompts`.
- Spot-check at least three `STATUS.SHIPPED` entries across different categories. Verify the named files, migrations, routes, and user paths exist.
- Spot-check planned, exploring, blocked, and deferred entries for work that already shipped.
- For work touched in the current session, compare `internal/master-plan.md` checkboxes with the current implementation.
- A shipped claim contradicted by code or runtime evidence: FAIL. Stale but non-critical prose: WARN.
- An AI-implementable open roadmap item without a complete `prompt`: FAIL.

## Check 4 — Stale internal paths and instructions

Verify paths mentioned by operational documents and this skill:

```bash
for f in CLAUDE.md AGENTS.md STYLE_GUIDE.md .claude/skills/junited-self-check/SKILL.md .claude/skills/junited-self-check/references/redesign-contract.md; do
  grep -oE '(src|internal|supabase|scripts|\.claude)/[A-Za-z0-9_./-]+\.[a-z]+' "$f" | sort -u |
    while read -r p; do [ -e "$p" ] || echo "STALE in $f: $p"; done
done
```

Skip paths explicitly labeled historical. A stale path in an instruction an agent must follow: FAIL. Other stale paths: WARN.

## Check 5 — Route registry and page configuration

`src/pages.config.js` contains the primary registered pages; `src/App.jsx` owns admin, legal, detail, alias, and disabled routes.

- Every page in `pages.config.js` must have a live route in `App.jsx`.
- `mainPage` must name a key in `PAGES`.
- App-only routes are valid and must not be flagged merely for being absent from `pages.config.js`.
- Disabled or legacy routes must use the documented redirect arrays or explicit `<Navigate>` behavior required by `AGENTS.md`.
- A reachable page file with no intentional route or a route targeting a missing component: WARN; a primary destination with no route: FAIL.

## Check 6 — Navigation and deep-link contracts

Cross-check producers and consumers, not just route declarations:

- Every `Layout.jsx` primary navigation destination must resolve to a route in `App.jsx` and preserve the expected active state.
- Every `navigate()`, `<Link to>`, notification route, share URL, and search-result link must use the query parameter expected by the destination's `useSearchParams()` or `URLSearchParams` reader. `id`, `postId`, and `userId` are not interchangeable.
- A user action must not silently redirect to Feed or Map unless it is explicitly documented as a legacy alias.
- Unknown routes must render a professional user-facing 404 with no internal AI, developer, or admin implementation copy.
- Check both string literals and `createPageUrl()` calls in files touched this session; run a broader scan daily.

Any primary-nav 404, producer/consumer parameter mismatch, or misleading redirect from a live action: FAIL. An unverified dynamic link: WARN.

## Check 7 — View, tab, and filter whitelists

Every tab or view ID offered by UI controls must be accepted by its whitelist/parser. Start with `WORKFLOW_TABS` and derived `VALID_VIEWS` in `src/pages/MitzvahCircle.jsx`, then inspect other modified pages with `VALID_*`, `allowedViews`, or URL-driven tabs.

A selectable or notification-linked view that resets to a different default: FAIL.

## Check 8 — Entity table mapping

Compare entity usage across `src/` (excluding tests) with `SUPABASE_ENTITY_TABLES` in `src/services/supabaseRepository.js`:

```bash
rg -n --glob '!**/*.test.*' '(supabaseBackend|dataService|base44)\.entities\.[A-Za-z]+' src
```

- Referenced but unmapped entity: FAIL.
- Mapped but unreferenced entity: WARN only after confirming it is not used dynamically.

## Check 9 — Direct Supabase calls outside services

Review `supabase.from()` in `src/components/` and `src/pages/`. Direct queries are allowed for RPCs, nested-select joins, admin endpoints, storage, and auth. Plain single-table CRUD that belongs in `src/services/` is WARN with file and line.

## Check 10 — React Query reader/mutation pairing

For query keys touched in the session and suspicious repository-wide keys:

- Every invalidated key needs a real `useQuery` reader.
- Every mutation that changes visible cached data must invalidate or optimistically update the relevant keys.
- Dead invalidation: WARN. A mutation that leaves a known visible view stale: FAIL.

## Check 11 — Hooks, callbacks, and runtime identifiers

In modified React files:

- Early return before a later hook in the same component: FAIL.
- New `eslint-disable` for rules of hooks: FAIL.
- Identifier used by a JSX callback but not defined in scope: FAIL.
- Extracted component using a value that remained in the old parent scope: FAIL.

Use a one-off stricter ESLint rule when normal lint does not cover the risk:

```bash
npx eslint <modified-files> --rule 'no-undef:error'
```

## Check 12 — Duplicate, shadowed, and dead UI

Look for near-identical live component names, extracted modules whose originals remain, and alternate UI implementations for the same routed surface. Confirm imports before calling code dead.

- Two live competing implementations for one routed surface: FAIL.
- Strongly suspected stale copy with zero importers: WARN.

## Check 13 — Visual system and design-token drift

Read `STYLE_GUIDE.md` and the redesign contract before judging visual code.

- Run `npm run check-style` and inspect added lines in modified `.jsx`, `.js`, and `.css` files.
- New primary CTAs must use the shared primary primitive or blue token, not an unrelated dark/gradient treatment.
- Prefer `.app-card`, `.app-input`, `.app-chip`, `.app-tab-pill`, `.app-empty-state`, and the shared typography/layout utilities over new one-off class clusters.
- New hardcoded hex colors, arbitrary radii, shadows, gradients, or floating offsets require a documented semantic reason. Repeated new raw values that bypass tokens: WARN; a direct contradiction of `STYLE_GUIDE.md`: FAIL.
- Inter remains the application font. Fraunces is selective display/editorial typography; Noto Serif Hebrew is for Hebrew content.
- Product actions use the shared Lucide/JUnited icon vocabulary. Emoji may be content, not an unlabeled substitute for product controls.

Do not fail pre-existing debt merely because it exists. Fail or warn on regressions, false shipped claims, and touched areas that violate the agreed contract.

## Check 14 — Responsive shell, fixed layers, and desktop behavior

For shell or visible UI changes, trace the route through `App.jsx` → `Layout.jsx` → page/component.

- Use `mobile-page`, `mobile-page-wide`, `mobile-safe-bottom`, `app-fixed-layer`, `app-fixed-frame`, `app-floating-stack`, and `FloatingActionsContext` instead of guessed widths or bottom offsets.
- Feed, Communities, and Map use `DestinationHeader`; Help/Mitzvah Circle and Profile remain hero-led unless the shell strategy is intentionally changed everywhere.
- No fixed navigation, floating action, sticky header, or sheet may obscure reachable content.
- Do not introduce a hardcoded sticky offset that guesses another component's height.
- When visible UI changed, verify at 390, 768, 1024, and 1440px with the available browser/local preview. If runtime verification is unavailable, report WARN rather than PASS.
- The planned desktop shell may remain incomplete while its roadmap item is open. If roadmap marks it shipped, verify the sidebar/wide-layout behavior before PASS.

Observed content obstruction, horizontal overflow, or unreachable action: FAIL.

## Check 15 — Accessibility and interaction quality

For new or modified UI:

- Icon-only controls have an accessible name.
- Primary touch targets are at least 44×44px, or the visible control is inside a documented larger hit target.
- Focus-visible treatment is present; state is not communicated by color alone.
- Motion respects reduced-motion rules.
- Text contrast and disabled states remain legible.
- Horizontal chip/tab rows have a discoverable overflow treatment and keyboard access.

A newly introduced inaccessible primary action or unnamed control: FAIL. Existing untouched debt: WARN with a roadmap cross-reference when available.

## Check 16 — Loading, empty, error, and trust states

Every changed async or data-backed surface must account for loading, empty, error, and success states as applicable.

- Prefer purposeful skeletons over blank screens or fixed artificial delays.
- Empty states explain what the user can do next without dominating permanent profile/content pages.
- Errors preserve the app shell when possible and provide retry/back recovery.
- No user-facing copy may mention AI implementation status, internal tooling, fake data, or unsupported claims.
- Legal, support, payment, and safety surfaces must not contain launch-blocking placeholder warnings presented as finished content.

Blank async screens, silent data loss, or deceptive trust copy: FAIL. Missing non-critical polish: WARN.

## Check 17 — Skill and automation integrity

- Confirm every numbered check is present exactly once and the output table accounts for all checks.
- Verify this skill's referenced files still exist.
- If invoked by the daily automation, verify the automation asks for **all checks**, not an obsolete count, and remains read-only.
- If the skill changed, use the working-tree version, mention it, and run the skill validator before completion.

## Output format

```markdown
## JUnited Self-Check Results — YYYY-MM-DD

- Commit: `<sha>`
- Worktree: clean | dirty (list relevant files)
- Skill: committed | working-tree version

| Check | Status | Evidence |
|---|---|---|
| 0. Evidence and sync | PASS/WARN/FAIL | concise evidence |
...one row for every check through 17...

## Action items — priority order
1. [FAIL] Exact required fix — `path:line`
2. [WARN] Exact review needed — `path:line`

## What looks good
- Concise list of verified strengths.

## Verification limits
- Anything that could not be proven and why. Omit when empty.
```

Keep evidence concrete and concise. Do not pad the report with generic praise. Do not claim runtime or responsive behavior passed from build output alone.
