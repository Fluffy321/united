# Hybrid Directory Photo Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 138 Five Towns directory listings a trustworthy official-photo → Google Places → category-fallback visual path while keeping provider credentials and expiring photo resources off the client.

**Architecture:** Keep reviewed official photos in the existing directory enrichment data. Add a protected Supabase Edge Function that resolves known listing IDs through Places API (New), plus a small client batching service and one shared photo component used by featured rails and listing cards. Google requests are lazy, short-lived, attributed, and never persisted into the static catalog.

**Tech Stack:** React 18, Vite, TanStack React Query, Vitest, Supabase Edge Functions, Deno 2, Google Places API (New), Tailwind CSS.

## Global Constraints

- Never generate an AI image for a real business, shul, school, organization, or place.
- Never expose `GOOGLE_PLACES_API_KEY` to Vite or browser code.
- Only known Five Towns listing IDs may be resolved by the Edge Function.
- Do not persist Google photo resource names or media URLs in the directory dataset or database.
- Preserve the locked Five Towns Home dashboard layout and existing Google, Apple, and Waze actions.
- Google photo author attribution and Google Maps source access must remain available wherever a Google photo is displayed.
- A missing or failed photo must render the current polished category fallback without broken-image UI.
- The primary verification viewport is 390 × 844, with smoke checks at 768, 1024, and 1440 pixels.

## File structure

- Create `supabase/functions/_shared/fiveTownsDirectoryPhotoCatalog.ts`: server-owned listing ID, name, and address catalog.
- Create `supabase/functions/directory-photos/handler.ts`: pure request validation, matching, provider normalization, and response logic.
- Create `supabase/functions/directory-photos/index.ts`: Deno entrypoint, secret access, and CORS.
- Create `supabase/functions/directory-photos/handler_test.ts`: provider, matching, security, and failure tests.
- Create `src/services/directoryPhotoService.js`: Supabase invocation, normalized results, and micro-batching.
- Create `src/services/directoryPhotoService.test.js`: client contract, coalescing, and secret-leak tests.
- Create `src/hooks/useDirectoryPhoto.js`: visibility-aware React Query lookup.
- Create `src/components/home/DirectoryPhotoMedia.jsx`: official/Google/fallback priority and attribution UI.
- Create `src/components/home/DirectoryPhotoMedia.test.jsx`: rendering and fallback tests.
- Modify `src/components/home/DirectoryFeaturedRail.jsx`: consume the shared photo component.
- Modify `src/components/home/DirectoryListingCard.jsx`: consume the shared photo component.
- Modify `src/components/home/FeaturedPlaceCard.jsx`: consume the shared photo component.
- Modify `src/data/fiveTownsDirectoryEnrichment.js`: add only reviewed, traceable official-photo records found during the audit.
- Modify `src/lib/directory/fiveTownsDirectory.test.js`: lock photo coverage, source safety, and catalog expectations.
- Create `docs/directory/five-towns-photo-audit.md`: record coverage, sources, unresolved fallbacks, and checked date.
- Modify `.env.example`: document the server-only Google Places secret.
- Modify `internal/roadmap.js`: record the shipped photo-coverage pass without duplicating existing directory work.

---

### Task 1: Lock the server-owned photo catalog

**Files:**
- Create: `supabase/functions/_shared/fiveTownsDirectoryPhotoCatalog.ts`
- Test: `src/lib/directory/fiveTownsDirectory.test.js`

**Interfaces:**
- Produces: `FIVE_TOWNS_PHOTO_CATALOG: Readonly<Record<string, { name: string; address: string }>>`
- Consumes: current normalized `FIVE_TOWNS_LISTINGS` IDs, names, and addresses.

- [ ] **Step 1: Write the failing catalog synchronization test**

Add a test that imports `FIVE_TOWNS_PHOTO_CATALOG` and asserts that its sorted IDs exactly equal `FIVE_TOWNS_LISTINGS.map(item => item.id).sort()`, and that every catalog entry has a non-empty name and address.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: FAIL because the server-owned catalog does not exist.

- [ ] **Step 3: Add the generated static catalog**

Create the exported record with all 138 current listing IDs. Each value contains only the normalized listing name and address. Do not include sources, credentials, photo names, or media URLs.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: PASS with exact catalog/listing synchronization.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/fiveTownsDirectoryPhotoCatalog.ts src/lib/directory/fiveTownsDirectory.test.js
git commit -m "data: add protected directory photo catalog"
```

### Task 2: Build the protected Google Places photo handler

**Files:**
- Create: `supabase/functions/directory-photos/handler.ts`
- Create: `supabase/functions/directory-photos/handler_test.ts`
- Create: `supabase/functions/directory-photos/index.ts`

**Interfaces:**
- Consumes: `{ listingIds: string[] }`, `FIVE_TOWNS_PHOTO_CATALOG`, `GOOGLE_PLACES_API_KEY`, injected `fetch`.
- Produces: `{ photos: DirectoryPhoto[] }`, where status is `ready`, `empty`, or `unavailable`.
- Produces: `createDirectoryPhotoHandler({ apiKey, fetchImpl, catalog, corsHeaders })`.

- [ ] **Step 1: Write failing handler tests**

Cover these exact cases:

1. no API key returns `unavailable` without provider access;
2. an unknown listing ID returns HTTP 400;
3. more than eight IDs returns HTTP 400;
4. a matching name, street number, and town returns `ready` with `imageUrl`, `sourceUrl`, `sourceLabel: 'Google Places'`, and author fields;
5. a name/address mismatch returns `empty`;
6. missing photos returns `empty`;
7. provider or media failure returns `unavailable` and never includes the key;
8. OPTIONS returns 204 and unsupported methods return 405.

- [ ] **Step 2: Run Deno tests to verify they fail**

Run: `npx --yes deno test supabase/functions/directory-photos/handler_test.ts`

Expected: FAIL because the handler does not exist.

- [ ] **Step 3: Implement validation and matching helpers**

Implement:

```ts
export const MAX_PHOTO_BATCH = 8;
export function normalizeMatchText(value: string): string;
export function isConfidentPlaceMatch(
  listing: { name: string; address: string },
  place: { displayName?: { text?: string }; formattedAddress?: string },
): boolean;
```

Matching requires the listing street number in the provider address, a shared Five Towns locality token, and either normalized-name containment or at least half of meaningful listing-name tokens shared.

- [ ] **Step 4: Implement the Places API (New) provider flow**

For each validated listing ID:

1. POST to `https://places.googleapis.com/v1/places:searchText`;
2. send `textQuery: "<name> <address>"`, `maxResultCount: 3`, `regionCode: "US"`;
3. use field mask `places.id,places.displayName,places.formattedAddress,places.photos,places.googleMapsUri`;
4. select the first confident candidate with a photo;
5. GET `https://places.googleapis.com/v1/<photo.name>/media?maxWidthPx=900&skipHttpRedirect=true&key=<secret>`;
6. return the media `photoUri`, `googleMapsUri`, and first `authorAttributions` entry.

Never return the request URL, secret, raw provider payload, or photo resource name.

- [ ] **Step 5: Add the authenticated Deno entrypoint**

Read `GOOGLE_PLACES_API_KEY` with `Deno.env.get`, import current Supabase CORS headers, and call `Deno.serve`. Do not pass `--no-verify-jwt` when deploying.

- [ ] **Step 6: Run Deno tests and type checking**

Run:

```bash
npx --yes deno test supabase/functions/directory-photos/handler_test.ts
npx --yes deno check supabase/functions/directory-photos/index.ts
```

Expected: all handler tests pass and the entrypoint checks without type errors.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/directory-photos
git commit -m "feat: add protected directory photo function"
```

### Task 3: Add the lazy client photo service

**Files:**
- Create: `src/services/directoryPhotoService.js`
- Create: `src/services/directoryPhotoService.test.js`
- Create: `src/hooks/useDirectoryPhoto.js`

**Interfaces:**
- Produces: `fetchDirectoryPhotos(listingIds, { client = supabase }): Promise<Record<string, DirectoryPhoto>>`
- Produces: `requestDirectoryPhoto(listingId, options?): Promise<DirectoryPhoto>` with a 50 ms, eight-item queue.
- Produces: `useDirectoryPhoto(listing, { enabled }): { photo, isLoading }`.

- [ ] **Step 1: Write failing service tests**

Assert that the service invokes `directory-photos` with deduplicated listing IDs, converts missing results to `empty`, converts invocation errors and malformed results to `unavailable`, splits nine IDs into batches of eight and one, and contains neither `GOOGLE_PLACES_API_KEY` nor a `VITE_` provider key.

- [ ] **Step 2: Run the service tests to verify they fail**

Run: `npm test -- src/services/directoryPhotoService.test.js`

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement the service and queue**

Use `supabase.functions.invoke('directory-photos', { body: { listingIds } })`. Maintain a module-level pending map keyed by listing ID, flush after 50 ms, split at eight, and resolve every queued promise to a normalized state even when the provider fails.

- [ ] **Step 4: Implement the visibility-aware hook**

The hook accepts an `enabled` flag controlled by the presentation component's `IntersectionObserver`. Use React Query with key `['directory-photo', listing.id]`, five-minute stale time, one retry, and no query when `listing.imageUrl` already exists.

- [ ] **Step 5: Run service tests**

Run: `npm test -- src/services/directoryPhotoService.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/directoryPhotoService.js src/services/directoryPhotoService.test.js src/hooks/useDirectoryPhoto.js
git commit -m "feat: add lazy directory photo client"
```

### Task 4: Build one shared attributed photo component

**Files:**
- Create: `src/components/home/DirectoryPhotoMedia.jsx`
- Create: `src/components/home/DirectoryPhotoMedia.test.jsx`

**Interfaces:**
- Consumes: `{ listing, className, fallbackClassName, eager?: boolean }`.
- Produces: reserved-ratio official, Google, loading, or category-fallback media.

- [ ] **Step 1: Write failing rendering tests**

Render exact fixtures and assert:

1. official photo wins and shows `Official photo · <label>`;
2. Google photo renders only when official metadata is absent;
3. Google attribution links to the author when supplied and the photo links to Google Maps;
4. `onError` moves to the category fallback;
5. neither provider renders a broken `<img>` or empty box;
6. image elements use lazy loading unless `eager` is true.

- [ ] **Step 2: Run the component test to verify it fails**

Run: `npm test -- src/components/home/DirectoryPhotoMedia.test.jsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the shared component**

Use an `IntersectionObserver` root margin of `240px`, the directory-photo hook, and local image-failure state. Keep a stable `aspect-[4/3]`, `object-cover`, accessible place-name alt text, and a colored category fallback using existing directory group tones.

- [ ] **Step 4: Run the component test**

Run: `npm test -- src/components/home/DirectoryPhotoMedia.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/DirectoryPhotoMedia.jsx src/components/home/DirectoryPhotoMedia.test.jsx
git commit -m "feat: add attributed directory photo media"
```

### Task 5: Connect every directory photo surface

**Files:**
- Modify: `src/components/home/DirectoryFeaturedRail.jsx`
- Modify: `src/components/home/DirectoryListingCard.jsx`
- Modify: `src/components/home/FeaturedPlaceCard.jsx`
- Modify: `src/components/home/FiveTownsDirectory.test.jsx`
- Modify: `src/components/home/FeaturedPlaceCard.test.jsx`

**Interfaces:**
- Consumes: `DirectoryPhotoMedia`.
- Preserves: all existing card click, source, correction, kosher, and Google/Apple/Waze behavior.

- [ ] **Step 1: Add failing integration assertions**

Assert that all three card components render `DirectoryPhotoMedia`, retain existing source/map/correction actions, and do not contain their own `<img>` error/fallback implementation.

- [ ] **Step 2: Run focused tests to verify they fail**

Run:

```bash
npm test -- src/components/home/FiveTownsDirectory.test.jsx src/components/home/FeaturedPlaceCard.test.jsx
```

Expected: FAIL on the shared media assertions.

- [ ] **Step 3: Replace duplicated photo markup**

Use `DirectoryPhotoMedia` in the featured rail, full listing card, and Home featured place card. Keep current dimensions and typography; only the media/attribution implementation changes.

- [ ] **Step 4: Run focused tests**

Run the same focused command.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/DirectoryFeaturedRail.jsx src/components/home/DirectoryListingCard.jsx src/components/home/FeaturedPlaceCard.jsx src/components/home/FiveTownsDirectory.test.jsx src/components/home/FeaturedPlaceCard.test.jsx
git commit -m "feat: show photos across the Five Towns directory"
```

### Task 6: Audit official sources and document coverage

**Files:**
- Modify: `src/data/fiveTownsDirectoryEnrichment.js`
- Modify: `src/lib/directory/fiveTownsDirectory.test.js`
- Create: `docs/directory/five-towns-photo-audit.md`

**Interfaces:**
- Consumes: all 138 current listing records and their existing source URLs.
- Produces: additional traceable `image_url`, `image_source_url`, and `image_source_label` fields only where the publisher source is safe and specific.

- [ ] **Step 1: Add a failing coverage/safety test**

Assert that every static image has an HTTP(S) image source page and label, no image URL uses Google photo media or review/social/search-result hosts, and the audit count equals the normalized dataset count.

- [ ] **Step 2: Run the directory test to verify the new audit assertion fails**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: FAIL until the audit summary is recorded and synchronized.

- [ ] **Step 3: Review official-source candidates**

Check the existing source page for every featured listing without a photo. Add static metadata only for an image published by the business/place itself, its municipality/county, school/shul/organization, or kosher certifier, with a stable source page. Do not add third-party directory, review, social, or search-result photography.

- [ ] **Step 4: Write the audit report**

Record the total 138 listings, official-photo count, Google-fallback count, category-fallback count, each new official image publisher, rejected source classes, and checked date. State plainly that runtime Google coverage depends on the provider key and match confidence.

- [ ] **Step 5: Run the directory tests**

Run: `npm test -- src/lib/directory/fiveTownsDirectory.test.js`

Expected: PASS with all static source-safety assertions.

- [ ] **Step 6: Commit**

```bash
git add src/data/fiveTownsDirectoryEnrichment.js src/lib/directory/fiveTownsDirectory.test.js docs/directory/five-towns-photo-audit.md
git commit -m "data: expand sourced Five Towns photos"
```

### Task 7: Document configuration and roadmap progress

**Files:**
- Modify: `.env.example`
- Create: `docs/operations/directory-photos.md`
- Modify: `internal/roadmap.js`

**Interfaces:**
- Documents: `GOOGLE_PLACES_API_KEY` as a Supabase secret, Places API (New) enablement, deployment, and verification.

- [ ] **Step 1: Document the server-only secret**

Add `GOOGLE_PLACES_API_KEY=` under a Supabase Edge Function secrets heading. Do not add a `VITE_` Google Places key.

- [ ] **Step 2: Add exact operations steps**

Document:

```bash
npx supabase secrets set GOOGLE_PLACES_API_KEY=... --project-ref uwbmfmtvjcnuuekiyogu
npx supabase functions deploy directory-photos --project-ref uwbmfmtvjcnuuekiyogu --use-api
```

Also document Google Places API (New) enablement, billing/quota monitoring, attribution checks, key restriction, provider-off fallback behavior, and rollback by disabling calls while retaining category artwork.

- [ ] **Step 3: Update the existing redesign roadmap entry**

Append the shipped photo-coverage progress to `screen-by-screen-world-class-redesign`. Keep `business-reviews` deferred and do not create a duplicate directory roadmap item.

- [ ] **Step 4: Verify roadmap prompts and documentation**

Run:

```bash
npm run check-prompts
git diff --check
```

Expected: all non-shipped roadmap entries have prompts and no whitespace errors.

- [ ] **Step 5: Commit**

```bash
git add .env.example docs/operations/directory-photos.md internal/roadmap.js
git commit -m "docs: add directory photo operations"
```

### Task 8: Full verification, deployment attempt, and push

**Files:**
- Verify all modified files.

**Interfaces:**
- Produces: tested branch pushed to PR #17 and a documented provider activation state.

- [ ] **Step 1: Run complete automated verification**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run check-style
npm run check-prompts
npm run build
npx --yes deno test supabase/functions/directory-photos/handler_test.ts
npx --yes deno check supabase/functions/directory-photos/index.ts
```

Expected: zero test failures, zero lint/type errors, unchanged style ratchet, all roadmap prompts present, production build succeeds, and Deno checks pass.

- [ ] **Step 2: Run the JUnited self-check**

Audit repository state, routes, direct table access, mutation safety, component reuse, style tokens, empty/error states, accessibility, and future-roadmap implications. Do not alter unrelated user changes.

- [ ] **Step 3: Verify browser behavior**

At 390 × 844, open Home and the complete directory. Verify official images, Google images when configured, category fallbacks, attribution/source taps, image-failure fallback, horizontal rails, listing detail, and no page-level horizontal overflow or browser errors. Smoke-check 768, 1024, and 1440 widths.

- [ ] **Step 4: Attempt the protected function deployment**

Run:

```bash
npx supabase functions deploy directory-photos --project-ref uwbmfmtvjcnuuekiyogu --use-api
```

If Supabase authentication or the private key is unavailable, stop after preserving the honest fallback state and report the exact activation gap. Never expose or invent a credential.

- [ ] **Step 5: Push to the existing PR**

```bash
git push -u origin codex/smart-publishing-ai-admin
gh pr checks 17 --watch --interval 10
```

Expected: GitHub receives all commits and Vercel reports a successful preview build. Keep the worktree for PR iteration.
