# JUnited Personalized Feed Setup

**Status:** Approved visual direction; pending written-spec review
**Date:** 2026-08-11
**Scope:** Three-step first-run preference setup, editable detailed preferences, deterministic learning, and time-aware Home ordering

## Product decision

JUnited's differentiation is not a single feed that every member sees in the same order. It is one shared local Jewish community translated into the right topics, amount, priority, and timing for each member.

The setup must assume the member has never heard of JUnited. It uses direct language, mature styling, and three decisions:

1. What matters to you?
2. How much do you want to see?
3. When should JUnited catch you up?

The setup is skippable. A skipped setup produces a balanced local feed and does not reappear automatically. Every setting remains editable.

## Approved visual reference

The approved clickable reference is:

`.superpowers/brainstorm/77391-1786465244/content/personalization-short-direct-v5.html`

The reference defines the mobile hierarchy, plain-spoken copy, selected-card treatment, three-step structure, review state, and skip path. It is not production code or a database contract.

The visual direction is deliberately restrained:

- No emoji-led topic cards.
- No sales language or vague promises.
- Strong sans-serif typography.
- White background, navy text, blue selected states, and limited rounding.
- Clear progress, Back, Skip, Continue, and Save actions.
- Mobile-first verification at 390 by 844 CSS pixels.

## First-run flow

### Entry rule

Show the setup to a signed-in member when all of these are true:

- Their primary community or network is already known.
- Their feed-preference setup has not been completed or skipped.
- They are not in the middle of an auth, safety, or required profile flow.

If a primary network is missing, use JUnited's existing network selection first. Do not ask for location twice.

Existing members receive the setup once after the feature ships. New members receive it after the existing required account and community steps. It must not block access indefinitely because Skip is always visible.

### Step 1: Interests

The member can select any of nine plain-language interest groups. `Local updates` and `Events and plans` begin selected so the screen is useful without requiring taps.

| Setup label | What it means | Feed category mapping |
| --- | --- | --- |
| Local updates | News, weather, roads, schools, and verified local changes | `local` |
| Events and plans | Public events, social plans, sports, and Shabbos opportunities | `events`, `sports_social`, `shabbos_plans` |
| Food and openings | Kosher food, restaurants, stores, and business openings | `kosher_food` |
| Help and chesed | Needs, offers, rides, and volunteering | `helping` |
| Learning | Shiurim, learning opportunities, and community guides | `torah_learning` |
| Minyanim and times | Minyanim, zmanim, and timely Jewish reminders | `minyanim`, `jewish_times` |
| People and groups | Trusted leaders, organizations, joined communities, and local groups | community-source relevance signal |
| Marketplace and jobs | Listings, giveaways, jobs, services, and referrals | `marketplace`, `jobs_business` |
| Family and schools | School information and parent-to-parent updates | `parents_schools` |

Selection means **prioritize**, not **only show**. Unselected topics remain available and begin at Normal. The setup never silently hides a topic.

### Step 2: Amount

The member chooses one starting level:

- **Essentials only** maps to `quiet`.
- **A balanced feed** maps to `balanced` and is the default.
- **Show me everything** maps to `all_in`.

The existing `active` value remains read-compatible for current rows. The setup does not expose two labels that produce the same initial Home capacity.

Amount changes optional priority volume and proactive content. It never changes emergency eligibility, privacy, moderation, community membership, or feature access.

### Step 3: Timing

The member can select Morning, Daytime, and Evening in any combination.

- Morning prioritizes overnight changes, today's important information, and early plans.
- Daytime prioritizes current urgency and near-term action.
- Evening prioritizes plans, community activity, and tomorrow's useful information.

**Important only** is mutually exclusive with the three scheduled windows. Selecting it clears Morning, Daytime, and Evening. Selecting a scheduled window clears Important only.

Timing initially affects Home ordering when the member opens JUnited. It does not request notification permission or enable email, push, or SMS. Future digests may use these windows only after the member separately opts into that channel.

### Review and save

The review screen shows:

- Selected interest groups.
- Feed amount.
- Catch-up timing.

Save persists all choices as one preference mutation. Home must not render a half-saved profile.

Skip persists the normal defaults, marks the setup handled, and opens Home. It does not enable notifications.

## Detailed Settings

The first-run flow is intentionally short. Settings retains the deeper control promised by the interface.

Every canonical feed category supports:

- More
- Normal
- Less
- Hide

Explicit settings always outrank learned behavior. Hide removes ordinary eligible items from Home and category recommendations, but it cannot suppress a genuine affected-member emergency, the member's own activity, moderation notices, or legally required notices.

The Settings surface also edits interest groups, amount, and catch-up windows. Changes apply immediately after save and invalidate the existing feed-preference query family.

## Personalization rules

The first release remains deterministic and explainable. It does not require an opaque machine-learning model.

Inputs are:

1. Explicit interest-group and category preferences.
2. Engagement amount.
3. Current catch-up window.
4. Existing actions: category opens, saves, replies, joins, and Show less.
5. Existing local context, joined communities, deadlines, trust, freshness, and unread activity.

Rules:

- Explicit More provides a stable positive category boost.
- Explicit Less provides a stable negative category adjustment without making the topic inaccessible.
- Explicit Hide suppresses ordinary items.
- Repeated positive actions can raise a Normal topic gradually.
- A single ignored card is not a negative signal.
- Show less is an explicit negative signal.
- Learned adjustments are capped so they cannot overpower urgency, the member's own replies, or explicit choices.
- The Home explanation continues to display only true reasons such as `Nearby`, `Ends soon`, `Yours`, or `Because you follow Events`.
- Direct-message contents, private coordination, precise private addresses, and unrelated sensitive profile data are never ranking inputs.

## Data design

Extend the existing `public.feed_user_preferences` row instead of creating a second preference system.

New fields:

- `interest_groups text[] not null default '{}'`
- `category_preferences jsonb not null default '{}'`
- `catch_up_windows text[] not null default '{}'`
- `preference_setup_version integer not null default 0`
- `preference_setup_completed_at timestamptz`

`category_preferences` is a map from canonical category ID to `more`, `normal`, `less`, or `hide`. Service-layer sanitization removes unknown keys and invalid values before persistence.

`interests` remains populated with the expanded canonical category IDs for backward compatibility with current ranking and Settings code. `interest_groups` preserves the member-facing selections and supports non-category signals such as People and groups.

The migration adds check constraints for supported catch-up values and nonnegative setup versions. Existing row-level security remains owner-only: a member can read, insert, and update only the preference row whose `user_id` matches `auth.uid()`. No service-role key or privileged browser mutation is introduced.

Before implementation, current Supabase changelog and schema-change documentation must be checked. The migration is created with the repository's installed Supabase CLI rather than by inventing a migration filename.

## Components and boundaries

- `FeedPreferenceSetup` owns step navigation, local draft state, skip, review, and save feedback.
- `InterestGroupPicker` renders the nine setup groups and has no persistence knowledge.
- `EngagementLevelPicker` owns the three user-facing amount choices and maps them to stored levels.
- `CatchUpWindowPicker` enforces the Important-only exclusivity rule.
- `feedPreferenceModel` validates, normalizes, expands interest groups, and produces the persistence patch.
- `feedRetentionService` remains the only client service that reads or writes feed preferences.
- `homePriority` consumes normalized explicit preferences, bounded learned signals, and time context without knowing about setup screens.
- `BriefPreferencesSettings` exposes the permanent detailed controls using the same shared model and labels.

Each unit has one purpose and can be tested without rendering the full Feed page.

## Data flow

1. The app loads the current member, primary network, and normalized feed preferences.
2. The setup gate checks `preference_setup_completed_at`.
3. The member edits a local draft across three screens.
4. Review derives a human-readable summary from that draft.
5. Save normalizes the draft and performs one upsert through `feedRetentionService`.
6. Success updates the feed-preference query cache, invalidates ranking-dependent queries, and opens Home.
7. Home expands explicit groups into category weights, applies current time context, and produces explainable priorities and category order.
8. Normal use continues writing the existing bounded engagement events.

## Failure and edge states

- Loading preferences shows a stable setup shell without flashing defaults as saved choices.
- A failed save keeps every draft choice on screen and provides Retry. It does not navigate to Home or claim the setup was completed.
- A duplicate save is idempotent because the preference row remains unique by `user_id`.
- Invalid stored categories, group IDs, timing values, or category preference values are discarded during normalization.
- An empty interest selection is valid and means no topic receives an explicit boost.
- An empty scheduled-window selection means `When I open JUnited`.
- If offline, the existing offline treatment remains visible and save waits for an explicit retry after reconnection.
- If the member closes the setup without saving or skipping, it may appear again. Only successful Save or Skip marks it handled.

## Accessibility and mobile contract

- Verify at 390 by 844 CSS pixels first.
- Interactive controls provide at least a 44 by 44 CSS-pixel target.
- All selected states expose `aria-pressed`, `aria-checked`, or native equivalents.
- Progress is announced as text, not color alone.
- Back preserves the current draft.
- The flow supports keyboard navigation, visible focus, reduced motion, and screen-reader labels.
- Content can scroll vertically without horizontal overflow or trapping the fixed footer.

## Testing and acceptance

Automated coverage must prove:

- Interest-group expansion produces the expected canonical categories.
- Default selection is Local updates plus Events and plans.
- Unselected groups remain Normal rather than hidden.
- Amount mappings are correct and legacy `active` rows normalize safely.
- Important only is mutually exclusive with fixed timing windows.
- Save performs one sanitized preference mutation.
- Skip stores balanced defaults and does not enable notifications.
- Failed save preserves the draft and allows retry.
- Explicit Hide beats learned positive signals for ordinary content.
- Emergencies, the member's own activity, blocked users, expired items, and moderation exclusions preserve their existing contracts.
- Existing preference rows migrate without losing interests or engagement level.
- Settings and first-run setup produce the same normalized model.

Browser acceptance at iPhone size must verify the complete Save path, Skip path, Back behavior, scrolling, review summary, Settings edits, Home ordering changes, reload persistence, and zero console errors.

## Out of scope for this implementation

- Automatic push, email, or SMS enrollment.
- A black-box recommendation model.
- Reading private messages or private help coordination for ranking.
- Organization-specific sub-feeds or institution administration.
- Scheduled digest infrastructure.
- Replacing JUnited's existing community/network selection.

