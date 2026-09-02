# JUnited Launch Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved Five Towns dashboard launch-ready by connecting Directory, Map, Search, and Publish to the same real data while preserving the existing Home design.

**Architecture:** `FIVE_TOWNS_LISTINGS` remains the trusted public baseline. Published Supabase business submissions are normalized into that same contract and merged without duplicates. `/Map` becomes one Directory with List and Map modes; Map keeps existing community posts and help requests as optional layers. Search uses the same local catalog, and Publish resolves membership IDs through the real community catalog.

**Tech Stack:** React 18, React Router, TanStack Query, Supabase entity services, React Leaflet, Vitest, Testing Library, Tailwind CSS.

---

## Task 1: Create one directory catalog contract

**Files:**
- Create: `src/lib/directory/directoryCatalog.js`
- Create: `src/lib/directory/directoryCatalog.test.js`
- Modify: `src/lib/directory/fiveTownsDirectory.js`

- [ ] **Step 1: Write failing normalization and merge tests.** Cover submitted-record normalization, trusted-vs-submitted deduplication by normalized name and address, trusted kosher/source retention, finite coordinates, searching by name/address/town/category/tag, and conversion to the old map-point contract.

- [ ] **Step 2: Confirm the focused test fails.** Run `npm run test -- --run src/lib/directory/directoryCatalog.test.js`. Expected: missing module failure.

- [ ] **Step 3: Implement and export the shared helpers.**

```js
export function normalizeSubmittedBusiness(record) {}
export function mergeDirectoryListings(trustedListings, submittedBusinesses) {}
export function filterDirectoryCatalog(listings, filters = {}) {}
export function directoryListingToMapPoint(listing) {}
```

The shared record adds `sourceKind`, `sourceRecordId`, `listingType`, `verificationStatus`, `isClaimed`, and `rawSubmittedRecord`. Include only published submissions. Keep every trusted listing. A duplicate submission may fill missing phone, website, image, or claim metadata but may not overwrite trusted source or kosher facts. Map points use the current `title`, `description`, `type`, `location_text`, `location_lat`, `location_lng`, `source_url`, and `verification` fields.

- [ ] **Step 4: Add trusted metadata in `normalizeDirectoryListing`.** Set `sourceKind: 'trusted'`, `sourceRecordId: null`, `listingType: 'physical'`, `verificationStatus: 'trusted_source'`, `isClaimed: false`, and `rawSubmittedRecord: null`.

- [ ] **Step 5: Verify and commit.**

```bash
npm run test -- --run src/lib/directory/directoryCatalog.test.js src/lib/directory/fiveTownsDirectory.test.js
git add src/lib/directory/directoryCatalog.js src/lib/directory/directoryCatalog.test.js src/lib/directory/fiveTownsDirectory.js
git commit -m "feat: unify Five Towns directory data"
```

## Task 2: Make `/Map` one real Directory with List and Map

**Files:**
- Modify: `src/pages/Map.jsx`
- Modify: `src/components/mitzvah/MitzvahMap.jsx`
- Modify: `src/components/mitzvah/map/MitzvahMapFilterBar.jsx`
- Modify: `src/components/mitzvah/map/shared.js`
- Create: `src/pages/Map.test.jsx`
- Create: `src/components/mitzvah/MitzvahMap.test.jsx`

- [ ] **Step 1: Write failing route and map tests.** Prove trusted listings render when the database returns none; List and Map are the only main modes; `category` and `place` deep links filter/highlight without switching products; existing Add Business and owner tools remain; old community/help points remain; markers have accessible names; coordinate-less listings do not crash.

- [ ] **Step 2: Confirm failure.** Run `npm run test -- --run src/pages/Map.test.jsx src/components/mitzvah/MitzvahMap.test.jsx`. Expected: failure because `/Map` still separates Businesses and Community Map.

- [ ] **Step 3: Merge trusted and submitted listings in `BusinessDirectoryExperience`.** Build `directoryListings = mergeDirectoryListings(FIVE_TOWNS_LISTINGS, submittedBusinesses)`. Use `filterDirectoryCatalog` for search/category/type. Adapt cards and details so trusted records show source, directions, kosher verification, phone, website, image, and correction reporting while submitted records keep claim/review/owner behavior.

- [ ] **Step 4: Remove the top Businesses/Community Map split.** Keep one List/Map control inside Directory. Remove the duplicated top toggle and `LiveNowRail`. Deep links change filters/highlights, not the product section.

- [ ] **Step 5: Feed all directory listings into the old map.** Add `directoryPoints = []` to `MitzvahMap`. Compose points as requests, community points, directory points, and use `VERIFIED_STATIC_POINTS` only as fallback when no directory points are supplied. Add marker `title`, `alt`, keyboard support, and stable IDs.

- [ ] **Step 6: Keep optional map layers.** Map mode shows calm `Places`, `Community`, and `Help` filters. Places is on by default. Community and Help add to the same map and never replace the Directory.

- [ ] **Step 7: Verify and commit.**

```bash
npm run test -- --run src/pages/Map.test.jsx src/components/mitzvah/MitzvahMap.test.jsx src/lib/directory/directoryCatalog.test.js
git add src/pages/Map.jsx src/pages/Map.test.jsx src/components/mitzvah/MitzvahMap.jsx src/components/mitzvah/MitzvahMap.test.jsx src/components/mitzvah/map/MitzvahMapFilterBar.jsx src/components/mitzvah/map/shared.js
git commit -m "feat: restore one complete Five Towns directory map"
```

## Task 3: Connect global Search to the local catalog

**Files:**
- Modify: `src/pages/Search.jsx`
- Create: `src/pages/Search.test.jsx`

- [ ] **Step 1: Write failing tests.** Searching `Cork & Slice`, `shul`, and `Cedarhurst` must return trusted local listings even when `universalSearch` returns empty. Clicking one must navigate to `/Map?place=<encoded name>`.

- [ ] **Step 2: Confirm failure.** Run `npm run test -- --run src/pages/Search.test.jsx`.

- [ ] **Step 3: Add local results.** Search `FIVE_TOWNS_LISTINGS` through `filterDirectoryCatalog`, show local results first under `Places & directory`, deduplicate remote businesses by normalized name/address, and retain every current remote results section.

- [ ] **Step 4: Verify and commit.**

```bash
npm run test -- --run src/pages/Search.test.jsx src/lib/directory/directoryCatalog.test.js
git add src/pages/Search.jsx src/pages/Search.test.jsx
git commit -m "fix: connect search to the Five Towns directory"
```

## Task 4: Show real community names in Publish

**Files:**
- Create: `src/lib/publishing/publishingCommunities.js`
- Create: `src/lib/publishing/publishingCommunities.test.js`
- Modify: `src/pages/Publish.jsx`
- Modify: `src/pages/Publish.test.jsx`

- [ ] **Step 1: Write failing resolver tests.** Resolve `{ community_id: 'c1' }` against `{ id: 'c1', name: 'Five Towns News & Updates' }`; remove duplicate/inactive rows; use neutral `Community` only for missing catalog records.

- [ ] **Step 2: Confirm failure.** Run `npm run test -- --run src/lib/publishing/publishingCommunities.test.js src/pages/Publish.test.jsx`.

- [ ] **Step 3: Implement and connect.** Export `resolvePublishingCommunities(memberships, communities)`. Query `listCommunity` beside `filterUserCommunity`, then build `userContext.joinedCommunities` from the resolver. Catalog loading must not erase a saved draft.

- [ ] **Step 4: Verify and commit.**

```bash
npm run test -- --run src/lib/publishing/publishingCommunities.test.js src/pages/Publish.test.jsx src/lib/publishing/publishingDraft.test.js
git add src/lib/publishing/publishingCommunities.js src/lib/publishing/publishingCommunities.test.js src/pages/Publish.jsx src/pages/Publish.test.jsx
git commit -m "fix: show real community names when publishing"
```

## Task 5: Remove trust-breaking copy and accessibility gaps

**Files:**
- Modify: `src/lib/PageNotFound.jsx`
- Create: `src/lib/PageNotFound.test.jsx`
- Modify: `src/components/communities/CreateCommunityFlow.jsx`
- Modify: `src/components/communities/CreateCommunityFlow.test.jsx`
- Modify: `src/components/mitzvah/MitzvahMap.jsx`

- [ ] **Step 1: Write failing tests.** Unknown routes never mention AI/admin/implementation; recovery uses React Router; Create Community’s close button is `Close create community`; map markers use listing names.

- [ ] **Step 2: Confirm failure.** Run `npm run test -- --run src/lib/PageNotFound.test.jsx src/components/communities/CreateCommunityFlow.test.jsx src/components/mitzvah/MitzvahMap.test.jsx`.

- [ ] **Step 3: Implement concise copy and labels.** Use: `Page not found`, `That page may have moved or is no longer available.`, and `Back to Home`. Do not alter the approved visual system.

- [ ] **Step 4: Verify and commit.**

```bash
npm run test -- --run src/lib/PageNotFound.test.jsx src/components/communities/CreateCommunityFlow.test.jsx src/components/mitzvah/MitzvahMap.test.jsx
git add src/lib/PageNotFound.jsx src/lib/PageNotFound.test.jsx src/components/communities/CreateCommunityFlow.jsx src/components/communities/CreateCommunityFlow.test.jsx src/components/mitzvah/MitzvahMap.jsx
git commit -m "fix: remove internal copy and name mobile controls"
```

## Task 6: Verify the whole launch path on iPhone

**Files:**
- Modify if warranted by verified results: `internal/roadmap.js`
- Create: `docs/superpowers/verification/2026-09-02-launch-stabilization.md`

- [ ] **Step 1: Run the complete JUnited self-check.**

```bash
npm run lint
npm run test -- --run
npm run typecheck
npm run build
npm run check-style
npm run check-jewish-hub
npm run check-prompts
git diff --check
rg -n "^(<<<<<<<|=======|>>>>>>>)" . --glob '!node_modules/**' --glob '!.git/**'
```

All must pass. Do not use `npm audit fix --force`.

- [ ] **Step 2: Test at 390 x 844.** Verify Login; unchanged Home; Home Directory deep links; Directory List with an empty DB; Directory Map with places/community/help; Search for a known business and shul; named Publish communities; Add Business open/close without submission; Community create open/close; clean 404; no overflow, clipping, dead buttons, or invented content.

- [ ] **Step 3: Record exact evidence.** Write commands, pass counts, tested URLs, screenshots, and remaining non-blocking risks to `docs/superpowers/verification/2026-09-02-launch-stabilization.md`.

- [ ] **Step 4: Update the roadmap only with verified facts.** Keep npm dependency audit cleanup separate if vulnerabilities remain.

- [ ] **Step 5: Commit, push, and verify GitHub.**

```bash
git add internal/roadmap.js docs/superpowers/verification/2026-09-02-launch-stabilization.md
git commit -m "docs: record launch stabilization verification"
git push origin codex/launch-stabilization
git status --short --branch
git log -1 --oneline
```

## Plan self-review

- [x] Preserves the approved Five Towns Home dashboard.
- [x] Uses the existing trusted directory instead of starting over.
- [x] Preserves reviewed Supabase submissions and owner tools.
- [x] Restores the old map as the Directory Map mode.
- [x] Keeps community/help activity as optional layers.
- [x] Connects Search and Publish to the same records.
- [x] Removes internal AI copy and closes verified accessibility gaps.
- [x] Requires failing tests before production changes.
- [x] Requires full automated and iPhone verification before completion.
- [x] Contains no TODO, TBD, placeholder, or invented-content step.
