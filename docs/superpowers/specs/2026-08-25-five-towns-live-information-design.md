# Five Towns Live Information Design

## Goal

Keep the approved personalized Five Towns dashboard and supply its local, events, Jewish-life, food, and safety categories with trustworthy automated information. Automated content is the factual base of JUnited; Aryeh and community publishers supply the human activity that cannot be inferred from public sources.

## Product promise

JUnited shows useful Five Towns information without inventing activity. Every automated item has a named source, a direct source link, a publication time, and a verified-source marker. Old items fall out of the normal Feed after the existing retention window.

## Trusted launch sources

- The 5T Brief public RSS for local reporting.
- Village of Cedarhurst public news RSS.
- Village of Cedarhurst public events RSS.
- JCCRP public community-events RSS.
- Town of Hempstead public news and alert RSS feeds.
- National Weather Service Nassau County active-alert API.
- Vaad Hakashrus public news RSS.

Only public HTTPS feeds are allowed. A source must be inserted by a platform-admin migration before it can be eligible for automatic publication.

## Automatic publication rules

1. Fetch enabled sources on a recurring schedule.
2. Parse no more than 20 entries from each source and deduplicate on the source plus its stable external key.
   Published posts also keep a unique `local-update:<item-id>` origin so a retry cannot create a second dashboard card.
3. Automatically publish no more than four newly discovered entries per source per run. This prevents a first sync from flooding Home.
4. Never automatically publish an entry whose source publication date is more than seven days old.
5. Mark the resulting post as official, verified, public, sourced, and Five Towns-local.
6. Copy only the headline and a short source-provided summary. The full story remains on the publisher's site.
7. Weather alerts become emergency-style Feed items only when the NWS payload says the alert is Severe or Extreme, or Immediate. Ordinary watches and informational weather items remain normal local updates.
8. If automatic post creation fails, leave the item pending in the existing manager review queue; never lose or fabricate it.

## Dashboard behavior

The existing Home Priority Stack and category dashboard remain unchanged. Automated posts enter the same personalization and ranking system as user posts. Verified, current, nearby items receive the existing verified/fresh ranking signals, while user preference controls still decide which ordinary categories appear.

Tapping an automated sourced item opens its original source in a new browser tab. Tapping a normal user post keeps the existing reply/detail behavior.

## Trust and safety

- JUnited does not claim ownership of publisher reporting.
- Each card retains `source_name`, `source_url`, and `last_verified_at`.
- No full article copying.
- No scraping of private groups, emails, or login-only pages.
- No AI-generated local facts or fake engagement.
- A source can be disabled without deleting already published records.

## Scheduling and operations

The ingestion Edge Function runs every 30 minutes through Supabase Cron and `pg_net`. Secrets are read from Supabase Vault. The cron job uses the existing server-only verification path and does not expose service keys to the browser.

## Verification limits

The code, parser policy, UI behavior, tests, and migration can be completed locally. Applying the migration and proving live ingestion require a safe linked/local Supabase environment. The existing untracked Supabase scaffold in this worktree is not part of this feature and must not be staged.
