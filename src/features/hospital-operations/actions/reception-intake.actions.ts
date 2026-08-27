"use server"

import {
  revalidatePath,
} from "next/cache"
import { z } from "zod"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  receptionCheckInSchema,
  receptionPatientFormSchema,
  receptionServiceRequestFormSchema,
  receptionVisitFormSchema,
  type ReceptionCheckInValues,
  type ReceptionPatientFormValues,
  type ReceptionServiceRequestFormValues,
  type ReceptionVisitFormValues,
} from "@/features/hospital-operations/schemas/reception-intake.schema"
import type {
  CheckedInVisitResult,
  CreatedServiceRequestResult,
  CreatedVisitResult,
  ReceptionActionResult,
  RegisteredPatientResult,
} from "@/features/hospital-operations/types/reception-intake.types"
import {
  createClient,
} from "@/lib/supabase/server"

const registeredPatientResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    patient_id:
      z.string().uuid(),
    medical_record_number:
      z.string().min(1),
    full_name:
      z.string().min(1),
    status:
      z.string().min(1),
  })

const createdVisitResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    visit_id:
      z.string().uuid(),
    visit_number:
      z.string().min(1),
    visit_status:
      z.enum([
        "registered",
        "checked_in",
        "active",
        "completed",
        "cancelled",
      ]),
    billing_account_id:
      z.string().uuid(),
    billing_number:
      z.string().min(1),
  })

const checkedInVisitResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    visit_id:
      z.string().uuid(),
    visit_number:
      z.string().min(1),
    status:
      z.enum([
        "registered",
        "checked_in",
        "active",
        "completed",
        "cancelled",
      ]),
  })

const createdServiceRequestResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    service_request_id:
      z.string().uuid(),
    request_number:
      z.string().min(1),
    status:
      z.enum([
        "requested",
        "queued",
        "in_progress",
        "completed",
        "cancelled",
        "rejected",
      ]),
    service_type:
      z.enum([
        "consultation",
        "laboratory",
        "radiology",
        "pharmacy",
        "billing",
        "procedure",
        "other",
      ]),
    queue_entry_id:
      z.string().uuid().nullable(),
    queue_number:
      z.string().nullable(),
    billing_account_id:
      z.string().uuid(),
    billing_number:
      z.string().min(1),
    payment_clearance_id:
      z.string().uuid(),
    required_amount_centavos:
      z.number().int().nonnegative(),
  })

async function requireReceptionContext() {
  return requireStaffRole([
    "RECEPTIONIST",
    "SYSTEM_ADMIN",
  ])
}

function hasBranchAccess(
  branchIds: readonly string[],
  requestedBranchId: string
): boolean {
  return branchIds.includes(
    requestedBranchId
  )
}

function revalidateReceptionPages() {
  revalidatePath(
    "/reception/intake"
  )

  revalidatePath(
    "/reception/dashboard"
  )
}

export async function registerReceptionPatientAction(
  values: ReceptionPatientFormValues
): Promise<
  ReceptionActionResult<
    RegisteredPatientResult
  >
> {
  const parsedValues =
    receptionPatientFormSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The patient registration details are invalid.",
    }
  }

  const context =
    await requireReceptionContext()

  const input =
    parsedValues.data

  if (
    !hasBranchAccess(
      context.branches.map(
        (branch) => branch.id
      ),
      input.branchId
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account does not have access to the selected branch.",
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "reception_register_patient",
    {
      p_idempotency_key:
        input.idempotencyKey,
      p_branch_id:
        input.branchId,
      p_first_name:
        input.firstName,
      p_last_name:
        input.lastName,
      p_date_of_birth:
        input.dateOfBirth,
      p_biological_sex:
        input.biologicalSex,
      p_address:
        input.address,
      p_emergency_contact_name:
        input.emergencyContactName,
      p_emergency_contact_number:
        input.emergencyContactNumber,
      p_consent_acknowledged:
        input.consentAcknowledged,
      p_middle_name:
        input.middleName || null,
      p_mobile_number:
        input.mobileNumber || null,
      p_email_address:
        input.emailAddress || null,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The patient could not be registered.",
    }
  }

  const parsedResponse =
    registeredPatientResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The patient was processed, but the registration response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidateReceptionPages()

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The existing patient registration result was restored safely."
        : "Patient registered successfully.",
    data: {
      patientId:
        response.patient_id,
      medicalRecordNumber:
        response.medical_record_number,
      fullName:
        response.full_name,
      status:
        response.status,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}

export async function createReceptionVisitAction(
  values: ReceptionVisitFormValues
): Promise<
  ReceptionActionResult<
    CreatedVisitResult
  >
> {
  const parsedValues =
    receptionVisitFormSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The hospital visit details are invalid.",
    }
  }

  const context =
    await requireReceptionContext()

  const input =
    parsedValues.data

  if (
    !hasBranchAccess(
      context.branches.map(
        (branch) => branch.id
      ),
      input.branchId
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account does not have access to the selected branch.",
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "reception_create_visit",
    {
      p_idempotency_key:
        input.idempotencyKey,
      p_patient_id:
        input.patientId,
      p_branch_id:
        input.branchId,
      p_arrival_mode:
        input.arrivalMode,
      p_initial_service_type:
        input.initialServiceType,
      p_chief_concern:
        input.chiefConcern || null,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The hospital visit could not be created.",
    }
  }

  const parsedResponse =
    createdVisitResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The visit was processed, but the response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidateReceptionPages()

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The existing hospital visit result was restored safely."
        : "Hospital visit and billing account created successfully.",
    data: {
      visitId:
        response.visit_id,
      visitNumber:
        response.visit_number,
      visitStatus:
        response.visit_status,
      billingAccountId:
        response.billing_account_id,
      billingNumber:
        response.billing_number,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}

export async function checkInReceptionVisitAction(
  values: ReceptionCheckInValues
): Promise<
  ReceptionActionResult<
    CheckedInVisitResult
  >
> {
  const parsedValues =
    receptionCheckInSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The hospital visit reference is invalid.",
    }
  }

  await requireReceptionContext()

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "reception_check_in_visit",
    {
      p_visit_id:
        parsedValues.data.visitId,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The patient could not be checked in.",
    }
  }

  const parsedResponse =
    checkedInVisitResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The check-in was processed, but the response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidateReceptionPages()

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The patient was already checked in."
        : "Patient checked in successfully.",
    data: {
      visitId:
        response.visit_id,
      visitNumber:
        response.visit_number,
      status:
        response.status,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}

export async function createReceptionServiceRequestAction(
  values: ReceptionServiceRequestFormValues
): Promise<
  ReceptionActionResult<
    CreatedServiceRequestResult
  >
> {
  const parsedValues =
    receptionServiceRequestFormSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The hospital service request details are invalid.",
    }
  }

  await requireReceptionContext()

  const input =
    parsedValues.data

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "reception_create_service_request",
    {
      p_idempotency_key:
        input.idempotencyKey,
      p_visit_id:
        input.visitId,
      p_service_catalog_item_id:
        input.serviceCatalogItemId,
      p_priority:
        input.priority,
      p_assigned_staff_id:
        null,
      p_doctor_order_reference:
        input.doctorOrderReference ||
        null,
      p_request_notes:
        input.requestNotes || null,
      p_create_queue:
        input.createQueue,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The hospital service request could not be created.",
    }
  }

  const parsedResponse =
    createdServiceRequestResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The service request was processed, but the response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidateReceptionPages()

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The existing service request result was restored safely."
        : "Service request, queue entry, billing charge, and payment clearance created successfully.",
    data: {
      serviceRequestId:
        response.service_request_id,
      requestNumber:
        response.request_number,
      status:
        response.status,
      serviceType:
        response.service_type,
      queueEntryId:
        response.queue_entry_id,
      queueNumber:
        response.queue_number,
      billingAccountId:
        response.billing_account_id,
      billingNumber:
        response.billing_number,
      paymentClearanceId:
        response.payment_clearance_id,
      requiredAmountCentavos:
        response.required_amount_centavos,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}
