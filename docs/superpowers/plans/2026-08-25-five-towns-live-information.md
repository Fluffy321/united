# Five Towns Live Information Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically publish fresh, source-backed Five Towns information into the existing personalized JUnited dashboard.

**Architecture:** Extend the existing `ingest-local-updates` Edge Function with a small pure publication-policy module, seed only verified public sources through an additive migration, and let the existing Feed ranking consume the resulting official posts. Add source-link behavior to Feed cards without changing the approved dashboard structure.

**Tech Stack:** React 18, Vite, Vitest, Supabase Edge Functions, Postgres, pg_cron, pg_net, Supabase Vault.

## Global Constraints

- Preserve the approved Home Priority Stack and Live Category Deck.
- Public HTTPS sources only.
- Maximum four automatically published new items per source per run.
- Maximum automatic age is seven days.
- Every automatic post must retain source name, URL, and verification time.
- Do not stage the pre-existing untracked Supabase scaffold or its migration.
- Do not test migrations against production.

---

### Task 1: Automatic publication policy

**Files:**
- Create: `supabase/functions/ingest-local-updates/local-update-policy.js`
- Create: `supabase/functions/ingest-local-updates/local-update-policy.test.js`
- Modify: `supabase/functions/ingest-local-updates/index.ts`

**Interfaces:**
- Produces: `selectAutoPublishCandidates(items, now, limit)` and `buildAutomatedPost(item, community, now)`.
- Consumes: newly inserted `local_update_items` rows and existing community identity.

- [ ] **Step 1: Write failing policy tests**

Test that candidates are newest-first, at most four, and no older than seven days. Test that created posts include `post_kind: 'local_update'`, `verified: true`, `trust_status: 'verified_source'`, a unique `local-update:<item-id>` origin, source metadata, Five Towns location, and an alert subtype only for severe/immediate NWS alerts.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run supabase/functions/ingest-local-updates/local-update-policy.test.js`

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement the pure policy module**

Implement the two exports with a seven-day cutoff and four-item default limit. Build a short body from description, category, source name, and source URL; never copy `raw_payload` content into the post.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run supabase/functions/ingest-local-updates/local-update-policy.test.js`

Expected: PASS.

- [ ] **Step 5: Connect policy to ingestion**

Change the upsert `.select()` to return the inserted rows. For auto-publish sources, load the source community identity, build at most four posts from newly inserted eligible rows, insert each post with the service-role client, and update its queue item to `published` with `published_post_id` and timestamps. On failure, preserve `pending` status and add a non-sensitive error to the function summary.

- [ ] **Step 6: Run focused and existing tests**

Run: `npx vitest run supabase/functions/ingest-local-updates/local-update-policy.test.js src/lib/feed/homePriority.test.js src/lib/feed/briefRanking.test.js`

Expected: PASS.

### Task 2: Verified source registry and schedule

**Files:**
- Create: `supabase/migrations/<generated>_five_towns_live_information.sql`
- Create: `supabase/tests/five_towns_live_information.test.sql` only if the existing Supabase test scaffold is already tracked; otherwise keep SQL assertions documented in the migration plan and do not mix with the unrelated untracked scaffold.

**Interfaces:**
- Produces: enabled, auto-publish source rows for the Five Towns community and a 30-minute cron invocation.
- Consumes: existing `local_update_sources`, `verify_local_updates_cron_secret`, Vault `SUPABASE_URL`, `SERVICE_ROLE_KEY`, and `local_updates_cron_secret`.

- [ ] **Step 1: Generate a migration filename with the CLI**

Run: `npx supabase migration new five_towns_live_information`

Expected: one new timestamped migration file.

- [ ] **Step 2: Add the verified sources**

Add the `post_subtype`, `category`, and `urgency` post fields already consumed by the Feed when they are absent, then upsert The 5T Brief, Cedarhurst news, Cedarhurst events, JCCRP events, Hempstead news, Hempstead alerts, NWS Nassau alerts, and Vaad news. Set `requires_review=false` and `auto_publish=true`; preserve the unique `(community_id, source_url)` key.

- [ ] **Step 3: Add the recurring job**

Unschedule an existing `five-towns-live-information` job when present, then schedule `*/30 * * * *` with `net.http_post`. Read URL and secrets from Vault and call `/functions/v1/ingest-local-updates` with the server-only headers.

- [ ] **Step 4: Validate migration statically**

Run: `npx supabase --version` and `npx supabase migration list --local` when a local database is available. If no local database runtime exists, record that exact verification limit and do not apply against production.

### Task 3: Source-first card opening and product truth

**Files:**
- Modify: `src/pages/Feed.jsx`
- Modify: `src/pages/Feed.contract.test.jsx`
- Modify: `internal/roadmap.js`

**Interfaces:**
- Consumes: `source_url` on automated posts.
- Produces: external source opening for sourced posts and existing behavior for user posts.

- [ ] **Step 1: Write the failing Feed contract test**

Assert that `handleCardOpen` checks `post.source_url` and opens it with `noopener,noreferrer` before normal help/event/composer routing.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/pages/Feed.contract.test.jsx`

Expected: FAIL because source-first opening is absent.

- [ ] **Step 3: Implement source-first opening**

Add a small callback branch using `window.open(post.source_url, '_blank', 'noopener,noreferrer')`. Do not change the dashboard structure.

- [ ] **Step 4: Update roadmap truthfully**

Expand the shipped Five Towns automation note with the verified source registry, automatic publication limits, and source-link behavior. Do not mark the separate national Jewish news item shipped.

- [ ] **Step 5: Run full verification**

Run: `npm run lint`, `npm run test`, `npm run typecheck`, `npm run check-prompts`, `npm run check-style`, `npm run check-jewish-hub`, and `npm run build`.

Expected: all commands exit 0. Then run the complete read-only JUnited self-check and record any environment-only migration limitation.
