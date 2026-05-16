-- ─────────────────────────────────────────────────────────────────────────────
-- 031_community_scoped_reports.sql
--
-- Adds community_id to reports so community admins can see content reports
-- filed against posts/content inside their community.
--
-- ReportModal already passes community_id in the insert payload — this column
-- was silently dropped before. Now it persists and is indexed.
--
-- RLS: community owners, admins, and moderators can read (not resolve)
-- reports for their own community. Resolution stays with platform admins.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.reports
  add column if not exists community_id uuid references public.communities(id) on delete set null;

create index if not exists reports_community_id_idx on public.reports (community_id);

-- Community owners, admins, and moderators can read unresolved reports for
-- their own community. They cannot update or delete — resolution stays with
-- platform admins to prevent conflicts of interest.
drop policy if exists "Community admins can read their community reports" on public.reports;
create policy "Community admins can read their community reports"
  on public.reports
  for select
  using (
    community_id is not null
    and exists (
      select 1 from public.community_memberships cm
      where cm.community_id = reports.community_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'admin', 'moderator')
    )
  );
