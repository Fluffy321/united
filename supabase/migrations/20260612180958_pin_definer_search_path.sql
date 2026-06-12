do $$
declare
  function_record record;
begin
  for function_record in
    select
      p.oid,
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef = true
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) as config(setting)
        where config.setting like 'search_path=%'
      )
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public',
      function_record.nspname,
      function_record.proname,
      function_record.arguments
    );
  end loop;
end $$;
