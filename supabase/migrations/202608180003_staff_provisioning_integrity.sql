-- GalenMed Healthcare OS
-- Migration 003: Correct first-time staff provisioning classification
-- Depends on: 202608180002_staff_account_management.sql
--
-- Root cause fixed:
-- auth.users creation triggers an invited staff_profiles row before
-- provision_staff_account() runs. Migration 002 treated that row as an
-- already-provisioned account, skipping the invitation audit record,
-- leaving created_by null, and logging account_reactivated for new staff.

begin;

create or replace function public.provision_staff_account(
  p_staff_id uuid,
  p_employee_id text,
  p_full_name text,
  p_work_email text,
  p_mobile_number text,
  p_job_title text,
  p_role_code text,
  p_branch_ids text[],
  p_primary_branch_id text,
  p_department_codes text[],
  p_reason text default 'Staff account provisioned by System Administrator.'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_auth_email text;
  v_role_id uuid;
  v_normalized_role_code text;
  v_required_department_code text;
  v_profile_was_provisioned boolean;
  v_now timestamptz := now();
  v_branch_id text;
  v_department_code text;
begin
  v_actor_id := app_private.require_system_admin('staff.accounts.manage');

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
    raise exception 'Use the dedicated administrator profile flow to change your own account.';
  end if;

  if nullif(trim(p_employee_id), '') is null then
    raise exception 'Employee ID is required.';
  end if;

  if trim(p_employee_id) !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'Employee ID may contain letters, numbers, underscores, and hyphens only.';
  end if;

  if nullif(trim(p_full_name), '') is null then
    raise exception 'Full name is required.';
  end if;

  if nullif(trim(p_work_email), '') is null then
    raise exception 'Work email is required.';
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

  v_normalized_role_code := upper(trim(p_role_code));

  if v_normalized_role_code = 'SYSTEM_ADMIN' then
    raise exception 'Additional SYSTEM_ADMIN accounts require a separate privileged approval flow.';
  end if;

  select ar.id
  into v_role_id
  from public.app_roles ar
  where ar.code = v_normalized_role_code
    and ar.active;

  if v_role_id is null then
    raise exception 'The selected operational staff role is invalid or inactive.';
  end if;

  if coalesce(array_length(p_branch_ids, 1), 0) = 0 then
    raise exception 'At least one hospital branch is required.';
  end if;

  if p_primary_branch_id is null
     or not (p_primary_branch_id = any(p_branch_ids)) then
    raise exception 'The primary branch must be included in the assigned branches.';
  end if;

  if cardinality(p_branch_ids) <> (
    select count(distinct requested_branch_id)
    from unnest(p_branch_ids) requested_branch_id
  ) then
    raise exception 'Duplicate hospital branch assignments are not allowed.';
  end if;

  if exists (
    select 1
    from unnest(p_branch_ids) requested_branch_id
    left join public.hospital_branches hb
      on hb.id = requested_branch_id
     and hb.active
    where hb.id is null
  ) then
    raise exception 'One or more selected hospital branches are invalid or inactive.';
  end if;

  if coalesce(array_length(p_department_codes, 1), 0) = 0 then
    raise exception 'At least one staff department is required.';
  end if;

  if cardinality(p_department_codes) <> (
    select count(distinct upper(requested_department_code))
    from unnest(p_department_codes) requested_department_code
  ) then
    raise exception 'Duplicate staff department assignments are not allowed.';
  end if;

  if exists (
    select 1
    from unnest(p_department_codes) requested_department_code
    left join public.staff_departments sd
      on sd.code = upper(requested_department_code)
     and sd.active
    where sd.id is null
  ) then
    raise exception 'One or more selected staff departments are invalid or inactive.';
  end if;

  v_required_department_code :=
    case v_normalized_role_code
      when 'RECEPTIONIST' then 'FRONT_DESK'
      when 'DOCTOR' then 'MEDICINE'
      when 'LABORATORY_STAFF' then 'LABORATORY'
      when 'LABORATORY_VERIFIER' then 'LABORATORY'
      when 'CASHIER' then 'CASHIER'
      else null
    end;

  if v_required_department_code is null
     or not exists (
       select 1
       from unnest(p_department_codes) requested_department_code
       where upper(requested_department_code) = v_required_department_code
     ) then
    raise exception 'The selected role requires the % department.', v_required_department_code;
  end if;

  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = p_staff_id
      and (
        sp.employee_id is not null
        or exists (
          select 1
          from public.staff_role_assignments existing_assignment
          where existing_assignment.staff_id = sp.id
            and existing_assignment.active
        )
      )
  )
  into v_profile_was_provisioned;

  insert into public.staff_profiles (
    id,
    employee_id,
    full_name,
    work_email,
    mobile_number,
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
    nullif(trim(p_mobile_number), ''),
    nullif(trim(p_job_title), ''),
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
    mobile_number = excluded.mobile_number,
    job_title = excluded.job_title,
    account_status = 'active',
    invited_at = coalesce(
      public.staff_profiles.invited_at,
      v_now
    ),
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
    nullif(trim(p_reason), '')
  );

  update public.staff_branch_assignments
  set
    active = false,
    revoked_at = v_now,
    revoked_by = v_actor_id
  where staff_id = p_staff_id
    and active;

  foreach v_branch_id in array p_branch_ids
  loop
    insert into public.staff_branch_assignments (
      staff_id,
      branch_id,
      is_primary,
      active,
      assigned_at,
      assigned_by
    )
    values (
      p_staff_id,
      v_branch_id,
      v_branch_id = p_primary_branch_id,
      true,
      v_now,
      v_actor_id
    );
  end loop;

  update public.staff_department_assignments
  set
    active = false,
    revoked_at = v_now,
    revoked_by = v_actor_id
  where staff_id = p_staff_id
    and active;

  foreach v_department_code in array p_department_codes
  loop
    insert into public.staff_department_assignments (
      staff_id,
      department_id,
      active,
      assigned_at,
      assigned_by
    )
    select
      p_staff_id,
      sd.id,
      true,
      v_now,
      v_actor_id
    from public.staff_departments sd
    where sd.code = upper(v_department_code)
      and sd.active;
  end loop;

  if not v_profile_was_provisioned then
    insert into public.account_invitations (
      email,
      employee_id,
      full_name,
      requested_role_code,
      requested_branch_ids,
      requested_department_codes,
      status,
      auth_user_id,
      invited_by,
      accepted_at,
      metadata
    )
    values (
      lower(trim(p_work_email)),
      upper(trim(p_employee_id)),
      trim(p_full_name),
      v_normalized_role_code,
      p_branch_ids,
      array(
        select upper(code)
        from unnest(p_department_codes) code
      ),
      'accepted',
      p_staff_id,
      v_actor_id,
      v_now,
      jsonb_build_object(
        'provisioning_mode', 'system_admin_create_user',
        'reason', nullif(trim(p_reason), '')
      )
    );
  end if;

  insert into public.security_event_logs (
    actor_user_id,
    target_user_id,
    event_type,
    severity,
    summary,
    metadata
  )
  values
    (
      v_actor_id,
      p_staff_id,
      case
        when v_profile_was_provisioned then 'account_reactivated'
        else 'account_activated'
      end,
      'critical',
      case
        when v_profile_was_provisioned then 'Staff account was updated and activated.'
        else 'Staff account was provisioned and activated.'
      end,
      jsonb_build_object(
        'employee_id', upper(trim(p_employee_id)),
        'role_code', v_normalized_role_code
      )
    ),
    (
      v_actor_id,
      p_staff_id,
      'role_changed',
      'critical',
      'Staff role assignment was updated.',
      jsonb_build_object(
        'role_code', v_normalized_role_code
      )
    ),
    (
      v_actor_id,
      p_staff_id,
      'branch_assignment_changed',
      'warning',
      'Staff branch assignments were updated.',
      jsonb_build_object(
        'branch_ids', p_branch_ids,
        'primary_branch_id', p_primary_branch_id
      )
    ),
    (
      v_actor_id,
      p_staff_id,
      'department_assignment_changed',
      'warning',
      'Staff department assignments were updated.',
      jsonb_build_object(
        'department_codes', p_department_codes
      )
    );

  return jsonb_build_object(
    'staff_id', p_staff_id,
    'employee_id', upper(trim(p_employee_id)),
    'full_name', trim(p_full_name),
    'work_email', lower(trim(p_work_email)),
    'account_status', 'active',
    'role_code', v_normalized_role_code,
    'branch_ids', p_branch_ids,
    'primary_branch_id', p_primary_branch_id,
    'department_codes', array(
      select upper(code)
      from unnest(p_department_codes) code
    )
  );
end;
$$;

revoke all
  on function public.provision_staff_account(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text[],
    text,
    text[],
    text
  )
  from public, anon;

grant execute
  on function public.provision_staff_account(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text[],
    text,
    text[],
    text
  )
  to authenticated;

commit;
