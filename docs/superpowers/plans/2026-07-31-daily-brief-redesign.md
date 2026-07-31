# Daily Brief Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized, untrustworthy Daily Brief carousel with a compact truthful daily briefing that leads with what matters and progressively discloses Mitzvah and Explore paths.

**Architecture:** Export pure brief-selection helpers from the focused briefing component so data trust rules can be tested without browser state. Keep the summary permanently visible, render one optional detail panel at a time, and pass the selected network plus post-opening navigation from `Feed.jsx`. Reuse `DailyTapMitzvah` only inside the Mitzvah disclosure.

**Tech Stack:** React 18, Vite, Tailwind CSS, Vitest, React DOM static rendering, Supabase-backed feed data, Vercel

## Global Constraints

- Never fabricate local updates, needs, events, activity counts, urgency, or progress.
- The default view answers “What matters today?” in one compact card.
- “Today's mitzvah” and “Explore today” remain available through progressive disclosure.
- All market copy uses `networkLabel`; no Five Towns coordinates or labels live in the presentation component.
- Unrelated working-tree changes under `.claude/skills/junited-self-check/` must not be modified or committed.
- Completion requires verification on `www.junited.us`, not only localhost.

---

### Task 1: Lock the truthful briefing contract

**Files:**
- Create: `src/components/feed/FiveTownsBrief.test.jsx`
- Modify: `src/components/feed/FiveTownsBrief.jsx`

**Interfaces:**
- Produces: `buildBriefingItems({ brief, posts })`, `findUrgentNeed(posts)`, and the default summary markup.
- Consumes: real `brief.topLocalUpdates` and real feed post records.

- [ ] **Step 1: Write failing helper and markup tests**

Test curated precedence, feed fallback, no fabricated empty data, urgent future expiry, the visible “What matters today” summary, the two disclosure buttons, and absence of legacy fake names and carousel controls.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/feed/FiveTownsBrief.test.jsx`

Expected: FAIL because the helper exports and redesigned contract do not exist.

- [ ] **Step 3: Implement the minimal redesigned component**

Replace the carousel with a summary plus two disclosure panels. Use the pure helpers to cap updates at three, preserve true labels, select only real urgent needs, and produce an empty array when no data exists.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/feed/FiveTownsBrief.test.jsx`

Expected: all focused tests pass without console warnings.

### Task 2: Wire market-aware navigation and refine presentation

**Files:**
- Modify: `src/pages/Feed.jsx`
- Modify: `src/components/feed/FiveTownsBrief.jsx`

**Interfaces:**
- Consumes: `primaryNetwork.shortLabel`, React Router `navigate`, and existing composer callbacks.
- Produces: `networkLabel` and `onOpenPost(post)` props for the Daily Brief.

- [ ] **Step 1: Add failing integration assertions**

Extend the focused test to require a supplied network label and real post-detail action semantics.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/feed/FiveTownsBrief.test.jsx`

Expected: FAIL until the network-aware markup and action are wired.

- [ ] **Step 3: Wire Feed and complete the visual system**

Pass the active network label and `/PostDetail?id=<id>` callback. Apply the documented paper/ink/dawn palette, restrained Fraunces hierarchy, horizon treatment, responsive spacing, accessible buttons, and truthful empty states.

- [ ] **Step 4: Verify GREEN and regression safety**

Run: `npm test -- src/components/feed/FiveTownsBrief.test.jsx && npm test`

Expected: focused and full suites pass.

### Task 3: Verify and release production

**Files:**
- Modify only current roadmap documentation if its shipped-state wording requires it.

**Interfaces:**
- Consumes: the tested Daily Brief redesign.
- Produces: a verified `origin/main` deployment on `www.junited.us`.

- [ ] **Step 1: Run all automated gates**

Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm run check-style`, `npm run check-jewish-hub`, and `npm run check-prompts`; every command must exit 0.

- [ ] **Step 2: Run the complete JUnited self-check**

Run checks 0–17 from `.claude/skills/junited-self-check/SKILL.md`, separating any pre-existing failure from this change.

- [ ] **Step 3: Commit only intentional files and push**

Stage the Daily Brief component, its tests, `Feed.jsx`, and these design/plan documents. Commit with `feat: redesign the daily brief`, then push `main` to `origin/main`.

- [ ] **Step 4: Verify production**

Wait for the linked Vercel deployment, open the authenticated production Feed, verify the new briefing at mobile width, exercise both disclosure paths and a real action, and confirm the browser console is clean.
