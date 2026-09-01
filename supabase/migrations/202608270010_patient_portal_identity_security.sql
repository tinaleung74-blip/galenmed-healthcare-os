-- GalenMed Healthcare OS
-- Migration 010: Patient Portal Identity and Security Foundation
-- Target: Supabase Postgres
-- Safety:
--   * Creates patient-to-Auth identity mapping, guarded staff linking/status RPCs,
--     patient portal context/session RPCs, permissions, RLS, and append-only audit.
--   * Does not create any Auth user automatically.
--   * Does not expose billing or clinical tables directly to patient accounts.
--   * Does not create sample patients, portal accounts, or audit records.

begin;

-- ============================================================
-- DEPENDENCY GATE
-- ============================================================

do $$
begin
  if to_regclass('public.patients') is null then
    raise exception 'Migration 004 dependency missing: public.patients.';
  end if;

  if to_regclass('public.hospital_branches') is null then
    raise exception 'Migration 001 dependency missing: public.hospital_branches.';
  end if;

  if to_regclass('public.staff_profiles') is null then
    raise exception 'Migration 001 dependency missing: public.staff_profiles.';
  end if;

  if to_regclass('public.app_permissions') is null then
    raise exception 'Migration 001 dependency missing: public.app_permissions.';
  end if;

  if to_regclass('public.role_permissions') is null then
    raise exception 'Migration 001 dependency missing: public.role_permissions.';
  end if;

  if to_regprocedure('app_private.current_staff_is_active()') is null then
    raise exception 'Migration 001 dependency missing: app_private.current_staff_is_active().';
  end if;

  if to_regprocedure('app_private.has_permission(text)') is null then
    raise exception 'Migration 001 dependency missing: app_private.has_permission(text).';
  end if;

  if to_regprocedure('app_private.is_system_admin()') is null then
    raise exception 'Migration 001 dependency missing: app_private.is_system_admin().';
  end if;

  if to_regprocedure('app_private.has_branch_access(text)') is null then
    raise exception 'Migration 001 dependency missing: app_private.has_branch_access(text).';
  end if;

  if to_regprocedure('app_private.set_updated_at()') is null then
    raise exception 'Migration 001 dependency missing: app_private.set_updated_at().';
  end if;

  if to_regprocedure('app_private.reject_audit_mutation()') is null then
    raise exception 'Migration 001 dependency missing: app_private.reject_audit_mutation().';
  end if;
end;
$$;

-- ============================================================
-- STAFF PERMISSIONS
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
    'patient.portal.view',
    'View Patient Portal Accounts',
    'patient_portal',
    'View patient portal identity links, account status, and access evidence.',
    true
  ),
  (
    'patient.portal.manage',
    'Manage Patient Portal Accounts',
    'patient_portal',
    'Link an approved patient record to an Auth identity and manage portal account status.',
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  module = excluded.module,
  description = excluded.description,
  sensitive = excluded.sensitive;

insert into public.role_permissions (
  role_id,
  permission_id
)
select
  roles.id,
  permissions.id
from public.app_roles roles
join public.app_permissions permissions
  on permissions.code in (
    'patient.portal.view',
    'patient.portal.manage'
  )
where roles.code in (
  'SYSTEM_ADMIN',
  'RECEPTIONIST'
)
on conflict do nothing;

-- ============================================================
-- PATIENT PORTAL IDENTITY
-- ============================================================

create table if not exists public.patient_portal_accounts (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null unique
    references public.patients(id)
    on delete restrict,

  auth_user_id uuid not null unique
    references auth.users(id)
    on delete restrict,

  login_email text not null,

  status text not null default 'invited',

  must_change_password boolean not null default true,

  invited_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,

  invited_at timestamptz not null default now(),
  activated_at timestamptz,
  last_login_at timestamptz,

  locked_at timestamptz,
  suspended_at timestamptz,

  archived_at timestamptz,
  archived_by uuid
    references public.staff_profiles(id)
    on delete set null,
  archive_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint patient_portal_accounts_email_check
    check (
      login_email = lower(trim(login_email))
      and position('@' in login_email) > 1
    ),

  constraint patient_portal_accounts_status_check
    check (
      status in (
        'invited',
        'active',
        'locked',
        'suspended',
        'archived'
      )
    ),

  constraint patient_portal_accounts_archive_fields_check
    check (
      status <> 'archived'
      or (
        archived_at is not null
        and archived_by is not null
        and nullif(trim(archive_reason), '') is not null
      )
    )
);

comment on table public.patient_portal_accounts is
  'One-to-one mapping between a canonical GalenMed patient record and a Supabase Auth identity.';

create unique index if not exists patient_portal_accounts_login_email_unique_idx
  on public.patient_portal_accounts (lower(login_email));

create index if not exists patient_portal_accounts_status_idx
  on public.patient_portal_accounts (status, updated_at desc);

create index if not exists patient_portal_accounts_patient_status_idx
  on public.patient_portal_accounts (patient_id, status);

create table if not exists public.patient_portal_access_audit_logs (
  id bigint generated always as identity primary key,

  patient_portal_account_id uuid
    references public.patient_portal_accounts(id)
    on delete set null,

  patient_id uuid
    references public.patients(id)
    on delete set null,

  auth_user_id uuid
    references auth.users(id)
    on delete set null,

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  event_type text not null,
  success boolean not null default true,

  user_agent text,
  failure_reason text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint patient_portal_access_audit_event_check
    check (
      event_type in (
        'account_linked',
        'account_activated',
        'account_locked',
        'account_unlocked',
        'account_suspended',
        'account_reactivated',
        'account_archived',
        'login_success',
        'logout',
        'password_changed',
        'portal_viewed',
        'profile_viewed',
        'billing_viewed',
        'document_viewed',
        'print_requested'
      )
    )
);

comment on table public.patient_portal_access_audit_logs is
  'Append-only patient portal identity, session, and sensitive-access events.';

create index if not exists patient_portal_access_audit_account_created_idx
  on public.patient_portal_access_audit_logs (
    patient_portal_account_id,
    created_at desc
  );

create index if not exists patient_portal_access_audit_patient_created_idx
  on public.patient_portal_access_audit_logs (
    patient_id,
    created_at desc
  );

create index if not exists patient_portal_access_audit_auth_created_idx
  on public.patient_portal_access_audit_logs (
    auth_user_id,
    created_at desc
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists patient_portal_accounts_set_updated_at
  on public.patient_portal_accounts;

create trigger patient_portal_accounts_set_updated_at
before update on public.patient_portal_accounts
for each row
execute function app_private.set_updated_at();

drop trigger if exists patient_portal_access_audit_reject_mutation
  on public.patient_portal_access_audit_logs;

create trigger patient_portal_access_audit_reject_mutation
before update or delete on public.patient_portal_access_audit_logs
for each row
execute function app_private.reject_audit_mutation();

-- ============================================================
-- PATIENT PORTAL AUTHORIZATION HELPERS
-- ============================================================

create or replace function app_private.current_patient_portal_account_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select accounts.id
  from public.patient_portal_accounts accounts
  where accounts.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function app_private.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select accounts.patient_id
  from public.patient_portal_accounts accounts
  where accounts.auth_user_id = auth.uid()
    and accounts.status = 'active'
  limit 1;
$$;

create or replace function app_private.current_patient_portal_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patient_portal_accounts accounts
    join public.patients patients
      on patients.id = accounts.patient_id
    where accounts.auth_user_id = auth.uid()
      and accounts.status = 'active'
      and patients.status = 'active'
  );
$$;

revoke all
  on function app_private.current_patient_portal_account_id(),
     app_private.current_patient_id(),
     app_private.current_patient_portal_is_active()
  from public, anon;

grant execute
  on function app_private.current_patient_portal_account_id(),
     app_private.current_patient_id(),
     app_private.current_patient_portal_is_active()
  to authenticated;

-- ============================================================
-- STAFF-GUARDED PATIENT PORTAL MANAGEMENT RPCS
-- ============================================================

create or replace function public.staff_link_patient_portal_account(
  p_patient_id uuid,
  p_auth_user_id uuid,
  p_login_email text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_patient public.patients%rowtype;
  v_auth_email text;
  v_account_type text;
  v_existing public.patient_portal_accounts%rowtype;
  v_account_id uuid;
begin
  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('patient.portal.manage')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot manage Patient Portal access.';
  end if;

  if p_patient_id is null or p_auth_user_id is null then
    raise exception 'Patient ID and Auth user ID are required.';
  end if;

  if nullif(trim(p_login_email), '') is null then
    raise exception 'A patient login email is required.';
  end if;

  if length(trim(p_reason)) < 10 then
    raise exception 'A reason with at least 10 characters is required.';
  end if;

  select *
  into v_patient
  from public.patients patients
  where patients.id = p_patient_id;

  if not found then
    raise exception 'The patient record was not found.';
  end if;

  if v_patient.status <> 'active' then
    raise exception 'Only an active patient record can receive portal access.';
  end if;

  if not app_private.is_system_admin()
     and not app_private.has_branch_access(v_patient.branch_id) then
    raise exception 'The current staff account has no access to the patient branch.';
  end if;

  select
    lower(auth_users.email),
    coalesce(
      auth_users.raw_app_meta_data ->> 'account_type',
      auth_users.raw_user_meta_data ->> 'account_type'
    )
  into
    v_auth_email,
    v_account_type
  from auth.users auth_users
  where auth_users.id = p_auth_user_id;

  if not found then
    raise exception 'The supplied Supabase Auth user was not found.';
  end if;

  if v_auth_email is distinct from lower(trim(p_login_email)) then
    raise exception 'The supplied email does not match the Auth user email.';
  end if;

  if v_account_type is distinct from 'patient' then
    raise exception 'The Auth user is not marked as a GalenMed patient account.';
  end if;

  if exists (
    select 1
    from public.staff_profiles staff
    where staff.id = p_auth_user_id
  ) then
    raise exception 'A staff Auth identity cannot be linked to a patient portal account.';
  end if;

  select *
  into v_existing
  from public.patient_portal_accounts accounts
  where accounts.patient_id = p_patient_id
     or accounts.auth_user_id = p_auth_user_id
  order by
    case
      when accounts.patient_id = p_patient_id then 0
      else 1
    end
  limit 1;

  if found then
    if v_existing.patient_id = p_patient_id
       and v_existing.auth_user_id = p_auth_user_id
       and v_existing.login_email = lower(trim(p_login_email)) then
      return v_existing.id;
    end if;

    raise exception 'The patient or Auth user is already linked to a different portal account.';
  end if;

  insert into public.patient_portal_accounts (
    patient_id,
    auth_user_id,
    login_email,
    status,
    must_change_password,
    invited_by,
    invited_at
  )
  values (
    p_patient_id,
    p_auth_user_id,
    lower(trim(p_login_email)),
    'invited',
    true,
    v_actor,
    now()
  )
  returning id
  into v_account_id;

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
    v_account_id,
    p_patient_id,
    p_auth_user_id,
    v_actor,
    'account_linked',
    true,
    jsonb_build_object(
      'login_email', lower(trim(p_login_email)),
      'medical_record_number', v_patient.medical_record_number,
      'reason', trim(p_reason)
    )
  );

  return v_account_id;
end;
$$;

create or replace function public.staff_set_patient_portal_account_status(
  p_account_id uuid,
  p_status text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_account public.patient_portal_accounts%rowtype;
  v_next_status text;
  v_event_type text;
begin
  v_actor := auth.uid();
  v_next_status := lower(trim(p_status));

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('patient.portal.manage')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot manage Patient Portal access.';
  end if;

  if v_next_status not in (
    'active',
    'locked',
    'suspended',
    'archived'
  ) then
    raise exception 'Unsupported Patient Portal account status.';
  end if;

  if length(trim(p_reason)) < 10 then
    raise exception 'A reason with at least 10 characters is required.';
  end if;

  select *
  into v_account
  from public.patient_portal_accounts accounts
  where accounts.id = p_account_id
  for update;

  if not found then
    raise exception 'Patient Portal account was not found.';
  end if;

  if v_account.status = 'archived' then
    raise exception 'An archived Patient Portal account cannot be reactivated.';
  end if;

  if v_account.status = v_next_status then
    return v_account.id;
  end if;

  if v_next_status = 'active' then
    v_event_type :=
      case
        when v_account.status = 'invited'
          then 'account_activated'
        else 'account_reactivated'
      end;

    update public.patient_portal_accounts
    set
      status = 'active',
      activated_at = coalesce(activated_at, now()),
      locked_at = null,
      suspended_at = null
    where id = v_account.id;

  elsif v_next_status = 'locked' then
    v_event_type := 'account_locked';

    update public.patient_portal_accounts
    set
      status = 'locked',
      locked_at = now()
    where id = v_account.id;

  elsif v_next_status = 'suspended' then
    v_event_type := 'account_suspended';

    update public.patient_portal_accounts
    set
      status = 'suspended',
      suspended_at = now()
    where id = v_account.id;

  else
    v_event_type := 'account_archived';

    update public.patient_portal_accounts
    set
      status = 'archived',
      archived_at = now(),
      archived_by = v_actor,
      archive_reason = trim(p_reason)
    where id = v_account.id;
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
    v_account.auth_user_id,
    v_actor,
    v_event_type,
    true,
    jsonb_build_object(
      'previous_status', v_account.status,
      'next_status', v_next_status,
      'reason', trim(p_reason)
    )
  );

  return v_account.id;
end;
$$;

-- ============================================================
-- PATIENT PORTAL CONTEXT AND SESSION RPCS
-- ============================================================

create or replace function public.get_current_patient_portal_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_account public.patient_portal_accounts%rowtype;
  v_patient public.patients%rowtype;
begin
  if auth.uid() is null then
    return null;
  end if;

  select *
  into v_account
  from public.patient_portal_accounts accounts
  where accounts.auth_user_id = auth.uid();

  if not found then
    return null;
  end if;

  select *
  into v_patient
  from public.patients patients
  where patients.id = v_account.patient_id;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'account_id', v_account.id,
    'auth_user_id', v_account.auth_user_id,
    'account_status', v_account.status,
    'must_change_password', v_account.must_change_password,
    'login_email', v_account.login_email,
    'last_login_at', v_account.last_login_at,

    'patient', jsonb_build_object(
      'id', v_patient.id,
      'medical_record_number', v_patient.medical_record_number,
      'first_name', v_patient.first_name,
      'middle_name', v_patient.middle_name,
      'last_name', v_patient.last_name,
      'date_of_birth', v_patient.date_of_birth,
      'biological_sex', v_patient.biological_sex,
      'mobile_number', v_patient.mobile_number,
      'email_address', v_patient.email_address,
      'branch_id', v_patient.branch_id,
      'status', v_patient.status
    ),

    'branch', (
      select jsonb_build_object(
        'id', branches.id,
        'code', branches.code,
        'name', branches.name
      )
      from public.hospital_branches branches
      where branches.id = v_patient.branch_id
    )
  );
end;
$$;

create or replace function public.record_patient_portal_session_event(
  p_event_type text,
  p_user_agent text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.patient_portal_accounts%rowtype;
  v_event_type text;
  v_log_id bigint;
begin
  v_event_type := lower(trim(p_event_type));

  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into v_account
  from public.patient_portal_accounts accounts
  where accounts.auth_user_id = auth.uid();

  if not found then
    raise exception 'No Patient Portal account is linked to this Auth identity.';
  end if;

  if v_account.status <> 'active' then
    raise exception 'The Patient Portal account is not active.';
  end if;

  if v_event_type not in (
    'login_success',
    'logout',
    'password_changed',
    'portal_viewed',
    'profile_viewed',
    'billing_viewed',
    'document_viewed',
    'print_requested'
  ) then
    raise exception 'Unsupported Patient Portal session event type.';
  end if;

  insert into public.patient_portal_access_audit_logs (
    patient_portal_account_id,
    patient_id,
    auth_user_id,
    actor_user_id,
    event_type,
    success,
    user_agent,
    metadata
  )
  values (
    v_account.id,
    v_account.patient_id,
    v_account.auth_user_id,
    auth.uid(),
    v_event_type,
    true,
    nullif(trim(p_user_agent), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id
  into v_log_id;

  if v_event_type = 'login_success' then
    update public.patient_portal_accounts
    set last_login_at = now()
    where id = v_account.id;
  elsif v_event_type = 'password_changed' then
    update public.patient_portal_accounts
    set must_change_password = false
    where id = v_account.id;
  end if;

  return v_log_id;
end;
$$;

create or replace function public.get_patient_portal_management_data()
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

  if not app_private.has_permission('patient.portal.view')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot view Patient Portal accounts.';
  end if;

  return jsonb_build_object(
    'patients',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'patient_id', patients.id,
            'medical_record_number', patients.medical_record_number,
            'first_name', patients.first_name,
            'middle_name', patients.middle_name,
            'last_name', patients.last_name,
            'date_of_birth', patients.date_of_birth,
            'mobile_number', patients.mobile_number,
            'email_address', patients.email_address,
            'patient_status', patients.status,
            'branch_id', patients.branch_id,
            'branch_name', branches.name,

            'portal_account', case
              when accounts.id is null then null
              else jsonb_build_object(
                'id', accounts.id,
                'auth_user_id', accounts.auth_user_id,
                'login_email', accounts.login_email,
                'status', accounts.status,
                'must_change_password', accounts.must_change_password,
                'invited_at', accounts.invited_at,
                'activated_at', accounts.activated_at,
                'last_login_at', accounts.last_login_at,
                'updated_at', accounts.updated_at
              )
            end
          )
          order by
            patients.last_name,
            patients.first_name,
            patients.medical_record_number
        )
        from public.patients patients
        join public.hospital_branches branches
          on branches.id = patients.branch_id
        left join public.patient_portal_accounts accounts
          on accounts.patient_id = patients.id
        where
          app_private.is_system_admin()
          or app_private.has_branch_access(patients.branch_id)
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all
  on function public.staff_link_patient_portal_account(uuid, uuid, text, text),
     public.staff_set_patient_portal_account_status(uuid, text, text),
     public.get_current_patient_portal_context(),
     public.record_patient_portal_session_event(text, text, jsonb),
     public.get_patient_portal_management_data()
  from public, anon;

grant execute
  on function public.staff_link_patient_portal_account(uuid, uuid, text, text),
     public.staff_set_patient_portal_account_status(uuid, text, text),
     public.get_current_patient_portal_context(),
     public.record_patient_portal_session_event(text, text, jsonb),
     public.get_patient_portal_management_data()
  to authenticated;

-- ============================================================
-- RLS AND DATA API PRIVILEGES
-- ============================================================

alter table public.patient_portal_accounts
  enable row level security;

alter table public.patient_portal_access_audit_logs
  enable row level security;

revoke all
  on public.patient_portal_accounts,
     public.patient_portal_access_audit_logs
  from anon, authenticated;

grant select
  on public.patient_portal_accounts,
     public.patient_portal_access_audit_logs
  to authenticated;

drop policy if exists patient_portal_accounts_select_self_or_staff
  on public.patient_portal_accounts;

create policy patient_portal_accounts_select_self_or_staff
on public.patient_portal_accounts
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or
  (select app_private.has_permission('patient.portal.view'))
  or
  (select app_private.is_system_admin())
);

drop policy if exists patient_portal_audit_select_self_or_staff
  on public.patient_portal_access_audit_logs;

create policy patient_portal_audit_select_self_or_staff
on public.patient_portal_access_audit_logs
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or
  (select app_private.has_permission('security.audit.view'))
  or
  (select app_private.has_permission('patient.portal.view'))
  or
  (select app_private.is_system_admin())
);

commit;
