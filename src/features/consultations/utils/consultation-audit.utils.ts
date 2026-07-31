import type { ConsultationDiagnosisRecord } from "@/features/consultations/types/consultation-diagnosis.types"
import type {
  ConsultationFinalizationRecord,
  ConsultationFinalizationRevision,
} from "@/features/consultations/types/consultation-finalization.types"
import type { ConsultationSoapNoteRevision } from "@/features/consultations/types/consultation-emr.types"
import type { ConsultationPrescriptionRecord } from "@/features/consultations/types/consultation-prescription.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import type {
  ConsultationAuditEvent,
  ConsultationAuditEventAction,
} from "@/features/consultations/types/consultation-audit.types"

interface BuildConsultationAuditEventsInput {
  consultation: ConsultationEncounter

  soapNoteRevisions:
    readonly ConsultationSoapNoteRevision[]

  diagnosisRecords:
    readonly ConsultationDiagnosisRecord[]

  prescriptionRecords:
    readonly ConsultationPrescriptionRecord[]

  finalizationRevisions:
    readonly ConsultationFinalizationRevision[]

  finalizationRecord:
    | ConsultationFinalizationRecord
    | null
}

function createAuditId(
  source: string,
  sourceId: string,
  action: string
): string {
  return `${source}-${sourceId}-${action}`
}

function getTimestamp(
  value: string | null
): number | null {
  if (!value) {
    return null
  }

  const timestamp =
    new Date(value).getTime()

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

  return (
    laterTimestamp >
    earlierTimestamp + 1000
  )
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

  return (
    Math.abs(
      firstTimestamp -
        secondTimestamp
    ) <= 1000
  )
}

function mapSoapRevisionAction(
  action:
    ConsultationSoapNoteRevision["action"]
): ConsultationAuditEventAction {
  if (action === "created") {
    return "created"
  }

  if (action === "saved") {
    return "saved"
  }

  if (action === "finalized") {
    return "finalized"
  }

  return "updated"
}

function mapFinalizationRevisionAction(
  action:
    ConsultationFinalizationRevision["action"]
): ConsultationAuditEventAction {
  if (action === "created") {
    return "created"
  }

  if (action === "saved") {
    return "saved"
  }

  if (action === "finalized") {
    return "finalized"
  }

  return "updated"
}

export function buildConsultationAuditEvents({
  consultation,
  soapNoteRevisions,
  diagnosisRecords,
  prescriptionRecords,
  finalizationRevisions,
  finalizationRecord,
}: BuildConsultationAuditEventsInput): ConsultationAuditEvent[] {
  const events:
    ConsultationAuditEvent[] = []

  events.push({
    id: createAuditId(
      "encounter",
      consultation.id,
      "created"
    ),

    consultationId:
      consultation.id,

    patientId:
      consultation.patientId,

    occurredAt:
      consultation.createdAt,

    category: "encounter",
    action: "created",

    title:
      "Consultation record created",

    summary: `${consultation.consultationNumber} was scheduled under ${consultation.departmentName}.`,

    actor: null,

    reference:
      consultation.consultationNumber,

    details: [
      {
        label: "Doctor",
        value: consultation.doctorName,
      },
      {
        label: "Department",
        value:
          consultation.departmentName,
      },
      {
        label: "Chief complaint",
        value:
          consultation.chiefComplaint,
      },
      {
        label: "Consultation mode",
        value: consultation.mode,
      },
    ],
  })

  if (consultation.checkedInAt) {
    events.push({
      id: createAuditId(
        "encounter",
        consultation.id,
        "checked-in"
      ),

      consultationId:
        consultation.id,

      patientId:
        consultation.patientId,

      occurredAt:
        consultation.checkedInAt,

      category: "encounter",
      action: "checked-in",

      title: "Patient checked in",

      summary:
        "Patient check-in was recorded for the consultation.",

      actor: null,

      reference:
        consultation.consultationNumber,

      details: [
        {
          label: "Queue number",
          value:
            consultation.queueNumber ===
            null
              ? "Not assigned"
              : `#${consultation.queueNumber}`,
        },
        {
          label: "Room",
          value:
            consultation.roomName ??
            "Not assigned",
        },
      ],
    })
  }

  if (consultation.startedAt) {
    events.push({
      id: createAuditId(
        "encounter",
        consultation.id,
        "started"
      ),

      consultationId:
        consultation.id,

      patientId:
        consultation.patientId,

      occurredAt:
        consultation.startedAt,

      category: "encounter",
      action: "started",

      title: "Consultation started",

      summary: `${consultation.doctorName} started the clinical encounter.`,

      actor:
        consultation.doctorName,

      reference:
        consultation.consultationNumber,

      details: [
        {
          label: "Doctor",
          value:
            consultation.doctorName,
        },
        {
          label: "Department",
          value:
            consultation.departmentName,
        },
      ],
    })
  }

  soapNoteRevisions
    .filter(
      (revision) =>
        revision.consultationId ===
        consultation.id
    )
    .forEach((revision) => {
      const action =
        mapSoapRevisionAction(
          revision.action
        )

      events.push({
        id: createAuditId(
          "soap",
          revision.id,
          action
        ),

        consultationId:
          consultation.id,

        patientId:
          consultation.patientId,

        occurredAt:
          revision.changedAt,

        category: "soap",
        action,

        title:
          action === "finalized"
            ? "SOAP note finalized"
            : action === "created"
              ? "SOAP draft created"
              : action === "saved"
                ? "SOAP draft saved"
                : "SOAP note amended",

        summary: `SOAP note version ${revision.version} was ${action}.`,

        actor:
          revision.changedBy,

        reference: `SOAP v${revision.version}`,

        details: [
          {
            label: "Version",
            value: String(
              revision.version
            ),
          },
          {
            label: "Subjective",
            value:
              revision.subjective ||
              "No content recorded",
            sensitive: true,
          },
          {
            label: "Objective",
            value:
              revision.objective ||
              "No content recorded",
            sensitive: true,
          },
          {
            label: "Assessment",
            value:
              revision.assessment ||
              "No content recorded",
            sensitive: true,
          },
          {
            label: "Plan",
            value:
              revision.plan ||
              "No content recorded",
            sensitive: true,
          },
        ],
      })
    })

  diagnosisRecords
    .filter(
      (record) =>
        record.consultationId ===
        consultation.id
    )
    .forEach((record) => {
      events.push({
        id: createAuditId(
          "diagnosis",
          record.id,
          "recorded"
        ),

        consultationId:
          consultation.id,

        patientId:
          consultation.patientId,

        occurredAt:
          record.recordedAt,

        category: "diagnosis",
        action: "recorded",

        title: "Diagnosis recorded",

        summary: `${record.diagnosisName} was added as a ${record.role} diagnosis.`,

        actor: record.recordedBy,

        reference:
          record.icd10Code ??
          record.diagnosisName,

        details: [
          {
            label: "Diagnosis",
            value:
              record.diagnosisName,
          },
          {
            label: "ICD-10",
            value:
              record.icd10Code ??
              "Not recorded",
          },
          {
            label: "Role",
            value: record.role,
          },
          {
            label: "Verification",
            value:
              record.verificationStatus,
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
          id: createAuditId(
            "diagnosis",
            record.id,
            "updated"
          ),

          consultationId:
            consultation.id,

          patientId:
            consultation.patientId,

          occurredAt:
            record.updatedAt,

          category: "diagnosis",
          action: "updated",

          title: "Diagnosis updated",

          summary: `${record.diagnosisName} was updated.`,

          actor: record.updatedBy,

          reference:
            record.icd10Code ??
            record.diagnosisName,

          details: [
            {
              label: "Diagnosis",
              value:
                record.diagnosisName,
            },
            {
              label: "Role",
              value: record.role,
            },
            {
              label: "Verification",
              value:
                record.verificationStatus,
            },
          ],
        })
      }

      if (record.archivedAt) {
        events.push({
          id: createAuditId(
            "diagnosis",
            record.id,
            "archived"
          ),

          consultationId:
            consultation.id,

          patientId:
            consultation.patientId,

          occurredAt:
            record.archivedAt,

          category: "diagnosis",
          action: "archived",

          title: "Diagnosis archived",

          summary: `${record.diagnosisName} was archived and retained for clinical audit.`,

          actor: record.archivedBy,

          reference:
            record.icd10Code ??
            record.diagnosisName,

          details: [
            {
              label: "Diagnosis",
              value:
                record.diagnosisName,
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

  prescriptionRecords
    .filter(
      (record) =>
        record.consultationId ===
        consultation.id
    )
    .forEach((record) => {
      events.push({
        id: createAuditId(
          "prescription",
          record.id,
          "recorded"
        ),

        consultationId:
          consultation.id,

        patientId:
          consultation.patientId,

        occurredAt:
          record.prescribedAt,

        category: "prescription",
        action: "recorded",

        title:
          "Prescription draft recorded",

        summary: `${record.medicationName} was added to the consultation.`,

        actor:
          record.prescribedBy,

        reference:
          record.prescriptionNumber,

        details: [
          {
            label: "Medication",
            value:
              record.medicationName,
          },
          {
            label: "Strength",
            value:
              record.strength ??
              "Not recorded",
          },
          {
            label: "Status",
            value: record.status,
          },
          {
            label: "Allergy review",
            value:
              record.allergyReviewStatus,
          },
        ],
      })

      if (
        record.status === "active" &&
        occurredMeaningfullyLater(
          record.updatedAt,
          record.prescribedAt
        )
      ) {
        events.push({
          id: createAuditId(
            "prescription",
            record.id,
            "activated"
          ),

          consultationId:
            consultation.id,

          patientId:
            consultation.patientId,

          occurredAt:
            record.updatedAt,

          category: "prescription",
          action: "activated",

          title:
            "Prescription activated",

          summary: `${record.medicationName} was activated during encounter finalization.`,

          actor: record.updatedBy,

          reference:
            record.prescriptionNumber,

          details: [
            {
              label: "Medication",
              value:
                record.medicationName,
            },
            {
              label: "Prescription number",
              value:
                record.prescriptionNumber,
              sensitive: true,
            },
          ],
        })
      } else if (
        occurredMeaningfullyLater(
          record.updatedAt,
          record.prescribedAt
        ) &&
        !representsSameMoment(
          record.updatedAt,
          record.archivedAt
        )
      ) {
        events.push({
          id: createAuditId(
            "prescription",
            record.id,
            "updated"
          ),

          consultationId:
            consultation.id,

          patientId:
            consultation.patientId,

          occurredAt:
            record.updatedAt,

          category: "prescription",
          action: "updated",

          title:
            "Prescription draft updated",

          summary: `${record.medicationName} was updated.`,

          actor: record.updatedBy,

          reference:
            record.prescriptionNumber,

          details: [
            {
              label: "Medication",
              value:
                record.medicationName,
            },
            {
              label: "Status",
              value: record.status,
            },
          ],
        })
      }

      if (record.archivedAt) {
        events.push({
          id: createAuditId(
            "prescription",
            record.id,
            "archived"
          ),

          consultationId:
            consultation.id,

          patientId:
            consultation.patientId,

          occurredAt:
            record.archivedAt,

          category: "prescription",
          action: "archived",

          title:
            "Prescription draft archived",

          summary: `${record.medicationName} was archived and retained for clinical audit.`,

          actor: record.archivedBy,

          reference:
            record.prescriptionNumber,

          details: [
            {
              label: "Medication",
              value:
                record.medicationName,
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

  finalizationRevisions
    .filter(
      (revision) =>
        revision.consultationId ===
        consultation.id
    )
    .forEach((revision) => {
      const action =
        mapFinalizationRevisionAction(
          revision.action
        )

      events.push({
        id: createAuditId(
          "follow-up",
          revision.id,
          action
        ),

        consultationId:
          consultation.id,

        patientId:
          consultation.patientId,

        occurredAt:
          revision.changedAt,

        category: "follow-up",
        action,

        title:
          action === "finalized"
            ? "Follow-up plan finalized"
            : action === "created"
              ? "Follow-up draft created"
              : action === "saved"
                ? "Follow-up draft saved"
                : "Follow-up plan amended",

        summary: `Follow-up plan version ${revision.version} was ${action}.`,

        actor: revision.changedBy,

        reference:
          `Follow-up v${revision.version}`,

        details: [
          {
            label: "Disposition",
            value:
              revision.followUpDisposition,
          },
          {
            label: "Follow-up date",
            value:
              revision.followUpDate ??
              "Not scheduled",
          },
          {
            label: "Follow-up reason",
            value:
              revision.followUpReason ??
              "Not recorded",
          },
          {
            label: "Patient instructions",
            value:
              revision.patientInstructions ||
              "Not recorded",
            sensitive: true,
          },
          {
            label: "Return precautions",
            value:
              revision.returnPrecautions ||
              "Not recorded",
            sensitive: true,
          },
        ],
      })
    })

  if (finalizationRecord?.signature) {
    events.push({
      id: createAuditId(
        "signature",
        finalizationRecord.id,
        "finalized"
      ),

      consultationId:
        consultation.id,

      patientId:
        consultation.patientId,

      occurredAt:
        finalizationRecord.signature.signedAt,

      category: "signature",
      action: "finalized",

      title:
        "Clinical attestation recorded",

      summary: `${finalizationRecord.signature.signerName} recorded a typed-name clinical attestation.`,

      actor:
        finalizationRecord.signature.signerName,

      reference:
        finalizationRecord.signature
          .professionalRegistrationNumber,

      details: [
        {
          label: "Signer",
          value:
            finalizationRecord.signature
              .signerName,
        },
        {
          label: "Signer role",
          value:
            finalizationRecord.signature
              .signerRole,
        },
        {
          label:
            "Professional registration",
          value:
            finalizationRecord.signature
              .professionalRegistrationNumber,
          sensitive: true,
        },
        {
          label: "Signature method",
          value:
            finalizationRecord.signature
              .signatureMethod,
        },
      ],
    })
  }

  if (consultation.completedAt) {
    events.push({
      id: createAuditId(
        "encounter",
        consultation.id,
        "completed"
      ),

      consultationId:
        consultation.id,

      patientId:
        consultation.patientId,

      occurredAt:
        consultation.completedAt,

      category: "encounter",
      action: "completed",

      title:
        "Consultation completed",

      summary:
        "The clinical encounter was finalized and locked.",

      actor:
        finalizationRecord?.finalizedBy ??
        consultation.doctorName,

      reference:
        consultation.consultationNumber,

      details: [
        {
          label: "Doctor",
          value:
            consultation.doctorName,
        },
        {
          label: "Status",
          value: consultation.status,
        },
      ],
    })
  }

  if (consultation.cancelledAt) {
    events.push({
      id: createAuditId(
        "encounter",
        consultation.id,
        "cancelled"
      ),

      consultationId:
        consultation.id,

      patientId:
        consultation.patientId,

      occurredAt:
        consultation.cancelledAt,

      category: "encounter",
      action: "cancelled",

      title:
        "Consultation cancelled",

      summary:
        consultation.cancellationReason ??
        "The consultation was cancelled.",

      actor: null,

      reference:
        consultation.consultationNumber,

      details: [
        {
          label: "Cancellation reason",
          value:
            consultation.cancellationReason ??
            "Not recorded",
        },
      ],
    })
  }

  if (
    consultation.status === "no-show"
  ) {
    events.push({
      id: createAuditId(
        "encounter",
        consultation.id,
        "no-show"
      ),

      consultationId:
        consultation.id,

      patientId:
        consultation.patientId,

      occurredAt:
        consultation.updatedAt,

      category: "encounter",
      action: "no-show",

      title:
        "Patient marked as no-show",

      summary:
        "The consultation was marked as a no-show.",

      actor: null,

      reference:
        consultation.consultationNumber,

      details: [],
    })
  }

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
