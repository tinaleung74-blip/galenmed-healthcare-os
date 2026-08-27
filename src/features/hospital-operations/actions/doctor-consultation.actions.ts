"use server"

import {
  revalidatePath,
} from "next/cache"
import { z } from "zod"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  assignDoctorSchema,
  completeDoctorConsultationSchema,
  saveDoctorConsultationSchema,
  type AssignDoctorValues,
  type CompleteDoctorConsultationValues,
  type SaveDoctorConsultationValues,
} from "@/features/hospital-operations/schemas/doctor-consultation.schema"
import type {
  CompletedConsultationResult,
  DoctorWorkflowActionResult,
  StartedConsultationResult,
} from "@/features/hospital-operations/types/doctor-consultation.types"
import {
  createClient,
} from "@/lib/supabase/server"

const uuidSchema =
  z.string().uuid()

const startedResponseSchema =
  z.object({
    consultation_id:
      z.string().uuid(),
    consultation_number:
      z.string(),
    status:
      z.literal(
        "in_progress"
      ),
  })

const completedResponseSchema =
  z.object({
    consultation_id:
      z.string().uuid(),
    consultation_number:
      z.string(),
    status:
      z.literal(
        "completed"
      ),
    summary_document_id:
      z.string().uuid(),
    summary_document_number:
      z.string(),
  })

export async function assignConsultationDoctorAction(
  values: AssignDoctorValues
): Promise<
  DoctorWorkflowActionResult
> {
  const parsed =
    assignDoctorSchema.safeParse(
      values
    )

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]
          ?.message ??
        "The Doctor assignment details are invalid.",
    }
  }

  await requireStaffRole([
    "RECEPTIONIST",
    "SYSTEM_ADMIN",
  ])

  const supabase =
    await createClient()

  const {
    error,
  } = await supabase.rpc(
    "reception_assign_consultation_doctor",
    {
      p_idempotency_key:
        parsed.data.idempotencyKey,
      p_service_request_id:
        parsed.data.serviceRequestId,
      p_doctor_id:
        parsed.data.doctorId,
      p_reason:
        parsed.data.reason,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The consultation could not be assigned to the selected Doctor.",
    }
  }

  revalidatePath(
    "/reception/doctor-assignments"
  )

  revalidatePath(
    "/doctor/queue"
  )

  return {
    success: true,
    message:
      "Consultation assigned to the selected Doctor.",
  }
}

export async function startDoctorConsultationAction(
  serviceRequestId: string
): Promise<
  DoctorWorkflowActionResult<
    StartedConsultationResult
  >
> {
  const parsedId =
    uuidSchema.safeParse(
      serviceRequestId
    )

  if (!parsedId.success) {
    return {
      success: false,
      message:
        "The consultation request identifier is invalid.",
    }
  }

  await requireStaffRole([
    "DOCTOR",
  ])

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "doctor_start_consultation",
    {
      p_idempotency_key:
        `doctor-start-${crypto.randomUUID()}`,
      p_service_request_id:
        parsedId.data,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The Doctor consultation could not be started.",
    }
  }

  const parsedResponse =
    startedResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The consultation started, but the response was invalid. Refresh before trying again.",
    }
  }

  revalidatePath(
    "/doctor/queue"
  )

  revalidatePath(
    `/doctor/consultations/${parsedId.data}`
  )

  return {
    success: true,
    message:
      "Doctor consultation started.",
    data: {
      consultationId:
        parsedResponse.data
          .consultation_id,
      consultationNumber:
        parsedResponse.data
          .consultation_number,
      status:
        parsedResponse.data.status,
    },
  }
}

async function saveConsultationDraft(
  values:
    SaveDoctorConsultationValues
): Promise<
  DoctorWorkflowActionResult
> {
  const parsed =
    saveDoctorConsultationSchema.safeParse(
      values
    )

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]
          ?.message ??
        "The consultation details are invalid.",
    }
  }

  const supabase =
    await createClient()

  const {
    error,
  } = await supabase.rpc(
    "doctor_save_consultation_draft",
    {
      p_consultation_id:
        parsed.data.consultationId,
      p_chief_complaint:
        parsed.data.chiefComplaint ||
        null,
      p_history_of_present_illness:
        parsed.data
          .historyOfPresentIllness ||
        null,
      p_physical_examination:
        parsed.data
          .physicalExamination ||
        null,
      p_assessment:
        parsed.data.assessment ||
        null,
      p_diagnosis_code:
        parsed.data.diagnosisCode ||
        null,
      p_diagnosis_text:
        parsed.data.diagnosisText ||
        null,
      p_treatment_plan:
        parsed.data.treatmentPlan ||
        null,
      p_clinical_notes:
        parsed.data.clinicalNotes ||
        null,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The consultation draft could not be saved.",
    }
  }

  return {
    success: true,
    message:
      "Consultation draft saved.",
  }
}

export async function saveDoctorConsultationAction(
  values:
    SaveDoctorConsultationValues
): Promise<
  DoctorWorkflowActionResult
> {
  await requireStaffRole([
    "DOCTOR",
  ])

  const result =
    await saveConsultationDraft(
      values
    )

  if (result.success) {
    revalidatePath(
      "/doctor/queue"
    )

  }

  return result
}

export async function completeDoctorConsultationAction(
  values:
    CompleteDoctorConsultationValues
): Promise<
  DoctorWorkflowActionResult<
    CompletedConsultationResult
  >
> {
  const parsed =
    completeDoctorConsultationSchema.safeParse(
      values
    )

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]
          ?.message ??
        "The consultation is incomplete.",
    }
  }

  await requireStaffRole([
    "DOCTOR",
  ])

  const saveResult =
    await saveConsultationDraft(
      parsed.data
    )

  if (!saveResult.success) {
    return {
      success: false,
      message:
        saveResult.message,
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "doctor_complete_consultation",
    {
      p_idempotency_key:
        parsed.data
          .idempotencyKey,
      p_consultation_id:
        parsed.data
          .consultationId,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The Doctor consultation could not be completed.",
    }
  }

  const parsedResponse =
    completedResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The consultation completed, but the response was invalid. Refresh before trying again.",
    }
  }

  revalidatePath(
    "/doctor/queue"
  )

  revalidatePath(
    "/reception/releases"
  )

  return {
    success: true,
    message:
      "Consultation completed and the summary was finalized.",
    data: {
      consultationId:
        parsedResponse.data
          .consultation_id,
      consultationNumber:
        parsedResponse.data
          .consultation_number,
      status:
        parsedResponse.data.status,
      summaryDocumentId:
        parsedResponse.data
          .summary_document_id,
      summaryDocumentNumber:
        parsedResponse.data
          .summary_document_number,
    },
  }
}
