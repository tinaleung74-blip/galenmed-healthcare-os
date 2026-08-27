-- GalenMed Healthcare OS
-- Migration 008: Doctor Assignment and Consultation Workflow
-- Target: Supabase Postgres
-- Safety:
--   * Adds Doctor assignment history, consultation records, guarded RPCs, RLS, and verification helpers.
--   * Does not alter or delete existing patient, appointment, consultation, laboratory, billing, or release records.
--   * Seeds no patient, visit, service request, queue, consultation, or clinical-document data.
--   * Direct browser writes remain disabled; all writes use guarded SECURITY DEFINER RPCs.

begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists app_private;

-- ============================================================
-- DEPENDENCY GATE
-- ============================================================

do $$
begin
  if to_regclass('public.staff_profiles') is null then
    raise exception 'Migration 001 dependency missing: public.staff_profiles.';
  end if;

  if to_regclass('public.staff_role_assignments') is null then
    raise exception 'Migration 001 dependency missing: public.staff_role_assignments.';
  end if;

  if to_regclass('public.staff_branch_assignments') is null then
    raise exception 'Migration 001 dependency missing: public.staff_branch_assignments.';
  end if;

  if to_regclass('public.staff_department_assignments') is null then
    raise exception 'Migration 001 dependency missing: public.staff_department_assignments.';
  end if;

  if to_regclass('public.app_roles') is null then
    raise exception 'Migration 001 dependency missing: public.app_roles.';
  end if;

  if to_regclass('public.staff_departments') is null then
    raise exception 'Migration 001 dependency missing: public.staff_departments.';
  end if;

  if to_regclass('public.patients') is null then
    raise exception 'Migration 004 dependency missing: public.patients.';
  end if;

  if to_regclass('public.hospital_visits') is null then
    raise exception 'Migration 004 dependency missing: public.hospital_visits.';
  end if;

  if to_regclass('public.service_requests') is null then
    raise exception 'Migration 004 dependency missing: public.service_requests.';
  end if;

  if to_regclass('public.queue_entries') is null then
    raise exception 'Migration 004 dependency missing: public.queue_entries.';
  end if;

  if to_regclass('public.clinical_documents') is null then
    raise exception 'Migration 004 dependency missing: public.clinical_documents.';
  end if;

  if to_regprocedure('app_private.require_staff_permission(text,text)') is null then
    raise exception 'Migration 005 dependency missing: app_private.require_staff_permission(text,text).';
  end if;

  if to_regprocedure('app_private.require_idempotency_key(text)') is null then
    raise exception 'Migration 005 dependency missing: app_private.require_idempotency_key(text).';
  end if;

  if to_regprocedure('app_private.next_operation_number(text,regclass,text,integer)') is null then
    raise exception 'Migration 005 dependency missing: app_private.next_operation_number(text,regclass,text,integer).';
  end if;

  if to_regprocedure('app_private.append_hospital_operation_audit(uuid,text,text,uuid,text,uuid,uuid,uuid,uuid,jsonb,jsonb,jsonb)') is null then
    raise exception 'Migration 005 dependency missing: app_private.append_hospital_operation_audit(...).';
  end if;

  if to_regprocedure('public.department_advance_queue_entry(uuid,text,text)') is null then
    raise exception 'Migration 005 dependency missing: public.department_advance_queue_entry(uuid,text,text).';
  end if;

  if to_regprocedure('public.clinical_register_document(text,uuid,text,text,text,text,text,boolean,text,text,jsonb)') is null then
    raise exception 'Migration 005 dependency missing: public.clinical_register_document(...).';
  end if;

  if to_regprocedure('public.clinical_finalize_document(uuid,jsonb)') is null then
    raise exception 'Migration 005 dependency missing: public.clinical_finalize_document(uuid,jsonb).';
  end if;
end;
$$;

-- ============================================================
-- NUMBER SEQUENCE
-- ============================================================

create sequence if not exists app_private.doctor_consultation_number_sequence;

revoke all
  on sequence app_private.doctor_consultation_number_sequence
  from public, anon, authenticated;

-- ============================================================
-- DOCTOR ASSIGNMENT HISTORY
-- ============================================================

create table if not exists public.doctor_assignment_history (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null
    references public.service_requests(id)
    on delete restrict,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  visit_id uuid not null
    references public.hospital_visits(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  previous_doctor_id uuid
    references public.staff_profiles(id)
    on delete set null,
  assigned_doctor_id uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  assigned_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  assignment_reason text not null,
  idempotency_key text not null unique,
  assigned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint doctor_assignment_history_reason_check
    check (length(trim(assignment_reason)) between 3 and 1000),
  constraint doctor_assignment_history_idempotency_check
    check (length(trim(idempotency_key)) between 8 and 200)
);

comment on table public.doctor_assignment_history is
  'Append-only evidence of Reception or System Admin doctor assignment changes for consultation service requests.';

create index if not exists doctor_assignment_history_request_assigned_idx
  on public.doctor_assignment_history (
    service_request_id,
    assigned_at desc
  );

create index if not exists doctor_assignment_history_doctor_assigned_idx
  on public.doctor_assignment_history (
    assigned_doctor_id,
    assigned_at desc
  );

create index if not exists doctor_assignment_history_branch_assigned_idx
  on public.doctor_assignment_history (
    branch_id,
    assigned_at desc
  );

-- ============================================================
-- DOCTOR CONSULTATIONS
-- ============================================================

create table if not exists public.doctor_consultations (
  id uuid primary key default gen_random_uuid(),
  consultation_number text not null unique,
  service_request_id uuid not null unique
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
  status text not null default 'in_progress',
  chief_complaint text,
  history_of_present_illness text,
  physical_examination text,
  assessment text,
  diagnosis_code text,
  diagnosis_text text,
  treatment_plan text,
  clinical_notes text,
  revision_number integer not null default 1,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary_document_id uuid
    references public.clinical_documents(id)
    on delete restrict,
  start_idempotency_key text not null unique,
  completion_idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_consultations_number_check
    check (
      consultation_number = upper(consultation_number)
      and consultation_number ~ '^[A-Z0-9-]+$'
    ),
  constraint doctor_consultations_status_check
    check (
      status in (
        'in_progress',
        'completed',
        'cancelled'
      )
    ),
  constraint doctor_consultations_revision_check
    check (revision_number > 0),
  constraint doctor_consultations_start_key_check
    check (length(trim(start_idempotency_key)) between 8 and 200),
  constraint doctor_consultations_completion_fields_check
    check (
      status <> 'completed'
      or (
        completed_at is not null
        and summary_document_id is not null
        and nullif(trim(assessment), '') is not null
        and nullif(trim(diagnosis_text), '') is not null
        and nullif(trim(treatment_plan), '') is not null
      )
    )
);

comment on table public.doctor_consultations is
  'Doctor-authored consultation record linked one-to-one with an assigned consultation service request.';

create index if not exists doctor_consultations_doctor_status_started_idx
  on public.doctor_consultations (
    doctor_id,
    status,
    started_at desc
  );

create index if not exists doctor_consultations_patient_started_idx
  on public.doctor_consultations (
    patient_id,
    started_at desc
  );

create index if not exists doctor_consultations_branch_status_started_idx
  on public.doctor_consultations (
    branch_id,
    status,
    started_at desc
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists doctor_consultations_set_updated_at
  on public.doctor_consultations;

create trigger doctor_consultations_set_updated_at
before update on public.doctor_consultations
for each row
execute function app_private.set_updated_at();

drop trigger if exists doctor_assignment_history_reject_mutation
  on public.doctor_assignment_history;

create trigger doctor_assignment_history_reject_mutation
before update or delete on public.doctor_assignment_history
for each row
execute function app_private.reject_audit_mutation();

-- ============================================================
-- ASSIGNMENT RPC
-- ============================================================

create or replace function public.reception_assign_consultation_doctor(
  p_idempotency_key text,
  p_service_request_id uuid,
  p_doctor_id uuid,
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
  v_request public.service_requests%rowtype;
  v_queue public.queue_entries%rowtype;
  v_existing public.doctor_assignment_history%rowtype;
  v_previous_doctor_id uuid;
  v_doctor_name text;
  v_doctor_employee_id text;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended(
      'doctor-assignment:' || v_key,
      0
    )
  );

  select *
  into v_existing
  from public.doctor_assignment_history
  where idempotency_key = v_key;

  if found then
    select sp.full_name, sp.employee_id
    into v_doctor_name, v_doctor_employee_id
    from public.staff_profiles sp
    where sp.id = v_existing.assigned_doctor_id;

    return jsonb_build_object(
      'idempotent_replay', true,
      'service_request_id', v_existing.service_request_id,
      'doctor_id', v_existing.assigned_doctor_id,
      'doctor_name', v_doctor_name,
      'doctor_employee_id', v_doctor_employee_id,
      'assigned_at', v_existing.assigned_at
    );
  end if;

  select *
  into v_request
  from public.service_requests
  where id = p_service_request_id
  for update;

  if not found then
    raise exception 'Consultation service request was not found.';
  end if;

  if v_request.service_type <> 'consultation' then
    raise exception 'Only consultation service requests can be assigned to a Doctor.';
  end if;

  if v_request.status not in ('requested', 'queued') then
    raise exception 'The consultation cannot be assigned or reassigned in its current status.';
  end if;

  v_actor := app_private.require_staff_permission(
    'reception.service_request.create',
    v_request.branch_id
  );

  if nullif(trim(p_reason), '') is null then
    raise exception 'A Doctor-assignment reason is required.';
  end if;

  select sp.full_name, sp.employee_id
  into v_doctor_name, v_doctor_employee_id
  from public.staff_profiles sp
  join public.staff_role_assignments sra
    on sra.staff_id = sp.id
   and sra.active
  join public.app_roles ar
    on ar.id = sra.role_id
   and ar.active
   and ar.code = 'DOCTOR'
  join public.staff_branch_assignments sba
    on sba.staff_id = sp.id
   and sba.active
   and sba.branch_id = v_request.branch_id
  join public.staff_department_assignments sda
    on sda.staff_id = sp.id
   and sda.active
  join public.staff_departments sd
    on sd.id = sda.department_id
   and sd.active
   and sd.code = 'MEDICINE'
  where sp.id = p_doctor_id
    and sp.account_status = 'active';

  if not found then
    raise exception 'The selected Doctor is not active in the consultation branch and Medical Services department.';
  end if;

  v_previous_doctor_id := v_request.assigned_staff_id;

  if v_previous_doctor_id = p_doctor_id then
    return jsonb_build_object(
      'idempotent_replay', true,
      'service_request_id', v_request.id,
      'doctor_id', p_doctor_id,
      'doctor_name', v_doctor_name,
      'doctor_employee_id', v_doctor_employee_id,
      'assigned_at', now()
    );
  end if;

  update public.service_requests
  set
    assigned_staff_id = p_doctor_id,
    updated_at = now()
  where id = v_request.id;

  update public.queue_entries
  set
    assigned_staff_id = p_doctor_id,
    updated_at = now()
  where service_request_id = v_request.id;

  insert into public.doctor_assignment_history (
    service_request_id,
    patient_id,
    visit_id,
    branch_id,
    previous_doctor_id,
    assigned_doctor_id,
    assigned_by,
    assignment_reason,
    idempotency_key,
    metadata
  )
  values (
    v_request.id,
    v_request.patient_id,
    v_request.visit_id,
    v_request.branch_id,
    v_previous_doctor_id,
    p_doctor_id,
    v_actor,
    trim(p_reason),
    v_key,
    jsonb_build_object(
      'request_number', v_request.request_number,
      'doctor_name', v_doctor_name,
      'doctor_employee_id', v_doctor_employee_id
    )
  )
  returning * into v_existing;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'consultation.doctor_assigned',
    format(
      'Consultation request %s was assigned to Doctor %s.',
      v_request.request_number,
      v_doctor_name
    ),
    v_request.patient_id,
    v_request.branch_id,
    v_request.visit_id,
    v_request.id,
    null,
    null,
    jsonb_build_object(
      'assigned_staff_id',
      v_previous_doctor_id
    ),
    jsonb_build_object(
      'assigned_staff_id',
      p_doctor_id,
      'doctor_name',
      v_doctor_name
    ),
    jsonb_build_object(
      'reason',
      trim(p_reason),
      'idempotency_key',
      v_key
    )
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'service_request_id', v_request.id,
    'doctor_id', p_doctor_id,
    'doctor_name', v_doctor_name,
    'doctor_employee_id', v_doctor_employee_id,
    'assigned_at', v_existing.assigned_at
  );
end;
$$;

-- ============================================================
-- DOCTOR CONSULTATION RPCS
-- ============================================================

create or replace function public.doctor_start_consultation(
  p_idempotency_key text,
  p_service_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_request public.service_requests%rowtype;
  v_queue public.queue_entries%rowtype;
  v_consultation public.doctor_consultations%rowtype;
  v_consultation_number text;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended(
      'doctor-consultation-start:' || v_key,
      0
    )
  );

  select *
  into v_consultation
  from public.doctor_consultations
  where start_idempotency_key = v_key
     or service_request_id = p_service_request_id
  order by created_at
  limit 1;

  if found then
    return jsonb_build_object(
      'idempotent_replay', true,
      'consultation_id', v_consultation.id,
      'consultation_number', v_consultation.consultation_number,
      'status', v_consultation.status,
      'started_at', v_consultation.started_at
    );
  end if;

  select *
  into v_request
  from public.service_requests
  where id = p_service_request_id
  for update;

  if not found then
    raise exception 'Assigned consultation service request was not found.';
  end if;

  if v_request.service_type <> 'consultation' then
    raise exception 'Only consultation service requests can start a Doctor consultation.';
  end if;

  v_actor := app_private.require_staff_permission(
    'doctor.consultation.manage_assigned',
    v_request.branch_id
  );

  if v_request.assigned_staff_id is distinct from v_actor then
    raise exception 'The consultation service request is not assigned to the current Doctor.';
  end if;

  if v_request.status not in ('requested', 'queued', 'in_progress') then
    raise exception 'The assigned consultation cannot be started in its current status.';
  end if;

  select *
  into v_queue
  from public.queue_entries
  where service_request_id = v_request.id
  for update;

  if not found then
    raise exception 'The assigned consultation has no department queue entry.';
  end if;

  if v_queue.status in ('completed', 'no_show', 'cancelled') then
    raise exception 'The assigned consultation queue entry is already closed.';
  end if;

  if v_queue.status <> 'in_service' then
    perform public.department_advance_queue_entry(
      v_queue.id,
      'start',
      null
    );
  end if;

  v_consultation_number := app_private.next_operation_number(
    'CON',
    'app_private.doctor_consultation_number_sequence'::regclass,
    'YYYYMMDD',
    6
  );

  insert into public.doctor_consultations (
    consultation_number,
    service_request_id,
    visit_id,
    patient_id,
    branch_id,
    doctor_id,
    status,
    started_at,
    start_idempotency_key
  )
  values (
    v_consultation_number,
    v_request.id,
    v_request.visit_id,
    v_request.patient_id,
    v_request.branch_id,
    v_actor,
    'in_progress',
    now(),
    v_key
  )
  returning * into v_consultation;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'consultation.started',
    format(
      'Doctor consultation %s was started.',
      v_consultation.consultation_number
    ),
    v_consultation.patient_id,
    v_consultation.branch_id,
    v_consultation.visit_id,
    v_consultation.service_request_id,
    null,
    null,
    null,
    jsonb_build_object(
      'consultation_id',
      v_consultation.id,
      'consultation_number',
      v_consultation.consultation_number,
      'status',
      v_consultation.status,
      'doctor_id',
      v_consultation.doctor_id
    ),
    jsonb_build_object(
      'idempotency_key',
      v_key
    )
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'consultation_id', v_consultation.id,
    'consultation_number', v_consultation.consultation_number,
    'status', v_consultation.status,
    'started_at', v_consultation.started_at
  );
end;
$$;

create or replace function public.doctor_save_consultation_draft(
  p_consultation_id uuid,
  p_chief_complaint text default null,
  p_history_of_present_illness text default null,
  p_physical_examination text default null,
  p_assessment text default null,
  p_diagnosis_code text default null,
  p_diagnosis_text text default null,
  p_treatment_plan text default null,
  p_clinical_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_consultation public.doctor_consultations%rowtype;
  v_before jsonb;
begin
  select *
  into v_consultation
  from public.doctor_consultations
  where id = p_consultation_id
  for update;

  if not found then
    raise exception 'Doctor consultation was not found.';
  end if;

  v_actor := app_private.require_staff_permission(
    'doctor.consultation.manage_assigned',
    v_consultation.branch_id
  );

  if v_consultation.doctor_id <> v_actor then
    raise exception 'Only the assigned Doctor can update this consultation.';
  end if;

  if v_consultation.status <> 'in_progress' then
    raise exception 'Only an in-progress consultation can be updated.';
  end if;

  v_before := jsonb_build_object(
    'revision_number',
    v_consultation.revision_number,
    'diagnosis_code',
    v_consultation.diagnosis_code,
    'diagnosis_text',
    v_consultation.diagnosis_text
  );

  update public.doctor_consultations
  set
    chief_complaint = nullif(trim(p_chief_complaint), ''),
    history_of_present_illness =
      nullif(trim(p_history_of_present_illness), ''),
    physical_examination =
      nullif(trim(p_physical_examination), ''),
    assessment = nullif(trim(p_assessment), ''),
    diagnosis_code = nullif(upper(trim(p_diagnosis_code)), ''),
    diagnosis_text = nullif(trim(p_diagnosis_text), ''),
    treatment_plan = nullif(trim(p_treatment_plan), ''),
    clinical_notes = nullif(trim(p_clinical_notes), ''),
    revision_number = revision_number + 1
  where id = v_consultation.id
  returning * into v_consultation;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'consultation.draft_saved',
    format(
      'Doctor consultation %s draft was saved.',
      v_consultation.consultation_number
    ),
    v_consultation.patient_id,
    v_consultation.branch_id,
    v_consultation.visit_id,
    v_consultation.service_request_id,
    null,
    null,
    v_before,
    jsonb_build_object(
      'revision_number',
      v_consultation.revision_number,
      'diagnosis_code',
      v_consultation.diagnosis_code,
      'diagnosis_text',
      v_consultation.diagnosis_text
    ),
    '{}'::jsonb
  );

  return jsonb_build_object(
    'consultation_id',
    v_consultation.id,
    'consultation_number',
    v_consultation.consultation_number,
    'status',
    v_consultation.status,
    'revision_number',
    v_consultation.revision_number,
    'updated_at',
    v_consultation.updated_at
  );
end;
$$;

create or replace function public.doctor_complete_consultation(
  p_idempotency_key text,
  p_consultation_id uuid
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
  v_request public.service_requests%rowtype;
  v_queue public.queue_entries%rowtype;
  v_document_result jsonb;
  v_document_id uuid;
  v_document_number text;
  v_metadata jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended(
      'doctor-consultation-complete:' || v_key,
      0
    )
  );

  select *
  into v_consultation
  from public.doctor_consultations
  where id = p_consultation_id
  for update;

  if not found then
    raise exception 'Doctor consultation was not found.';
  end if;

  v_actor := app_private.require_staff_permission(
    'doctor.consultation.manage_assigned',
    v_consultation.branch_id
  );

  if v_consultation.doctor_id <> v_actor then
    raise exception 'Only the assigned Doctor can complete this consultation.';
  end if;

  if v_consultation.status = 'completed' then
    return jsonb_build_object(
      'idempotent_replay', true,
      'consultation_id', v_consultation.id,
      'consultation_number', v_consultation.consultation_number,
      'status', v_consultation.status,
      'summary_document_id', v_consultation.summary_document_id,
      'completed_at', v_consultation.completed_at
    );
  end if;

  if v_consultation.status <> 'in_progress' then
    raise exception 'Only an in-progress consultation can be completed.';
  end if;

  if nullif(trim(v_consultation.assessment), '') is null then
    raise exception 'Assessment is required before consultation completion.';
  end if;

  if nullif(trim(v_consultation.diagnosis_text), '') is null then
    raise exception 'Diagnosis is required before consultation completion.';
  end if;

  if nullif(trim(v_consultation.treatment_plan), '') is null then
    raise exception 'Treatment plan is required before consultation completion.';
  end if;

  select *
  into v_request
  from public.service_requests
  where id = v_consultation.service_request_id
  for update;

  select *
  into v_queue
  from public.queue_entries
  where service_request_id = v_consultation.service_request_id
  for update;

  if not found then
    raise exception 'The consultation queue entry was not found.';
  end if;

  v_metadata := jsonb_build_object(
    'consultation_id',
    v_consultation.id,
    'consultation_number',
    v_consultation.consultation_number,
    'doctor_id',
    v_consultation.doctor_id,
    'chief_complaint',
    v_consultation.chief_complaint,
    'history_of_present_illness',
    v_consultation.history_of_present_illness,
    'physical_examination',
    v_consultation.physical_examination,
    'assessment',
    v_consultation.assessment,
    'diagnosis_code',
    v_consultation.diagnosis_code,
    'diagnosis_text',
    v_consultation.diagnosis_text,
    'treatment_plan',
    v_consultation.treatment_plan,
    'clinical_notes',
    v_consultation.clinical_notes,
    'revision_number',
    v_consultation.revision_number
  );

  select public.clinical_register_document(
    v_key || ':summary',
    v_consultation.service_request_id,
    'consultation_summary',
    'Consultation Summary — ' || v_consultation.consultation_number,
    'doctor.consultations',
    v_consultation.id::text,
    'sensitive',
    true,
    null,
    null,
    v_metadata
  )
  into v_document_result;

  v_document_id :=
    (v_document_result ->> 'document_id')::uuid;

  v_document_number :=
    v_document_result ->> 'document_number';

  perform public.clinical_finalize_document(
    v_document_id,
    jsonb_build_object(
      'completion_idempotency_key',
      v_key,
      'clinically_signed_by',
      v_actor,
      'clinically_signed_at',
      now()
    )
  );

  if v_queue.status <> 'completed' then
    perform public.department_advance_queue_entry(
      v_queue.id,
      'complete',
      null
    );
  end if;

  update public.doctor_consultations
  set
    status = 'completed',
    completed_at = now(),
    summary_document_id = v_document_id,
    completion_idempotency_key = v_key
  where id = v_consultation.id
  returning * into v_consultation;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'consultation.completed',
    format(
      'Doctor consultation %s was completed and summary document %s was finalized.',
      v_consultation.consultation_number,
      v_document_number
    ),
    v_consultation.patient_id,
    v_consultation.branch_id,
    v_consultation.visit_id,
    v_consultation.service_request_id,
    null,
    v_document_id,
    jsonb_build_object(
      'status',
      'in_progress'
    ),
    jsonb_build_object(
      'status',
      v_consultation.status,
      'completed_at',
      v_consultation.completed_at,
      'summary_document_id',
      v_document_id
    ),
    jsonb_build_object(
      'idempotency_key',
      v_key
    )
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'consultation_id', v_consultation.id,
    'consultation_number', v_consultation.consultation_number,
    'status', v_consultation.status,
    'summary_document_id', v_document_id,
    'summary_document_number', v_document_number,
    'completed_at', v_consultation.completed_at
  );
end;
$$;

-- ============================================================
-- READ RPCS
-- ============================================================

create or replace function public.get_reception_doctor_assignment_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
begin
  v_actor := app_private.require_staff_permission(
    'reception.service_request.create',
    null
  );

  return jsonb_build_object(
    'doctors',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', doctor_rows.id,
            'employee_id', doctor_rows.employee_id,
            'full_name', doctor_rows.full_name,
            'job_title', doctor_rows.job_title,
            'branches', doctor_rows.branches
          )
          order by doctor_rows.full_name
        )
        from (
          select
            sp.id,
            sp.employee_id,
            sp.full_name,
            sp.job_title,
            jsonb_agg(
              distinct jsonb_build_object(
                'id', hb.id,
                'code', hb.code,
                'name', hb.name,
                'is_primary', sba.is_primary
              )
            ) as branches
          from public.staff_profiles sp
          join public.staff_role_assignments sra
            on sra.staff_id = sp.id
           and sra.active
          join public.app_roles ar
            on ar.id = sra.role_id
           and ar.active
           and ar.code = 'DOCTOR'
          join public.staff_branch_assignments sba
            on sba.staff_id = sp.id
           and sba.active
          join public.hospital_branches hb
            on hb.id = sba.branch_id
           and hb.active
          join public.staff_department_assignments sda
            on sda.staff_id = sp.id
           and sda.active
          join public.staff_departments sd
            on sd.id = sda.department_id
           and sd.active
           and sd.code = 'MEDICINE'
          where sp.account_status = 'active'
            and app_private.has_branch_access(hb.id)
          group by
            sp.id,
            sp.employee_id,
            sp.full_name,
            sp.job_title
        ) doctor_rows
      ),
      '[]'::jsonb
    ),
    'requests',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'service_request_id', sr.id,
            'request_number', sr.request_number,
            'patient_id', p.id,
            'patient_name',
              trim(
                concat_ws(
                  ' ',
                  p.first_name,
                  p.middle_name,
                  p.last_name
                )
              ),
            'medical_record_number', p.medical_record_number,
            'visit_number', hv.visit_number,
            'branch_id', sr.branch_id,
            'branch_name', hb.name,
            'priority', sr.priority,
            'request_status', sr.status,
            'queue_number', qe.queue_number,
            'queue_status', qe.status,
            'assigned_doctor_id', sr.assigned_staff_id,
            'assigned_doctor_name', assigned_doctor.full_name,
            'requested_at', sr.created_at
          )
          order by
            case sr.priority
              when 'emergency' then 1
              when 'stat' then 2
              when 'urgent' then 3
              else 4
            end,
            sr.created_at
        )
        from public.service_requests sr
        join public.patients p
          on p.id = sr.patient_id
        join public.hospital_visits hv
          on hv.id = sr.visit_id
        join public.hospital_branches hb
          on hb.id = sr.branch_id
        left join public.queue_entries qe
          on qe.service_request_id = sr.id
        left join public.staff_profiles assigned_doctor
          on assigned_doctor.id = sr.assigned_staff_id
        where sr.service_type = 'consultation'
          and sr.status in ('requested', 'queued')
          and app_private.has_branch_access(sr.branch_id)
      ),
      '[]'::jsonb
    )
  );
end;
$$;

create or replace function public.get_doctor_consultation_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
begin
  v_actor := app_private.require_staff_permission(
    'doctor.queue.view',
    null
  );

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'service_request_id', sr.id,
          'request_number', sr.request_number,
          'patient_id', p.id,
          'patient_name',
            trim(
              concat_ws(
                ' ',
                p.first_name,
                p.middle_name,
                p.last_name
              )
            ),
          'medical_record_number', p.medical_record_number,
          'date_of_birth', p.date_of_birth,
          'biological_sex', p.biological_sex,
          'visit_number', hv.visit_number,
          'chief_concern', hv.chief_concern,
          'branch_id', sr.branch_id,
          'branch_name', hb.name,
          'priority', sr.priority,
          'request_status', sr.status,
          'queue_id', qe.id,
          'queue_number', qe.queue_number,
          'queue_status', qe.status,
          'called_at', qe.called_at,
          'service_started_at', qe.service_started_at,
          'consultation_id', dc.id,
          'consultation_number', dc.consultation_number,
          'consultation_status', dc.status,
          'started_at', dc.started_at,
          'completed_at', dc.completed_at,
          'requested_at', sr.created_at
        )
        order by
          case sr.priority
            when 'emergency' then 1
            when 'stat' then 2
            when 'urgent' then 3
            else 4
          end,
          qe.queue_sequence nulls last,
          sr.created_at
      )
      from public.service_requests sr
      join public.patients p
        on p.id = sr.patient_id
      join public.hospital_visits hv
        on hv.id = sr.visit_id
      join public.hospital_branches hb
        on hb.id = sr.branch_id
      left join public.queue_entries qe
        on qe.service_request_id = sr.id
      left join public.doctor_consultations dc
        on dc.service_request_id = sr.id
      where sr.service_type = 'consultation'
        and sr.assigned_staff_id = v_actor
        and sr.status not in ('cancelled', 'rejected')
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.get_doctor_consultation_workspace(
  p_service_request_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_request public.service_requests%rowtype;
begin
  select *
  into v_request
  from public.service_requests
  where id = p_service_request_id;

  if not found then
    raise exception 'Assigned consultation service request was not found.';
  end if;

  v_actor := app_private.require_staff_permission(
    'doctor.patient.view_assigned',
    v_request.branch_id
  );

  if v_request.service_type <> 'consultation'
     or v_request.assigned_staff_id is distinct from v_actor then
    raise exception 'The consultation is not assigned to the current Doctor.';
  end if;

  return jsonb_build_object(
    'request',
    (
      select jsonb_build_object(
        'id', sr.id,
        'request_number', sr.request_number,
        'status', sr.status,
        'priority', sr.priority,
        'request_notes', sr.request_notes,
        'created_at', sr.created_at,
        'started_at', sr.started_at,
        'completed_at', sr.completed_at
      )
      from public.service_requests sr
      where sr.id = v_request.id
    ),
    'patient',
    (
      select jsonb_build_object(
        'id', p.id,
        'medical_record_number', p.medical_record_number,
        'first_name', p.first_name,
        'middle_name', p.middle_name,
        'last_name', p.last_name,
        'date_of_birth', p.date_of_birth,
        'biological_sex', p.biological_sex,
        'mobile_number', p.mobile_number,
        'email_address', p.email_address,
        'address', p.address,
        'emergency_contact_name', p.emergency_contact_name,
        'emergency_contact_number', p.emergency_contact_number,
        'status', p.status
      )
      from public.patients p
      where p.id = v_request.patient_id
    ),
    'visit',
    (
      select jsonb_build_object(
        'id', hv.id,
        'visit_number', hv.visit_number,
        'arrival_mode', hv.arrival_mode,
        'initial_service_type', hv.initial_service_type,
        'chief_concern', hv.chief_concern,
        'status', hv.status,
        'registered_at', hv.registered_at,
        'checked_in_at', hv.checked_in_at
      )
      from public.hospital_visits hv
      where hv.id = v_request.visit_id
    ),
    'branch',
    (
      select jsonb_build_object(
        'id', hb.id,
        'code', hb.code,
        'name', hb.name
      )
      from public.hospital_branches hb
      where hb.id = v_request.branch_id
    ),
    'queue',
    (
      select jsonb_build_object(
        'id', qe.id,
        'queue_number', qe.queue_number,
        'queue_sequence', qe.queue_sequence,
        'priority', qe.priority,
        'status', qe.status,
        'called_at', qe.called_at,
        'service_started_at', qe.service_started_at,
        'service_completed_at', qe.service_completed_at
      )
      from public.queue_entries qe
      where qe.service_request_id = v_request.id
    ),
    'consultation',
    (
      select jsonb_build_object(
        'id', dc.id,
        'consultation_number', dc.consultation_number,
        'status', dc.status,
        'chief_complaint', dc.chief_complaint,
        'history_of_present_illness', dc.history_of_present_illness,
        'physical_examination', dc.physical_examination,
        'assessment', dc.assessment,
        'diagnosis_code', dc.diagnosis_code,
        'diagnosis_text', dc.diagnosis_text,
        'treatment_plan', dc.treatment_plan,
        'clinical_notes', dc.clinical_notes,
        'revision_number', dc.revision_number,
        'started_at', dc.started_at,
        'completed_at', dc.completed_at,
        'summary_document_id', dc.summary_document_id,
        'updated_at', dc.updated_at
      )
      from public.doctor_consultations dc
      where dc.service_request_id = v_request.id
    ),
    'clinical_documents',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', cd.id,
            'document_number', cd.document_number,
            'document_type', cd.document_type,
            'title', cd.title,
            'status', cd.status,
            'version_number', cd.version_number,
            'finalized_at', cd.finalized_at,
            'metadata', cd.metadata
          )
          order by
            coalesce(cd.finalized_at, cd.created_at) desc
        )
        from public.clinical_documents cd
        where cd.patient_id = v_request.patient_id
          and cd.status in ('finalized', 'corrected')
      ),
      '[]'::jsonb
    )
  );
end;
$$;

-- ============================================================
-- RLS AND GRANTS
-- ============================================================

alter table public.doctor_assignment_history
  enable row level security;

alter table public.doctor_consultations
  enable row level security;

revoke all
  on public.doctor_assignment_history,
     public.doctor_consultations
  from anon, authenticated;

grant select
  on public.doctor_assignment_history,
     public.doctor_consultations
  to authenticated;

drop policy if exists doctor_assignment_history_select_authorized
  on public.doctor_assignment_history;

create policy doctor_assignment_history_select_authorized
on public.doctor_assignment_history
for select
to authenticated
using (
  (select app_private.has_branch_access(branch_id))
  and (
    (select app_private.is_system_admin())
    or (select app_private.has_permission('reception.service_request.create'))
    or assigned_doctor_id = (select auth.uid())
  )
);

drop policy if exists doctor_consultations_select_authorized
  on public.doctor_consultations;

create policy doctor_consultations_select_authorized
on public.doctor_consultations
for select
to authenticated
using (
  (select app_private.has_branch_access(branch_id))
  and (
    (select app_private.is_system_admin())
    or doctor_id = (select auth.uid())
    or (select app_private.has_permission('reception.release.view'))
  )
);

revoke all
  on function public.reception_assign_consultation_doctor(text, uuid, uuid, text)
  from public, anon;

revoke all
  on function public.doctor_start_consultation(text, uuid)
  from public, anon;

revoke all
  on function public.doctor_save_consultation_draft(uuid, text, text, text, text, text, text, text, text)
  from public, anon;

revoke all
  on function public.doctor_complete_consultation(text, uuid)
  from public, anon;

revoke all
  on function public.get_reception_doctor_assignment_data()
  from public, anon;

revoke all
  on function public.get_doctor_consultation_queue()
  from public, anon;

revoke all
  on function public.get_doctor_consultation_workspace(uuid)
  from public, anon;

grant execute
  on function public.reception_assign_consultation_doctor(text, uuid, uuid, text)
  to authenticated;

grant execute
  on function public.doctor_start_consultation(text, uuid)
  to authenticated;

grant execute
  on function public.doctor_save_consultation_draft(uuid, text, text, text, text, text, text, text, text)
  to authenticated;

grant execute
  on function public.doctor_complete_consultation(text, uuid)
  to authenticated;

grant execute
  on function public.get_reception_doctor_assignment_data()
  to authenticated;

grant execute
  on function public.get_doctor_consultation_queue()
  to authenticated;

grant execute
  on function public.get_doctor_consultation_workspace(uuid)
  to authenticated;

commit;
