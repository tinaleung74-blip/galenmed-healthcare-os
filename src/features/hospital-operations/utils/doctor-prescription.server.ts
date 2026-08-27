import "server-only"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import type {
  DoctorPrescriptionItem,
  DoctorPrescriptionQueueRecord,
  DoctorPrescriptionStatus,
  DoctorPrescriptionWorkspaceData,
  PrescriptionReviewHistoryItem,
  ReceptionPrescriptionReviewRecord,
} from "@/features/hospital-operations/types/doctor-prescription.types"
import {
  createClient,
} from "@/lib/supabase/server"

function toItem(value: Record<string, unknown>): DoctorPrescriptionItem {
  return {
    id: String(value.id),
    sequence: Number(value.sequence),
    genericName: String(value.generic_name),
    brandName: typeof value.brand_name === "string" ? value.brand_name : null,
    dosageForm: String(value.dosage_form),
    strength: String(value.strength),
    dose: String(value.dose),
    route: String(value.route),
    frequency: String(value.frequency),
    duration: String(value.duration),
    quantity: Number(value.quantity),
    quantityUnit: String(value.quantity_unit),
    instructions: typeof value.instructions === "string" ? value.instructions : null,
  }
}

function readStatus(value: unknown): DoctorPrescriptionStatus | null {
  return value === "draft" || value === "submitted" || value === "returned" ||
    value === "finalized" || value === "voided" ? value : null
}

export async function getDoctorPrescriptionQueuePageData() {
  const context = await requireStaffRole(["DOCTOR", "SYSTEM_ADMIN"])
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_doctor_prescription_queue")
  if (error || !Array.isArray(data)) {
    throw new Error("Unable to load the Doctor prescription queue.")
  }

  const records: DoctorPrescriptionQueueRecord[] = data.map((rawValue) => {
    const raw = rawValue as Record<string, unknown>
    return {
      consultationId: String(raw.consultation_id),
      consultationNumber: String(raw.consultation_number),
      consultationStatus: String(raw.consultation_status) as DoctorPrescriptionQueueRecord["consultationStatus"],
      serviceRequestId: String(raw.service_request_id),
      patientId: String(raw.patient_id),
      patientName: String(raw.patient_name),
      medicalRecordNumber: String(raw.medical_record_number),
      visitNumber: String(raw.visit_number),
      branchName: String(raw.branch_name),
      diagnosisCode: typeof raw.diagnosis_code === "string" ? raw.diagnosis_code : null,
      diagnosisText: typeof raw.diagnosis_text === "string" ? raw.diagnosis_text : null,
      completedAt: typeof raw.completed_at === "string" ? raw.completed_at : null,
      prescriptionId: typeof raw.prescription_id === "string" ? raw.prescription_id : null,
      prescriptionNumber: typeof raw.prescription_number === "string" ? raw.prescription_number : null,
      prescriptionStatus: readStatus(raw.prescription_status),
      prescriptionRevision: raw.prescription_revision === null || raw.prescription_revision === undefined ? null : Number(raw.prescription_revision),
      prescriptionUpdatedAt: typeof raw.prescription_updated_at === "string" ? raw.prescription_updated_at : null,
      clinicalDocumentId: typeof raw.clinical_document_id === "string" ? raw.clinical_document_id : null,
    }
  })

  return { context, records }
}

export async function getDoctorPrescriptionComposerPageData(consultationId: string) {
  const context = await requireStaffRole(["DOCTOR", "SYSTEM_ADMIN"])
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_doctor_prescription_workspace", {
    p_consultation_id: consultationId,
  })
  if (error || typeof data !== "object" || data === null) {
    throw new Error("Unable to load the Doctor prescription workspace.")
  }
  const raw = data as Record<string, unknown>
  const rawConsultation = raw.consultation as Record<string, unknown>
  const rawPatient = raw.patient as Record<string, unknown>
  const rawVisit = raw.visit as Record<string, unknown>
  const rawBranch = raw.branch as Record<string, unknown>
  const rawDoctor = raw.doctor as Record<string, unknown>
  const rawPrescription =
    typeof raw.prescription === "object" && raw.prescription !== null
      ? raw.prescription as Record<string, unknown>
      : null

  const workspace: DoctorPrescriptionWorkspaceData = {
    consultation: {
      id: String(rawConsultation.id),
      consultationNumber: String(rawConsultation.consultation_number),
      status: String(rawConsultation.status) as DoctorPrescriptionWorkspaceData["consultation"]["status"],
      diagnosisCode: typeof rawConsultation.diagnosis_code === "string" ? rawConsultation.diagnosis_code : null,
      diagnosisText: typeof rawConsultation.diagnosis_text === "string" ? rawConsultation.diagnosis_text : null,
      treatmentPlan: typeof rawConsultation.treatment_plan === "string" ? rawConsultation.treatment_plan : null,
      completedAt: typeof rawConsultation.completed_at === "string" ? rawConsultation.completed_at : null,
    },
    patient: {
      id: String(rawPatient.id),
      medicalRecordNumber: String(rawPatient.medical_record_number),
      firstName: String(rawPatient.first_name),
      middleName: typeof rawPatient.middle_name === "string" ? rawPatient.middle_name : null,
      lastName: String(rawPatient.last_name),
      dateOfBirth: String(rawPatient.date_of_birth),
      biologicalSex: String(rawPatient.biological_sex),
    },
    visit: { id: String(rawVisit.id), visitNumber: String(rawVisit.visit_number) },
    branch: { id: String(rawBranch.id), code: String(rawBranch.code), name: String(rawBranch.name) },
    doctor: {
      id: String(rawDoctor.id),
      employeeId: typeof rawDoctor.employee_id === "string" ? rawDoctor.employee_id : null,
      fullName: String(rawDoctor.full_name),
      jobTitle: typeof rawDoctor.job_title === "string" ? rawDoctor.job_title : null,
    },
    prescription: rawPrescription ? {
      id: String(rawPrescription.id),
      prescriptionNumber: String(rawPrescription.prescription_number),
      status: readStatus(rawPrescription.status) ?? "draft",
      diagnosisCode: typeof rawPrescription.diagnosis_code === "string" ? rawPrescription.diagnosis_code : null,
      diagnosisText: String(rawPrescription.diagnosis_text),
      generalInstructions: typeof rawPrescription.general_instructions === "string" ? rawPrescription.general_instructions : null,
      revisionNumber: Number(rawPrescription.revision_number),
      submittedAt: typeof rawPrescription.submitted_at === "string" ? rawPrescription.submitted_at : null,
      returnReason: typeof rawPrescription.return_reason === "string" ? rawPrescription.return_reason : null,
      approvedAt: typeof rawPrescription.approved_at === "string" ? rawPrescription.approved_at : null,
      approvalNotes: typeof rawPrescription.approval_notes === "string" ? rawPrescription.approval_notes : null,
      clinicalDocumentId: typeof rawPrescription.clinical_document_id === "string" ? rawPrescription.clinical_document_id : null,
      updatedAt: String(rawPrescription.updated_at),
      items: Array.isArray(rawPrescription.items)
        ? rawPrescription.items.map((item: Record<string, unknown>) => toItem(item))
        : [],
    } : null,
  }

  return { context, data: workspace }
}

export async function getReceptionPrescriptionReviewPageData() {
  const context = await requireStaffRole(["RECEPTIONIST", "SYSTEM_ADMIN"])
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_reception_prescription_review_queue")
  if (error || !Array.isArray(data)) {
    throw new Error("Unable to load the Reception prescription review queue.")
  }

  const records: ReceptionPrescriptionReviewRecord[] = data.map((rawValue) => {
    const raw = rawValue as Record<string, unknown>
    const history: PrescriptionReviewHistoryItem[] = Array.isArray(raw.review_history)
      ? raw.review_history.map((item: Record<string, unknown>) => ({
          id: String(item.id),
          action: String(item.action) as PrescriptionReviewHistoryItem["action"],
          actorUserId: String(item.actor_user_id),
          reason: typeof item.reason === "string" ? item.reason : null,
          createdAt: String(item.created_at),
        }))
      : []

    return {
      prescriptionId: String(raw.prescription_id),
      prescriptionNumber: String(raw.prescription_number),
      status: readStatus(raw.status) ?? "submitted",
      revisionNumber: Number(raw.revision_number),
      diagnosisCode: typeof raw.diagnosis_code === "string" ? raw.diagnosis_code : null,
      diagnosisText: String(raw.diagnosis_text),
      generalInstructions: typeof raw.general_instructions === "string" ? raw.general_instructions : null,
      submittedAt: typeof raw.submitted_at === "string" ? raw.submitted_at : null,
      returnReason: typeof raw.return_reason === "string" ? raw.return_reason : null,
      approvedAt: typeof raw.approved_at === "string" ? raw.approved_at : null,
      approvalNotes: typeof raw.approval_notes === "string" ? raw.approval_notes : null,
      clinicalDocumentId: typeof raw.clinical_document_id === "string" ? raw.clinical_document_id : null,
      patientId: String(raw.patient_id),
      patientName: String(raw.patient_name),
      medicalRecordNumber: String(raw.medical_record_number),
      dateOfBirth: String(raw.date_of_birth),
      biologicalSex: String(raw.biological_sex),
      visitNumber: String(raw.visit_number),
      requestNumber: String(raw.request_number),
      consultationNumber: String(raw.consultation_number),
      branchId: String(raw.branch_id),
      branchName: String(raw.branch_name),
      doctorName: String(raw.doctor_name),
      doctorJobTitle: typeof raw.doctor_job_title === "string" ? raw.doctor_job_title : null,
      documentNumber: typeof raw.document_number === "string" ? raw.document_number : null,
      documentStatus: typeof raw.document_status === "string" ? raw.document_status : null,
      releaseStatus: typeof raw.release_status === "string" ? raw.release_status : null,
      items: Array.isArray(raw.items) ? raw.items.map((item: Record<string, unknown>) => toItem(item)) : [],
      reviewHistory: history,
    }
  })

  return { context, records }
}
