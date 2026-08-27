with expected_tables(table_name) as (
  values
    ('doctor_prescriptions'),
    ('doctor_prescription_items'),
    ('prescription_review_history')
),
expected_functions(function_name) as (
  values
    ('doctor_save_prescription_draft'),
    ('doctor_submit_prescription'),
    ('reception_return_prescription_for_correction'),
    ('reception_approve_prescription_for_release'),
    ('get_doctor_prescription_queue'),
    ('get_doctor_prescription_workspace'),
    ('get_reception_prescription_review_queue')
),
table_checks as (
  select
    'TABLE'::text as check_group,
    expected_tables.table_name::text as item,
    case
      when classes.oid is null then 'MISSING'
      when not classes.relrowsecurity then 'RLS OFF'
      when count(policies.policyname) = 0 then 'NO POLICIES'
      else 'PASS'
    end as status,
    concat('policies=', count(policies.policyname)) as details
  from expected_tables
  left join pg_namespace namespaces
    on namespaces.nspname = 'public'
  left join pg_class classes
    on classes.relnamespace = namespaces.oid
   and classes.relname = expected_tables.table_name
   and classes.relkind = 'r'
  left join pg_policies policies
    on policies.schemaname = 'public'
   and policies.tablename = expected_tables.table_name
  group by expected_tables.table_name, classes.oid, classes.relrowsecurity
),
function_checks as (
  select
    'FUNCTION'::text as check_group,
    expected_functions.function_name::text as item,
    case
      when functions.oid is null then 'MISSING'
      when functions.prosecdef is false then 'NOT SECURITY DEFINER'
      when has_function_privilege('anon', functions.oid, 'EXECUTE') then 'ANON CAN EXECUTE'
      when not has_function_privilege('authenticated', functions.oid, 'EXECUTE') then 'AUTH CANNOT EXECUTE'
      else 'PASS'
    end as status,
    coalesce(pg_get_function_identity_arguments(functions.oid), 'not found') as details
  from expected_functions
  left join pg_namespace namespaces
    on namespaces.nspname = 'public'
  left join pg_proc functions
    on functions.pronamespace = namespaces.oid
   and functions.proname = expected_functions.function_name
),
permission_checks as (
  select
    'PERMISSION'::text as check_group,
    permission_code::text as item,
    case
      when exists (
        select 1
        from public.app_permissions permissions
        where permissions.code = permission_code
      ) then 'PASS'
      else 'MISSING'
    end as status,
    'Required workflow permission'::text as details
  from (
    values
      ('doctor.prescription.view'),
      ('reception.prescription.review')
  ) permissions(permission_code)
),
append_only_checks as (
  select
    'APPEND ONLY'::text as check_group,
    'prescription_review_history'::text as item,
    case
      when exists (
        select 1
        from pg_trigger triggers
        join pg_class classes on classes.oid = triggers.tgrelid
        join pg_namespace namespaces on namespaces.oid = classes.relnamespace
        where namespaces.nspname = 'public'
          and classes.relname = 'prescription_review_history'
          and triggers.tgname = 'prescription_review_history_reject_mutation'
          and not triggers.tgisinternal
      ) then 'PASS'
      else 'MISSING TRIGGER'
    end as status,
    'Review history cannot be updated or deleted.'::text as details
),
direct_write_checks as (
  select
    'DIRECT WRITES'::text as check_group,
    expected_tables.table_name::text as item,
    case
      when has_table_privilege('authenticated', 'public.' || expected_tables.table_name, 'INSERT')
        or has_table_privilege('authenticated', 'public.' || expected_tables.table_name, 'UPDATE')
        or has_table_privilege('authenticated', 'public.' || expected_tables.table_name, 'DELETE')
      then 'AUTH HAS WRITE'
      else 'PASS'
    end as status,
    'Writes must use guarded RPCs.'::text as details
  from expected_tables
)
select * from table_checks
union all
select * from function_checks
union all
select * from permission_checks
union all
select * from append_only_checks
union all
select * from direct_write_checks
order by check_group, item;
