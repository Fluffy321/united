# Protected 511NY Traffic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make live Five Towns traffic available without exposing the 511NY developer key in browser code.

**Architecture:** Move 511NY provider access and geographic filtering into a public-read Supabase Edge Function whose only secret is `NY511_API_KEY`. The React client invokes that function through the configured Supabase project and normalizes its constrained response into the existing four dashboard states.

**Tech Stack:** Supabase Edge Functions, Deno TypeScript, supabase-js, React Query, Vitest

## Global Constraints

- Store the provider credential only as the Supabase secret `NY511_API_KEY`.
- Never ship the key through a `VITE_` variable, URL, response body, or client log.
- Show only loading, incidents, verified empty, or unavailable states.
- A verified all-clear is allowed only after a successful 511NY response.
- Limit results to relevant crashes, closures, and roadwork within 12 miles of the Five Towns center.
- Return a short cache header and only the incident fields required by the dashboard.

---

## File structure

- `supabase/functions/five-towns-traffic/handler.ts`: provider request, parsing, filtering, and response construction as testable functions.
- `supabase/functions/five-towns-traffic/handler_test.ts`: Deno tests for missing secret, provider errors, filtering, redaction, and empty results.
- `supabase/functions/five-towns-traffic/index.ts`: CORS and HTTP entry point.
- `src/services/fiveTownsDailyService.js`: invokes the Edge Function and normalizes its response.
- `src/services/fiveTownsDailyService.test.js`: client-contract tests.
- `src/hooks/useFiveTownsDaily.js`: removes the browser key path and keeps five-minute polling.
- `.env.example`: removes the unsafe client-key instruction and documents the Supabase secret command.

### Task 1: Testable traffic Edge Function handler

**Files:**
- Create: `supabase/functions/five-towns-traffic/handler.ts`
- Create: `supabase/functions/five-towns-traffic/handler_test.ts`

**Interfaces:**
- Produces: `handleTrafficRequest(request, { apiKey, fetchImpl, now }): Promise<Response>`
- Produces response JSON: `{ status: 'ready'|'empty'|'unavailable', updatedAt, sourceLabel: '511NY', sourceUrl: 'https://511ny.org/', incidents: Array<{ id, type, description, road, startAt, latitude, longitude }> }`

- [ ] **Step 1: Write failing Deno tests**

Cover: missing `apiKey` returns 503/unavailable; a failed provider returns 502/unavailable; mixed near/far and relevant/irrelevant events return only the relevant nearby event; an empty successful provider response returns 200/empty; serialized responses never contain the provider key. Assert `cache-control` is `public, max-age=60, s-maxage=300` on successful responses.

- [ ] **Step 2: Run the Deno test and confirm failure**

Run: `deno test supabase/functions/five-towns-traffic/handler_test.ts`

Expected: FAIL because the handler does not exist.

- [ ] **Step 3: Implement the handler**

Use a Five Towns center of latitude `40.632`, longitude `-73.716`, and radius `12` miles. Request `https://511ny.org/api/v2/get/event?key=<secret>&format=json`; accept array, `events`, `Events`, or `data` payload shapes; match normalized event types `accidentsandincidents`, `closures`, and `roadwork`; and return only the stated normalized fields. Use `content-type: application/json`, `access-control-allow-origin: *`, and the specified cache header.

- [ ] **Step 4: Run the Deno test and confirm success**

Run: `deno test supabase/functions/five-towns-traffic/handler_test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the handler**

```bash
git add supabase/functions/five-towns-traffic/handler.ts supabase/functions/five-towns-traffic/handler_test.ts
git commit -m "feat: add protected Five Towns traffic handler"
```

### Task 2: Edge Function entry point

**Files:**
- Create: `supabase/functions/five-towns-traffic/index.ts`

**Interfaces:**
- Consumes: `handleTrafficRequest` and `Deno.env.get('NY511_API_KEY')`
- Produces: callable Supabase Function `five-towns-traffic`

- [ ] **Step 1: Add the HTTP entry point**

Handle `OPTIONS` with status 204 and CORS headers. For `GET` and `POST`, call `handleTrafficRequest(request, { apiKey: Deno.env.get('NY511_API_KEY') || '', fetchImpl: fetch, now: () => new Date() })`. Return 405 JSON for all other methods.

- [ ] **Step 2: Type-check the function files**

Run: `deno check supabase/functions/five-towns-traffic/index.ts supabase/functions/five-towns-traffic/handler.ts`

Expected: exit 0.

- [ ] **Step 3: Commit the function entry point**

```bash
git add supabase/functions/five-towns-traffic/index.ts
git commit -m "feat: expose Five Towns traffic function"
```

### Task 3: Safe client traffic adapter

**Files:**
- Modify: `src/services/fiveTownsDailyService.js`
- Modify: `src/services/fiveTownsDailyService.test.js`
- Modify: `src/hooks/useFiveTownsDaily.js`
- Modify: `.env.example`

**Interfaces:**
- Produces: `fetchFiveTownsTraffic({ client, signal }): Promise<TrafficResult>`
- Consumes: `client.functions.invoke('five-towns-traffic', { body: {} })`
- Keeps: the existing `TrafficRow` result shape and five-minute React Query refresh

- [ ] **Step 1: Replace client-key tests with function-contract tests**

Use a mock Supabase client. Assert the service invokes `five-towns-traffic`; maps `ready`, `empty`, and malformed/error responses into existing traffic shapes; and never accepts or adds a `key` query parameter.

- [ ] **Step 2: Run the service test and confirm failure**

Run: `npm test -- src/services/fiveTownsDailyService.test.js`

Expected: FAIL because the service still expects `apiKey` and direct `fetch`.

- [ ] **Step 3: Implement the Supabase function adapter**

Import the configured client from `@/api/supabaseClient`. Call `client.functions.invoke('five-towns-traffic', { body: {} })`, validate `status` and `incidents`, preserve `sourceUrl`, and return unavailable for a missing client, invocation error, or invalid response. Do not send the abort signal if the installed supabase-js invoke API cannot forward it.

- [ ] **Step 4: Remove the browser credential path**

Update `useFiveTownsDaily` so its traffic query no longer reads `import.meta.env.VITE_511NY_API_KEY`, no longer includes key presence in the query key, and retries a failed function call once. Update `.env.example` to document `supabase secrets set NY511_API_KEY=...` and remove `VITE_511NY_API_KEY`.

- [ ] **Step 5: Run service, hook-adjacent, and panel tests**

Run: `npm test -- src/services/fiveTownsDailyService.test.js src/components/home/FiveTownsDailyPanel.test.jsx`

Expected: PASS, including unavailable versus verified-empty honesty.

- [ ] **Step 6: Commit the client connection**

```bash
git add .env.example src/services/fiveTownsDailyService.js src/services/fiveTownsDailyService.test.js src/hooks/useFiveTownsDaily.js
git commit -m "feat: connect protected 511NY traffic"
```

### Task 4: Deploy instructions and end-to-end verification

**Files:**
- Create: `docs/operations/five-towns-traffic.md`
- Modify only if a failing check reveals a traffic-owned regression.

**Interfaces:**
- Consumes: Supabase project access and a user-created 511NY key
- Produces: reproducible secret configuration, function deployment, and dashboard verification

- [ ] **Step 1: Document the exact operator commands**

Document: request the key from `https://511ny.org/developers/doc`; run `supabase secrets set NY511_API_KEY='<key>' --project-ref <project-ref>`; run `supabase functions deploy five-towns-traffic --project-ref <project-ref> --no-verify-jwt`; and verify the dashboard without placing the key in Git, Vercel, screenshots, chat, or logs.

- [ ] **Step 2: Run all local checks**

Run: `deno test supabase/functions/five-towns-traffic/handler_test.ts && npm test && npm run lint && npm run typecheck && npm run build`

Expected: all commands exit 0.

- [ ] **Step 3: Run the JUnited self-check**

Follow `/Users/aryehkohn/.codex/skills/junited-self-check/SKILL.md` and resolve only issues caused by this traffic change.

- [ ] **Step 4: Verify both honest live states**

Without the Supabase secret, confirm Home displays `Live traffic unavailable` and links to 511NY. With the secret and deployed function, confirm Home displays either real nearby incidents or `No nearby 511NY incidents`, includes the 511NY source, and produces no console error at 390 × 844.

- [ ] **Step 5: Commit operations documentation**

```bash
git add docs/operations/five-towns-traffic.md
git commit -m "docs: add Five Towns traffic operations"
```
