# Live-Only Home Dashboard Design

## Goal

Make the approved personalized dashboard the permanent JUnited Home screen while ensuring the product never presents invented community conversations as real activity.

## Main route

- `/Feed` remains the main authenticated page.
- `/` continues to redirect to `/Feed`.
- The existing Home bottom-navigation item continues to open `/Feed`.

## Dashboard behavior

- Keep the existing Five Towns priority stack and category dashboard.
- Keep the calm priority state when no real item needs attention.
- Keep every category available as navigation even when that category has no current content.
- Do not change the approved dashboard layout, navigation, personalization, or iPhone-first shell.

## Live community posts

- Remove the Feed dependency on `DEMO_POSTS`.
- Remove the development-only preview banner.
- Never use invented people, conversations, engagement counts, rides, meals, events, or community-chat posts to fill an empty Feed.
- Show the “From your community” section only while real posts are loading, when a real loading error needs recovery, or when at least one real post exists.
- When loading finishes successfully with zero posts, omit the section. The dashboard and category navigation remain visible.
- When real Supabase posts arrive, rank and display them through the existing personalization system.

## Empty, loading, and error states

- Loading may show skeleton cards without fake names or claims.
- A failed real query may show the existing retryable error state.
- A successful empty query must not imply that community activity exists.
- The priority stack may truthfully say “Nothing needs immediate attention.”

## Cleanup

- Delete the unused `src/lib/feed/demoPosts.js` fixture after the Feed stops importing it.
- Preserve unrelated demo helpers outside the Home Feed; they are not part of this focused change.

## Verification

- Add a contract test proving Feed no longer imports or references `DEMO_POSTS` or preview-content copy.
- Preserve route tests proving `/Feed` is the app entry path and `Feed` is the configured main page.
- Run the complete JUnited self-check, including lint, tests, typecheck, build, route checks, and iPhone runtime verification.
