"use server"

import {
  revalidatePath,
} from "next/cache"
import { z } from "zod"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  laboratoryQueueActionSchema,
  type LaboratoryQueueActionValues,
} from "@/features/hospital-operations/schemas/laboratory-queue.schema"
import {
  LABORATORY_QUEUE_STATUSES,
  type LaboratoryQueueActionResult,
  type LaboratoryQueueAdvanceResult,
} from "@/features/hospital-operations/types/laboratory-queue.types"
import {
  createClient,
} from "@/lib/supabase/server"

const queueActionResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    queue_entry_id:
      z.string().uuid(),
    queue_number:
      z.string().nullable().optional(),
    queue_status:
      z.enum(
        LABORATORY_QUEUE_STATUSES
      ).optional(),
    status:
      z.enum(
        LABORATORY_QUEUE_STATUSES
      ).optional(),
    service_request_status:
      z.string().nullable().optional(),
  })

export async function advanceLaboratoryQueueAction(
  values: LaboratoryQueueActionValues
): Promise<
  LaboratoryQueueActionResult<
    LaboratoryQueueAdvanceResult
  >
> {
  const parsedValues =
    laboratoryQueueActionSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The Laboratory queue action is invalid.",
    }
  }

  const context =
    await requireStaffRole([
      "LABORATORY_STAFF",
      "LABORATORY_VERIFIER",
      "SYSTEM_ADMIN",
    ])

  if (
    !context.permissions.includes(
      "laboratory.queue.view"
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
        "The current staff account cannot manage the Laboratory queue.",
    }
  }

  const input =
    parsedValues.data

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "department_advance_queue_entry",
    {
      p_queue_entry_id:
        input.queueEntryId,
      p_action:
        input.action,
      p_reason:
        input.reason || null,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The Laboratory queue could not be updated.",
    }
  }

  const parsedResponse =
    queueActionResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The queue was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  const queueStatus =
    response.queue_status ??
    response.status

  if (!queueStatus) {
    return {
      success: false,
      message:
        "The queue response did not include a valid status.",
    }
  }

  revalidatePath(
    "/laboratory/queue"
  )

  revalidatePath(
    "/laboratory/dashboard"
  )

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The existing Laboratory queue result was restored safely."
        : "Laboratory queue updated successfully.",
    data: {
      queueEntryId:
        response.queue_entry_id,
      queueNumber:
        response.queue_number ??
        null,
      queueStatus,
      serviceRequestStatus:
        response.service_request_status ??
        null,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}
