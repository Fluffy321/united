# Remove Duplicate Home Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the duplicate Home action card while preserving the richer category deck and real community posts.

**Architecture:** Delete the now-redundant presentation component and its unit test. Tighten Feed rendering so the community-post section appears only for loading, error, or real post states.

**Tech Stack:** React 18, Vitest, Vite, Tailwind CSS.

## Global Constraints

- Keep `Across your community` unchanged.
- Do not fabricate an empty community-post section.
- Preserve loading, error, and populated feed behavior.
- Verify at iPhone width.

### Task 1: Remove the duplicate surface

**Files:**
- Modify: `src/pages/Feed.contract.test.jsx`
- Modify: `src/pages/Feed.jsx`
- Delete: `src/components/feed/HomeStartHere.jsx`
- Delete: `src/components/feed/HomeStartHere.test.jsx`

- [ ] Update the Feed contract test to reject `HomeStartHere` imports and rendering.
- [ ] Run the focused test and confirm it fails.
- [ ] Remove the component import, empty-state rendering, and files.
- [ ] Run focused and full checks.
- [ ] Verify Home at 390px, commit, push, merge, and verify production.
