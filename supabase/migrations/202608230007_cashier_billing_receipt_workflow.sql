-- GalenMed Healthcare OS
-- Migration 007: Cashier Billing, Payment Clearance, and Receipt Print Audit
-- Target: Supabase Postgres
-- Prerequisites: Migrations 001 through 006
-- Safety: no existing billing, payment, patient, or clinical-document rows are altered.

begin;

-- ============================================================
-- APPEND-ONLY CASHIER RECEIPT PRINT AUDIT
-- ============================================================

create table if not exists public.cashier_receipt_print_logs (
  id bigint generated always as identity primary key,
  payment_transaction_id uuid not null
    references public.payment_transactions(id)
    on delete restrict,
  billing_account_id uuid not null
    references public.billing_accounts(id)
    on delete restrict,
  patient_id uuid not null
    references public.patients(id)
    on delete restrict,
  branch_id text not null
    references public.hospital_branches(id)
    on delete restrict,
  official_receipt_number text not null,
  print_type text not null,
  copy_number integer not null,
  print_reason text,
  printed_by uuid not null
    references public.staff_profiles(id)
    on delete restrict,
  printed_at timestamptz not null default now(),
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  constraint cashier_receipt_print_logs_type_check
    check (print_type in ('original', 'reprint')),
  constraint cashier_receipt_print_logs_copy_number_check
    check (copy_number > 0),
  constraint cashier_receipt_print_logs_receipt_check
    check (length(trim(official_receipt_number)) between 2 and 100),
  constraint cashier_receipt_print_logs_reprint_reason_check
    check (
      print_type <> 'reprint'
      or nullif(trim(print_reason), '') is not null
    ),
  constraint cashier_receipt_print_logs_original_copy_check
    check (
      print_type <> 'original'
      or copy_number = 1
    )
);

comment on table public.cashier_receipt_print_logs is
  'Append-only audit of original and reprinted Cashier payment receipts.';

create unique index if not exists cashier_receipt_print_logs_payment_copy_unique_idx
  on public.cashier_receipt_print_logs (
    payment_transaction_id,
    copy_number
  );

create index if not exists cashier_receipt_print_logs_account_printed_idx
  on public.cashier_receipt_print_logs (
    billing_account_id,
    printed_at desc
  );

create index if not exists cashier_receipt_print_logs_patient_printed_idx
  on public.cashier_receipt_print_logs (
    patient_id,
    printed_at desc
  );

create index if not exists cashier_receipt_print_logs_staff_printed_idx
  on public.cashier_receipt_print_logs (
    printed_by,
    printed_at desc
  );

-- ============================================================
-- CONTEXT INTEGRITY AND APPEND-ONLY PROTECTION
-- ============================================================

create or replace function app_private.validate_cashier_receipt_print_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_payment public.payment_transactions%rowtype;
begin
  select *
  into v_payment
  from public.payment_transactions
  where id = new.payment_transaction_id;

  if not found then
    raise exception 'Payment transaction was not found.';
  end if;

  if v_payment.status <> 'posted' then
    raise exception 'Only a posted payment can produce a receipt print record.';
  end if;

  if v_payment.official_receipt_number is null then
    raise exception 'The payment has no official receipt reference.';
  end if;

  if new.billing_account_id <> v_payment.billing_account_id
     or new.patient_id <> v_payment.patient_id
     or new.branch_id <> v_payment.branch_id
     or new.official_receipt_number <> v_payment.official_receipt_number then
    raise exception 'Receipt print context is inconsistent with the payment transaction.';
  end if;

  return new;
end;
$$;

drop trigger if exists cashier_receipt_print_logs_validate_context
  on public.cashier_receipt_print_logs;

create trigger cashier_receipt_print_logs_validate_context
before insert on public.cashier_receipt_print_logs
for each row
execute function app_private.validate_cashier_receipt_print_context();

drop trigger if exists cashier_receipt_print_logs_reject_mutation
  on public.cashier_receipt_print_logs;

create trigger cashier_receipt_print_logs_reject_mutation
before update or delete on public.cashier_receipt_print_logs
for each row
execute function app_private.reject_audit_mutation();

-- ============================================================
-- GUARDED RECEIPT PRINT RPC
-- ============================================================

create or replace function public.cashier_record_receipt_print(
  p_idempotency_key text,
  p_payment_transaction_id uuid,
  p_print_type text,
  p_print_reason text default null,
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
  v_type text;
  v_payment public.payment_transactions%rowtype;
  v_account public.billing_accounts%rowtype;
  v_existing public.cashier_receipt_print_logs%rowtype;
  v_print_log public.cashier_receipt_print_logs%rowtype;
  v_existing_count integer;
  v_copy_number integer;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  v_type := lower(trim(p_print_type));

  perform pg_advisory_xact_lock(
    hashtextextended(
      'cashier-receipt-print:' || p_payment_transaction_id::text,
      0
    )
  );

  select *
  into v_existing
  from public.cashier_receipt_print_logs
  where idempotency_key = v_key;

  if found then
    return jsonb_build_object(
      'idempotent_replay', true,
      'print_log_id', v_existing.id,
      'payment_transaction_id', v_existing.payment_transaction_id,
      'official_receipt_number', v_existing.official_receipt_number,
      'print_type', v_existing.print_type,
      'copy_number', v_existing.copy_number,
      'printed_at', v_existing.printed_at
    );
  end if;

  select *
  into v_payment
  from public.payment_transactions
  where id = p_payment_transaction_id;

  if not found then
    raise exception 'Payment transaction was not found.';
  end if;

  select *
  into v_account
  from public.billing_accounts
  where id = v_payment.billing_account_id;

  if not found then
    raise exception 'Billing account was not found.';
  end if;

  if v_payment.status <> 'posted' then
    raise exception 'Only a posted payment can be printed.';
  end if;

  if v_payment.official_receipt_number is null then
    raise exception 'The payment has no official receipt reference.';
  end if;

  if v_type not in ('original', 'reprint') then
    raise exception 'Unsupported receipt print type.';
  end if;

  if v_type = 'original' then
    v_actor := app_private.require_staff_permission(
      'cashier.receipt.issue',
      v_payment.branch_id
    );
  else
    v_actor := app_private.require_staff_permission(
      'cashier.receipt.reprint',
      v_payment.branch_id
    );

    if nullif(trim(p_print_reason), '') is null then
      raise exception 'A receipt reprint reason is required.';
    end if;
  end if;

  select count(*)::integer
  into v_existing_count
  from public.cashier_receipt_print_logs
  where payment_transaction_id = v_payment.id;

  if v_existing_count = 0 and v_type <> 'original' then
    raise exception 'The first receipt print must be recorded as original.';
  end if;

  if v_existing_count > 0 and v_type <> 'reprint' then
    raise exception 'The original receipt has already been printed. Use receipt reprint.';
  end if;

  v_copy_number := v_existing_count + 1;

  insert into public.cashier_receipt_print_logs (
    payment_transaction_id,
    billing_account_id,
    patient_id,
    branch_id,
    official_receipt_number,
    print_type,
    copy_number,
    print_reason,
    printed_by,
    idempotency_key,
    metadata
  )
  values (
    v_payment.id,
    v_payment.billing_account_id,
    v_payment.patient_id,
    v_payment.branch_id,
    v_payment.official_receipt_number,
    v_type,
    v_copy_number,
    nullif(trim(p_print_reason), ''),
    v_actor,
    v_key,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_print_log;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    case
      when v_type = 'original' then 'cashier.receipt_printed'
      else 'cashier.receipt_reprinted'
    end,
    format(
      'Receipt %s copy %s was recorded for printing.',
      v_payment.official_receipt_number,
      v_copy_number
    ),
    v_payment.patient_id,
    v_payment.branch_id,
    v_payment.visit_id,
    null,
    v_payment.billing_account_id,
    null,
    null,
    jsonb_build_object(
      'payment_transaction_id', v_payment.id,
      'payment_number', v_payment.payment_number,
      'official_receipt_number', v_payment.official_receipt_number,
      'print_type', v_type,
      'copy_number', v_copy_number,
      'printed_at', v_print_log.printed_at
    ),
    jsonb_build_object(
      'print_reason', v_print_log.print_reason,
      'idempotency_key', v_key
    )
  );

  return jsonb_build_object(
    'idempotent_replay', false,
    'print_log_id', v_print_log.id,
    'payment_transaction_id', v_print_log.payment_transaction_id,
    'official_receipt_number', v_print_log.official_receipt_number,
    'print_type', v_print_log.print_type,
    'copy_number', v_print_log.copy_number,
    'printed_at', v_print_log.printed_at
  );
end;
$$;

revoke all
  on function public.cashier_record_receipt_print(text, uuid, text, text, jsonb)
  from public, anon;

grant execute
  on function public.cashier_record_receipt_print(text, uuid, text, text, jsonb)
  to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.cashier_receipt_print_logs
  enable row level security;

revoke all
  on public.cashier_receipt_print_logs
  from anon, authenticated;

grant select
  on public.cashier_receipt_print_logs
  to authenticated;

drop policy if exists cashier_receipt_print_logs_select_cashier_or_admin
  on public.cashier_receipt_print_logs;

create policy cashier_receipt_print_logs_select_cashier_or_admin
on public.cashier_receipt_print_logs
for select
to authenticated
using (
  (select app_private.has_branch_access(branch_id))
  and (
    (select app_private.is_system_admin())
    or (select app_private.has_permission('cashier.receipt.issue'))
    or (select app_private.has_permission('cashier.receipt.reprint'))
  )
);

commit;
