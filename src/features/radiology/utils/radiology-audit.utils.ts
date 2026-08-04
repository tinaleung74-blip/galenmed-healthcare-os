import {
  RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS,
  RADIOLOGY_FINDING_LEVEL_LABELS,
  RADIOLOGY_REPORT_STATUS_LABELS,
} from "@/features/radiology/constants/radiology-report.constants"
import {
  RADIOLOGY_CONTRAST_PROTOCOL_LABELS,
  RADIOLOGY_MODALITY_LABELS,
  RADIOLOGY_ORDER_PRIORITY_LABELS,
  RADIOLOGY_ORDER_SOURCE_LABELS,
  RADIOLOGY_ORDER_STATUS_LABELS,
} from "@/features/radiology/constants/radiology.constants"
import type {
  RadiologyAuditEvent,
} from "@/features/radiology/types/radiology-audit.types"
import type {
  RadiologyReportRecord,
} from "@/features/radiology/types/radiology-report.types"
import type {
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"
import {
  formatRadiologyScheduleRange,
} from "@/features/radiology/utils/radiology.utils"

interface BuildRadiologyAuditEventsInput {
  order: RadiologyOrder

  reports:
    readonly RadiologyReportRecord[]
}

function createAuditEventId(
  source: string,
  sourceId: string,
  action: string
): string {
  return `radiology-audit-${source}-${sourceId}-${action}`
}

export function buildRadiologyAuditEvents({
  order,
  reports,
}: BuildRadiologyAuditEventsInput): RadiologyAuditEvent[] {
  const events:
    RadiologyAuditEvent[] = []

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

    title: "Radiology order created",

    summary: `${order.orderNumber} was created for ${order.procedureName}.`,

    actor: order.orderedByName,

    reference: order.orderNumber,

    details: [
      {
        label: "Procedure",
        value: order.procedureName,
      },
      {
        label: "Procedure code",
        value: order.procedureCode,
      },
      {
        label: "Modality",
        value:
          RADIOLOGY_MODALITY_LABELS[
            order.modality
          ],
      },
      {
        label: "Body region",
        value: order.bodyRegion,
      },
      {
        label: "Priority",
        value:
          RADIOLOGY_ORDER_PRIORITY_LABELS[
            order.priority
          ],
      },
      {
        label: "Source",
        value:
          RADIOLOGY_ORDER_SOURCE_LABELS[
            order.source
          ],
      },
      {
        label: "Contrast protocol",
        value:
          RADIOLOGY_CONTRAST_PROTOCOL_LABELS[
            order.contrastProtocol
          ],
      },
      {
        label: "Scheduled imaging slot",
        value:
          formatRadiologyScheduleRange(
            order
          ),
      },
      {
        label: "Imaging room",
        value:
          order.roomName ??
          "Not assigned",
      },
      {
        label: "Current order status",
        value:
          RADIOLOGY_ORDER_STATUS_LABELS[
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

  order.preparationChecklist
    .filter(
      (item) =>
        item.completed &&
        Boolean(item.completedAt)
    )
    .forEach((item) => {
      if (!item.completedAt) {
        return
      }

      events.push({
        id: createAuditEventId(
          "preparation",
          item.id,
          "prepared"
        ),

        orderId: order.id,
        patientId: order.patientId,

        occurredAt:
          item.completedAt,

        category: "preparation",
        action: "prepared",

        title:
          "Preparation item completed",

        summary: `${item.label} was completed before imaging.`,

        actor:
          item.completedBy,

        reference:
          order.orderNumber,

        details: [
          {
            label:
              "Preparation item",
            value: item.label,
          },
          {
            label: "Required",
            value: item.required
              ? "Yes"
              : "No",
          },
          {
            label: "Completed by",
            value:
              item.completedBy ??
              "Not recorded",
          },
          {
            label: "Notes",
            value:
              item.notes ??
              "No note recorded",
            sensitive:
              Boolean(item.notes),
          },
        ],
      })
    })

  if (order.checkedInAt) {
    events.push({
      id: createAuditEventId(
        "order",
        order.id,
        "checked-in"
      ),

      orderId: order.id,
      patientId: order.patientId,

      occurredAt:
        order.checkedInAt,

      category: "order",
      action: "checked-in",

      title:
        "Patient checked in for imaging",

      summary: `${order.orderNumber} was checked in for ${order.procedureName}.`,

      actor:
        order.checkedInBy,

      reference:
        order.orderNumber,

      details: [
        {
          label: "Procedure",
          value:
            order.procedureName,
        },
        {
          label: "Imaging room",
          value:
            order.roomName ??
            "Not assigned",
        },
        {
          label: "Checked in by",
          value:
            order.checkedInBy ??
            "Not recorded",
        },
      ],
    })
  }

  if (order.readyAt) {
    events.push({
      id: createAuditEventId(
        "preparation",
        order.id,
        "ready"
      ),

      orderId: order.id,
      patientId: order.patientId,

      occurredAt:
        order.readyAt,

      category: "preparation",
      action: "ready",

      title:
        "Patient ready for imaging",

      summary: `All required preparation items were completed for ${order.procedureName}.`,

      actor:
        order.readyBy,

      reference:
        order.orderNumber,

      details: [
        {
          label: "Procedure",
          value:
            order.procedureName,
        },
        {
          label: "Ready confirmed by",
          value:
            order.readyBy ??
            "Not recorded",
        },
      ],
    })
  }

  if (order.imagingStartedAt) {
    events.push({
      id: createAuditEventId(
        "imaging",
        order.id,
        "imaging-started"
      ),

      orderId: order.id,
      patientId: order.patientId,

      occurredAt:
        order.imagingStartedAt,

      category: "imaging",

      action:
        "imaging-started",

      title: "Imaging started",

      summary: `${order.procedureName} image acquisition began.`,

      actor:
        order.imagingStartedBy,

      reference:
        order.orderNumber,

      details: [
        {
          label: "Procedure",
          value:
            order.procedureName,
        },
        {
          label: "Modality",
          value:
            RADIOLOGY_MODALITY_LABELS[
              order.modality
            ],
        },
        {
          label: "Imaging room",
          value:
            order.roomName ??
            "Not assigned",
        },
        {
          label: "Started by",
          value:
            order.imagingStartedBy ??
            "Not recorded",
        },
      ],
    })
  }

  if (order.imagesAcquiredAt) {
    events.push({
      id: createAuditEventId(
        "imaging",
        order.id,
        "images-acquired"
      ),

      orderId: order.id,
      patientId: order.patientId,

      occurredAt:
        order.imagesAcquiredAt,

      category: "imaging",

      action:
        "images-acquired",

      title: "Images acquired",

      summary: `${order.procedureName} image acquisition was completed.`,

      actor:
        order.imagesAcquiredBy,

      reference:
        order.orderNumber,

      details: [
        {
          label: "Procedure",
          value:
            order.procedureName,
        },
        {
          label: "Acquired by",
          value:
            order.imagesAcquiredBy ??
            "Not recorded",
        },
      ],
    })
  }

  if (
    order.technicalCompletedAt
  ) {
    events.push({
      id: createAuditEventId(
        "imaging",
        order.id,
        "technically-completed"
      ),

      orderId: order.id,
      patientId: order.patientId,

      occurredAt:
        order.technicalCompletedAt,

      category: "imaging",

      action:
        "technically-completed",

      title:
        "Imaging study technically completed",

      summary: `${order.procedureName} was technically completed and became available for reporting.`,

      actor:
        order.technicalCompletedBy,

      reference:
        order.orderNumber,

      details: [
        {
          label: "Procedure",
          value:
            order.procedureName,
        },
        {
          label:
            "Technical completion by",
          value:
            order.technicalCompletedBy ??
            "Not recorded",
        },
      ],
    })
  }

  reports
    .filter(
      (report) =>
        report.orderId ===
        order.id
    )
    .forEach((report) => {
      events.push({
        id: createAuditEventId(
          "report",
          report.id,
          "report-drafted"
        ),

        orderId: order.id,
        patientId: order.patientId,

        occurredAt:
          report.draftedAt,

        category: "report",

        action:
          "report-drafted",

        title:
          "Radiology report drafted",

        summary: `${report.procedureName} report version ${report.version} was drafted.`,

        actor:
          report.draftedBy,

        reference:
          order.orderNumber,

        details: [
          {
            label: "Procedure",
            value:
              report.procedureName,
          },
          {
            label: "Report version",
            value: String(
              report.version
            ),
          },
          {
            label: "Finding level",
            value:
              RADIOLOGY_FINDING_LEVEL_LABELS[
                report.findingLevel
              ],
          },
          {
            label:
              "Current report status",
            value:
              RADIOLOGY_REPORT_STATUS_LABELS[
                report.status
              ],
          },
          {
            label: "Impression",
            value:
              report.impression,
            sensitive: true,
          },
          {
            label:
              "Critical-finding summary",
            value:
              report.criticalFindingSummary ??
              "Not applicable",
            sensitive:
              Boolean(
                report
                  .criticalFindingSummary
              ),
          },
        ],
      })

      if (
        report.criticalCommunicatedAt
      ) {
        events.push({
          id: createAuditEventId(
            "verification",
            report.id,
            "critical-communicated"
          ),

          orderId: order.id,
          patientId:
            order.patientId,

          occurredAt:
            report
              .criticalCommunicatedAt,

          category:
            "verification",

          action:
            "critical-communicated",

          title:
            "Critical finding communicated",

          summary: `A critical finding for ${report.procedureName} was communicated to the responsible clinical recipient.`,

          actor:
            report
              .criticalCommunicatedBy,

          reference:
            order.orderNumber,

          details: [
            {
              label:
                "Communicated by",
              value:
                report
                  .criticalCommunicatedBy ??
                "Not recorded",
            },
            {
              label:
                "Communicated to",
              value:
                report
                  .criticalCommunicatedTo ??
                "Not recorded",
            },
            {
              label:
                "Communication method",
              value:
                report
                  .criticalCommunicationMethod
                  ? RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS[
                      report
                        .criticalCommunicationMethod
                    ]
                  : "Not recorded",
            },
            {
              label:
                "Critical-finding summary",
              value:
                report
                  .criticalFindingSummary ??
                "Not recorded",
              sensitive: true,
            },
            {
              label:
                "Communication note",
              value:
                report
                  .criticalCommunicationNote ??
                "No note recorded",
              sensitive:
                Boolean(
                  report
                    .criticalCommunicationNote
                ),
            },
          ],
        })
      }

      if (report.verifiedAt) {
        events.push({
          id: createAuditEventId(
            "verification",
            report.id,
            "verified"
          ),

          orderId: order.id,
          patientId:
            order.patientId,

          occurredAt:
            report.verifiedAt,

          category:
            "verification",

          action: "verified",

          title:
            "Radiology report verified",

          summary: `${report.procedureName} report was verified by the radiologist.`,

          actor:
            report.verifiedBy,

          reference:
            order.orderNumber,

          details: [
            {
              label:
                "Verified by",
              value:
                report.verifiedBy ??
                "Not recorded",
            },
            {
              label:
                "Professional registration number",
              value:
                report
                  .radiologistRegistrationNumber ??
                "Not recorded",
              sensitive: true,
            },
            {
              label:
                "Verification note",
              value:
                report.verificationNote ??
                "No note recorded",
              sensitive:
                Boolean(
                  report.verificationNote
                ),
            },
          ],
        })
      }

      if (report.releasedAt) {
        events.push({
          id: createAuditEventId(
            "release",
            report.id,
            "released"
          ),

          orderId: order.id,
          patientId:
            order.patientId,

          occurredAt:
            report.releasedAt,

          category: "release",
          action: "released",

          title:
            "Final radiology report released",

          summary: `${report.procedureName} report was released and became read-only.`,

          actor:
            report.releasedBy,

          reference:
            order.orderNumber,

          details: [
            {
              label:
                "Released by",
              value:
                report.releasedBy ??
                "Not recorded",
            },
            {
              label:
                "Report finding level",
              value:
                RADIOLOGY_FINDING_LEVEL_LABELS[
                  report.findingLevel
                ],
            },
            {
              label:
                "Release note",
              value:
                report.releaseNote ??
                "No note recorded",
              sensitive:
                Boolean(
                  report.releaseNote
                ),
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
        "Radiology order cancelled",

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

  if (order.noShowAt) {
    events.push({
      id: createAuditEventId(
        "order",
        order.id,
        "no-show"
      ),

      orderId: order.id,
      patientId: order.patientId,

      occurredAt:
        order.noShowAt,

      category: "order",
      action: "no-show",

      title:
        "Radiology schedule marked no-show",

      summary: `${order.orderNumber} was marked as a patient no-show.`,

      actor:
        order.noShowMarkedBy,

      reference:
        order.orderNumber,

      details: [
        {
          label: "Procedure",
          value:
            order.procedureName,
        },
        {
          label: "Marked by",
          value:
            order.noShowMarkedBy ??
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
