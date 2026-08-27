-- GalenMed Healthcare OS
-- Migration 006: Laboratory Result Draft, Review, Verification, and Release-State Workflow
-- Target: Supabase Postgres
-- Safety: no existing patient, visit, queue, billing, or legacy clinical tables are deleted.

begin;

-- ============================================================
-- PRIVATE IDEMPOTENCY LEDGER
-- ============================================================

create table if not exists app_private.laboratory_result_operation_keys (
  idempotency_key text primary key,
  operation_type text not null,
  document_id uuid not null
    references public.clinical_documents(id)
    on delete restrict,
  actor_user_id uuid not null
    references auth.users(id)
    on delete restrict,
  response_payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint laboratory_result_operation_keys_type_check
    check (
      operation_type in (
        'save_draft',
        'submit_for_verification',
        'return_for_correction',
        'finalize_result'
      )
    )
);

comment on table app_private.laboratory_result_operation_keys is
  'Private append-only idempotency ledger for guarded Laboratory result workflow operations.';

revoke all
  on app_private.laboratory_result_operation_keys
  from public, anon, authenticated;

drop trigger if exists laboratory_result_operation_keys_reject_mutation
  on app_private.laboratory_result_operation_keys;

create trigger laboratory_result_operation_keys_reject_mutation
before update or delete
on app_private.laboratory_result_operation_keys
for each row
execute function app_private.reject_audit_mutation();

-- ============================================================
-- RESULT-METADATA VALIDATION
-- ============================================================

create or replace function app_private.require_laboratory_result_metadata(
  p_metadata jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_item jsonb;
  v_flag text;
  v_result_count integer := 0;
begin
  if p_metadata is null
     or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'Laboratory result metadata must be a JSON object.';
  end if;

  if nullif(trim(p_metadata ->> 'specimen_type'), '') is null then
    raise exception 'Laboratory specimen type is required.';
  end if;

  if not (p_metadata ? 'result_items')
     or jsonb_typeof(p_metadata -> 'result_items') <> 'array' then
    raise exception 'Laboratory result_items must be a JSON array.';
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_metadata -> 'result_items')
  loop
    v_result_count := v_result_count + 1;

    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Every Laboratory result item must be a JSON object.';
    end if;

    if nullif(trim(v_item ->> 'test_name'), '') is null then
      raise exception 'Every Laboratory result item requires a test_name.';
    end if;

    if nullif(trim(v_item ->> 'result_value'), '') is null then
      raise exception 'Every Laboratory result item requires a result_value.';
    end if;

    v_flag := lower(
      coalesce(
        nullif(trim(v_item ->> 'flag'), ''),
        'not_applicable'
      )
    );

    if v_flag not in (
      'normal',
      'high',
      'low',
      'abnormal',
      'critical',
      'not_applicable'
    ) then
      raise exception 'Unsupported Laboratory result flag: %.', v_flag;
    end if;
  end loop;

  if v_result_count = 0 then
    raise exception 'At least one Laboratory result item is required.';
  end if;

  return p_metadata || jsonb_build_object(
    'schema_version', 1,
    'result_item_count', v_result_count
  );
end;
$$;

revoke all
  on function app_private.require_laboratory_result_metadata(jsonb)
  from public, anon;

grant execute
  on function app_private.require_laboratory_result_metadata(jsonb)
  to authenticated;

-- ============================================================
-- SAVE OR UPDATE RESULT DRAFT
-- ============================================================

create or replace function public.laboratory_save_result_draft(
  p_idempotency_key text,
  p_service_request_id uuid,
  p_document_id uuid,
  p_title text,
  p_specimen_type text,
  p_collection_reference text,
  p_result_items jsonb,
  p_interpretation text,
  p_notes text
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
  v_existing_document public.clinical_documents%rowtype;
  v_operation app_private.laboratory_result_operation_keys%rowtype;
  v_metadata jsonb;
  v_response jsonb;
  v_register_response jsonb;
  v_before jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended('laboratory-result-save:' || v_key, 0)
  );

  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('laboratory.result.enter')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot enter Laboratory results.';
  end if;

  select *
  into v_operation
  from app_private.laboratory_result_operation_keys
  where idempotency_key = v_key;

  if found then
    return v_operation.response_payload ||
      jsonb_build_object('idempotent_replay', true);
  end if;

  select *
  into v_request
  from public.service_requests
  where id = p_service_request_id;

  if not found then
    raise exception 'Laboratory service request was not found.';
  end if;

  if v_request.service_type <> 'laboratory' then
    raise exception 'The selected service request is not a Laboratory request.';
  end if;

  if v_request.status not in ('in_progress', 'completed') then
    raise exception 'Laboratory results can be entered only after service has started.';
  end if;

  if not app_private.has_branch_access(v_request.branch_id) then
    raise exception 'The current staff account has no access to this branch.';
  end if;

  if nullif(trim(p_title), '') is null
     or length(trim(p_title)) < 2 then
    raise exception 'A Laboratory result title is required.';
  end if;

  v_metadata := jsonb_build_object(
    'schema_version', 1,
    'specimen_type', trim(p_specimen_type),
    'collection_reference', nullif(trim(p_collection_reference), ''),
    'result_items', coalesce(p_result_items, '[]'::jsonb),
    'interpretation', nullif(trim(p_interpretation), ''),
    'notes', nullif(trim(p_notes), ''),
    'entry_status', 'draft',
    'entered_by', v_actor,
    'entered_at', now()
  );

  v_metadata := app_private.require_laboratory_result_metadata(v_metadata);

  if p_document_id is null then
    select *
    into v_existing_document
    from public.clinical_documents
    where service_request_id = v_request.id
      and document_type = 'laboratory_result'
      and status not in ('superseded', 'voided')
    order by version_number desc, created_at desc
    limit 1;

    if found then
      raise exception 'An active Laboratory result already exists for this service request. Refresh and edit the existing result.';
    end if;

    select public.clinical_register_document(
      v_key,
      v_request.id,
      'laboratory_result',
      trim(p_title),
      'hospital_operations.laboratory',
      v_request.id::text,
      'sensitive',
      true,
      null,
      null,
      v_metadata
    )
    into v_register_response;

    select *
    into v_document
    from public.clinical_documents
    where id = (v_register_response ->> 'document_id')::uuid;
  else
    select *
    into v_document
    from public.clinical_documents
    where id = p_document_id
    for update;

    if not found then
      raise exception 'Laboratory result document was not found.';
    end if;

    if v_document.document_type <> 'laboratory_result'
       or v_document.service_request_id <> v_request.id then
      raise exception 'The selected document does not belong to this Laboratory service request.';
    end if;

    if v_document.status <> 'draft' then
      raise exception 'Only a draft Laboratory result can be edited.';
    end if;

    if v_document.created_by <> v_actor
       and not app_private.is_system_admin() then
      raise exception 'Only the result creator or SYSTEM_ADMIN can edit this draft.';
    end if;

    v_before := jsonb_build_object(
      'title', v_document.title,
      'status', v_document.status,
      'metadata', v_document.metadata
    );

    v_metadata :=
      coalesce(v_document.metadata, '{}'::jsonb)
      || v_metadata;

    v_metadata := app_private.require_laboratory_result_metadata(v_metadata);

    update public.clinical_documents
    set
      title = trim(p_title),
      metadata = v_metadata
    where id = v_document.id
    returning * into v_document;

    perform app_private.append_hospital_operation_audit(
      v_actor,
      'laboratory.result_draft.updated',
      format('Laboratory result %s draft was updated.', v_document.document_number),
      v_document.patient_id,
      v_document.branch_id,
      v_document.visit_id,
      v_document.service_request_id,
      null,
      v_document.id,
      v_before,
      jsonb_build_object(
        'title', v_document.title,
        'status', v_document.status,
        'metadata', v_document.metadata
      ),
      jsonb_build_object('idempotency_key', v_key)
    );
  end if;

  v_response := jsonb_build_object(
    'idempotent_replay', false,
    'document_id', v_document.id,
    'document_number', v_document.document_number,
    'service_request_id', v_document.service_request_id,
    'status', v_document.status,
    'version_number', v_document.version_number
  );

  insert into app_private.laboratory_result_operation_keys (
    idempotency_key,
    operation_type,
    document_id,
    actor_user_id,
    response_payload
  )
  values (
    v_key,
    'save_draft',
    v_document.id,
    v_actor,
    v_response
  );

  return v_response;
end;
$$;

-- ============================================================
-- SUBMIT RESULT FOR VERIFICATION
-- ============================================================

create or replace function public.laboratory_submit_result_for_verification(
  p_idempotency_key text,
  p_document_id uuid
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
  v_operation app_private.laboratory_result_operation_keys%rowtype;
  v_submit_response jsonb;
  v_response jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended('laboratory-result-submit:' || v_key, 0)
  );

  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('laboratory.result.enter')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot submit Laboratory results.';
  end if;

  select *
  into v_operation
  from app_private.laboratory_result_operation_keys
  where idempotency_key = v_key;

  if found then
    return v_operation.response_payload ||
      jsonb_build_object('idempotent_replay', true);
  end if;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Laboratory result document was not found.';
  end if;

  if v_document.document_type <> 'laboratory_result' then
    raise exception 'The selected document is not a Laboratory result.';
  end if;

  if v_document.created_by <> v_actor
     and not app_private.is_system_admin() then
    raise exception 'Only the result creator or SYSTEM_ADMIN can submit this result.';
  end if;

  perform app_private.require_laboratory_result_metadata(v_document.metadata);

  select public.clinical_submit_document_for_review(
    v_document.id,
    jsonb_build_object(
      'entry_status', 'for_verification',
      'submitted_by', v_actor,
      'submitted_at', now()
    )
  )
  into v_submit_response;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id;

  v_response := jsonb_build_object(
    'idempotent_replay', false,
    'document_id', v_document.id,
    'document_number', v_document.document_number,
    'status', v_document.status
  );

  insert into app_private.laboratory_result_operation_keys (
    idempotency_key,
    operation_type,
    document_id,
    actor_user_id,
    response_payload
  )
  values (
    v_key,
    'submit_for_verification',
    v_document.id,
    v_actor,
    v_response
  );

  return v_response;
end;
$$;

-- ============================================================
-- RETURN RESULT FOR CORRECTION
-- ============================================================

create or replace function public.laboratory_return_result_for_correction(
  p_idempotency_key text,
  p_document_id uuid,
  p_correction_reason text
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
  v_operation app_private.laboratory_result_operation_keys%rowtype;
  v_reason text;
  v_before jsonb;
  v_response jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended('laboratory-result-return:' || v_key, 0)
  );

  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('laboratory.result.verify')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot return Laboratory results for correction.';
  end if;

  select *
  into v_operation
  from app_private.laboratory_result_operation_keys
  where idempotency_key = v_key;

  if found then
    return v_operation.response_payload ||
      jsonb_build_object('idempotent_replay', true);
  end if;

  v_reason := nullif(trim(p_correction_reason), '');

  if v_reason is null or length(v_reason) < 3 then
    raise exception 'A correction reason of at least three characters is required.';
  end if;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Laboratory result document was not found.';
  end if;

  if v_document.document_type <> 'laboratory_result' then
    raise exception 'The selected document is not a Laboratory result.';
  end if;

  if v_document.status = 'draft'
     and v_document.metadata ->> 'entry_status' = 'returned_for_correction' then
    v_response := jsonb_build_object(
      'idempotent_replay', true,
      'document_id', v_document.id,
      'document_number', v_document.document_number,
      'status', v_document.status,
      'correction_reason', v_document.metadata ->> 'correction_reason'
    );

    insert into app_private.laboratory_result_operation_keys (
      idempotency_key,
      operation_type,
      document_id,
      actor_user_id,
      response_payload
    )
    values (
      v_key,
      'return_for_correction',
      v_document.id,
      v_actor,
      v_response
    );

    return v_response;
  end if;

  if v_document.status <> 'for_review' then
    raise exception 'Only a Laboratory result awaiting verification can be returned for correction.';
  end if;

  if not app_private.has_branch_access(v_document.branch_id) then
    raise exception 'The current staff account has no access to this document branch.';
  end if;

  v_before := jsonb_build_object(
    'status', v_document.status,
    'metadata', v_document.metadata
  );

  update public.clinical_documents
  set
    status = 'draft',
    metadata = metadata || jsonb_build_object(
      'entry_status', 'returned_for_correction',
      'correction_reason', v_reason,
      'returned_by', v_actor,
      'returned_at', now()
    )
  where id = v_document.id
  returning * into v_document;

  perform app_private.append_hospital_operation_audit(
    v_actor,
    'laboratory.result.returned_for_correction',
    format('Laboratory result %s was returned for correction.', v_document.document_number),
    v_document.patient_id,
    v_document.branch_id,
    v_document.visit_id,
    v_document.service_request_id,
    null,
    v_document.id,
    v_before,
    jsonb_build_object(
      'status', v_document.status,
      'metadata', v_document.metadata
    ),
    jsonb_build_object(
      'idempotency_key', v_key,
      'correction_reason', v_reason
    )
  );

  v_response := jsonb_build_object(
    'idempotent_replay', false,
    'document_id', v_document.id,
    'document_number', v_document.document_number,
    'status', v_document.status,
    'correction_reason', v_reason
  );

  insert into app_private.laboratory_result_operation_keys (
    idempotency_key,
    operation_type,
    document_id,
    actor_user_id,
    response_payload
  )
  values (
    v_key,
    'return_for_correction',
    v_document.id,
    v_actor,
    v_response
  );

  return v_response;
end;
$$;

-- ============================================================
-- VERIFY AND FINALIZE RESULT
-- ============================================================

create or replace function public.laboratory_finalize_result(
  p_idempotency_key text,
  p_document_id uuid,
  p_verification_notes text
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
  v_request public.service_requests%rowtype;
  v_operation app_private.laboratory_result_operation_keys%rowtype;
  v_finalize_response jsonb;
  v_release public.document_release_clearances%rowtype;
  v_response jsonb;
begin
  v_key := app_private.require_idempotency_key(p_idempotency_key);
  perform pg_advisory_xact_lock(
    hashtextextended('laboratory-result-finalize:' || v_key, 0)
  );

  v_actor := auth.uid();

  if v_actor is null
     or not app_private.current_staff_is_active() then
    raise exception 'An active authenticated GalenMed staff account is required.';
  end if;

  if not app_private.has_permission('laboratory.result.verify')
     and not app_private.is_system_admin() then
    raise exception 'The current staff account cannot verify Laboratory results.';
  end if;

  select *
  into v_operation
  from app_private.laboratory_result_operation_keys
  where idempotency_key = v_key;

  if found then
    return v_operation.response_payload ||
      jsonb_build_object('idempotent_replay', true);
  end if;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Laboratory result document was not found.';
  end if;

  if v_document.document_type <> 'laboratory_result' then
    raise exception 'The selected document is not a Laboratory result.';
  end if;

  if v_document.status = 'finalized' then
    select *
    into v_release
    from public.document_release_clearances
    where document_id = v_document.id;

    v_response := jsonb_build_object(
      'idempotent_replay', true,
      'document_id', v_document.id,
      'document_number', v_document.document_number,
      'status', v_document.status,
      'finalized_at', v_document.finalized_at,
      'release_status', coalesce(v_release.release_status, 'not_ready')
    );

    insert into app_private.laboratory_result_operation_keys (
      idempotency_key,
      operation_type,
      document_id,
      actor_user_id,
      response_payload
    )
    values (
      v_key,
      'finalize_result',
      v_document.id,
      v_actor,
      v_response
    );

    return v_response;
  end if;

  if v_document.status <> 'for_review' then
    raise exception 'Only a Laboratory result awaiting verification can be finalized.';
  end if;

  perform app_private.require_laboratory_result_metadata(v_document.metadata);

  select *
  into v_request
  from public.service_requests
  where id = v_document.service_request_id;

  if not found or v_request.status <> 'completed' then
    raise exception 'The Laboratory service request must be completed before result finalization.';
  end if;

  select public.clinical_finalize_document(
    v_document.id,
    jsonb_build_object(
      'entry_status', 'verified',
      'verification_notes', nullif(trim(p_verification_notes), ''),
      'verified_by', v_actor,
      'verified_at', now()
    )
  )
  into v_finalize_response;

  select *
  into v_document
  from public.clinical_documents
  where id = p_document_id;

  select *
  into v_release
  from public.document_release_clearances
  where document_id = v_document.id;

  v_response := jsonb_build_object(
    'idempotent_replay', false,
    'document_id', v_document.id,
    'document_number', v_document.document_number,
    'status', v_document.status,
    'finalized_at', v_document.finalized_at,
    'release_status', coalesce(v_release.release_status, 'not_ready')
  );

  insert into app_private.laboratory_result_operation_keys (
    idempotency_key,
    operation_type,
    document_id,
    actor_user_id,
    response_payload
  )
  values (
    v_key,
    'finalize_result',
    v_document.id,
    v_actor,
    v_response
  );

  return v_response;
end;
$$;

-- ============================================================
-- EXECUTION GRANTS
-- ============================================================

revoke all
  on function public.laboratory_save_result_draft(
    text,
    uuid,
    uuid,
    text,
    text,
    text,
    jsonb,
    text,
    text
  )
  from public, anon;

grant execute
  on function public.laboratory_save_result_draft(
    text,
    uuid,
    uuid,
    text,
    text,
    text,
    jsonb,
    text,
    text
  )
  to authenticated;

revoke all
  on function public.laboratory_submit_result_for_verification(text, uuid)
  from public, anon;

grant execute
  on function public.laboratory_submit_result_for_verification(text, uuid)
  to authenticated;

revoke all
  on function public.laboratory_return_result_for_correction(text, uuid, text)
  from public, anon;

grant execute
  on function public.laboratory_return_result_for_correction(text, uuid, text)
  to authenticated;

revoke all
  on function public.laboratory_finalize_result(text, uuid, text)
  from public, anon;

grant execute
  on function public.laboratory_finalize_result(text, uuid, text)
  to authenticated;

comment on function public.laboratory_save_result_draft(
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb,
  text,
  text
) is
  'Creates or updates one guarded Laboratory result draft for a Laboratory service request.';

comment on function public.laboratory_submit_result_for_verification(text, uuid) is
  'Submits a Laboratory result draft to the Laboratory Verifier queue.';

comment on function public.laboratory_return_result_for_correction(text, uuid, text) is
  'Returns a for-review Laboratory result to draft status with an auditable correction reason.';

comment on function public.laboratory_finalize_result(text, uuid, text) is
  'Verifies and finalizes a Laboratory result, triggering payment-aware release-state synchronization.';

commit;
