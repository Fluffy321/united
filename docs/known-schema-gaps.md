# Known schema gaps

Columns the app reads or writes that do not exist in `supabase/migrations/`.

Compiled 2026-09-17 from a read-only audit at commit `f24eb0c`. **This is a
reference document, not a plan.** Nothing here has been fixed. Each entry
records what the code expects and where, so that whoever changes it can decide
between adding the column and removing the read.

Method: the `mitzvah_requests` column set (39 columns) was assembled from its
`CREATE TABLE` plus every `ADD COLUMN` across all 98 migrations, then compared
against every read in `src/`. Other tables were checked the same way.

## Summary

| Column | Status | Reads | Writes |
|---|---|---|---|
| `needed_by` | never defined | 6 | 1 (silent) |
| `offers_count` | never defined | 7 | 0 |
| `views_count` | never defined | 4 | 1 (silent) |
| `helper_count` | never defined | 3 | 0 |
| `volunteer_count` | never defined | 2 | 0 |
| `goal_count` | never defined | 2 | 0 |
| `target_count` | never defined | 2 | 0 |
| `volunteers_needed` | never defined | 1 | 0 |
| `seats_needed` | never defined | 2 | 0 |
| `deadline_at` | never defined | 2 | 0 |
| `end_at` | never defined | 1 | 0 |
| `start_at` | never defined | 1 | 0 |
| `expires_at` | exists on other tables | 3 | 0 |
| `meals_needed` | exists on `meal_train_requests` | 2 | 0 |

## The two writes that fail without raising

`createWithSchemaRetry` (`src/services/supabaseRepository.js:851`) and
`updateWithSchemaRetry` (`:877`) catch the PostgREST unknown-column error via
`getMissingSchemaColumn` (`:816`), `delete` the offending key from the payload,
and retry — up to 8 times. The promise then **resolves successfully** with a row
that never contained the stripped field.

They do emit `console.warn("Skipping <Entity> column ...")` (`:872`, `:898`), so
this is visible in a devtools console. It is not silent at the console. It is
silent to every other observer: the caller's `await` succeeds, no error reaches
`captureError`, nothing lands in `error_logs` or Sentry, and the user sees a
success toast.

Affected writes:

- `needed_by` — `src/components/feed/UnifiedPostModal.jsx:246`
  Set when `postKind === 'help'`. Help posts have never stored a due date.
- `views_count` — `src/components/mitzvah/MitzvahRequestCard.jsx:52`
  `views_count: (request.views_count || 0) + 1` on card open. The view counter
  has never counted; it increments `undefined + 1` client-side and the write is
  discarded.

## Per-column detail

### `needed_by` — never defined in any migration

The intended "due by" date for a help request. Reads always yield `undefined`.

- `src/components/jewish/JewishCalendarPage.jsx:272` — `(m.needed_by || '').slice(0, 10)`
- `src/components/jewish/JewishCalendarPage.jsx:301` — same, for the day bucket key
- `src/components/feed/LiveHelpBoard.jsx:16` — `if (!request.needed_by)` early return
- `src/components/feed/LiveHelpBoard.jsx:23` — `parseISO(request.needed_by)`
- `src/lib/feed/feedRanking.js:56` — third fallback in a date chain
- `src/lib/productInfrastructure.js:95` — activity-kind classification
- `src/components/feed/UnifiedPostModal.jsx:246` — **write, stripped**
- `src/services/notificationsService.js:323` — passed into notification `data`
  jsonb as `needed_by: neededBy`. Not a table column read, so this one is
  harmless — jsonb accepts it.

Consequence: `JewishCalendarPage` can never place a mitzvah request on a
calendar day. `LiveHelpBoard`'s countdown always takes the no-deadline branch.

### `offers_count` — never defined in any migration

A denormalized count of rows in `mitzvah_offers`.

- `src/components/mitzvah/MitzvahRequestCard.jsx:102`, `:109`, `:111`
- `src/components/mitzvah/circle/RequestCard.jsx:67`
- `src/components/mitzvah/circle/QuickViewSheet.jsx:15`
- `src/components/feed/LiveHelpBoard.jsx:98`
- `src/lib/liveNow.js:49`

Consequence: `offers_count > 0` is always false, so the "N offered help" badge
never renders even on requests with real `mitzvah_offers` rows. `liveNow.js:49`
is the only site that falls back to the real count
(`Math.max(helperOffers.length, ...)`), so the same request can show a helper
count on one surface and nothing on another.

Note: `mitzvah_requests` does have `comments_count` and `reactions_count`. The
offers equivalent was never added.

### `views_count` — never defined on `mitzvah_requests`

- `src/components/mitzvah/MitzvahRequestCard.jsx:52` — **write, stripped**
- `src/components/mitzvah/MitzvahRequestCard.jsx:102`, `:104`, `:106`
- `src/components/feed/LiveHelpBoard.jsx:95`

Unrelated but same name: `communities.views_count` is read at
`src/components/communities/FeaturedCommunityCard.jsx:27`, `:112`, `:115` and
written at `src/pages/Communities.jsx:1147`. Check which table is meant before
touching either.

### `helper_count`, `volunteer_count` — never defined

Alternate spellings of `offers_count`, used as fallbacks beside it.

- `src/components/mitzvah/circle/RequestCard.jsx:67`
- `src/components/mitzvah/circle/QuickViewSheet.jsx:15`
- `src/lib/liveNow.js:49` (`helper_count` only)

### `goal_count`, `target_count`, `volunteers_needed`, `seats_needed` — never defined

Four names for "how many people are needed", read as a fallback chain.

- `src/components/mitzvah/circle/shared.js:292` — all four
- `src/lib/liveNow.js:50` — `goal_count`, `target_count`, `seats_needed`

Consequence: the chain always falls through. `liveNow.js:50` ends at a
hardcoded `3`; `circle/shared.js:292` yields `NaN` from `Number(undefined)`.

### `deadline_at`, `end_at`, `start_at` — never defined

- `src/lib/feed/homePriority.js:30` — `expires_at || deadline_at || end_at || end_date`
- `src/lib/feed/homePriority.js:34` — `deadline_at || expires_at || start_at || start_date`

Only the last term in each chain (`end_date`, `start_date`) exists, and only on
`community_events`. For any feed item that is a mitzvah request, both helpers
return `POSITIVE_INFINITY`, so deadline-based ranking is inert for them.

### `expires_at` — exists, but not on `mitzvah_requests`

Real column on `invite_links` and the community-plan tables. Not on
`mitzvah_requests`.

- `src/components/mitzvah/circle/shared.js:191` — `request.expires_at || request.expiresAt`
  inside `isRequestExpired`. This branch has never been true; the function
  always falls through to `created_at + REQUEST_EXPIRY_DAYS` (7 days,
  `circle/shared.js:155`).
- `src/lib/feed/homePriority.js:30`, `:34` — see above.

Legitimate uses of the real column, for contrast:
`src/components/communities/CommunityInviteModal.jsx:74`, `:181`.

### `meals_needed` — exists on `meal_train_requests`, not `mitzvah_requests`

- `src/components/mitzvah/circle/shared.js:292`
- `src/lib/liveNow.js:50`

Both read it off a mitzvah request. `src/services/supabaseRepository.js:322`
also sets it in local demo-mode seed data for `MitzvahRequest`, which is
probably where the expectation came from.

## Not a bug

`poster_id` is a view-model field, not a column. It is mapped at
`src/components/mitzvah/circle/shared.js:252` from
`row.requester_id || row.created_by_user_id` and correctly never reaches the
database. Read at `src/pages/MitzvahCircle.jsx:105`, `:277`, `:295`, `:347`,
`:425`, `:431`, `src/components/mitzvah/circle/QuickViewSheet.jsx:13`, `:101`,
and `src/components/mitzvah/circle/RequestCard.jsx:45`.

## Making the strip loud — deferred plan

The obvious fix is to replace the `console.warn` in `createWithSchemaRetry`
(`src/services/supabaseRepository.js:872`) and `updateWithSchemaRetry` (`:898`)
with a `captureError` call, so a stripped column reaches Sentry and
`error_logs` instead of only a devtools console. Mechanically that is three
lines — four counting the same pattern in `updateProfileWithSchemaRetry`
(`:845`).

**Do not do that first.** The strip path is load-bearing, not exceptional.
`toDbPatch` (`:696-703`) adds canonical aliases without deleting the originals:

```
if (patch.created_date && !patch.created_at) patch.created_at = patch.created_date;
if (patch.updated_date && !patch.updated_at) patch.updated_at = patch.updated_date;
if (patch.cityPreset && !patch.city) patch.city = patch.cityPreset;
```

`updated_date` and `cityPreset` are not columns on any table. `toAppRow`
(`:669-671`) then synthesizes `created_date`/`updated_date` onto every row it
returns, so the ordinary read-edit-write round trip sends `updated_date` on
every write and has it stripped on every write. 26 call sites pass
`created_date:` explicitly. `MitzvahRequest` is the only entity whose block
deletes its aliases after mapping (`:712-714`); the other 64 entity names in
`SUPABASE_ENTITY_TABLES` do not.

Every write in the app funnels through these two helpers — 65 entity names, 84
create/update/bulkCreate wrappers in `entityServices.js`, two call sites
(`:1097`, `:1115`). Making the strip loud before fixing the aliases would
surface a steady background rate of expected strips across most writes and bury
the two real findings above in it, while sending that volume to a Sentry
pipeline that is now actually wired up.

Sequence:

1. **Measure first.** Route the existing warn to `captureError` at a low sample
   rate, or to a plain counter rather than an issue per occurrence. Collect the
   real rate and the distribution of stripped column names for about a week.
   Cheap, reversible, and it answers the only question that decides the rest.
   The rate is not knowable from the code — nobody has ever collected it,
   because `console.warn` never leaves the browser.
2. **Fix the aliases.** Make `toDbPatch` delete its alias keys the way the
   `MitzvahRequest` block already does, and stop `toAppRow` from synthesizing
   `updated_date` into values that get written back. This should collapse
   expected-strip traffic to near zero.
3. **Then make it loud.** Once a strip means a real mismatch, promote it to
   `captureError` at full rate. At that point the signal is worth an alert.

The 8-attempt retry loop stays regardless of what happens to the logging. It
also guards against Supabase's schema cache lagging a freshly applied
migration, which is a real transient condition unrelated to these gaps.
