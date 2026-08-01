import {
  APPOINTMENT_PRIORITY_LABELS,
  APPOINTMENT_SOURCE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_SCHEDULING_ACTOR,
} from "@/features/appointments/constants/appointment.constants"
import type {
  AppointmentAuditEvent,
} from "@/features/appointments/types/appointment-audit.types"
import type { AppointmentRecord } from "@/features/appointments/types/appointment.types"
import { formatAppointmentRange } from "@/features/appointments/utils/appointment.utils"
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_VISIT_TYPE_LABELS,
} from "@/features/consultations/constants/consultation.constants"

interface BuildAppointmentAuditEventsInput {
  appointment: AppointmentRecord

  recordedAuditEvents:
    readonly AppointmentAuditEvent[]
}

function createDerivedEventId(
  appointmentId: string,
  action: string
): string {
  return `derived-${appointmentId}-${action}`
}

export function buildAppointmentAuditEvents({
  appointment,
  recordedAuditEvents,
}: BuildAppointmentAuditEventsInput): AppointmentAuditEvent[] {
  const events:
    AppointmentAuditEvent[] = []

  events.push({
    id: createDerivedEventId(
      appointment.id,
      "created"
    ),

    appointmentId:
      appointment.id,

    patientId:
      appointment.patientId,

    occurredAt:
      appointment.createdAt,

    action: "created",

    title: "Appointment created",

    summary: `${appointment.appointmentNumber} was scheduled for ${formatAppointmentRange(
      appointment
    )}.`,

    actor:
      appointment.createdBy,

    reference:
      appointment.appointmentNumber,

    details: [
      {
        label: "Doctor",
        value:
          appointment.doctorName,
      },
      {
        label: "Department",
        value:
          appointment.departmentName,
      },
      {
        label: "Room",
        value:
          appointment.roomName ??
          "Telemedicine",
      },
      {
        label: "Mode",
        value:
          CONSULTATION_MODE_LABELS[
            appointment.mode
          ],
      },
      {
        label: "Visit type",
        value:
          CONSULTATION_VISIT_TYPE_LABELS[
            appointment.visitType
          ],
      },
      {
        label: "Priority",
        value:
          APPOINTMENT_PRIORITY_LABELS[
            appointment.priority
          ],
      },
      {
        label: "Booking source",
        value:
          APPOINTMENT_SOURCE_LABELS[
            appointment.source
          ],
      },
      {
        label: "Appointment reason",
        value:
          appointment.chiefComplaint,
        sensitive: true,
      },
    ],
  })

  if (appointment.confirmedAt) {
    events.push({
      id: createDerivedEventId(
        appointment.id,
        "confirmed"
      ),

      appointmentId:
        appointment.id,

      patientId:
        appointment.patientId,

      occurredAt:
        appointment.confirmedAt,

      action: "confirmed",

      title: "Appointment confirmed",

      summary: `${appointment.appointmentNumber} was confirmed.`,

      actor:
        APPOINTMENT_SCHEDULING_ACTOR,

      reference:
        appointment.appointmentNumber,

      details: [
        {
          label: "Status",
          value:
            APPOINTMENT_STATUS_LABELS.confirmed,
        },
        {
          label: "Schedule",
          value:
            formatAppointmentRange(
              appointment
            ),
        },
      ],
    })
  }

  if (appointment.checkedInAt) {
    events.push({
      id: createDerivedEventId(
        appointment.id,
        "checked-in"
      ),

      appointmentId:
        appointment.id,

      patientId:
        appointment.patientId,

      occurredAt:
        appointment.checkedInAt,

      action: "checked-in",

      title: "Patient checked in",

      summary: `${appointment.appointmentNumber} was checked in for the scheduled visit.`,

      actor:
        APPOINTMENT_SCHEDULING_ACTOR,

      reference:
        appointment.appointmentNumber,

      details: [
        {
          label: "Room",
          value:
            appointment.roomName ??
            "Telemedicine",
        },
        {
          label: "Doctor",
          value:
            appointment.doctorName,
        },
      ],
    })
  }

  if (
    appointment.linkedConsultationId &&
    appointment.linkedConsultationNumber
  ) {
    events.push({
      id: createDerivedEventId(
        appointment.id,
        "queued"
      ),

      appointmentId:
        appointment.id,

      patientId:
        appointment.patientId,

      occurredAt:
        appointment.checkedInAt ??
        appointment.updatedAt,

      action: "queued",

      title:
        "Sent to Consultation Queue",

      summary: `${appointment.appointmentNumber} was linked to a Consultation Queue record.`,

      actor:
        APPOINTMENT_SCHEDULING_ACTOR,

      reference:
        appointment.appointmentNumber,

      details: [
        {
          label:
            "Consultation reference",
          value:
            appointment.linkedConsultationNumber,
          sensitive: true,
        },
        {
          label: "Doctor",
          value:
            appointment.doctorName,
        },
        {
          label: "Department",
          value:
            appointment.departmentName,
        },
      ],
    })
  }

  if (
    appointment.consultationStartedAt
  ) {
    events.push({
      id: createDerivedEventId(
        appointment.id,
        "consultation-started"
      ),

      appointmentId:
        appointment.id,

      patientId:
        appointment.patientId,

      occurredAt:
        appointment.consultationStartedAt,

      action:
        "consultation-started",

      title:
        "Consultation started",

      summary: `${appointment.doctorName} started the linked consultation.`,

      actor:
        appointment.doctorName,

      reference:
        appointment.appointmentNumber,

      details: [
        {
          label: "Doctor",
          value:
            appointment.doctorName,
        },
        {
          label: "Appointment status",
          value:
            APPOINTMENT_STATUS_LABELS[
              "in-consultation"
            ],
        },
        {
          label:
            "Consultation reference",
          value:
            appointment.linkedConsultationNumber ??
            "Not recorded",
          sensitive: true,
        },
      ],
    })
  }

  if (appointment.completedAt) {
    events.push({
      id: createDerivedEventId(
        appointment.id,
        "completed"
      ),

      appointmentId:
        appointment.id,

      patientId:
        appointment.patientId,

      occurredAt:
        appointment.completedAt,

      action: "completed",

      title: "Appointment completed",

      summary: `${appointment.appointmentNumber} was completed after the linked consultation was finalized.`,

      actor:
        appointment.updatedBy,

      reference:
        appointment.appointmentNumber,

      details: [
        {
          label: "Final status",
          value:
            APPOINTMENT_STATUS_LABELS.completed,
        },
        {
          label:
            "Consultation reference",
          value:
            appointment.linkedConsultationNumber ??
            "Not recorded",
          sensitive: true,
        },
      ],
    })
  }

  if (appointment.cancelledAt) {
    events.push({
      id: createDerivedEventId(
        appointment.id,
        "cancelled"
      ),

      appointmentId:
        appointment.id,

      patientId:
        appointment.patientId,

      occurredAt:
        appointment.cancelledAt,

      action: "cancelled",

      title: "Appointment cancelled",

      summary: `${appointment.appointmentNumber} was cancelled.`,

      actor:
        appointment.cancelledBy,

      reference:
        appointment.appointmentNumber,

      details: [
        {
          label: "Cancellation reason",
          value:
            appointment.cancellationReason ??
            "Not recorded",
          sensitive: true,
        },
      ],
    })
  }

  if (appointment.noShowAt) {
    events.push({
      id: createDerivedEventId(
        appointment.id,
        "no-show"
      ),

      appointmentId:
        appointment.id,

      patientId:
        appointment.patientId,

      occurredAt:
        appointment.noShowAt,

      action: "no-show",

      title:
        "Appointment marked no-show",

      summary: `${appointment.appointmentNumber} was marked as a no-show.`,

      actor:
        appointment.noShowMarkedBy,

      reference:
        appointment.appointmentNumber,

      details: [
        {
          label: "Final status",
          value:
            APPOINTMENT_STATUS_LABELS[
              "no-show"
            ],
        },
      ],
    })
  }

  const persistedRevisionEvents =
    recordedAuditEvents.filter(
      (event) =>
        event.appointmentId ===
        appointment.id
    )

  const uniqueEvents =
    new Map<
      string,
      AppointmentAuditEvent
    >()

  ;[
    ...events,
    ...persistedRevisionEvents,
  ].forEach((event) => {
    uniqueEvents.set(
      event.id,
      event
    )
  })

  return Array.from(
    uniqueEvents.values()
  ).sort(
    (firstEvent, secondEvent) =>
      new Date(
        secondEvent.occurredAt
      ).getTime() -
      new Date(
        firstEvent.occurredAt
      ).getTime()
  )
}
