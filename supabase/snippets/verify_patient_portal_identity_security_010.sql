-- GalenMed Healthcare OS
-- Verification: Migration 010 Patient Portal Identity and Security
-- Read-only verification query. Expected status: PASS for every row.

with expected_tables(table_name) as (
  values
    ('patient_portal_accounts'),
    ('patient_portal_access_audit_logs')
),

table_checks as (
  select
    'TABLE'::text as check_group,
    expected_tables.table_name::text as item,
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

expected_functions(function_signature) as (
  values
    ('public.staff_link_patient_portal_account(uuid,uuid,text,text)'),
    ('public.staff_set_patient_portal_account_status(uuid,text,text)'),
    ('public.get_current_patient_portal_context()'),
    ('public.record_patient_portal_session_event(text,text,jsonb)'),
    ('public.get_patient_portal_management_data()'),
    ('app_private.current_patient_portal_account_id()'),
    ('app_private.current_patient_id()'),
    ('app_private.current_patient_portal_is_active()')
),

function_checks as (
  select
    'FUNCTION'::text as check_group,
    expected_functions.function_signature::text as item,
    case
      when to_regprocedure(
        expected_functions.function_signature
      ) is null then 'MISSING'
      when not routines.prosecdef then 'NOT SECURITY DEFINER'
      else 'PASS'
    end as status,
    concat(
      'security_definer=',
      coalesce(routines.prosecdef::text, 'missing')
    ) as details
  from expected_functions
  left join pg_proc routines
    on routines.oid =
       to_regprocedure(
         expected_functions.function_signature
       )
),

permission_checks as (
  select
    'PERMISSION'::text as check_group,
    permission_code::text as item,
    case
      when exists (
        select 1
        from public.app_permissions permissions
        where permissions.code =
          permission_code
      )
      and exists (
        select 1
        from public.role_permissions mappings
        join public.app_roles roles
          on roles.id = mappings.role_id
        join public.app_permissions permissions
          on permissions.id =
             mappings.permission_id
        where permissions.code =
          permission_code
          and roles.code = 'SYSTEM_ADMIN'
      )
      and exists (
        select 1
        from public.role_permissions mappings
        join public.app_roles roles
          on roles.id = mappings.role_id
        join public.app_permissions permissions
          on permissions.id =
             mappings.permission_id
        where permissions.code =
          permission_code
          and roles.code = 'RECEPTIONIST'
      )
      then 'PASS'
      else 'MISSING ROLE MAPPING'
    end as status,
    'SYSTEM_ADMIN and RECEPTIONIST mapping'::text
      as details
  from (
    values
      ('patient.portal.view'),
      ('patient.portal.manage')
  ) required_permissions(permission_code)
),

policy_checks as (
  select
    'POLICY'::text as check_group,
    expected_policy::text as item,
    case
      when exists (
        select 1
        from pg_policies policies
        where policies.schemaname = 'public'
          and policies.policyname =
              expected_policy
      )
      then 'PASS'
      else 'MISSING'
    end as status,
    'RLS select policy'::text as details
  from (
    values
      ('patient_portal_accounts_select_self_or_staff'),
      ('patient_portal_audit_select_self_or_staff')
  ) expected_policies(expected_policy)
),

trigger_checks as (
  select
    'TRIGGER'::text as check_group,
    trigger_name::text as item,
    case
      when exists (
        select 1
        from pg_trigger triggers
        where triggers.tgname =
          trigger_name
          and not triggers.tgisinternal
      )
      then 'PASS'
      else 'MISSING'
    end as status,
    'Expected protection trigger'::text
      as details
  from (
    values
      ('patient_portal_accounts_set_updated_at'),
      ('patient_portal_access_audit_reject_mutation')
  ) required_triggers(trigger_name)
),

index_checks as (
  select
    'INDEX'::text as check_group,
    index_name::text as item,
    case
      when exists (
        select 1
        from pg_indexes indexes
        where indexes.schemaname = 'public'
          and indexes.indexname =
              index_name
      )
      then 'PASS'
      else 'MISSING'
    end as status,
    'Identity uniqueness index'::text
      as details
  from (
    values
      ('patient_portal_accounts_login_email_unique_idx')
  ) required_indexes(index_name)
),

anonymous_execution_checks as (
  select
    'ANON EXECUTION'::text as check_group,
    expected_functions.function_signature::text as item,
    case
      when to_regprocedure(
        expected_functions.function_signature
      ) is null then 'MISSING'
      when has_function_privilege(
        'anon',
        to_regprocedure(
          expected_functions.function_signature
        ),
        'EXECUTE'
      )
      then 'FAIL'
      else 'PASS'
    end as status,
    'anon must not execute'::text as details
  from expected_functions
  where expected_functions.function_signature
    like 'public.%'
)

select * from table_checks
union all
select * from function_checks
union all
select * from permission_checks
union all
select * from policy_checks
union all
select * from trigger_checks
union all
select * from index_checks
union all
select * from anonymous_execution_checks
order by
  check_group,
  item;
