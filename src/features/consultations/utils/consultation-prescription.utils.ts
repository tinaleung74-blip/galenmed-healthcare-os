import {
  CONSULTATION_MEDICATION_DOSE_UNIT_LABELS,
  CONSULTATION_MEDICATION_DURATION_UNIT_LABELS,
  CONSULTATION_MEDICATION_FREQUENCY_LABELS,
  CONSULTATION_MEDICATION_ROUTE_LABELS,
} from "@/features/consultations/constants/consultation-prescription.constants"
import type { ConsultationPrescriptionRecord } from "@/features/consultations/types/consultation-prescription.types"
import { formatPatientDate } from "@/features/patients/utils/patient.utils"

export function formatPrescriptionDose(
  record: ConsultationPrescriptionRecord
): string {
  return `${record.doseAmount} ${
    CONSULTATION_MEDICATION_DOSE_UNIT_LABELS[
      record.doseUnit
    ]
  }`
}

export function formatPrescriptionRoute(
  record: ConsultationPrescriptionRecord
): string {
  return CONSULTATION_MEDICATION_ROUTE_LABELS[
    record.route
  ]
}

export function formatPrescriptionFrequency(
  record: ConsultationPrescriptionRecord
): string {
  const frequencyLabel =
    CONSULTATION_MEDICATION_FREQUENCY_LABELS[
      record.frequency
    ]

  return record.frequencyDetails
    ? `${frequencyLabel} — ${record.frequencyDetails}`
    : frequencyLabel
}

export function formatPrescriptionDuration(
  record: ConsultationPrescriptionRecord
): string {
  if (record.durationUnit === "ongoing") {
    return "Ongoing"
  }

  if (record.durationValue === null) {
    return "Not recorded"
  }

  return `${record.durationValue} ${
    CONSULTATION_MEDICATION_DURATION_UNIT_LABELS[
      record.durationUnit
    ]
  }`
}

export function formatPrescriptionQuantity(
  record: ConsultationPrescriptionRecord
): string {
  return `${record.quantity} ${record.quantityUnit}`
}

export function formatPrescriptionPeriod(
  record: ConsultationPrescriptionRecord
): string {
  const startDate = formatPatientDate(
    record.startDate
  )

  const endDate = formatPatientDate(
    record.endDate,
    record.durationUnit === "ongoing"
      ? "Ongoing"
      : "No end date"
  )

  return `${startDate} – ${endDate}`
}
