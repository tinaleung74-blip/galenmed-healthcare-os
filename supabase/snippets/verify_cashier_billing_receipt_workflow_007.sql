-- GalenMed Migration 007 verification
-- Read-only checks for Cashier receipt print audit and guarded RPC.

with checks as (
  select
    'TABLE'::text as check_group,
    'cashier_receipt_print_logs'::text as item,
    case
      when to_regclass('public.cashier_receipt_print_logs') is not null
        then 'PASS'
      else 'MISSING'
    end as status,
    'Append-only Cashier receipt print audit table'::text as details

  union all

  select
    'RLS',
    'cashier_receipt_print_logs',
    case
      when exists (
        select 1
        from pg_class tables
        join pg_namespace schemas
          on schemas.oid = tables.relnamespace
        where schemas.nspname = 'public'
          and tables.relname = 'cashier_receipt_print_logs'
          and tables.relrowsecurity
      ) then 'PASS'
      else 'RLS OFF'
    end,
    'Row Level Security enabled'

  union all

  select
    'POLICY',
    'cashier_receipt_print_logs_select_cashier_or_admin',
    case
      when exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'cashier_receipt_print_logs'
          and policyname = 'cashier_receipt_print_logs_select_cashier_or_admin'
          and cmd = 'SELECT'
      ) then 'PASS'
      else 'MISSING'
    end,
    'Cashier or System Admin branch-scoped read policy'

  union all

  select
    'TRIGGER',
    'cashier_receipt_print_logs_validate_context',
    case
      when exists (
        select 1
        from pg_trigger triggers
        join pg_class tables
          on tables.oid = triggers.tgrelid
        join pg_namespace schemas
          on schemas.oid = tables.relnamespace
        where schemas.nspname = 'public'
          and tables.relname = 'cashier_receipt_print_logs'
          and triggers.tgname = 'cashier_receipt_print_logs_validate_context'
          and not triggers.tgisinternal
      ) then 'PASS'
      else 'MISSING'
    end,
    'Payment, patient, account, branch, and receipt context validation'

  union all

  select
    'TRIGGER',
    'cashier_receipt_print_logs_reject_mutation',
    case
      when exists (
        select 1
        from pg_trigger triggers
        join pg_class tables
          on tables.oid = triggers.tgrelid
        join pg_namespace schemas
          on schemas.oid = tables.relnamespace
        where schemas.nspname = 'public'
          and tables.relname = 'cashier_receipt_print_logs'
          and triggers.tgname = 'cashier_receipt_print_logs_reject_mutation'
          and not triggers.tgisinternal
      ) then 'PASS'
      else 'MISSING'
    end,
    'Append-only update/delete protection'

  union all

  select
    'INDEX',
    'cashier_receipt_print_logs_idempotency_key_key',
    case
      when exists (
        select 1
        from pg_indexes
        where schemaname = 'public'
          and tablename = 'cashier_receipt_print_logs'
          and indexname = 'cashier_receipt_print_logs_idempotency_key_key'
      ) then 'PASS'
      else 'MISSING'
    end,
    'Idempotent receipt print protection'

  union all

  select
    'FUNCTION',
    'cashier_record_receipt_print',
    case
      when exists (
        select 1
        from pg_proc routines
        join pg_namespace schemas
          on schemas.oid = routines.pronamespace
        where schemas.nspname = 'public'
          and routines.proname = 'cashier_record_receipt_print'
          and routines.prosecdef
      ) then 'PASS'
      else 'MISSING OR NOT SECURITY DEFINER'
    end,
    'Guarded original and reprint receipt audit RPC'

  union all

  select
    'FUNCTION GRANT',
    'cashier_record_receipt_print authenticated',
    case
      when exists (
        select 1
        from pg_proc routines
        join pg_namespace schemas
          on schemas.oid = routines.pronamespace
        where schemas.nspname = 'public'
          and routines.proname = 'cashier_record_receipt_print'
          and has_function_privilege(
            'authenticated',
            routines.oid,
            'EXECUTE'
          )
      ) then 'PASS'
      else 'MISSING'
    end,
    'Authenticated staff may invoke guarded RPC'

  union all

  select
    'FUNCTION GRANT',
    'cashier_record_receipt_print anon denied',
    case
      when not exists (
        select 1
        from pg_proc routines
        join pg_namespace schemas
          on schemas.oid = routines.pronamespace
        where schemas.nspname = 'public'
          and routines.proname = 'cashier_record_receipt_print'
          and has_function_privilege(
            'anon',
            routines.oid,
            'EXECUTE'
          )
      ) then 'PASS'
      else 'FAIL'
    end,
    'Anonymous receipt-print RPC execution is denied'
)

select
  check_group,
  item,
  status,
  details
from checks
order by
  check_group,
  item;
