-- GalenMed Healthcare OS
-- Migration 005: Guarded Hospital Workflow RPCs
-- Target: Supabase Postgres
-- Safety:
--   * Adds idempotency keys, private helpers, and guarded SECURITY DEFINER RPCs.
--   * Direct client writes to operational tables remain disabled.
--   * Creates no patient, queue, billing, payment, or clinical-document sample data.
--   * Does not alter existing frontend patient timeline, appointment, or consultation state.

begin;

-- ============================================================
-- DEPENDENCY GATE
-- ============================================================

do $$
begin
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

  if to_regclass('public.billing_accounts') is null then
    raise exception 'Migration 004 dependency missing: public.billing_accounts.';
  end if;

  if to_regclass('public.billing_charge_items') is null then
    raise exception 'Migration 004 dependency missing: public.billing_charge_items.';
  end if;

  if to_regclass('public.payment_transactions') is null then
    raise exception 'Migration 004 dependency missing: public.payment_transactions.';
  end if;

  if to_regclass('public.payment_clearances') is null then
    raise exception 'Migration 004 dependency missing: public.payment_clearances.';
  end if;

  if to_regclass('public.clinical_documents') is null then
    raise exception 'Migration 004 dependency missing: public.clinical_documents.';
  end if;

  if to_regclass('public.document_release_records') is null then
    raise exception 'Migration 004 dependency missing: public.document_release_records.';
  end if;

  if to_regclass('public.document_print_logs') is null then
    raise exception 'Migration 004 dependency missing: public.document_print_logs.';
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
-- IDEMPOTENCY KEYS
-- ============================================================

alter table public.patients
  add column if not exists registration_idempotency_key text;

alter table public.hospital_visits
  add column if not exists idempotency_key text;

alter table public.service_requests
  add column if not exists idempotency_key text;

alter table public.billing_charge_items
  add column if not exists idempotency_key text;

alter table public.payment_transactions
  add column if not exists idempotency_key text;

alter table public.clinical_documents
  add column if not exists idempotency_key text;

alter table public.document_release_records
  add column if not exists idempotency_key text;

alter table public.document_print_logs
  add column if not exists idempotency_key text;

create unique index if not exists patients_registration_idempotency_unique_idx
  on public.patients (registration_idempotency_key)
  where registration_idempotency_key is not null;

create unique index if not exists hospital_visits_idempotency_unique_idx
  on public.hospital_visits (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists service_requests_idempotency_unique_idx
  on public.service_requests (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists billing_charge_items_idempotency_unique_idx
  on public.billing_charge_items (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists payment_transactions_idempotency_unique_idx
  on public.payment_transactions (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists clinical_documents_idempotency_unique_idx
  on public.clinical_documents (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists document_release_records_idempotency_unique_idx
  on public.document_release_records (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists document_print_logs_idempotency_unique_idx
  on public.document_print_logs (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists document_release_records_document_copy_unique_idx
  on public.document_release_records (document_id, copy_number);

create unique index if not exists document_print_logs_document_copy_unique_idx
  on public.document_print_logs (document_id, copy_number);

create unique index if not exists billing_charge_items_active_source_unique_idx
  on public.billing_charge_items (
    billing_account_id,
    source_module,
    source_record_id
  )
  where source_record_id is not null
    and status = 'posted';

-- ============================================================
-- PRIVATE NUMBER SEQUENCES
-- ============================================================

create sequence if not exists app_private.patient_mrn_sequence;
create sequence if not exists app_private.visit_number_sequence;
create sequence if not exists app_private.service_request_number_sequence;
create sequence if not exists app_private.billing_number_sequence;
create sequence if not exists app_private.payment_number_sequence;
create sequence if not exists app_private.receipt_number_sequence;
create sequence if not exists app_private.document_number_sequence;
create sequence if not exists app_private.release_number_sequence;

revoke all on sequence app_private.patient_mrn_sequence from public, anon, authenticated;
revoke all on sequence app_private.visit_number_sequence from public, anon, authenticated;
revoke all on sequence app_private.service_request_number_sequence from public, anon, authenticated;
revoke all on sequence app_private.billing_number_sequence from public, anon, authenticated;
revoke all on sequence app_private.payment_number_sequence from public, anon, authenticated;
revoke all on sequence app_private.receipt_number_sequence from public, anon, authenticated;
revoke all on sequence app_private.document_number_sequence from public, anon, authenticated;
revoke all on sequence app_private.release_number_sequence from public, anon, authenticated;

-- ============================================================
-- PRIVATE GUARD AND UTILITY FUNCTIONS
-- ============================================================

create or replace function app_private.require_idempotency_key(
  p_value text
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_value text;
begin
  v_value := nullif(trim(p_value), '');

  if v_value is null
     or length(v_value) < 8
     or length(v_value) > 200
     or v_value !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$' then
    raise exception 'A valid idempotency key containing 8 to 200 safe characters is required.';
  end if;

  return v_value;
end;
$$;

create or replace function app_private.require_staff_permission(
  p_permission_code text,
  p_branch_id text default null
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();

  if v_actor is null then
    raise exception 'Authentication is required.';
  end if;

  if not app_private.current_staff_is_active() then
    raise exception 'The current GalenMed staff account is not active.';
  end if;

  if not app_private.is_system_admin()
     and not app_private.has_permission(lower(trim(p_permission_code))) then
    raise exception 'The current staff account lacks permission: %.', lower(trim(p_permission_code));
  end if;

  if p_branch_id is not null
     and not app_private.has_branch_access(p_branch_id) then
    raise exception 'The current staff account does not have access to branch %.', p_branch_id;
  end if;

  return v_actor;
end;
$$;

create or replace function app_private.next_operation_number(
  p_prefix text,
  p_sequence regclass,
  p_date_pattern text,
  p_width integer default 6
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sequence_value bigint;
  v_date_part text;
  v_prefix text;
begin
  v_prefix := upper(nullif(trim(p_prefix), ''));

  if v_prefix is null or v_prefix !~ '^[A-Z0-9-]+$' then
    raise exception 'A valid uppercase operation-number prefix is required.';
  end if;

  if p_width < 1 or p_width > 12 then
    raise exception 'Operation-number width must be between 1 and 12.';
  end if;

  v_sequence_value := nextval(p_sequence);
  v_date_part := case
    when nullif(trim(p_date_pattern), '') is null then null
    else to_char(current_date, p_date_pattern)
  end;

  return v_prefix
    || case when v_date_part is null then '-' else '-' || v_date_part || '-' end
    || lpad(v_sequence_value::text, p_width, '0');
end;
$$;

create or replace function app_private.append_hospital_operation_audit(
  p_actor_user_id uuid,
  p_action_code text,
  p_summary text,
  p_patient_id uuid default null,
  p_branch_id text default null,
  p_visit_id uuid default null,
  p_service_request_id uuid default null,
  p_billing_account_id uuid default null,
  p_document_id uuid default null,
  p_before_snapshot jsonb default null,
  p_after_snapshot jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_log_id bigint;
begin
  insert into public.hospital_operation_audit_logs (
    actor_user_id,
    patient_id,
    branch_id,
    visit_id,
    service_request_id,
    billing_account_id,
    document_id,
    action_code,
    summary,
    before_snapshot,
    after_snapshot,
    metadata
  )
  values (
    p_actor_user_id,
    p_patient_id,
    p_branch_id,
    p_visit_id,
    p_service_request_id,
    p_billing_account_id,
    p_document_id,
    lower(trim(p_action_code)),
    trim(p_summary),
    p_before_snapshot,
    p_after_snapshot,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

create or replace function app_private.recalculate_billing_account(
  p_billing_account_id uuid,
  p_actor uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.billing_accounts%rowtype;
  v_gross bigint;
  v_paid bigint;
  v_refunded bigint;
  v_net_due bigint;
  v_balance bigint;
  v_status text;
begin
  select *
  into v_account
  from public.billing_accounts
  where id = p_billing_account_id
  for update;

  if not found then
    raise exception 'Billing account was not found.';
  end if;

  select coalesce(sum(total_amount_centavos), 0)::bigint
  into v_gross
  from public.billing_charge_items
  where billing_account_id = p_billing_account_id
    and status = 'posted';

  select
    coalesce(sum(amount_centavos) filter (where status = 'posted'), 0)::bigint,
    coalesce(sum(amount_centavos) filter (where status = 'refunded'), 0)::bigint
  into v_paid, v_refunded
  from public.payment_transactions
  where billing_account_id = p_billing_account_id;

  v_net_due := greatest(
    v_gross
      - v_account.discount_amount_centavos
      - v_account.coverage_amount_centavos,
    0
  );

  v_balance := greatest(v_net_due - v_paid, 0);

  v_status := case
    when v_account.status = 'voided' then 'voided'
    when v_account.status = 'waived' then 'waived'
    when v_gross > 0 and v_balance = 0 then 'paid'
    when v_paid > 0 then 'partially_paid'
    when v_refunded > 0 then 'refunded'
    else 'open'
  end;

  update public.billing_accounts
  set
    status = v_status,
    gross_amount_centavos = v_gross,
    paid_amount_centavos = v_paid,
    refunded_amount_centavos = v_refunded,
    balance_amount_centavos = v_balance,
    updated_by = p_actor
  where id = p_billing_account_id
  returning * into v_account;

  return jsonb_build_object(
    'id', v_account.id,
    'billing_number', v_account.billing_number,
    'status', v_account.status,
    'gross_amount_centavos', v_account.gross_amount_centavos,
    'paid_amount_centavos', v_account.paid_amount_centavos,
    'refunded_amount_centavos', v_account.refunded_amount_centavos,
    'balance_amount_centavos', v_account.balance_amount_centavos
  );
end;
$$;

create or replace function app_private.recalculate_payment_clearance(
  p_service_request_id uuid,
  p_actor uuid
)
returns public.payment_clearances
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.service_requests%rowtype;
  v_account public.billing_accounts%rowtype;
  v_clearance public.payment_clearances%rowtype;
  v_required bigint;
  v_status text;
begin
  select *
  into v_request
  from public.service_requests
  where id = p_service_request_id;

  if not found then
    raise exception 'Service request was not found.';
  end if;

  select *
  into v_account
  from public.billing_accounts
  where visit_id = v_request.visit_id;

  if not found then
    raise exception 'Billing account was not found for the service request.';
  end if;

  select coalesce(sum(total_amount_centavos), 0)::bigint
  into v_required
  from public.billing_charge_items
  where service_request_id = p_service_request_id
    and status = 'posted';

  select *
  into v_clearance
  from public.payment_clearances
  where service_request_id = p_service_request_id
  for update;

  if not found then
    insert into public.payment_clearances (
      service_request_id,
      billing_account_id,
      patient_id,
      visit_id,
      branch_id,
      clearance_status,
      required_amount_centavos,
      cleared_amount_centavos,
      updated_by
    )
    values (
      v_request.id,
      v_account.id,
      v_request.patient_id,
      v_request.visit_id,
      v_request.branch_id,
      'pending',
      v_required,
      0,
      p_actor
    )
    returning * into v_clearance;

    return v_clearance;
  end if;

  v_status := v_clearance.clearance_status;

  if v_status = 'cleared'
     and v_clearance.cleared_amount_centavos < v_required then
    v_status := case
      when v_clearance.cleared_amount_centavos > 0 then 'partially_cleared'
      else 'pending'
    end;
  elsif v_status = 'partially_cleared'
        and v_clearance.cleared_amount_centavos = 0 then
    v_status := 'pending';
  end if;

  update public.payment_clearances
  set
    required_amount_centavos = v_required,
    cleared_amount_centavos = least(cleared_amount_centavos, v_required),
    clearance_status = case
      when v_status = 'cleared'
       and least(cleared_amount_centavos, v_required) < v_required then
        case
          when least(cleared_amount_centavos, v_required) > 0 then 'partially_cleared'
          else 'pending'
        end
      else v_status
    end,
    cleared_at = case
      when v_status = 'waived' then cleared_at
      when v_status = 'cleared' and least(cleared_amount_centavos, v_required) = v_required then cleared_at
      else null
    end,
    cleared_by = case
      when v_status = 'waived' then cleared_by
      when v_status = 'cleared' and least(cleared_amount_centavos, v_required) = v_required then cleared_by
      else null
    end,
    clearance_reason = case
      when v_status = 'waived' then clearance_reason
      when v_status = 'cleared' and least(cleared_amount_centavos, v_required) = v_required then clearance_reason
      when v_status in ('blocked', 'revoked') then clearance_reason
      else null
    end,
    updated_by = p_actor
  where id = v_clearance.id
  returning * into v_clearance;

  return v_clearance;
end;
$$;

revoke all on function app_private.require_idempotency_key(text) from public, anon, authenticated;
revoke all on function app_private.require_staff_permission(text, text) from public, anon, authenticated;
revoke all on function app_private.next_operation_number(text, regclass, text, integer) from public, anon, authenticated;
revoke all on function app_private.append_hospital_operation_audit(uuid, text, text, uuid, text, uuid, uuid, uuid, uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function app_private.recalculate_billing_account(uuid, uuid) from public, anon, authenticated;
revoke all on function app_private.recalculate_payment_clearance(uuid, uuid) from public, anon, authenticated;

-- ============================================================
-- SYSTEM ADMIN: SERVICE CATALOG
-- ============================================================

create or replace function public.admin_upsert_service_catalog_item(
  p_code text,
  p_name text,
  p_service_type text,
  p_department_code text,
  p_default_price_centavos bigint,
  p_branch_id text default null,
  p_description text default null,
  p_doctor_order_required boolean default false,
  p_allows_patient_request boolean default false,
  p_active boolean default true,
  p_catalog_item_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_department_id uuid;
  v_item public.service_catalog_items%rowtype;
  v_existing public.service_catalog_items%rowtype;
  v_action text;
begin
  v_actor := app_private.require_staff_permission('dashboard.view', p_branch_id);

  if not app_private.is_system_admin() then
    raise exception 'Only a SYSTEM_ADMIN can manage the hospital service catalog.';
  end if;

  if p_default_price_centavos < 0 then
    raise exception 'Default service price cannot be negative.';
  end if;

  select id
  into v_department_id
  from public.staff_departments
  where code = upper(trim(p_department_code))
    and active;

  if v_department_id is null then
    raise exception 'The requested active department was not found.';
  end if;

  if p_branch_id is not null
     and not exists (
       select 1
       from public.hospital_branches
       where id = p_branch_id
         and active
     ) then
    raise exception 'The requested active hospital branch was not found.';
  end if;

  if p_catalog_item_id is not null then
    select *
    into v_existing
    from public.service_catalog_items
    where id = p_catalog_item_id
    for update;
  else
    select *
    into v_existing
    from public.service_catalog_items
    where coalesce(branch_id, '*') = coalesce(p_branch_id, '*')
      and lower(code) = lower(trim(p_code))
    limit 1
    for update;
  end if;

  if found then
    update public.service_catalog_items
    set
      code = upper(trim(p_code)),
      name = trim(p_name),
      description = nullif(trim(p_description), ''),
      service_type = lower(trim(p_service_type)),
      department_id = v_department_id,
      branch_id = p_branch_id,
      default_price_centavos = p_default_price_centavos,
      doctor_order_required = p_doctor_order_required,
      allows_patient_request = p_allows_patient_request,
      active = p_active,
      updated_by = v_actor
    where id = v_existing.id
    returning * into v_item;

    v_action := 'service_catalog.updated';
  else
    insert into public.service_catalog_items (
      code,
      name,
      description,
      service_type,
      department_id,
      branch_id,
      default_price_centavos,
      doctor_order_required,
      allows_patient_request,
      active,
      created_by,
      updated_by
    )
    values (
      upper(trim(p_code)),
      trim(p_name),
      nullif(trim(p_description), ''),
      lower(trim(p_service_type)),
      v_department_id,
      p_branch_id,
      p_default_price_centavos,
      p_doctor_order_required,
      p_allows_patient_request,
      p_active,
      v_actor,
      v_actor
    )
    returning * into v_item;

    v_action := 'service_catalog.created';
  end if;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    v_action,
    format('Service catalog item %s was saved.', v_item.code),
    null,
    v_item.branch_id,
    null,
    null,
    null,
    null,
    case when v_existing.id is null then null else jsonb_build_object(
      'id', v_existing.id,
      'code', v_existing.code,
      'name', v_existing.name,
      'service_type', v_existing.service_type,
      'default_price_centavos', v_existing.default_price_centavos,
      'active', v_existing.active
    ) end,
    jsonb_build_object(
      'id', v_item.id,
      'code', v_item.code,
      'name', v_item.name,
      'service_type', v_item.service_type,
      'default_price_centavos', v_item.default_price_centavos,
      'active', v_item.active
    ),
    '{}'::jsonb
  );

  return jsonb_build_object(
    'id', v_item.id,
    'code', v_item.code,
    'name', v_item.name,
    'service_type', v_item.service_type,
    'department_id', v_item.department_id,
    'branch_id', v_item.branch_id,
    'default_price_centavos', v_item.default_price_centavos,
    'doctor_order_required', v_item.doctor_order_required,
    'allows_patient_request', v_item.allows_patient_request,
    'active', v_item.active
  );
end;
$$;

-- ============================================================
-- RECEPTION: PATIENT, VISIT, CHECK-IN, AND SERVICE REQUEST
-- ============================================================

create or replace function public.reception_register_patient(
  p_idempotency_key text,
  p_branch_id text,
  p_first_name text,
  p_last_name text,
  p_date_of_birth date,
  p_biological_sex text,
  p_address text,
  p_emergency_contact_name text,
  p_emergency_contact_number text,
  p_consent_acknowledged boolean,
  p_middle_name text default null,
  p_mobile_number text default null,
  p_email_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_patient public.patients%rowtype;
  v_duplicate public.patients%rowtype;
  v_mrn text;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(hashtextextended('patient-register:' || v_key, 0));
  v_actor := app_private.require_staff_permission('reception.patient.register', p_branch_id);

  select *
  into v_patient
  from public.patients
  where registration_idempotency_key = v_key;

  if found then
    return jsonb_build_object(
      'idempotent_replay', true,
      'patient_id', v_patient.id,
      'medical_record_number', v_patient.medical_record_number,
      'full_name', concat_ws(' ', v_patient.first_name, v_patient.middle_name, v_patient.last_name),
      'status', v_patient.status
    );
  end if;

  if not p_consent_acknowledged then
    raise exception 'Patient consent acknowledgement is required.';
  end if;

  if p_date_of_birth > current_date
     or p_date_of_birth < current_date - interval '130 years' then
    raise exception 'Patient date of birth is invalid or medically implausible.';
  end if;

  if not exists (
    select 1
    from public.hospital_branches
    where id = p_branch_id
      and active
  ) then
    raise exception 'The requested active hospital branch was not found.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'patient-identity:'
        || lower(trim(p_first_name)) || ':'
        || lower(trim(p_last_name)) || ':'
        || p_date_of_birth::text,
      0
    )
  );

  select *
  into v_duplicate
  from public.patients
  where lower(first_name) = lower(trim(p_first_name))
    and lower(last_name) = lower(trim(p_last_name))
    and date_of_birth = p_date_of_birth
    and status <> 'archived'
  order by created_at
  limit 1;

  if found then
    raise exception 'A possible duplicate patient already exists with MRN %.', v_duplicate.medical_record_number;
  end if;

  v_mrn := app_private.next_operation_number(
    'GM',
    'app_private.patient_mrn_sequence'::regclass,
    'YYYY',
    6
  );

  insert into public.patients (
    medical_record_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    biological_sex,
    mobile_number,
    email_address,
    branch_id,
    address,
    emergency_contact_name,
    emergency_contact_number,
    status,
    consent_acknowledged_at,
    consent_acknowledged_by,
    created_by,
    updated_by,
    registration_idempotency_key
  )
  values (
    v_mrn,
    trim(p_first_name),
    nullif(trim(p_middle_name), ''),
    trim(p_last_name),
    p_date_of_birth,
    lower(trim(p_biological_sex)),
    nullif(trim(p_mobile_number), ''),
    nullif(lower(trim(p_email_address)), ''),
    p_branch_id,
    trim(p_address),
    trim(p_emergency_contact_name),
    trim(p_emergency_contact_number),
    'active',
    now(),
    v_actor,
    v_actor,
    v_actor,
    v_key
  )
  returning * into v_patient;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'patient.registered',
    format('Patient %s was registered.', v_patient.medical_record_number),
    v_patient.id,
    v_patient.branch_id,
    null,
    null,
    null,
    null,
    null,
    jsonb_build_object(
      'patient_id', v_patient.id,
      'medical_record_number', v_patient.medical_record_number,
      'status', v_patient.status
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'patient_id', v_patient.id,
    'medical_record_number', v_patient.medical_record_number,
    'full_name', concat_ws(' ', v_patient.first_name, v_patient.middle_name, v_patient.last_name),
    'status', v_patient.status
  );
end;
$$;

create or replace function public.reception_create_visit(
  p_idempotency_key text,
  p_patient_id uuid,
  p_branch_id text,
  p_arrival_mode text,
  p_initial_service_type text,
  p_chief_concern text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_patient public.patients%rowtype;
  v_visit public.hospital_visits%rowtype;
  v_billing public.billing_accounts%rowtype;
  v_visit_number text;
  v_billing_number text;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(hashtextextended('visit-create:' || v_key, 0));
  v_actor := app_private.require_staff_permission('reception.visit.create', p_branch_id);

  select *
  into v_visit
  from public.hospital_visits
  where idempotency_key = v_key;

  if found then
    select *
    into v_billing
    from public.billing_accounts
    where visit_id = v_visit.id;

    return jsonb_build_object(
      'idempotent_replay', true,
      'visit_id', v_visit.id,
      'visit_number', v_visit.visit_number,
      'visit_status', v_visit.status,
      'billing_account_id', v_billing.id,
      'billing_number', v_billing.billing_number
    );
  end if;

  if not exists (
    select 1
    from public.hospital_branches
    where id = p_branch_id
      and active
  ) then
    raise exception 'The requested active hospital branch was not found.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('active-visit:' || p_patient_id::text || ':' || p_branch_id, 0)
  );

  select *
  into v_patient
  from public.patients
  where id = p_patient_id;

  if not found then
    raise exception 'Patient was not found.';
  end if;

  if v_patient.status <> 'active' then
    raise exception 'Only an active patient can receive a new hospital visit.';
  end if;

  if exists (
    select 1
    from public.hospital_visits
    where patient_id = p_patient_id
      and branch_id = p_branch_id
      and status in ('registered', 'checked_in', 'active')
  ) then
    raise exception 'The patient already has an active visit at this branch.';
  end if;

  v_visit_number := app_private.next_operation_number(
    'VIS',
    'app_private.visit_number_sequence'::regclass,
    'YYYYMMDD',
    6
  );

  v_billing_number := app_private.next_operation_number(
    'BILL',
    'app_private.billing_number_sequence'::regclass,
    'YYYYMMDD',
    6
  );

  insert into public.hospital_visits (
    visit_number,
    patient_id,
    branch_id,
    arrival_mode,
    initial_service_type,
    chief_concern,
    status,
    registered_by,
    idempotency_key
  )
  values (
    v_visit_number,
    p_patient_id,
    p_branch_id,
    lower(trim(p_arrival_mode)),
    lower(trim(p_initial_service_type)),
    nullif(trim(p_chief_concern), ''),
    'registered',
    v_actor,
    v_key
  )
  returning * into v_visit;

  insert into public.billing_accounts (
    billing_number,
    patient_id,
    visit_id,
    branch_id,
    status,
    opened_by,
    updated_by
  )
  values (
    v_billing_number,
    v_visit.patient_id,
    v_visit.id,
    v_visit.branch_id,
    'open',
    v_actor,
    v_actor
  )
  returning * into v_billing;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'visit.created',
    format('Hospital visit %s was created.', v_visit.visit_number),
    v_visit.patient_id,
    v_visit.branch_id,
    v_visit.id,
    null,
    v_billing.id,
    null,
    null,
    jsonb_build_object(
      'visit_id', v_visit.id,
      'visit_number', v_visit.visit_number,
      'visit_status', v_visit.status,
      'billing_account_id', v_billing.id,
      'billing_number', v_billing.billing_number
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'visit_id', v_visit.id,
    'visit_number', v_visit.visit_number,
    'visit_status', v_visit.status,
    'billing_account_id', v_billing.id,
    'billing_number', v_billing.billing_number
  );
end;
$$;

create or replace function public.reception_check_in_visit(
  p_visit_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_visit public.hospital_visits%rowtype;
  v_before jsonb;
begin
  select *
  into v_visit
  from public.hospital_visits
  where id = p_visit_id
  for update;

  if not found then
    raise exception 'Hospital visit was not found.';
  end if;

  v_actor := app_private.require_staff_permission('reception.visit.create', v_visit.branch_id);

  if v_visit.status in ('checked_in', 'active') then
    return jsonb_build_object(
      'visit_id', v_visit.id,
      'visit_number', v_visit.visit_number,
      'status', v_visit.status,
      'idempotent_replay', true
    );
  end if;

  if v_visit.status <> 'registered' then
    raise exception 'Only a registered visit can be checked in.';
  end if;

  v_before := jsonb_build_object(
    'status', v_visit.status,
    'checked_in_at', v_visit.checked_in_at
  );

  update public.hospital_visits
  set
    status = 'checked_in',
    checked_in_at = coalesce(checked_in_at, now())
  where id = v_visit.id
  returning * into v_visit;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'visit.checked_in',
    format('Hospital visit %s was checked in.', v_visit.visit_number),
    v_visit.patient_id,
    v_visit.branch_id,
    v_visit.id,
    null,
    null,
    null,
    v_before,
    jsonb_build_object(
      'status', v_visit.status,
      'checked_in_at', v_visit.checked_in_at
    ),
    '{}'::jsonb
  );

  return jsonb_build_object(
    'visit_id', v_visit.id,
    'visit_number', v_visit.visit_number,
    'status', v_visit.status,
    'idempotent_replay', false
  );
end;
$$;

create or replace function public.reception_create_service_request(
  p_idempotency_key text,
  p_visit_id uuid,
  p_service_catalog_item_id uuid,
  p_priority text default 'routine',
  p_assigned_staff_id uuid default null,
  p_doctor_order_reference text default null,
  p_request_notes text default null,
  p_create_queue boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_visit public.hospital_visits%rowtype;
  v_catalog public.service_catalog_items%rowtype;
  v_request public.service_requests%rowtype;
  v_queue public.queue_entries%rowtype;
  v_billing public.billing_accounts%rowtype;
  v_clearance public.payment_clearances%rowtype;
  v_branch_code text;
  v_department_code text;
  v_queue_sequence integer;
  v_queue_number text;
  v_request_number text;
  v_billing_number text;
  v_queue_created boolean := false;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(hashtextextended('service-request:' || v_key, 0));

  select *
  into v_request
  from public.service_requests
  where idempotency_key = v_key;

  if found then
    select * into v_queue from public.queue_entries where service_request_id = v_request.id;
    select * into v_billing from public.billing_accounts where visit_id = v_request.visit_id;
    select * into v_clearance from public.payment_clearances where service_request_id = v_request.id;

    return jsonb_build_object(
      'idempotent_replay', true,
      'service_request_id', v_request.id,
      'request_number', v_request.request_number,
      'status', v_request.status,
      'queue_entry_id', v_queue.id,
      'queue_number', v_queue.queue_number,
      'billing_account_id', v_billing.id,
      'billing_number', v_billing.billing_number,
      'payment_clearance_id', v_clearance.id,
      'required_amount_centavos', v_clearance.required_amount_centavos
    );
  end if;

  select *
  into v_visit
  from public.hospital_visits
  where id = p_visit_id
  for update;

  if not found then
    raise exception 'Hospital visit was not found.';
  end if;

  v_actor := app_private.require_staff_permission('reception.service_request.create', v_visit.branch_id);

  if v_visit.status not in ('registered', 'checked_in', 'active') then
    raise exception 'A service request cannot be added to the current visit status.';
  end if;

  select *
  into v_catalog
  from public.service_catalog_items
  where id = p_service_catalog_item_id
    and active
    and (branch_id is null or branch_id = v_visit.branch_id);

  if not found then
    raise exception 'The requested active service catalog item was not found for this branch.';
  end if;

  if v_catalog.doctor_order_required
     and nullif(trim(p_doctor_order_reference), '') is null then
    raise exception 'A doctor-order reference is required for this service.';
  end if;

  if p_assigned_staff_id is not null
     and not exists (
       select 1
       from public.staff_profiles sp
       join public.staff_branch_assignments sba
         on sba.staff_id = sp.id
        and sba.active
        and sba.branch_id = v_visit.branch_id
       join public.staff_department_assignments sda
         on sda.staff_id = sp.id
        and sda.active
        and sda.department_id = v_catalog.department_id
       where sp.id = p_assigned_staff_id
         and sp.account_status = 'active'
     ) then
    raise exception 'Assigned staff is not active in the selected branch and department.';
  end if;

  select code
  into v_branch_code
  from public.hospital_branches
  where id = v_visit.branch_id
    and active;

  select code
  into v_department_code
  from public.staff_departments
  where id = v_catalog.department_id
    and active;

  if v_branch_code is null or v_department_code is null then
    raise exception 'Branch or department configuration is unavailable.';
  end if;

  select *
  into v_billing
  from public.billing_accounts
  where visit_id = v_visit.id
  for update;

  if not found then
    v_billing_number := app_private.next_operation_number(
      'BILL',
      'app_private.billing_number_sequence'::regclass,
      'YYYYMMDD',
      6
    );

    insert into public.billing_accounts (
      billing_number,
      patient_id,
      visit_id,
      branch_id,
      status,
      opened_by,
      updated_by
    )
    values (
      v_billing_number,
      v_visit.patient_id,
      v_visit.id,
      v_visit.branch_id,
      'open',
      v_actor,
      v_actor
    )
    returning * into v_billing;
  end if;

  v_request_number := app_private.next_operation_number(
    'SR',
    'app_private.service_request_number_sequence'::regclass,
    'YYYYMMDD',
    6
  );

  insert into public.service_requests (
    request_number,
    visit_id,
    patient_id,
    branch_id,
    service_catalog_item_id,
    service_type,
    request_source,
    requested_by_staff_id,
    assigned_department_id,
    assigned_staff_id,
    priority,
    doctor_order_required,
    doctor_order_reference,
    request_notes,
    status,
    queued_at,
    idempotency_key
  )
  values (
    v_request_number,
    v_visit.id,
    v_visit.patient_id,
    v_visit.branch_id,
    v_catalog.id,
    v_catalog.service_type,
    'reception',
    v_actor,
    v_catalog.department_id,
    p_assigned_staff_id,
    lower(trim(p_priority)),
    v_catalog.doctor_order_required,
    nullif(trim(p_doctor_order_reference), ''),
    nullif(trim(p_request_notes), ''),
    case when p_create_queue then 'queued' else 'requested' end,
    case when p_create_queue then now() else null end,
    v_key
  )
  returning * into v_request;

  if p_create_queue then
    perform pg_advisory_xact_lock(
      hashtextextended(
        v_visit.branch_id || ':' || v_catalog.department_id::text || ':' || current_date::text,
        0
      )
    );

    select coalesce(max(queue_sequence), 0) + 1
    into v_queue_sequence
    from public.queue_entries
    where branch_id = v_visit.branch_id
      and department_id = v_catalog.department_id
      and queue_date = current_date;

    v_queue_number := upper(
      format(
        'Q-%s-%s-%s-%s',
        v_branch_code,
        v_department_code,
        to_char(current_date, 'YYYYMMDD'),
        lpad(v_queue_sequence::text, 4, '0')
      )
    );

    insert into public.queue_entries (
      queue_number,
      queue_date,
      queue_sequence,
      service_request_id,
      visit_id,
      patient_id,
      branch_id,
      department_id,
      assigned_staff_id,
      priority,
      status,
      created_by
    )
    values (
      v_queue_number,
      current_date,
      v_queue_sequence,
      v_request.id,
      v_request.visit_id,
      v_request.patient_id,
      v_request.branch_id,
      v_request.assigned_department_id,
      v_request.assigned_staff_id,
      v_request.priority,
      'waiting',
      v_actor
    )
    returning * into v_queue;

    v_queue_created := true;
  end if;

  insert into public.billing_charge_items (
    billing_account_id,
    service_request_id,
    source_module,
    source_record_id,
    description,
    quantity,
    unit_amount_centavos,
    status,
    posted_by,
    idempotency_key
  )
  values (
    v_billing.id,
    v_request.id,
    'service_request',
    v_request.id::text,
    v_catalog.name,
    1,
    v_catalog.default_price_centavos,
    'posted',
    v_actor,
    v_key || ':charge'
  );

  perform app_private.recalculate_billing_account(v_billing.id, v_actor);
  v_clearance := app_private.recalculate_payment_clearance(v_request.id, v_actor);

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'service_request.created',
    format('Service request %s was created for %s.', v_request.request_number, v_catalog.name),
    v_request.patient_id,
    v_request.branch_id,
    v_request.visit_id,
    v_request.id,
    v_billing.id,
    null,
    null,
    jsonb_build_object(
      'service_request_id', v_request.id,
      'request_number', v_request.request_number,
      'service_type', v_request.service_type,
      'status', v_request.status,
      'queue_number', v_queue.queue_number,
      'required_amount_centavos', v_clearance.required_amount_centavos
    ),
    jsonb_build_object(
      'idempotency_key', v_key,
      'queue_created', v_queue_created
    )
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'service_request_id', v_request.id,
    'request_number', v_request.request_number,
    'status', v_request.status,
    'service_type', v_request.service_type,
    'queue_entry_id', v_queue.id,
    'queue_number', v_queue.queue_number,
    'billing_account_id', v_billing.id,
    'billing_number', v_billing.billing_number,
    'payment_clearance_id', v_clearance.id,
    'required_amount_centavos', v_clearance.required_amount_centavos
  );
end;
$$;

-- ============================================================
-- DEPARTMENT QUEUE STATE MACHINE
-- ============================================================

create or replace function public.department_advance_queue_entry(
  p_queue_entry_id uuid,
  p_action text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_queue public.queue_entries%rowtype;
  v_request public.service_requests%rowtype;
  v_department_code text;
  v_action text;
  v_authorized boolean;
  v_before jsonb;
begin
  v_actor := auth.uid();

  if v_actor is null or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  select *
  into v_queue
  from public.queue_entries
  where id = p_queue_entry_id
  for update;

  if not found then
    raise exception 'Queue entry was not found.';
  end if;

  if not app_private.has_branch_access(v_queue.branch_id) then
    raise exception 'The current staff account has no access to this queue branch.';
  end if;

  select *
  into v_request
  from public.service_requests
  where id = v_queue.service_request_id
  for update;

  select code
  into v_department_code
  from public.staff_departments
  where id = v_queue.department_id;

  v_authorized :=
    app_private.is_system_admin()
    or app_private.has_permission('reception.queue.manage')
    or (
      v_department_code = 'LABORATORY'
      and app_private.has_permission('laboratory.queue.view')
    )
    or (
      v_request.service_type = 'consultation'
      and v_queue.assigned_staff_id = v_actor
      and app_private.has_permission('doctor.queue.view')
    );

  if not v_authorized then
    raise exception 'The current staff account cannot manage this queue entry.';
  end if;

  v_action := lower(trim(p_action));
  v_before := jsonb_build_object(
    'queue_status', v_queue.status,
    'service_request_status', v_request.status
  );

  if v_action = 'call' then
    if v_queue.status = 'called' then
      return jsonb_build_object('idempotent_replay', true, 'queue_entry_id', v_queue.id, 'status', v_queue.status);
    end if;

    if v_queue.status <> 'waiting' then
      raise exception 'Only a waiting queue entry can be called.';
    end if;

    update public.queue_entries
    set status = 'called', called_at = coalesce(called_at, now())
    where id = v_queue.id
    returning * into v_queue;

  elsif v_action = 'start' then
    if v_queue.status = 'in_service' then
      return jsonb_build_object('idempotent_replay', true, 'queue_entry_id', v_queue.id, 'status', v_queue.status);
    end if;

    if v_queue.status not in ('waiting', 'called') then
      raise exception 'Only a waiting or called queue entry can be started.';
    end if;

    update public.queue_entries
    set
      status = 'in_service',
      called_at = coalesce(called_at, now()),
      service_started_at = coalesce(service_started_at, now())
    where id = v_queue.id
    returning * into v_queue;

    update public.service_requests
    set status = 'in_progress', started_at = coalesce(started_at, now())
    where id = v_request.id
    returning * into v_request;

    update public.hospital_visits
    set
      status = 'active',
      checked_in_at = coalesce(checked_in_at, now())
    where id = v_request.visit_id
      and status in ('registered', 'checked_in');

  elsif v_action = 'complete' then
    if v_queue.status = 'completed' then
      return jsonb_build_object('idempotent_replay', true, 'queue_entry_id', v_queue.id, 'status', v_queue.status);
    end if;

    if v_queue.status <> 'in_service' then
      raise exception 'Only an in-service queue entry can be completed.';
    end if;

    update public.queue_entries
    set status = 'completed', service_completed_at = coalesce(service_completed_at, now())
    where id = v_queue.id
    returning * into v_queue;

    update public.service_requests
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = v_request.id
    returning * into v_request;

  elsif v_action = 'no_show' then
    if v_queue.status = 'no_show' then
      return jsonb_build_object('idempotent_replay', true, 'queue_entry_id', v_queue.id, 'status', v_queue.status);
    end if;

    if v_queue.status not in ('waiting', 'called') then
      raise exception 'Only a waiting or called queue entry can be marked no-show.';
    end if;

    update public.queue_entries
    set status = 'no_show', no_show_at = coalesce(no_show_at, now())
    where id = v_queue.id
    returning * into v_queue;

    update public.service_requests
    set status = 'rejected'
    where id = v_request.id
    returning * into v_request;

  elsif v_action = 'cancel' then
    if v_queue.status = 'cancelled' then
      return jsonb_build_object('idempotent_replay', true, 'queue_entry_id', v_queue.id, 'status', v_queue.status);
    end if;

    if v_queue.status not in ('waiting', 'called', 'in_service') then
      raise exception 'The queue entry cannot be cancelled in its current status.';
    end if;

    if nullif(trim(p_reason), '') is null then
      raise exception 'A cancellation reason is required.';
    end if;

    update public.queue_entries
    set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now())
    where id = v_queue.id
    returning * into v_queue;

    update public.service_requests
    set
      status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now()),
      cancelled_by = v_actor,
      cancellation_reason = trim(p_reason)
    where id = v_request.id
    returning * into v_request;

  else
    raise exception 'Unsupported queue action. Use call, start, complete, no_show, or cancel.';
  end if;

  if v_action in ('complete', 'no_show', 'cancel')
     and not exists (
       select 1
       from public.service_requests
       where visit_id = v_request.visit_id
         and status not in ('completed', 'cancelled', 'rejected')
     ) then
    update public.hospital_visits
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = v_request.visit_id
      and status <> 'cancelled';
  end if;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'queue.' || v_action,
    format('Queue entry %s was updated using action %s.', v_queue.queue_number, v_action),
    v_queue.patient_id,
    v_queue.branch_id,
    v_queue.visit_id,
    v_queue.service_request_id,
    null,
    null,
    v_before,
    jsonb_build_object(
      'queue_status', v_queue.status,
      'service_request_status', v_request.status
    ),
    jsonb_build_object('reason', nullif(trim(p_reason), ''))
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'queue_entry_id', v_queue.id,
    'queue_number', v_queue.queue_number,
    'queue_status', v_queue.status,
    'service_request_status', v_request.status
  );
end;
$$;

-- ============================================================
-- CASHIER: CHARGES, PAYMENTS, AND CLEARANCE
-- ============================================================

create or replace function public.cashier_post_charge(
  p_idempotency_key text,
  p_billing_account_id uuid,
  p_description text,
  p_quantity numeric,
  p_unit_amount_centavos bigint,
  p_service_request_id uuid default null,
  p_source_module text default 'cashier',
  p_source_record_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_account public.billing_accounts%rowtype;
  v_charge public.billing_charge_items%rowtype;
  v_billing_summary jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(hashtextextended('billing-charge:' || v_key, 0));

  select *
  into v_charge
  from public.billing_charge_items
  where idempotency_key = v_key;

  if found then
    return jsonb_build_object(
      'idempotent_replay', true,
      'charge_item_id', v_charge.id,
      'billing_account_id', v_charge.billing_account_id,
      'total_amount_centavos', v_charge.total_amount_centavos
    );
  end if;

  select *
  into v_account
  from public.billing_accounts
  where id = p_billing_account_id
  for update;

  if not found then
    raise exception 'Billing account was not found.';
  end if;

  v_actor := app_private.require_staff_permission('cashier.payment.record', v_account.branch_id);

  if v_account.status in ('voided', 'refunded') then
    raise exception 'Charges cannot be posted to the current billing-account status.';
  end if;

  if p_quantity <= 0 or p_unit_amount_centavos < 0 then
    raise exception 'Charge quantity and unit amount are invalid.';
  end if;

  insert into public.billing_charge_items (
    billing_account_id,
    service_request_id,
    source_module,
    source_record_id,
    description,
    quantity,
    unit_amount_centavos,
    status,
    posted_by,
    idempotency_key
  )
  values (
    v_account.id,
    p_service_request_id,
    lower(trim(p_source_module)),
    nullif(trim(p_source_record_id), ''),
    trim(p_description),
    p_quantity,
    p_unit_amount_centavos,
    'posted',
    v_actor,
    v_key
  )
  returning * into v_charge;

  v_billing_summary := app_private.recalculate_billing_account(v_account.id, v_actor);

  if p_service_request_id is not null then
    perform app_private.recalculate_payment_clearance(p_service_request_id, v_actor);
  end if;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'billing.charge_posted',
    format('A billing charge was posted to %s.', v_account.billing_number),
    v_account.patient_id,
    v_account.branch_id,
    v_account.visit_id,
    p_service_request_id,
    v_account.id,
    null,
    null,
    jsonb_build_object(
      'charge_item_id', v_charge.id,
      'description', v_charge.description,
      'quantity', v_charge.quantity,
      'unit_amount_centavos', v_charge.unit_amount_centavos,
      'total_amount_centavos', v_charge.total_amount_centavos
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'charge_item_id', v_charge.id,
    'billing_account_id', v_account.id,
    'total_amount_centavos', v_charge.total_amount_centavos,
    'billing', v_billing_summary
  );
end;
$$;

create or replace function public.cashier_record_payment(
  p_idempotency_key text,
  p_billing_account_id uuid,
  p_amount_centavos bigint,
  p_payment_method text,
  p_external_reference text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_account public.billing_accounts%rowtype;
  v_payment public.payment_transactions%rowtype;
  v_payment_number text;
  v_receipt_number text;
  v_billing_summary jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(hashtextextended('cashier-payment:' || v_key, 0));

  select *
  into v_payment
  from public.payment_transactions
  where idempotency_key = v_key;

  if found then
    return jsonb_build_object(
      'idempotent_replay', true,
      'payment_id', v_payment.id,
      'payment_number', v_payment.payment_number,
      'official_receipt_number', v_payment.official_receipt_number,
      'amount_centavos', v_payment.amount_centavos,
      'status', v_payment.status
    );
  end if;

  select *
  into v_account
  from public.billing_accounts
  where id = p_billing_account_id
  for update;

  if not found then
    raise exception 'Billing account was not found.';
  end if;

  v_actor := app_private.require_staff_permission('cashier.payment.record', v_account.branch_id);

  perform app_private.recalculate_billing_account(v_account.id, v_actor);

  select *
  into v_account
  from public.billing_accounts
  where id = p_billing_account_id
  for update;

  if v_account.status in ('voided', 'refunded') then
    raise exception 'Payment cannot be posted to the current billing-account status.';
  end if;

  if p_amount_centavos <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  if p_amount_centavos > v_account.balance_amount_centavos then
    raise exception 'Payment amount exceeds the current patient balance.';
  end if;

  v_payment_number := app_private.next_operation_number(
    'PAY',
    'app_private.payment_number_sequence'::regclass,
    'YYYYMMDD',
    6
  );

  v_receipt_number := app_private.next_operation_number(
    'GM-OR',
    'app_private.receipt_number_sequence'::regclass,
    'YYYYMMDD',
    6
  );

  insert into public.payment_transactions (
    payment_number,
    billing_account_id,
    patient_id,
    visit_id,
    branch_id,
    amount_centavos,
    payment_method,
    status,
    external_reference,
    official_receipt_number,
    posted_by,
    metadata,
    idempotency_key
  )
  values (
    v_payment_number,
    v_account.id,
    v_account.patient_id,
    v_account.visit_id,
    v_account.branch_id,
    p_amount_centavos,
    lower(trim(p_payment_method)),
    'posted',
    nullif(trim(p_external_reference), ''),
    v_receipt_number,
    v_actor,
    coalesce(p_metadata, '{}'::jsonb),
    v_key
  )
  returning * into v_payment;

  v_billing_summary := app_private.recalculate_billing_account(v_account.id, v_actor);

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'cashier.payment_posted',
    format('Payment %s was posted to billing account %s.', v_payment.payment_number, v_account.billing_number),
    v_account.patient_id,
    v_account.branch_id,
    v_account.visit_id,
    null,
    v_account.id,
    null,
    null,
    jsonb_build_object(
      'payment_id', v_payment.id,
      'payment_number', v_payment.payment_number,
      'official_receipt_number', v_payment.official_receipt_number,
      'amount_centavos', v_payment.amount_centavos,
      'payment_method', v_payment.payment_method,
      'status', v_payment.status
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'payment_id', v_payment.id,
    'payment_number', v_payment.payment_number,
    'official_receipt_number', v_payment.official_receipt_number,
    'amount_centavos', v_payment.amount_centavos,
    'status', v_payment.status,
    'billing', v_billing_summary
  );
end;
$$;

create or replace function public.cashier_set_payment_clearance(
  p_service_request_id uuid,
  p_clearance_status text,
  p_cleared_amount_centavos bigint,
  p_clearance_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_clearance public.payment_clearances%rowtype;
  v_account public.billing_accounts%rowtype;
  v_status text;
  v_effective_amount bigint;
  v_total_paid bigint;
  v_other_allocated bigint;
  v_available bigint;
  v_before jsonb;
begin
  select *
  into v_clearance
  from public.payment_clearances
  where service_request_id = p_service_request_id
  for update;

  if not found then
    raise exception 'Payment clearance was not found for the service request.';
  end if;

  select *
  into v_account
  from public.billing_accounts
  where id = v_clearance.billing_account_id
  for update;

  v_actor := app_private.require_staff_permission('cashier.clearance.manage', v_clearance.branch_id);
  v_status := lower(trim(p_clearance_status));

  if v_status not in ('pending', 'partially_cleared', 'cleared', 'waived', 'blocked', 'revoked') then
    raise exception 'Unsupported payment-clearance status.';
  end if;

  if nullif(trim(p_clearance_reason), '') is null then
    raise exception 'A payment-clearance reason is required.';
  end if;

  select coalesce(sum(amount_centavos), 0)::bigint
  into v_total_paid
  from public.payment_transactions
  where billing_account_id = v_account.id
    and status = 'posted';

  select coalesce(sum(cleared_amount_centavos), 0)::bigint
  into v_other_allocated
  from public.payment_clearances
  where billing_account_id = v_account.id
    and id <> v_clearance.id
    and clearance_status in ('partially_cleared', 'cleared');

  v_available := greatest(v_total_paid - v_other_allocated, 0);

  if v_status = 'cleared' then
    if v_clearance.required_amount_centavos <= 0 then
      raise exception 'A zero-amount request must be waived rather than marked cleared.';
    end if;

    v_effective_amount := v_clearance.required_amount_centavos;

    if v_effective_amount > v_available then
      raise exception 'Posted payments are insufficient to clear this service request.';
    end if;
  elsif v_status = 'partially_cleared' then
    v_effective_amount := p_cleared_amount_centavos;

    if v_effective_amount <= 0
       or v_effective_amount >= v_clearance.required_amount_centavos then
      raise exception 'Partial clearance must be greater than zero and less than the required amount.';
    end if;

    if v_effective_amount > v_available then
      raise exception 'Posted payments are insufficient for the requested partial clearance.';
    end if;
  elsif v_status = 'waived' then
    if not app_private.is_system_admin() then
      raise exception 'Only a SYSTEM_ADMIN can waive payment clearance.';
    end if;

    v_effective_amount := 0;
  else
    v_effective_amount := 0;
  end if;

  v_before := jsonb_build_object(
    'clearance_status', v_clearance.clearance_status,
    'required_amount_centavos', v_clearance.required_amount_centavos,
    'cleared_amount_centavos', v_clearance.cleared_amount_centavos
  );

  update public.payment_clearances
  set
    clearance_status = v_status,
    cleared_amount_centavos = v_effective_amount,
    cleared_by = case
      when v_status in ('cleared', 'waived') then v_actor
      else null
    end,
    cleared_at = case
      when v_status in ('cleared', 'waived') then now()
      else null
    end,
    clearance_reason = trim(p_clearance_reason),
    override_authorized_by = case
      when v_status = 'waived' then v_actor
      else null
    end,
    updated_by = v_actor
  where id = v_clearance.id
  returning * into v_clearance;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'cashier.clearance_updated',
    format('Payment clearance for service request %s was changed to %s.', p_service_request_id, v_status),
    v_clearance.patient_id,
    v_clearance.branch_id,
    v_clearance.visit_id,
    v_clearance.service_request_id,
    v_clearance.billing_account_id,
    null,
    v_before,
    jsonb_build_object(
      'clearance_status', v_clearance.clearance_status,
      'required_amount_centavos', v_clearance.required_amount_centavos,
      'cleared_amount_centavos', v_clearance.cleared_amount_centavos,
      'cleared_at', v_clearance.cleared_at
    ),
    '{}'::jsonb
  );

  return jsonb_build_object(
    'payment_clearance_id', v_clearance.id,
    'service_request_id', v_clearance.service_request_id,
    'clearance_status', v_clearance.clearance_status,
    'required_amount_centavos', v_clearance.required_amount_centavos,
    'cleared_amount_centavos', v_clearance.cleared_amount_centavos,
    'cleared_at', v_clearance.cleared_at
  );
end;
$$;

-- ============================================================
-- CLINICAL DOCUMENT DRAFT, REVIEW, AND FINALIZATION
-- ============================================================

create or replace function public.clinical_register_document(
  p_idempotency_key text,
  p_service_request_id uuid,
  p_document_type text,
  p_title text,
  p_source_module text,
  p_source_record_id text default null,
  p_sensitivity text default 'sensitive',
  p_payment_required boolean default true,
  p_storage_path text default null,
  p_content_hash text default null,
  p_metadata jsonb default '{}'::jsonb
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
  v_document public.clinical_documents%rowtype;
  v_document_number text;
  v_version integer;
  v_type text;
  v_authorized boolean := false;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(hashtextextended('clinical-document:' || v_key, 0));
  v_actor := auth.uid();

  if v_actor is null or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  select *
  into v_document
  from public.clinical_documents
  where idempotency_key = v_key;

  if found then
    return jsonb_build_object(
      'idempotent_replay', true,
      'document_id', v_document.id,
      'document_number', v_document.document_number,
      'document_type', v_document.document_type,
      'status', v_document.status,
      'version_number', v_document.version_number
    );
  end if;

  select *
  into v_request
  from public.service_requests
  where id = p_service_request_id;

  if not found then
    raise exception 'Service request was not found.';
  end if;

  if not app_private.has_branch_access(v_request.branch_id) then
    raise exception 'The current staff account has no access to this branch.';
  end if;

  v_type := lower(trim(p_document_type));

  v_authorized := case
    when v_type in ('prescription', 'consultation_summary', 'diagnosis_summary', 'medical_certificate') then
      app_private.has_permission('doctor.consultation.manage_assigned')
      and v_request.service_type = 'consultation'
      and v_request.assigned_staff_id = v_actor
    when v_type = 'laboratory_result' then
      app_private.has_permission('laboratory.result.enter')
      and v_request.service_type = 'laboratory'
    when v_type = 'official_receipt' then
      app_private.has_permission('cashier.receipt.issue')
    when v_type in ('radiology_report', 'other') then
      app_private.is_system_admin()
    else false
  end;

  if not v_authorized and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot create this clinical-document type.';
  end if;

  v_document_number := app_private.next_operation_number(
    'DOC',
    'app_private.document_number_sequence'::regclass,
    'YYYYMMDD',
    6
  );

  if nullif(trim(p_source_record_id), '') is null then
    v_version := 1;
  else
    perform pg_advisory_xact_lock(
      hashtextextended(
        'clinical-version:' || lower(trim(p_source_module)) || ':' || trim(p_source_record_id),
        0
      )
    );

    select coalesce(max(version_number), 0) + 1
    into v_version
    from public.clinical_documents
    where source_module = lower(trim(p_source_module))
      and source_record_id = trim(p_source_record_id);
  end if;

  insert into public.clinical_documents (
    document_number,
    patient_id,
    visit_id,
    service_request_id,
    branch_id,
    document_type,
    title,
    source_module,
    source_record_id,
    version_number,
    status,
    sensitivity,
    payment_required,
    storage_path,
    content_hash,
    metadata,
    created_by,
    idempotency_key
  )
  values (
    v_document_number,
    v_request.patient_id,
    v_request.visit_id,
    v_request.id,
    v_request.branch_id,
    v_type,
    trim(p_title),
    lower(trim(p_source_module)),
    nullif(trim(p_source_record_id), ''),
    v_version,
    'draft',
    lower(trim(p_sensitivity)),
    p_payment_required,
    nullif(trim(p_storage_path), ''),
    nullif(trim(p_content_hash), ''),
    coalesce(p_metadata, '{}'::jsonb),
    v_actor,
    v_key
  )
  returning * into v_document;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'clinical_document.created',
    format('Clinical document %s was created as a draft.', v_document.document_number),
    v_document.patient_id,
    v_document.branch_id,
    v_document.visit_id,
    v_document.service_request_id,
    null,
    v_document.id,
    null,
    jsonb_build_object(
      'document_id', v_document.id,
      'document_number', v_document.document_number,
      'document_type', v_document.document_type,
      'status', v_document.status,
      'version_number', v_document.version_number
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'document_id', v_document.id,
    'document_number', v_document.document_number,
    'document_type', v_document.document_type,
    'status', v_document.status,
    'version_number', v_document.version_number
  );
end;
$$;

create or replace function public.clinical_submit_document_for_review(
  p_document_id uuid,
  p_metadata_patch jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_document public.clinical_documents%rowtype;
  v_before jsonb;
begin
  v_actor := auth.uid();

  if v_actor is null or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Clinical document was not found.';
  end if;

  if not app_private.has_branch_access(v_document.branch_id) then
    raise exception 'The current staff account has no access to this document branch.';
  end if;

  if v_document.created_by <> v_actor and not app_private.is_system_admin() then
    raise exception 'Only the document creator or SYSTEM_ADMIN can submit this document for review.';
  end if;

  if v_document.status = 'for_review' then
    return jsonb_build_object('idempotent_replay', true, 'document_id', v_document.id, 'status', v_document.status);
  end if;

  if v_document.status <> 'draft' then
    raise exception 'Only a draft clinical document can be submitted for review.';
  end if;

  v_before := jsonb_build_object('status', v_document.status, 'metadata', v_document.metadata);

  update public.clinical_documents
  set
    status = 'for_review',
    metadata = metadata || coalesce(p_metadata_patch, '{}'::jsonb)
  where id = v_document.id
  returning * into v_document;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'clinical_document.submitted_for_review',
    format('Clinical document %s was submitted for review.', v_document.document_number),
    v_document.patient_id,
    v_document.branch_id,
    v_document.visit_id,
    v_document.service_request_id,
    null,
    v_document.id,
    v_before,
    jsonb_build_object('status', v_document.status, 'metadata', v_document.metadata),
    '{}'::jsonb
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'document_id', v_document.id,
    'document_number', v_document.document_number,
    'status', v_document.status
  );
end;
$$;

create or replace function public.clinical_finalize_document(
  p_document_id uuid,
  p_metadata_patch jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_document public.clinical_documents%rowtype;
  v_request public.service_requests%rowtype;
  v_authorized boolean := false;
  v_before jsonb;
begin
  v_actor := auth.uid();

  if v_actor is null or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Clinical document was not found.';
  end if;

  if not app_private.has_branch_access(v_document.branch_id) then
    raise exception 'The current staff account has no access to this document branch.';
  end if;

  if v_document.status = 'finalized' then
    return jsonb_build_object('idempotent_replay', true, 'document_id', v_document.id, 'status', v_document.status);
  end if;

  if v_document.status not in ('draft', 'for_review') then
    raise exception 'Only a draft or for-review clinical document can be finalized.';
  end if;

  select *
  into v_request
  from public.service_requests
  where id = v_document.service_request_id;

  v_authorized := case
    when v_document.document_type in ('prescription', 'consultation_summary', 'diagnosis_summary', 'medical_certificate') then
      app_private.has_permission('doctor.consultation.manage_assigned')
      and v_request.assigned_staff_id = v_actor
    when v_document.document_type = 'laboratory_result' then
      app_private.has_permission('laboratory.result.verify')
    when v_document.document_type = 'official_receipt' then
      app_private.has_permission('cashier.receipt.issue')
    when v_document.document_type in ('radiology_report', 'other') then
      app_private.is_system_admin()
    else false
  end;

  if not v_authorized and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot finalize this clinical-document type.';
  end if;

  v_before := jsonb_build_object(
    'status', v_document.status,
    'finalized_by', v_document.finalized_by,
    'finalized_at', v_document.finalized_at
  );

  update public.clinical_documents
  set
    status = 'finalized',
    finalized_by = v_actor,
    finalized_at = now(),
    metadata = metadata || coalesce(p_metadata_patch, '{}'::jsonb)
  where id = v_document.id
  returning * into v_document;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'clinical_document.finalized',
    format('Clinical document %s was finalized.', v_document.document_number),
    v_document.patient_id,
    v_document.branch_id,
    v_document.visit_id,
    v_document.service_request_id,
    null,
    v_document.id,
    v_before,
    jsonb_build_object(
      'status', v_document.status,
      'finalized_by', v_document.finalized_by,
      'finalized_at', v_document.finalized_at
    ),
    '{}'::jsonb
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'document_id', v_document.id,
    'document_number', v_document.document_number,
    'status', v_document.status,
    'finalized_at', v_document.finalized_at
  );
end;
$$;

-- ============================================================
-- RECEPTION: PRINT AND RELEASE
-- ============================================================

create or replace function public.reception_print_document(
  p_idempotency_key text,
  p_document_id uuid,
  p_print_purpose text,
  p_print_reason text default null,
  p_release_record_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_document public.clinical_documents%rowtype;
  v_print public.document_print_logs%rowtype;
  v_copy_number integer;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(hashtextextended('document-print:' || v_key, 0));

  select *
  into v_print
  from public.document_print_logs
  where idempotency_key = v_key;

  if found then
    return jsonb_build_object(
      'idempotent_replay', true,
      'print_log_id', v_print.id,
      'document_id', v_print.document_id,
      'print_purpose', v_print.print_purpose,
      'copy_number', v_print.copy_number,
      'printed_at', v_print.printed_at
    );
  end if;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id;

  if not found then
    raise exception 'Clinical document was not found.';
  end if;

  v_actor := app_private.require_staff_permission('reception.release.print', v_document.branch_id);

  if p_release_record_id is not null
     and not exists (
       select 1
       from public.document_release_records
       where id = p_release_record_id
         and document_id = v_document.id
     ) then
    raise exception 'The selected release record does not belong to this clinical document.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('document-print-copy:' || v_document.id::text, 0)
  );

  select coalesce(max(copy_number), 0) + 1
  into v_copy_number
  from public.document_print_logs
  where document_id = v_document.id;

  insert into public.document_print_logs (
    document_id,
    release_record_id,
    patient_id,
    branch_id,
    print_purpose,
    copy_number,
    printed_by,
    print_reason,
    metadata,
    idempotency_key
  )
  values (
    v_document.id,
    p_release_record_id,
    v_document.patient_id,
    v_document.branch_id,
    lower(trim(p_print_purpose)),
    v_copy_number,
    v_actor,
    nullif(trim(p_print_reason), ''),
    coalesce(p_metadata, '{}'::jsonb),
    v_key
  )
  returning * into v_print;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'document.printed',
    format('Clinical document %s was printed as %s.', v_document.document_number, v_print.print_purpose),
    v_document.patient_id,
    v_document.branch_id,
    v_document.visit_id,
    v_document.service_request_id,
    null,
    v_document.id,
    null,
    jsonb_build_object(
      'print_log_id', v_print.id,
      'print_purpose', v_print.print_purpose,
      'copy_number', v_print.copy_number,
      'printed_at', v_print.printed_at
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'print_log_id', v_print.id,
    'document_id', v_print.document_id,
    'print_purpose', v_print.print_purpose,
    'copy_number', v_print.copy_number,
    'printed_at', v_print.printed_at
  );
end;
$$;

create or replace function public.reception_release_document(
  p_idempotency_key text,
  p_document_id uuid,
  p_release_method text,
  p_recipient_name text,
  p_recipient_relationship text default null,
  p_recipient_identifier_masked text default null,
  p_notes text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_key text;
  v_document public.clinical_documents%rowtype;
  v_release public.document_release_records%rowtype;
  v_release_number text;
  v_copy_number integer;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(hashtextextended('document-release:' || v_key, 0));

  select *
  into v_release
  from public.document_release_records
  where idempotency_key = v_key;

  if found then
    return jsonb_build_object(
      'idempotent_replay', true,
      'release_record_id', v_release.id,
      'release_number', v_release.release_number,
      'document_id', v_release.document_id,
      'release_method', v_release.release_method,
      'copy_number', v_release.copy_number,
      'released_at', v_release.released_at
    );
  end if;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id;

  if not found then
    raise exception 'Clinical document was not found.';
  end if;

  v_actor := app_private.require_staff_permission('reception.release.complete', v_document.branch_id);

  perform pg_advisory_xact_lock(
    hashtextextended('document-release-copy:' || v_document.id::text, 0)
  );

  select coalesce(max(copy_number), 0) + 1
  into v_copy_number
  from public.document_release_records
  where document_id = v_document.id;

  v_release_number := app_private.next_operation_number(
    'REL',
    'app_private.release_number_sequence'::regclass,
    'YYYYMMDD',
    6
  );

  insert into public.document_release_records (
    release_number,
    document_id,
    patient_id,
    branch_id,
    release_method,
    recipient_name,
    recipient_relationship,
    recipient_identifier_masked,
    copy_number,
    released_by,
    notes,
    metadata,
    idempotency_key
  )
  values (
    v_release_number,
    v_document.id,
    v_document.patient_id,
    v_document.branch_id,
    lower(trim(p_release_method)),
    trim(p_recipient_name),
    nullif(trim(p_recipient_relationship), ''),
    nullif(trim(p_recipient_identifier_masked), ''),
    v_copy_number,
    v_actor,
    nullif(trim(p_notes), ''),
    coalesce(p_metadata, '{}'::jsonb),
    v_key
  )
  returning * into v_release;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'document.released',
    format('Clinical document %s was released using %s.', v_document.document_number, v_release.release_method),
    v_document.patient_id,
    v_document.branch_id,
    v_document.visit_id,
    v_document.service_request_id,
    null,
    v_document.id,
    null,
    jsonb_build_object(
      'release_record_id', v_release.id,
      'release_number', v_release.release_number,
      'release_method', v_release.release_method,
      'copy_number', v_release.copy_number,
      'released_at', v_release.released_at
    ),
    jsonb_build_object('idempotency_key', v_key)
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'release_record_id', v_release.id,
    'release_number', v_release.release_number,
    'document_id', v_release.document_id,
    'release_method', v_release.release_method,
    'copy_number', v_release.copy_number,
    'released_at', v_release.released_at
  );
end;
$$;

-- ============================================================
-- RPC SECURITY
-- ============================================================

revoke all on function public.admin_upsert_service_catalog_item(text, text, text, text, bigint, text, text, boolean, boolean, boolean, uuid) from public, anon;
revoke all on function public.reception_register_patient(text, text, text, text, date, text, text, text, text, boolean, text, text, text) from public, anon;
revoke all on function public.reception_create_visit(text, uuid, text, text, text, text) from public, anon;
revoke all on function public.reception_check_in_visit(uuid) from public, anon;
revoke all on function public.reception_create_service_request(text, uuid, uuid, text, uuid, text, text, boolean) from public, anon;
revoke all on function public.department_advance_queue_entry(uuid, text, text) from public, anon;
revoke all on function public.cashier_post_charge(text, uuid, text, numeric, bigint, uuid, text, text) from public, anon;
revoke all on function public.cashier_record_payment(text, uuid, bigint, text, text, jsonb) from public, anon;
revoke all on function public.cashier_set_payment_clearance(uuid, text, bigint, text) from public, anon;
revoke all on function public.clinical_register_document(text, uuid, text, text, text, text, text, boolean, text, text, jsonb) from public, anon;
revoke all on function public.clinical_submit_document_for_review(uuid, jsonb) from public, anon;
revoke all on function public.clinical_finalize_document(uuid, jsonb) from public, anon;
revoke all on function public.reception_print_document(text, uuid, text, text, uuid, jsonb) from public, anon;
revoke all on function public.reception_release_document(text, uuid, text, text, text, text, text, jsonb) from public, anon;

grant execute on function public.admin_upsert_service_catalog_item(text, text, text, text, bigint, text, text, boolean, boolean, boolean, uuid) to authenticated;
grant execute on function public.reception_register_patient(text, text, text, text, date, text, text, text, text, boolean, text, text, text) to authenticated;
grant execute on function public.reception_create_visit(text, uuid, text, text, text, text) to authenticated;
grant execute on function public.reception_check_in_visit(uuid) to authenticated;
grant execute on function public.reception_create_service_request(text, uuid, uuid, text, uuid, text, text, boolean) to authenticated;
grant execute on function public.department_advance_queue_entry(uuid, text, text) to authenticated;
grant execute on function public.cashier_post_charge(text, uuid, text, numeric, bigint, uuid, text, text) to authenticated;
grant execute on function public.cashier_record_payment(text, uuid, bigint, text, text, jsonb) to authenticated;
grant execute on function public.cashier_set_payment_clearance(uuid, text, bigint, text) to authenticated;
grant execute on function public.clinical_register_document(text, uuid, text, text, text, text, text, boolean, text, text, jsonb) to authenticated;
grant execute on function public.clinical_submit_document_for_review(uuid, jsonb) to authenticated;
grant execute on function public.clinical_finalize_document(uuid, jsonb) to authenticated;
grant execute on function public.reception_print_document(text, uuid, text, text, uuid, jsonb) to authenticated;
grant execute on function public.reception_release_document(text, uuid, text, text, text, text, text, jsonb) to authenticated;

commit;
