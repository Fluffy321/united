# Communities iPhone Focus

**Date:** 2026-08-13
**Status:** Approved
**Route:** `/Communities`

## Goal

Make Communities understandable in the first iPhone screen. A user should choose between their joined communities and discovering new ones, then reach a useful room without passing several competing sections.

## Current problem

The live screen stacks too many systems before the community list: Jewish Content, an `All` control, My/Discover tabs, ten category tiles, Start Here, and Essential 10. These are individually useful but collectively hide the main job: entering or joining a community.

## Approved hierarchy

1. Keep the existing Communities header and Create action.
2. Make `My Communities` and `Discover` the first clear choice below the header.
3. In Discover, show three useful recommended communities immediately.
4. Replace the ten-card category block with one compact, horizontally scrollable category row.
5. Put the remaining community catalog below the recommendations.
6. Move Jewish Content below the community discovery experience as a secondary tool.

## My Communities

- Joined communities appear immediately after the mode switch.
- Existing loading, onboarding, activity, open-room, group, and empty-state behavior remains intact.
- If the user has no joined communities, keep the existing path into Discover.

## Discover

- Use the existing community data and membership state.
- Rank the first three recommendations using the current Essential/featured ordering; do not invent activity.
- Each recommendation has one primary action: `Open room` when joined, otherwise `Join room`.
- Categories filter the existing catalog and remain reachable without occupying a full screen.
- Search, size/activity filters, creation, joining, and community detail routes continue to work.

## Visual rules

- iPhone-first at 390 × 844.
- Use the existing JUnited navy/blue system, shared cards, and `mobile-safe-bottom` shell.
- Use 44px minimum touch targets.
- Avoid duplicated headings, decorative filler, and repeated explanations.
- No fake counts, urgency, activity, or testimonials.

## States and errors

- Preserve the shipped Communities loading timeout and its `Try again` / `Go home` actions.
- Do not show an empty message during loading or query failure.
- Existing join errors remain visible through the current toast flow.
- Cached communities remain available when the network is slow.

## Verification

- Add contract/render tests for the new ordering and compact category rail.
- Run the complete test, lint, typecheck, roadmap, style, Jewish Hub, and production build checks.
- Test My Communities, Discover, category filtering, opening a room, joining a room, Create, and loading recovery.
- Verify at 390 × 844 with no horizontal page overflow and no bottom-navigation overlap.
- Push to GitHub, merge only after Vercel passes, then verify the production route.

## Out of scope

- New database tables or migrations.
- New community types or seeded communities.
- Rebuilding community detail pages.
- Changing the five-tab app navigation.
