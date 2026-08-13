# JUnited iPhone Reliability and Usefulness Pass

**Date:** 2026-08-13
**Status:** Approved by direct implementation request
**Scope:** Existing signed-in primary destinations only

## Goal

Make the current JUnited app immediately more usable on iPhones without replacing its routes, product model, data, or existing features.

## Audit findings

The signed-in production app was reviewed at a 390 × 844 iPhone viewport.

1. The shared bottom navigation overlaps real page content. This is visible on Home, Help, Directory, and Profile.
2. Home becomes a dead end when the network has no posts or urgent priorities. It explains the empty state but does not make the best existing actions easy to reach.
3. Communities can show only skeleton cards for a long period. There is no visible explanation, retry action, or useful alternate destination in the initial viewport.
4. Help and Profile already contain useful actions, but the shared shell can cover the next section and weaken their first-screen hierarchy.

## Chosen approach

Use one shared shell correction plus two focused destination improvements.

### 1. Shared iPhone safe area

- Preserve the existing five-tab navigation and route names.
- Give every mobile page enough bottom padding for the fixed navigation, floating feedback action, and iOS home indicator.
- Use the existing `mobile-safe-bottom`, `app-fixed-layer`, `app-fixed-frame`, and `app-floating-stack` utilities.
- Do not add page-specific fixed offsets.
- Keep touch targets at least 44 CSS pixels.

### 2. Useful empty Home

When Home has no community posts, show a compact `Start here` action group after the existing personalized priority area. It reuses existing routes and actions:

- Share an update through the current composer.
- Ask for help by opening the current Help/Mitzvah Circle request form directly.
- Find communities through the current Communities route.
- Browse nearby places and services through the current Directory/Map route.

This group must not claim that people, posts, or needs exist. It disappears once real feed posts are available so active networks remain content-first.

### 3. Communities loading recovery

- Keep the current Communities design and data query.
- Replace indefinite skeleton-only behavior with a timed recovery state.
- The recovery state explains that communities are taking longer than expected.
- It offers `Try again` and `Go home` actions.
- Ordinary loading still begins with skeleton cards to avoid a premature error flash.
- Query errors use the same clear recovery pattern.

## Existing screens preserved

- `/Feed`
- `/MitzvahCircle`
- `/Communities`
- `/Map`
- `/Profile`
- All existing category, composer, community, directory, settings, message, and profile routes.

## Error and empty states

- Empty content never uses fabricated counts or activity.
- Loading recovery appears only after a bounded wait.
- Retry calls the existing query refetch path.
- A user can always return Home.
- Network and authentication errors remain visible and actionable.

## Verification

- Unit/contract tests cover shared safe-bottom behavior, Home action routing, and Communities timeout/retry behavior.
- Lint, typecheck, full tests, prompt validation, style validation, Jewish Hub regression checks, and production build pass.
- Browser verification uses 390 × 844 and covers Home, Help, Communities, Directory, and Profile.
- The fixed bottom navigation must not cover the last actionable content on any audited route.

## Out of scope

- New social mechanics, badges, scoring, or gamification.
- New database tables or migrations.
- Invented content or seeded activity.
- Replacing the five-tab navigation.
- Redesigning every card or route in one pass.
- Native App Store packaging.
