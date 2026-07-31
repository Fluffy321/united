# Single Production Entry Design

## Decision

JUnited will have one signed-out front door. The former long-form marketing page is removed from the application rather than preserved as a secondary route.

## Route behavior

- `/` redirects with replacement to the protected `/Feed` route.
- A signed-out visitor is redirected by `ProtectedRoute` to `/login?from_url=%2FFeed`.
- `/login` without `from_url` renders the approved “Stay close to what matters” welcome presentation.
- `/welcome` redirects with replacement to `/login`; it never renders the former marketing page.
- Existing invite links use `/login`, not `/welcome`.

## Removal scope

- Remove the lazy `Landing` import and the live `/welcome` marketing route from `src/App.jsx`.
- Delete `src/pages/Landing.jsx` after proving it has no remaining live importer.
- Update route documentation and roadmap/master-plan statements that describe `Landing.jsx` as a live public surface.
- Preserve historical design documents as historical records; this specification supersedes their `/welcome` requirements.

## Verification

- Add a route-policy regression test that proves `/welcome` is a redirect target and that no live `Landing` import remains in `App.jsx`.
- Confirm focused tests fail before implementation and pass afterward.
- Run the full test, lint, typecheck, build, style, Jewish Hub, and roadmap-prompt checks.
- Run the complete JUnited self-check against the final commit.
- Verify on the deployed `https://www.junited.us/`, `/welcome`, and `/login` paths in a signed-out browser session.

## Release behavior

- Commit only the entry-route work and its documentation; preserve unrelated working-tree files.
- Push `main` to `origin/main` so the linked Vercel project deploys the change.
- Treat the task as complete only after the production URL serves the redesigned entry experience.

