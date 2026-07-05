# Data-access layer tests

`supabaseRepository.test.js` unit-tests the entity API with a mocked Supabase client
(table mapping, query building, delete batching, local-fallback behavior). It does
NOT verify Row Level Security — RLS lives in Postgres and needs a real database.

## Running RLS policy tests later (not feasible in this environment)

1. Start a local Supabase stack (Docker required):
   ```bash
   npx supabase start          # boots local Postgres + PostgREST with our migrations
   npx supabase db reset       # re-applies everything in supabase/migrations/
   ```
2. Point a test-only client at the local stack using the URL and anon key printed
   by `npx supabase start` (never the production keys in `.env`).
3. Write Vitest integration specs (e.g. `supabaseRls.integration.test.js`, excluded
   from the default `npm test` run) that sign in as two different seeded users and
   assert policy behavior. Example assertions:
   - Anonymous client: `from('profiles').select()` returns only `public_profiles`
     columns via the view; direct writes to `profiles` fail.
   - User A cannot `update` or `delete` a `posts` row whose `user_id` is user B.
   - A non-member cannot read `community_group_chats` rows for a private community.
   - `user_blocks`: user A blocking B prevents B from inserting into `messages`
     for a conversation with A (enforced by policy/RPC, expect a 403/42501 error).
4. Assert on the error code (`error.code === '42501'`) or an empty result set,
   depending on whether the policy denies or filters.

Tear down with `npx supabase stop` when done.
