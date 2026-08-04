import {
  LABORATORY_ORDER_PRIORITY_LABELS,
  LABORATORY_ORDER_SOURCE_LABELS,
  LABORATORY_ORDER_STATUS_LABELS,
  LABORATORY_SPECIMEN_TYPE_LABELS,
} from "@/features/laboratory/constants/laboratory.constants"
import type {
  LaboratoryAuditEvent,
} from "@/features/laboratory/types/laboratory-audit.types"
import type {
  LaboratoryResultSet,
} from "@/features/laboratory/types/laboratory-result.types"
import type {
  LaboratoryOrder,
} from "@/features/laboratory/types/laboratory.types"

interface BuildLaboratoryAuditEventsInput {
  order: LaboratoryOrder

  resultSets:
    readonly LaboratoryResultSet[]
}

function createAuditEventId(
  source: string,
  sourceId: string,
  action: string
): string {
  return `laboratory-audit-${source}-${sourceId}-${action}`
}

function countAbnormalEntries(
  resultSet: LaboratoryResultSet
): number {
  return resultSet.entries.filter(
    (entry) =>
      entry.flag !== "normal" &&
      entry.flag !==
        "not-applicable"
  ).length
}

function countCriticalEntries(
  resultSet: LaboratoryResultSet
): number {
  return resultSet.entries.filter(
    (entry) =>
      entry.flag ===
        "critical-low" ||
      entry.flag ===
        "critical-high"
  ).length
}

export function buildLaboratoryAuditEvents({
  order,
  resultSets,
}: BuildLaboratoryAuditEventsInput): LaboratoryAuditEvent[] {
  const events:
    LaboratoryAuditEvent[] = []

  events.push({
    id: createAuditEventId(
      "order",
      order.id,
      "created"
    ),

    orderId: order.id,
    patientId: order.patientId,

    occurredAt: order.createdAt,

    category: "order",
    action: "created",

    title:
      "Laboratory order created",

    summary: `${order.orderNumber} was created with ${order.items.length} requested test${
      order.items.length === 1
        ? ""
        : "s"
    }.`,

    actor: order.orderedByName,

    reference: order.orderNumber,

    details: [
      {
        label: "Ordering clinician",
        value: order.orderedByName,
      },
      {
        label: "Priority",
        value:
          LABORATORY_ORDER_PRIORITY_LABELS[
            order.priority
          ],
      },
      {
        label: "Source",
        value:
          LABORATORY_ORDER_SOURCE_LABELS[
            order.source
          ],
      },
      {
        label: "Branch",
        value: order.branchName,
      },
      {
        label: "Current status",
        value:
          LABORATORY_ORDER_STATUS_LABELS[
            order.status
          ],
      },
      {
        label: "Consultation reference",
        value:
          order.consultationNumber ??
          "Not linked",
        sensitive:
          Boolean(
            order.consultationNumber
          ),
      },
      {
        label: "Clinical indication",
        value:
          order.clinicalIndication,
        sensitive: true,
      },
    ],
  })

  order.specimens.forEach(
    (specimen) => {
      const specimenLabel =
        LABORATORY_SPECIMEN_TYPE_LABELS[
          specimen.specimenType
        ]

      events.push({
        id: createAuditEventId(
          "specimen",
          specimen.id,
          "collected"
        ),

        orderId: order.id,
        patientId: order.patientId,

        occurredAt:
          specimen.collectedAt,

        category: "specimen",
        action: "collected",

        title: `${specimenLabel} specimen collected`,

        summary: `${specimenLabel} specimen collection was recorded for ${order.orderNumber}.`,

        actor: specimen.collectedBy,

        reference:
          specimen.accessionNumber,

        details: [
          {
            label: "Accession number",
            value:
              specimen.accessionNumber,
            sensitive: true,
          },
          {
            label: "Specimen type",
            value: specimenLabel,
          },
          {
            label: "Container",
            value:
              specimen.containerType,
          },
          {
            label: "Collected by",
            value:
              specimen.collectedBy,
          },
        ],
      })

      if (specimen.receivedAt) {
        events.push({
          id: createAuditEventId(
            "specimen",
            specimen.id,
            "received"
          ),

          orderId: order.id,
          patientId:
            order.patientId,

          occurredAt:
            specimen.receivedAt,

          category: "specimen",
          action: "received",

          title: `${specimenLabel} specimen received`,

          summary: `${specimenLabel} specimen was received by the laboratory.`,

          actor:
            specimen.receivedBy,

          reference:
            specimen.accessionNumber,

          details: [
            {
              label:
                "Accession number",
              value:
                specimen.accessionNumber,
              sensitive: true,
            },
            {
              label: "Received by",
              value:
                specimen.receivedBy ??
                "Not recorded",
            },
          ],
        })
      }

      if (specimen.rejectedAt) {
        events.push({
          id: createAuditEventId(
            "specimen",
            specimen.id,
            "rejected"
          ),

          orderId: order.id,
          patientId:
            order.patientId,

          occurredAt:
            specimen.rejectedAt,

          category: "specimen",
          action: "rejected",

          title: `${specimenLabel} specimen rejected`,

          summary: `${specimenLabel} specimen was rejected and retained for audit history.`,

          actor:
            specimen.rejectedBy,

          reference:
            specimen.accessionNumber,

          details: [
            {
              label:
                "Accession number",
              value:
                specimen.accessionNumber,
              sensitive: true,
            },
            {
              label:
                "Rejection reason",
              value:
                specimen.rejectionReason ??
                "Not recorded",
              sensitive: true,
            },
          ],
        })
      }
    }
  )

  if (order.processingStartedAt) {
    events.push({
      id: createAuditEventId(
        "processing",
        order.id,
        "processing-started"
      ),

      orderId: order.id,
      patientId: order.patientId,

      occurredAt:
        order.processingStartedAt,

      category: "processing",

      action:
        "processing-started",

      title:
        "Laboratory processing started",

      summary: `${order.orderNumber} entered laboratory processing.`,

      actor:
        order.processingStartedBy,

      reference: order.orderNumber,

      details: [
        {
          label:
            "Processing started by",
          value:
            order.processingStartedBy ??
            "Not recorded",
        },
        {
          label: "Tests in order",
          value: String(
            order.items.length
          ),
        },
      ],
    })
  }

  resultSets
    .filter(
      (resultSet) =>
        resultSet.orderId ===
        order.id
    )
    .forEach((resultSet) => {
      const abnormalCount =
        countAbnormalEntries(
          resultSet
        )

      const criticalCount =
        countCriticalEntries(
          resultSet
        )

      events.push({
        id: createAuditEventId(
          "result",
          resultSet.id,
          "result-entered"
        ),

        orderId: order.id,
        patientId:
          order.patientId,

        occurredAt:
          resultSet.performedAt,

        category: "result",

        action:
          "result-entered",

        title: `${resultSet.testName} results entered`,

        summary: `${resultSet.entries.length} analyte result${
          resultSet.entries.length ===
          1
            ? ""
            : "s"
        } were entered for ${resultSet.testName}.`,

        actor:
          resultSet.performedBy,

        reference:
          order.orderNumber,

        details: [
          {
            label: "Test",
            value:
              resultSet.testName,
          },
          {
            label: "Result version",
            value: String(
              resultSet.version
            ),
          },
          {
            label: "Analytes entered",
            value: String(
              resultSet.entries.length
            ),
          },
          {
            label: "Abnormal flags",
            value: String(
              abnormalCount
            ),
          },
          {
            label: "Critical flags",
            value: String(
              criticalCount
            ),
          },
        ],
      })

      if (resultSet.completedAt) {
        events.push({
          id: createAuditEventId(
            "result",
            resultSet.id,
            "completed"
          ),

          orderId: order.id,
          patientId:
            order.patientId,

          occurredAt:
            resultSet.completedAt,

          category: "result",
          action: "completed",

          title: `${resultSet.testName} results completed`,

          summary: `${resultSet.testName} result entry was completed and locked for technical verification.`,

          actor:
            resultSet.completedBy,

          reference:
            order.orderNumber,

          details: [
            {
              label: "Test",
              value:
                resultSet.testName,
            },
            {
              label: "Completed by",
              value:
                resultSet.completedBy ??
                "Not recorded",
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
          ],
        })
      }

      if (resultSet.verifiedAt) {
        events.push({
          id: createAuditEventId(
            "verification",
            resultSet.id,
            "verified"
          ),

          orderId: order.id,
          patientId:
            order.patientId,

          occurredAt:
            resultSet.verifiedAt,

          category:
            "verification",

          action: "verified",

          title: `${resultSet.testName} technically verified`,

          summary: `${resultSet.testName} results passed technical verification.`,

          actor:
            resultSet.verifiedBy,

          reference:
            order.orderNumber,

          details: [
            {
              label:
                "Verified by",
              value:
                resultSet.verifiedBy ??
                "Not recorded",
            },
            {
              label:
                "Verification note",
              value:
                resultSet.verificationNote ??
                "No note recorded",
              sensitive: true,
            },
          ],
        })
      }

      if (resultSet.releasedAt) {
        events.push({
          id: createAuditEventId(
            "release",
            resultSet.id,
            "released"
          ),

          orderId: order.id,
          patientId:
            order.patientId,

          occurredAt:
            resultSet.releasedAt,

          category: "release",
          action: "released",

          title: `${resultSet.testName} results released`,

          summary: `${resultSet.testName} results were released and became read-only.`,

          actor:
            resultSet.releasedBy,

          reference:
            order.orderNumber,

          details: [
            {
              label:
                "Released by",
              value:
                resultSet.releasedBy ??
                "Not recorded",
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
      }
    })

  if (order.cancelledAt) {
    events.push({
      id: createAuditEventId(
        "order",
        order.id,
        "cancelled"
      ),

      orderId: order.id,
      patientId: order.patientId,

      occurredAt:
        order.cancelledAt,

      category: "order",
      action: "cancelled",

      title:
        "Laboratory order cancelled",

      summary: `${order.orderNumber} was cancelled.`,

      actor:
        order.cancelledBy,

      reference:
        order.orderNumber,

      details: [
        {
          label:
            "Cancellation reason",
          value:
            order.cancellationReason ??
            "Not recorded",
          sensitive: true,
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
