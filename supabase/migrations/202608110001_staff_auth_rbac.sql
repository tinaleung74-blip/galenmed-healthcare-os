-- GalenMed Healthcare OS
-- Migration 001: Staff Authentication, RBAC, Branch Scope, and Audit Foundation
-- Target: Supabase Postgres
-- Safety: no existing GalenMed clinical tables are altered in this migration.

begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
grant usage on schema app_private to authenticated;

-- ============================================================
-- REFERENCE TABLES
-- ============================================================

create table if not exists public.hospital_branches (
  id text primary key,
  code text not null unique,
  name text not null,
  short_name text not null,
  city text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_branches_id_format_check
    check (id ~ '^branch-[a-z0-9-]+$'),
  constraint hospital_branches_code_format_check
    check (code = upper(code) and code ~ '^[A-Z0-9_-]+$')
);

comment on table public.hospital_branches is
  'Canonical GalenMed hospital branches used for staff access scope.';

create table if not exists public.staff_departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_departments_code_format_check
    check (code = upper(code) and code ~ '^[A-Z0-9_-]+$')
);

comment on table public.staff_departments is
  'Hospital departments that may be assigned to staff accounts.';

create table if not exists public.app_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  dashboard_path text not null,
  is_system boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_roles_code_format_check
    check (code = upper(code) and code ~ '^[A-Z0-9_]+$'),
  constraint app_roles_dashboard_path_check
    check (dashboard_path ~ '^/')
);

comment on table public.app_roles is
  'Application roles used for GalenMed staff authorization and dashboard routing.';

create table if not exists public.app_permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  module text not null,
  description text,
  sensitive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_permissions_code_format_check
    check (code ~ '^[a-z0-9]+([._-][a-z0-9]+)*$')
);

comment on table public.app_permissions is
  'Fine-grained GalenMed permissions assigned to application roles.';

create table if not exists public.role_permissions (
  role_id uuid not null
    references public.app_roles(id)
    on delete restrict,
  permission_id uuid not null
    references public.app_permissions(id)
    on delete restrict,
  granted_at timestamptz not null default now(),
  granted_by uuid
    references auth.users(id)
    on delete set null,
  primary key (role_id, permission_id)
);

comment on table public.role_permissions is
  'Many-to-many mapping between staff roles and fine-grained permissions.';

-- ============================================================
-- STAFF IDENTITY AND ASSIGNMENTS
-- ============================================================

create table if not exists public.staff_profiles (
  id uuid primary key
    references auth.users(id)
    on delete restrict,
  employee_id text,
  full_name text not null,
  work_email text not null,
  mobile_number text,
  job_title text,
  account_status text not null default 'invited',
  avatar_url text,
  last_login_at timestamptz,
  invited_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  archived_at timestamptz,
  created_by uuid
    references auth.users(id)
    on delete set null,
  updated_by uuid
    references auth.users(id)
    on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_profiles_account_status_check
    check (
      account_status in (
        'invited',
        'active',
        'locked',
        'suspended',
        'archived'
      )
    ),
  constraint staff_profiles_employee_id_format_check
    check (
      employee_id is null
      or employee_id ~ '^[A-Za-z0-9_-]+$'
    )
);

comment on table public.staff_profiles is
  'Staff application profile linked one-to-one with Supabase Auth users.';

create unique index if not exists staff_profiles_employee_id_unique_idx
  on public.staff_profiles (lower(employee_id))
  where employee_id is not null;

create unique index if not exists staff_profiles_work_email_unique_idx
  on public.staff_profiles (lower(work_email));

create index if not exists staff_profiles_account_status_idx
  on public.staff_profiles (account_status);

create table if not exists public.staff_role_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  role_id uuid not null
    references public.app_roles(id)
    on delete restrict,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  assigned_by uuid
    references auth.users(id)
    on delete set null,
  revoked_at timestamptz,
  revoked_by uuid
    references auth.users(id)
    on delete set null,
  assignment_reason text
);

comment on table public.staff_role_assignments is
  'Current and historical role assignments for each staff account.';

create unique index if not exists staff_role_assignments_active_unique_idx
  on public.staff_role_assignments (staff_id, role_id)
  where active;

create index if not exists staff_role_assignments_staff_active_idx
  on public.staff_role_assignments (staff_id, active);

create index if not exists staff_role_assignments_role_active_idx
  on public.staff_role_assignments (role_id, active);

create table if not exists public.staff_branch_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  is_primary boolean not null default false,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  assigned_by uuid
    references auth.users(id)
    on delete set null,
  revoked_at timestamptz,
  revoked_by uuid
    references auth.users(id)
    on delete set null
);

comment on table public.staff_branch_assignments is
  'Hospital branch scope assigned to each staff account.';

create unique index if not exists staff_branch_assignments_active_unique_idx
  on public.staff_branch_assignments (staff_id, branch_id)
  where active;

create unique index if not exists staff_branch_assignments_primary_unique_idx
  on public.staff_branch_assignments (staff_id)
  where active and is_primary;

create index if not exists staff_branch_assignments_branch_active_idx
  on public.staff_branch_assignments (branch_id, active);

create table if not exists public.staff_department_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  department_id uuid not null
    references public.staff_departments(id)
    on delete restrict,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  assigned_by uuid
    references auth.users(id)
    on delete set null,
  revoked_at timestamptz,
  revoked_by uuid
    references auth.users(id)
    on delete set null
);

comment on table public.staff_department_assignments is
  'Hospital department assignments for each staff account.';

create unique index if not exists staff_department_assignments_active_unique_idx
  on public.staff_department_assignments (staff_id, department_id)
  where active;

create index if not exists staff_department_assignments_staff_active_idx
  on public.staff_department_assignments (staff_id, active);

create table if not exists public.account_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  employee_id text,
  full_name text not null,
  requested_role_code text,
  requested_branch_ids text[] not null default '{}',
  requested_department_codes text[] not null default '{}',
  status text not null default 'pending',
  auth_user_id uuid
    references auth.users(id)
    on delete set null,
  invited_by uuid
    references auth.users(id)
    on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_invitations_status_check
    check (
      status in (
        'pending',
        'accepted',
        'expired',
        'revoked',
        'failed'
      )
    )
);

comment on table public.account_invitations is
  'Server-managed audit record of staff account invitations.';

create unique index if not exists account_invitations_pending_email_unique_idx
  on public.account_invitations (lower(email))
  where status = 'pending';

create index if not exists account_invitations_status_idx
  on public.account_invitations (status, created_at desc);

-- ============================================================
-- APPEND-ONLY AUTHENTICATION AND SECURITY LOGS
-- ============================================================

create table if not exists public.login_audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid
    references auth.users(id)
    on delete set null,
  staff_id uuid
    references public.staff_profiles(id)
    on delete set null,
  attempted_email text,
  event_type text not null,
  success boolean not null,
  session_id text,
  ip_address inet,
  user_agent text,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint login_audit_logs_event_type_check
    check (
      event_type in (
        'login_success',
        'login_failed',
        'logout',
        'password_reset_requested',
        'password_changed',
        'mfa_enrolled',
        'mfa_verified',
        'session_refreshed'
      )
    )
);

comment on table public.login_audit_logs is
  'Append-only authentication events. Failed-login events must be written from a trusted server.';

create index if not exists login_audit_logs_user_created_idx
  on public.login_audit_logs (user_id, created_at desc);

create index if not exists login_audit_logs_staff_created_idx
  on public.login_audit_logs (staff_id, created_at desc);

create index if not exists login_audit_logs_event_created_idx
  on public.login_audit_logs (event_type, created_at desc);

create table if not exists public.security_event_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid
    references auth.users(id)
    on delete set null,
  target_user_id uuid
    references auth.users(id)
    on delete set null,
  event_type text not null,
  severity text not null default 'information',
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint security_event_logs_severity_check
    check (
      severity in (
        'information',
        'warning',
        'critical'
      )
    ),
  constraint security_event_logs_event_type_check
    check (
      event_type in (
        'account_invited',
        'account_activated',
        'account_locked',
        'account_unlocked',
        'account_suspended',
        'account_reactivated',
        'account_archived',
        'role_changed',
        'branch_assignment_changed',
        'department_assignment_changed',
        'permission_changed',
        'sensitive_record_accessed',
        'authorized_override_used',
        'security_configuration_changed'
      )
    )
);

comment on table public.security_event_logs is
  'Append-only privileged security, authorization, and sensitive-access events.';

create index if not exists security_event_logs_actor_created_idx
  on public.security_event_logs (actor_user_id, created_at desc);

create index if not exists security_event_logs_target_created_idx
  on public.security_event_logs (target_user_id, created_at desc);

create index if not exists security_event_logs_event_created_idx
  on public.security_event_logs (event_type, created_at desc);

-- ============================================================
-- GENERIC TRIGGERS
-- ============================================================

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists hospital_branches_set_updated_at
  on public.hospital_branches;

create trigger hospital_branches_set_updated_at
before update on public.hospital_branches
for each row
execute function app_private.set_updated_at();

drop trigger if exists staff_departments_set_updated_at
  on public.staff_departments;

create trigger staff_departments_set_updated_at
before update on public.staff_departments
for each row
execute function app_private.set_updated_at();

drop trigger if exists app_roles_set_updated_at
  on public.app_roles;

create trigger app_roles_set_updated_at
before update on public.app_roles
for each row
execute function app_private.set_updated_at();

drop trigger if exists app_permissions_set_updated_at
  on public.app_permissions;

create trigger app_permissions_set_updated_at
before update on public.app_permissions
for each row
execute function app_private.set_updated_at();

drop trigger if exists staff_profiles_set_updated_at
  on public.staff_profiles;

create trigger staff_profiles_set_updated_at
before update on public.staff_profiles
for each row
execute function app_private.set_updated_at();

drop trigger if exists account_invitations_set_updated_at
  on public.account_invitations;

create trigger account_invitations_set_updated_at
before update on public.account_invitations
for each row
execute function app_private.set_updated_at();

create or replace function app_private.reject_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit records are append-only and cannot be updated or deleted.';
end;
$$;

drop trigger if exists login_audit_logs_reject_mutation
  on public.login_audit_logs;

create trigger login_audit_logs_reject_mutation
before update or delete on public.login_audit_logs
for each row
execute function app_private.reject_audit_mutation();

drop trigger if exists security_event_logs_reject_mutation
  on public.security_event_logs;

create trigger security_event_logs_reject_mutation
before update or delete on public.security_event_logs
for each row
execute function app_private.reject_audit_mutation();

-- ============================================================
-- STAFF PROFILE CREATION FROM AUTH INVITES
-- ============================================================

create or replace function public.handle_new_staff_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_type text;
  v_full_name text;
begin
  v_account_type :=
    coalesce(
      new.raw_app_meta_data ->> 'account_type',
      new.raw_user_meta_data ->> 'account_type'
    );

  if v_account_type is distinct from 'staff' then
    return new;
  end if;

  if new.email is null then
    raise exception 'A staff Auth user must have an email address.';
  end if;

  v_full_name :=
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    );

  insert into public.staff_profiles (
    id,
    full_name,
    work_email,
    account_status,
    invited_at
  )
  values (
    new.id,
    v_full_name,
    lower(new.email),
    'invited',
    now()
  )
  on conflict (id) do update
  set
    work_email = excluded.work_email,
    full_name = case
      when trim(public.staff_profiles.full_name) = ''
        then excluded.full_name
      else public.staff_profiles.full_name
    end;

  return new;
end;
$$;

revoke all
  on function public.handle_new_staff_auth_user()
  from public, anon, authenticated;

drop trigger if exists on_auth_staff_user_created
  on auth.users;

create trigger on_auth_staff_user_created
after insert or update of email, raw_user_meta_data, raw_app_meta_data
on auth.users
for each row
execute function public.handle_new_staff_auth_user();

-- ============================================================
-- AUTHORIZATION HELPERS
-- ============================================================

create or replace function app_private.current_staff_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = auth.uid()
      and sp.account_status = 'active'
  );
$$;

create or replace function app_private.has_role(
  requested_role_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_role_assignments sra
      on sra.staff_id = sp.id
     and sra.active
    join public.app_roles ar
      on ar.id = sra.role_id
     and ar.active
    where sp.id = auth.uid()
      and sp.account_status = 'active'
      and ar.code = upper(requested_role_code)
  );
$$;

create or replace function app_private.has_permission(
  requested_permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_role_assignments sra
      on sra.staff_id = sp.id
     and sra.active
    join public.app_roles ar
      on ar.id = sra.role_id
     and ar.active
    join public.role_permissions rp
      on rp.role_id = ar.id
    join public.app_permissions ap
      on ap.id = rp.permission_id
    where sp.id = auth.uid()
      and sp.account_status = 'active'
      and ap.code = lower(requested_permission_code)
  );
$$;

create or replace function app_private.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.has_role('SYSTEM_ADMIN');
$$;

create or replace function app_private.has_branch_access(
  requested_branch_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    app_private.is_system_admin()
    or exists (
      select 1
      from public.staff_profiles sp
      join public.staff_branch_assignments sba
        on sba.staff_id = sp.id
       and sba.active
      join public.hospital_branches hb
        on hb.id = sba.branch_id
       and hb.active
      where sp.id = auth.uid()
        and sp.account_status = 'active'
        and sba.branch_id = requested_branch_id
    );
$$;

revoke all
  on function app_private.current_staff_is_active()
  from public, anon;

revoke all
  on function app_private.has_role(text)
  from public, anon;

revoke all
  on function app_private.has_permission(text)
  from public, anon;

revoke all
  on function app_private.is_system_admin()
  from public, anon;

revoke all
  on function app_private.has_branch_access(text)
  from public, anon;

grant execute
  on function app_private.current_staff_is_active()
  to authenticated;

grant execute
  on function app_private.has_role(text)
  to authenticated;

grant execute
  on function app_private.has_permission(text)
  to authenticated;

grant execute
  on function app_private.is_system_admin()
  to authenticated;

grant execute
  on function app_private.has_branch_access(text)
  to authenticated;

-- ============================================================
-- APPLICATION RPCS
-- ============================================================

create or replace function public.get_current_staff_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile public.staff_profiles%rowtype;
begin
  select *
  into v_profile
  from public.staff_profiles sp
  where sp.id = auth.uid();

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'user_id', v_profile.id,
    'employee_id', v_profile.employee_id,
    'full_name', v_profile.full_name,
    'work_email', v_profile.work_email,
    'mobile_number', v_profile.mobile_number,
    'job_title', v_profile.job_title,
    'account_status', v_profile.account_status,
    'last_login_at', v_profile.last_login_at,
    'roles',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'code', role_rows.code,
              'name', role_rows.name,
              'dashboard_path', role_rows.dashboard_path
            )
            order by role_rows.name
          )
          from (
            select distinct
              ar.code,
              ar.name,
              ar.dashboard_path
            from public.staff_role_assignments sra
            join public.app_roles ar
              on ar.id = sra.role_id
            where sra.staff_id = v_profile.id
              and sra.active
              and ar.active
          ) role_rows
        ),
        '[]'::jsonb
      ),
    'permissions',
      coalesce(
        (
          select jsonb_agg(
            permission_rows.code
            order by permission_rows.code
          )
          from (
            select distinct
              ap.code
            from public.staff_role_assignments sra
            join public.app_roles ar
              on ar.id = sra.role_id
             and ar.active
            join public.role_permissions rp
              on rp.role_id = ar.id
            join public.app_permissions ap
              on ap.id = rp.permission_id
            where sra.staff_id = v_profile.id
              and sra.active
          ) permission_rows
        ),
        '[]'::jsonb
      ),
    'branches',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', branch_rows.id,
              'code', branch_rows.code,
              'name', branch_rows.name,
              'is_primary', branch_rows.is_primary
            )
            order by
              branch_rows.is_primary desc,
              branch_rows.name
          )
          from (
            select
              hb.id,
              hb.code,
              hb.name,
              sba.is_primary
            from public.staff_branch_assignments sba
            join public.hospital_branches hb
              on hb.id = sba.branch_id
            where sba.staff_id = v_profile.id
              and sba.active
              and hb.active
          ) branch_rows
        ),
        '[]'::jsonb
      ),
    'departments',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', department_rows.id,
              'code', department_rows.code,
              'name', department_rows.name
            )
            order by department_rows.name
          )
          from (
            select
              sd.id,
              sd.code,
              sd.name
            from public.staff_department_assignments sda
            join public.staff_departments sd
              on sd.id = sda.department_id
            where sda.staff_id = v_profile.id
              and sda.active
              and sd.active
          ) department_rows
        ),
        '[]'::jsonb
      )
  );
end;
$$;

revoke all
  on function public.get_current_staff_context()
  from public, anon;

grant execute
  on function public.get_current_staff_context()
  to authenticated;

create or replace function public.record_staff_session_event(
  p_event_type text,
  p_session_id text default null,
  p_user_agent text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_log_id bigint;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_event_type not in (
    'login_success',
    'logout',
    'password_changed',
    'mfa_enrolled',
    'mfa_verified',
    'session_refreshed'
  ) then
    raise exception 'Unsupported staff session event type.';
  end if;

  insert into public.login_audit_logs (
    user_id,
    staff_id,
    event_type,
    success,
    session_id,
    user_agent,
    metadata
  )
  values (
    v_user_id,
    v_user_id,
    p_event_type,
    true,
    nullif(trim(p_session_id), ''),
    nullif(trim(p_user_agent), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_log_id;

  if p_event_type = 'login_success' then
    update public.staff_profiles
    set
      last_login_at = now(),
      updated_by = v_user_id
    where id = v_user_id;
  end if;

  return v_log_id;
end;
$$;

revoke all
  on function public.record_staff_session_event(text, text, text, jsonb)
  from public, anon;

grant execute
  on function public.record_staff_session_event(text, text, text, jsonb)
  to authenticated;

-- ============================================================
-- ONE-TIME BOOTSTRAP FUNCTION
-- Run manually from Supabase SQL Editor after the first Auth
-- user exists. This function is intentionally not executable by
-- anon, authenticated, or service_role through the Data API.
-- ============================================================

create or replace function public.bootstrap_first_system_admin(
  p_user_email text,
  p_employee_id text,
  p_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_role_id uuid;
  v_existing_admin boolean;
  v_now timestamptz := now();
begin
  select exists (
    select 1
    from public.staff_role_assignments sra
    join public.app_roles ar
      on ar.id = sra.role_id
    join public.staff_profiles sp
      on sp.id = sra.staff_id
    where sra.active
      and ar.code = 'SYSTEM_ADMIN'
      and sp.account_status = 'active'
  )
  into v_existing_admin;

  if v_existing_admin then
    raise exception 'An active SYSTEM_ADMIN already exists.';
  end if;

  select au.id
  into v_user_id
  from auth.users au
  where lower(au.email) = lower(trim(p_user_email))
  order by au.created_at
  limit 1;

  if v_user_id is null then
    raise exception 'No Supabase Auth user exists for the supplied email.';
  end if;

  select ar.id
  into v_role_id
  from public.app_roles ar
  where ar.code = 'SYSTEM_ADMIN'
    and ar.active;

  if v_role_id is null then
    raise exception 'SYSTEM_ADMIN role is missing.';
  end if;

  insert into public.staff_profiles (
    id,
    employee_id,
    full_name,
    work_email,
    account_status,
    invited_at,
    activated_at,
    updated_by
  )
  values (
    v_user_id,
    upper(trim(p_employee_id)),
    trim(p_full_name),
    lower(trim(p_user_email)),
    'active',
    v_now,
    v_now,
    v_user_id
  )
  on conflict (id) do update
  set
    employee_id = excluded.employee_id,
    full_name = excluded.full_name,
    work_email = excluded.work_email,
    account_status = 'active',
    activated_at = coalesce(
      public.staff_profiles.activated_at,
      v_now
    ),
    suspended_at = null,
    archived_at = null,
    updated_by = v_user_id;

  insert into public.staff_role_assignments (
    staff_id,
    role_id,
    active,
    assigned_at,
    assigned_by,
    assignment_reason
  )
  values (
    v_user_id,
    v_role_id,
    true,
    v_now,
    v_user_id,
    'Initial GalenMed system administrator bootstrap'
  )
  on conflict do nothing;

  insert into public.staff_branch_assignments (
    staff_id,
    branch_id,
    is_primary,
    active,
    assigned_at,
    assigned_by
  )
  select
    v_user_id,
    hb.id,
    hb.id = 'branch-makati',
    true,
    v_now,
    v_user_id
  from public.hospital_branches hb
  where hb.active
  on conflict do nothing;

  insert into public.security_event_logs (
    actor_user_id,
    target_user_id,
    event_type,
    severity,
    summary,
    metadata
  )
  values (
    v_user_id,
    v_user_id,
    'account_activated',
    'critical',
    'Initial SYSTEM_ADMIN account was bootstrapped.',
    jsonb_build_object(
      'employee_id',
      upper(trim(p_employee_id))
    )
  );

  return v_user_id;
end;
$$;

revoke all
  on function public.bootstrap_first_system_admin(text, text, text)
  from public, anon, authenticated, service_role;

-- ============================================================
-- SEED CANONICAL BRANCHES
-- ============================================================

insert into public.hospital_branches (
  id,
  code,
  name,
  short_name,
  city,
  active
)
values
  (
    'branch-makati',
    'MKT',
    'GalenMed Makati',
    'Makati',
    'Makati City',
    true
  ),
  (
    'branch-quezon-city',
    'QC',
    'GalenMed Quezon City',
    'Quezon City',
    'Quezon City',
    true
  ),
  (
    'branch-cebu',
    'CEB',
    'GalenMed Cebu',
    'Cebu',
    'Cebu City',
    true
  )
on conflict (id) do update
set
  code = excluded.code,
  name = excluded.name,
  short_name = excluded.short_name,
  city = excluded.city,
  active = excluded.active;

-- ============================================================
-- SEED DEPARTMENTS
-- ============================================================

insert into public.staff_departments (
  code,
  name,
  description,
  active
)
values
  (
    'ADMIN',
    'System Administration',
    'System security, user accounts, settings, and audit administration.',
    true
  ),
  (
    'FRONT_DESK',
    'Reception and Front Desk',
    'Patient registration, intake, service routing, document release, and printing.',
    true
  ),
  (
    'MEDICINE',
    'Medical Services',
    'Doctor queues, consultations, diagnosis, and prescription preparation.',
    true
  ),
  (
    'LABORATORY',
    'Laboratory',
    'Laboratory queue, specimen collection, result entry, and verification.',
    true
  ),
  (
    'CASHIER',
    'Cashier and Billing',
    'Patient billing search, payments, receipts, refunds, and payment clearance.',
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active;

-- ============================================================
-- SEED ROLES
-- ============================================================

insert into public.app_roles (
  code,
  name,
  description,
  dashboard_path,
  is_system,
  active
)
values
  (
    'SYSTEM_ADMIN',
    'System Administrator',
    'Full GalenMed system, security, user, and configuration administration.',
    '/admin/dashboard',
    true,
    true
  ),
  (
    'RECEPTIONIST',
    'Receptionist',
    'Patient registration, intake, service routing, and authorized document release.',
    '/reception/dashboard',
    true,
    true
  ),
  (
    'DOCTOR',
    'Doctor',
    'Assigned patient queue, clinical record review, consultations, and prescriptions.',
    '/doctor/dashboard',
    true,
    true
  ),
  (
    'LABORATORY_STAFF',
    'Laboratory Staff',
    'Laboratory queue, specimen collection, and result entry.',
    '/laboratory/dashboard',
    true,
    true
  ),
  (
    'LABORATORY_VERIFIER',
    'Laboratory Verifier',
    'Laboratory result review, verification, and internal clinical finalization.',
    '/laboratory/dashboard',
    true,
    true
  ),
  (
    'CASHIER',
    'Cashier',
    'Billing search, payment posting, receipt issuance, refunds, and payment clearance.',
    '/cashier/dashboard',
    true,
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  dashboard_path = excluded.dashboard_path,
  is_system = excluded.is_system,
  active = excluded.active;

-- ============================================================
-- SEED PERMISSIONS
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
    'dashboard.view',
    'View Assigned Dashboard',
    'general',
    'Open the dashboard assigned to the current staff role.',
    false
  ),
  (
    'staff.accounts.view',
    'View Staff Accounts',
    'staff',
    'View staff profiles, statuses, and current assignments.',
    true
  ),
  (
    'staff.accounts.manage',
    'Manage Staff Accounts',
    'staff',
    'Invite, activate, lock, suspend, reactivate, or archive staff accounts.',
    true
  ),
  (
    'staff.roles.manage',
    'Manage Staff Roles',
    'staff',
    'Assign and revoke application roles.',
    true
  ),
  (
    'staff.assignments.manage',
    'Manage Staff Assignments',
    'staff',
    'Assign and revoke branches and departments.',
    true
  ),
  (
    'security.audit.view',
    'View Security Audit Logs',
    'security',
    'View authentication, security, and sensitive-access audit records.',
    true
  ),
  (
    'reception.dashboard.view',
    'View Reception Dashboard',
    'reception',
    'Open the receptionist workspace.',
    false
  ),
  (
    'reception.patient.register',
    'Register Patients',
    'reception',
    'Create patient registration records.',
    true
  ),
  (
    'reception.patient.search',
    'Search Patients',
    'reception',
    'Search for patients and open authorized intake information.',
    true
  ),
  (
    'reception.visit.create',
    'Create Hospital Visits',
    'reception',
    'Create hospital visits or encounters during intake.',
    true
  ),
  (
    'reception.service_request.create',
    'Create Service Requests',
    'reception',
    'Route a patient to consultation, laboratory, radiology, pharmacy, or other services.',
    true
  ),
  (
    'reception.queue.manage',
    'Manage Reception Queue',
    'reception',
    'Create and update front-desk queue entries.',
    true
  ),
  (
    'reception.release.view',
    'View Release Center',
    'reception',
    'View clinically finalized documents and payment-clearance state.',
    true
  ),
  (
    'reception.release.print',
    'Print Released Documents',
    'reception',
    'Print eligible finalized and payment-cleared patient documents.',
    true
  ),
  (
    'reception.release.complete',
    'Complete Document Release',
    'reception',
    'Record physical or digital release to the patient or authorized recipient.',
    true
  ),
  (
    'doctor.dashboard.view',
    'View Doctor Dashboard',
    'doctor',
    'Open the assigned doctor workspace.',
    false
  ),
  (
    'doctor.queue.view',
    'View Assigned Doctor Queue',
    'doctor',
    'View appointments and patients assigned to the current doctor.',
    true
  ),
  (
    'doctor.patient.view_assigned',
    'View Assigned Patient Clinical Record',
    'doctor',
    'View clinically relevant records for assigned patients.',
    true
  ),
  (
    'doctor.consultation.manage_assigned',
    'Manage Assigned Consultations',
    'doctor',
    'Start, document, and complete consultations assigned to the current doctor.',
    true
  ),
  (
    'doctor.prescription.create',
    'Create Prescriptions',
    'doctor',
    'Create prescription drafts for assigned patients.',
    true
  ),
  (
    'doctor.prescription.submit',
    'Submit Prescriptions',
    'doctor',
    'Submit prescription drafts for authorized review and release.',
    true
  ),
  (
    'laboratory.dashboard.view',
    'View Laboratory Dashboard',
    'laboratory',
    'Open the laboratory workspace.',
    false
  ),
  (
    'laboratory.queue.view',
    'View Laboratory Queue',
    'laboratory',
    'View patients and tests queued for the laboratory.',
    true
  ),
  (
    'laboratory.order.view',
    'View Laboratory Orders',
    'laboratory',
    'View requested laboratory tests and related patient details.',
    true
  ),
  (
    'laboratory.specimen.manage',
    'Manage Laboratory Specimens',
    'laboratory',
    'Collect, reject, and update laboratory specimen records.',
    true
  ),
  (
    'laboratory.result.enter',
    'Enter Laboratory Results',
    'laboratory',
    'Create and update laboratory result drafts.',
    true
  ),
  (
    'laboratory.result.verify',
    'Verify Laboratory Results',
    'laboratory',
    'Verify and clinically finalize laboratory results.',
    true
  ),
  (
    'laboratory.payment_status.view',
    'View Laboratory Payment Status',
    'laboratory',
    'View payment-clearance status without modifying financial records.',
    true
  ),
  (
    'cashier.dashboard.view',
    'View Cashier Dashboard',
    'cashier',
    'Open the cashier workspace.',
    false
  ),
  (
    'cashier.billing.search',
    'Search Patient Billing',
    'cashier',
    'Search patients, visits, invoices, service orders, and billing accounts.',
    true
  ),
  (
    'cashier.payment.record',
    'Record Payments',
    'cashier',
    'Record full or partial patient payments.',
    true
  ),
  (
    'cashier.receipt.issue',
    'Issue Official Receipts',
    'cashier',
    'Generate official receipts for posted payments.',
    true
  ),
  (
    'cashier.receipt.reprint',
    'Reprint Official Receipts',
    'cashier',
    'Reprint receipts with a recorded reason.',
    true
  ),
  (
    'cashier.refund.manage',
    'Manage Authorized Refunds',
    'cashier',
    'Record and process authorized patient refunds.',
    true
  ),
  (
    'cashier.clearance.manage',
    'Manage Payment Clearance',
    'cashier',
    'Set payment clearance used by the document release workflow.',
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  module = excluded.module,
  description = excluded.description,
  sensitive = excluded.sensitive;

-- ============================================================
-- SEED ROLE-PERMISSION MAPPINGS
-- ============================================================

insert into public.role_permissions (
  role_id,
  permission_id
)
select
  ar.id,
  ap.id
from public.app_roles ar
cross join public.app_permissions ap
where ar.code = 'SYSTEM_ADMIN'
on conflict do nothing;

with role_permission_codes (
  role_code,
  permission_code
) as (
  values
    ('RECEPTIONIST', 'dashboard.view'),
    ('RECEPTIONIST', 'reception.dashboard.view'),
    ('RECEPTIONIST', 'reception.patient.register'),
    ('RECEPTIONIST', 'reception.patient.search'),
    ('RECEPTIONIST', 'reception.visit.create'),
    ('RECEPTIONIST', 'reception.service_request.create'),
    ('RECEPTIONIST', 'reception.queue.manage'),
    ('RECEPTIONIST', 'reception.release.view'),
    ('RECEPTIONIST', 'reception.release.print'),
    ('RECEPTIONIST', 'reception.release.complete'),

    ('DOCTOR', 'dashboard.view'),
    ('DOCTOR', 'doctor.dashboard.view'),
    ('DOCTOR', 'doctor.queue.view'),
    ('DOCTOR', 'doctor.patient.view_assigned'),
    ('DOCTOR', 'doctor.consultation.manage_assigned'),
    ('DOCTOR', 'doctor.prescription.create'),
    ('DOCTOR', 'doctor.prescription.submit'),

    ('LABORATORY_STAFF', 'dashboard.view'),
    ('LABORATORY_STAFF', 'laboratory.dashboard.view'),
    ('LABORATORY_STAFF', 'laboratory.queue.view'),
    ('LABORATORY_STAFF', 'laboratory.order.view'),
    ('LABORATORY_STAFF', 'laboratory.specimen.manage'),
    ('LABORATORY_STAFF', 'laboratory.result.enter'),
    ('LABORATORY_STAFF', 'laboratory.payment_status.view'),

    ('LABORATORY_VERIFIER', 'dashboard.view'),
    ('LABORATORY_VERIFIER', 'laboratory.dashboard.view'),
    ('LABORATORY_VERIFIER', 'laboratory.queue.view'),
    ('LABORATORY_VERIFIER', 'laboratory.order.view'),
    ('LABORATORY_VERIFIER', 'laboratory.specimen.manage'),
    ('LABORATORY_VERIFIER', 'laboratory.result.enter'),
    ('LABORATORY_VERIFIER', 'laboratory.result.verify'),
    ('LABORATORY_VERIFIER', 'laboratory.payment_status.view'),

    ('CASHIER', 'dashboard.view'),
    ('CASHIER', 'cashier.dashboard.view'),
    ('CASHIER', 'cashier.billing.search'),
    ('CASHIER', 'cashier.payment.record'),
    ('CASHIER', 'cashier.receipt.issue'),
    ('CASHIER', 'cashier.receipt.reprint'),
    ('CASHIER', 'cashier.refund.manage'),
    ('CASHIER', 'cashier.clearance.manage')
)
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  ar.id,
  ap.id
from role_permission_codes rpc
join public.app_roles ar
  on ar.code = rpc.role_code
join public.app_permissions ap
  on ap.code = rpc.permission_code
on conflict do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.hospital_branches
  enable row level security;

alter table public.staff_departments
  enable row level security;

alter table public.app_roles
  enable row level security;

alter table public.app_permissions
  enable row level security;

alter table public.role_permissions
  enable row level security;

alter table public.staff_profiles
  enable row level security;

alter table public.staff_role_assignments
  enable row level security;

alter table public.staff_branch_assignments
  enable row level security;

alter table public.staff_department_assignments
  enable row level security;

alter table public.account_invitations
  enable row level security;

alter table public.login_audit_logs
  enable row level security;

alter table public.security_event_logs
  enable row level security;

revoke all
  on public.hospital_branches,
     public.staff_departments,
     public.app_roles,
     public.app_permissions,
     public.role_permissions,
     public.staff_profiles,
     public.staff_role_assignments,
     public.staff_branch_assignments,
     public.staff_department_assignments,
     public.account_invitations,
     public.login_audit_logs,
     public.security_event_logs
  from anon, authenticated;

grant select
  on public.hospital_branches,
     public.staff_departments,
     public.app_roles,
     public.app_permissions,
     public.role_permissions,
     public.staff_profiles,
     public.staff_role_assignments,
     public.staff_branch_assignments,
     public.staff_department_assignments,
     public.account_invitations,
     public.login_audit_logs,
     public.security_event_logs
  to authenticated;

drop policy if exists hospital_branches_select_active_staff
  on public.hospital_branches;

create policy hospital_branches_select_active_staff
on public.hospital_branches
for select
to authenticated
using (
  (select app_private.current_staff_is_active())
);

drop policy if exists staff_departments_select_active_staff
  on public.staff_departments;

create policy staff_departments_select_active_staff
on public.staff_departments
for select
to authenticated
using (
  (select app_private.current_staff_is_active())
);

drop policy if exists app_roles_select_active_staff
  on public.app_roles;

create policy app_roles_select_active_staff
on public.app_roles
for select
to authenticated
using (
  (select app_private.current_staff_is_active())
);

drop policy if exists app_permissions_select_active_staff
  on public.app_permissions;

create policy app_permissions_select_active_staff
on public.app_permissions
for select
to authenticated
using (
  (select app_private.current_staff_is_active())
);

drop policy if exists role_permissions_select_system_admin
  on public.role_permissions;

create policy role_permissions_select_system_admin
on public.role_permissions
for select
to authenticated
using (
  (select app_private.has_permission('staff.roles.manage'))
);

drop policy if exists staff_profiles_select_self_or_admin
  on public.staff_profiles;

create policy staff_profiles_select_self_or_admin
on public.staff_profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or
  (select app_private.has_permission('staff.accounts.view'))
);

drop policy if exists staff_role_assignments_select_self_or_admin
  on public.staff_role_assignments;

create policy staff_role_assignments_select_self_or_admin
on public.staff_role_assignments
for select
to authenticated
using (
  staff_id = (select auth.uid())
  or
  (select app_private.has_permission('staff.accounts.view'))
);

drop policy if exists staff_branch_assignments_select_self_or_admin
  on public.staff_branch_assignments;

create policy staff_branch_assignments_select_self_or_admin
on public.staff_branch_assignments
for select
to authenticated
using (
  staff_id = (select auth.uid())
  or
  (select app_private.has_permission('staff.accounts.view'))
);

drop policy if exists staff_department_assignments_select_self_or_admin
  on public.staff_department_assignments;

create policy staff_department_assignments_select_self_or_admin
on public.staff_department_assignments
for select
to authenticated
using (
  staff_id = (select auth.uid())
  or
  (select app_private.has_permission('staff.accounts.view'))
);

drop policy if exists account_invitations_select_admin
  on public.account_invitations;

create policy account_invitations_select_admin
on public.account_invitations
for select
to authenticated
using (
  (select app_private.has_permission('staff.accounts.manage'))
);

drop policy if exists login_audit_logs_select_self_or_admin
  on public.login_audit_logs;

create policy login_audit_logs_select_self_or_admin
on public.login_audit_logs
for select
to authenticated
using (
  user_id = (select auth.uid())
  or
  staff_id = (select auth.uid())
  or
  (select app_private.has_permission('security.audit.view'))
);

drop policy if exists security_event_logs_select_related_or_admin
  on public.security_event_logs;

create policy security_event_logs_select_related_or_admin
on public.security_event_logs
for select
to authenticated
using (
  actor_user_id = (select auth.uid())
  or
  target_user_id = (select auth.uid())
  or
  (select app_private.has_permission('security.audit.view'))
);

commit;
