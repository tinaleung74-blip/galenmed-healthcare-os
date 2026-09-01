-- GalenMed Healthcare OS
-- Verification: Migration 011 Patient Portal Released Records and Billing
-- Read-only query. Expected status: PASS for every row.

with expected_functions(
  function_signature,
  callable_by_patient
) as (
  values
    (
      'public.get_patient_portal_released_documents(text)',
      true
    ),
    (
      'public.get_patient_portal_billing_data()',
      true
    ),
    (
      'public.open_patient_portal_released_document(uuid)',
      true
    ),
    (
      'public.record_patient_portal_print_request(uuid)',
      true
    ),
    (
      'app_private.patient_portal_document_payload(uuid,uuid)',
      false
    )
),

function_checks as (
  select
    'FUNCTION'::text as check_group,
    expected_functions.function_signature::text as item,
    case
      when procedures.oid is null then
        'MISSING'
      when not procedures.prosecdef then
        'NOT SECURITY DEFINER'
      else
        'PASS'
    end as status,
    concat(
      'security_definer=',
      coalesce(
        procedures.prosecdef::text,
        'missing'
      )
    ) as details
  from expected_functions
  left join pg_proc procedures
    on procedures.oid =
       to_regprocedure(
         expected_functions.function_signature
       )
),

execution_checks as (
  select
    'EXECUTION'::text as check_group,
    expected_functions.function_signature::text as item,
    case
      when to_regprocedure(
        expected_functions.function_signature
      ) is null then
        'MISSING'
      when has_function_privilege(
        'anon',
        to_regprocedure(
          expected_functions.function_signature
        ),
        'EXECUTE'
      ) then
        'ANON CAN EXECUTE'
      when expected_functions.callable_by_patient
       and not has_function_privilege(
         'authenticated',
         to_regprocedure(
           expected_functions.function_signature
         ),
         'EXECUTE'
       ) then
        'AUTHENTICATED CANNOT EXECUTE'
      when not expected_functions.callable_by_patient
       and has_function_privilege(
         'authenticated',
         to_regprocedure(
           expected_functions.function_signature
         ),
         'EXECUTE'
       ) then
        'PRIVATE HELPER EXPOSED'
      else
        'PASS'
    end as status,
    case
      when expected_functions.callable_by_patient then
        'authenticated only'
      else
        'private helper'
    end::text as details
  from expected_functions
),

dependency_checks as (
  select
    'DEPENDENCY'::text as check_group,
    dependency_name::text as item,
    case
      when dependency_type = 'table'
       and to_regclass(
         dependency_name
       ) is not null then
        'PASS'
      when dependency_type = 'function'
       and to_regprocedure(
         dependency_name
       ) is not null then
        'PASS'
      else
        'MISSING'
    end as status,
    dependency_type::text as details
  from (
    values
      (
        'public.patient_portal_accounts',
        'table'
      ),
      (
        'public.patient_portal_access_audit_logs',
        'table'
      ),
      (
        'public.clinical_documents',
        'table'
      ),
      (
        'public.document_release_clearances',
        'table'
      ),
      (
        'public.document_release_records',
        'table'
      ),
      (
        'public.billing_accounts',
        'table'
      ),
      (
        'public.payment_transactions',
        'table'
      ),
      (
        'public.doctor_prescriptions',
        'table'
      ),
      (
        'app_private.current_patient_portal_is_active()',
        'function'
      )
  ) dependencies(
    dependency_name,
    dependency_type
  )
),

definition_checks as (
  select
    'SECURITY DEFINITION'::text as check_group,
    security_gate::text as item,
    case
      when security_gate =
        'patient ownership enforced'
       and position(
         'documents.patient_id = p_patient_id'
         in pg_get_functiondef(
           to_regprocedure(
             'app_private.patient_portal_document_payload(uuid,uuid)'
           )
         )
       ) > 0 then
        'PASS'
      when security_gate =
        'released state enforced'
       and position(
         'release_clearances.release_status = ''released'''
         in pg_get_functiondef(
           to_regprocedure(
             'app_private.patient_portal_document_payload(uuid,uuid)'
           )
         )
       ) > 0 then
        'PASS'
      when security_gate =
        'restricted documents excluded'
       and position(
         'documents.sensitivity <> ''restricted'''
         in pg_get_functiondef(
           to_regprocedure(
             'app_private.patient_portal_document_payload(uuid,uuid)'
           )
         )
       ) > 0 then
        'PASS'
      else
        'FAIL'
    end as status,
    'patient document sanitizer'::text as details
  from (
    values
      ('patient ownership enforced'),
      ('released state enforced'),
      ('restricted documents excluded')
  ) security_gates(
    security_gate
  )
)

select * from function_checks
union all
select * from execution_checks
union all
select * from dependency_checks
union all
select * from definition_checks
order by
  check_group,
  item;
