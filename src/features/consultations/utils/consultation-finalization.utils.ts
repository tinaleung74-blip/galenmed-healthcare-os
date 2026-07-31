import type { ConsultationDiagnosisRecord } from "@/features/consultations/types/consultation-diagnosis.types"
import type { ConsultationFinalizationRecord } from "@/features/consultations/types/consultation-finalization.types"
import type { ConsultationSoapNote } from "@/features/consultations/types/consultation-emr.types"
import type { ConsultationPrescriptionRecord } from "@/features/consultations/types/consultation-prescription.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"

export type ConsultationFinalizationRequirementId =
  | "consultation-status"
  | "follow-up-plan"
  | "soap-note"
  | "primary-diagnosis"
  | "prescription-allergy-review"

export interface ConsultationFinalizationRequirement {
  id: ConsultationFinalizationRequirementId
  label: string
  description: string
  met: boolean
}

export interface ConsultationFinalizationReadiness {
  ready: boolean
  requirements:
    ConsultationFinalizationRequirement[]
}

interface BuildFinalizationReadinessInput {
  consultation: ConsultationEncounter

  finalizationRecord:
    | ConsultationFinalizationRecord
    | null

  soapNote:
    | ConsultationSoapNote
    | null

  diagnosisRecords:
    readonly ConsultationDiagnosisRecord[]

  prescriptionRecords:
    readonly ConsultationPrescriptionRecord[]
}

function isFollowUpRecordComplete(
  record:
    | ConsultationFinalizationRecord
    | null
): boolean {
  if (!record) {
    return false
  }

  const hasInstructions =
    record.patientInstructions.trim().length >=
      3 ||
    record.returnPrecautions.trim().length >=
      3

  if (!hasInstructions) {
    return false
  }

  if (
    record.followUpDisposition ===
    "scheduled"
  ) {
    return Boolean(
      record.followUpDate &&
      record.followUpMode &&
      record.followUpReason
    )
  }

  if (
    record.followUpDisposition ===
    "as-needed"
  ) {
    return Boolean(record.followUpReason)
  }

  if (
    record.followUpDisposition ===
    "external-referral"
  ) {
    return Boolean(
      record.referralFacility &&
      record.referralReason
    )
  }

  return true
}

function isSoapComplete(
  note: ConsultationSoapNote | null
): boolean {
  if (!note) {
    return false
  }

  return [
    note.subjective,
    note.objective,
    note.assessment,
    note.plan,
  ].every(
    (section) =>
      section.trim().length >= 2
  )
}

export function buildConsultationFinalizationReadiness({
  consultation,
  finalizationRecord,
  soapNote,
  diagnosisRecords,
  prescriptionRecords,
}: BuildFinalizationReadinessInput): ConsultationFinalizationReadiness {
  const currentDiagnoses =
    diagnosisRecords.filter(
      (record) =>
        record.consultationId ===
          consultation.id &&
        record.recordStatus === "current"
    )

  const confirmedPrimaryDiagnosis =
    currentDiagnoses.find(
      (record) =>
        record.role === "primary" &&
        record.verificationStatus ===
          "confirmed"
    ) ?? null

  const currentDraftPrescriptions =
    prescriptionRecords.filter(
      (record) =>
        record.consultationId ===
          consultation.id &&
        record.recordStatus === "current" &&
        record.status === "draft"
    )

  const unreviewedPrescription =
    currentDraftPrescriptions.find(
      (record) =>
        record.allergyReviewStatus ===
        "not-reviewed"
    ) ?? null

  const requirements:
    ConsultationFinalizationRequirement[] =
    [
      {
        id: "consultation-status",
        label:
          "Consultation is in progress",
        description:
          consultation.status ===
          "in-progress"
            ? "The encounter is open for clinical documentation."
            : `Current consultation status: ${consultation.status}.`,
        met:
          consultation.status ===
          "in-progress",
      },
      {
        id: "follow-up-plan",
        label:
          "Follow-up and discharge plan completed",
        description:
          isFollowUpRecordComplete(
            finalizationRecord
          )
            ? "Follow-up disposition and patient-facing instructions are recorded."
            : "Save a valid follow-up plan with patient instructions or return precautions.",
        met:
          isFollowUpRecordComplete(
            finalizationRecord
          ),
      },
      {
        id: "soap-note",
        label:
          "SOAP note is complete",
        description:
          isSoapComplete(soapNote)
            ? "Subjective, Objective, Assessment, and Plan contain documentation."
            : "Complete all four SOAP sections before finalization.",
        met: isSoapComplete(soapNote),
      },
      {
        id: "primary-diagnosis",
        label:
          "Confirmed primary diagnosis recorded",
        description:
          confirmedPrimaryDiagnosis
            ? `${confirmedPrimaryDiagnosis.diagnosisName}${
                confirmedPrimaryDiagnosis.icd10Code
                  ? ` — ${confirmedPrimaryDiagnosis.icd10Code}`
                  : ""
              }`
            : "Add one current confirmed primary diagnosis.",
        met: Boolean(
          confirmedPrimaryDiagnosis
        ),
      },
      {
        id:
          "prescription-allergy-review",
        label:
          "Prescription allergy review completed",
        description:
          unreviewedPrescription
            ? `${unreviewedPrescription.medicationName} is still marked Not reviewed.`
            : currentDraftPrescriptions.length >
                0
              ? "All current draft prescriptions have a documented allergy review."
              : "No draft prescriptions require allergy review.",
        met: !unreviewedPrescription,
      },
    ]

  return {
    ready: requirements.every(
      (requirement) =>
        requirement.met
    ),
    requirements,
  }
}
