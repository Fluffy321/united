# Direct App Entry and Welcome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship JUnited's approved direct-to-Feed root behavior and the Neutral Pearl, multi-market-ready login welcome screen with the selected rich natural star field.

**Architecture:** Keep routing in `App.jsx` and authentication state in `Login.jsx`. Extract the approved welcome presentation into two dependency-free auth components, with a deterministic 56-item star constant so the visual is stable and directly testable. Track later screen redesigns and the separate multi-market platform foundation in the product roadmap rather than expanding this implementation into unrelated screens.

**Tech Stack:** React 18, React Router 6, Tailwind CSS, Lucide React, Vitest, React DOM server rendering.

## Global Constraints

- `/` redirects with replacement to `/Feed`; `/welcome` continues to render `Landing.jsx`.
- Direct `/login` renders welcome mode, while `/login?from_url=...` starts in sign-in mode.
- Reuse `/public/brand-mark.png`; both logo instances use the `#07101E` ink frame.
- Use the approved market-neutral copy verbatim and do not include "Five Towns" in the reusable welcome screen.
- Render exactly 56 deterministic, irregular, cool-white or blue-white stars with no runtime randomness, yellow stars, or tiled grid.
- Use one centered soft orbital band and one subtle orbital point, with no blue logo halo or multiple concentric circles.
- Preserve all existing sign-in, sign-up, OAuth, callback, safe return-path, and onboarding behavior.
- Keep later screen redesigns and multi-market data architecture outside this implementation.

---

### Task 1: Build and Test the Welcome Presentation

**Files:**
- Create: `src/components/auth/CommunitySignalGraphic.jsx`
- Create: `src/components/auth/LoginWelcomeScreen.jsx`
- Create: `src/components/auth/LoginWelcomeScreen.test.jsx`

**Interfaces:**
- Consumes: `/brand-mark.png`, Lucide icons, `onGetStarted: () => void`, and `onSignIn: () => void`.
- Produces: `CommunitySignalGraphic()`, `LoginWelcomeScreen({ onGetStarted, onSignIn })`, and exported `COMMUNITY_SIGNAL_STARS`.

- [ ] **Step 1: Write the failing presentation tests**

```jsx
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CommunitySignalGraphic, { COMMUNITY_SIGNAL_STARS } from './CommunitySignalGraphic';
import LoginWelcomeScreen from './LoginWelcomeScreen';

describe('CommunitySignalGraphic', () => {
  it('uses the approved deterministic rich star field', () => {
    const html = renderToStaticMarkup(<CommunitySignalGraphic />);
    expect(COMMUNITY_SIGNAL_STARS).toHaveLength(56);
    expect((html.match(/data-signal-star=/g) || [])).toHaveLength(56);
    expect(html).toContain('See what matters.');
    expect(html).toContain('Show up where it counts.');
  });
});

describe('LoginWelcomeScreen', () => {
  it('renders approved market-neutral copy without Five Towns claims', () => {
    const html = renderToStaticMarkup(
      <LoginWelcomeScreen onGetStarted={() => {}} onSignIn={() => {}} />
    );
    expect(html).toContain('Stay close to what matters.');
    expect(html).toContain('Local Jewish life, in one place.');
    expect(html).not.toContain('Five Towns');
    expect(html).not.toContain('trusted place');
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run src/components/auth/LoginWelcomeScreen.test.jsx`

Expected: FAIL because `CommunitySignalGraphic.jsx` and `LoginWelcomeScreen.jsx` do not exist.

- [ ] **Step 3: Implement `CommunitySignalGraphic`**

Create an exported 56-object constant with literal `left`, `top`, `size`, `opacity`, `tone`, and optional `glow` fields. Map it to absolutely positioned decorative `<span data-signal-star aria-hidden="true">` elements inside a deep-navy panel. Add the centered ink-framed logo, single elliptical band, orbital point, and semantic two-line signal copy.

- [ ] **Step 4: Implement `LoginWelcomeScreen`**

Render a single-column Neutral Pearl `<main>` with the ink-framed brand row, approved eyebrow/headline/supporting copy, `CommunitySignalGraphic`, three compact use-case cards, and two semantic 44px-or-larger buttons wired to the supplied callbacks.

- [ ] **Step 5: Run the focused test and verify success**

Run: `npx vitest run src/components/auth/LoginWelcomeScreen.test.jsx`

Expected: PASS with 2 tests.

- [ ] **Step 6: Commit the isolated presentation**

```bash
git add src/components/auth/CommunitySignalGraphic.jsx src/components/auth/LoginWelcomeScreen.jsx src/components/auth/LoginWelcomeScreen.test.jsx
git commit -m "feat: add multi-market login welcome presentation"
```

### Task 2: Integrate the Welcome Screen Without Changing Authentication

**Files:**
- Modify: `src/pages/Login.jsx`

**Interfaces:**
- Consumes: `LoginWelcomeScreen({ onGetStarted, onSignIn })`.
- Produces: existing `Login` behavior with the redesigned `welcome` branch and unchanged `signin`/`signup` branches.

- [ ] **Step 1: Remove obsolete welcome-only constants and imports**

Delete `VALUE_CHIPS`, the old welcome-only `Compass`, `HeartHandshake`, `MapPin`, `ShieldCheck`, `Sparkles`, and `Users` imports, while keeping every icon and helper required by the auth form.

- [ ] **Step 2: Replace only the `mode === 'welcome'` branch**

```jsx
if (mode === 'welcome') {
  return (
    <LoginWelcomeScreen
      onGetStarted={() => setMode('signup')}
      onSignIn={() => setMode('signin')}
    />
  );
}
```

Do not change `hasFromUrl`, `target`, OAuth handlers, callback loading, submit behavior, error handling, or the sign-in/sign-up JSX.

- [ ] **Step 3: Verify the focused tests and lint the touched files**

Run: `npx vitest run src/components/auth/LoginWelcomeScreen.test.jsx`

Expected: PASS.

Run: `npx eslint src/pages/Login.jsx src/components/auth/CommunitySignalGraphic.jsx src/components/auth/LoginWelcomeScreen.jsx src/components/auth/LoginWelcomeScreen.test.jsx --quiet`

Expected: exit code 0.

- [ ] **Step 4: Commit the integration**

```bash
git add src/pages/Login.jsx
git commit -m "feat: integrate redesigned login welcome"
```

### Task 3: Route Root Traffic Directly Into the App

**Files:**
- Create: `src/lib/appEntry.js`
- Create: `src/lib/appEntry.test.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `APP_ENTRY_PATH` with the exact value `'/Feed'`.
- Consumes: `APP_ENTRY_PATH` in the root `Navigate` route.

- [ ] **Step 1: Write the failing route-contract test**

```js
import { describe, expect, it } from 'vitest';
import { APP_ENTRY_PATH } from './appEntry';

describe('app entry route', () => {
  it('sends root traffic to the protected Feed', () => {
    expect(APP_ENTRY_PATH).toBe('/Feed');
  });
});
```

- [ ] **Step 2: Run the route-contract test and verify failure**

Run: `npx vitest run src/lib/appEntry.test.js`

Expected: FAIL because `src/lib/appEntry.js` does not exist.

- [ ] **Step 3: Add the entry constant and use it in `App.jsx`**

```js
export const APP_ENTRY_PATH = '/Feed';
```

Import the constant into `App.jsx` and replace:

```jsx
<Route path="/" element={<PageTransition><Landing /></PageTransition>} />
```

with:

```jsx
<Route path="/" element={<Navigate to={APP_ENTRY_PATH} replace />} />
```

Keep `/welcome` unchanged.

- [ ] **Step 4: Run the route and presentation tests**

Run: `npx vitest run src/lib/appEntry.test.js src/components/auth/LoginWelcomeScreen.test.jsx`

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit the route behavior**

```bash
git add src/App.jsx src/lib/appEntry.js src/lib/appEntry.test.js
git commit -m "feat: route root visitors into the Feed"
```

### Task 4: Record the Expansion Program and Verify the Full Experience

**Files:**
- Modify: `internal/roadmap.js`

**Interfaces:**
- Consumes: shipped implementation evidence and the repository prompt contract.
- Produces: a shipped `direct-app-entry-and-welcome-refresh` note plus a planned screen-by-screen redesign program that references the separate multi-market foundation.

- [ ] **Step 1: Update the roadmap**

Set `direct-app-entry-and-welcome-refresh` to `STATUS.SHIPPED` and add a shipped note naming the root redirect, preserved `/welcome`, redesigned direct `/login`, 56 deterministic stars, market-neutral copy, component tests, and browser verification. Add a high-priority planned `screen-by-screen-world-class-redesign` entry whose prompt requires one approved spec and browser-verified implementation per screen, starting with Feed, while preserving the separate `multi-market-launch-foundation` item.

- [ ] **Step 2: Verify roadmap prompts**

Run: `npm run check-prompts`

Expected: exit code 0 and every non-shipped AI-implementable item has a prompt.

- [ ] **Step 3: Run the complete automated checks**

Run: `npm test`

Expected: all Vitest suites pass.

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: production build completes successfully.

- [ ] **Step 4: Verify real browser paths**

Start the local Vite server and verify:

- `/login` at 320, 375, 390, 430, and desktop widths;
- the page has no horizontal overflow or console errors;
- the two welcome actions reach sign-up and sign-in;
- `/login?from_url=%2FFeed` skips welcome and shows sign-in;
- `/` reaches the protected `/Feed` path and a signed-out user lands at `/login?from_url=%2FFeed`;
- `/welcome` still renders `Landing`;
- keyboard focus is visible and reduced-motion behavior is safe.

- [ ] **Step 5: Run the JUnited repository self-check**

Invoke the `junited-self-check` skill and resolve any in-scope findings before completion.

- [ ] **Step 6: Commit the verified roadmap state**

```bash
git add internal/roadmap.js
git commit -m "docs: track screen-by-screen JUnited redesign"
```
