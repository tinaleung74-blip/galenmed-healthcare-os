-- GalenMed Healthcare OS
-- Migration 009: Doctor Prescription Composer, Reception Review, and Release Workflow
-- Target: Supabase Postgres
-- Safety:
--   * Adds structured prescription records, guarded workflow RPCs, RLS, and audit history.
--   * Uses the existing consultation, payment-clearance, clinical-document, print, and release controls.
--   * Seeds no patient, visit, consultation, prescription, charge, payment, or release data.
--   * Direct browser table writes remain disabled.

begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists app_private;

-- ============================================================
-- DEPENDENCY GATE
-- ============================================================

do $$
begin
  if to_regclass('public.doctor_consultations') is null then
    raise exception 'Migration 008 dependency missing: public.doctor_consultations.';
  end if;

  if to_regclass('public.service_requests') is null then
    raise exception 'Migration 004 dependency missing: public.service_requests.';
  end if;

  if to_regclass('public.clinical_documents') is null then
    raise exception 'Migration 004 dependency missing: public.clinical_documents.';
  end if;

  if to_regclass('public.document_release_clearances') is null then
    raise exception 'Migration 004 dependency missing: public.document_release_clearances.';
  end if;

  if to_regprocedure('public.clinical_register_document(text,uuid,text,text,text,text,text,boolean,text,text,jsonb)') is null then
    raise exception 'Migration 005 dependency missing: public.clinical_register_document(...).';
  end if;

  if to_regprocedure('public.clinical_submit_document_for_review(uuid,jsonb)') is null then
    raise exception 'Migration 005 dependency missing: public.clinical_submit_document_for_review(uuid,jsonb).';
  end if;

  if to_regprocedure('app_private.require_idempotency_key(text)') is null then
    raise exception 'Migration 005 dependency missing: app_private.require_idempotency_key(text).';
  end if;

  if to_regprocedure('app_private.append_hospital_operation_audit(uuid,text,text,uuid,text,uuid,uuid,uuid,uuid,jsonb,jsonb,jsonb)') is null then
    raise exception 'Migration 005 dependency missing: app_private.append_hospital_operation_audit(...).';
  end if;
end;
$$;

-- ============================================================
-- PERMISSIONS
-- ============================================================

insert into public.app_permissions (
  code,
  name,
  module,
  description,
  sensitive
)
values
  (
    'doctor.prescription.view',
    'View Doctor Prescriptions',
    'doctor',
    'View prescriptions authored by the current Doctor account.',
    true
  ),
  (
    'reception.prescription.review',
    'Review Submitted Prescriptions',
    'reception',
    'Review Doctor-signed prescriptions, return them for correction, or approve them for controlled release.',
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  module = excluded.module,
  description = excluded.description,
  sensitive = excluded.sensitive;

with mappings(role_code, permission_code) as (
  values
    ('DOCTOR', 'doctor.prescription.view'),
    ('RECEPTIONIST', 'reception.prescription.review'),
    ('SYSTEM_ADMIN', 'doctor.prescription.view'),
    ('SYSTEM_ADMIN', 'reception.prescription.review')
)
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  roles.id,
  permissions.id
from mappings
join public.app_roles roles
  on roles.code = mappings.role_code
join public.app_permissions permissions
  on permissions.code = mappings.permission_code
on conflict do nothing;

-- ============================================================
-- NUMBER SEQUENCE
-- ============================================================

create sequence if not exists app_private.doctor_prescription_number_sequence;

revoke all
  on sequence app_private.doctor_prescription_number_sequence
  from public, anon, authenticated;

-- ============================================================
-- PRESCRIPTION TABLES
-- ============================================================

create table if not exists public.doctor_prescriptions (
  id uuid primary key default gen_random_uuid(),
  prescription_number text not null unique,
  consultation_id uuid not null unique
    references public.doctor_consultations(id)
    on delete restrict,
  service_request_id uuid not null
    references public.service_requests(id)
    on delete restrict,
  visit_id uuid not null
    references public.hospital_visits(id)
    on delete restrict,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  doctor_id uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  diagnosis_code text,
  diagnosis_text text not null,
  general_instructions text,
  status text not null default 'draft',
  revision_number integer not null default 1,
  submitted_at timestamptz,
  submitted_by uuid
    references public.staff_profiles(id)
    on delete restrict,
  returned_at timestamptz,
  returned_by uuid
    references public.staff_profiles(id)
    on delete restrict,
  return_reason text,
  approved_at timestamptz,
  approved_by uuid
    references public.staff_profiles(id)
    on delete restrict,
  approval_notes text,
  clinical_document_id uuid unique
    references public.clinical_documents(id)
    on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_prescriptions_number_check
    check (
      prescription_number = upper(prescription_number)
      and prescription_number ~ '^[A-Z0-9-]+$'
    ),
  constraint doctor_prescriptions_status_check
    check (
      status in (
        'draft',
        'submitted',
        'returned',
        'finalized',
        'voided'
      )
    ),
  constraint doctor_prescriptions_revision_check
    check (revision_number > 0),
  constraint doctor_prescriptions_diagnosis_check
    check (length(trim(diagnosis_text)) between 2 and 1000),
  constraint doctor_prescriptions_submitted_fields_check
    check (
      status not in ('submitted', 'finalized')
      or (
        submitted_at is not null
        and submitted_by is not null
        and clinical_document_id is not null
      )
    ),
  constraint doctor_prescriptions_returned_fields_check
    check (
      status <> 'returned'
      or (
        returned_at is not null
        and returned_by is not null
        and nullif(trim(return_reason), '') is not null
      )
    ),
  constraint doctor_prescriptions_finalized_fields_check
    check (
      status <> 'finalized'
      or (
        approved_at is not null
        and approved_by is not null
        and clinical_document_id is not null
      )
    )
);

comment on table public.doctor_prescriptions is
  'Doctor-authored structured prescription linked to one completed GalenMed consultation.';

create index if not exists doctor_prescriptions_doctor_status_updated_idx
  on public.doctor_prescriptions (
    doctor_id,
    status,
    updated_at desc
  );

create index if not exists doctor_prescriptions_patient_created_idx
  on public.doctor_prescriptions (
    patient_id,
    created_at desc
  );

create index if not exists doctor_prescriptions_branch_status_updated_idx
  on public.doctor_prescriptions (
    branch_id,
    status,
    updated_at desc
  );

create table if not exists public.doctor_prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null
    references public.doctor_prescriptions(id)
    on delete restrict,
  item_sequence integer not null,
  generic_name text not null,
  brand_name text,
  dosage_form text not null,
  strength text not null,
  dose text not null,
  route text not null,
  frequency text not null,
  duration text not null,
  quantity numeric(12, 2) not null,
  quantity_unit text not null,
  instructions text,
  created_at timestamptz not null default now(),
  constraint doctor_prescription_items_sequence_check
    check (item_sequence > 0),
  constraint doctor_prescription_items_generic_check
    check (length(trim(generic_name)) between 2 and 200),
  constraint doctor_prescription_items_dosage_form_check
    check (length(trim(dosage_form)) between 1 and 100),
  constraint doctor_prescription_items_strength_check
    check (length(trim(strength)) between 1 and 100),
  constraint doctor_prescription_items_dose_check
    check (length(trim(dose)) between 1 and 150),
  constraint doctor_prescription_items_route_check
    check (length(trim(route)) between 1 and 100),
  constraint doctor_prescription_items_frequency_check
    check (length(trim(frequency)) between 1 and 150),
  constraint doctor_prescription_items_duration_check
    check (length(trim(duration)) between 1 and 150),
  constraint doctor_prescription_items_quantity_check
    check (quantity > 0),
  constraint doctor_prescription_items_quantity_unit_check
    check (length(trim(quantity_unit)) between 1 and 100),
  unique (prescription_id, item_sequence)
);

comment on table public.doctor_prescription_items is
  'Structured medicine lines retained under the generic-name-first prescription record.';

create index if not exists doctor_prescription_items_prescription_sequence_idx
  on public.doctor_prescription_items (
    prescription_id,
    item_sequence
  );

create table if not exists public.prescription_review_history (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null
    references public.doctor_prescriptions(id)
    on delete restrict,
  action text not null,
  actor_user_id uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint prescription_review_history_action_check
    check (
      action in (
        'submitted',
        'returned_for_correction',
        'approved_for_release'
      )
    )
);

comment on table public.prescription_review_history is
  'Append-only operational review history for Doctor prescriptions.';

create index if not exists prescription_review_history_prescription_created_idx
  on public.prescription_review_history (
    prescription_id,
    created_at desc
  );

create table if not exists app_private.prescription_operation_keys (
  idempotency_key text primary key,
  operation_type text not null,
  prescription_id uuid not null
    references public.doctor_prescriptions(id)
    on delete restrict,
  actor_user_id uuid not null
    references auth.users(id)
    on delete restrict,
  response_payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint prescription_operation_keys_type_check
    check (
      operation_type in (
        'save_draft',
        'submit',
        'return_for_correction',
        'approve_for_release'
      )
    )
);

revoke all
  on app_private.prescription_operation_keys
  from public, anon, authenticated;

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists doctor_prescriptions_set_updated_at
  on public.doctor_prescriptions;

create trigger doctor_prescriptions_set_updated_at
before update on public.doctor_prescriptions
for each row
execute function app_private.set_updated_at();

drop trigger if exists prescription_review_history_reject_mutation
  on public.prescription_review_history;

create trigger prescription_review_history_reject_mutation
before update or delete on public.prescription_review_history
for each row
execute function app_private.reject_audit_mutation();

drop trigger if exists prescription_operation_keys_reject_mutation
  on app_private.prescription_operation_keys;

create trigger prescription_operation_keys_reject_mutation
before update or delete on app_private.prescription_operation_keys
for each row
execute function app_private.reject_audit_mutation();

-- ============================================================
-- ITEM VALIDATION
-- ============================================================

create or replace function app_private.require_prescription_items(
  p_items jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_item jsonb;
  v_count integer := 0;
begin
  if p_items is null
     or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Prescription items must be a JSON array.';
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_count := v_count + 1;

    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Every prescription item must be a JSON object.';
    end if;

    if nullif(trim(v_item ->> 'generic_name'), '') is null then
      raise exception 'Every prescription item requires a generic_name.';
    end if;

    if nullif(trim(v_item ->> 'dosage_form'), '') is null
       or nullif(trim(v_item ->> 'strength'), '') is null
       or nullif(trim(v_item ->> 'dose'), '') is null
       or nullif(trim(v_item ->> 'route'), '') is null
       or nullif(trim(v_item ->> 'frequency'), '') is null
       or nullif(trim(v_item ->> 'duration'), '') is null
       or nullif(trim(v_item ->> 'quantity_unit'), '') is null then
      raise exception 'Prescription dosage, route, frequency, duration, and quantity-unit fields are required.';
    end if;

    if coalesce((v_item ->> 'quantity')::numeric, 0) <= 0 then
      raise exception 'Every prescription item requires a positive quantity.';
    end if;
  end loop;

  if v_count = 0 then
    raise exception 'At least one prescription item is required.';
  end if;

  return p_items;
exception
  when invalid_text_representation then
    raise exception 'Prescription quantity must be numeric.';
end;
$$;

revoke all
  on function app_private.require_prescription_items(jsonb)
  from public, anon;

grant execute
  on function app_private.require_prescription_items(jsonb)
  to authenticated;

-- ============================================================
-- SAVE OR UPDATE DRAFT
-- ============================================================

create or replace function public.doctor_save_prescription_draft(
  p_idempotency_key text,
  p_consultation_id uuid,
  p_prescription_id uuid,
  p_general_instructions text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_consultation public.doctor_consultations%rowtype;
  v_prescription public.doctor_prescriptions%rowtype;
  v_operation app_private.prescription_operation_keys%rowtype;
  v_item jsonb;
  v_index integer := 0;
  v_number text;
  v_before jsonb;
  v_response jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended('doctor-prescription-save:' || v_key, 0)
  );

  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('doctor.prescription.create')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot create prescriptions.';
  end if;

  select *
  into v_operation
  from app_private.prescription_operation_keys
  where idempotency_key = v_key;

  if found then
    return v_operation.response_payload
      || jsonb_build_object('idempotent_replay', true);
  end if;

  select *
  into v_consultation
  from public.doctor_consultations
  where id = p_consultation_id;

  if not found then
    raise exception 'Doctor consultation was not found.';
  end if;

  if v_consultation.doctor_id <> v_actor
     and not app_private.is_system_admin() then
    raise exception 'Only the assigned Doctor can author this prescription.';
  end if;

  if v_consultation.status <> 'completed' then
    raise exception 'Complete the Doctor consultation before preparing the prescription.';
  end if;

  if nullif(trim(v_consultation.diagnosis_text), '') is null then
    raise exception 'Record the consultation diagnosis before preparing the prescription.';
  end if;

  if not app_private.has_branch_access(v_consultation.branch_id) then
    raise exception 'The current staff account has no access to this consultation branch.';
  end if;

  perform app_private.require_prescription_items(p_items);

  if p_prescription_id is null then
    select *
    into v_prescription
    from public.doctor_prescriptions
    where consultation_id = v_consultation.id
      and status <> 'voided'
    limit 1;

    if found then
      raise exception 'An active prescription already exists for this consultation. Refresh and open the existing prescription.';
    end if;

    v_number := app_private.next_operation_number(
      'RX',
      'app_private.doctor_prescription_number_sequence'::regclass,
      'YYYYMMDD',
      6
    );

    insert into public.doctor_prescriptions (
      prescription_number,
      consultation_id,
      service_request_id,
      visit_id,
      patient_id,
      branch_id,
      doctor_id,
      diagnosis_code,
      diagnosis_text,
      general_instructions,
      status
    )
    values (
      v_number,
      v_consultation.id,
      v_consultation.service_request_id,
      v_consultation.visit_id,
      v_consultation.patient_id,
      v_consultation.branch_id,
      v_consultation.doctor_id,
      nullif(trim(v_consultation.diagnosis_code), ''),
      trim(v_consultation.diagnosis_text),
      nullif(trim(p_general_instructions), ''),
      'draft'
    )
    returning * into v_prescription;
  else
    select *
    into v_prescription
    from public.doctor_prescriptions
    where id = p_prescription_id
    for update;

    if not found then
      raise exception 'Prescription was not found.';
    end if;

    if v_prescription.consultation_id <> v_consultation.id then
      raise exception 'The selected prescription does not belong to this consultation.';
    end if;

    if v_prescription.doctor_id <> v_actor
       and not app_private.is_system_admin() then
      raise exception 'Only the prescribing Doctor can update this prescription.';
    end if;

    if v_prescription.status not in ('draft', 'returned') then
      raise exception 'Only a draft or returned prescription can be edited.';
    end if;

    v_before := jsonb_build_object(
      'status', v_prescription.status,
      'revision_number', v_prescription.revision_number,
      'general_instructions', v_prescription.general_instructions
    );

    update public.doctor_prescriptions
    set
      diagnosis_code = nullif(trim(v_consultation.diagnosis_code), ''),
      diagnosis_text = trim(v_consultation.diagnosis_text),
      general_instructions = nullif(trim(p_general_instructions), ''),
      status = 'draft',
      revision_number = revision_number + 1,
      returned_at = null,
      returned_by = null,
      return_reason = null
    where id = v_prescription.id
    returning * into v_prescription;

    delete from public.doctor_prescription_items
    where prescription_id = v_prescription.id;

    if v_prescription.clinical_document_id is not null then
      update public.clinical_documents
      set
        title = 'Prescription — ' || v_prescription.prescription_number,
        status = 'draft',
        metadata = metadata || jsonb_build_object(
          'prescription_status', 'draft',
          'revision_number', v_prescription.revision_number,
          'updated_by_doctor', v_actor,
          'updated_at', now()
        )
      where id = v_prescription.clinical_document_id
        and status = 'draft';
    end if;
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_index := v_index + 1;

    insert into public.doctor_prescription_items (
      prescription_id,
      item_sequence,
      generic_name,
      brand_name,
      dosage_form,
      strength,
      dose,
      route,
      frequency,
      duration,
      quantity,
      quantity_unit,
      instructions
    )
    values (
      v_prescription.id,
      v_index,
      trim(v_item ->> 'generic_name'),
      nullif(trim(v_item ->> 'brand_name'), ''),
      trim(v_item ->> 'dosage_form'),
      trim(v_item ->> 'strength'),
      trim(v_item ->> 'dose'),
      trim(v_item ->> 'route'),
      trim(v_item ->> 'frequency'),
      trim(v_item ->> 'duration'),
      (v_item ->> 'quantity')::numeric,
      trim(v_item ->> 'quantity_unit'),
      nullif(trim(v_item ->> 'instructions'), '')
    );
  end loop;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'doctor.prescription_draft_saved',
    format('Prescription %s draft was saved.', v_prescription.prescription_number),
    v_prescription.patient_id,
    v_prescription.branch_id,
    v_prescription.visit_id,
    v_prescription.service_request_id,
    null,
    v_prescription.clinical_document_id,
    v_before,
    jsonb_build_object(
      'prescription_id', v_prescription.id,
      'prescription_number', v_prescription.prescription_number,
      'status', v_prescription.status,
      'revision_number', v_prescription.revision_number,
      'item_count', v_index
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  v_response := jsonb_build_object(
    'idempotent_replay', false,
    'prescription_id', v_prescription.id,
    'prescription_number', v_prescription.prescription_number,
    'status', v_prescription.status,
    'revision_number', v_prescription.revision_number,
    'item_count', v_index
  );

  insert into app_private.prescription_operation_keys (
    idempotency_key,
    operation_type,
    prescription_id,
    actor_user_id,
    response_payload
  )
  values (
    v_key,
    'save_draft',
    v_prescription.id,
    v_actor,
    v_response
  );

  return v_response;
end;
$$;

-- ============================================================
-- SUBMIT PRESCRIPTION
-- ============================================================

create or replace function public.doctor_submit_prescription(
  p_idempotency_key text,
  p_prescription_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_prescription public.doctor_prescriptions%rowtype;
  v_consultation public.doctor_consultations%rowtype;
  v_document public.clinical_documents%rowtype;
  v_operation app_private.prescription_operation_keys%rowtype;
  v_register_response jsonb;
  v_submit_response jsonb;
  v_items jsonb;
  v_doctor public.staff_profiles%rowtype;
  v_response jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended('doctor-prescription-submit:' || v_key, 0)
  );

  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('doctor.prescription.submit')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot submit prescriptions.';
  end if;

  select *
  into v_operation
  from app_private.prescription_operation_keys
  where idempotency_key = v_key;

  if found then
    return v_operation.response_payload
      || jsonb_build_object('idempotent_replay', true);
  end if;

  select *
  into v_prescription
  from public.doctor_prescriptions
  where id = p_prescription_id
  for update;

  if not found then
    raise exception 'Prescription was not found.';
  end if;

  if v_prescription.doctor_id <> v_actor
     and not app_private.is_system_admin() then
    raise exception 'Only the prescribing Doctor can submit this prescription.';
  end if;

  if v_prescription.status not in ('draft', 'returned') then
    raise exception 'Only a draft or returned prescription can be submitted.';
  end if;

  select *
  into v_consultation
  from public.doctor_consultations
  where id = v_prescription.consultation_id;

  if not found or v_consultation.status <> 'completed' then
    raise exception 'Complete the Doctor consultation before submitting the prescription.';
  end if;

  select coalesce(
    jsonb_agg(
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
    ),
    '[]'::jsonb
  )
  into v_items
  from public.doctor_prescription_items items
  where items.prescription_id = v_prescription.id;

  perform app_private.require_prescription_items(v_items);

  select *
  into v_doctor
  from public.staff_profiles
  where id = v_prescription.doctor_id;

  if v_prescription.clinical_document_id is null then
    select public.clinical_register_document(
      left(v_key || '-document', 200),
      v_prescription.service_request_id,
      'prescription',
      'Prescription — ' || v_prescription.prescription_number,
      'hospital_operations.doctor_prescription',
      v_prescription.id::text,
      'sensitive',
      true,
      null,
      null,
      jsonb_build_object(
        'schema_version', 1,
        'prescription_id', v_prescription.id,
        'prescription_number', v_prescription.prescription_number,
        'consultation_id', v_prescription.consultation_id,
        'consultation_number', v_consultation.consultation_number,
        'diagnosis_code', v_prescription.diagnosis_code,
        'diagnosis_text', v_prescription.diagnosis_text,
        'general_instructions', v_prescription.general_instructions,
        'items', v_items,
        'doctor', jsonb_build_object(
          'staff_id', v_doctor.id,
          'employee_id', v_doctor.employee_id,
          'full_name', v_doctor.full_name,
          'job_title', v_doctor.job_title
        ),
        'prescription_status', 'draft',
        'revision_number', v_prescription.revision_number
      )
    )
    into v_register_response;

    update public.doctor_prescriptions
    set clinical_document_id = (v_register_response ->> 'document_id')::uuid
    where id = v_prescription.id
    returning * into v_prescription;
  else
    update public.clinical_documents
    set
      title = 'Prescription — ' || v_prescription.prescription_number,
      metadata = jsonb_build_object(
        'schema_version', 1,
        'prescription_id', v_prescription.id,
        'prescription_number', v_prescription.prescription_number,
        'consultation_id', v_prescription.consultation_id,
        'consultation_number', v_consultation.consultation_number,
        'diagnosis_code', v_prescription.diagnosis_code,
        'diagnosis_text', v_prescription.diagnosis_text,
        'general_instructions', v_prescription.general_instructions,
        'items', v_items,
        'doctor', jsonb_build_object(
          'staff_id', v_doctor.id,
          'employee_id', v_doctor.employee_id,
          'full_name', v_doctor.full_name,
          'job_title', v_doctor.job_title
        ),
        'prescription_status', 'draft',
        'revision_number', v_prescription.revision_number
      )
    where id = v_prescription.clinical_document_id
      and status = 'draft';
  end if;

  select public.clinical_submit_document_for_review(
    v_prescription.clinical_document_id,
    jsonb_build_object(
      'prescription_status', 'submitted',
      'doctor_signed_by', v_actor,
      'doctor_signed_at', now()
    )
  )
  into v_submit_response;

  update public.doctor_prescriptions
  set
    status = 'submitted',
    submitted_at = now(),
    submitted_by = v_actor,
    returned_at = null,
    returned_by = null,
    return_reason = null
  where id = v_prescription.id
  returning * into v_prescription;

  insert into public.prescription_review_history (
    prescription_id,
    action,
    actor_user_id,
    metadata
  )
  values (
    v_prescription.id,
    'submitted',
    v_actor,
    jsonb_build_object(
      'revision_number', v_prescription.revision_number,
      'clinical_document_id', v_prescription.clinical_document_id
    )
  );

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'doctor.prescription_submitted',
    format('Prescription %s was signed and submitted for Reception review.', v_prescription.prescription_number),
    v_prescription.patient_id,
    v_prescription.branch_id,
    v_prescription.visit_id,
    v_prescription.service_request_id,
    null,
    v_prescription.clinical_document_id,
    jsonb_build_object('status', 'draft'),
    jsonb_build_object('status', v_prescription.status),
    jsonb_build_object('idempotency_key', v_key)
  );

  v_response := jsonb_build_object(
    'idempotent_replay', false,
    'prescription_id', v_prescription.id,
    'prescription_number', v_prescription.prescription_number,
    'status', v_prescription.status,
    'clinical_document_id', v_prescription.clinical_document_id
  );

  insert into app_private.prescription_operation_keys (
    idempotency_key,
    operation_type,
    prescription_id,
    actor_user_id,
    response_payload
  )
  values (
    v_key,
    'submit',
    v_prescription.id,
    v_actor,
    v_response
  );

  return v_response;
end;
$$;

-- ============================================================
-- RECEPTION REVIEW
-- ============================================================

create or replace function public.reception_return_prescription_for_correction(
  p_idempotency_key text,
  p_prescription_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_prescription public.doctor_prescriptions%rowtype;
  v_operation app_private.prescription_operation_keys%rowtype;
  v_reason text;
  v_response jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended('prescription-return:' || v_key, 0)
  );

  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('reception.prescription.review')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot review prescriptions.';
  end if;

  select *
  into v_operation
  from app_private.prescription_operation_keys
  where idempotency_key = v_key;

  if found then
    return v_operation.response_payload
      || jsonb_build_object('idempotent_replay', true);
  end if;

  v_reason := nullif(trim(p_reason), '');

  if v_reason is null or length(v_reason) < 3 then
    raise exception 'A correction reason of at least three characters is required.';
  end if;

  select *
  into v_prescription
  from public.doctor_prescriptions
  where id = p_prescription_id
  for update;

  if not found then
    raise exception 'Prescription was not found.';
  end if;

  if not app_private.has_branch_access(v_prescription.branch_id) then
    raise exception 'The current staff account has no access to this prescription branch.';
  end if;

  if v_prescription.status <> 'submitted' then
    raise exception 'Only a submitted prescription can be returned for correction.';
  end if;

  update public.doctor_prescriptions
  set
    status = 'returned',
    returned_at = now(),
    returned_by = v_actor,
    return_reason = v_reason
  where id = v_prescription.id
  returning * into v_prescription;

  update public.clinical_documents
  set
    status = 'draft',
    metadata = metadata || jsonb_build_object(
      'prescription_status', 'returned',
      'return_reason', v_reason,
      'returned_by', v_actor,
      'returned_at', now()
    )
  where id = v_prescription.clinical_document_id
    and status = 'for_review';

  insert into public.prescription_review_history (
    prescription_id,
    action,
    actor_user_id,
    reason
  )
  values (
    v_prescription.id,
    'returned_for_correction',
    v_actor,
    v_reason
  );

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'reception.prescription_returned',
    format('Prescription %s was returned to the Doctor for correction.', v_prescription.prescription_number),
    v_prescription.patient_id,
    v_prescription.branch_id,
    v_prescription.visit_id,
    v_prescription.service_request_id,
    null,
    v_prescription.clinical_document_id,
    jsonb_build_object('status', 'submitted'),
    jsonb_build_object('status', v_prescription.status, 'return_reason', v_reason),
    jsonb_build_object('idempotency_key', v_key)
  );

  v_response := jsonb_build_object(
    'idempotent_replay', false,
    'prescription_id', v_prescription.id,
    'prescription_number', v_prescription.prescription_number,
    'status', v_prescription.status,
    'return_reason', v_reason
  );

  insert into app_private.prescription_operation_keys (
    idempotency_key,
    operation_type,
    prescription_id,
    actor_user_id,
    response_payload
  )
  values (
    v_key,
    'return_for_correction',
    v_prescription.id,
    v_actor,
    v_response
  );

  return v_response;
end;
$$;

create or replace function public.reception_approve_prescription_for_release(
  p_idempotency_key text,
  p_prescription_id uuid,
  p_review_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_prescription public.doctor_prescriptions%rowtype;
  v_document public.clinical_documents%rowtype;
  v_release public.document_release_clearances%rowtype;
  v_operation app_private.prescription_operation_keys%rowtype;
  v_response jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended('prescription-approve:' || v_key, 0)
  );

  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('reception.prescription.review')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot review prescriptions.';
  end if;

  select *
  into v_operation
  from app_private.prescription_operation_keys
  where idempotency_key = v_key;

  if found then
    return v_operation.response_payload
      || jsonb_build_object('idempotent_replay', true);
  end if;

  select *
  into v_prescription
  from public.doctor_prescriptions
  where id = p_prescription_id
  for update;

  if not found then
    raise exception 'Prescription was not found.';
  end if;

  if not app_private.has_branch_access(v_prescription.branch_id) then
    raise exception 'The current staff account has no access to this prescription branch.';
  end if;

  if v_prescription.status = 'finalized' then
    select *
    into v_release
    from public.document_release_clearances
    where document_id = v_prescription.clinical_document_id;

    v_response := jsonb_build_object(
      'idempotent_replay', true,
      'prescription_id', v_prescription.id,
      'prescription_number', v_prescription.prescription_number,
      'status', v_prescription.status,
      'clinical_document_id', v_prescription.clinical_document_id,
      'release_status', coalesce(v_release.release_status, 'not_ready')
    );

    insert into app_private.prescription_operation_keys (
      idempotency_key,
      operation_type,
      prescription_id,
      actor_user_id,
      response_payload
    )
    values (
      v_key,
      'approve_for_release',
      v_prescription.id,
      v_actor,
      v_response
    );

    return v_response;
  end if;

  if v_prescription.status <> 'submitted' then
    raise exception 'Only a submitted prescription can be approved for release.';
  end if;

  select *
  into v_document
  from public.clinical_documents
  where id = v_prescription.clinical_document_id
  for update;

  if not found or v_document.status <> 'for_review' then
    raise exception 'The submitted prescription clinical document is not awaiting review.';
  end if;

  update public.clinical_documents
  set
    status = 'finalized',
    finalized_by = v_prescription.doctor_id,
    finalized_at = coalesce(v_prescription.submitted_at, now()),
    metadata = metadata || jsonb_build_object(
      'prescription_status', 'finalized',
      'operational_reviewed_by', v_actor,
      'operational_reviewed_at', now(),
      'operational_review_notes', nullif(trim(p_review_notes), '')
    )
  where id = v_document.id
  returning * into v_document;

  update public.doctor_prescriptions
  set
    status = 'finalized',
    approved_at = now(),
    approved_by = v_actor,
    approval_notes = nullif(trim(p_review_notes), '')
  where id = v_prescription.id
  returning * into v_prescription;

  insert into public.prescription_review_history (
    prescription_id,
    action,
    actor_user_id,
    reason,
    metadata
  )
  values (
    v_prescription.id,
    'approved_for_release',
    v_actor,
    nullif(trim(p_review_notes), ''),
    jsonb_build_object('clinical_document_id', v_document.id)
  );

  select *
  into v_release
  from public.document_release_clearances
  where document_id = v_document.id;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'reception.prescription_approved',
    format('Prescription %s was approved for payment-controlled release.', v_prescription.prescription_number),
    v_prescription.patient_id,
    v_prescription.branch_id,
    v_prescription.visit_id,
    v_prescription.service_request_id,
    null,
    v_document.id,
    jsonb_build_object('status', 'submitted'),
    jsonb_build_object(
      'status', v_prescription.status,
      'release_status', coalesce(v_release.release_status, 'not_ready')
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  v_response := jsonb_build_object(
    'idempotent_replay', false,
    'prescription_id', v_prescription.id,
    'prescription_number', v_prescription.prescription_number,
    'status', v_prescription.status,
    'clinical_document_id', v_document.id,
    'release_status', coalesce(v_release.release_status, 'not_ready')
  );

  insert into app_private.prescription_operation_keys (
    idempotency_key,
    operation_type,
    prescription_id,
    actor_user_id,
    response_payload
  )
  values (
    v_key,
    'approve_for_release',
    v_prescription.id,
    v_actor,
    v_response
  );

  return v_response;
end;
$$;

-- ============================================================
-- READ RPCS
-- ============================================================

create or replace function public.get_doctor_prescription_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('doctor.prescription.view')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot view Doctor prescriptions.';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'consultation_id', consultations.id,
          'consultation_number', consultations.consultation_number,
          'consultation_status', consultations.status,
          'service_request_id', consultations.service_request_id,
          'patient_id', patients.id,
          'patient_name', concat_ws(' ', patients.first_name, patients.middle_name, patients.last_name),
          'medical_record_number', patients.medical_record_number,
          'visit_number', visits.visit_number,
          'branch_name', branches.name,
          'diagnosis_code', consultations.diagnosis_code,
          'diagnosis_text', consultations.diagnosis_text,
          'completed_at', consultations.completed_at,
          'prescription_id', prescriptions.id,
          'prescription_number', prescriptions.prescription_number,
          'prescription_status', prescriptions.status,
          'prescription_revision', prescriptions.revision_number,
          'prescription_updated_at', prescriptions.updated_at,
          'clinical_document_id', prescriptions.clinical_document_id
        )
        order by coalesce(consultations.completed_at, consultations.started_at) desc
      )
      from public.doctor_consultations consultations
      join public.patients patients
        on patients.id = consultations.patient_id
      join public.hospital_visits visits
        on visits.id = consultations.visit_id
      join public.hospital_branches branches
        on branches.id = consultations.branch_id
      left join public.doctor_prescriptions prescriptions
        on prescriptions.consultation_id = consultations.id
       and prescriptions.status <> 'voided'
      where (
        consultations.doctor_id = v_actor
        or app_private.is_system_admin()
      )
        and consultations.status = 'completed'
        and app_private.has_branch_access(consultations.branch_id)
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.get_doctor_prescription_workspace(
  p_consultation_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_consultation public.doctor_consultations%rowtype;
  v_prescription public.doctor_prescriptions%rowtype;
  v_prescription_items jsonb := '[]'::jsonb;
  v_prescription_payload jsonb := null;
begin
  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('doctor.prescription.view')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot view Doctor prescriptions.';
  end if;

  select *
  into v_consultation
  from public.doctor_consultations
  where id = p_consultation_id;

  if not found then
    raise exception 'Doctor consultation was not found.';
  end if;

  if v_consultation.doctor_id <> v_actor
     and not app_private.is_system_admin() then
    raise exception 'This consultation is not assigned to the current Doctor.';
  end if;

  if not app_private.has_branch_access(
    v_consultation.branch_id
  ) then
    raise exception 'The current staff account has no access to this consultation branch.';
  end if;

  select *
  into v_prescription
  from public.doctor_prescriptions
  where consultation_id =
    v_consultation.id
    and status <> 'voided'
  order by updated_at desc
  limit 1;

  if found then
    select coalesce(
      jsonb_agg(
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
      ),
      '[]'::jsonb
    )
    into v_prescription_items
    from public.doctor_prescription_items items
    where items.prescription_id =
      v_prescription.id;

    v_prescription_payload :=
      jsonb_build_object(
        'id', v_prescription.id,
        'prescription_number',
          v_prescription.prescription_number,
        'status',
          v_prescription.status,
        'diagnosis_code',
          v_prescription.diagnosis_code,
        'diagnosis_text',
          v_prescription.diagnosis_text,
        'general_instructions',
          v_prescription.general_instructions,
        'revision_number',
          v_prescription.revision_number,
        'submitted_at',
          v_prescription.submitted_at,
        'return_reason',
          v_prescription.return_reason,
        'approved_at',
          v_prescription.approved_at,
        'approval_notes',
          v_prescription.approval_notes,
        'clinical_document_id',
          v_prescription.clinical_document_id,
        'updated_at',
          v_prescription.updated_at,
        'items',
          v_prescription_items
      );
  end if;

  return jsonb_build_object(
    'consultation',
      jsonb_build_object(
        'id',
          v_consultation.id,
        'consultation_number',
          v_consultation.consultation_number,
        'status',
          v_consultation.status,
        'diagnosis_code',
          v_consultation.diagnosis_code,
        'diagnosis_text',
          v_consultation.diagnosis_text,
        'treatment_plan',
          v_consultation.treatment_plan,
        'completed_at',
          v_consultation.completed_at
      ),

    'patient',
      (
        select jsonb_build_object(
          'id', patients.id,
          'medical_record_number',
            patients.medical_record_number,
          'first_name',
            patients.first_name,
          'middle_name',
            patients.middle_name,
          'last_name',
            patients.last_name,
          'date_of_birth',
            patients.date_of_birth,
          'biological_sex',
            patients.biological_sex
        )
        from public.patients patients
        where patients.id =
          v_consultation.patient_id
      ),

    'visit',
      (
        select jsonb_build_object(
          'id', visits.id,
          'visit_number',
            visits.visit_number
        )
        from public.hospital_visits visits
        where visits.id =
          v_consultation.visit_id
      ),

    'branch',
      (
        select jsonb_build_object(
          'id', branches.id,
          'code', branches.code,
          'name', branches.name
        )
        from public.hospital_branches branches
        where branches.id =
          v_consultation.branch_id
      ),

    'doctor',
      (
        select jsonb_build_object(
          'id', staff.id,
          'employee_id',
            staff.employee_id,
          'full_name',
            staff.full_name,
          'job_title',
            staff.job_title
        )
        from public.staff_profiles staff
        where staff.id =
          v_consultation.doctor_id
      ),

    'prescription',
      v_prescription_payload
  );
end;
$$;

create or replace function public.get_reception_prescription_review_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('reception.prescription.review')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot review prescriptions.';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'prescription_id', prescriptions.id,
          'prescription_number', prescriptions.prescription_number,
          'status', prescriptions.status,
          'revision_number', prescriptions.revision_number,
          'diagnosis_code', prescriptions.diagnosis_code,
          'diagnosis_text', prescriptions.diagnosis_text,
          'general_instructions', prescriptions.general_instructions,
          'submitted_at', prescriptions.submitted_at,
          'return_reason', prescriptions.return_reason,
          'approved_at', prescriptions.approved_at,
          'approval_notes', prescriptions.approval_notes,
          'clinical_document_id', prescriptions.clinical_document_id,
          'patient_id', patients.id,
          'patient_name', concat_ws(' ', patients.first_name, patients.middle_name, patients.last_name),
          'medical_record_number', patients.medical_record_number,
          'date_of_birth', patients.date_of_birth,
          'biological_sex', patients.biological_sex,
          'visit_number', visits.visit_number,
          'request_number', requests.request_number,
          'consultation_number', consultations.consultation_number,
          'branch_id', prescriptions.branch_id,
          'branch_name', branches.name,
          'doctor_name', doctors.full_name,
          'doctor_job_title', doctors.job_title,
          'document_number', documents.document_number,
          'document_status', documents.status,
          'release_status', clearances.release_status,
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
          ),
          'review_history', coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', history.id,
                  'action', history.action,
                  'actor_user_id', history.actor_user_id,
                  'reason', history.reason,
                  'created_at', history.created_at
                )
                order by history.created_at desc
              )
              from public.prescription_review_history history
              where history.prescription_id = prescriptions.id
            ),
            '[]'::jsonb
          )
        )
        order by coalesce(prescriptions.submitted_at, prescriptions.updated_at) desc
      )
      from public.doctor_prescriptions prescriptions
      join public.patients patients
        on patients.id = prescriptions.patient_id
      join public.hospital_visits visits
        on visits.id = prescriptions.visit_id
      join public.service_requests requests
        on requests.id = prescriptions.service_request_id
      join public.doctor_consultations consultations
        on consultations.id = prescriptions.consultation_id
      join public.hospital_branches branches
        on branches.id = prescriptions.branch_id
      join public.staff_profiles doctors
        on doctors.id = prescriptions.doctor_id
      left join public.clinical_documents documents
        on documents.id = prescriptions.clinical_document_id
      left join public.document_release_clearances clearances
        on clearances.document_id = prescriptions.clinical_document_id
      where prescriptions.status in ('submitted', 'returned', 'finalized')
        and app_private.has_branch_access(prescriptions.branch_id)
    ),
    '[]'::jsonb
  );
end;
$$;

-- ============================================================
-- PRIVILEGES AND RLS
-- ============================================================

revoke all
  on public.doctor_prescriptions,
     public.doctor_prescription_items,
     public.prescription_review_history
  from anon, authenticated;

grant select
  on public.doctor_prescriptions,
     public.doctor_prescription_items,
     public.prescription_review_history
  to authenticated;

alter table public.doctor_prescriptions
  enable row level security;

alter table public.doctor_prescription_items
  enable row level security;

alter table public.prescription_review_history
  enable row level security;

drop policy if exists doctor_prescriptions_select_authorized_staff
  on public.doctor_prescriptions;

create policy doctor_prescriptions_select_authorized_staff
on public.doctor_prescriptions
for select
to authenticated
using (
  (
    doctor_id = (select auth.uid())
    and (select app_private.has_permission('doctor.prescription.view'))
  )
  or
  (select app_private.has_permission('reception.prescription.review'))
  or
  (select app_private.is_system_admin())
);

drop policy if exists doctor_prescription_items_select_authorized_staff
  on public.doctor_prescription_items;

create policy doctor_prescription_items_select_authorized_staff
on public.doctor_prescription_items
for select
to authenticated
using (
  exists (
    select 1
    from public.doctor_prescriptions prescriptions
    where prescriptions.id = doctor_prescription_items.prescription_id
      and (
        (
          prescriptions.doctor_id = (select auth.uid())
          and (select app_private.has_permission('doctor.prescription.view'))
        )
        or
        (select app_private.has_permission('reception.prescription.review'))
        or
        (select app_private.is_system_admin())
      )
  )
);

drop policy if exists prescription_review_history_select_authorized_staff
  on public.prescription_review_history;

create policy prescription_review_history_select_authorized_staff
on public.prescription_review_history
for select
to authenticated
using (
  exists (
    select 1
    from public.doctor_prescriptions prescriptions
    where prescriptions.id = prescription_review_history.prescription_id
      and (
        prescriptions.doctor_id = (select auth.uid())
        or
        (select app_private.has_permission('reception.prescription.review'))
        or
        (select app_private.is_system_admin())
      )
  )
);

revoke all
  on function public.doctor_save_prescription_draft(text,uuid,uuid,text,jsonb),
     public.doctor_submit_prescription(text,uuid),
     public.reception_return_prescription_for_correction(text,uuid,text),
     public.reception_approve_prescription_for_release(text,uuid,text),
     public.get_doctor_prescription_queue(),
     public.get_doctor_prescription_workspace(uuid),
     public.get_reception_prescription_review_queue()
  from public, anon;

grant execute
  on function public.doctor_save_prescription_draft(text,uuid,uuid,text,jsonb),
     public.doctor_submit_prescription(text,uuid),
     public.reception_return_prescription_for_correction(text,uuid,text),
     public.reception_approve_prescription_for_release(text,uuid,text),
     public.get_doctor_prescription_queue(),
     public.get_doctor_prescription_workspace(uuid),
     public.get_reception_prescription_review_queue()
  to authenticated;

commit;
