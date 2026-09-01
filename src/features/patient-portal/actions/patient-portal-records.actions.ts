"use server"

import { z } from "zod"

import type {
  PatientPortalRecordActionResult,
} from "@/features/patient-portal/types/patient-portal-records.types"
import {
  requirePatientPortal,
} from "@/features/patient-portal/utils/patient-auth.server"
import {
  createClient,
} from "@/lib/supabase/server"

const documentIdSchema =
  z.string().uuid()

export async function recordPatientPortalPrintRequestAction(
  documentId: string
): Promise<
  PatientPortalRecordActionResult
> {
  const parsedDocumentId =
    documentIdSchema.safeParse(
      documentId
    )

  if (
    !parsedDocumentId.success
  ) {
    return {
      success: false,
      message:
        "The released document reference is invalid.",
    }
  }

  await requirePatientPortal()

  const supabase =
    await createClient()

  const {
    error,
  } = await supabase.rpc(
    "record_patient_portal_print_request",
    {
      p_document_id:
        parsedDocumentId.data,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        "The print request could not be audited. Printing was stopped.",
    }
  }

  return {
    success: true,
    message:
      "Print request recorded.",
  }
}
