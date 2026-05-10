-- Add covering indexes for mitzvah/chesed foreign keys used by the app and
-- flagged by the Supabase performance advisor.

create index if not exists chesed_hours_logs_request_id_idx
  on public.chesed_hours_logs (request_id);

create index if not exists chesed_hours_logs_completion_id_idx
  on public.chesed_hours_logs (completion_id);

create index if not exists chesed_hours_logs_verification_request_id_idx
  on public.chesed_hours_logs (verification_request_id);

create index if not exists chesed_hours_logs_verifier_id_idx
  on public.chesed_hours_logs (verifier_id);

create index if not exists chesed_hours_logs_user_id_idx
  on public.chesed_hours_logs (user_id);

create index if not exists mitzvah_requests_claimed_by_user_id_idx
  on public.mitzvah_requests (claimed_by_user_id);

create index if not exists mitzvah_requests_created_by_user_id_idx
  on public.mitzvah_requests (created_by_user_id);

create index if not exists mitzvah_completions_offer_id_idx
  on public.mitzvah_completions (offer_id);

create index if not exists verification_requests_request_id_idx
  on public.verification_requests (request_id);

create index if not exists verification_requests_completion_id_idx
  on public.verification_requests (completion_id);
