import {
  PHARMACY_DOSAGE_FORM_LABELS,
  PHARMACY_MEDICATION_ROUTE_LABELS,
  PHARMACY_PRESCRIPTION_PRIORITY_LABELS,
  PHARMACY_PRESCRIPTION_SOURCE_LABELS,
  PHARMACY_PRESCRIPTION_STATUS_LABELS,
  PHARMACY_REVIEW_STATUS_LABELS,
} from "@/features/pharmacy/constants/pharmacy.constants"
import type {
  PharmacyAuditEvent,
} from "@/features/pharmacy/types/pharmacy-audit.types"
import type {
  PharmacyDispensingRecord,
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"

function createAuditEventId(
  source: string,
  sourceId: string,
  action: string
): string {
  return `pharmacy-audit-${source}-${sourceId}-${action}`
}

function getDispensingRecords(
  prescription:
    PharmacyPrescription
): PharmacyDispensingRecord[] {
  const storedRecords =
    prescription.dispensingRecords ??
    []

  if (storedRecords.length > 0) {
    return storedRecords
  }

  const fallbackTimestamp =
    prescription
      .pharmacistVerifiedAt ??
    prescription
      .counselingCompletedAt ??
    prescription.releasedAt ??
    prescription.updatedAt

  const fallbackActor =
    prescription
      .pharmacistVerifiedBy ??
    prescription
      .counselingCompletedBy ??
    prescription.releasedBy ??
    prescription.updatedBy

  return prescription.items
    .filter(
      (item) =>
        item.quantityDispensed > 0
    )
    .map(
      (item, index) => ({
        id:
          `derived-dispensing-${prescription.id}-${item.id}-${index + 1}`,

        prescriptionId:
          prescription.id,

        prescriptionItemId:
          item.id,

        medicationId:
          item.medicationId,

        medicationSku:
          item.medicationSku,

        genericName:
          item.genericName,

        strength:
          item.strength,

        inventoryItemId:
          "historical-inventory-unavailable",

        batchNumber:
          "Historical batch unavailable",

        quantityDispensed:
          item.quantityDispensed,

        dispensedAt:
          fallbackTimestamp,

        dispensedBy:
          fallbackActor,

        labelReviewConfirmed:
          true,
      })
    )
}

export function buildPharmacyAuditEvents(
  prescription:
    PharmacyPrescription
): PharmacyAuditEvent[] {
  const events:
    PharmacyAuditEvent[] = []

  events.push({
    id: createAuditEventId(
      "prescription",
      prescription.id,
      "created"
    ),

    prescriptionId:
      prescription.id,

    patientId:
      prescription.patientId,

    occurredAt:
      prescription.createdAt,

    category: "prescription",
    action: "created",

    title:
      "Pharmacy prescription created",

    summary: `${prescription.prescriptionNumber} was created with ${prescription.items.length} medication item${
      prescription.items.length === 1
        ? ""
        : "s"
    }.`,

    actor:
      prescription.prescriberName,

    reference:
      prescription.prescriptionNumber,

    details: [
      {
        label: "Prescriber",
        value:
          prescription.prescriberName,
      },
      {
        label: "Priority",
        value:
          PHARMACY_PRESCRIPTION_PRIORITY_LABELS[
            prescription.priority
          ],
      },
      {
        label: "Source",
        value:
          PHARMACY_PRESCRIPTION_SOURCE_LABELS[
            prescription.source
          ],
      },
      {
        label: "Branch",
        value:
          prescription.branchName,
      },
      {
        label: "Current status",
        value:
          PHARMACY_PRESCRIPTION_STATUS_LABELS[
            prescription.status
          ],
      },
      {
        label:
          "Consultation reference",
        value:
          prescription
            .consultationNumber ??
          "Not linked",
        sensitive:
          Boolean(
            prescription
              .consultationNumber
          ),
      },
      {
        label: "Clinical notes",
        value:
          prescription.clinicalNotes ??
          "No notes recorded",
        sensitive:
          Boolean(
            prescription.clinicalNotes
          ),
      },
    ],
  })

  if (
    prescription.allergyReviewAt
  ) {
    events.push({
      id: createAuditEventId(
        "allergy-review",
        prescription.id,
        "allergy-reviewed"
      ),

      prescriptionId:
        prescription.id,

      patientId:
        prescription.patientId,

      occurredAt:
        prescription
          .allergyReviewAt,

      category: "safety-review",

      action:
        "allergy-reviewed",

      title:
        "Medication-allergy review completed",

      summary: `The allergy review was marked ${PHARMACY_REVIEW_STATUS_LABELS[
        prescription.allergyReviewStatus
      ].toLowerCase()}.`,

      actor:
        prescription
          .allergyReviewBy,

      reference:
        prescription
          .prescriptionNumber,

      details: [
        {
          label: "Review result",
          value:
            PHARMACY_REVIEW_STATUS_LABELS[
              prescription
                .allergyReviewStatus
            ],
        },
        {
          label: "Reviewed by",
          value:
            prescription
              .allergyReviewBy ??
            "Not recorded",
        },
        {
          label: "Review notes",
          value:
            prescription
              .allergyReviewNotes ??
            "No note recorded",
          sensitive:
            Boolean(
              prescription
                .allergyReviewNotes
            ),
        },
      ],
    })
  }

  if (
    prescription
      .interactionReviewAt
  ) {
    events.push({
      id: createAuditEventId(
        "interaction-review",
        prescription.id,
        "interaction-reviewed"
      ),

      prescriptionId:
        prescription.id,

      patientId:
        prescription.patientId,

      occurredAt:
        prescription
          .interactionReviewAt,

      category: "safety-review",

      action:
        "interaction-reviewed",

      title:
        "Medication-interaction review completed",

      summary: `The interaction review was marked ${PHARMACY_REVIEW_STATUS_LABELS[
        prescription
          .interactionReviewStatus
      ].toLowerCase()}.`,

      actor:
        prescription
          .interactionReviewBy,

      reference:
        prescription
          .prescriptionNumber,

      details: [
        {
          label: "Review result",
          value:
            PHARMACY_REVIEW_STATUS_LABELS[
              prescription
                .interactionReviewStatus
            ],
        },
        {
          label: "Reviewed by",
          value:
            prescription
              .interactionReviewBy ??
            "Not recorded",
        },
        {
          label: "Review notes",
          value:
            prescription
              .interactionReviewNotes ??
            "No note recorded",
          sensitive:
            Boolean(
              prescription
                .interactionReviewNotes
            ),
        },
      ],
    })
  }

  const dispensingRecords =
    getDispensingRecords(
      prescription
    )

  dispensingRecords.forEach(
    (record) => {
      const prescriptionItem =
        prescription.items.find(
          (item) =>
            item.id ===
            record.prescriptionItemId
        ) ?? null

      events.push({
        id: createAuditEventId(
          "dispensing",
          record.id,
          "dispensed"
        ),

        prescriptionId:
          prescription.id,

        patientId:
          prescription.patientId,

        occurredAt:
          record.dispensedAt,

        category: "dispensing",
        action: "dispensed",

        title:
          "Medication dispensing recorded",

        summary: `${record.quantityDispensed} unit${
          record.quantityDispensed === 1
            ? ""
            : "s"
        } of ${record.genericName} ${record.strength} were dispensed.`,

        actor:
          record.dispensedBy,

        reference:
          prescription
            .prescriptionNumber,

        details: [
          {
            label: "Medication",
            value:
              `${record.genericName} ${record.strength}`,
          },
          {
            label:
              "Medication SKU",
            value:
              record.medicationSku,
          },
          {
            label:
              "Quantity dispensed",
            value: String(
              record.quantityDispensed
            ),
          },
          {
            label:
              "Inventory batch",
            value:
              record.batchNumber,
            sensitive: true,
          },
          {
            label: "Dosage form",
            value:
              prescriptionItem
                ? PHARMACY_DOSAGE_FORM_LABELS[
                    prescriptionItem
                      .dosageForm
                  ]
                : "Not available",
          },
          {
            label: "Route",
            value:
              prescriptionItem
                ? PHARMACY_MEDICATION_ROUTE_LABELS[
                    prescriptionItem
                      .route
                  ]
                : "Not available",
          },
          {
            label: "Dispensed by",
            value:
              record.dispensedBy,
          },
          {
            label:
              "Label review",
            value:
              record
                .labelReviewConfirmed
                ? "Confirmed"
                : "Not confirmed",
          },
        ],
      })
    }
  )

  if (
    prescription
      .pharmacistVerifiedAt
  ) {
    events.push({
      id: createAuditEventId(
        "verification",
        prescription.id,
        "pharmacist-verified"
      ),

      prescriptionId:
        prescription.id,

      patientId:
        prescription.patientId,

      occurredAt:
        prescription
          .pharmacistVerifiedAt,

      category: "verification",

      action:
        "pharmacist-verified",

      title:
        "Dispensing verified by pharmacist",

      summary: `${prescription.prescriptionNumber} dispensing was verified.`,

      actor:
        prescription
          .pharmacistVerifiedBy,

      reference:
        prescription
          .prescriptionNumber,

      details: [
        {
          label: "Verified by",
          value:
            prescription
              .pharmacistVerifiedBy ??
            "Not recorded",
        },
        {
          label:
            "Verification notes",
          value:
            prescription
              .pharmacistVerificationNotes ??
            "No note recorded",
          sensitive:
            Boolean(
              prescription
                .pharmacistVerificationNotes
            ),
        },
      ],
    })
  }

  if (
    prescription
      .counselingCompletedAt
  ) {
    events.push({
      id: createAuditEventId(
        "counseling",
        prescription.id,
        "counseling-completed"
      ),

      prescriptionId:
        prescription.id,

      patientId:
        prescription.patientId,

      occurredAt:
        prescription
          .counselingCompletedAt,

      category: "counseling",

      action:
        "counseling-completed",

      title:
        "Medication counseling completed",

      summary: `Medication counseling was recorded for ${prescription.prescriptionNumber}.`,

      actor:
        prescription
          .counselingCompletedBy,

      reference:
        prescription
          .prescriptionNumber,

      details: [
        {
          label: "Completed by",
          value:
            prescription
              .counselingCompletedBy ??
            "Not recorded",
        },
        {
          label:
            "Counseling notes",
          value:
            prescription
              .counselingNotes ??
            "No note recorded",
          sensitive:
            Boolean(
              prescription
                .counselingNotes
            ),
        },
      ],
    })
  }

  if (prescription.releasedAt) {
    events.push({
      id: createAuditEventId(
        "release",
        prescription.id,
        "released"
      ),

      prescriptionId:
        prescription.id,

      patientId:
        prescription.patientId,

      occurredAt:
        prescription.releasedAt,

      category: "release",
      action: "released",

      title:
        "Dispensed medication released",

      summary: `${prescription.prescriptionNumber} was released and became read-only.`,

      actor:
        prescription.releasedBy,

      reference:
        prescription
          .prescriptionNumber,

      details: [
        {
          label: "Released by",
          value:
            prescription.releasedBy ??
            "Not recorded",
        },
        {
          label:
            "Medication items",
          value: String(
            prescription.items.filter(
              (item) =>
                item.status !==
                "cancelled"
            ).length
          ),
        },
      ],
    })
  }

  if (prescription.cancelledAt) {
    events.push({
      id: createAuditEventId(
        "prescription",
        prescription.id,
        "cancelled"
      ),

      prescriptionId:
        prescription.id,

      patientId:
        prescription.patientId,

      occurredAt:
        prescription.cancelledAt,

      category: "prescription",
      action: "cancelled",

      title:
        "Pharmacy prescription cancelled",

      summary: `${prescription.prescriptionNumber} was cancelled before medication release.`,

      actor:
        prescription.cancelledBy,

      reference:
        prescription
          .prescriptionNumber,

      details: [
        {
          label:
            "Cancellation reason",
          value:
            prescription
              .cancellationReason ??
            "Not recorded",
          sensitive: true,
        },
        {
          label: "Cancelled by",
          value:
            prescription.cancelledBy ??
            "Not recorded",
        },
      ],
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
