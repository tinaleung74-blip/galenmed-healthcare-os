-- GalenMed Healthcare OS
-- Verification: Migration 008 — Doctor Assignment and Consultation Workflow
-- Read-only verification query.

with expected_tables(table_name) as (
  values
    ('doctor_assignment_history'),
    ('doctor_consultations')
),

table_checks as (
  select
    'TABLE'::text as check_group,
    expected_tables.table_name as item,
    case
      when classes.oid is null then 'MISSING'
      when classes.relrowsecurity is false then 'RLS OFF'
      else 'PASS'
    end as status,
    concat(
      'rls=',
      coalesce(classes.relrowsecurity::text, 'missing')
    ) as details
  from expected_tables
  left join pg_namespace schemas
    on schemas.nspname = 'public'
  left join pg_class classes
    on classes.relnamespace = schemas.oid
   and classes.relname = expected_tables.table_name
   and classes.relkind = 'r'
),

expected_functions(function_name) as (
  values
    ('reception_assign_consultation_doctor'),
    ('doctor_start_consultation'),
    ('doctor_save_consultation_draft'),
    ('doctor_complete_consultation'),
    ('get_reception_doctor_assignment_data'),
    ('get_doctor_consultation_queue'),
    ('get_doctor_consultation_workspace')
),

function_checks as (
  select
    'FUNCTION'::text as check_group,
    expected_functions.function_name as item,
    case
      when procedures.oid is null then 'MISSING'
      when not procedures.prosecdef then 'NOT SECURITY DEFINER'
      when not has_function_privilege(
        'authenticated',
        procedures.oid,
        'EXECUTE'
      ) then 'AUTHENTICATED EXECUTE MISSING'
      when has_function_privilege(
        'anon',
        procedures.oid,
        'EXECUTE'
      ) then 'ANON EXECUTE PRESENT'
      else 'PASS'
    end as status,
    concat(
      'security_definer=',
      coalesce(procedures.prosecdef::text, 'missing'),
      '; authenticated_execute=',
      case
        when procedures.oid is null then 'missing'
        else has_function_privilege(
          'authenticated',
          procedures.oid,
          'EXECUTE'
        )::text
      end,
      '; anon_execute=',
      case
        when procedures.oid is null then 'missing'
        else has_function_privilege(
          'anon',
          procedures.oid,
          'EXECUTE'
        )::text
      end
    ) as details
  from expected_functions
  left join pg_namespace schemas
    on schemas.nspname = 'public'
  left join pg_proc procedures
    on procedures.pronamespace = schemas.oid
   and procedures.proname = expected_functions.function_name
),

policy_checks as (
  select
    'RLS POLICY'::text as check_group,
    expected_tables.table_name as item,
    case
      when count(policies.policyname) = 0 then 'NO POLICIES'
      else 'PASS'
    end as status,
    concat(
      'policies=',
      count(policies.policyname)
    ) as details
  from expected_tables
  left join pg_policies policies
    on policies.schemaname = 'public'
   and policies.tablename = expected_tables.table_name
  group by expected_tables.table_name
),

direct_write_checks as (
  select
    'DIRECT WRITE'::text as check_group,
    expected_tables.table_name as item,
    case
      when has_table_privilege(
        'authenticated',
        format('public.%I', expected_tables.table_name),
        'INSERT'
      )
      or has_table_privilege(
        'authenticated',
        format('public.%I', expected_tables.table_name),
        'UPDATE'
      )
      or has_table_privilege(
        'authenticated',
        format('public.%I', expected_tables.table_name),
        'DELETE'
      ) then 'DIRECT WRITE PRESENT'
      else 'PASS'
    end as status,
    concat(
      'insert=',
      has_table_privilege(
        'authenticated',
        format('public.%I', expected_tables.table_name),
        'INSERT'
      ),
      '; update=',
      has_table_privilege(
        'authenticated',
        format('public.%I', expected_tables.table_name),
        'UPDATE'
      ),
      '; delete=',
      has_table_privilege(
        'authenticated',
        format('public.%I', expected_tables.table_name),
        'DELETE'
      )
    ) as details
  from expected_tables
),

sequence_check as (
  select
    'SEQUENCE'::text as check_group,
    'app_private.doctor_consultation_number_sequence'::text as item,
    case
      when to_regclass(
        'app_private.doctor_consultation_number_sequence'
      ) is null then 'MISSING'
      else 'PASS'
    end as status,
    'Doctor consultation number source'::text as details
),

append_only_check as (
  select
    'APPEND ONLY'::text as check_group,
    'doctor_assignment_history'::text as item,
    case
      when exists (
        select 1
        from pg_trigger triggers
        join pg_class tables
          on tables.oid = triggers.tgrelid
        join pg_namespace schemas
          on schemas.oid = tables.relnamespace
        where schemas.nspname = 'public'
          and tables.relname = 'doctor_assignment_history'
          and triggers.tgname =
            'doctor_assignment_history_reject_mutation'
          and not triggers.tgisinternal
      ) then 'PASS'
      else 'MISSING TRIGGER'
    end as status,
    'Update and delete rejection trigger'::text as details
)

select * from table_checks
union all
select * from function_checks
union all
select * from policy_checks
union all
select * from direct_write_checks
union all
select * from sequence_check
union all
select * from append_only_check
order by
  check_group,
  item;
