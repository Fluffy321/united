# Smart Publishing and AI Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every signed-in JUnited user one simple, iPhone-first way to publish useful local content immediately while a real AI-assisted admin system safely reviews, routes, expires, and—only for clear high-risk cases—temporarily hides it for Aryeh or Jonny to decide.

**Architecture:** A shared publishing taxonomy and form contract feed one authenticated Supabase Edge Function. That function validates identity, audience, membership, rate limits, and idempotency before routing each submission into JUnited's existing native tables (`posts`, `community_events`, `mitzvah_requests`, and pending business verification) and adding a moderation job. A separate worker uses deterministic safety rules plus OpenAI moderation/classification; normal content stays live, high-risk content can be temporarily hidden, and every AI or human action is auditable and appealable.

**Tech Stack:** React 18, Vite 6, JavaScript/JSX, Tailwind CSS, TanStack Query, Supabase Postgres/Auth/Edge Functions, Deno TypeScript, OpenAI Moderation and Responses APIs, Vitest, Playwright-compatible browser verification, Vercel.

## Global Constraints

- Preserve JUnited's existing screens, routes, native records, and verified directory data; this is an upgrade, not a rewrite.
- Design and test at a 390 × 844 iPhone viewport first; all tap targets must be at least 44 × 44 CSS pixels and the page must never scroll sideways.
- A signed-in user's verified auth identity is required for publishing. Never authorize with editable `user_metadata`.
- Normal posts publish immediately. AI review is asynchronous and cannot make a safe post wait for approval.
- Only obvious or high-confidence safety risk may be temporarily hidden automatically. AI cannot permanently delete content, ban users, verify facts, or make a final appeal decision.
- Aryeh and Jonny are the initial human platform admins. Existing `public.is_admin()` remains the source of truth.
- Sensitive Help posts may hide the author's name from the public, but admins must retain access to the real author.
- The default audience is the user's local area. A joined community can be chosen, and server-side membership must be verified.
- Directory facts may only change through the existing pending business verification workflow.
- Every submission must be idempotent, rate-limited, auditable, and assigned an explicit expiration policy.
- OpenAI and moderation-worker outages must be retryable; they must not block safe publishing.
- All exposed database tables require RLS, explicit grants, indexes, and policy tests.
- No fake activity, invented urgency, or fabricated source verification may appear in UI, seeds, tests, or production data.

## File Map

- `src/lib/publishing/publishingTypes.js` — canonical client taxonomy, groups, fields, expiry defaults, labels, and destination names.
- `src/lib/publishing/publishingDraft.js` — draft defaults, conditional-field validation, preview model, and request serialization.
- `src/services/publishingService.js` — typed client boundary for publish/list/update/end/appeal/admin actions.
- `src/pages/Publish.jsx` — full-screen iPhone publisher and My Publishing view.
- `src/components/publishing/PublishingTypePicker.jsx` — six friendly groups and the complete 26-type picker.
- `src/components/publishing/PublishingForm.jsx` — dynamic fields, audience, privacy, expiry, and source controls.
- `src/components/publishing/PublishingPreview.jsx` — exact pre-publish preview and immediate-publish confirmation.
- `src/components/publishing/MyPublishing.jsx` — edit, end, duplicate, moderation state, and appeal entry.
- `src/components/publishing/ModerationStatus.jsx` — shared plain-language status chip and explanation.
- `supabase/functions/_shared/publishing.ts` — server taxonomy, auth-derived identity, validation, destination adapter, and idempotency types.
- `supabase/functions/publish-content/index.ts` — authenticated publish/update/end/list endpoint.
- `supabase/functions/process-moderation-queue/index.ts` — protected worker endpoint for AI review and expiration batches.
- `supabase/functions/_shared/moderation.ts` — deterministic checks, OpenAI calls, decision policy, retry handling, and audit payloads.
- `src/pages/AdminModerationQueue.jsx` — current queue upgraded with AI review, health, decision, and appeal tabs.
- `src/components/moderation/AiReviewCard.jsx` — evidence-first moderation item.
- `src/components/moderation/AppealCard.jsx` — human appeal decision card.
- `supabase/migrations/20260818*_smart_publishing_*.sql` — publishing metadata, RPCs, jobs, appeals, RLS, grants, triggers, and cron.
- `internal/roadmap.js` — mark shipped stages only after production verification.

---

## Release 1 — One Real Publisher

### Task 1: Lock the Publishing Contract

**Files:**
- Create: `src/lib/publishing/publishingTypes.js`
- Create: `src/lib/publishing/publishingTypes.test.js`
- Create: `src/lib/publishing/publishingDraft.js`
- Create: `src/lib/publishing/publishingDraft.test.js`

**Interfaces:**
- Produces: `PUBLISHING_GROUPS`, `PUBLISHING_TYPES`, `getPublishingType(typeId)`, `getExpirationOptions(typeId)`, `createPublishingDraft(typeId, userContext)`, `validatePublishingDraft(draft)`, `toPublishCommand(draft, submissionKey)`.
- `toPublishCommand` returns `{ submissionKey, publishingType, audience: { scope, communityId, network }, content, source, privacy, expiresAt }`.

- [ ] **Step 1: Write taxonomy tests for all approved types**

```js
import { describe, expect, it } from 'vitest';
import { PUBLISHING_GROUPS, PUBLISHING_TYPES, getPublishingType } from './publishingTypes';

it('exposes six groups and exactly twenty-six unique types', () => {
  expect(PUBLISHING_GROUPS).toHaveLength(6);
  expect(new Set(PUBLISHING_TYPES.map((type) => type.id)).size).toBe(26);
});

it.each(['local_news', 'event', 'help_need', 'job', 'business_update'])('%s has routing and expiry', (id) => {
  expect(getPublishingType(id)).toMatchObject({ id, destination: expect.any(String) });
  expect(getPublishingType(id).expiration.defaultHours).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/lib/publishing/publishingTypes.test.js src/lib/publishing/publishingDraft.test.js`

Expected: FAIL because both modules do not exist.

- [ ] **Step 3: Implement the exact approved taxonomy and draft rules**

Use these IDs without renaming them: `local_news`, `urgent_safety`, `weather`, `road_traffic`, `school_update`, `community_announcement`, `minyan_zmanim`, `shiur_learning`, `simcha`, `funeral_shiva_tehillim`, `event`, `casual_plan`, `youth_activity`, `help_need`, `help_offer`, `ride_carpool`, `lost_found`, `volunteer`, `job`, `housing`, `giveaway`, `sale`, `business_opening`, `business_update`, `kosher_menu_update`, `local_deal`. Map each to one of `post`, `event`, `help`, `marketplace`, or `business_submission`, and encode the fields and expiry defaults from the approved design spec.

- [ ] **Step 4: Add validation and serialization tests**

```js
it('requires a source for local news but not for a casual plan', () => {
  expect(validatePublishingDraft(createPublishingDraft('local_news', context)).errors.sourceUrl).toBeTruthy();
  expect(validatePublishingDraft({ ...createPublishingDraft('casual_plan', context), title: 'Pickup basketball', startsAt: future })).toEqual({ valid: true, errors: {} });
});

it('never serializes a public anonymous identity', () => {
  const command = toPublishCommand({ ...validHelpDraft, publicAuthorHidden: true }, 'submission-1');
  expect(command.privacy.publicAuthorHidden).toBe(true);
  expect(command).not.toHaveProperty('authorId');
});
```

- [ ] **Step 5: Run focused and full tests**

Run: `npm test -- src/lib/publishing/publishingTypes.test.js src/lib/publishing/publishingDraft.test.js && npm run typecheck`

Expected: PASS with 26 unique types and no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/publishing
git commit -m "feat: define smart publishing contract"
```

### Task 2: Add Secure Publishing Storage and RPCs

**Files:**
- Create: `supabase/migrations/<timestamp>_smart_publishing_foundation.sql` using `supabase migration new smart_publishing_foundation`
- Create: `supabase/tests/smart_publishing_foundation.sql`

**Interfaces:**
- Produces common columns on `posts`, `community_events`, and `mitzvah_requests`: `publishing_type text`, `network text`, `audience_scope text`, `expires_at timestamptz`, `submission_key uuid`, `moderation_status text`, `trust_status text`, `source_name text`, `source_url text`, `public_author_hidden boolean` where not already present.
- Produces RPCs: `publish_content(jsonb) returns jsonb`, `update_published_content(uuid,jsonb) returns jsonb`, `end_published_content(uuid) returns void`, `list_my_publishing(integer,timestamptz) returns setof jsonb`.

- [ ] **Step 1: Generate the migration and write pgTAP-style policy tests first**

The SQL tests must prove: unauthenticated calls fail; a user cannot publish as another user; a non-member cannot target a community; duplicate `submission_key` returns the original record; ordinary users cannot set `moderation_status`; owners can edit/end their active records; and admins can read hidden author identity.

- [ ] **Step 2: Run the database tests and verify RED**

Run: `supabase db start && supabase test db supabase/tests/smart_publishing_foundation.sql`

Expected: FAIL because the columns and RPCs do not exist.

- [ ] **Step 3: Implement metadata, constraints, indexes, and RLS**

Add check constraints for the 26 type IDs, audience scopes (`area`, `community`), moderation states (`pending`, `clear`, `needs_review`, `temporarily_hidden`, `restored`, `removed`), and trust states (`community_submitted`, `source_linked`, `verified`). Add unique partial indexes on `(created_by_user_id, submission_key)` or the native creator equivalent. Keep real author IDs in native owner columns; expose `public_author_hidden` only as presentation metadata.

- [ ] **Step 4: Implement one security-definer routing RPC**

`publish_content` must derive `auth.uid()`, read the profile/network server-side, verify community membership, validate allowed fields, apply a per-user rolling rate limit, calculate bounded expiry, route atomically to the native table, create an event discovery post when needed, create a pending business listing submission when needed, insert a moderation job, and return `{ contentId, contentType, feedPostId, moderationStatus, expiresAt, duplicate }`. Set a fixed `search_path`, revoke execution from `public`, then grant only to `authenticated`.

- [ ] **Step 5: Reset and run all SQL tests**

Run: `supabase db reset && supabase test db supabase/tests/smart_publishing_foundation.sql`

Expected: PASS; repeated submission key returns one native row and one moderation job.

- [ ] **Step 6: Run Supabase advisors locally**

Run: `supabase inspect db table-sizes && supabase db lint`

Expected: no new RLS, unsafe search-path, or missing-index errors.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations supabase/tests
git commit -m "feat: add secure smart publishing foundation"
```

### Task 3: Expose One Authenticated Publishing Endpoint

**Files:**
- Create: `supabase/functions/_shared/publishing.ts`
- Create: `supabase/functions/_shared/publishing_test.ts`
- Create: `supabase/functions/publish-content/index.ts`
- Create: `supabase/functions/publish-content/index_test.ts`
- Create or modify: `supabase/config.toml`

**Interfaces:**
- Consumes: `publish_content`, `update_published_content`, `end_published_content`, and `list_my_publishing` RPCs.
- Produces: `POST /publish-content` operations `publish`, `update`, `end`, and `listMine` with JSON responses and stable error codes.

- [ ] **Step 1: Write unit tests for JWT forwarding and command rejection**

Tests must cover missing bearer token → 401, malformed operation → 400, publish → calls `publish_content`, update/end → owner RPCs, and listMine → cursor RPC. Mock the Supabase client; never accept a user ID from request JSON.

- [ ] **Step 2: Run Deno tests and verify RED**

Run: `deno test supabase/functions/_shared/publishing_test.ts supabase/functions/publish-content/index_test.ts --allow-env`

Expected: FAIL because handlers do not exist.

- [ ] **Step 3: Implement the handler**

Create the user-scoped Supabase client with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the request Authorization header so RLS sees the caller. Return CORS headers, JSON content type, stable codes (`UNAUTHENTICATED`, `INVALID_COMMAND`, `NOT_A_MEMBER`, `RATE_LIMITED`, `PUBLISH_FAILED`), and no internal SQL details.

- [ ] **Step 4: Run Deno tests**

Run: `deno test supabase/functions/_shared/publishing_test.ts supabase/functions/publish-content/index_test.ts --allow-env`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/publishing.ts supabase/functions/_shared/publishing_test.ts supabase/functions/publish-content supabase/config.toml
git commit -m "feat: expose authenticated publishing endpoint"
```

### Task 4: Build the iPhone Smart Publisher

**Files:**
- Create: `src/services/publishingService.js`
- Create: `src/services/publishingService.test.js`
- Create: `src/pages/Publish.jsx`
- Create: `src/pages/Publish.test.jsx`
- Create: `src/components/publishing/PublishingTypePicker.jsx`
- Create: `src/components/publishing/PublishingForm.jsx`
- Create: `src/components/publishing/PublishingPreview.jsx`
- Create: `src/components/publishing/ModerationStatus.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Produces `publishingService.publish(command)`, `.update(id, command)`, `.end(id)`, `.listMine(cursor)`, `.appeal(id, reason)`.
- Produces protected route `/Publish`; supports query parameters `type`, `community`, and `mode=mine`.

- [ ] **Step 1: Write service and screen behavior tests**

Tests must prove the service calls `supabase.functions.invoke('publish-content')`, forwards no author ID, preserves the submission key on retry, shows six groups/26 types, defaults to local area, only lists joined communities, blocks invalid preview, changes button text to `Publish now`, and shows a success state with `View post` and `Post another`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/services/publishingService.test.js src/pages/Publish.test.jsx`

Expected: FAIL because the publisher does not exist.

- [ ] **Step 3: Implement the client service**

Use the current Supabase session automatically. Translate stable endpoint codes into plain messages: `Please sign in again`, `Join that community before posting there`, `You’re posting too quickly—try again shortly`, and `We couldn’t publish that. Your draft is still here.`

- [ ] **Step 4: Implement the screen as four clear steps**

The header reads `Create`; steps are `Choose`, `Details`, `Preview`, `Done`. The picker shows six compact groups and up to four remembered shortcuts, without a search field. The form renders only fields declared by the chosen type. Preview shows the exact card, audience, public identity state, source label, and expiration. Preserve drafts in `sessionStorage` until success. Disable double taps and reuse the same UUID submission key for retries.

- [ ] **Step 5: Add `/Publish` without the normal bottom bar**

Lazy-load `Publish` in `src/App.jsx`, wrap it with `ProtectedRoute`, `PageTransition`, and `AppErrorBoundary`, and let its own back button return to the source page.

- [ ] **Step 6: Run tests and mobile accessibility checks**

Run: `npm test -- src/services/publishingService.test.js src/pages/Publish.test.jsx && npm run lint && npm run typecheck`

Expected: PASS; no unlabeled controls and no target below 44px in publisher tests.

- [ ] **Step 7: Commit**

```bash
git add src/services/publishingService* src/pages/Publish* src/components/publishing src/App.jsx
git commit -m "feat: build iPhone smart publisher"
```

### Task 5: Make the Publisher the App's One Creation Entry

**Files:**
- Modify: `src/components/feed/HomeContributionEntry.jsx`
- Modify: `src/components/feed/HomeContributionEntry.test.jsx`
- Modify: `src/pages/Feed.jsx`
- Modify: `src/pages/Feed.contract.test.jsx`
- Modify: `src/pages/MitzvahCircle.jsx`
- Modify: `src/Layout.jsx`
- Create: `src/Layout.test.jsx`

**Interfaces:**
- Consumes: `/Publish?type=<id>` and `/Publish?mode=mine`.
- Produces: one global 52px `+` creation action and type-aware entry links from Home and Help.

- [ ] **Step 1: Write navigation contract tests**

Assert that the global `+` navigates to `/Publish`, Home choices map to publishing type IDs, Help `Ask` maps to `help_need`, Help `Offer` maps to `help_offer`, and no two visually equal creation buttons render on the same iPhone screen.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/components/feed/HomeContributionEntry.test.jsx src/pages/Feed.contract.test.jsx src/Layout.test.jsx`

Expected: FAIL on old composer routes.

- [ ] **Step 3: Replace top-level creation entry points**

Keep legacy composers callable from existing records while changing only top-level creation buttons. The global `+` opens the type picker. Home cards deep-link to their exact type. Help retains the approved horizontal swipe rows and routes its creation actions into the new publisher.

- [ ] **Step 4: Verify the whole Release 1 flow**

Run: `npm test && npm run build`

Then in a 390 × 844 signed-in browser: publish one local update, one area event, one community event, one hidden-name Help need, one giveaway, and one business update; retry a double tap; refresh; confirm each record appears in its native screen and My Publishing.

- [ ] **Step 5: Commit Release 1**

```bash
git add src/Layout.jsx src/Layout.test.jsx src/pages/Feed* src/pages/MitzvahCircle.jsx src/components/feed/HomeContributionEntry*
git commit -m "feat: make smart publishing the main creation flow"
```

---

## Release 2 — Real AI Admin

### Task 6: Add Moderation Jobs, Decisions, and Audit Safety

**Files:**
- Create: `supabase/migrations/<timestamp>_ai_moderation_jobs.sql` using `supabase migration new ai_moderation_jobs`
- Create: `supabase/tests/ai_moderation_jobs.sql`

**Interfaces:**
- Produces `content_moderation_jobs` with content pointer, immutable input snapshot/hash, status, attempts, next attempt, provider metadata, category scores, decision, reason codes, model, policy version, timestamps, and claimed worker.
- Produces RPCs: `claim_moderation_jobs(integer)`, `record_moderation_result(jsonb)`, `admin_decide_moderation(uuid,text,text)`, `moderation_queue_health()`.

- [ ] **Step 1: Write security and state-transition SQL tests**

Prove users cannot read/write jobs; only service role can claim; only admins can decide; the same job cannot be claimed twice; attempts back off; `temporarily_hidden` hides native content without deleting it; restoring reverses only the matching AI action; and all state changes append `moderation_audit_logs`.

- [ ] **Step 2: Run tests and verify RED**

Run: `supabase test db supabase/tests/ai_moderation_jobs.sql`

Expected: FAIL because job tables and RPCs do not exist.

- [ ] **Step 3: Implement queue storage and explicit grants**

Use private-by-default RLS, indexes on `(status, next_attempt_at, created_at)` and content pointer, `FOR UPDATE SKIP LOCKED` in the claim RPC, fixed security-definer search paths, and a maximum attempt count. Store only the text/media needed for review; never store auth tokens or private message history.

- [ ] **Step 4: Implement conservative decision transitions**

Allowed automated results: `clear`, `needs_review`, `temporarily_hidden`. Permanent `removed` requires `public.is_admin()`. Create a high-priority `reports` row for every temporary hide and attach `ai_flagged=true`; avoid duplicate reports for the same moderation job.

- [ ] **Step 5: Reset, test, and lint database**

Run: `supabase db reset && supabase test db supabase/tests/smart_publishing_foundation.sql supabase/tests/ai_moderation_jobs.sql && supabase db lint`

Expected: PASS with no exposed queue access.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests/ai_moderation_jobs.sql
git commit -m "feat: add auditable AI moderation queue"
```

### Task 7: Connect OpenAI and Process the Queue

**Files:**
- Create: `supabase/functions/_shared/moderation.ts`
- Create: `supabase/functions/_shared/moderation_test.ts`
- Create: `supabase/functions/process-moderation-queue/index.ts`
- Create: `supabase/functions/process-moderation-queue/index_test.ts`
- Modify: `env.example`
- Modify: `supabase/config.toml`

**Interfaces:**
- Produces `runDeterministicChecks(input)`, `moderateSafety(input, fetchImpl)`, `classifyCommunityRisk(input, fetchImpl)`, `decideModeration(checks)`, and worker response `{ claimed, cleared, review, hidden, retried, failed }`.
- Secrets: `OPENAI_API_KEY`, `OPENAI_CLASSIFIER_MODEL`, `MODERATION_CRON_SECRET`.

- [ ] **Step 1: Write policy tests before provider code**

Cover links/phone/email redaction rules, exact duplicate detection, repeated spam, doxxing, threats, self-harm escalation, harassment, illegal transaction signals, provider timeout, 429 retry, malformed classifier JSON, and borderline content. Assert only explicit high-risk combinations return `temporarily_hidden`; uncertainty returns `needs_review`.

- [ ] **Step 2: Run Deno tests and verify RED**

Run: `deno test supabase/functions/_shared/moderation_test.ts supabase/functions/process-moderation-queue/index_test.ts --allow-env`

Expected: FAIL because moderation modules do not exist.

- [ ] **Step 3: Implement deterministic checks and OpenAI safety moderation**

Call `POST https://api.openai.com/v1/moderations` with model `omni-moderation-latest`. Parse `flagged`, category booleans, and category scores. Set an abort timeout, never log the API key or raw private metadata, and classify 408/429/5xx/network failures as retryable.

- [ ] **Step 4: Implement structured community classification**

Call the OpenAI Responses API using `OPENAI_CLASSIFIER_MODEL` and strict JSON schema fields `spam`, `scam`, `doxxing`, `harassment`, `localRelevance`, `categoryMatch`, `confidence`, and `reasons`. Treat missing model/key or malformed output as retryable/needs-review, never as safe proof or an auto-hide by itself.

- [ ] **Step 5: Implement the protected batch worker**

Require `MODERATION_CRON_SECRET` or an allowed Supabase server key, claim at most 20 jobs, process with bounded concurrency, record each outcome separately, and continue after an item failure. The worker must be safe to call twice and must not leave claimed jobs stuck past their lease.

- [ ] **Step 6: Run tests and a provider-contract smoke test**

Run: `deno test supabase/functions/_shared/moderation_test.ts supabase/functions/process-moderation-queue/index_test.ts --allow-env`

Expected: PASS. With a real development key, submit one harmless fixture and one explicit threat fixture; confirm harmless → `clear` and threat → `temporarily_hidden`/high-priority review without printing content to logs.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/moderation* supabase/functions/process-moderation-queue env.example supabase/config.toml
git commit -m "feat: connect AI moderation worker"
```

### Task 8: Upgrade the Admin Queue for Aryeh and Jonny

**Files:**
- Create: `src/components/moderation/AiReviewCard.jsx`
- Create: `src/components/moderation/AiReviewCard.test.jsx`
- Modify: `src/pages/AdminModerationQueue.jsx`
- Create: `src/pages/AdminModerationQueue.test.jsx`
- Modify: `src/services/publishingService.js`

**Interfaces:**
- Consumes: `moderation_queue_health`, AI jobs/reports, `admin_decide_moderation`.
- Produces tabs `Needs review`, `AI hidden`, `User reports`, `Business`, `Claims`, `History`; actions `Keep hidden`, `Restore`, `Remove`, `Dismiss`, with required reason for permanent removal.

- [ ] **Step 1: Write admin behavior tests**

Assert a non-admin never receives queue data; AI cards show content, author, audience, model/policy, plain-language reason, confidence, and source link; `Restore` records a reason; `Remove` cannot submit without a reason; and queue health shows pending, oldest age, retrying, and failed counts.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/components/moderation/AiReviewCard.test.jsx src/pages/AdminModerationQueue.test.jsx`

Expected: FAIL because AI queue UI is absent.

- [ ] **Step 3: Implement the iPhone-readable admin center**

Keep existing user reports, claims, and business workflows. Add compact count tabs, sticky filters, safe content preview, source link, audit trail, and one-tap restore. Never label AI output as fact; use `AI flagged this because…` and `Final decision: Aryeh/Jonny`.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- src/components/moderation/AiReviewCard.test.jsx src/pages/AdminModerationQueue.test.jsx && npm test && npm run build`

Expected: PASS.

- [ ] **Step 5: Commit Release 2**

```bash
git add src/components/moderation/AiReviewCard* src/pages/AdminModerationQueue* src/services/publishingService.js
git commit -m "feat: add AI Admin review center"
```

---

## Release 3 — Appeals, Expiration, and Ownership

### Task 9: Add Appeals and User-Facing Moderation Status

**Files:**
- Create: `supabase/migrations/<timestamp>_moderation_appeals.sql` using `supabase migration new moderation_appeals`
- Create: `supabase/tests/moderation_appeals.sql`
- Create: `src/components/moderation/AppealCard.jsx`
- Create: `src/components/moderation/AppealCard.test.jsx`
- Create: `src/components/publishing/MyPublishing.jsx`
- Create: `src/components/publishing/MyPublishing.test.jsx`
- Modify: `src/pages/Publish.jsx`
- Modify: `src/pages/AdminModerationQueue.jsx`

**Interfaces:**
- Produces `content_moderation_appeals`, RPCs `submit_moderation_appeal(uuid,text)` and `decide_moderation_appeal(uuid,text,text)`, and My Publishing state labels.

- [ ] **Step 1: Write SQL tests for appeal privacy and final authority**

Prove only the content owner can appeal their hidden/removed item, one open appeal exists per moderation action, ordinary users cannot read other appeals, admins can decide, AI cannot decide, and every outcome is audited and notifies the owner.

- [ ] **Step 2: Run SQL tests and verify RED**

Run: `supabase test db supabase/tests/moderation_appeals.sql`

Expected: FAIL before the migration.

- [ ] **Step 3: Implement appeals with RLS and RPCs**

States are `open`, `restored`, `upheld`. A restored appeal unhides the exact content and changes moderation status to `restored`; upheld leaves it hidden/removed. Never erase the original AI or admin record.

- [ ] **Step 4: Write My Publishing and appeal UI tests**

Cover pagination, active/ended/hidden status, edit before expiration, end now, duplicate with a new submission key, appeal reason length, open-appeal lockout, and plain messages explaining what happened.

- [ ] **Step 5: Implement My Publishing and admin appeal cards**

My Publishing is reachable from the publisher header and Me page. It lists every native destination through the RPC, never by three unrelated client queries. The admin appeal tab shows original content, decision history, user's reason, and restore/uphold controls.

- [ ] **Step 6: Run SQL, UI, and full tests**

Run: `supabase test db supabase/tests/moderation_appeals.sql && npm test -- src/components/publishing/MyPublishing.test.jsx src/components/moderation/AppealCard.test.jsx && npm test`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations supabase/tests/moderation_appeals.sql src/components/publishing/MyPublishing* src/components/moderation/AppealCard* src/pages/Publish.jsx src/pages/AdminModerationQueue.jsx
git commit -m "feat: add moderation appeals and publishing ownership"
```

### Task 10: Expire Stale Content and Notify the Right People

**Files:**
- Create: `supabase/migrations/<timestamp>_publishing_expiration_cron.sql` using `supabase migration new publishing_expiration_cron`
- Create: `supabase/tests/publishing_expiration.sql`
- Modify: `supabase/functions/process-moderation-queue/index.ts`
- Modify: `supabase/functions/process-moderation-queue/index_test.ts`
- Modify: `src/components/publishing/MyPublishing.jsx`

**Interfaces:**
- Produces RPC `expire_published_content(integer) returns jsonb` and worker operation `expire`.

- [ ] **Step 1: Write expiration tests**

Prove expired records disappear from active feed/help/event queries without deletion, event discovery posts expire with their event, author receives one notification, `end now` is immediate, duplicate creates a fresh expiry, and cron reruns are idempotent.

- [ ] **Step 2: Run tests and verify RED**

Run: `supabase test db supabase/tests/publishing_expiration.sql`

Expected: FAIL because expiry processing is absent.

- [ ] **Step 3: Implement expiration RPC and scheduled invocation**

Process bounded batches, set native lifecycle state rather than deleting, append audit rows, and enqueue one owner notification. Schedule a server-authenticated invocation at least every 15 minutes using the project's established `pg_cron` + `pg_net` pattern.

- [ ] **Step 4: Add worker and UI coverage**

The worker summary includes `expired`; My Publishing labels records `Ended` or `Expired`; `Duplicate` starts a clean draft and never reuses the prior submission key.

- [ ] **Step 5: Reset and run the complete local suite**

Run: `supabase db reset && supabase test db && deno test supabase/functions --allow-env && npm test && npm run lint && npm run typecheck && npm run build`

Expected: all commands PASS.

- [ ] **Step 6: Commit Release 3**

```bash
git add supabase/migrations supabase/tests/publishing_expiration.sql supabase/functions/process-moderation-queue src/components/publishing/MyPublishing.jsx
git commit -m "feat: expire stale publishing content safely"
```

---

## Release and Verification

### Task 11: Ship, Verify Live, and Update the Company Roadmap

**Files:**
- Modify: `internal/roadmap.js`
- Create: `docs/superpowers/reports/2026-08-18-smart-publishing-ai-admin-verification.md`

**Interfaces:**
- Produces a pushed GitHub branch/PR, deployed Supabase migrations/functions/secrets, a Vercel production deployment, and a dated verification record.

- [ ] **Step 1: Run the required JUnited self-check skill**

Run every command and browser check required by `junited-self-check`, then record exact pass/fail evidence. Fix failures before continuing.

- [ ] **Step 2: Review security-sensitive diff**

Run: `git diff origin/main...HEAD --check && git diff --stat origin/main...HEAD && git status --short`

Confirm no keys, `.env` files, personal data, debug logging, fake content, or unrelated dirty files are included.

- [ ] **Step 3: Push the branch and open a pull request**

Run:

```bash
git push -u origin codex/smart-publishing-ai-admin
gh pr create --base main --head codex/smart-publishing-ai-admin --title "Add Smart Publishing and AI Admin" --body-file docs/superpowers/reports/2026-08-18-smart-publishing-ai-admin-verification.md
```

Expected: a GitHub PR with green checks and the three release stages summarized.

- [ ] **Step 4: Deploy database and Edge Functions after review**

Use the linked Supabase project. Set `OPENAI_API_KEY`, `OPENAI_CLASSIFIER_MODEL`, and `MODERATION_CRON_SECRET` as server-only secrets; push migrations; deploy `publish-content` and `process-moderation-queue`; run database security/performance advisors; record their results. Never place secrets in Vite variables.

- [ ] **Step 5: Merge and verify the Vercel production deployment**

Merge only with green checks. Confirm `https://www.junited.us/Publish` loads for a signed-in user and verify at 390 × 844: all 26 types; local/community audience; immediate safe publish; native routing; hidden-name Help privacy; double-tap idempotency; My Publishing edit/end/duplicate; harmful fixture temporary hide; admin restore/remove; appeal; expiration; offline/provider-failure messaging; no horizontal overflow; bottom controls remain visible above the iPhone safe area.

- [ ] **Step 6: Update the roadmap only for verified work**

Mark Smart Publishing, AI Admin, appeals, and expiry complete only where production checks passed. Put any failed or intentionally deferred item into the next concrete roadmap action with owner and acceptance test.

- [ ] **Step 7: Commit and push the verification record**

```bash
git add internal/roadmap.js docs/superpowers/reports/2026-08-18-smart-publishing-ai-admin-verification.md
git commit -m "docs: verify smart publishing production release"
git push
```

Expected: GitHub, Supabase, Vercel, the verification report, and `junited.us` all describe the same shipped state.
