import {
  MEDICAL_CONDITION_STATUS_LABELS,
  MEDICAL_HISTORY_RECORD_STATUS_LABELS,
  MEDICAL_HISTORY_VERIFICATION_LABELS,
} from "@/features/patients/constants/medical-history.constants"
import {
  ALLERGY_CATEGORY_LABELS,
  ALLERGY_CLINICAL_STATUS_LABELS,
  ALLERGY_CRITICALITY_LABELS,
  ALLERGY_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-allergy.constants"
import {
  PATIENT_DOCUMENT_CATEGORY_LABELS,
  PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS,
  PATIENT_DOCUMENT_STATUS_LABELS,
  PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-document.constants"
import {
  INSURANCE_COVERAGE_STATUS_LABELS,
  INSURANCE_COVERAGE_TYPE_LABELS,
  INSURANCE_PRIORITY_LABELS,
  INSURANCE_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-insurance.constants"
import {
  VITAL_SIGNS_CONTEXT_LABELS,
  VITAL_SIGNS_RECORD_STATUS_LABELS,
} from "@/features/patients/constants/vital-signs.constants"
import {
  LABORATORY_SPECIMEN_TYPE_LABELS,
} from "@/features/laboratory/constants/laboratory.constants"
import type {
  LaboratoryResultSet,
} from "@/features/laboratory/types/laboratory-result.types"
import type {
  LaboratoryOrder,
} from "@/features/laboratory/types/laboratory.types"
import type { MedicalHistoryRecord } from "@/features/patients/types/medical-history.types"
import type { PatientAllergyRecord } from "@/features/patients/types/patient-allergy.types"
import type { PatientDocumentRecord } from "@/features/patients/types/patient-document.types"
import type { PatientInsuranceRecord } from "@/features/patients/types/patient-insurance.types"
import type { PatientTimelineEvent } from "@/features/patients/types/patient-timeline.types"
import type { Patient } from "@/features/patients/types/patient.types"
import type { VitalSignsRecord } from "@/features/patients/types/vital-signs.types"
import {
  formatPatientDate,
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"
import {
  maskPatientDocumentFileName,
} from "@/features/patients/utils/patient-document.utils"
import {
  maskInsuranceIdentifier,
} from "@/features/patients/utils/patient-insurance.utils"
import {
  formatBloodPressure,
  formatVitalMeasurement,
} from "@/features/patients/utils/vital-signs.utils"

interface BuildPatientTimelineInput {
  patient: Patient
  medicalHistoryRecords:
    readonly MedicalHistoryRecord[]
  vitalSignsRecords:
    readonly VitalSignsRecord[]
  allergyRecords:
    readonly PatientAllergyRecord[]
  insuranceRecords:
    readonly PatientInsuranceRecord[]
  documentRecords:
    readonly PatientDocumentRecord[]

  laboratoryOrders:
    readonly LaboratoryOrder[]

  laboratoryResultSets:
    readonly LaboratoryResultSet[]
}

function getTimestamp(
  value: string | null
): number | null {
  if (!value) {
    return null
  }

  const timestamp = new Date(value).getTime()

  return Number.isNaN(timestamp)
    ? null
    : timestamp
}

function occurredMeaningfullyLater(
  laterValue: string | null,
  earlierValue: string | null
): boolean {
  const laterTimestamp =
    getTimestamp(laterValue)

  const earlierTimestamp =
    getTimestamp(earlierValue)

  if (
    laterTimestamp === null ||
    earlierTimestamp === null
  ) {
    return false
  }

  return laterTimestamp >
    earlierTimestamp + 1000
}

function representsSameMoment(
  firstValue: string | null,
  secondValue: string | null
): boolean {
  const firstTimestamp =
    getTimestamp(firstValue)

  const secondTimestamp =
    getTimestamp(secondValue)

  if (
    firstTimestamp === null ||
    secondTimestamp === null
  ) {
    return false
  }

  return Math.abs(
    firstTimestamp - secondTimestamp
  ) <= 1000
}

function createEventId(
  source: string,
  recordId: string,
  action: string
): string {
  return `${source}-${recordId}-${action}`
}

function getArchiveSummary(
  subject: string,
  reason: string | null
): string {
  return reason
    ? `${subject} was archived. Reason: ${reason}`
    : `${subject} was archived and retained for historical reference.`
}

export function buildPatientTimelineEvents({
  patient,
  medicalHistoryRecords,
  vitalSignsRecords,
  allergyRecords,
  insuranceRecords,
  documentRecords,
  laboratoryOrders,
  laboratoryResultSets,
}: BuildPatientTimelineInput): PatientTimelineEvent[] {
  const events: PatientTimelineEvent[] = []

  events.push({
    id: createEventId(
      "patient",
      patient.id,
      "registered"
    ),
    patientId: patient.id,
    occurredAt: patient.createdAt,
    category: "patient",
    action: "registered",
    title: "Patient registered",
    summary: `${patient.medicalRecordNumber} was created at ${patient.branchName}.`,
    actor: null,
    reference:
      patient.medicalRecordNumber,
    sourceSection: "overview",
    sourceRecordId: patient.id,
    recordStatus:
      patient.status === "archived"
        ? "archived"
        : "current",
    details: [
      {
        label: "Medical record number",
        value:
          patient.medicalRecordNumber,
      },
      {
        label: "Registration branch",
        value: patient.branchName,
      },
      {
        label: "Registration date",
        value: formatPatientDateTime(
          patient.createdAt
        ),
      },
      {
        label: "Patient status",
        value: patient.status,
      },
    ],
  })

  medicalHistoryRecords
    .filter(
      (record) =>
        record.patientId === patient.id
    )
    .forEach((record) => {
      const reference =
        record.icd10Code ??
        record.conditionName

      events.push({
        id: createEventId(
          "medical-history",
          record.id,
          "recorded"
        ),
        patientId: patient.id,
        occurredAt: record.recordedAt,
        category: "medical-history",
        action: "recorded",
        title: "Medical condition recorded",
        summary: `${record.conditionName} was added to the structured medical history.`,
        actor: record.recordedBy,
        reference,
        sourceSection: "medical-history",
        sourceRecordId: record.id,
        recordStatus:
          record.recordStatus,
        details: [
          {
            label: "Condition",
            value: record.conditionName,
          },
          {
            label: "ICD-10 code",
            value:
              record.icd10Code ??
              "Not recorded",
          },
          {
            label: "Clinical status",
            value:
              MEDICAL_CONDITION_STATUS_LABELS[
                record.clinicalStatus
              ],
          },
          {
            label: "Verification",
            value:
              MEDICAL_HISTORY_VERIFICATION_LABELS[
                record.verificationStatus
              ],
          },
          {
            label: "Onset date",
            value: formatPatientDate(
              record.onsetDate,
              "Not recorded"
            ),
          },
          {
            label: "Record status",
            value:
              MEDICAL_HISTORY_RECORD_STATUS_LABELS[
                record.recordStatus
              ],
          },
        ],
      })

      if (
        occurredMeaningfullyLater(
          record.updatedAt,
          record.recordedAt
        ) &&
        !representsSameMoment(
          record.updatedAt,
          record.archivedAt
        )
      ) {
        events.push({
          id: createEventId(
            "medical-history",
            record.id,
            "updated"
          ),
          patientId: patient.id,
          occurredAt: record.updatedAt,
          category: "medical-history",
          action: "updated",
          title: "Medical condition updated",
          summary: `${record.conditionName} was updated in the structured medical history.`,
          actor: record.updatedBy,
          reference,
          sourceSection:
            "medical-history",
          sourceRecordId: record.id,
          recordStatus:
            record.recordStatus,
          details: [
            {
              label: "Condition",
              value: record.conditionName,
            },
            {
              label: "Clinical status",
              value:
                MEDICAL_CONDITION_STATUS_LABELS[
                  record.clinicalStatus
                ],
            },
            {
              label: "Last updated",
              value:
                formatPatientDateTime(
                  record.updatedAt
                ),
            },
          ],
        })
      }

      if (record.archivedAt) {
        events.push({
          id: createEventId(
            "medical-history",
            record.id,
            "archived"
          ),
          patientId: patient.id,
          occurredAt: record.archivedAt,
          category: "medical-history",
          action: "archived",
          title:
            "Medical-history record archived",
          summary: getArchiveSummary(
            record.conditionName,
            record.archiveReason
          ),
          actor: record.archivedBy,
          reference,
          sourceSection:
            "medical-history",
          sourceRecordId: record.id,
          recordStatus: "archived",
          details: [
            {
              label: "Condition",
              value: record.conditionName,
            },
            {
              label: "Archive reason",
              value:
                record.archiveReason ??
                "Not recorded",
            },
          ],
        })
      }
    })

  vitalSignsRecords
    .filter(
      (record) =>
        record.patientId === patient.id
    )
    .forEach((record) => {
      const measurementReference =
        formatPatientDateTime(
          record.measuredAt
        )

      events.push({
        id: createEventId(
          "vital-signs",
          record.id,
          "measured"
        ),
        patientId: patient.id,
        occurredAt: record.measuredAt,
        category: "vital-signs",
        action: "measured",
        title: "Vital signs measured",
        summary: `${VITAL_SIGNS_CONTEXT_LABELS[record.context]} measurement set was recorded.`,
        actor: record.recordedBy,
        reference:
          measurementReference,
        sourceSection: "vital-signs",
        sourceRecordId: record.id,
        recordStatus:
          record.recordStatus,
        details: [
          {
            label: "Context",
            value:
              VITAL_SIGNS_CONTEXT_LABELS[
                record.context
              ],
          },
          {
            label: "Blood pressure",
            value: formatBloodPressure(
              record.systolicBloodPressureMmHg,
              record.diastolicBloodPressureMmHg
            ),
          },
          {
            label: "Heart rate",
            value: formatVitalMeasurement(
              record.heartRateBpm,
              "bpm"
            ),
          },
          {
            label: "Respiratory rate",
            value: formatVitalMeasurement(
              record.respiratoryRatePerMinute,
              "breaths/min"
            ),
          },
          {
            label: "Temperature",
            value: formatVitalMeasurement(
              record.temperatureCelsius,
              "°C"
            ),
          },
          {
            label: "Oxygen saturation",
            value: formatVitalMeasurement(
              record.oxygenSaturationPercent,
              "%"
            ),
          },
          {
            label: "BMI",
            value: formatVitalMeasurement(
              record.bmi,
              "kg/m²"
            ),
          },
          {
            label: "Record status",
            value:
              VITAL_SIGNS_RECORD_STATUS_LABELS[
                record.recordStatus
              ],
          },
        ],
      })

      if (
        occurredMeaningfullyLater(
          record.updatedAt,
          record.recordedAt
        ) &&
        !representsSameMoment(
          record.updatedAt,
          record.archivedAt
        )
      ) {
        events.push({
          id: createEventId(
            "vital-signs",
            record.id,
            "updated"
          ),
          patientId: patient.id,
          occurredAt: record.updatedAt,
          category: "vital-signs",
          action: "updated",
          title:
            "Vital-sign record updated",
          summary: `The ${measurementReference} measurement set was updated.`,
          actor: record.updatedBy,
          reference:
            measurementReference,
          sourceSection: "vital-signs",
          sourceRecordId: record.id,
          recordStatus:
            record.recordStatus,
          details: [
            {
              label: "Measurement time",
              value:
                measurementReference,
            },
            {
              label: "Last updated",
              value:
                formatPatientDateTime(
                  record.updatedAt
                ),
            },
          ],
        })
      }

      if (record.archivedAt) {
        events.push({
          id: createEventId(
            "vital-signs",
            record.id,
            "archived"
          ),
          patientId: patient.id,
          occurredAt: record.archivedAt,
          category: "vital-signs",
          action: "archived",
          title:
            "Vital-sign record archived",
          summary: getArchiveSummary(
            `${measurementReference} measurement set`,
            record.archiveReason
          ),
          actor: record.archivedBy,
          reference:
            measurementReference,
          sourceSection: "vital-signs",
          sourceRecordId: record.id,
          recordStatus: "archived",
          details: [
            {
              label: "Measurement time",
              value:
                measurementReference,
            },
            {
              label: "Archive reason",
              value:
                record.archiveReason ??
                "Not recorded",
            },
          ],
        })
      }
    })

  allergyRecords
    .filter(
      (record) =>
        record.patientId === patient.id
    )
    .forEach((record) => {
      events.push({
        id: createEventId(
          "allergy",
          record.id,
          "recorded"
        ),
        patientId: patient.id,
        occurredAt: record.recordedAt,
        category: "allergy",
        action: "recorded",
        title:
          "Allergy or intolerance recorded",
        summary: `${record.allergenName} was added to the patient allergy profile.`,
        actor: record.recordedBy,
        reference: record.allergenName,
        sourceSection: "allergies",
        sourceRecordId: record.id,
        recordStatus:
          record.recordStatus,
        details: [
          {
            label: "Allergen",
            value: record.allergenName,
          },
          {
            label: "Category",
            value:
              ALLERGY_CATEGORY_LABELS[
                record.category
              ],
          },
          {
            label: "Clinical status",
            value:
              ALLERGY_CLINICAL_STATUS_LABELS[
                record.clinicalStatus
              ],
          },
          {
            label: "Verification",
            value:
              ALLERGY_VERIFICATION_STATUS_LABELS[
                record.verificationStatus
              ],
          },
          {
            label: "Criticality",
            value:
              ALLERGY_CRITICALITY_LABELS[
                record.criticality
              ],
          },
          {
            label: "Reaction",
            value:
              record.reactionManifestations
                .length > 0
                ? record.reactionManifestations.join(
                    ", "
                  )
                : "Not recorded",
          },
        ],
      })

      if (
        occurredMeaningfullyLater(
          record.updatedAt,
          record.recordedAt
        ) &&
        !representsSameMoment(
          record.updatedAt,
          record.archivedAt
        )
      ) {
        events.push({
          id: createEventId(
            "allergy",
            record.id,
            "updated"
          ),
          patientId: patient.id,
          occurredAt: record.updatedAt,
          category: "allergy",
          action: "updated",
          title:
            "Allergy record updated",
          summary: `${record.allergenName} was updated.`,
          actor: record.updatedBy,
          reference: record.allergenName,
          sourceSection: "allergies",
          sourceRecordId: record.id,
          recordStatus:
            record.recordStatus,
          details: [
            {
              label: "Allergen",
              value: record.allergenName,
            },
            {
              label: "Clinical status",
              value:
                ALLERGY_CLINICAL_STATUS_LABELS[
                  record.clinicalStatus
                ],
            },
            {
              label: "Criticality",
              value:
                ALLERGY_CRITICALITY_LABELS[
                  record.criticality
                ],
            },
          ],
        })
      }

      if (record.archivedAt) {
        events.push({
          id: createEventId(
            "allergy",
            record.id,
            "archived"
          ),
          patientId: patient.id,
          occurredAt: record.archivedAt,
          category: "allergy",
          action: "archived",
          title:
            "Allergy record archived",
          summary: getArchiveSummary(
            record.allergenName,
            record.archiveReason
          ),
          actor: record.archivedBy,
          reference: record.allergenName,
          sourceSection: "allergies",
          sourceRecordId: record.id,
          recordStatus: "archived",
          details: [
            {
              label: "Allergen",
              value: record.allergenName,
            },
            {
              label: "Archive reason",
              value:
                record.archiveReason ??
                "Not recorded",
            },
          ],
        })
      }
    })

  insuranceRecords
    .filter(
      (record) =>
        record.patientId === patient.id
    )
    .forEach((record) => {
      const coverageReference =
        `${record.payerName} — ${record.planName}`

      events.push({
        id: createEventId(
          "insurance",
          record.id,
          "recorded"
        ),
        patientId: patient.id,
        occurredAt: record.recordedAt,
        category: "insurance",
        action: "recorded",
        title:
          "Insurance coverage recorded",
        summary: `${coverageReference} was added to the patient profile.`,
        actor: record.recordedBy,
        reference: coverageReference,
        sourceSection: "insurance",
        sourceRecordId: record.id,
        recordStatus:
          record.recordStatus,
        details: [
          {
            label: "Payer",
            value: record.payerName,
          },
          {
            label: "Plan",
            value: record.planName,
          },
          {
            label: "Coverage type",
            value:
              INSURANCE_COVERAGE_TYPE_LABELS[
                record.coverageType
              ],
          },
          {
            label: "Coverage status",
            value:
              INSURANCE_COVERAGE_STATUS_LABELS[
                record.coverageStatus
              ],
          },
          {
            label: "Priority",
            value:
              INSURANCE_PRIORITY_LABELS[
                record.priority
              ],
          },
          {
            label: "Member number",
            value:
              maskInsuranceIdentifier(
                record.memberNumber
              ),
            sensitive: true,
          },
        ],
      })

      if (record.verifiedAt) {
        events.push({
          id: createEventId(
            "insurance",
            record.id,
            "verified"
          ),
          patientId: patient.id,
          occurredAt: record.verifiedAt,
          category: "insurance",
          action: "verified",
          title:
            "Insurance coverage verified",
          summary: `${coverageReference} was marked ${INSURANCE_VERIFICATION_STATUS_LABELS[record.verificationStatus].toLowerCase()}.`,
          actor: record.verifiedBy,
          reference: coverageReference,
          sourceSection: "insurance",
          sourceRecordId: record.id,
          recordStatus:
            record.recordStatus,
          details: [
            {
              label: "Verification status",
              value:
                INSURANCE_VERIFICATION_STATUS_LABELS[
                  record.verificationStatus
                ],
            },
            {
              label: "Verification reference",
              value:
                record.verificationReference ??
                "Not recorded",
              sensitive: true,
            },
          ],
        })
      }

      if (
        occurredMeaningfullyLater(
          record.updatedAt,
          record.recordedAt
        ) &&
        !representsSameMoment(
          record.updatedAt,
          record.verifiedAt
        ) &&
        !representsSameMoment(
          record.updatedAt,
          record.archivedAt
        )
      ) {
        events.push({
          id: createEventId(
            "insurance",
            record.id,
            "updated"
          ),
          patientId: patient.id,
          occurredAt: record.updatedAt,
          category: "insurance",
          action: "updated",
          title:
            "Insurance coverage updated",
          summary: `${coverageReference} was updated.`,
          actor: record.updatedBy,
          reference: coverageReference,
          sourceSection: "insurance",
          sourceRecordId: record.id,
          recordStatus:
            record.recordStatus,
          details: [
            {
              label: "Coverage status",
              value:
                INSURANCE_COVERAGE_STATUS_LABELS[
                  record.coverageStatus
                ],
            },
            {
              label: "Verification",
              value:
                INSURANCE_VERIFICATION_STATUS_LABELS[
                  record.verificationStatus
                ],
            },
          ],
        })
      }

      if (record.archivedAt) {
        events.push({
          id: createEventId(
            "insurance",
            record.id,
            "archived"
          ),
          patientId: patient.id,
          occurredAt: record.archivedAt,
          category: "insurance",
          action: "archived",
          title:
            "Insurance coverage archived",
          summary: getArchiveSummary(
            coverageReference,
            record.archiveReason
          ),
          actor: record.archivedBy,
          reference: coverageReference,
          sourceSection: "insurance",
          sourceRecordId: record.id,
          recordStatus: "archived",
          details: [
            {
              label: "Coverage",
              value: coverageReference,
            },
            {
              label: "Archive reason",
              value:
                record.archiveReason ??
                "Not recorded",
            },
          ],
        })
      }
    })

  documentRecords
    .filter(
      (record) =>
        record.patientId === patient.id
    )
    .forEach((record) => {
      const displayedFileName =
        maskPatientDocumentFileName(
          record.fileName,
          record.category,
          record.confidentialityLevel
        )

      events.push({
        id: createEventId(
          "document",
          record.id,
          "uploaded"
        ),
        patientId: patient.id,
        occurredAt: record.uploadedAt,
        category: "document",
        action: "uploaded",
        title:
          "Patient document metadata added",
        summary: `${record.title} was added to the Patient Documents module.`,
        actor: record.uploadedBy,
        reference: record.title,
        sourceSection: "documents",
        sourceRecordId: record.id,
        recordStatus:
          record.recordStatus,
        details: [
          {
            label: "Document title",
            value: record.title,
          },
          {
            label: "Category",
            value:
              PATIENT_DOCUMENT_CATEGORY_LABELS[
                record.category
              ],
          },
          {
            label: "Document status",
            value:
              PATIENT_DOCUMENT_STATUS_LABELS[
                record.documentStatus
              ],
          },
          {
            label: "Confidentiality",
            value:
              PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS[
                record.confidentialityLevel
              ],
          },
          {
            label: "File name",
            value: displayedFileName,
            sensitive: true,
          },
          {
            label: "Binary availability",
            value: record.binaryAvailable
              ? "Available"
              : "Metadata only",
          },
        ],
      })

      if (record.verifiedAt) {
        events.push({
          id: createEventId(
            "document",
            record.id,
            "verified"
          ),
          patientId: patient.id,
          occurredAt: record.verifiedAt,
          category: "document",
          action: "verified",
          title:
            "Patient document verified",
          summary: `${record.title} was marked ${PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS[record.verificationStatus].toLowerCase()}.`,
          actor: record.verifiedBy,
          reference: record.title,
          sourceSection: "documents",
          sourceRecordId: record.id,
          recordStatus:
            record.recordStatus,
          details: [
            {
              label: "Verification status",
              value:
                PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS[
                  record.verificationStatus
                ],
            },
            {
              label: "Verification reference",
              value:
                record.verificationReference ??
                "Not recorded",
              sensitive: true,
            },
          ],
        })
      }

      if (
        occurredMeaningfullyLater(
          record.updatedAt,
          record.uploadedAt
        ) &&
        !representsSameMoment(
          record.updatedAt,
          record.verifiedAt
        ) &&
        !representsSameMoment(
          record.updatedAt,
          record.archivedAt
        )
      ) {
        events.push({
          id: createEventId(
            "document",
            record.id,
            "updated"
          ),
          patientId: patient.id,
          occurredAt: record.updatedAt,
          category: "document",
          action: "updated",
          title:
            "Patient document metadata updated",
          summary: `${record.title} metadata was updated.`,
          actor: record.updatedBy,
          reference: record.title,
          sourceSection: "documents",
          sourceRecordId: record.id,
          recordStatus:
            record.recordStatus,
          details: [
            {
              label: "Document status",
              value:
                PATIENT_DOCUMENT_STATUS_LABELS[
                  record.documentStatus
                ],
            },
            {
              label: "Verification",
              value:
                PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS[
                  record.verificationStatus
                ],
            },
          ],
        })
      }

      if (record.archivedAt) {
        events.push({
          id: createEventId(
            "document",
            record.id,
            "archived"
          ),
          patientId: patient.id,
          occurredAt: record.archivedAt,
          category: "document",
          action: "archived",
          title:
            "Patient document archived",
          summary: getArchiveSummary(
            record.title,
            record.archiveReason
          ),
          actor: record.archivedBy,
          reference: record.title,
          sourceSection: "documents",
          sourceRecordId: record.id,
          recordStatus: "archived",
          details: [
            {
              label: "Document title",
              value: record.title,
            },
            {
              label: "Archive reason",
              value:
                record.archiveReason ??
                "Not recorded",
            },
          ],
        })
      }
    })

  laboratoryResultSets
    .filter(
      (resultSet) =>
        resultSet.patientId ===
          patient.id &&
        resultSet.status ===
          "released" &&
        Boolean(resultSet.releasedAt)
    )
    .forEach((resultSet) => {
      const order =
        laboratoryOrders.find(
          (candidateOrder) =>
            candidateOrder.id ===
            resultSet.orderId
        ) ?? null

      const orderItem =
        order?.items.find(
          (item) =>
            item.id ===
            resultSet.orderItemId
        ) ?? null

      if (
        !order ||
        !orderItem ||
        !resultSet.releasedAt
      ) {
        return
      }

      const abnormalCount =
        resultSet.entries.filter(
          (entry) =>
            entry.flag !== "normal" &&
            entry.flag !==
              "not-applicable"
        ).length

      const criticalCount =
        resultSet.entries.filter(
          (entry) =>
            entry.flag ===
              "critical-low" ||
            entry.flag ===
              "critical-high"
        ).length

      events.push({
        id: createEventId(
          "laboratory-result",
          resultSet.id,
          "released"
        ),

        patientId:
          patient.id,

        occurredAt:
          resultSet.releasedAt,

        category: "laboratory",
        action: "released",

        title: `${resultSet.testName} results released`,

        summary: `${resultSet.testName} results were released with ${abnormalCount} abnormal flag${
          abnormalCount === 1
            ? ""
            : "s"
        } and ${criticalCount} critical flag${
          criticalCount === 1
            ? ""
            : "s"
        }.`,

        actor:
          resultSet.releasedBy,

        reference:
          resultSet.testName,

        sourceSection: "timeline",

        sourceRecordId:
          resultSet.id,

        recordStatus:
          "current",

        details: [
          {
            label:
              "Laboratory test",
            value:
              resultSet.testName,
          },
          {
            label: "Test code",
            value:
              resultSet.testCode,
          },
          {
            label:
              "Laboratory order",
            value:
              order.orderNumber,
            sensitive: true,
          },
          {
            label:
              "Specimen type",
            value:
              LABORATORY_SPECIMEN_TYPE_LABELS[
                orderItem.specimenType
              ],
          },
          {
            label:
              "Analytes released",
            value: String(
              resultSet.entries.length
            ),
          },
          {
            label:
              "Abnormal flags",
            value: String(
              abnormalCount
            ),
          },
          {
            label:
              "Critical flags",
            value: String(
              criticalCount
            ),
          },
          {
            label:
              "Released by",
            value:
              resultSet.releasedBy ??
              "Not recorded",
          },
          {
            label:
              "Released at",
            value:
              formatPatientDateTime(
                resultSet.releasedAt
              ),
          },
          {
            label:
              "Release note",
            value:
              resultSet.releaseNote ??
              "No note recorded",
            sensitive: true,
          },
        ],
      })
    })
  return events.sort(
    (firstEvent, secondEvent) =>
      new Date(
        secondEvent.occurredAt
      ).getTime() -
      new Date(
        firstEvent.occurredAt
      ).getTime()
  )
}
