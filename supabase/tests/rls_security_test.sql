-- supabase/tests/rls_security_test.sql
-- Run in the Supabase SQL editor. Paste whole, press Run.
-- Reads only. Writes nothing.
--
-- One check is EXPECTED to fail today:
--   "public_profiles is security_invoker"
-- This is deliberate, not a regression. 20260701230000_public_profiles_deleted_at.sql:6
-- explicitly sets security_invoker = false so the view can bypass RLS on profiles.
-- It has to: the only SELECT policy on profiles is auth.uid() = id, so invoker mode
-- would return zero rows for every other user and blank every name and avatar in the app.
-- Do NOT flip this without first adding a public-read policy to profiles.
-- The check exists to make sure the decision stays visible and intentional.
--
-- Any OTHER failure is a regression. Investigate before shipping.

select * from (
  with checks as (
    select * from (values
      (
        'public_profiles is security_invoker',
        coalesce((
          select array_to_string(c.reloptions, ',') like '%security_invoker=true%'
          from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
          where ns.nspname = 'public' and c.relname = 'public_profiles'
        ), false),
        coalesce((
          select array_to_string(c.reloptions, ',')
          from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
          where ns.nspname = 'public' and c.relname = 'public_profiles'
        ), 'no reloptions')
      ),
      (
        'all public tables have RLS enabled',
        (select count(*) from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
         where ns.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false) = 0,
        (select count(*)::text || ' tables without RLS'
         from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
         where ns.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false)
      ),
      (
        'all SECURITY DEFINER functions pin search_path',
        (select count(*) from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
         where ns.nspname = 'public' and p.prosecdef
           and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) cfg where cfg like 'search_path=%')) = 0,
        (select count(*)::text || ' unpinned'
         from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
         where ns.nspname = 'public' and p.prosecdef
           and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) cfg where cfg like 'search_path=%'))
      ),
      (
        'profiles has no policy allowing cross-user reads',
        (select count(*) from pg_policy
         where polrelid = 'public.profiles'::regclass
           and polcmd in ('r','*')
           and pg_get_expr(polqual, polrelid) not like '%auth.uid() = id%'
           and pg_get_expr(polqual, polrelid) not like '%is_admin()%') = 0,
        (select coalesce(string_agg(polname, '; '), 'none')
         from pg_policy
         where polrelid = 'public.profiles'::regclass
           and polcmd in ('r','*')
           and pg_get_expr(polqual, polrelid) not like '%auth.uid() = id%'
           and pg_get_expr(polqual, polrelid) not like '%is_admin()%')
      ),
      (
        'anon has no SELECT on public_profiles',
        (select count(*) from information_schema.role_table_grants
         where table_schema='public' and table_name='public_profiles'
           and grantee='anon' and privilege_type='SELECT') = 0,
        (select count(*)::text || ' anon grants'
         from information_schema.role_table_grants
         where table_schema='public' and table_name='public_profiles'
           and grantee='anon' and privilege_type='SELECT')
      )
    ) as t(check_name, passed, detail)
  )
  select
    case when passed then 'PASS' else 'FAIL' end as status,
    check_name,
    detail
  from checks
) r order by status, check_name;
