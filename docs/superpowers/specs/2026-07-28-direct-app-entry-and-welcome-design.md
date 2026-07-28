# Direct App Entry and Welcome Screen Design

## Objective

Make JUnited open like a useful app instead of a marketing website, while turning the deliberate login welcome screen into a distinctive, multi-market-ready introduction.

The change has two connected outcomes:

1. The root URL takes people directly toward the Feed.
2. The welcome mode at `/login` becomes the visual benchmark for JUnited's screen-by-screen product redesign.

## Product Decisions

### Direct app entry

- `/` is the canonical app entry point and redirects to `/Feed`.
- A signed-in visitor reaches the protected Feed.
- A signed-out visitor follows the existing `ProtectedRoute` behavior to `/login?from_url=%2FFeed`.
- Because the login URL includes `from_url`, `Login.jsx` opens directly in sign-in mode instead of rendering its welcome mode.
- `/welcome` continues to render `Landing.jsx` as an intentional marketing/share page.
- Existing deep links and authentication return paths remain unchanged.

### Deliberate login welcome

- A direct visit to `/login` without `from_url` renders the redesigned welcome mode.
- "Get started" switches to the existing sign-up mode.
- "Already have an account? Sign in" switches to the existing sign-in mode.
- The sign-in and sign-up forms, OAuth behavior, email verification, callback handling, and post-authentication destination logic remain functionally unchanged.

This removes automatic introduction screens from the normal app launch while preserving a polished acquisition surface when someone intentionally enters through `/login`.

## Multi-Market Brand Contract

JUnited may launch into multiple geographic markets at or near the same time. Core welcome copy must therefore work unchanged in every community.

- Do not hardcode "Five Towns" into reusable brand promises, headings, feature labels, or calls to action.
- Market names may appear contextually after JUnited knows the visitor's selected or detected market.
- Do not imply complete coverage, guaranteed activity, guaranteed trust, or guaranteed relevance.
- Prefer invitations and product intent over numerical or factual marketing claims.
- The visual system must remain recognizable when market-specific content is introduced later.

Approved reusable copy:

- Brand subline: **Local Jewish life, in one place.**
- Eyebrow: **Built for real community**
- Headline: **Stay close to what matters.**
- Supporting copy: **One place for local updates, mitzvah needs, shuls, events, businesses, and neighbors.**
- Signal message: **See what matters. Show up where it counts.**
- Use-case labels: **Local updates**, **Community needs**, **Places & plans**
- Primary action: **Get started**
- Secondary action: **Already have an account? Sign in**

## Visual Direction

### Page foundation: Neutral Pearl

The page remains light, but not pure white.

- Base: a subtle vertical gradient from `#FCFBF8` to `#F3F2EE`.
- Atmosphere: a very faint cool-blue radial light near the upper-right using approximately `rgba(176, 205, 242, 0.07)`.
- The result should feel warm and human without reading as cream, beige, or sepia.
- Cards and controls may use translucent white so the pearl foundation remains visible.

Neutral Pearl is the benchmark light surface for this screen. It does not automatically become the background of every authenticated screen; later screens must be evaluated in their own functional context.

### Brand mark treatment

- Reuse the existing `/public/brand-mark.png`; do not generate or substitute a new logo.
- Both visible logo instances use a narrow ink frame.
- Frame color: `#07101E`.
- The frame is approximately 4–5 CSS pixels around the image.
- Avoid blue outer framing, pure-black framing, large halos, and circular color fades behind the logo.
- The top brand mark and the signal-graphic mark use the same framing language at different sizes.

### Signal graphic

The dark signal panel replaces the current generic two-by-two feature grid as the memorable visual center.

- Background: a natural dark sky using deep navy values around `#07142D`, `#040A19`, and `#020713`.
- Stars: exactly 18 deterministic, irregularly positioned cool-white or blue-white stars.
- Stars vary subtly in size and opacity.
- Do not use yellow/gold stars, repeating CSS grids, tiled star textures, fake notification counts, or random values generated at runtime.
- The logo is centered horizontally within the graphic.
- One centered soft orbital band surrounds the logo:
  - a single low-contrast elliptical light trail;
  - centered on the logo;
  - slightly rotated;
  - no multiple concentric circles;
  - one subtle orbital point is allowed.
- Do not add a blue circle, color halo, or fade layer behind the logo.
- The message sits below the logo inside the panel:
  - first line in white;
  - second line in a restrained cool blue;
  - both lines remain readable against the sky at small mobile widths.

### Supporting use cases and actions

- Replace the current four large value cards with three compact use-case cards.
- Each card contains one small icon and one short label.
- The cards must not introduce fabricated counts, activity claims, or guarantees.
- The primary action is a dark ink button.
- The sign-in action is visually quieter but still reads as a full-width interactive control.
- All controls retain at least a 44-by-44 CSS pixel touch target.

## Architecture and Component Boundaries

`src/App.jsx` owns the routing change:

- Replace the `/` route's `Landing` element with `<Navigate to="/Feed" replace />`.
- Keep `/welcome` mapped to `Landing`.
- Keep `/Feed` inside the existing `<ProtectedRoute />` group.
- Keep `Landing` lazy-loaded because `/welcome` still uses it.

`src/pages/Login.jsx` continues to own:

- `welcome`, `signin`, and `signup` mode orchestration;
- authentication callbacks;
- form state and submission;
- OAuth actions;
- safe `from_url` handling;
- post-authentication navigation.

Create focused presentation components under `src/components/auth/`:

- `LoginWelcomeScreen.jsx`
  - renders the Neutral Pearl welcome layout;
  - receives `onGetStarted` and `onSignIn` callbacks;
  - contains no authentication or navigation logic.
- `CommunitySignalGraphic.jsx`
  - renders the dark-sky graphic, deterministic stars, centered soft orbital band, logo, and two-line signal message;
  - exposes no data or network dependency;
  - marks purely decorative layers as hidden from assistive technology while preserving meaningful copy.

The deterministic star positions should live as a local constant in `CommunitySignalGraphic.jsx`. Runtime randomness would cause visual instability and make screenshots and tests nondeterministic.

## User Flows

### Returning signed-in user

1. Open `https://www.junited.us/`.
2. Router replaces `/` with `/Feed`.
3. `ProtectedRoute` confirms authentication.
4. Feed renders in the normal app shell.

### Signed-out root visitor

1. Open `https://www.junited.us/`.
2. Router replaces `/` with `/Feed`.
3. `ProtectedRoute` replaces the URL with `/login?from_url=%2FFeed`.
4. `Login.jsx` detects `from_url` and opens the sign-in form directly.
5. Successful authentication returns the user to `/Feed`.

### Direct login visitor

1. Open `/login` without `from_url`.
2. The redesigned welcome mode renders.
3. "Get started" opens sign-up mode.
4. "Already have an account? Sign in" opens sign-in mode.

### Deliberate marketing visitor

1. Open `/welcome`.
2. The existing `Landing.jsx` page renders.
3. Its calls to action continue to route into authentication or the app.

## Accessibility and Responsive Behavior

- Use semantic headings, buttons, and landmarks.
- The brand image retains useful alternative text where it communicates identity.
- Decorative stars, haze, and orbital lines are `aria-hidden`.
- Text contrast must meet WCAG AA.
- Focus indicators remain visible on both the pearl background and dark controls.
- The full welcome screen must fit naturally at 320, 375, 390, and 430 CSS pixel widths without horizontal scrolling.
- Desktop keeps the same focused single-column composition; do not stretch the welcome content into a dashboard-like layout.
- If subtle motion is added to the orbital point or light band, it must be slow, nonessential, and disabled under `prefers-reduced-motion`.
- No functionality or message may depend on animation.

## Failure and Edge Cases

- Authentication loading continues to use the current protected-route fallback.
- Authentication errors continue to resolve through the current login redirect and existing inline form messaging.
- New authenticated users who have not completed onboarding still receive `OnboardingFlow`.
- Browser history does not retain the obsolete `/` page because redirects use `replace`.
- Unknown URLs continue to use the existing not-found behavior.
- A failed logo request must not expose fallback text inside the signal graphic; reserve dimensions and fail visually quietly.
- The signal graphic must remain legible when CSS animation is disabled or unsupported.

## Verification

Automated coverage should verify:

- `/` resolves to `/Feed`.
- `/welcome` still renders the marketing page.
- signed-out `/Feed` resolves to `/login?from_url=%2FFeed`;
- login with `from_url` starts in sign-in mode;
- direct `/login` starts in the redesigned welcome mode;
- "Get started" enters sign-up mode;
- "Already have an account? Sign in" enters sign-in mode;
- the signal graphic renders exactly 18 deterministic stars;
- approved multi-market copy is present and "Five Towns" is absent from the reusable welcome screen.

Visual browser verification should cover:

- `/login` at 320, 375, 390, and 430 CSS pixel widths;
- `/login` at a representative desktop width;
- `/`, `/Feed`, and `/welcome`;
- keyboard focus order;
- reduced-motion behavior;
- no horizontal overflow;
- no console errors.

Run the repository's complete applicable verification commands, including tests, lint, and production build.

## Success Criteria

- No visitor sees `Landing.jsx` merely by opening the root URL.
- No signed-out root visitor sees the welcome mode before the sign-in form.
- Signed-in users reach the Feed from `/`.
- A direct `/login` visitor sees the approved Neutral Pearl welcome screen.
- The welcome screen uses the approved multi-market copy.
- The visual contains no fabricated counts or activity claims.
- The signal graphic uses the existing JUnited logo, narrow ink framing, 18 irregular stars, and one centered soft orbital band.
- `/welcome` remains available and functional.
- No protected content becomes publicly readable.
- Existing sign-in, sign-up, OAuth, callback, and onboarding behavior remains intact.

## Non-Goals

- Redesigning the sign-in or sign-up forms in this change.
- Redesigning the Feed, onboarding flow, or marketing landing page.
- Making community content publicly visible.
- Implementing market detection, market selection, or market-specific routing.
- Removing `Landing.jsx`.
- Applying Neutral Pearl indiscriminately to every authenticated screen.
- Starting the rest of the screen-by-screen redesign before this entry experience is implemented and verified.
