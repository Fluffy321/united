# Five Towns Daily Dashboard and Directory Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the large Home introduction with a compact live Five Towns utility panel and enrich the sourced directory with official photos, transparent `Why go` guidance, and need-based local discovery.

**Architecture:** Keep `FiveTownsHomeDashboard` as the authenticated `/Feed` shell. Add a focused daily-information service and hook that compose existing Hebcal functions, Open-Meteo weather, current real posts, and an optional 511NY adapter without allowing one provider failure to break the others. Extend the existing normalized directory record and render enriched photo cards from the same directory source of truth rather than creating a duplicate discovery database.

**Tech Stack:** React 18, Vite 6, TanStack Query 5, Vitest 4, Tailwind CSS 3, existing Hebcal APIs, Open-Meteo, optional 511NY REST API.

## Global Constraints

- The primary design target is a 390 × 844 iPhone viewport.
- Keep `/Feed` as the authenticated Home route and keep the existing JUnited bottom navigation.
- Use only real posts, official public feeds, official photos, and source-linked directory facts.
- Never invent traffic incidents, local alerts, reviews, star ratings, engagement, or business popularity.
- Label editorial guidance `Why go`; never label it as a customer review.
- Show `Verified kosher` only when a current certification URL exists.
- Preserve all eight directory groups and keep every sourced listing searchable even without a photo.
- Broken photos use a category fallback and must not shift the layout.
- A failed provider must not remove successful weather, Jewish-time, solar-time, or directory data.
- A missing 511NY developer key produces an honest unavailable state and a direct 511NY link, never a false all-clear.
- Do not add new runtime dependencies.
- Preserve unrelated dirty Supabase files and stage only files named by each task.

---

## File structure

- `src/lib/directory/fiveTownsDirectory.js`: normalize image, source, editorial, tag, and featured metadata.
- `src/data/fiveTownsDirectory.json`: store official-photo and `Why go` enrichment on the existing listing records.
- `docs/directory/five-towns-source-audit.md`: record official image/editorial sources and checked dates.
- `src/services/fiveTownsDailyService.js`: fetch and normalize weather and optional 511NY events; compose existing Hebcal utilities.
- `src/services/fiveTownsDailyService.test.js`: provider normalization, geographic filtering, timeout, and failure tests.
- `src/hooks/useFiveTownsDaily.js`: independently query daily providers and expose partial success.
- `src/components/home/FiveTownsDailyPanel.jsx`: compact two-column daily panel.
- `src/components/home/FiveTownsDailyPanel.test.jsx`: daily panel rendering and honest-state contracts.
- `src/components/home/FeaturedPlaceCard.jsx`: official photo, `Why go`, tags, and fallback rendering.
- `src/components/home/UsefulNearbyCard.jsx`: photo-led need-based navigation card.
- `src/components/home/FiveTownsHomeDashboard.jsx`: approved section order and directory/detail navigation.
- `src/components/home/FiveTownsHomeDashboard.test.jsx`: final Home hierarchy and no-fake-content contract.
- `src/components/home/DirectoryListingCard.jsx`: photo thumbnail and `Why go` in directory results.
- `src/components/home/FiveTownsDirectory.jsx`: enriched full-screen listing detail.
- `src/components/home/FiveTownsDirectory.test.jsx`: photo, source, maps, and correction behavior.
- `src/pages/Feed.jsx`: pass real ranked alert posts and current Five Towns location into the dashboard.
- `.env.example`: document optional `VITE_511NY_API_KEY` without adding a value.
- `internal/roadmap.js`: mark the approved dashboard milestone as shipped.

---

### Task 1: Extend the directory contract for trusted enrichment

**Files:**
- Modify: `src/lib/directory/fiveTownsDirectory.js`
- Modify: `src/lib/directory/fiveTownsDirectory.test.js`

**Interfaces:**
- Consumes: raw JSON fields `image_url`, `image_source_url`, `image_source_label`, `why_go`, `tags`, `featured`, `last_checked`.
- Produces: normalized listing fields `imageUrl: string`, `imageSourceUrl: string`, `imageSourceLabel: string`, `whyGo: string`, `tags: string[]`, `featured: boolean`, `lastChecked: string`.
- Produces: `featuredDirectoryListings(listings, options): DirectoryListing[]`.

- [ ] **Step 1: Write failing normalization and trust tests**

Add tests that normalize a complete enriched record, strip an image whose source URL is missing, trim and deduplicate tags, and return only sourced featured records:

```js
it('normalizes trusted photo and editorial metadata', () => {
  const listing = normalizeDirectoryListing({
    id: 'grant-park',
    title: 'Grant Park',
    type: 'services',
    group_id: 'things-to-do',
    category_id: 'recreation',
    source_url: 'https://www.nassaucountyny.gov/2799/Grant-Park',
    image_url: 'https://www.nassaucountyny.gov/ImageRepository/Document?documentId=5199',
    image_source_url: 'https://www.nassaucountyny.gov/2799/Grant-Park',
    image_source_label: 'Nassau County Parks',
    why_go: 'Playgrounds, courts, walking paths, fishing, and a seasonal spray area.',
    tags: ['Kids', 'Free', 'Kids'],
    featured: true,
    last_checked: '2026-08-28',
  });
  expect(listing).toMatchObject({
    imageSourceLabel: 'Nassau County Parks',
    whyGo: 'Playgrounds, courts, walking paths, fishing, and a seasonal spray area.',
    tags: ['Kids', 'Free'],
    featured: true,
  });
});

it('does not expose an untraceable image', () => {
  const listing = normalizeDirectoryListing({
    id: 'unsafe-photo', title: 'Unsafe', type: 'services',
    source_url: 'https://example.com/place', image_url: 'https://example.com/photo.jpg',
  });
  expect(listing.imageUrl).toBe('');
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx vitest run src/lib/directory/fiveTownsDirectory.test.js`  
Expected: FAIL because the new fields, exported normalizer, and featured selector are missing.

- [ ] **Step 3: Implement minimal normalization and selector logic**

Export `normalizeDirectoryListing`, validate both image URLs with `isHttpUrl`, normalize unique string tags, and add:

```js
export function featuredDirectoryListings(listings, { groupId, limit = 12 } = {}) {
  return listings
    .filter((listing) => listing.featured && listing.sourceUrl)
    .filter((listing) => !groupId || listing.groupId === groupId)
    .slice(0, limit);
}
```

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `npx vitest run src/lib/directory/fiveTownsDirectory.test.js`  
Expected: all directory model tests pass.

- [ ] **Step 5: Commit the directory contract**

```bash
git add src/lib/directory/fiveTownsDirectory.js src/lib/directory/fiveTownsDirectory.test.js
git commit -m "feat: add trusted directory enrichment fields"
```

---

### Task 2: Add sourced Five Towns photos and useful place metadata

**Files:**
- Modify: `src/data/fiveTownsDirectory.json`
- Modify: `docs/directory/five-towns-source-audit.md`
- Test: `src/lib/directory/fiveTownsDirectory.test.js`

**Interfaces:**
- Consumes: Task 1 normalized enrichment fields.
- Produces: at least 12 immediately visible enriched records and at least 35 enriched records across the full dataset.

- [ ] **Step 1: Add failing data-quality assertions**

Add assertions that enriched records have paired image/source URLs, nonempty `whyGo`, 1–5 tags, and coverage across food, Jewish life, shopping, family, and things to do:

```js
it('ships a useful first pass of traceable featured places', () => {
  const featured = featuredDirectoryListings(FIVE_TOWNS_LISTINGS, { limit: 100 });
  expect(featured.length).toBeGreaterThanOrEqual(35);
  expect(featured.every((item) => item.whyGo && item.tags.length > 0)).toBe(true);
  expect(featured.filter((item) => item.imageUrl).every((item) => item.imageSourceUrl)).toBe(true);
  const groups = new Set(featured.map((item) => item.groupId));
  expect(['food', 'jewish-life', 'shopping', 'family', 'things-to-do']
    .every((groupId) => groups.has(groupId))).toBe(true);
});
```

- [ ] **Step 2: Run the data-quality test and confirm RED**

Run: `npx vitest run src/lib/directory/fiveTownsDirectory.test.js`  
Expected: FAIL because current records do not contain the enrichment fields.

- [ ] **Step 3: Enrich the first 35 high-confidence records**

Add official photos where available and category fallbacks where they are not. Prioritize:

- Food: Anju, Cork & Slice, Central Pizza, Bagel Boys, Bean & Berry, Bellagio, Burger Spot, Cafe Chocolat, Seasons Express, Gourmet Glatt, Bingo, Patis.
- Things to do: Grant Park, North Woodmere Park, Cedarhurst Memorial Plaza/Andrew J. Parise Park, Inwood Park.
- Jewish life: major shuls and Gural JCC where official photography is published.
- Shopping: Cedarhurst official business-directory entries with official business websites.
- Family: official school or community-program photos from the organization websites.

Every enriched record includes an ISO checked date and a fact-based `why_go`. Do not write qualitative food/service claims.

- [ ] **Step 4: Record every enrichment source**

Extend the audit table with listing ID, listing source, image publisher, image source URL, checked date, and any kosher-certification source.

- [ ] **Step 5: Run data-quality tests and confirm GREEN**

Run: `npx vitest run src/lib/directory/fiveTownsDirectory.test.js`  
Expected: all tests pass with at least 35 featured records.

- [ ] **Step 6: Commit sourced data**

```bash
git add src/data/fiveTownsDirectory.json docs/directory/five-towns-source-audit.md src/lib/directory/fiveTownsDirectory.test.js
git commit -m "data: enrich Five Towns featured places"
```

---

### Task 3: Build independent daily information providers

**Files:**
- Create: `src/services/fiveTownsDailyService.js`
- Create: `src/services/fiveTownsDailyService.test.js`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `getZmanim(lat, lng, date, tzid)` and `getShabbatTimes(lat, lng, date, tzid, offset, havdalahMinutes)` from `src/lib/hebrewDate.js`.
- Produces: `FIVE_TOWNS_DEFAULT_LOCATION` with Woodmere coordinates and `America/New_York`.
- Produces: `fetchFiveTownsWeather({ fetchImpl, signal }): Promise<WeatherResult>`.
- Produces: `fetchFiveTownsTraffic({ fetchImpl, apiKey, signal }): Promise<TrafficResult>`.
- Produces: `fetchFiveTownsJewishTimes({ date, location }): Promise<JewishTimesResult>`.
- Produces: `nearFiveTowns(event, radiusMiles): boolean` using coordinates and a Haversine distance.

- [ ] **Step 1: Write failing provider tests**

Cover Open-Meteo normalization, Hebcal partial success, Nassau/Five Towns traffic filtering, missing 511NY key, empty incidents, and fetch errors:

```js
it('never reports an all-clear when 511NY is not configured', async () => {
  await expect(fetchFiveTownsTraffic({ apiKey: '' })).resolves.toMatchObject({
    status: 'unavailable',
    incidents: [],
    sourceUrl: 'https://511ny.org/',
  });
});

it('keeps only active events near the Five Towns', async () => {
  const fetchImpl = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      { ID: 1, County: 'Nassau', Latitude: 40.63, Longitude: -73.71, EventType: 'accidentsAndIncidents', Description: 'Crash' },
      { ID: 2, County: 'Albany', Latitude: 42.65, Longitude: -73.75, EventType: 'roadwork', Description: 'Work' },
    ],
  });
  const result = await fetchFiveTownsTraffic({ fetchImpl, apiKey: 'test' });
  expect(result.incidents.map((item) => item.id)).toEqual(['1']);
});
```

- [ ] **Step 2: Run provider tests and confirm RED**

Run: `npx vitest run src/services/fiveTownsDailyService.test.js`  
Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement provider adapters**

Use Open-Meteo current conditions with fixed Five Towns coordinates. Wrap each request with `AbortSignal.timeout(8000)` when no signal is passed. Normalize provider results to:

```js
{
  status: 'ready' | 'empty' | 'unavailable',
  updatedAt: string,
  sourceLabel: string,
  sourceUrl: string,
  data: object,
}
```

For 511NY call `https://511ny.org/api/v2/get/event?key=...&format=json`, filter by geographic radius, and expose only accidents/incidents, closures, and roadwork. Read the key from `import.meta.env.VITE_511NY_API_KEY`; never log it or render it.

- [ ] **Step 4: Document the optional traffic key**

Add only the variable name and purpose to `.env.example`:

```dotenv
# Optional: enables live nearby incidents from the official 511NY developer API.
VITE_511NY_API_KEY=
```

- [ ] **Step 5: Run provider tests and confirm GREEN**

Run: `npx vitest run src/services/fiveTownsDailyService.test.js`  
Expected: all provider tests pass.

- [ ] **Step 6: Commit the provider layer**

```bash
git add src/services/fiveTownsDailyService.js src/services/fiveTownsDailyService.test.js .env.example
git commit -m "feat: add Five Towns daily data providers"
```

---

### Task 4: Add the partial-success daily hook and panel

**Files:**
- Create: `src/hooks/useFiveTownsDaily.js`
- Create: `src/components/home/FiveTownsDailyPanel.jsx`
- Create: `src/components/home/FiveTownsDailyPanel.test.jsx`

**Interfaces:**
- Consumes: Task 3 provider functions.
- Consumes: `posts: UnifiedPost[]` for real JUnited traffic/safety posts.
- Produces: `useFiveTownsDaily({ posts, location }): { weather, jewishTimes, traffic, localAlerts, isRefreshing, refresh }`.
- Produces: `<FiveTownsDailyPanel daily={...} onOpenCalendar onOpenAlerts onRetry />`.

- [ ] **Step 1: Write failing panel contract tests**

Test ready values, partial failure, missing traffic key, a real post alert, and no verified alerts:

```jsx
it('shows useful successful data when traffic is unavailable', () => {
  const html = renderToStaticMarkup(<FiveTownsDailyPanel daily={{
    weather: { status: 'ready', temperature: 75, summary: 'Partly sunny' },
    jewishTimes: { status: 'ready', candleLighting: '2026-08-28T19:15:00-04:00', havdalah: '2026-08-29T20:14:00-04:00', sunrise: '2026-08-28T06:12:00-04:00', sunset: '2026-08-28T19:33:00-04:00' },
    traffic: { status: 'unavailable', incidents: [] },
    localAlerts: [],
  }} />);
  expect(html).toContain('75°');
  expect(html).toContain('Candle lighting');
  expect(html).toContain('Live traffic unavailable');
  expect(html).not.toContain('No major nearby incidents');
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx vitest run src/components/home/FiveTownsDailyPanel.test.jsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the hook and compact panel**

Use independent TanStack queries and stable query keys. Format times in `America/New_York`. The panel renders four tappable cells—weather, Shabbat, sunrise/sunset, alerts—and a quiet or unavailable status row underneath.

- [ ] **Step 4: Run panel tests and confirm GREEN**

Run: `npx vitest run src/components/home/FiveTownsDailyPanel.test.jsx`  
Expected: all panel tests pass.

- [ ] **Step 5: Commit the daily panel**

```bash
git add src/hooks/useFiveTownsDaily.js src/components/home/FiveTownsDailyPanel.jsx src/components/home/FiveTownsDailyPanel.test.jsx
git commit -m "feat: add compact Five Towns daily panel"
```

---

### Task 5: Build reusable photo-led place cards

**Files:**
- Create: `src/components/home/FeaturedPlaceCard.jsx`
- Create: `src/components/home/UsefulNearbyCard.jsx`
- Create: `src/components/home/FeaturedPlaceCard.test.jsx`
- Modify: `src/components/home/DirectoryListingCard.jsx`
- Modify: `src/components/home/FiveTownsDirectory.jsx`
- Modify: `src/components/home/FiveTownsDirectory.test.jsx`

**Interfaces:**
- Consumes: enriched `DirectoryListing` from Task 1.
- Produces: `<FeaturedPlaceCard listing onOpen />` and `<UsefulNearbyCard title eyebrow detail imageUrl imageSourceUrl onOpen />`.
- Produces: directory result and detail states that show a photo only when its source is traceable.

- [ ] **Step 1: Write failing card and directory tests**

Test official photo rendering, `Why go`, source label, fallback rendering, maps, kosher verification, and correction control.

```jsx
it('falls back without presenting an untrusted image', () => {
  const html = renderToStaticMarkup(<FeaturedPlaceCard listing={{
    name: 'Grant Park', groupId: 'things-to-do', imageUrl: '',
    whyGo: 'Playgrounds and walking paths.', tags: ['Kids'],
  }} />);
  expect(html).toContain('Playgrounds and walking paths.');
  expect(html).toContain('Kids');
  expect(html).not.toContain('<img');
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx vitest run src/components/home/FeaturedPlaceCard.test.jsx src/components/home/FiveTownsDirectory.test.jsx`  
Expected: FAIL because enriched cards are not implemented.

- [ ] **Step 3: Implement fixed-aspect photo cards and fallback**

Use `aspect-[16/9]`, `object-cover`, lazy loading, explicit width/height, an `onError` state that hides the broken image, visible focus rings, and no hover-only actions.

- [ ] **Step 4: Enrich the directory result and detail screens**

Show thumbnail/fallback, `Why go`, tags, official photo source, business source, kosher source, and existing maps. Keep the full-screen portal behavior.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `npx vitest run src/components/home/FeaturedPlaceCard.test.jsx src/components/home/FiveTownsDirectory.test.jsx`  
Expected: all card and directory tests pass.

- [ ] **Step 6: Commit the photo UI**

```bash
git add src/components/home/FeaturedPlaceCard.jsx src/components/home/UsefulNearbyCard.jsx src/components/home/FeaturedPlaceCard.test.jsx src/components/home/DirectoryListingCard.jsx src/components/home/FiveTownsDirectory.jsx src/components/home/FiveTownsDirectory.test.jsx
git commit -m "feat: add sourced photo-led directory cards"
```

---

### Task 6: Assemble the approved Home dashboard

**Files:**
- Modify: `src/components/home/FiveTownsHomeDashboard.jsx`
- Modify: `src/components/home/FiveTownsHomeDashboard.test.jsx`
- Modify: `src/pages/Feed.jsx`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: final `/Feed` section order: header/search, daily panel, directory grid, places rail, useful-nearby cards, existing lower community sections, publish action, bottom navigation.

- [ ] **Step 1: Rewrite the hierarchy test to match the locked design**

Assert the large introduction is gone and the new order exists:

```jsx
expect(html).not.toContain('Everything local, without the noise.');
expect(html).toContain('Five Towns today');
expect(html).toContain('Jewish directory');
expect(html).toContain('Places worth knowing');
expect(html).toContain('What do you need?');
expect(html.indexOf('Five Towns today')).toBeLessThan(html.indexOf('Jewish directory'));
expect(html.indexOf('Jewish directory')).toBeLessThan(html.indexOf('Places worth knowing'));
```

- [ ] **Step 2: Run the dashboard test and confirm RED**

Run: `npx vitest run src/components/home/FiveTownsHomeDashboard.test.jsx`  
Expected: FAIL because the old blue introduction still renders.

- [ ] **Step 3: Implement the approved dashboard order**

Remove the large blue introduction and obsolete duplicate `Picked for you` cards. Render:

- `FiveTownsDailyPanel`
- existing eight-group directory grid
- horizontally scrollable `FeaturedPlaceCard` rail
- useful-nearby cards for kids, calm hour, full afternoon, tonight, and visiting guests

Keep lower real-post, communities, Jewish-life, opportunity, help, directory, and publish sections unless they duplicate one of the new sections.

- [ ] **Step 4: Pass real posts and location through Feed**

Pass only already ranked and preference-allowed posts into the dashboard. Derive `localAlerts` from real post types/subtypes and let the daily hook combine those with 511NY incidents.

- [ ] **Step 5: Run dashboard tests and confirm GREEN**

Run: `npx vitest run src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.test.jsx`  
Expected: dashboard and Feed tests pass with no fake activity.

- [ ] **Step 6: Commit the assembled Home screen**

```bash
git add src/components/home/FiveTownsHomeDashboard.jsx src/components/home/FiveTownsHomeDashboard.test.jsx src/pages/Feed.jsx
git commit -m "feat: ship Five Towns daily Home dashboard"
```

---

### Task 7: Roadmap, full verification, iPhone review, and push

**Files:**
- Modify: `internal/roadmap.js`

**Interfaces:**
- Consumes: completed Tasks 1–6.
- Produces: a verified branch update on `origin/codex/smart-publishing-ai-admin` and the existing pull request.

- [ ] **Step 1: Mark the milestone in the roadmap**

Add a shipped milestone describing the compact live daily panel, official-photo directory enrichment, `Why go`, useful-nearby navigation, and the remaining external 511NY key requirement.

- [ ] **Step 2: Run focused verification**

Run:

```bash
npx vitest run \
  src/lib/directory/fiveTownsDirectory.test.js \
  src/services/fiveTownsDailyService.test.js \
  src/components/home/FiveTownsDailyPanel.test.jsx \
  src/components/home/FeaturedPlaceCard.test.jsx \
  src/components/home/FiveTownsDirectory.test.jsx \
  src/components/home/FiveTownsHomeDashboard.test.jsx
```

Expected: all focused tests pass.

- [ ] **Step 3: Run the full repository gates**

Run:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm run check-style
npm run check-jewish-hub
npm run check-prompts
```

Expected: every command exits 0.

- [ ] **Step 4: Run JUnited self-check**

Apply the `junited-self-check` skill to the completed diff. Preserve unrelated Supabase changes and resolve any blocker introduced by this implementation.

- [ ] **Step 5: Verify responsive behavior in the real app**

Open `/Feed` at 390 × 844, then check 768, 1024, and 1440 widths for horizontal overflow. At iPhone size verify:

- daily values and honest provider failure states
- directory group opening
- featured card swipe and detail opening
- official photo source
- `Why go`
- Google, Apple, and Waze actions
- correction feedback opening
- bottom navigation not covering content

Return the visible browser to 390 × 844.

- [ ] **Step 6: Commit roadmap and any final fixes**

```bash
git add internal/roadmap.js
git commit -m "docs: record Five Towns dashboard milestone"
```

- [ ] **Step 7: Push the branch**

```bash
git push -u origin codex/smart-publishing-ai-admin
```

Expected: the remote branch and existing pull request contain every implementation commit.
