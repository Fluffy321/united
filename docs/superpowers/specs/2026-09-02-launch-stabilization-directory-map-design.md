# JUnited Launch Stabilization and Directory/Map Unification

## Goal

Make the current JUnited app dependable enough for Aryeh to invite the first 25 active users this week. Preserve the approved Five Towns Home dashboard and existing features. Do not restart the product or introduce a new visual direction.

Success means a signed-in iPhone user can move through Home, Help, Communities, chat, Directory, the old map, Search, Publish, Messages, Me, and Settings without hitting broken navigation, misleading empty states, unnamed choices, fake content, or internal developer language.

## Proven current problems

The production audit found these launch blockers:

1. Home uses the trusted Five Towns directory with 138 normalized listings, while the main Directory tab queries an empty `business_listings` table and looks unfinished.
2. The old working community map still exists, but it is hidden behind a second top-level mode and is disconnected from Home's trusted directory.
3. Global Search promises businesses and shuls but does not search the trusted Five Towns directory. A visible Home listing such as Cork & Slice returns no result.
4. Publish loads membership rows without resolving their community records, so audience choices appear repeatedly as “Joined community.”
5. Several interactive controls lack useful accessible names, including Home sheets, community creation, and map markers.
6. The 404 page contains internal AI/developer language for admins.
7. Profile and community membership displays need to use the same authoritative membership data and query invalidation.
8. Community chat works, but it intentionally leaves the main app shell; it must always provide an obvious reliable route back.

## Product structure

### One canonical Directory

`/Map` remains the existing canonical route so old links keep working. The screen becomes one Directory experience with a simple `List / Map` switch instead of separate “Businesses” and “Community Map” products.

The Directory reads from one merged model:

- Trusted Five Towns listings are available immediately and remain the baseline.
- Approved user-submitted business listings are normalized into the same shape.
- Duplicate records are collapsed using a stable source ID first, then normalized name plus address.
- Trusted source, kosher verification, photo attribution, and map links remain visible where available.
- Empty database results never hide the trusted baseline.

The List view supports search, groups, categories, towns, and details. The Map view displays every merged listing with reviewed coordinates. Existing community posts, events, and help requests remain available as optional map layers, not as a competing directory mode.

### Shared discovery data

Home, Directory, Map, and Search use the same normalized trusted directory module. Search combines local trusted results with live backend results and de-duplicates them before rendering. Selecting a directory search result opens the canonical Directory at the exact listing.

Publish resolves joined membership IDs against real community records before building the audience picker. Missing or deleted communities are omitted instead of shown with a generic repeated label.

## Trust and reliability fixes

- Remove internal AI/developer wording from all user-facing error states.
- Give icon-only buttons, sheet close actions, and map markers descriptive accessible names.
- Keep community creation validation explicit and prevent invalid submission from appearing successful.
- Ensure membership changes invalidate Home, Publish, Communities, and Me queries consistently.
- Preserve honest loading, empty, partial-provider, and offline states. Do not invent local posts, traffic, events, reviews, or people.
- Keep all navigation inside the React app. Every focused chat or detail screen must expose a clear Back or Home action.

## Data flow

1. Normalize trusted JSON/enrichment records through `fiveTownsDirectory`.
2. Normalize approved backend business records into the same listing contract.
3. Merge and de-duplicate through a pure tested helper.
4. Feed the merged list to Directory List, Directory Map, and local Search matching.
5. Keep live community-map content as independently fetched optional layers.
6. Resolve Publish membership IDs with the live community catalog before constructing a publishing draft.

No Google Places request or geocoding runs directly in the browser. Existing reviewed coordinates and server-side photo enrichment remain authoritative.

## Failure behavior

- If backend business listings fail, the trusted directory still works and a quiet partial-data notice may appear.
- If trusted data cannot load, approved backend listings remain usable and the screen offers Retry.
- If both sources fail, show an honest retry state without a fake empty directory.
- Listings without coordinates remain in List and are omitted from Map with no broken marker.
- Search can still return trusted local matches if the remote universal search fails.
- Publish cannot target a community whose name and membership cannot be verified.

## Verification

Implementation uses test-driven development. Required proof before merge:

- Pure merge/de-duplication tests for trusted and submitted listings.
- Directory route tests proving trusted listings appear when the backend table is empty.
- Search tests proving trusted shuls and businesses are discoverable and open the correct Directory listing.
- Publish tests proving real community names render and unresolved memberships do not.
- Accessibility tests for changed icon buttons, close actions, and map markers.
- Unknown-route test proving no AI/internal developer language is rendered.
- Existing unit suite, lint, typecheck, style checks, Jewish Hub check, prompts check, and production build pass.
- Manual signed-in testing at 390, 768, 1024, and 1440 pixels.
- iPhone journeys: Home → Directory List → listing → Map → marker → directions; Home → Search → listing; Publish → type → audience → preview without submitting; Help request/offer without submitting; Communities → room → chat → back; Messages → conversation; Me → Settings.

## Out of scope for this stabilization pass

- A new Home design or map visual style.
- Invented reviews, news, traffic, events, or community activity.
- Replacing Supabase, Vercel, Leaflet, or the existing publishing architecture.
- New monetization, native iOS work, streaks, or unrelated roadmap features.
