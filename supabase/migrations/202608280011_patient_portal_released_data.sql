-- GalenMed Healthcare OS
-- Migration 011: Patient Portal Released Records and Billing Read Model
-- Target: Supabase Postgres
-- Safety:
--   * Returns only the current active patient's own records.
--   * Only finalized/corrected and formally released documents are returned.
--   * Restricted documents are excluded.
--   * Billing is read-only for patients.
--   * Patient print attempts are audit logged.
--   * No sample data is created.

begin;

do $$
begin
  if to_regclass('public.patient_portal_accounts') is null then
    raise exception 'Migration 010 dependency missing: public.patient_portal_accounts.';
  end if;

  if to_regclass('public.patient_portal_access_audit_logs') is null then
    raise exception 'Migration 010 dependency missing: public.patient_portal_access_audit_logs.';
  end if;

  if to_regprocedure('app_private.current_patient_id()') is null then
    raise exception 'Migration 010 dependency missing: app_private.current_patient_id().';
  end if;

  if to_regprocedure('app_private.current_patient_portal_is_active()') is null then
    raise exception 'Migration 010 dependency missing: app_private.current_patient_portal_is_active().';
  end if;

  if to_regclass('public.clinical_documents') is null
     or to_regclass('public.document_release_clearances') is null
     or to_regclass('public.document_release_records') is null then
    raise exception 'Migration 004 document-release dependencies are missing.';
  end if;

  if to_regclass('public.billing_accounts') is null
     or to_regclass('public.billing_charge_items') is null
     or to_regclass('public.payment_transactions') is null
     or to_regclass('public.payment_clearances') is null then
    raise exception 'Migration 004 billing dependencies are missing.';
  end if;

  if to_regclass('public.doctor_prescriptions') is null
     or to_regclass('public.doctor_prescription_items') is null then
    raise exception 'Migration 009 prescription dependencies are missing.';
  end if;
end;
$$;

create or replace function app_private.patient_portal_document_payload(
  p_document_id uuid,
  p_patient_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_payload jsonb;
begin
  select jsonb_build_object(
    'id', documents.id,
    'document_number', documents.document_number,
    'document_type', documents.document_type,
    'title', documents.title,
    'version_number', documents.version_number,
    'status', documents.status,
    'payment_required', documents.payment_required,
    'payment_status',
      case
        when not documents.payment_required then 'not_required'
        else coalesce(payment_clearances.clearance_status, 'pending')
      end,
    'release_status', release_clearances.release_status,
    'release_number', latest_release.release_number,
    'release_method', latest_release.release_method,
    'released_at', latest_release.released_at,
    'finalized_at', documents.finalized_at,
    'finalized_by_name', finalizer.full_name,
    'visit_number', visits.visit_number,
    'service_request_number', requests.request_number,
    'branch_name', branches.name,
    'content',
      case documents.document_type
        when 'prescription' then
          coalesce(
            (
              select jsonb_build_object(
                'kind', 'prescription',
                'prescription_number', prescriptions.prescription_number,
                'diagnosis_code', prescriptions.diagnosis_code,
                'diagnosis_text', prescriptions.diagnosis_text,
                'general_instructions', prescriptions.general_instructions,
                'doctor', jsonb_build_object(
                  'full_name', doctor.full_name,
                  'employee_id', doctor.employee_id,
                  'job_title', doctor.job_title
                ),
                'items', coalesce(
                  (
                    select jsonb_agg(
                      jsonb_build_object(
                        'id', items.id,
                        'sequence', items.item_sequence,
                        'generic_name', items.generic_name,
                        'brand_name', items.brand_name,
                        'dosage_form', items.dosage_form,
                        'strength', items.strength,
                        'dose', items.dose,
                        'route', items.route,
                        'frequency', items.frequency,
                        'duration', items.duration,
                        'quantity', items.quantity,
                        'quantity_unit', items.quantity_unit,
                        'instructions', items.instructions
                      )
                      order by items.item_sequence
                    )
                    from public.doctor_prescription_items items
                    where items.prescription_id = prescriptions.id
                  ),
                  '[]'::jsonb
                )
              )
              from public.doctor_prescriptions prescriptions
              left join public.staff_profiles doctor
                on doctor.id = prescriptions.doctor_id
              where prescriptions.clinical_document_id = documents.id
                and prescriptions.patient_id = p_patient_id
                and prescriptions.status = 'finalized'
              limit 1
            ),
            jsonb_build_object(
              'kind', 'prescription',
              'prescription_number', documents.metadata ->> 'prescription_number',
              'diagnosis_code', documents.metadata ->> 'diagnosis_code',
              'diagnosis_text', documents.metadata ->> 'diagnosis_text',
              'general_instructions', documents.metadata ->> 'general_instructions',
              'doctor', coalesce(documents.metadata -> 'doctor', '{}'::jsonb),
              'items', coalesce(documents.metadata -> 'items', '[]'::jsonb)
            )
          )
        when 'laboratory_result' then
          jsonb_build_object(
            'kind', 'laboratory_result',
            'specimen_type', documents.metadata ->> 'specimen_type',
            'collection_reference', documents.metadata ->> 'collection_reference',
            'result_items', coalesce(documents.metadata -> 'result_items', '[]'::jsonb),
            'interpretation', documents.metadata ->> 'interpretation'
          )
        else
          jsonb_build_object(
            'kind', 'generic',
            'summary', documents.title
          )
      end
  )
  into v_payload
  from public.clinical_documents documents
  join public.document_release_clearances release_clearances
    on release_clearances.document_id = documents.id
   and release_clearances.release_status = 'released'
  join public.hospital_visits visits
    on visits.id = documents.visit_id
  left join public.service_requests requests
    on requests.id = documents.service_request_id
  join public.hospital_branches branches
    on branches.id = documents.branch_id
  left join public.staff_profiles finalizer
    on finalizer.id = documents.finalized_by
  left join public.payment_clearances payment_clearances
    on payment_clearances.id = release_clearances.payment_clearance_id
  join lateral (
    select
      release_records.release_number,
      release_records.release_method,
      release_records.released_at
    from public.document_release_records release_records
    where release_records.document_id = documents.id
      and release_records.patient_id = p_patient_id
    order by release_records.released_at desc, release_records.created_at desc
    limit 1
  ) latest_release on true
  where documents.id = p_document_id
    and documents.patient_id = p_patient_id
    and documents.status in ('finalized', 'corrected')
    and documents.sensitivity <> 'restricted';

  return v_payload;
end;
$$;

revoke all
  on function app_private.patient_portal_document_payload(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.get_patient_portal_released_documents(
  p_document_type text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.patient_portal_accounts%rowtype;
  v_type text;
  v_documents jsonb;
begin
  if auth.uid() is null
     or not app_private.current_patient_portal_is_active() then
    raise exception 'An active GalenMed Patient Portal account is required.';
  end if;

  select *
  into v_account
  from public.patient_portal_accounts accounts
  where accounts.auth_user_id = auth.uid()
    and accounts.status = 'active';

  if not found then
    raise exception 'The Patient Portal account was not found.';
  end if;

  v_type := nullif(lower(trim(coalesce(p_document_type, ''))), '');

  if v_type is not null
     and v_type not in (
       'prescription',
       'laboratory_result',
       'radiology_report',
       'consultation_summary',
       'diagnosis_summary',
       'medical_certificate',
       'official_receipt',
       'other'
     ) then
    raise exception 'Unsupported Patient Portal document type.';
  end if;

  select coalesce(
    jsonb_agg(document_rows.payload order by document_rows.released_at desc),
    '[]'::jsonb
  )
  into v_documents
  from (
    select
      latest_release.released_at,
      app_private.patient_portal_document_payload(
        documents.id,
        v_account.patient_id
      ) as payload
    from public.clinical_documents documents
    join public.document_release_clearances release_clearances
      on release_clearances.document_id = documents.id
     and release_clearances.release_status = 'released'
    join lateral (
      select release_records.released_at
      from public.document_release_records release_records
      where release_records.document_id = documents.id
        and release_records.patient_id = v_account.patient_id
      order by release_records.released_at desc, release_records.created_at desc
      limit 1
    ) latest_release on true
    where documents.patient_id = v_account.patient_id
      and documents.status in ('finalized', 'corrected')
      and documents.sensitivity <> 'restricted'
      and (v_type is null or documents.document_type = v_type)
  ) document_rows
  where document_rows.payload is not null;

  insert into public.patient_portal_access_audit_logs (
    patient_portal_account_id,
    patient_id,
    auth_user_id,
    actor_user_id,
    event_type,
    success,
    metadata
  )
  values (
    v_account.id,
    v_account.patient_id,
    auth.uid(),
    auth.uid(),
    'portal_viewed',
    true,
    jsonb_build_object(
      'section', 'released_documents',
      'document_type', v_type,
      'result_count', jsonb_array_length(v_documents)
    )
  );

  return jsonb_build_object('documents', v_documents);
end;
$$;

create or replace function public.get_patient_portal_billing_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.patient_portal_accounts%rowtype;
  v_accounts jsonb;
  v_total_outstanding bigint;
  v_total_paid bigint;
begin
  if auth.uid() is null
     or not app_private.current_patient_portal_is_active() then
    raise exception 'An active GalenMed Patient Portal account is required.';
  end if;

  select *
  into v_account
  from public.patient_portal_accounts accounts
  where accounts.auth_user_id = auth.uid()
    and accounts.status = 'active';

  if not found then
    raise exception 'The Patient Portal account was not found.';
  end if;

  select
    coalesce(sum(billing_accounts.balance_amount_centavos), 0),
    coalesce(sum(billing_accounts.paid_amount_centavos), 0)
  into
    v_total_outstanding,
    v_total_paid
  from public.billing_accounts billing_accounts
  where billing_accounts.patient_id = v_account.patient_id
    and billing_accounts.status <> 'voided';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', billing_accounts.id,
        'billing_number', billing_accounts.billing_number,
        'status', billing_accounts.status,
        'currency_code', billing_accounts.currency_code,
        'gross_amount_centavos', billing_accounts.gross_amount_centavos,
        'discount_amount_centavos', billing_accounts.discount_amount_centavos,
        'coverage_amount_centavos', billing_accounts.coverage_amount_centavos,
        'paid_amount_centavos', billing_accounts.paid_amount_centavos,
        'refunded_amount_centavos', billing_accounts.refunded_amount_centavos,
        'balance_amount_centavos', billing_accounts.balance_amount_centavos,
        'created_at', billing_accounts.created_at,
        'updated_at', billing_accounts.updated_at,
        'visit', jsonb_build_object(
          'id', visits.id,
          'visit_number', visits.visit_number,
          'status', visits.status,
          'registered_at', visits.registered_at
        ),
        'branch', jsonb_build_object(
          'id', branches.id,
          'code', branches.code,
          'name', branches.name
        ),
        'charges', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', charges.id,
                'description', charges.description,
                'quantity', charges.quantity,
                'unit_amount_centavos', charges.unit_amount_centavos,
                'total_amount_centavos', charges.total_amount_centavos,
                'status', charges.status,
                'posted_at', charges.posted_at,
                'service_request_number', requests.request_number,
                'service_name', catalog_items.name
              )
              order by charges.posted_at, charges.created_at
            )
            from public.billing_charge_items charges
            left join public.service_requests requests
              on requests.id = charges.service_request_id
            left join public.service_catalog_items catalog_items
              on catalog_items.id = requests.service_catalog_item_id
            where charges.billing_account_id = billing_accounts.id
          ),
          '[]'::jsonb
        ),
        'payments', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', payments.id,
                'payment_number', payments.payment_number,
                'amount_centavos', payments.amount_centavos,
                'payment_method', payments.payment_method,
                'status', payments.status,
                'external_reference', payments.external_reference,
                'official_receipt_number', payments.official_receipt_number,
                'posted_at', payments.posted_at
              )
              order by payments.posted_at desc, payments.created_at desc
            )
            from public.payment_transactions payments
            where payments.billing_account_id = billing_accounts.id
          ),
          '[]'::jsonb
        ),
        'clearances', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', clearances.id,
                'service_request_number', requests.request_number,
                'service_name', catalog_items.name,
                'clearance_status', clearances.clearance_status,
                'required_amount_centavos', clearances.required_amount_centavos,
                'cleared_amount_centavos', clearances.cleared_amount_centavos,
                'cleared_at', clearances.cleared_at
              )
              order by clearances.updated_at desc
            )
            from public.payment_clearances clearances
            join public.service_requests requests
              on requests.id = clearances.service_request_id
            left join public.service_catalog_items catalog_items
              on catalog_items.id = requests.service_catalog_item_id
            where clearances.billing_account_id = billing_accounts.id
          ),
          '[]'::jsonb
        )
      )
      order by billing_accounts.created_at desc
    ),
    '[]'::jsonb
  )
  into v_accounts
  from public.billing_accounts billing_accounts
  join public.hospital_visits visits
    on visits.id = billing_accounts.visit_id
  join public.hospital_branches branches
    on branches.id = billing_accounts.branch_id
  where billing_accounts.patient_id = v_account.patient_id;

  insert into public.patient_portal_access_audit_logs (
    patient_portal_account_id,
    patient_id,
    auth_user_id,
    actor_user_id,
    event_type,
    success,
    metadata
  )
  values (
    v_account.id,
    v_account.patient_id,
    auth.uid(),
    auth.uid(),
    'billing_viewed',
    true,
    jsonb_build_object(
      'billing_account_count',
      jsonb_array_length(v_accounts)
    )
  );

  return jsonb_build_object(
    'total_outstanding_centavos', v_total_outstanding,
    'total_paid_centavos', v_total_paid,
    'accounts', v_accounts
  );
end;
$$;

create or replace function public.open_patient_portal_released_document(
  p_document_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.patient_portal_accounts%rowtype;
  v_payload jsonb;
begin
  if auth.uid() is null
     or not app_private.current_patient_portal_is_active() then
    raise exception 'An active GalenMed Patient Portal account is required.';
  end if;

  select *
  into v_account
  from public.patient_portal_accounts accounts
  where accounts.auth_user_id = auth.uid()
    and accounts.status = 'active';

  if not found then
    raise exception 'The Patient Portal account was not found.';
  end if;

  v_payload := app_private.patient_portal_document_payload(
    p_document_id,
    v_account.patient_id
  );

  if v_payload is null then
    raise exception 'The released document was not found or is unavailable to this Patient Portal account.';
  end if;

  insert into public.patient_portal_access_audit_logs (
    patient_portal_account_id,
    patient_id,
    auth_user_id,
    actor_user_id,
    event_type,
    success,
    metadata
  )
  values (
    v_account.id,
    v_account.patient_id,
    auth.uid(),
    auth.uid(),
    'document_viewed',
    true,
    jsonb_build_object(
      'document_id', p_document_id,
      'document_number', v_payload ->> 'document_number',
      'document_type', v_payload ->> 'document_type'
    )
  );

  return v_payload;
end;
$$;

create or replace function public.record_patient_portal_print_request(
  p_document_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.patient_portal_accounts%rowtype;
  v_payload jsonb;
  v_log_id bigint;
begin
  if auth.uid() is null
     or not app_private.current_patient_portal_is_active() then
    raise exception 'An active GalenMed Patient Portal account is required.';
  end if;

  select *
  into v_account
  from public.patient_portal_accounts accounts
  where accounts.auth_user_id = auth.uid()
    and accounts.status = 'active';

  if not found then
    raise exception 'The Patient Portal account was not found.';
  end if;

  v_payload := app_private.patient_portal_document_payload(
    p_document_id,
    v_account.patient_id
  );

  if v_payload is null then
    raise exception 'The released document cannot be printed from this Patient Portal account.';
  end if;

  insert into public.patient_portal_access_audit_logs (
    patient_portal_account_id,
    patient_id,
    auth_user_id,
    actor_user_id,
    event_type,
    success,
    metadata
  )
  values (
    v_account.id,
    v_account.patient_id,
    auth.uid(),
    auth.uid(),
    'print_requested',
    true,
    jsonb_build_object(
      'document_id', p_document_id,
      'document_number', v_payload ->> 'document_number',
      'document_type', v_payload ->> 'document_type',
      'source', 'patient_portal'
    )
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

revoke all
  on function public.get_patient_portal_released_documents(text)
  from public, anon;

grant execute
  on function public.get_patient_portal_released_documents(text)
  to authenticated;

revoke all
  on function public.get_patient_portal_billing_data()
  from public, anon;

grant execute
  on function public.get_patient_portal_billing_data()
  to authenticated;

revoke all
  on function public.open_patient_portal_released_document(uuid)
  from public, anon;

grant execute
  on function public.open_patient_portal_released_document(uuid)
  to authenticated;

revoke all
  on function public.record_patient_portal_print_request(uuid)
  from public, anon;

grant execute
  on function public.record_patient_portal_print_request(uuid)
  to authenticated;

commit;
