# Direct App Entry Design

## Objective

Remove the promotional landing page from JUnited's normal opening flow so people reach useful app behavior immediately.

## Product Decision

- `/` is the canonical app entry point and redirects to `/Feed`.
- A signed-in visitor reaches the protected Feed.
- A signed-out visitor follows the existing `ProtectedRoute` behavior to `/login?from_url=%2FFeed`.
- Because the login URL includes `from_url`, `Login.jsx` opens directly in sign-in mode instead of rendering its separate welcome screen.
- `/welcome` continues to render `Landing.jsx` as an intentional marketing/share page.
- Existing deep links and authentication return paths remain unchanged.

This gives repeat users an app-like launch while preserving a public explanation page for deliberate campaigns, sharing, and search indexing.

## Alternatives Considered

### Delete the marketing page

This would remove unused code, but it would also discard a useful public acquisition surface before JUnited has a replacement. It is unnecessarily destructive for the immediate goal.

### Make the Feed publicly readable

Showing value before authentication could improve acquisition, but it requires a separate privacy, moderation, data-query, and content-eligibility design. Community posts must not become public as a side effect of changing the entry route.

### Selected: direct app entry with an explicit `/welcome` page

This is the smallest change that removes both automatic introduction screens, protects existing content, and leaves room for future acquisition experiments.

## Routing and Component Behavior

`src/App.jsx` owns the change:

- Replace the `/` route's `Landing` element with `<Navigate to="/Feed" replace />`.
- Keep the `/welcome` route mapped to `Landing`.
- Keep `/Feed` inside the existing `<ProtectedRoute />` group.
- Keep `Landing` lazy-loaded because `/welcome` still uses it.

No authentication, Supabase, onboarding, layout, or Feed component changes are required.

## User Flows

### Returning signed-in user

1. Open `https://www.junited.us/`.
2. Router replaces `/` with `/Feed`.
3. `ProtectedRoute` confirms authentication.
4. Feed renders in the normal app shell.

### Signed-out user

1. Open `https://www.junited.us/`.
2. Router replaces `/` with `/Feed`.
3. `ProtectedRoute` replaces the URL with `/login?from_url=%2FFeed`.
4. `Login.jsx` detects `from_url` and opens the sign-in form directly.
5. Successful authentication returns the user to `/Feed`.

### Deliberate marketing visitor

1. Open `https://www.junited.us/welcome`.
2. The existing `Landing.jsx` page renders.
3. Its calls to action continue to route into authentication or the app.

## Failure and Edge Cases

- Authentication loading continues to use the current protected-route fallback.
- Authentication errors continue to resolve through the current login redirect.
- New authenticated users who have not completed onboarding still receive `OnboardingFlow`; the entry-route change does not bypass onboarding.
- Browser history should not retain the now-obsolete `/` page because redirects use `replace`.
- Unknown URLs continue to use the existing not-found behavior.

## Verification

Add focused route tests if the current test harness supports rendering `App.jsx` without broad mocking. At minimum, verify:

- `/` resolves to `/Feed`.
- `/welcome` still renders the marketing page.
- Signed-out `/Feed` resolves to `/login?from_url=%2FFeed`.
- Login with `from_url` starts in sign-in mode.
- The existing lint, test, and production build commands pass.
- Browser verification covers `/`, `/welcome`, and the signed-out authentication path at mobile and desktop widths.

## Success Criteria

- No visitor sees `Landing.jsx` merely by opening the JUnited root URL.
- No signed-out root visitor sees the login welcome screen before the sign-in form.
- Signed-in users reach the Feed from `/`.
- `/welcome` remains available and functional.
- No protected content becomes publicly readable.

## Non-Goals

- Redesigning the Feed, login form, onboarding, or marketing page.
- Making community content publicly visible.
- Changing post-authentication onboarding rules.
- Removing `Landing.jsx`.
- Deploying broader retention or growth experiments in this change.

