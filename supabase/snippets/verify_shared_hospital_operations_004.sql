-- GalenMed Healthcare OS
-- Verification: Migration 004 Shared Hospital Operations Foundation
-- Read-only query. Expected status for every row: PASS.

with expected_tables(table_name) as (
  values
    ('service_catalog_items'),
    ('patients'),
    ('hospital_visits'),
    ('service_requests'),
    ('queue_entries'),
    ('billing_accounts'),
    ('billing_charge_items'),
    ('payment_transactions'),
    ('payment_clearances'),
    ('clinical_documents'),
    ('document_release_clearances'),
    ('document_release_records'),
    ('document_print_logs'),
    ('hospital_operation_audit_logs')
),

table_checks as (
  select
    'TABLE_RLS'::text as check_group,
    expected_tables.table_name::text as item,
    case
      when tables.oid is null then 'MISSING'
      when not tables.relrowsecurity then 'RLS_OFF'
      when count(policies.policyname) = 0 then 'NO_POLICIES'
      else 'PASS'
    end as status,
    concat(
      'policies=', count(policies.policyname),
      '; commands=',
      coalesce(
        string_agg(distinct policies.cmd, ', ' order by policies.cmd),
        'none'
      )
    ) as details
  from expected_tables
  left join pg_namespace schemas
    on schemas.nspname = 'public'
  left join pg_class tables
    on tables.relnamespace = schemas.oid
   and tables.relname = expected_tables.table_name
   and tables.relkind = 'r'
  left join pg_policies policies
    on policies.schemaname = 'public'
   and policies.tablename = expected_tables.table_name
  group by
    expected_tables.table_name,
    tables.oid,
    tables.relrowsecurity
),

expected_functions(function_name) as (
  values
    ('validate_service_request_context'),
    ('validate_queue_entry_context'),
    ('validate_billing_account_context'),
    ('validate_charge_item_context'),
    ('validate_payment_transaction_context'),
    ('validate_payment_clearance_context'),
    ('validate_clinical_document_context'),
    ('sync_document_release_clearance'),
    ('sync_release_clearances_from_payment'),
    ('validate_document_release_context'),
    ('mark_document_released'),
    ('validate_document_print_context'),
    ('can_view_patient_record'),
    ('can_view_service_request'),
    ('can_view_billing_account'),
    ('can_view_clinical_document')
),

function_checks as (
  select
    'FUNCTION'::text as check_group,
    expected_functions.function_name::text as item,
    case
      when exists (
        select 1
        from pg_proc routines
        join pg_namespace schemas
          on schemas.oid = routines.pronamespace
        where schemas.nspname = 'app_private'
          and routines.proname = expected_functions.function_name
      ) then 'PASS'
      else 'MISSING'
    end as status,
    'app_private operational integrity or authorization helper'::text as details
  from expected_functions
),

append_only_checks as (
  select
    'APPEND_ONLY'::text as check_group,
    target.table_name::text as item,
    case
      when exists (
        select 1
        from pg_trigger triggers
        join pg_class tables
          on tables.oid = triggers.tgrelid
        join pg_namespace schemas
          on schemas.oid = tables.relnamespace
        where schemas.nspname = 'public'
          and tables.relname = target.table_name
          and not triggers.tgisinternal
          and triggers.tgname like '%reject_mutation%'
      ) then 'PASS'
      else 'MISSING_TRIGGER'
    end as status,
    'Update/delete rejection trigger'::text as details
  from (
    values
      ('document_release_records'),
      ('document_print_logs'),
      ('hospital_operation_audit_logs')
  ) as target(table_name)
),

write_policy_checks as (
  select
    'DIRECT_WRITE_POLICY'::text as check_group,
    expected_tables.table_name::text as item,
    case
      when count(policies.policyname) filter (
        where policies.cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      ) = 0 then 'PASS'
      else 'UNEXPECTED_WRITE_POLICY'
    end as status,
    concat(
      'write_policies=',
      count(policies.policyname) filter (
        where policies.cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      )
    ) as details
  from expected_tables
  left join pg_policies policies
    on policies.schemaname = 'public'
   and policies.tablename = expected_tables.table_name
  group by expected_tables.table_name
)

select * from table_checks
union all
select * from function_checks
union all
select * from append_only_checks
union all
select * from write_policy_checks
order by check_group, item;
