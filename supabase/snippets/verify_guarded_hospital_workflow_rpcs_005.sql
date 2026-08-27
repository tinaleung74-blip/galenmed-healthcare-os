-- GalenMed Healthcare OS
-- Verification: Migration 005 Guarded Hospital Workflow RPCs
-- Read-only. This query does not create, update, or delete data.

with expected_public_functions(
  function_name,
  function_signature
) as (
  values
    ('admin_upsert_service_catalog_item', 'public.admin_upsert_service_catalog_item(text,text,text,text,bigint,text,text,boolean,boolean,boolean,uuid)'),
    ('reception_register_patient', 'public.reception_register_patient(text,text,text,text,date,text,text,text,text,boolean,text,text,text)'),
    ('reception_create_visit', 'public.reception_create_visit(text,uuid,text,text,text,text)'),
    ('reception_check_in_visit', 'public.reception_check_in_visit(uuid)'),
    ('reception_create_service_request', 'public.reception_create_service_request(text,uuid,uuid,text,uuid,text,text,boolean)'),
    ('department_advance_queue_entry', 'public.department_advance_queue_entry(uuid,text,text)'),
    ('cashier_post_charge', 'public.cashier_post_charge(text,uuid,text,numeric,bigint,uuid,text,text)'),
    ('cashier_record_payment', 'public.cashier_record_payment(text,uuid,bigint,text,text,jsonb)'),
    ('cashier_set_payment_clearance', 'public.cashier_set_payment_clearance(uuid,text,bigint,text)'),
    ('clinical_register_document', 'public.clinical_register_document(text,uuid,text,text,text,text,text,boolean,text,text,jsonb)'),
    ('clinical_submit_document_for_review', 'public.clinical_submit_document_for_review(uuid,jsonb)'),
    ('clinical_finalize_document', 'public.clinical_finalize_document(uuid,jsonb)'),
    ('reception_print_document', 'public.reception_print_document(text,uuid,text,text,uuid,jsonb)'),
    ('reception_release_document', 'public.reception_release_document(text,uuid,text,text,text,text,text,jsonb)')
),
function_checks as (
  select
    'PUBLIC RPC'::text as check_group,
    expected_public_functions.function_name as item,
    case
      when routines.oid is null then 'MISSING'
      when not routines.prosecdef then 'NOT SECURITY DEFINER'
      when not has_function_privilege('authenticated', routines.oid, 'EXECUTE') then 'AUTHENTICATED CANNOT EXECUTE'
      when has_function_privilege('anon', routines.oid, 'EXECUTE') then 'ANON CAN EXECUTE'
      else 'PASS'
    end as status,
    concat(
      'security_definer=', coalesce(routines.prosecdef::text, 'missing'),
      '; authenticated_execute=', coalesce(has_function_privilege('authenticated', routines.oid, 'EXECUTE')::text, 'missing'),
      '; anon_execute=', coalesce(has_function_privilege('anon', routines.oid, 'EXECUTE')::text, 'missing')
    ) as details
  from expected_public_functions
  left join pg_proc routines
    on routines.oid = to_regprocedure(expected_public_functions.function_signature)
),
expected_private_functions(
  function_name,
  function_signature
) as (
  values
    ('require_idempotency_key', 'app_private.require_idempotency_key(text)'),
    ('require_staff_permission', 'app_private.require_staff_permission(text,text)'),
    ('next_operation_number', 'app_private.next_operation_number(text,regclass,text,integer)'),
    ('append_hospital_operation_audit', 'app_private.append_hospital_operation_audit(uuid,text,text,uuid,text,uuid,uuid,uuid,uuid,jsonb,jsonb,jsonb)'),
    ('recalculate_billing_account', 'app_private.recalculate_billing_account(uuid,uuid)'),
    ('recalculate_payment_clearance', 'app_private.recalculate_payment_clearance(uuid,uuid)')
),
private_function_checks as (
  select
    'PRIVATE HELPER'::text as check_group,
    expected_private_functions.function_name as item,
    case
      when routines.oid is null then 'MISSING'
      when not routines.prosecdef and expected_private_functions.function_name <> 'require_idempotency_key' then 'NOT SECURITY DEFINER'
      when has_function_privilege('authenticated', routines.oid, 'EXECUTE') then 'EXPOSED TO AUTHENTICATED'
      when has_function_privilege('anon', routines.oid, 'EXECUTE') then 'EXPOSED TO ANON'
      else 'PASS'
    end as status,
    concat(
      'security_definer=', coalesce(routines.prosecdef::text, 'missing'),
      '; authenticated_execute=', coalesce(has_function_privilege('authenticated', routines.oid, 'EXECUTE')::text, 'missing'),
      '; anon_execute=', coalesce(has_function_privilege('anon', routines.oid, 'EXECUTE')::text, 'missing')
    ) as details
  from expected_private_functions
  left join pg_proc routines
    on routines.oid = to_regprocedure(expected_private_functions.function_signature)
),
expected_columns(
  table_name,
  column_name
) as (
  values
    ('patients', 'registration_idempotency_key'),
    ('hospital_visits', 'idempotency_key'),
    ('service_requests', 'idempotency_key'),
    ('billing_charge_items', 'idempotency_key'),
    ('payment_transactions', 'idempotency_key'),
    ('clinical_documents', 'idempotency_key'),
    ('document_release_records', 'idempotency_key'),
    ('document_print_logs', 'idempotency_key')
),
column_checks as (
  select
    'IDEMPOTENCY COLUMN'::text as check_group,
    expected_columns.table_name || '.' || expected_columns.column_name as item,
    case
      when columns.column_name is null then 'MISSING'
      else 'PASS'
    end as status,
    coalesce(columns.data_type, 'missing') as details
  from expected_columns
  left join information_schema.columns columns
    on columns.table_schema = 'public'
   and columns.table_name = expected_columns.table_name
   and columns.column_name = expected_columns.column_name
),
expected_indexes(index_name) as (
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
    ('billing_charge_items_active_source_unique_idx')
),
index_checks as (
  select
    'UNIQUE INDEX'::text as check_group,
    expected_indexes.index_name as item,
    case
      when indexes.indexname is null then 'MISSING'
      else 'PASS'
    end as status,
    coalesce(indexes.indexdef, 'missing') as details
  from expected_indexes
  left join pg_indexes indexes
    on indexes.schemaname in ('public', 'app_private')
   and indexes.indexname = expected_indexes.index_name
),
expected_sequences(sequence_name) as (
  values
    ('patient_mrn_sequence'),
    ('visit_number_sequence'),
    ('service_request_number_sequence'),
    ('billing_number_sequence'),
    ('payment_number_sequence'),
    ('receipt_number_sequence'),
    ('document_number_sequence'),
    ('release_number_sequence')
),
sequence_checks as (
  select
    'PRIVATE SEQUENCE'::text as check_group,
    expected_sequences.sequence_name as item,
    case
      when sequences.sequence_name is null then 'MISSING'
      when has_sequence_privilege('authenticated', format('app_private.%I', expected_sequences.sequence_name), 'USAGE') then 'EXPOSED TO AUTHENTICATED'
      when has_sequence_privilege('anon', format('app_private.%I', expected_sequences.sequence_name), 'USAGE') then 'EXPOSED TO ANON'
      else 'PASS'
    end as status,
    'app_private sequence'::text as details
  from expected_sequences
  left join information_schema.sequences sequences
    on sequences.sequence_schema = 'app_private'
   and sequences.sequence_name = expected_sequences.sequence_name
),
expected_write_locked_tables(table_name) as (
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
write_lock_checks as (
  select
    'DIRECT CLIENT WRITE'::text as check_group,
    expected_write_locked_tables.table_name as item,
    case
      when to_regclass(format('public.%I', expected_write_locked_tables.table_name)) is null then 'MISSING TABLE'
      when has_table_privilege('authenticated', format('public.%I', expected_write_locked_tables.table_name), 'INSERT') then 'AUTHENTICATED INSERT GRANTED'
      when has_table_privilege('authenticated', format('public.%I', expected_write_locked_tables.table_name), 'UPDATE') then 'AUTHENTICATED UPDATE GRANTED'
      when has_table_privilege('authenticated', format('public.%I', expected_write_locked_tables.table_name), 'DELETE') then 'AUTHENTICATED DELETE GRANTED'
      when has_table_privilege('anon', format('public.%I', expected_write_locked_tables.table_name), 'INSERT') then 'ANON INSERT GRANTED'
      when has_table_privilege('anon', format('public.%I', expected_write_locked_tables.table_name), 'UPDATE') then 'ANON UPDATE GRANTED'
      when has_table_privilege('anon', format('public.%I', expected_write_locked_tables.table_name), 'DELETE') then 'ANON DELETE GRANTED'
      else 'PASS'
    end as status,
    'Writes must occur only through guarded RPCs.'::text as details
  from expected_write_locked_tables
)
select * from function_checks
union all
select * from private_function_checks
union all
select * from column_checks
union all
select * from index_checks
union all
select * from sequence_checks
union all
select * from write_lock_checks
order by check_group, item;
