-- Allow Cashier zero-amount waivers while preserving admin-only waivers for non-zero charges.

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

  v_actor := app_private.require_staff_permission(
    'cashier.clearance.manage',
    v_clearance.branch_id
  );

  v_status := lower(trim(p_clearance_status));

  if v_status not in (
    'pending',
    'partially_cleared',
    'cleared',
    'waived',
    'blocked',
    'revoked'
  ) then
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
    if
      v_clearance.required_amount_centavos > 0
      and not app_private.is_system_admin()
    then
      raise exception 'Only a SYSTEM_ADMIN can waive a non-zero payment clearance.';
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
    format(
      'Payment clearance for service request %s was changed to %s.',
      p_service_request_id,
      v_status
    ),
    v_clearance.patient_id,
    v_clearance.branch_id,
    v_clearance.visit_id,
    v_clearance.service_request_id,
    null,
    v_before,
    jsonb_build_object(
      'clearance_status', v_clearance.clearance_status,
      'required_amount_centavos', v_clearance.required_amount_centavos,
      'cleared_amount_centavos', v_clearance.cleared_amount_centavos
    )
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
