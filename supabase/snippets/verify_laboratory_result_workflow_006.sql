with expected_functions(
  function_signature,
  function_name
) as (
  values
    (
      'public.laboratory_save_result_draft(text,uuid,uuid,text,text,text,jsonb,text,text)',
      'laboratory_save_result_draft'
    ),
    (
      'public.laboratory_submit_result_for_verification(text,uuid)',
      'laboratory_submit_result_for_verification'
    ),
    (
      'public.laboratory_return_result_for_correction(text,uuid,text)',
      'laboratory_return_result_for_correction'
    ),
    (
      'public.laboratory_finalize_result(text,uuid,text)',
      'laboratory_finalize_result'
    )
),
function_checks as (
  select
    'RPC'::text as check_group,
    expected_functions.function_name as item,
    case
      when to_regprocedure(
        expected_functions.function_signature
      ) is null then 'MISSING'
      when not routines.prosecdef then 'NOT SECURITY DEFINER'
      when not has_function_privilege(
        'authenticated',
        routines.oid,
        'EXECUTE'
      ) then 'AUTHENTICATED CANNOT EXECUTE'
      when has_function_privilege(
        'anon',
        routines.oid,
        'EXECUTE'
      ) then 'ANON CAN EXECUTE'
      else 'PASS'
    end as status,
    expected_functions.function_signature as details
  from expected_functions
  left join pg_proc routines
    on routines.oid =
       to_regprocedure(
         expected_functions.function_signature
       )
),
private_helper_check as (
  select
    'PRIVATE HELPER'::text as check_group,
    'require_laboratory_result_metadata'::text as item,
    case
      when to_regprocedure(
        'app_private.require_laboratory_result_metadata(jsonb)'
      ) is null then 'MISSING'
      else 'PASS'
    end as status,
    'Validates specimen_type, result_items, required values, and supported flags.'::text as details
),
idempotency_table_check as (
  select
    'IDEMPOTENCY'::text as check_group,
    'app_private.laboratory_result_operation_keys'::text as item,
    case
      when to_regclass(
        'app_private.laboratory_result_operation_keys'
      ) is null then 'MISSING'
      when not exists (
        select 1
        from pg_trigger triggers
        where triggers.tgrelid =
          'app_private.laboratory_result_operation_keys'::regclass
          and triggers.tgname =
            'laboratory_result_operation_keys_reject_mutation'
          and not triggers.tgisinternal
      ) then 'NO APPEND-ONLY TRIGGER'
      else 'PASS'
    end as status,
    'Private operation keys prevent duplicate create, submit, return, or finalize actions.'::text as details
),
release_trigger_check as (
  select
    'RELEASE CONTROL'::text as check_group,
    'clinical_documents_sync_release_clearance'::text as item,
    case
      when exists (
        select 1
        from pg_trigger triggers
        where triggers.tgrelid =
          'public.clinical_documents'::regclass
          and triggers.tgname =
            'clinical_documents_sync_release_clearance'
          and not triggers.tgisinternal
      ) then 'PASS'
      else 'MISSING'
    end as status,
    'Finalized Laboratory results remain payment-aware before Reception release.'::text as details
),
permission_checks as (
  select
    'PERMISSION'::text as check_group,
    expected.code as item,
    case
      when permissions.id is null then 'MISSING'
      else 'PASS'
    end as status,
    'Required Laboratory workflow permission.'::text as details
  from (
    values
      ('laboratory.result.enter'),
      ('laboratory.result.verify'),
      ('laboratory.payment_status.view'),
      ('reception.release.view')
  ) expected(code)
  left join public.app_permissions permissions
    on permissions.code = expected.code
)
select *
from function_checks

union all

select *
from private_helper_check

union all

select *
from idempotency_table_check

union all

select *
from release_trigger_check

union all

select *
from permission_checks

order by
  check_group,
  item;
