"use server"

import {
  revalidatePath,
} from "next/cache"
import { z } from "zod"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  laboratoryResultDocumentActionSchema,
  laboratoryResultDraftSchema,
  laboratoryResultFinalizeSchema,
  laboratoryResultReturnSchema,
  type LaboratoryResultDocumentActionValues,
  type LaboratoryResultDraftValues,
  type LaboratoryResultFinalizeValues,
  type LaboratoryResultReturnValues,
} from "@/features/hospital-operations/schemas/laboratory-result.schema"
import {
  LABORATORY_DOCUMENT_STATUSES,
  LABORATORY_RELEASE_STATUSES,
  type LaboratoryResultActionResult,
  type LaboratoryResultMutationResponse,
} from "@/features/hospital-operations/types/laboratory-result.types"
import {
  createClient,
} from "@/lib/supabase/server"

const mutationResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    document_id:
      z.string().uuid(),
    document_number:
      z.string().min(1),
    service_request_id:
      z.string().uuid().nullable().optional(),
    status:
      z.enum(
        LABORATORY_DOCUMENT_STATUSES
      ),
    version_number:
      z.number().int().positive().nullable().optional(),
    release_status:
      z.enum(
        LABORATORY_RELEASE_STATUSES
      ).nullable().optional(),
    finalized_at:
      z.string().nullable().optional(),
  })

async function requireLaboratoryContext() {
  return requireStaffRole([
    "LABORATORY_STAFF",
    "LABORATORY_VERIFIER",
    "SYSTEM_ADMIN",
  ])
}

function revalidateLaboratoryResultPages() {
  revalidatePath(
    "/laboratory/results"
  )

  revalidatePath(
    "/laboratory/dashboard"
  )

  revalidatePath(
    "/reception/dashboard"
  )
}

function mapMutationResponse(
  data: unknown
): LaboratoryResultMutationResponse | null {
  const parsed =
    mutationResponseSchema.safeParse(
      data
    )

  if (!parsed.success) {
    return null
  }

  const response =
    parsed.data

  return {
    documentId:
      response.document_id,
    documentNumber:
      response.document_number,
    status:
      response.status,
    serviceRequestId:
      response.service_request_id ??
      null,
    versionNumber:
      response.version_number ??
      null,
    releaseStatus:
      response.release_status ??
      null,
    finalizedAt:
      response.finalized_at ??
      null,
    idempotentReplay:
      response.idempotent_replay,
  }
}

export async function saveLaboratoryResultDraftAction(
  values: LaboratoryResultDraftValues
): Promise<
  LaboratoryResultActionResult<
    LaboratoryResultMutationResponse
  >
> {
  const parsedValues =
    laboratoryResultDraftSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The Laboratory result draft is invalid.",
    }
  }

  const context =
    await requireLaboratoryContext()

  if (
    !context.permissions.includes(
      "laboratory.result.enter"
    ) &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot enter Laboratory results.",
    }
  }

  const input =
    parsedValues.data

  const resultItems =
    input.resultItems.map(
      (item) => ({
        id: item.id,
        test_name:
          item.testName,
        result_value:
          item.resultValue,
        unit:
          item.unit || null,
        reference_range:
          item.referenceRange || null,
        flag:
          item.flag,
        remarks:
          item.remarks || null,
      })
    )

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "laboratory_save_result_draft",
    {
      p_idempotency_key:
        input.idempotencyKey,
      p_service_request_id:
        input.serviceRequestId,
      p_document_id:
        input.documentId,
      p_title:
        input.title,
      p_specimen_type:
        input.specimenType,
      p_collection_reference:
        input.collectionReference ||
        null,
      p_result_items:
        resultItems,
      p_interpretation:
        input.interpretation ||
        null,
      p_notes:
        input.notes || null,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The Laboratory result draft could not be saved.",
    }
  }

  const mappedResponse =
    mapMutationResponse(data)

  if (!mappedResponse) {
    return {
      success: false,
      message:
        "The result was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  revalidateLaboratoryResultPages()

  return {
    success: true,
    message:
      mappedResponse.idempotentReplay
        ? "The existing Laboratory result draft was restored safely."
        : "Laboratory result draft saved.",
    data: mappedResponse,
  }
}

export async function submitLaboratoryResultForVerificationAction(
  values: LaboratoryResultDocumentActionValues
): Promise<
  LaboratoryResultActionResult<
    LaboratoryResultMutationResponse
  >
> {
  const parsedValues =
    laboratoryResultDocumentActionSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The Laboratory result submission is invalid.",
    }
  }

  const context =
    await requireLaboratoryContext()

  if (
    !context.permissions.includes(
      "laboratory.result.enter"
    ) &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot submit Laboratory results.",
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "laboratory_submit_result_for_verification",
    {
      p_idempotency_key:
        parsedValues.data
          .idempotencyKey,
      p_document_id:
        parsedValues.data
          .documentId,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The Laboratory result could not be submitted for verification.",
    }
  }

  const mappedResponse =
    mapMutationResponse(data)

  if (!mappedResponse) {
    return {
      success: false,
      message:
        "The submission was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  revalidateLaboratoryResultPages()

  return {
    success: true,
    message:
      mappedResponse.idempotentReplay
        ? "The existing verification submission was restored safely."
        : "Laboratory result submitted for verification.",
    data: mappedResponse,
  }
}

export async function returnLaboratoryResultForCorrectionAction(
  values: LaboratoryResultReturnValues
): Promise<
  LaboratoryResultActionResult<
    LaboratoryResultMutationResponse
  >
> {
  const parsedValues =
    laboratoryResultReturnSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The correction request is invalid.",
    }
  }

  const context =
    await requireLaboratoryContext()

  if (
    !context.permissions.includes(
      "laboratory.result.verify"
    ) &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot return Laboratory results for correction.",
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "laboratory_return_result_for_correction",
    {
      p_idempotency_key:
        parsedValues.data
          .idempotencyKey,
      p_document_id:
        parsedValues.data
          .documentId,
      p_correction_reason:
        parsedValues.data
          .correctionReason,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The Laboratory result could not be returned for correction.",
    }
  }

  const mappedResponse =
    mapMutationResponse(data)

  if (!mappedResponse) {
    return {
      success: false,
      message:
        "The correction request was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  revalidateLaboratoryResultPages()

  return {
    success: true,
    message:
      mappedResponse.idempotentReplay
        ? "The existing correction request was restored safely."
        : "Laboratory result returned for correction.",
    data: mappedResponse,
  }
}

export async function finalizeLaboratoryResultAction(
  values: LaboratoryResultFinalizeValues
): Promise<
  LaboratoryResultActionResult<
    LaboratoryResultMutationResponse
  >
> {
  const parsedValues =
    laboratoryResultFinalizeSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The Laboratory verification details are invalid.",
    }
  }

  const context =
    await requireLaboratoryContext()

  if (
    !context.permissions.includes(
      "laboratory.result.verify"
    ) &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot verify Laboratory results.",
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "laboratory_finalize_result",
    {
      p_idempotency_key:
        parsedValues.data
          .idempotencyKey,
      p_document_id:
        parsedValues.data
          .documentId,
      p_verification_notes:
        parsedValues.data
          .verificationNotes ||
        null,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The Laboratory result could not be finalized.",
    }
  }

  const mappedResponse =
    mapMutationResponse(data)

  if (!mappedResponse) {
    return {
      success: false,
      message:
        "The verification was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  revalidateLaboratoryResultPages()

  return {
    success: true,
    message:
      mappedResponse.idempotentReplay
        ? "The existing finalized Laboratory result was restored safely."
        : mappedResponse.releaseStatus ===
            "ready"
          ? "Laboratory result verified and ready for Reception release."
          : "Laboratory result verified. Patient release remains controlled by payment clearance.",
    data: mappedResponse,
  }
}
