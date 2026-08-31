# Smart Publishing and AI Admin Design

**Date:** 2026-08-18  
**Status:** Approved for implementation planning  
**Product owner:** Aryeh Kohn  
**Initial platform admins:** Aryeh Kohn and Jonny Troppe

## Product outcome

JUnited will replace fragmented posting decisions with one iPhone-first Smart Publisher. Signed-in users choose what they are publishing, complete a short type-specific form, select a local-area audience with an optional joined community, preview, and publish immediately. The content is written into the native JUnited destination that already owns that kind of information.

Every submission also enters asynchronous server-side moderation. Normal content remains live. Clearly dangerous content or obvious spam may be hidden automatically, while uncertain claims remain visible with an honest trust label and enter a private review queue. Aryeh and Jonny retain final control, every moderation action is recorded, and users can appeal or correct decisions.

## Product principles

- Publishing must take less than one minute for a normal update.
- Local-area publishing is the default; a joined community is optional.
- Users publish from their real JUnited identity. Fully anonymous posting is not available in the first release.
- Sensitive Help posts may hide the author's name from other users, but never from platform admins.
- Normal posts publish immediately. Moderation happens asynchronously and must not make safe publishing feel slow.
- AI may recommend, label, queue, or temporarily hide. It may not permanently ban users, permanently delete content, or mark factual claims as verified.
- Only Aryeh and Jonny use the platform Admin Center initially. Community-leader moderation is a later, separately designed permission layer.
- AI downtime must not lose user content. Work remains queued for retry.
- Verified Directory, kosher, school, safety, funeral, and official-time facts cannot be overwritten by an unverified user post.

## Publishing taxonomy

The first screen shows six compact groups. JUnited remembers the user's most-used types and presents those as shortcuts without removing the full grouped list.

### Local

- Local news
- Urgent or safety alert
- Weather update
- Road or traffic update
- School update
- Community announcement

### Jewish life

- Minyan or zmanim change
- Shiur or learning
- Simcha or mazal tov
- Funeral, shiva, or Tehillim notice

### Plans

- Event
- Casual meetup or plan
- Youth activity

### Help

- Help needed
- Help offered
- Ride or carpool
- Lost and found
- Volunteer opportunity

### Opportunities

- Job
- Housing
- Giveaway
- Item for sale

### Businesses and food

- New business or restaurant
- Business update
- Kosher or menu update
- Local deal

## User experience

### Entry points

- The main app `+` action opens Smart Publisher.
- Existing section-specific create actions may open Smart Publisher with a preselected type.
- The publisher is a mobile sheet or full-screen flow at 390 px, not a desktop admin form squeezed into a phone.

### Step 1: Choose a type

The user sees six group cards and up to four personal shortcuts. Opening a group reveals its publishing types. Search is unnecessary in the first release because the grouped list is small enough to scan.

### Step 2: Complete the focused form

All types share:

- Headline
- Details
- Local area, defaulting to the user's configured network
- Optional joined community
- Expiration, prefilled from the type policy
- Optional source label and source URL
- Optional media using the existing upload system

Type-specific fields appear only when needed:

- Events: start date, start time, end time, location, optional registration link
- Help: need or offer direction, category, urgency, privacy choice, optional map visibility
- Carpool: origin, destination, pickup time, seats, need or offer direction
- Marketplace: price/free status, condition, pickup option, listing section
- Business update: business name, location, update category, source or owner relationship
- High-trust claims: source URL or contact/source label is required

The form preserves drafts on accidental close during the current session. A user can deliberately discard the draft.

### Step 3: Preview and publish

Preview renders the destination-style card and names the destinations before publishing, for example: “Five Towns Home + Events This Week.” Publish creates the native record and returns a success screen with direct links to view or share it.

Publication is idempotent. Repeated taps use one client submission key and cannot create duplicates.

### My publishing

Users can see their recent submissions and:

- Edit content they own when the native destination allows edits
- End or close outdated content
- Duplicate a post into a new draft
- See moderation state in plain language
- Correct and resubmit held content
- Appeal a human or automated moderation action

## Destination routing

The Publishing Service owns one canonical registry that maps each publishing type to a destination adapter. UI components do not decide table names.

### Home and community posts

Local news, alerts, weather, roads, school updates, community announcements, minyan changes, shiurim, simchas, funeral notices, meetups, youth activities, volunteer opportunities, business updates, kosher/menu updates, and local deals create a `posts` record using the existing unified-post infrastructure.

- Area-wide posts have no community restriction and carry the user's network label.
- When a joined community is selected, the post also carries that `community_id` and appears in the community and personalized Home.
- High-trust types start as `community_submitted`, even when they include a source.
- Existing source-backed official automation remains distinct from user submissions.

### Events

Event publishes a native `community_events` row so it appears in event and calendar surfaces. Because the existing schema requires `community_id`, the service resolves the selected joined community or the durable `Events This Week` essential room for the user's network. It also creates a lightweight linked feed discovery post through the same transaction boundary. The feed record stores the native event ID so edits and expiration remain synchronized.

### Help and rides

Help needed, Help offered, and Ride or carpool create native `mitzvah_requests` rows. The approved `direction` field distinguishes public needs from public offers. Private volunteer replies remain in `mitzvah_offers` and are never treated as public offers.

Sensitive Help posts may set `public_author_hidden = true`. RLS and read projections must still expose the author ID to the author and platform admins while returning a neutral public name to other users.

### Marketplace

Jobs, housing, giveaways, and items for sale create unified `posts` rows with `activity_kind = 'marketplace_listing'` and the existing marketplace fields. Lost-and-found uses a marketplace-style record with `listing_section = 'lost_found'` so it has a lifecycle and a closed state.

### Businesses and Directory

Business and restaurant news publishes immediately as a community-submitted unified post. A new Directory listing or requested factual change creates or updates a pending `business_listings` / `business_claim_requests` workflow using the existing verification process. A user post never directly changes a published kosher certification, ownership badge, address, or other verified Directory fact.

## Publishing Service

The client calls one authenticated server-side publishing endpoint. The endpoint:

1. Reads the authenticated user from the JWT; it never accepts an author ID as authority from the client.
2. Validates the publishing type against the canonical registry.
3. Validates type-specific required fields, text lengths, audience membership, source requirements, and expiration limits.
4. Enforces a rate limit appropriate to the account's trust state.
5. Claims the unique submission key.
6. Writes the native destination record and any linked discovery post.
7. Writes a moderation job referencing the created records.
8. Returns canonical destination URLs and the moderation state.

The app does not insert Smart Publisher records directly into arbitrary tables. Existing section-specific publishers are migrated to this service in controlled follow-up steps so enforcement becomes consistent without breaking every current creation path at once.

## Data model

### Publishing metadata

Native destination tables receive compatible publishing metadata where missing:

- `publishing_type text`
- `network text`
- `audience_scope text` constrained to `area` or `community`
- `expires_at timestamptz`
- `submission_key uuid`
- `moderation_status text`
- `trust_status text`
- `source_name text`
- `source_url text`
- `public_author_hidden boolean`

Fields already present on a table are reused rather than duplicated. Compatibility mapping remains in the shared repository/service layer.

### Moderation jobs

A new `content_moderation_jobs` table stores asynchronous processing state:

- Native content type and ID
- Author ID
- Plain-text moderation snapshot
- Publishing type and risk tier
- Status: `queued`, `processing`, `cleared`, `review`, `auto_hidden`, `failed_retryable`, or `resolved`
- Provider/model metadata without secret values
- Machine-readable categories and confidence values
- Human-readable reason and recommended action
- Attempt count and retry time
- Creation, processing, and resolution timestamps

Only the author can see a limited status projection for their own jobs. Platform admins can read all fields. Ordinary users cannot read moderation snapshots, provider output, or other users' cases.

### Existing reports and audit log

- AI review cases create or link an existing `reports` row with `ai_flagged = true` so the current Admin Moderation Queue remains the main review surface.
- User reports continue to use `reports`.
- Human moderation actions continue to write immutable `moderation_audit_logs` rows.
- Automated actions write a separate system-action record or an audit row through a protected service identity; they may not impersonate a human admin.

### Appeals

A small `content_moderation_appeals` table stores one active appeal per moderation action. Authors can create and read their own appeals. Platform admins can resolve them. Restoring content writes an immutable audit entry and updates the native content visibility.

## AI moderation and trust

### Synchronous checks before publish

Fast deterministic checks run before publication:

- Empty or oversized fields
- Unsupported URLs
- Obvious repeated text/flooding
- Duplicate submission key
- Account and per-type rate limits
- Required sources for high-trust types
- Audience membership

These checks may reject malformed submissions with a clear correction message. They do not attempt broad content judgment.

### Asynchronous AI checks

A protected server worker processes moderation jobs after publication. It evaluates:

- Spam and scams
- Harassment or hateful targeting
- Sexual or violent content
- Credible threats and self-harm risk
- Doxxing or exposed private information
- Prohibited transactions
- Likely duplicates
- Category mismatch
- Missing context or suspicious unsupported high-trust claims

The output is structured and schema-validated. Raw provider responses are not rendered directly to users.

### Automated action limits

Automatic hiding is limited to explicit policy categories with conservative thresholds: obvious spam floods, exposed highly sensitive personal data, credible violent threats, or clearly prohibited sexual content. Everything else stays visible and enters `review`.

AI cannot:

- Verify a factual claim
- Permanently delete content
- Permanently ban or suspend an account
- Change verified Directory facts
- Publish an admin-authored correction
- Resolve an appeal

### AI outage behavior

If the provider is unavailable, the job becomes `failed_retryable`, the normal safe post remains live, and the worker retries with bounded exponential backoff. High-trust posts remain labeled `Community submitted`. The Admin Center shows the outage and queued count without exposing internal secrets.

## Admin Center

The existing Admin Moderation Queue is upgraded rather than replaced. It remains behind `AdminRoute` and server-side RLS requiring `profiles.role = 'admin'`.

The mobile-first queue includes:

- Urgent automated hides
- AI review recommendations
- User reports
- Duplicate and expired-content suggestions
- Business and factual verification requests
- Appeals
- AI service health and retry count

Each case shows the content, author, destination, source, AI categories, reason, confidence, current visibility, and history. Aryeh or Jonny can approve/clear, edit with an explicit attribution record, hide, restore, warn, verify a factual claim, or resolve an appeal.

Permanent user bans and irreversible deletion are outside the first release. Existing account moderation may continue through its current human-only controls.

## Expiration defaults

Expiration is always visible and editable within safe limits.

- Urgent/safety: 24 hours
- Weather/traffic/school: 24 hours
- Minyan change: end of the relevant day
- Event: shortly after event end
- Casual plan/youth activity: 24 hours after start
- Help and rides: 7 days unless an earlier needed-by time is supplied
- Lost and found: 30 days
- Job/housing: 30 days
- Giveaway/sale: 14 days
- Business update/deal: 14 days
- News, shiur, simcha, funeral, and community announcement: 7 days by default

Ending a post changes its lifecycle state; it does not destroy audit history.

## Notifications

- Authors receive a notification when content is hidden, restored, requires correction, or has an appeal decision.
- Admins receive in-app notifications for auto-hidden content, urgent safety reviews, and appeals.
- Routine cleared posts do not generate admin noise.
- Notification failure never blocks publishing or moderation state changes.

## Error and empty states

- Validation errors stay next to the field and preserve the draft.
- Destination-write failure returns no false success and leaves an idempotent retry path.
- If a linked discovery post fails after a native event succeeds, the service records partial recovery work and returns the native event rather than duplicating it.
- Empty Admin Center states say that no review is needed; they do not invent activity.
- AI unavailable states show queued work and retry behavior.
- Users always see whether their content is live, under review, hidden, ended, or expired.

## Security and privacy

- RLS remains the enforcement layer for every new table and metadata column.
- The server derives identity from authenticated context.
- Admin access is enforced by both `AdminRoute` and `public.is_admin()` policies.
- AI provider credentials exist only in server-managed environment variables.
- Moderation snapshots exclude fields not required for classification.
- Sensitive Help identities are not included in public projections.
- Source contact details are never displayed unless the author explicitly includes them in public content.
- Rate limiting and idempotency are enforced server-side.

## Delivery stages

### Stage 1: Publishing foundation

- Canonical taxonomy and destination registry
- Smart Publisher mobile UI
- Authenticated Publishing Service
- Local/community posts, Help, events, and Marketplace routing
- Expiration, source, trust, audience, and idempotency metadata
- My publishing management

This stage is usable without AI: posts publish, trust labels are honest, and existing user reports/admin tools remain available.

### Stage 2: AI Admin

- Moderation jobs and worker
- Structured AI classification
- Conservative auto-hide rules
- Existing Admin Moderation Queue integration
- Retry/health visibility and author notifications

### Stage 3: Appeals and complete lifecycle

- Appeals
- Correction and resubmission
- Expiration automation
- Duplicate suggestions
- Admin restore/verify actions
- Migration of remaining legacy creation paths into Publishing Service

Each stage ships only after its complete user path is verified. Stages remain on one approved product architecture; later stages do not replace earlier work.

## Testing and release requirements

### Automated tests

- Every publishing type maps to the expected adapter and native destination.
- Type-specific validation and expiration defaults are deterministic.
- User identity cannot be spoofed.
- Community audience requires active membership.
- Submission keys prevent duplicates.
- Sensitive Help projection hides public identity but preserves author/admin access.
- Business updates cannot change verified Directory facts.
- AI clear, review, auto-hide, invalid-output, timeout, and retry paths are covered.
- Non-admin users cannot read moderation cases or use admin actions.
- Appeals and audit records are immutable and correctly scoped.
- React Query invalidation refreshes the affected native destination.

### Runtime verification

- Test publisher and Admin Center at 390, 768, 1024, and 1440 px.
- On iPhone, fixed actions and bottom navigation cannot cover reachable fields or cards.
- Verify one real flow for each adapter: Feed, community, event, Help, Marketplace, and business verification.
- Verify publication appears in the correct destination and personalized Home.
- Verify an AI outage leaves safe content live and queued.
- Verify a conservative auto-hide, human restore, notification, and audit trail end to end.
- Run the complete JUnited self-check before each production merge.

## Success criteria

- A normal signed-in user can publish a local update in under one minute.
- The user sees the post immediately in the correct destination.
- No publishing type silently falls back to a generic feed post when a native destination exists.
- Aryeh and Jonny can understand and resolve every moderation case from an iPhone.
- AI failure causes a visible queue, not lost content or a frozen publisher.
- No AI decision permanently removes content or access without a human admin action.
- Verified facts remain protected from unverified user edits.

## Explicitly deferred

- Community-leader moderation permissions
- Fully anonymous accounts or posts
- Permanent automated bans
- AI-generated factual corrections
- Autonomous verification of kosher, school, funeral, safety, or Directory claims
- Native iOS-only implementation; the responsive web app remains the source for the future iOS shell
- Multi-city expansion beyond the existing network abstraction; the data fields must be city-safe, but rollout is separate
