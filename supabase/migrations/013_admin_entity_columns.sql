-- ─────────────────────────────────────────────────────────────────────────────
-- 013_admin_entity_columns.sql
--
-- Adds columns that the app's entity payloads include but that were absent
-- from the original 008_admin_rls.sql table definitions.  Without these,
-- any INSERT from the app would fail with "column X of relation Y does not
-- exist" once SUPABASE_ENTITY_TABLES mappings are added for Report and
-- ClaimRequest.
--
-- Safe to re-run: all statements use IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────


-- reports: the app's ReportModal passes target_user_name for display in the
-- admin queue so the reviewer sees who was reported without a join.
alter table public.reports
  add column if not exists target_user_name text;


-- claim_requests: the app's ClaimModal passes both requester_email and
-- org_email (same value).  The original schema only had org_email; adding
-- requester_email lets the insert succeed and makes the intent explicit.
alter table public.claim_requests
  add column if not exists requester_email text;
