"use server"

import {
  revalidatePath,
} from "next/cache"
import { z } from "zod"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  receptionPrintDocumentSchema,
  receptionReleaseDocumentSchema,
  type ReceptionPrintDocumentValues,
  type ReceptionReleaseDocumentValues,
} from "@/features/hospital-operations/schemas/reception-release.schema"
import {
  RECEPTION_PRINT_PURPOSES,
  RECEPTION_RELEASE_METHODS,
  type ReceptionPrintMutationResponse,
  type ReceptionReleaseActionResult,
  type ReceptionReleaseMutationResponse,
} from "@/features/hospital-operations/types/reception-release.types"
import {
  createClient,
} from "@/lib/supabase/server"

const printResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    print_log_id:
      z.number().int().positive(),
    document_id:
      z.string().uuid(),
    print_purpose:
      z.enum(
        RECEPTION_PRINT_PURPOSES
      ),
    copy_number:
      z.number().int().positive(),
    printed_at:
      z.string().min(1),
  })

const releaseResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    release_record_id:
      z.string().uuid(),
    release_number:
      z.string().min(1),
    document_id:
      z.string().uuid(),
    release_method:
      z.enum(
        RECEPTION_RELEASE_METHODS
      ),
    copy_number:
      z.number().int().positive(),
    released_at:
      z.string().min(1),
  })

async function requireReceptionContext() {
  return requireStaffRole([
    "RECEPTIONIST",
    "SYSTEM_ADMIN",
  ])
}

function hasRole(
  roles: readonly {
    code: string
  }[],
  roleCode: string
): boolean {
  return roles.some(
    (role) =>
      role.code === roleCode
  )
}

function canUsePermission(
  permissions: readonly string[],
  roles: readonly {
    code: string
  }[],
  permission: string
): boolean {
  return (
    permissions.includes(
      permission
    ) ||
    hasRole(
      roles,
      "SYSTEM_ADMIN"
    )
  )
}

function revalidateReceptionReleasePages(
  documentId?: string
) {
  revalidatePath(
    "/reception/releases"
  )

  revalidatePath(
    "/reception/dashboard"
  )

  revalidatePath(
    "/laboratory/results"
  )

  revalidatePath(
    "/cashier/billing"
  )

  if (documentId) {
    revalidatePath(
      `/reception/releases/${documentId}/print`
    )
  }
}

export async function recordReceptionDocumentPrintAction(
  values: ReceptionPrintDocumentValues
): Promise<
  ReceptionReleaseActionResult<
    ReceptionPrintMutationResponse
  >
> {
  const parsedValues =
    receptionPrintDocumentSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The document print details are invalid.",
    }
  }

  const context =
    await requireReceptionContext()

  if (
    !canUsePermission(
      context.permissions,
      context.roles,
      "reception.release.print"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot print patient clinical documents.",
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
    "reception_print_document",
    {
      p_idempotency_key:
        input.idempotencyKey,
      p_document_id:
        input.documentId,
      p_print_purpose:
        input.printPurpose,
      p_print_reason:
        input.printReason || null,
      p_release_record_id:
        input.releaseRecordId || null,
      p_metadata: {
        source:
          "reception_release_center",
      },
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The clinical document print could not be recorded.",
    }
  }

  const parsedResponse =
    printResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The print was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidateReceptionReleasePages(
    response.document_id
  )

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The existing print record was restored safely."
        : "Clinical document print was recorded.",
    data: {
      printLogId:
        response.print_log_id,
      documentId:
        response.document_id,
      printPurpose:
        response.print_purpose,
      copyNumber:
        response.copy_number,
      printedAt:
        response.printed_at,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}

export async function releaseReceptionDocumentAction(
  values: ReceptionReleaseDocumentValues
): Promise<
  ReceptionReleaseActionResult<
    ReceptionReleaseMutationResponse
  >
> {
  const parsedValues =
    receptionReleaseDocumentSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The release details are invalid.",
    }
  }

  const context =
    await requireReceptionContext()

  if (
    !canUsePermission(
      context.permissions,
      context.roles,
      "reception.release.complete"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot release patient clinical documents.",
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
    "reception_release_document",
    {
      p_idempotency_key:
        input.idempotencyKey,
      p_document_id:
        input.documentId,
      p_release_method:
        input.releaseMethod,
      p_recipient_name:
        input.recipientName,
      p_recipient_relationship:
        input.recipientRelationship ||
        null,
      p_recipient_identifier_masked:
        input.recipientIdentifierMasked ||
        null,
      p_notes:
        input.notes || null,
      p_metadata: {
        source:
          "reception_release_center",
      },
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The clinical document could not be released.",
    }
  }

  const parsedResponse =
    releaseResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The document release was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidateReceptionReleasePages(
    response.document_id
  )

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The existing release record was restored safely."
        : "Clinical document release was recorded.",
    data: {
      releaseRecordId:
        response.release_record_id,
      releaseNumber:
        response.release_number,
      documentId:
        response.document_id,
      releaseMethod:
        response.release_method,
      copyNumber:
        response.copy_number,
      releasedAt:
        response.released_at,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}
