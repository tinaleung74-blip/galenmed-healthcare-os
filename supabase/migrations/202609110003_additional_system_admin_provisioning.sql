begin;

create or replace function public.provision_additional_system_admin(
  p_staff_id uuid,
  p_employee_id text,
  p_full_name text,
  p_work_email text,
  p_reason text default 'Additional UAT SYSTEM_ADMIN approved by existing System Administrator.'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_auth_email text;
  v_role_id uuid;
  v_admin_department_id uuid;
  v_now timestamptz := now();
begin
  v_actor_id :=
    app_private.require_system_admin(
      'staff.accounts.manage'
    );

  if not app_private.has_permission('staff.roles.manage') then
    raise exception 'Required permission is missing: staff.roles.manage';
  end if;

  if not app_private.has_permission('staff.assignments.manage') then
    raise exception 'Required permission is missing: staff.assignments.manage';
  end if;

  if p_staff_id is null then
    raise exception 'Staff Auth user ID is required.';
  end if;

  if p_staff_id = v_actor_id then
    raise exception 'The approving administrator cannot provision their own account.';
  end if;

  select lower(au.email)
  into v_auth_email
  from auth.users au
  where au.id = p_staff_id;

  if v_auth_email is null then
    raise exception 'The target Supabase Auth user was not found.';
  end if;

  if v_auth_email <> lower(trim(p_work_email)) then
    raise exception 'The supplied work email does not match the Auth user email.';
  end if;

  select ar.id
  into v_role_id
  from public.app_roles ar
  where ar.code = 'SYSTEM_ADMIN'
    and ar.active;

  if v_role_id is null then
    raise exception 'SYSTEM_ADMIN role is missing or inactive.';
  end if;

  select sd.id
  into v_admin_department_id
  from public.staff_departments sd
  where sd.code = 'ADMIN'
    and sd.active;

  if v_admin_department_id is null then
    raise exception 'ADMIN department is missing or inactive.';
  end if;

  insert into public.staff_profiles (
    id,
    employee_id,
    full_name,
    work_email,
    job_title,
    account_status,
    invited_at,
    activated_at,
    created_by,
    updated_by
  )
  values (
    p_staff_id,
    upper(trim(p_employee_id)),
    trim(p_full_name),
    lower(trim(p_work_email)),
    'System Administrator',
    'active',
    v_now,
    v_now,
    v_actor_id,
    v_actor_id
  )
  on conflict (id) do update
  set
    employee_id = excluded.employee_id,
    full_name = excluded.full_name,
    work_email = excluded.work_email,
    job_title = excluded.job_title,
    account_status = 'active',
    activated_at = coalesce(
      public.staff_profiles.activated_at,
      v_now
    ),
    suspended_at = null,
    archived_at = null,
    created_by = coalesce(
      public.staff_profiles.created_by,
      v_actor_id
    ),
    updated_by = v_actor_id;

  update public.staff_role_assignments
  set
    active = false,
    revoked_at = v_now,
    revoked_by = v_actor_id
  where staff_id = p_staff_id
    and active;

  insert into public.staff_role_assignments (
    staff_id,
    role_id,
    active,
    assigned_at,
    assigned_by,
    assignment_reason
  )
  values (
    p_staff_id,
    v_role_id,
    true,
    v_now,
    v_actor_id,
    trim(p_reason)
  );

  update public.staff_branch_assignments
  set
    active = false,
    revoked_at = v_now,
    revoked_by = v_actor_id
  where staff_id = p_staff_id
    and active;

  insert into public.staff_branch_assignments (
    staff_id,
    branch_id,
    is_primary,
    active,
    assigned_at,
    assigned_by
  )
  select
    p_staff_id,
    hb.id,
    hb.id = 'branch-makati',
    true,
    v_now,
    v_actor_id
  from public.hospital_branches hb
  where hb.active;

  update public.staff_department_assignments
  set
    active = false,
    revoked_at = v_now,
    revoked_by = v_actor_id
  where staff_id = p_staff_id
    and active;

  insert into public.staff_department_assignments (
    staff_id,
    department_id,
    active,
    assigned_at,
    assigned_by
  )
  values (
    p_staff_id,
    v_admin_department_id,
    true,
    v_now,
    v_actor_id
  );

  insert into public.security_event_logs (
    actor_user_id,
    target_user_id,
    event_type,
    severity,
    summary,
    metadata
  )
  values (
    v_actor_id,
    p_staff_id,
    'account_activated',
    'critical',
    'Additional SYSTEM_ADMIN account was provisioned.',
    jsonb_build_object(
      'employee_id', upper(trim(p_employee_id)),
      'role_code', 'SYSTEM_ADMIN',
      'work_email', lower(trim(p_work_email)),
      'reason', trim(p_reason)
    )
  );

  return p_staff_id;
end;
$$;

revoke all
  on function public.provision_additional_system_admin(
    uuid,
    text,
    text,
    text,
    text
  )
  from public, anon, service_role;

grant execute
  on function public.provision_additional_system_admin(
    uuid,
    text,
    text,
    text,
    text
  )
  to authenticated;

commit;
