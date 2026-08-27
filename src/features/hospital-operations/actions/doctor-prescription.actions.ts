"use server"

import { revalidatePath } from "next/cache"

import { requireStaffRole } from "@/features/auth/utils/staff-auth.server"
import {
  doctorPrescriptionDraftSchema,
  doctorPrescriptionSubmitSchema,
  receptionPrescriptionApproveSchema,
  receptionPrescriptionReturnSchema,
  type DoctorPrescriptionDraftValues,
  type DoctorPrescriptionSubmitValues,
  type ReceptionPrescriptionApproveValues,
  type ReceptionPrescriptionReturnValues,
} from "@/features/hospital-operations/schemas/doctor-prescription.schema"
import type {
  DoctorPrescriptionActionResult,
  DoctorPrescriptionMutationResponse,
} from "@/features/hospital-operations/types/doctor-prescription.types"
import { createPrescriptionIdempotencyKey } from "@/features/hospital-operations/utils/doctor-prescription.utils"
import { createClient } from "@/lib/supabase/server"

function readMutation(data: unknown): DoctorPrescriptionMutationResponse {
  const raw = data as Record<string, unknown>
  return {
    prescriptionId: String(raw.prescription_id),
    prescriptionNumber: String(raw.prescription_number),
    status: String(raw.status) as DoctorPrescriptionMutationResponse["status"],
    clinicalDocumentId: typeof raw.clinical_document_id === "string" ? raw.clinical_document_id : undefined,
    releaseStatus: typeof raw.release_status === "string" ? raw.release_status : undefined,
    idempotentReplay: raw.idempotent_replay === true,
  }
}

export async function saveDoctorPrescriptionDraftAction(
  values: DoctorPrescriptionDraftValues
): Promise<DoctorPrescriptionActionResult<DoctorPrescriptionMutationResponse>> {
  const parsed = doctorPrescriptionDraftSchema.safeParse(values)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid prescription details." }
  await requireStaffRole(["DOCTOR", "SYSTEM_ADMIN"])
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("doctor_save_prescription_draft", {
    p_idempotency_key: createPrescriptionIdempotencyKey("rx-save"),
    p_consultation_id: parsed.data.consultationId,
    p_prescription_id: parsed.data.prescriptionId || null,
    p_general_instructions: parsed.data.generalInstructions,
    p_items: parsed.data.items.map((item) => ({
      generic_name: item.genericName,
      brand_name: item.brandName,
      dosage_form: item.dosageForm,
      strength: item.strength,
      dose: item.dose,
      route: item.route,
      frequency: item.frequency,
      duration: item.duration,
      quantity: Number(item.quantity),
      quantity_unit: item.quantityUnit,
      instructions: item.instructions,
    })),
  })
  if (error) return { success: false, message: error.message }
  revalidatePath("/doctor/prescriptions")
  revalidatePath(`/doctor/prescriptions/${parsed.data.consultationId}`)
  return { success: true, message: "Prescription draft saved.", data: readMutation(data) }
}

export async function submitDoctorPrescriptionAction(
  values: DoctorPrescriptionSubmitValues
): Promise<DoctorPrescriptionActionResult<DoctorPrescriptionMutationResponse>> {
  const parsed = doctorPrescriptionSubmitSchema.safeParse(values)
  if (!parsed.success) return { success: false, message: "Invalid prescription." }
  await requireStaffRole(["DOCTOR", "SYSTEM_ADMIN"])
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("doctor_submit_prescription", {
    p_idempotency_key: createPrescriptionIdempotencyKey("rx-submit"),
    p_prescription_id: parsed.data.prescriptionId,
  })
  if (error) return { success: false, message: error.message }
  revalidatePath("/doctor/prescriptions")
  revalidatePath("/reception/prescriptions")
  return { success: true, message: "Prescription signed and submitted for Reception review.", data: readMutation(data) }
}

export async function returnPrescriptionForCorrectionAction(
  values: ReceptionPrescriptionReturnValues
): Promise<DoctorPrescriptionActionResult<DoctorPrescriptionMutationResponse>> {
  const parsed = receptionPrescriptionReturnSchema.safeParse(values)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid correction reason." }
  await requireStaffRole(["RECEPTIONIST", "SYSTEM_ADMIN"])
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("reception_return_prescription_for_correction", {
    p_idempotency_key: createPrescriptionIdempotencyKey("rx-return"),
    p_prescription_id: parsed.data.prescriptionId,
    p_reason: parsed.data.reason,
  })
  if (error) return { success: false, message: error.message }
  revalidatePath("/reception/prescriptions")
  revalidatePath("/doctor/prescriptions")
  return { success: true, message: "Prescription returned to the Doctor for correction.", data: readMutation(data) }
}

export async function approvePrescriptionForReleaseAction(
  values: ReceptionPrescriptionApproveValues
): Promise<DoctorPrescriptionActionResult<DoctorPrescriptionMutationResponse>> {
  const parsed = receptionPrescriptionApproveSchema.safeParse(values)
  if (!parsed.success) return { success: false, message: "Invalid prescription review." }
  await requireStaffRole(["RECEPTIONIST", "SYSTEM_ADMIN"])
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("reception_approve_prescription_for_release", {
    p_idempotency_key: createPrescriptionIdempotencyKey("rx-approve"),
    p_prescription_id: parsed.data.prescriptionId,
    p_review_notes: parsed.data.reviewNotes,
  })
  if (error) return { success: false, message: error.message }
  revalidatePath("/reception/prescriptions")
  revalidatePath("/reception/releases")
  revalidatePath("/doctor/prescriptions")
  return { success: true, message: "Prescription approved for payment-controlled release.", data: readMutation(data) }
}
