-- GalenMed Healthcare OS
-- Migration 004: Shared Hospital Operations Foundation
-- Target: Supabase Postgres
-- Safety:
--   * Creates new operational tables, indexes, triggers, helpers, and RLS policies.
--   * Does not modify or delete existing Staff Auth, patient, appointment, consultation,
--     laboratory, radiology, pharmacy, billing, or PhilHealth frontend records.
--   * Seeds no patient, visit, billing, payment, clinical-document, or queue data.
--   * Direct client writes remain disabled; later guarded RPC migrations will perform writes.

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

  if to_regclass('public.hospital_branches') is null then
    raise exception 'Migration 001 dependency missing: public.hospital_branches.';
  end if;

  if to_regclass('public.staff_departments') is null then
    raise exception 'Migration 001 dependency missing: public.staff_departments.';
  end if;

  if to_regprocedure('app_private.current_staff_is_active()') is null then
    raise exception 'Migration 001 dependency missing: app_private.current_staff_is_active().' ;
  end if;

  if to_regprocedure('app_private.has_permission(text)') is null then
    raise exception 'Migration 001 dependency missing: app_private.has_permission(text).' ;
  end if;

  if to_regprocedure('app_private.has_branch_access(text)') is null then
    raise exception 'Migration 001 dependency missing: app_private.has_branch_access(text).' ;
  end if;
end;
$$;

-- ============================================================
-- REFERENCE AND PATIENT REGISTRY
-- ============================================================

create table if not exists public.service_catalog_items (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  service_type text not null,
  department_id uuid not null
    references public.staff_departments(id)
    on delete restrict,
  branch_id text
    references public.hospital_branches(id)
    on delete restrict,
  default_price_centavos bigint not null default 0,
  doctor_order_required boolean not null default false,
  allows_patient_request boolean not null default false,
  active boolean not null default true,
  created_by uuid
    references public.staff_profiles(id)
    on delete set null,
  updated_by uuid
    references public.staff_profiles(id)
    on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_catalog_items_code_check
    check (code = upper(code) and code ~ '^[A-Z0-9_-]+$'),
  constraint service_catalog_items_name_check
    check (length(trim(name)) between 2 and 200),
  constraint service_catalog_items_type_check
    check (
      service_type in (
        'consultation',
        'laboratory',
        'radiology',
        'pharmacy',
        'billing',
        'procedure',
        'other'
      )
    ),
  constraint service_catalog_items_price_check
    check (default_price_centavos >= 0)
);

comment on table public.service_catalog_items is
  'Approved hospital service catalog. No demo services are seeded by this migration.';

create unique index if not exists service_catalog_items_scope_code_unique_idx
  on public.service_catalog_items (
    coalesce(branch_id, '*'),
    lower(code)
  );

create index if not exists service_catalog_items_department_active_idx
  on public.service_catalog_items (department_id, active, name);

create index if not exists service_catalog_items_branch_type_active_idx
  on public.service_catalog_items (branch_id, service_type, active, name);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  medical_record_number text not null unique,
  first_name text not null,
  middle_name text,
  last_name text not null,
  date_of_birth date not null,
  biological_sex text not null,
  mobile_number text,
  email_address text,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  address text not null,
  emergency_contact_name text not null,
  emergency_contact_number text not null,
  status text not null default 'active',
  consent_acknowledged_at timestamptz,
  consent_acknowledged_by uuid
    references public.staff_profiles(id)
    on delete set null,
  archived_at timestamptz,
  archived_by uuid
    references public.staff_profiles(id)
    on delete set null,
  archive_reason text,
  created_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  updated_by uuid
    references public.staff_profiles(id)
    on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_mrn_format_check
    check (medical_record_number ~ '^GM-[0-9]{4}-[0-9]{6}$'),
  constraint patients_first_name_check
    check (length(trim(first_name)) between 1 and 100),
  constraint patients_last_name_check
    check (length(trim(last_name)) between 1 and 100),
  constraint patients_biological_sex_check
    check (biological_sex in ('male', 'female', 'intersex', 'unknown')),
  constraint patients_status_check
    check (status in ('active', 'inactive', 'archived')),
  constraint patients_archive_fields_check
    check (
      status <> 'archived'
      or (
        archived_at is not null
        and archived_by is not null
        and nullif(trim(archive_reason), '') is not null
      )
    )
);

comment on table public.patients is
  'Canonical hospital patient registry used by receptionist intake and operational workflows.';

create index if not exists patients_branch_status_name_idx
  on public.patients (branch_id, status, last_name, first_name);

create index if not exists patients_lower_name_idx
  on public.patients (
    lower(last_name),
    lower(first_name),
    lower(coalesce(middle_name, ''))
  );

create index if not exists patients_mobile_idx
  on public.patients (mobile_number)
  where mobile_number is not null;

-- ============================================================
-- VISITS, SERVICE REQUESTS, AND QUEUES
-- ============================================================

create table if not exists public.hospital_visits (
  id uuid primary key default gen_random_uuid(),
  visit_number text not null unique,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  arrival_mode text not null default 'walk_in',
  initial_service_type text not null,
  chief_concern text,
  status text not null default 'registered',
  registered_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  registered_at timestamptz not null default now(),
  checked_in_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid
    references public.staff_profiles(id)
    on delete set null,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_visits_number_check
    check (visit_number = upper(visit_number) and visit_number ~ '^[A-Z0-9-]+$'),
  constraint hospital_visits_arrival_mode_check
    check (
      arrival_mode in (
        'walk_in',
        'appointment',
        'emergency',
        'admission',
        'follow_up',
        'other'
      )
    ),
  constraint hospital_visits_initial_service_type_check
    check (
      initial_service_type in (
        'consultation',
        'laboratory',
        'radiology',
        'pharmacy',
        'billing',
        'procedure',
        'other'
      )
    ),
  constraint hospital_visits_status_check
    check (
      status in (
        'registered',
        'checked_in',
        'active',
        'completed',
        'cancelled'
      )
    ),
  constraint hospital_visits_cancel_fields_check
    check (
      status <> 'cancelled'
      or (
        cancelled_at is not null
        and cancelled_by is not null
        and nullif(trim(cancellation_reason), '') is not null
      )
    )
);

comment on table public.hospital_visits is
  'Reception-created hospital visit that groups service requests, billing, and release records.';

create index if not exists hospital_visits_patient_created_idx
  on public.hospital_visits (patient_id, created_at desc);

create index if not exists hospital_visits_branch_status_registered_idx
  on public.hospital_visits (branch_id, status, registered_at desc);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  visit_id uuid not null
    references public.hospital_visits(id)
    on delete restrict,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  service_catalog_item_id uuid
    references public.service_catalog_items(id)
    on delete restrict,
  service_type text not null,
  request_source text not null default 'reception',
  requested_by_staff_id uuid
    references public.staff_profiles(id)
    on delete set null,
  requested_by_name text,
  assigned_department_id uuid not null
    references public.staff_departments(id)
    on delete restrict,
  assigned_staff_id uuid
    references public.staff_profiles(id)
    on delete restrict,
  parent_request_id uuid
    references public.service_requests(id)
    on delete restrict,
  priority text not null default 'routine',
  doctor_order_required boolean not null default false,
  doctor_order_reference text,
  request_notes text,
  status text not null default 'requested',
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid
    references public.staff_profiles(id)
    on delete set null,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_requests_number_check
    check (request_number = upper(request_number) and request_number ~ '^[A-Z0-9-]+$'),
  constraint service_requests_type_check
    check (
      service_type in (
        'consultation',
        'laboratory',
        'radiology',
        'pharmacy',
        'billing',
        'procedure',
        'other'
      )
    ),
  constraint service_requests_source_check
    check (
      request_source in (
        'reception',
        'doctor',
        'patient',
        'external',
        'system'
      )
    ),
  constraint service_requests_priority_check
    check (priority in ('routine', 'urgent', 'stat', 'emergency')),
  constraint service_requests_status_check
    check (
      status in (
        'requested',
        'queued',
        'in_progress',
        'completed',
        'cancelled',
        'rejected'
      )
    ),
  constraint service_requests_doctor_order_check
    check (
      not doctor_order_required
      or nullif(trim(doctor_order_reference), '') is not null
    ),
  constraint service_requests_cancel_fields_check
    check (
      status <> 'cancelled'
      or (
        cancelled_at is not null
        and cancelled_by is not null
        and nullif(trim(cancellation_reason), '') is not null
      )
    )
);

comment on table public.service_requests is
  'Reception, doctor, patient, or external request routed to a hospital department and optional staff assignee.';

create index if not exists service_requests_visit_type_status_idx
  on public.service_requests (visit_id, service_type, status, created_at desc);

create index if not exists service_requests_patient_type_status_idx
  on public.service_requests (patient_id, service_type, status, created_at desc);

create index if not exists service_requests_branch_department_status_idx
  on public.service_requests (branch_id, assigned_department_id, status, priority, created_at);

create index if not exists service_requests_assigned_staff_status_idx
  on public.service_requests (assigned_staff_id, status, priority, created_at)
  where assigned_staff_id is not null;

create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  queue_number text not null,
  queue_date date not null default current_date,
  queue_sequence integer not null,
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
  department_id uuid not null
    references public.staff_departments(id)
    on delete restrict,
  assigned_staff_id uuid
    references public.staff_profiles(id)
    on delete restrict,
  priority text not null default 'routine',
  status text not null default 'waiting',
  called_at timestamptz,
  service_started_at timestamptz,
  service_completed_at timestamptz,
  no_show_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint queue_entries_number_check
    check (queue_number = upper(queue_number) and queue_number ~ '^[A-Z0-9-]+$'),
  constraint queue_entries_sequence_check
    check (queue_sequence > 0),
  constraint queue_entries_priority_check
    check (priority in ('routine', 'urgent', 'stat', 'emergency')),
  constraint queue_entries_status_check
    check (
      status in (
        'waiting',
        'called',
        'in_service',
        'completed',
        'no_show',
        'cancelled'
      )
    )
);

comment on table public.queue_entries is
  'Branch and department queue entry linked one-to-one to a service request.';

create unique index if not exists queue_entries_scope_sequence_unique_idx
  on public.queue_entries (
    branch_id,
    department_id,
    queue_date,
    queue_sequence
  );

create unique index if not exists queue_entries_scope_number_unique_idx
  on public.queue_entries (
    branch_id,
    department_id,
    queue_date,
    queue_number
  );

create index if not exists queue_entries_department_status_idx
  on public.queue_entries (
    branch_id,
    department_id,
    queue_date,
    status,
    priority,
    queue_sequence
  );

create index if not exists queue_entries_assigned_staff_status_idx
  on public.queue_entries (assigned_staff_id, queue_date, status, queue_sequence)
  where assigned_staff_id is not null;

-- ============================================================
-- BILLING AND CASHIER CLEARANCE
-- ============================================================

create table if not exists public.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  billing_number text not null unique,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  visit_id uuid not null unique
    references public.hospital_visits(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  currency_code text not null default 'PHP',
  status text not null default 'open',
  gross_amount_centavos bigint not null default 0,
  discount_amount_centavos bigint not null default 0,
  coverage_amount_centavos bigint not null default 0,
  paid_amount_centavos bigint not null default 0,
  refunded_amount_centavos bigint not null default 0,
  balance_amount_centavos bigint not null default 0,
  opened_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  updated_by uuid
    references public.staff_profiles(id)
    on delete set null,
  voided_at timestamptz,
  voided_by uuid
    references public.staff_profiles(id)
    on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_accounts_number_check
    check (billing_number = upper(billing_number) and billing_number ~ '^[A-Z0-9-]+$'),
  constraint billing_accounts_currency_check
    check (currency_code = 'PHP'),
  constraint billing_accounts_status_check
    check (
      status in (
        'open',
        'partially_paid',
        'paid',
        'waived',
        'refunded',
        'voided'
      )
    ),
  constraint billing_accounts_amounts_check
    check (
      gross_amount_centavos >= 0
      and discount_amount_centavos >= 0
      and coverage_amount_centavos >= 0
      and paid_amount_centavos >= 0
      and refunded_amount_centavos >= 0
      and balance_amount_centavos >= 0
    ),
  constraint billing_accounts_void_fields_check
    check (
      status <> 'voided'
      or (
        voided_at is not null
        and voided_by is not null
        and nullif(trim(void_reason), '') is not null
      )
    )
);

comment on table public.billing_accounts is
  'Single consolidated patient billing account for a hospital visit.';

create index if not exists billing_accounts_patient_status_idx
  on public.billing_accounts (patient_id, status, created_at desc);

create index if not exists billing_accounts_branch_status_idx
  on public.billing_accounts (branch_id, status, created_at desc);

create table if not exists public.billing_charge_items (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null
    references public.billing_accounts(id)
    on delete restrict,
  service_request_id uuid
    references public.service_requests(id)
    on delete restrict,
  source_module text not null,
  source_record_id text,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_amount_centavos bigint not null,
  total_amount_centavos bigint generated always as (
    round(quantity * unit_amount_centavos)::bigint
  ) stored,
  status text not null default 'posted',
  posted_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  posted_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid
    references public.staff_profiles(id)
    on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_charge_items_source_module_check
    check (source_module ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  constraint billing_charge_items_description_check
    check (length(trim(description)) between 2 and 500),
  constraint billing_charge_items_quantity_check
    check (quantity > 0),
  constraint billing_charge_items_unit_amount_check
    check (unit_amount_centavos >= 0),
  constraint billing_charge_items_status_check
    check (status in ('posted', 'voided', 'refunded')),
  constraint billing_charge_items_void_fields_check
    check (
      status <> 'voided'
      or (
        voided_at is not null
        and voided_by is not null
        and nullif(trim(void_reason), '') is not null
      )
    )
);

comment on table public.billing_charge_items is
  'Immutable-source billing line item posted to the consolidated billing account.';

create index if not exists billing_charge_items_account_status_idx
  on public.billing_charge_items (billing_account_id, status, posted_at);

create index if not exists billing_charge_items_service_request_idx
  on public.billing_charge_items (service_request_id)
  where service_request_id is not null;

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_number text not null unique,
  billing_account_id uuid not null
    references public.billing_accounts(id)
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
  amount_centavos bigint not null,
  payment_method text not null,
  status text not null default 'posted',
  external_reference text,
  official_receipt_number text unique,
  posted_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  posted_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid
    references public.staff_profiles(id)
    on delete set null,
  void_reason text,
  refunded_at timestamptz,
  refunded_by uuid
    references public.staff_profiles(id)
    on delete set null,
  refund_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_transactions_number_check
    check (payment_number = upper(payment_number) and payment_number ~ '^[A-Z0-9-]+$'),
  constraint payment_transactions_amount_check
    check (amount_centavos > 0),
  constraint payment_transactions_method_check
    check (
      payment_method in (
        'cash',
        'card',
        'bank_transfer',
        'e_wallet',
        'insurance',
        'philhealth',
        'other'
      )
    ),
  constraint payment_transactions_status_check
    check (status in ('posted', 'voided', 'refunded')),
  constraint payment_transactions_void_fields_check
    check (
      status <> 'voided'
      or (
        voided_at is not null
        and voided_by is not null
        and nullif(trim(void_reason), '') is not null
      )
    ),
  constraint payment_transactions_refund_fields_check
    check (
      status <> 'refunded'
      or (
        refunded_at is not null
        and refunded_by is not null
        and nullif(trim(refund_reason), '') is not null
      )
    )
);

comment on table public.payment_transactions is
  'Cashier-posted payment, void, or refund transaction for a billing account.';

create index if not exists payment_transactions_account_status_idx
  on public.payment_transactions (billing_account_id, status, posted_at desc);

create index if not exists payment_transactions_patient_posted_idx
  on public.payment_transactions (patient_id, posted_at desc);

create index if not exists payment_transactions_branch_posted_idx
  on public.payment_transactions (branch_id, posted_at desc);

create table if not exists public.payment_clearances (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null unique
    references public.service_requests(id)
    on delete restrict,
  billing_account_id uuid not null
    references public.billing_accounts(id)
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
  clearance_status text not null default 'pending',
  required_amount_centavos bigint not null default 0,
  cleared_amount_centavos bigint not null default 0,
  cleared_by uuid
    references public.staff_profiles(id)
    on delete set null,
  cleared_at timestamptz,
  clearance_reason text,
  override_authorized_by uuid
    references public.staff_profiles(id)
    on delete set null,
  updated_by uuid
    references public.staff_profiles(id)
    on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_clearances_status_check
    check (
      clearance_status in (
        'pending',
        'partially_cleared',
        'cleared',
        'waived',
        'blocked',
        'revoked'
      )
    ),
  constraint payment_clearances_amounts_check
    check (
      required_amount_centavos >= 0
      and cleared_amount_centavos >= 0
      and cleared_amount_centavos <= required_amount_centavos
    ),
  constraint payment_clearances_completion_fields_check
    check (
      clearance_status not in ('cleared', 'waived')
      or (
        cleared_at is not null
        and cleared_by is not null
        and nullif(trim(clearance_reason), '') is not null
      )
    )
);

comment on table public.payment_clearances is
  'Cashier-controlled financial clearance for one service request and its releasable documents.';

create index if not exists payment_clearances_account_status_idx
  on public.payment_clearances (billing_account_id, clearance_status, updated_at desc);

create index if not exists payment_clearances_patient_status_idx
  on public.payment_clearances (patient_id, clearance_status, updated_at desc);

create index if not exists payment_clearances_branch_status_idx
  on public.payment_clearances (branch_id, clearance_status, updated_at desc);

-- ============================================================
-- CLINICAL DOCUMENT REGISTRY AND RELEASE CONTROL
-- ============================================================

create table if not exists public.clinical_documents (
  id uuid primary key default gen_random_uuid(),
  document_number text not null unique,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  visit_id uuid not null
    references public.hospital_visits(id)
    on delete restrict,
  service_request_id uuid
    references public.service_requests(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  document_type text not null,
  title text not null,
  source_module text not null,
  source_record_id text,
  version_number integer not null default 1,
  status text not null default 'draft',
  sensitivity text not null default 'sensitive',
  payment_required boolean not null default true,
  storage_path text,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  supersedes_document_id uuid
    references public.clinical_documents(id)
    on delete restrict,
  created_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  finalized_by uuid
    references public.staff_profiles(id)
    on delete restrict,
  finalized_at timestamptz,
  voided_by uuid
    references public.staff_profiles(id)
    on delete set null,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_documents_number_check
    check (document_number = upper(document_number) and document_number ~ '^[A-Z0-9-]+$'),
  constraint clinical_documents_type_check
    check (
      document_type in (
        'prescription',
        'laboratory_result',
        'radiology_report',
        'consultation_summary',
        'diagnosis_summary',
        'medical_certificate',
        'official_receipt',
        'other'
      )
    ),
  constraint clinical_documents_title_check
    check (length(trim(title)) between 2 and 300),
  constraint clinical_documents_source_module_check
    check (source_module ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  constraint clinical_documents_version_check
    check (version_number > 0),
  constraint clinical_documents_status_check
    check (
      status in (
        'draft',
        'for_review',
        'finalized',
        'corrected',
        'superseded',
        'voided'
      )
    ),
  constraint clinical_documents_sensitivity_check
    check (sensitivity in ('standard', 'sensitive', 'restricted')),
  constraint clinical_documents_finalization_fields_check
    check (
      status not in ('finalized', 'corrected', 'superseded')
      or (finalized_by is not null and finalized_at is not null)
    ),
  constraint clinical_documents_void_fields_check
    check (
      status <> 'voided'
      or (
        voided_at is not null
        and voided_by is not null
        and nullif(trim(void_reason), '') is not null
      )
    )
);

comment on table public.clinical_documents is
  'Versioned registry of finalized clinical documents and printable patient-facing artifacts.';

create unique index if not exists clinical_documents_source_version_unique_idx
  on public.clinical_documents (
    source_module,
    source_record_id,
    version_number
  )
  where source_record_id is not null;

create index if not exists clinical_documents_patient_type_status_idx
  on public.clinical_documents (patient_id, document_type, status, created_at desc);

create index if not exists clinical_documents_service_request_idx
  on public.clinical_documents (service_request_id, status, created_at desc)
  where service_request_id is not null;

create index if not exists clinical_documents_branch_status_idx
  on public.clinical_documents (branch_id, status, created_at desc);

create table if not exists public.document_release_clearances (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique
    references public.clinical_documents(id)
    on delete restrict,
  payment_clearance_id uuid
    references public.payment_clearances(id)
    on delete restrict,
  release_status text not null default 'not_ready',
  clinical_ready_at timestamptz,
  payment_checked_at timestamptz,
  ready_at timestamptz,
  released_at timestamptz,
  blocked_reason text,
  updated_by uuid
    references public.staff_profiles(id)
    on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_release_clearances_status_check
    check (
      release_status in (
        'not_ready',
        'payment_pending',
        'ready',
        'released',
        'blocked',
        'voided'
      )
    ),
  constraint document_release_clearances_ready_fields_check
    check (
      release_status not in ('ready', 'released')
      or ready_at is not null
    ),
  constraint document_release_clearances_released_fields_check
    check (
      release_status <> 'released'
      or released_at is not null
    )
);

comment on table public.document_release_clearances is
  'Derived release state requiring clinical finalization plus cashier payment clearance.';

create index if not exists document_release_clearances_status_idx
  on public.document_release_clearances (release_status, updated_at desc);

create index if not exists document_release_clearances_payment_idx
  on public.document_release_clearances (payment_clearance_id, release_status)
  where payment_clearance_id is not null;

create table if not exists public.document_release_records (
  id uuid primary key default gen_random_uuid(),
  release_number text not null unique,
  document_id uuid not null
    references public.clinical_documents(id)
    on delete restrict,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  release_method text not null,
  recipient_name text not null,
  recipient_relationship text,
  recipient_identifier_masked text,
  copy_number integer not null default 1,
  released_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  released_at timestamptz not null default now(),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint document_release_records_number_check
    check (release_number = upper(release_number) and release_number ~ '^[A-Z0-9-]+$'),
  constraint document_release_records_method_check
    check (
      release_method in (
        'physical_print',
        'patient_portal',
        'email',
        'digital_download',
        'other'
      )
    ),
  constraint document_release_records_recipient_check
    check (length(trim(recipient_name)) between 2 and 200),
  constraint document_release_records_copy_number_check
    check (copy_number > 0)
);

comment on table public.document_release_records is
  'Append-only record of a clinically finalized and financially cleared document release.';

create index if not exists document_release_records_document_released_idx
  on public.document_release_records (document_id, released_at desc);

create index if not exists document_release_records_patient_released_idx
  on public.document_release_records (patient_id, released_at desc);

create index if not exists document_release_records_branch_released_idx
  on public.document_release_records (branch_id, released_at desc);

create table if not exists public.document_print_logs (
  id bigint generated always as identity primary key,
  document_id uuid not null
    references public.clinical_documents(id)
    on delete restrict,
  release_record_id uuid
    references public.document_release_records(id)
    on delete restrict,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  print_purpose text not null,
  copy_number integer not null default 1,
  printed_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  printed_at timestamptz not null default now(),
  print_reason text,
  metadata jsonb not null default '{}'::jsonb,
  constraint document_print_logs_purpose_check
    check (
      print_purpose in (
        'patient_original',
        'patient_copy',
        'admin_copy',
        'reprint'
      )
    ),
  constraint document_print_logs_copy_number_check
    check (copy_number > 0),
  constraint document_print_logs_reprint_reason_check
    check (
      print_purpose <> 'reprint'
      or nullif(trim(print_reason), '') is not null
    )
);

comment on table public.document_print_logs is
  'Append-only print and reprint audit log for patient-facing clinical documents.';

create index if not exists document_print_logs_document_printed_idx
  on public.document_print_logs (document_id, printed_at desc);

create index if not exists document_print_logs_staff_printed_idx
  on public.document_print_logs (printed_by, printed_at desc);

create table if not exists public.hospital_operation_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid
    references public.staff_profiles(id)
    on delete set null,
  patient_id uuid
    references public.patients(id)
    on delete set null,
  branch_id text
    references public.hospital_branches(id)
    on delete set null,
  visit_id uuid
    references public.hospital_visits(id)
    on delete set null,
  service_request_id uuid
    references public.service_requests(id)
    on delete set null,
  billing_account_id uuid
    references public.billing_accounts(id)
    on delete set null,
  document_id uuid
    references public.clinical_documents(id)
    on delete set null,
  action_code text not null,
  summary text not null,
  before_snapshot jsonb,
  after_snapshot jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint hospital_operation_audit_logs_action_check
    check (action_code ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  constraint hospital_operation_audit_logs_summary_check
    check (length(trim(summary)) between 2 and 1000)
);

comment on table public.hospital_operation_audit_logs is
  'Append-only cross-role operational audit log for patient, queue, billing, clinical-document, and release actions.';

create index if not exists hospital_operation_audit_logs_patient_created_idx
  on public.hospital_operation_audit_logs (patient_id, created_at desc);

create index if not exists hospital_operation_audit_logs_actor_created_idx
  on public.hospital_operation_audit_logs (actor_user_id, created_at desc);

create index if not exists hospital_operation_audit_logs_action_created_idx
  on public.hospital_operation_audit_logs (action_code, created_at desc);

-- ============================================================
-- UPDATED-AT AND APPEND-ONLY TRIGGERS
-- ============================================================

create trigger service_catalog_items_set_updated_at
before update on public.service_catalog_items
for each row
execute function app_private.set_updated_at();

create trigger patients_set_updated_at
before update on public.patients
for each row
execute function app_private.set_updated_at();

create trigger hospital_visits_set_updated_at
before update on public.hospital_visits
for each row
execute function app_private.set_updated_at();

create trigger service_requests_set_updated_at
before update on public.service_requests
for each row
execute function app_private.set_updated_at();

create trigger queue_entries_set_updated_at
before update on public.queue_entries
for each row
execute function app_private.set_updated_at();

create trigger billing_accounts_set_updated_at
before update on public.billing_accounts
for each row
execute function app_private.set_updated_at();

create trigger billing_charge_items_set_updated_at
before update on public.billing_charge_items
for each row
execute function app_private.set_updated_at();

create trigger payment_transactions_set_updated_at
before update on public.payment_transactions
for each row
execute function app_private.set_updated_at();

create trigger payment_clearances_set_updated_at
before update on public.payment_clearances
for each row
execute function app_private.set_updated_at();

create trigger clinical_documents_set_updated_at
before update on public.clinical_documents
for each row
execute function app_private.set_updated_at();

create trigger document_release_clearances_set_updated_at
before update on public.document_release_clearances
for each row
execute function app_private.set_updated_at();

drop trigger if exists document_release_records_reject_mutation
  on public.document_release_records;

create trigger document_release_records_reject_mutation
before update or delete on public.document_release_records
for each row
execute function app_private.reject_audit_mutation();

drop trigger if exists document_print_logs_reject_mutation
  on public.document_print_logs;

create trigger document_print_logs_reject_mutation
before update or delete on public.document_print_logs
for each row
execute function app_private.reject_audit_mutation();

drop trigger if exists hospital_operation_audit_logs_reject_mutation
  on public.hospital_operation_audit_logs;

create trigger hospital_operation_audit_logs_reject_mutation
before update or delete on public.hospital_operation_audit_logs
for each row
execute function app_private.reject_audit_mutation();

-- ============================================================
-- CROSS-TABLE INTEGRITY TRIGGERS
-- ============================================================

create or replace function app_private.validate_service_request_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_patient_id uuid;
  v_branch_id text;
begin
  select hv.patient_id, hv.branch_id
  into v_patient_id, v_branch_id
  from public.hospital_visits hv
  where hv.id = new.visit_id;

  if not found then
    raise exception 'Hospital visit was not found.';
  end if;

  if new.patient_id <> v_patient_id then
    raise exception 'Service-request patient does not match the hospital visit.';
  end if;

  if new.branch_id <> v_branch_id then
    raise exception 'Service-request branch does not match the hospital visit.';
  end if;

  return new;
end;
$$;

create trigger service_requests_validate_context
before insert or update of visit_id, patient_id, branch_id
on public.service_requests
for each row
execute function app_private.validate_service_request_context();

create or replace function app_private.validate_queue_entry_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_visit_id uuid;
  v_patient_id uuid;
  v_branch_id text;
  v_department_id uuid;
begin
  select
    sr.visit_id,
    sr.patient_id,
    sr.branch_id,
    sr.assigned_department_id
  into
    v_visit_id,
    v_patient_id,
    v_branch_id,
    v_department_id
  from public.service_requests sr
  where sr.id = new.service_request_id;

  if not found then
    raise exception 'Service request was not found.';
  end if;

  if new.visit_id <> v_visit_id
     or new.patient_id <> v_patient_id
     or new.branch_id <> v_branch_id
     or new.department_id <> v_department_id then
    raise exception 'Queue context does not match the linked service request.';
  end if;

  return new;
end;
$$;

create trigger queue_entries_validate_context
before insert or update of service_request_id, visit_id, patient_id, branch_id, department_id
on public.queue_entries
for each row
execute function app_private.validate_queue_entry_context();

create or replace function app_private.validate_billing_account_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_patient_id uuid;
  v_branch_id text;
begin
  select hv.patient_id, hv.branch_id
  into v_patient_id, v_branch_id
  from public.hospital_visits hv
  where hv.id = new.visit_id;

  if not found then
    raise exception 'Hospital visit was not found.';
  end if;

  if new.patient_id <> v_patient_id
     or new.branch_id <> v_branch_id then
    raise exception 'Billing-account context does not match the hospital visit.';
  end if;

  return new;
end;
$$;

create trigger billing_accounts_validate_context
before insert or update of visit_id, patient_id, branch_id
on public.billing_accounts
for each row
execute function app_private.validate_billing_account_context();

create or replace function app_private.validate_charge_item_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_visit_id uuid;
  v_patient_id uuid;
  v_branch_id text;
  v_request_visit_id uuid;
  v_request_patient_id uuid;
  v_request_branch_id text;
begin
  select ba.visit_id, ba.patient_id, ba.branch_id
  into v_visit_id, v_patient_id, v_branch_id
  from public.billing_accounts ba
  where ba.id = new.billing_account_id;

  if not found then
    raise exception 'Billing account was not found.';
  end if;

  if new.service_request_id is not null then
    select sr.visit_id, sr.patient_id, sr.branch_id
    into v_request_visit_id, v_request_patient_id, v_request_branch_id
    from public.service_requests sr
    where sr.id = new.service_request_id;

    if not found then
      raise exception 'Service request was not found.';
    end if;

    if v_request_visit_id <> v_visit_id
       or v_request_patient_id <> v_patient_id
       or v_request_branch_id <> v_branch_id then
      raise exception 'Charge-item context does not match the billing account.';
    end if;
  end if;

  return new;
end;
$$;

create trigger billing_charge_items_validate_context
before insert or update of billing_account_id, service_request_id
on public.billing_charge_items
for each row
execute function app_private.validate_charge_item_context();

create or replace function app_private.validate_payment_transaction_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_visit_id uuid;
  v_patient_id uuid;
  v_branch_id text;
begin
  select ba.visit_id, ba.patient_id, ba.branch_id
  into v_visit_id, v_patient_id, v_branch_id
  from public.billing_accounts ba
  where ba.id = new.billing_account_id;

  if not found then
    raise exception 'Billing account was not found.';
  end if;

  if new.visit_id <> v_visit_id
     or new.patient_id <> v_patient_id
     or new.branch_id <> v_branch_id then
    raise exception 'Payment context does not match the billing account.';
  end if;

  return new;
end;
$$;

create trigger payment_transactions_validate_context
before insert or update of billing_account_id, visit_id, patient_id, branch_id
on public.payment_transactions
for each row
execute function app_private.validate_payment_transaction_context();

create or replace function app_private.validate_payment_clearance_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_account_visit_id uuid;
  v_account_patient_id uuid;
  v_account_branch_id text;
  v_request_visit_id uuid;
  v_request_patient_id uuid;
  v_request_branch_id text;
begin
  select ba.visit_id, ba.patient_id, ba.branch_id
  into v_account_visit_id, v_account_patient_id, v_account_branch_id
  from public.billing_accounts ba
  where ba.id = new.billing_account_id;

  if not found then
    raise exception 'Billing account was not found.';
  end if;

  select sr.visit_id, sr.patient_id, sr.branch_id
  into v_request_visit_id, v_request_patient_id, v_request_branch_id
  from public.service_requests sr
  where sr.id = new.service_request_id;

  if not found then
    raise exception 'Service request was not found.';
  end if;

  if new.visit_id <> v_account_visit_id
     or new.patient_id <> v_account_patient_id
     or new.branch_id <> v_account_branch_id
     or v_request_visit_id <> v_account_visit_id
     or v_request_patient_id <> v_account_patient_id
     or v_request_branch_id <> v_account_branch_id then
    raise exception 'Payment-clearance context is inconsistent.';
  end if;

  return new;
end;
$$;

create trigger payment_clearances_validate_context
before insert or update of service_request_id, billing_account_id, visit_id, patient_id, branch_id
on public.payment_clearances
for each row
execute function app_private.validate_payment_clearance_context();

create or replace function app_private.validate_clinical_document_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_visit_patient_id uuid;
  v_visit_branch_id text;
  v_request_visit_id uuid;
  v_request_patient_id uuid;
  v_request_branch_id text;
begin
  select hv.patient_id, hv.branch_id
  into v_visit_patient_id, v_visit_branch_id
  from public.hospital_visits hv
  where hv.id = new.visit_id;

  if not found then
    raise exception 'Hospital visit was not found.';
  end if;

  if new.patient_id <> v_visit_patient_id
     or new.branch_id <> v_visit_branch_id then
    raise exception 'Clinical-document context does not match the hospital visit.';
  end if;

  if new.service_request_id is not null then
    select sr.visit_id, sr.patient_id, sr.branch_id
    into v_request_visit_id, v_request_patient_id, v_request_branch_id
    from public.service_requests sr
    where sr.id = new.service_request_id;

    if not found then
      raise exception 'Service request was not found.';
    end if;

    if v_request_visit_id <> new.visit_id
       or v_request_patient_id <> new.patient_id
       or v_request_branch_id <> new.branch_id then
      raise exception 'Clinical-document context does not match the service request.';
    end if;
  end if;

  return new;
end;
$$;

create trigger clinical_documents_validate_context
before insert or update of visit_id, patient_id, branch_id, service_request_id
on public.clinical_documents
for each row
execute function app_private.validate_clinical_document_context();

-- ============================================================
-- RELEASE-STATE SYNCHRONIZATION
-- ============================================================

create or replace function app_private.sync_document_release_clearance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment_clearance_id uuid;
  v_payment_status text;
  v_release_status text;
  v_now timestamptz := now();
  v_clinically_ready boolean;
begin
  v_clinically_ready := new.status in ('finalized', 'corrected');

  if new.service_request_id is not null then
    select pc.id, pc.clearance_status
    into v_payment_clearance_id, v_payment_status
    from public.payment_clearances pc
    where pc.service_request_id = new.service_request_id
    limit 1;
  end if;

  v_release_status :=
    case
      when new.status = 'voided' then 'voided'
      when not v_clinically_ready then 'not_ready'
      when not new.payment_required then 'ready'
      when v_payment_status in ('cleared', 'waived') then 'ready'
      when v_payment_status in ('blocked', 'revoked') then 'blocked'
      else 'payment_pending'
    end;

  insert into public.document_release_clearances (
    document_id,
    payment_clearance_id,
    release_status,
    clinical_ready_at,
    payment_checked_at,
    ready_at,
    blocked_reason,
    updated_by
  )
  values (
    new.id,
    v_payment_clearance_id,
    v_release_status,
    case when v_clinically_ready then coalesce(new.finalized_at, v_now) else null end,
    case when v_payment_clearance_id is not null then v_now else null end,
    case when v_release_status = 'ready' then v_now else null end,
    case when v_release_status = 'blocked' then 'Payment clearance is blocked or revoked.' else null end,
    coalesce(new.finalized_by, new.created_by)
  )
  on conflict (document_id) do update
  set
    payment_clearance_id = excluded.payment_clearance_id,
    release_status = case
      when public.document_release_clearances.release_status = 'released'
        then 'released'
      else excluded.release_status
    end,
    clinical_ready_at = excluded.clinical_ready_at,
    payment_checked_at = excluded.payment_checked_at,
    ready_at = case
      when public.document_release_clearances.release_status = 'released'
        then public.document_release_clearances.ready_at
      else excluded.ready_at
    end,
    blocked_reason = excluded.blocked_reason,
    updated_by = excluded.updated_by;

  return new;
end;
$$;

create trigger clinical_documents_sync_release_clearance
after insert or update of status, payment_required, service_request_id, finalized_at, finalized_by
on public.clinical_documents
for each row
execute function app_private.sync_document_release_clearance();

create or replace function app_private.sync_release_clearances_from_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
begin
  update public.document_release_clearances drc
  set
    payment_clearance_id = new.id,
    payment_checked_at = v_now,
    release_status = case
      when drc.release_status = 'released' then 'released'
      when cd.status = 'voided' then 'voided'
      when cd.status not in ('finalized', 'corrected') then 'not_ready'
      when not cd.payment_required then 'ready'
      when new.clearance_status in ('cleared', 'waived') then 'ready'
      when new.clearance_status in ('blocked', 'revoked') then 'blocked'
      else 'payment_pending'
    end,
    ready_at = case
      when drc.release_status = 'released' then drc.ready_at
      when cd.status in ('finalized', 'corrected')
       and (
         not cd.payment_required
         or new.clearance_status in ('cleared', 'waived')
       ) then coalesce(drc.ready_at, v_now)
      else null
    end,
    blocked_reason = case
      when new.clearance_status in ('blocked', 'revoked')
        then coalesce(new.clearance_reason, 'Payment clearance is blocked or revoked.')
      else null
    end,
    updated_by = coalesce(new.updated_by, new.cleared_by)
  from public.clinical_documents cd
  where drc.document_id = cd.id
    and cd.service_request_id = new.service_request_id;

  return new;
end;
$$;

create trigger payment_clearances_sync_document_release
after insert or update of clearance_status, cleared_amount_centavos, cleared_at, cleared_by
on public.payment_clearances
for each row
execute function app_private.sync_release_clearances_from_payment();

create or replace function app_private.validate_document_release_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_id uuid;
  v_branch_id text;
  v_document_status text;
  v_release_status text;
begin
  select cd.patient_id, cd.branch_id, cd.status
  into v_patient_id, v_branch_id, v_document_status
  from public.clinical_documents cd
  where cd.id = new.document_id;

  if not found then
    raise exception 'Clinical document was not found.';
  end if;

  if new.patient_id <> v_patient_id
     or new.branch_id <> v_branch_id then
    raise exception 'Document-release context does not match the clinical document.';
  end if;

  if v_document_status not in ('finalized', 'corrected') then
    raise exception 'Only a finalized clinical document can be released.';
  end if;

  select drc.release_status
  into v_release_status
  from public.document_release_clearances drc
  where drc.document_id = new.document_id;

  if v_release_status not in ('ready', 'released') then
    raise exception 'Document is not ready for release. Current status: %.', coalesce(v_release_status, 'missing');
  end if;

  return new;
end;
$$;

create trigger document_release_records_validate_context
before insert on public.document_release_records
for each row
execute function app_private.validate_document_release_context();

create or replace function app_private.mark_document_released()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.document_release_clearances
  set
    release_status = 'released',
    released_at = coalesce(released_at, new.released_at),
    updated_by = new.released_by
  where document_id = new.document_id;

  return new;
end;
$$;

create trigger document_release_records_mark_released
after insert on public.document_release_records
for each row
execute function app_private.mark_document_released();

create or replace function app_private.validate_document_print_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_id uuid;
  v_branch_id text;
  v_document_status text;
  v_release_status text;
begin
  select cd.patient_id, cd.branch_id, cd.status
  into v_patient_id, v_branch_id, v_document_status
  from public.clinical_documents cd
  where cd.id = new.document_id;

  if not found then
    raise exception 'Clinical document was not found.';
  end if;

  if new.patient_id <> v_patient_id
     or new.branch_id <> v_branch_id then
    raise exception 'Document-print context does not match the clinical document.';
  end if;

  if v_document_status not in ('finalized', 'corrected') then
    raise exception 'Only a finalized clinical document can be printed.';
  end if;

  select drc.release_status
  into v_release_status
  from public.document_release_clearances drc
  where drc.document_id = new.document_id;

  if new.print_purpose in ('patient_original', 'patient_copy', 'reprint')
     and v_release_status not in ('ready', 'released') then
    raise exception 'Patient-facing print is blocked until release readiness.';
  end if;

  return new;
end;
$$;

create trigger document_print_logs_validate_context
before insert on public.document_print_logs
for each row
execute function app_private.validate_document_print_context();

-- ============================================================
-- AUTHORIZATION HELPERS FOR RLS
-- ============================================================

create or replace function app_private.can_view_patient_record(
  requested_patient_id uuid,
  requested_branch_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    app_private.current_staff_is_active()
    and app_private.has_branch_access(requested_branch_id)
    and (
      app_private.is_system_admin()
      or app_private.has_permission('reception.patient.search')
      or (
        app_private.has_permission('doctor.patient.view_assigned')
        and exists (
          select 1
          from public.service_requests sr
          where sr.patient_id = requested_patient_id
            and sr.branch_id = requested_branch_id
            and sr.assigned_staff_id = auth.uid()
            and sr.service_type = 'consultation'
            and sr.status not in ('cancelled', 'rejected')
        )
      )
      or (
        app_private.has_permission('laboratory.order.view')
        and exists (
          select 1
          from public.service_requests sr
          where sr.patient_id = requested_patient_id
            and sr.branch_id = requested_branch_id
            and sr.service_type = 'laboratory'
            and sr.status not in ('cancelled', 'rejected')
        )
      )
      or (
        app_private.has_permission('cashier.billing.search')
        and exists (
          select 1
          from public.billing_accounts ba
          where ba.patient_id = requested_patient_id
            and ba.branch_id = requested_branch_id
            and ba.status <> 'voided'
        )
      )
    );
$$;

create or replace function app_private.can_view_service_request(
  requested_service_request_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.service_requests sr
    where sr.id = requested_service_request_id
      and app_private.current_staff_is_active()
      and app_private.has_branch_access(sr.branch_id)
      and (
        app_private.is_system_admin()
        or app_private.has_permission('reception.service_request.create')
        or app_private.has_permission('cashier.billing.search')
        or (
          sr.service_type = 'laboratory'
          and app_private.has_permission('laboratory.order.view')
        )
        or (
          sr.service_type = 'consultation'
          and sr.assigned_staff_id = auth.uid()
          and app_private.has_permission('doctor.queue.view')
        )
      )
  );
$$;

create or replace function app_private.can_view_billing_account(
  requested_billing_account_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.billing_accounts ba
    where ba.id = requested_billing_account_id
      and app_private.current_staff_is_active()
      and app_private.has_branch_access(ba.branch_id)
      and (
        app_private.is_system_admin()
        or app_private.has_permission('cashier.billing.search')
      )
  );
$$;

create or replace function app_private.can_view_clinical_document(
  requested_document_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clinical_documents cd
    left join public.service_requests sr
      on sr.id = cd.service_request_id
    where cd.id = requested_document_id
      and app_private.current_staff_is_active()
      and app_private.has_branch_access(cd.branch_id)
      and (
        app_private.is_system_admin()
        or app_private.has_permission('reception.release.view')
        or cd.created_by = auth.uid()
        or cd.finalized_by = auth.uid()
        or (
          cd.document_type = 'laboratory_result'
          and app_private.has_permission('laboratory.order.view')
        )
        or (
          app_private.has_permission('doctor.patient.view_assigned')
          and sr.assigned_staff_id = auth.uid()
        )
      )
  );
$$;

revoke all
  on function app_private.can_view_patient_record(uuid, text)
  from public, anon;

revoke all
  on function app_private.can_view_service_request(uuid)
  from public, anon;

revoke all
  on function app_private.can_view_billing_account(uuid)
  from public, anon;

revoke all
  on function app_private.can_view_clinical_document(uuid)
  from public, anon;

grant execute
  on function app_private.can_view_patient_record(uuid, text)
  to authenticated;

grant execute
  on function app_private.can_view_service_request(uuid)
  to authenticated;

grant execute
  on function app_private.can_view_billing_account(uuid)
  to authenticated;

grant execute
  on function app_private.can_view_clinical_document(uuid)
  to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- Direct client writes are intentionally not granted in this
-- foundation migration. Later guarded RPCs will perform writes.
-- ============================================================

alter table public.service_catalog_items enable row level security;
alter table public.patients enable row level security;
alter table public.hospital_visits enable row level security;
alter table public.service_requests enable row level security;
alter table public.queue_entries enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.billing_charge_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_clearances enable row level security;
alter table public.clinical_documents enable row level security;
alter table public.document_release_clearances enable row level security;
alter table public.document_release_records enable row level security;
alter table public.document_print_logs enable row level security;
alter table public.hospital_operation_audit_logs enable row level security;

revoke all
  on public.service_catalog_items,
     public.patients,
     public.hospital_visits,
     public.service_requests,
     public.queue_entries,
     public.billing_accounts,
     public.billing_charge_items,
     public.payment_transactions,
     public.payment_clearances,
     public.clinical_documents,
     public.document_release_clearances,
     public.document_release_records,
     public.document_print_logs,
     public.hospital_operation_audit_logs
  from anon, authenticated;

grant select
  on public.service_catalog_items,
     public.patients,
     public.hospital_visits,
     public.service_requests,
     public.queue_entries,
     public.billing_accounts,
     public.billing_charge_items,
     public.payment_transactions,
     public.payment_clearances,
     public.clinical_documents,
     public.document_release_clearances,
     public.document_release_records,
     public.document_print_logs,
     public.hospital_operation_audit_logs
  to authenticated;

create policy service_catalog_items_select_active_staff
on public.service_catalog_items
for select
to authenticated
using (
  (select app_private.current_staff_is_active())
  and active
  and (
    branch_id is null
    or (select app_private.has_branch_access(branch_id))
  )
);

create policy patients_select_authorized_staff
on public.patients
for select
to authenticated
using (
  (select app_private.can_view_patient_record(id, branch_id))
);

create policy hospital_visits_select_authorized_staff
on public.hospital_visits
for select
to authenticated
using (
  (select app_private.can_view_patient_record(patient_id, branch_id))
);

create policy service_requests_select_authorized_staff
on public.service_requests
for select
to authenticated
using (
  (select app_private.can_view_service_request(id))
);

create policy queue_entries_select_authorized_staff
on public.queue_entries
for select
to authenticated
using (
  (select app_private.can_view_service_request(service_request_id))
);

create policy billing_accounts_select_cashier_or_admin
on public.billing_accounts
for select
to authenticated
using (
  (select app_private.can_view_billing_account(id))
);

create policy billing_charge_items_select_cashier_or_admin
on public.billing_charge_items
for select
to authenticated
using (
  (select app_private.can_view_billing_account(billing_account_id))
);

create policy payment_transactions_select_cashier_or_admin
on public.payment_transactions
for select
to authenticated
using (
  (select app_private.can_view_billing_account(billing_account_id))
);

create policy payment_clearances_select_authorized_staff
on public.payment_clearances
for select
to authenticated
using (
  (select app_private.has_branch_access(branch_id))
  and (
    (select app_private.is_system_admin())
    or (select app_private.has_permission('cashier.clearance.manage'))
    or (select app_private.has_permission('reception.release.view'))
    or (
      (select app_private.has_permission('laboratory.payment_status.view'))
      and exists (
        select 1
        from public.service_requests sr
        where sr.id = service_request_id
          and sr.service_type = 'laboratory'
      )
    )
  )
);

create policy clinical_documents_select_authorized_staff
on public.clinical_documents
for select
to authenticated
using (
  (select app_private.can_view_clinical_document(id))
);

create policy document_release_clearances_select_authorized_staff
on public.document_release_clearances
for select
to authenticated
using (
  (select app_private.can_view_clinical_document(document_id))
  or exists (
    select 1
    from public.payment_clearances pc
    where pc.id = payment_clearance_id
      and app_private.has_branch_access(pc.branch_id)
      and app_private.has_permission('cashier.clearance.manage')
  )
);

create policy document_release_records_select_reception_or_admin
on public.document_release_records
for select
to authenticated
using (
  (select app_private.has_branch_access(branch_id))
  and (
    (select app_private.is_system_admin())
    or (select app_private.has_permission('reception.release.view'))
    or released_by = (select auth.uid())
  )
);

create policy document_print_logs_select_reception_or_admin
on public.document_print_logs
for select
to authenticated
using (
  (select app_private.has_branch_access(branch_id))
  and (
    (select app_private.is_system_admin())
    or (select app_private.has_permission('reception.release.view'))
    or printed_by = (select auth.uid())
  )
);

create policy hospital_operation_audit_logs_select_actor_or_admin
on public.hospital_operation_audit_logs
for select
to authenticated
using (
  actor_user_id = (select auth.uid())
  or (select app_private.has_permission('security.audit.view'))
);

commit;
