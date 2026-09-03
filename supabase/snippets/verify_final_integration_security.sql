-- GalenMed Healthcare OS
-- Final integration security verification
-- Read-only. Expected status: PASS for every row.

with expected_unique_indexes(index_name) as (
  values
    ('patients_registration_idempotency_unique_idx'),
    ('hospital_visits_idempotency_unique_idx'),
    ('service_requests_idempotency_unique_idx'),
    ('billing_charge_items_idempotency_unique_idx'),
    ('payment_transactions_idempotency_unique_idx'),
    ('clinical_documents_idempotency_unique_idx'),
    ('document_release_records_idempotency_unique_idx'),
    ('document_print_logs_idempotency_unique_idx'),
    ('document_release_records_document_copy_unique_idx'),
    ('document_print_logs_document_copy_unique_idx'),
    ('billing_charge_items_active_source_unique_idx'),
    ('patient_portal_accounts_login_email_unique_idx')
),

index_checks as (
  select
    'UNIQUE INDEX'::text
      as check_group,

    expected_unique_indexes.index_name::text
      as item,

    case
      when indexes.indexname is null
        then 'MISSING'
      when indexes.indexdef not ilike
        'create unique index%'
        then 'NOT UNIQUE'
      else 'PASS'
    end
      as status,

    coalesce(
      indexes.indexdef,
      'missing'
    )::text
      as details

  from expected_unique_indexes

  left join pg_indexes indexes
    on indexes.indexname =
       expected_unique_indexes.index_name
   and indexes.schemaname in (
     'public',
     'app_private'
   )
),

expected_operation_tables(
  schema_name,
  table_name
) as (
  values
    (
      'app_private',
      'laboratory_result_operation_keys'
    ),
    (
      'app_private',
      'prescription_operation_keys'
    ),
    (
      'public',
      'patient_portal_access_audit_logs'
    )
),

operation_table_checks as (
  select
    'OPERATION LEDGER'::text
      as check_group,

    (
      expected_operation_tables.schema_name ||
      '.' ||
      expected_operation_tables.table_name
    )::text
      as item,

    case
      when to_regclass(
        format(
          '%I.%I',
          expected_operation_tables.schema_name,
          expected_operation_tables.table_name
        )
      ) is null
        then 'MISSING'
      else 'PASS'
    end
      as status,

    'append-only or idempotency evidence table'::text
      as details

  from expected_operation_tables
),

expected_public_functions(
  function_name,
  function_signature
) as (
  values
    (
      'reception_register_patient',
      'public.reception_register_patient(text,text,text,text,date,text,text,text,text,boolean,text,text,text)'
    ),
    (
      'reception_create_visit',
      'public.reception_create_visit(text,uuid,text,text,text,text)'
    ),
    (
      'reception_create_service_request',
      'public.reception_create_service_request(text,uuid,uuid,text,uuid,text,text,boolean)'
    ),
    (
      'cashier_record_payment',
      'public.cashier_record_payment(text,uuid,bigint,text,text,jsonb)'
    ),
    (
      'cashier_set_payment_clearance',
      'public.cashier_set_payment_clearance(uuid,text,bigint,text)'
    ),
    (
      'reception_print_document',
      'public.reception_print_document(text,uuid,text,text,uuid,jsonb)'
    ),
    (
      'reception_release_document',
      'public.reception_release_document(text,uuid,text,text,text,text,text,jsonb)'
    ),
    (
      'doctor_save_prescription_draft',
      'public.doctor_save_prescription_draft(text,uuid,uuid,text,jsonb)'
    ),
    (
      'doctor_submit_prescription',
      'public.doctor_submit_prescription(text,uuid)'
    ),
    (
      'get_current_patient_portal_context',
      'public.get_current_patient_portal_context()'
    ),
    (
      'get_patient_portal_dashboard_data',
      'public.get_patient_portal_dashboard_data()'
    ),
    (
      'get_patient_portal_billing_data',
      'public.get_patient_portal_billing_data()'
    ),
    (
      'open_patient_portal_released_document',
      'public.open_patient_portal_released_document(uuid)'
    ),
    (
      'record_patient_portal_print_request',
      'public.record_patient_portal_print_request(uuid)'
    )
),

function_checks as (
  select
    'GUARDED RPC'::text
      as check_group,

    expected_public_functions.function_name::text
      as item,

    case
      when procedures.oid is null
        then 'MISSING'
      when not procedures.prosecdef
        then 'NOT SECURITY DEFINER'
      when has_function_privilege(
        'anon',
        procedures.oid,
        'EXECUTE'
      )
        then 'ANON CAN EXECUTE'
      when not has_function_privilege(
        'authenticated',
        procedures.oid,
        'EXECUTE'
      )
        then 'AUTHENTICATED CANNOT EXECUTE'
      else 'PASS'
    end
      as status,

    concat(
      'security_definer=',
      coalesce(
        procedures.prosecdef::text,
        'missing'
      ),
      '; authenticated_execute=',
      coalesce(
        has_function_privilege(
          'authenticated',
          procedures.oid,
          'EXECUTE'
        )::text,
        'missing'
      ),
      '; anon_execute=',
      coalesce(
        has_function_privilege(
          'anon',
          procedures.oid,
          'EXECUTE'
        )::text,
        'missing'
      )
    )::text
      as details

  from expected_public_functions

  left join pg_proc procedures
    on procedures.oid =
       to_regprocedure(
         expected_public_functions.function_signature
       )
),

expected_write_locked_tables(table_name) as (
  values
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
    ('hospital_operation_audit_logs'),
    ('doctor_prescriptions'),
    ('doctor_prescription_items'),
    ('prescription_review_history'),
    ('patient_portal_accounts'),
    ('patient_portal_access_audit_logs')
),

write_lock_checks as (
  select
    'DIRECT CLIENT WRITE'::text
      as check_group,

    expected_write_locked_tables.table_name::text
      as item,

    case
      when to_regclass(
        format(
          'public.%I',
          expected_write_locked_tables.table_name
        )
      ) is null
        then 'MISSING TABLE'

      when (
        has_table_privilege(
          'anon',
          format(
            'public.%I',
            expected_write_locked_tables.table_name
          ),
          'INSERT'
        )
        or has_table_privilege(
          'anon',
          format(
            'public.%I',
            expected_write_locked_tables.table_name
          ),
          'UPDATE'
        )
        or has_table_privilege(
          'anon',
          format(
            'public.%I',
            expected_write_locked_tables.table_name
          ),
          'DELETE'
        )
      )
        then 'ANON WRITE GRANTED'

      when (
        has_table_privilege(
          'authenticated',
          format(
            'public.%I',
            expected_write_locked_tables.table_name
          ),
          'INSERT'
        )
        or has_table_privilege(
          'authenticated',
          format(
            'public.%I',
            expected_write_locked_tables.table_name
          ),
          'UPDATE'
        )
        or has_table_privilege(
          'authenticated',
          format(
            'public.%I',
            expected_write_locked_tables.table_name
          ),
          'DELETE'
        )
      )
        then 'AUTHENTICATED WRITE GRANTED'

      else 'PASS'
    end
      as status,

    'writes must use guarded RPCs'::text
      as details

  from expected_write_locked_tables
),

patient_identity_unique_checks as (
  select
    'PATIENT IDENTITY'::text
      as check_group,

    identity_key::text
      as item,

    case
      when exists (
        select 1
        from pg_index indexes
        where indexes.indrelid =
          'public.patient_portal_accounts'::regclass
          and indexes.indisunique
          and pg_get_indexdef(
            indexes.indexrelid
          ) ilike
            identity_pattern
      )
        then 'PASS'
      else 'MISSING UNIQUE IDENTITY GATE'
    end
      as status,

    identity_pattern::text
      as details

  from (
    values
      (
        'patient_id one-to-one',
        '%(patient_id)%'
      ),
      (
        'auth_user_id one-to-one',
        '%(auth_user_id)%'
      )
  ) expected_identity(
    identity_key,
    identity_pattern
  )
)

select * from index_checks
union all
select * from operation_table_checks
union all
select * from function_checks
union all
select * from write_lock_checks
union all
select * from patient_identity_unique_checks
order by
  check_group,
  item;
