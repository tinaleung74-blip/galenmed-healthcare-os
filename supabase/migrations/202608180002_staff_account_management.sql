-- GalenMed Healthcare OS
-- Migration 002: Trusted Staff Account Provisioning and Administration
-- Target: Supabase Postgres
-- Depends on: 202608110001_staff_auth_rbac.sql
-- Safety: no clinical tables are altered. Staff and audit records remain append-only/history-safe.

begin;

-- ============================================================
-- SYSTEM ADMIN ASSERTION
-- ============================================================

create or replace function app_private.require_system_admin(
  requested_permission_code text default null
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  if not app_private.is_system_admin() then
    raise exception 'SYSTEM_ADMIN access is required.';
  end if;

  if
    requested_permission_code is not null
    and not app_private.has_permission(requested_permission_code)
  then
    raise exception 'Required permission is missing: %', requested_permission_code;
  end if;

  return v_actor_id;
end;
$$;

revoke all
  on function app_private.require_system_admin(text)
  from public, anon;

grant execute
  on function app_private.require_system_admin(text)
  to authenticated;

-- ============================================================
-- STAFF MANAGEMENT READ MODEL
-- ============================================================

create or replace function public.get_staff_management_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app_private.require_system_admin('staff.accounts.view');

  return jsonb_build_object(
    'staff',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', sp.id,
              'employee_id', sp.employee_id,
              'full_name', sp.full_name,
              'work_email', sp.work_email,
              'mobile_number', sp.mobile_number,
              'job_title', sp.job_title,
              'account_status', sp.account_status,
              'last_login_at', sp.last_login_at,
              'invited_at', sp.invited_at,
              'activated_at', sp.activated_at,
              'created_at', sp.created_at,
              'updated_at', sp.updated_at,
              'roles',
                coalesce(
                  (
                    select jsonb_agg(
                      jsonb_build_object(
                        'code', ar.code,
                        'name', ar.name,
                        'dashboard_path', ar.dashboard_path
                      )
                      order by ar.name
                    )
                    from public.staff_role_assignments sra
                    join public.app_roles ar
                      on ar.id = sra.role_id
                     and ar.active
                    where sra.staff_id = sp.id
                      and sra.active
                  ),
                  '[]'::jsonb
                ),
              'branches',
                coalesce(
                  (
                    select jsonb_agg(
                      jsonb_build_object(
                        'id', hb.id,
                        'code', hb.code,
                        'name', hb.name,
                        'is_primary', sba.is_primary
                      )
                      order by
                        sba.is_primary desc,
                        hb.name
                    )
                    from public.staff_branch_assignments sba
                    join public.hospital_branches hb
                      on hb.id = sba.branch_id
                     and hb.active
                    where sba.staff_id = sp.id
                      and sba.active
                  ),
                  '[]'::jsonb
                ),
              'departments',
                coalesce(
                  (
                    select jsonb_agg(
                      jsonb_build_object(
                        'id', sd.id,
                        'code', sd.code,
                        'name', sd.name
                      )
                      order by sd.name
                    )
                    from public.staff_department_assignments sda
                    join public.staff_departments sd
                      on sd.id = sda.department_id
                     and sd.active
                    where sda.staff_id = sp.id
                      and sda.active
                  ),
                  '[]'::jsonb
                )
            )
            order by sp.full_name
          )
          from public.staff_profiles sp
        ),
        '[]'::jsonb
      ),
    'roles',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'code', ar.code,
              'name', ar.name,
              'description', ar.description,
              'dashboard_path', ar.dashboard_path
            )
            order by ar.name
          )
          from public.app_roles ar
          where ar.active
            and ar.code <> 'SYSTEM_ADMIN'
        ),
        '[]'::jsonb
      ),
    'branches',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', hb.id,
              'code', hb.code,
              'name', hb.name,
              'short_name', hb.short_name,
              'city', hb.city
            )
            order by hb.name
          )
          from public.hospital_branches hb
          where hb.active
        ),
        '[]'::jsonb
      ),
    'departments',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', sd.id,
              'code', sd.code,
              'name', sd.name,
              'description', sd.description
            )
            order by sd.name
          )
          from public.staff_departments sd
          where sd.active
        ),
        '[]'::jsonb
      )
  );
end;
$$;

revoke all
  on function public.get_staff_management_data()
  from public, anon;

grant execute
  on function public.get_staff_management_data()
  to authenticated;

-- ============================================================
-- PROVISION OR UPDATE AN OPERATIONAL STAFF ACCOUNT
-- Auth user creation remains server-only through the Supabase
-- Auth Admin API. This function configures the application-side
-- profile, role, branch, department, and audit records.
-- ============================================================

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
  v_profile_existed boolean;
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
  )
  into v_profile_existed;

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
    activated_at = coalesce(
      public.staff_profiles.activated_at,
      v_now
    ),
    suspended_at = null,
    archived_at = null,
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

  if not v_profile_existed then
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
        when v_profile_existed then 'account_reactivated'
        else 'account_activated'
      end,
      'critical',
      case
        when v_profile_existed then 'Staff account was updated and activated.'
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

-- ============================================================
-- ACCOUNT STATUS CONTROL
-- ============================================================

create or replace function public.set_staff_account_status(
  p_staff_id uuid,
  p_status text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_existing_status text;
  v_normalized_status text;
  v_event_type text;
  v_now timestamptz := now();
begin
  v_actor_id := app_private.require_system_admin('staff.accounts.manage');
  v_normalized_status := lower(trim(p_status));

  if p_staff_id is null then
    raise exception 'Staff ID is required.';
  end if;

  if p_staff_id = v_actor_id then
    raise exception 'You cannot change your own account status from this control.';
  end if;

  if v_normalized_status not in (
    'active',
    'locked',
    'suspended',
    'archived'
  ) then
    raise exception 'Unsupported staff account status.';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'A reason is required for staff account status changes.';
  end if;

  select sp.account_status
  into v_existing_status
  from public.staff_profiles sp
  where sp.id = p_staff_id;

  if v_existing_status is null then
    raise exception 'The selected staff profile was not found.';
  end if;

  if v_existing_status = 'archived' and v_normalized_status = 'active' then
    raise exception 'An archived staff account must be reprovisioned with role, branch, and department assignments.';
  end if;

  if v_existing_status = v_normalized_status then
    return jsonb_build_object(
      'staff_id', p_staff_id,
      'account_status', v_existing_status,
      'changed', false
    );
  end if;

  v_event_type :=
    case v_normalized_status
      when 'locked' then 'account_locked'
      when 'suspended' then 'account_suspended'
      when 'archived' then 'account_archived'
      when 'active' then
        case
          when v_existing_status = 'locked' then 'account_unlocked'
          else 'account_reactivated'
        end
    end;

  update public.staff_profiles
  set
    account_status = v_normalized_status,
    suspended_at = case
      when v_normalized_status = 'suspended' then v_now
      when v_normalized_status = 'active' then null
      else suspended_at
    end,
    archived_at = case
      when v_normalized_status = 'archived' then v_now
      when v_normalized_status = 'active' then null
      else archived_at
    end,
    updated_by = v_actor_id
  where id = p_staff_id;

  if v_normalized_status = 'archived' then
    update public.staff_role_assignments
    set
      active = false,
      revoked_at = v_now,
      revoked_by = v_actor_id
    where staff_id = p_staff_id
      and active;

    update public.staff_branch_assignments
    set
      active = false,
      revoked_at = v_now,
      revoked_by = v_actor_id
    where staff_id = p_staff_id
      and active;

    update public.staff_department_assignments
    set
      active = false,
      revoked_at = v_now,
      revoked_by = v_actor_id
    where staff_id = p_staff_id
      and active;
  end if;

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
    v_event_type,
    'critical',
    'Staff account status changed from '
      || v_existing_status
      || ' to '
      || v_normalized_status
      || '.',
    jsonb_build_object(
      'previous_status', v_existing_status,
      'new_status', v_normalized_status,
      'reason', trim(p_reason)
    )
  );

  return jsonb_build_object(
    'staff_id', p_staff_id,
    'previous_status', v_existing_status,
    'account_status', v_normalized_status,
    'changed', true
  );
end;
$$;

revoke all
  on function public.set_staff_account_status(uuid, text, text)
  from public, anon;

grant execute
  on function public.set_staff_account_status(uuid, text, text)
  to authenticated;

commit;
