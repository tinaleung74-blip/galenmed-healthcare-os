import type { AppointmentRecord } from "@/features/appointments/types/appointment.types"

/**
 * All appointment records in this file are synthetic.
 * They do not represent real patients, clinicians,
 * facilities, or appointment activity.
 */
export const MOCK_APPOINTMENTS: readonly AppointmentRecord[] =
  [
    {
      id: "mock-appointment-0001",
      appointmentNumber:
        "GM-APT-2026-000001",

      patientId: "mock-patient-0001",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-general-medicine",

      departmentName:
        "General Medicine",

      doctorId:
        "doctor-maria-santos",

      doctorName:
        "Dr. Maria Santos",

      roomId:
        "appointment-room-01",

      roomName:
        "Consultation Room 1",

      scheduledStartAt:
        "2026-07-31T08:30:00+08:00",

      scheduledEndAt:
        "2026-07-31T08:45:00+08:00",

      durationMinutes: 15,

      mode: "in-person",

      visitType: "follow-up",

      status: "checked-in",

      priority: "routine",

      source: "staff",

      chiefComplaint:
        "Synthetic blood-pressure follow-up",

      patientInstructions:
        "Synthetic check-in instruction.",

      internalNotes:
        "Linked to the synthetic Consultation Queue.",

      linkedConsultationId:
        "mock-consultation-0001",

      linkedConsultationNumber:
        "GM-CON-2026-000001",

      confirmedAt:
        "2026-07-30T09:00:00+08:00",

      checkedInAt:
        "2026-07-31T08:12:00+08:00",

      consultationStartedAt: null,
      completedAt: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-25T09:00:00+08:00",

      updatedBy:
        "GalenMed Scheduling Desk",

      updatedAt:
        "2026-07-31T08:12:00+08:00",
    },
    {
      id: "mock-appointment-0002",
      appointmentNumber:
        "GM-APT-2026-000002",

      patientId: "mock-patient-0002",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-internal-medicine",

      departmentName:
        "Internal Medicine",

      doctorId:
        "doctor-rafael-cruz",

      doctorName:
        "Dr. Rafael Cruz",

      roomId:
        "appointment-room-02",

      roomName:
        "Consultation Room 2",

      scheduledStartAt:
        "2026-07-31T08:45:00+08:00",

      scheduledEndAt:
        "2026-07-31T09:00:00+08:00",

      durationMinutes: 15,

      mode: "in-person",

      visitType:
        "new-consultation",

      status: "in-consultation",

      priority: "urgent",

      source: "phone",

      chiefComplaint:
        "Synthetic persistent dizziness",

      patientInstructions:
        "Synthetic appointment instruction.",

      internalNotes: null,

      linkedConsultationId:
        "mock-consultation-0002",

      linkedConsultationNumber:
        "GM-CON-2026-000002",

      confirmedAt:
        "2026-07-30T10:00:00+08:00",

      checkedInAt:
        "2026-07-31T08:20:00+08:00",

      consultationStartedAt:
        "2026-07-31T08:42:00+08:00",

      completedAt: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-29T10:15:00+08:00",

      updatedBy:
        "Dr. Rafael Cruz",

      updatedAt:
        "2026-07-31T08:42:00+08:00",
    },
    {
      id: "mock-appointment-0003",
      appointmentNumber:
        "GM-APT-2026-000003",

      patientId: "mock-patient-0003",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-internal-medicine",

      departmentName:
        "Internal Medicine",

      doctorId:
        "doctor-rafael-cruz",

      doctorName:
        "Dr. Rafael Cruz",

      roomId:
        "appointment-room-02",

      roomName:
        "Consultation Room 2",

      scheduledStartAt:
        "2026-07-31T09:00:00+08:00",

      scheduledEndAt:
        "2026-07-31T09:15:00+08:00",

      durationMinutes: 15,

      mode: "in-person",

      visitType: "follow-up",

      status: "checked-in",

      priority: "routine",

      source: "patient-portal",

      chiefComplaint:
        "Synthetic migraine follow-up",

      patientInstructions: null,
      internalNotes: null,

      linkedConsultationId:
        "mock-consultation-0003",

      linkedConsultationNumber:
        "GM-CON-2026-000003",

      confirmedAt:
        "2026-07-30T10:30:00+08:00",

      checkedInAt:
        "2026-07-31T08:38:00+08:00",

      consultationStartedAt: null,
      completedAt: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-28T14:25:00+08:00",

      updatedBy:
        "GalenMed Scheduling Desk",

      updatedAt:
        "2026-07-31T08:38:00+08:00",
    },
    {
      id: "mock-appointment-0004",
      appointmentNumber:
        "GM-APT-2026-000004",

      patientId: "mock-patient-0004",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-general-medicine",

      departmentName:
        "General Medicine",

      doctorId:
        "doctor-elena-reyes",

      doctorName:
        "Dr. Elena Reyes",

      roomId:
        "appointment-room-03",

      roomName:
        "Consultation Room 3",

      scheduledStartAt:
        "2026-07-31T09:15:00+08:00",

      scheduledEndAt:
        "2026-07-31T09:45:00+08:00",

      durationMinutes: 30,

      mode: "in-person",

      visitType:
        "new-consultation",

      status: "completed",

      priority: "routine",

      source: "walk-in",

      chiefComplaint:
        "Synthetic respiratory symptom assessment",

      patientInstructions: null,
      internalNotes: null,

      linkedConsultationId:
        "mock-consultation-0004",

      linkedConsultationNumber:
        "GM-CON-2026-000004",

      confirmedAt:
        "2026-07-30T11:00:00+08:00",

      checkedInAt:
        "2026-07-31T08:50:00+08:00",

      consultationStartedAt:
        "2026-07-31T09:10:00+08:00",

      completedAt:
        "2026-07-31T09:35:00+08:00",

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-30T08:10:00+08:00",

      updatedBy:
        "Dr. Elena Reyes",

      updatedAt:
        "2026-07-31T09:35:00+08:00",
    },
    {
      id: "mock-appointment-0005",
      appointmentNumber:
        "GM-APT-2026-000005",

      patientId: "mock-patient-0005",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-family-medicine",

      departmentName:
        "Family Medicine",

      doctorId:
        "doctor-maria-santos",

      doctorName:
        "Dr. Maria Santos",

      roomId:
        "appointment-room-01",

      roomName:
        "Consultation Room 1",

      scheduledStartAt:
        "2026-07-31T09:30:00+08:00",

      scheduledEndAt:
        "2026-07-31T10:00:00+08:00",

      durationMinutes: 30,

      mode: "in-person",

      visitType:
        "new-consultation",

      status: "confirmed",

      priority: "urgent",

      source: "phone",

      chiefComplaint:
        "Synthetic abdominal discomfort",

      patientInstructions:
        "Arrive on July 31, 2026 at 9:15 AM.",

      internalNotes:
        "Synthetic urgent appointment record.",

      linkedConsultationId:
        "mock-consultation-0005",

      linkedConsultationNumber:
        "GM-CON-2026-000005",

      confirmedAt:
        "2026-07-31T07:45:00+08:00",

      checkedInAt: null,
      consultationStartedAt: null,
      completedAt: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-31T07:30:00+08:00",

      updatedBy:
        "GalenMed Scheduling Desk",

      updatedAt:
        "2026-07-31T07:45:00+08:00",
    },
    {
      id: "mock-appointment-0006",
      appointmentNumber:
        "GM-APT-2026-000006",

      patientId: "mock-patient-0006",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-general-medicine",

      departmentName:
        "General Medicine",

      doctorId:
        "doctor-maria-santos",

      doctorName:
        "Dr. Maria Santos",

      roomId: null,
      roomName: null,

      scheduledStartAt:
        "2026-07-31T09:45:00+08:00",

      scheduledEndAt:
        "2026-07-31T10:15:00+08:00",

      durationMinutes: 30,

      mode: "telemedicine",

      visitType: "follow-up",

      status: "cancelled",

      priority: "routine",

      source: "patient-portal",

      chiefComplaint:
        "Synthetic reflux follow-up",

      patientInstructions: null,

      internalNotes: null,

      linkedConsultationId:
        "mock-consultation-0006",

      linkedConsultationNumber:
        "GM-CON-2026-000006",

      confirmedAt:
        "2026-07-29T09:00:00+08:00",

      checkedInAt: null,
      consultationStartedAt: null,
      completedAt: null,

      cancelledAt:
        "2026-07-31T08:00:00+08:00",

      cancelledBy:
        "GalenMed Scheduling Desk",

      cancellationReason:
        "Synthetic cancellation requested before the appointment.",

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-27T16:10:00+08:00",

      updatedBy:
        "GalenMed Scheduling Desk",

      updatedAt:
        "2026-07-31T08:00:00+08:00",
    },
    {
      id: "mock-appointment-0007",
      appointmentNumber:
        "GM-APT-2026-000007",

      patientId: "mock-patient-0007",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-internal-medicine",

      departmentName:
        "Internal Medicine",

      doctorId:
        "doctor-rafael-cruz",

      doctorName:
        "Dr. Rafael Cruz",

      roomId:
        "appointment-room-02",

      roomName:
        "Consultation Room 2",

      scheduledStartAt:
        "2026-07-31T10:00:00+08:00",

      scheduledEndAt:
        "2026-07-31T10:30:00+08:00",

      durationMinutes: 30,

      mode: "in-person",

      visitType:
        "results-review",

      status: "checked-in",

      priority: "routine",

      source: "staff",

      chiefComplaint:
        "Synthetic laboratory results review",

      patientInstructions: null,
      internalNotes: null,

      linkedConsultationId:
        "mock-consultation-0007",

      linkedConsultationNumber:
        "GM-CON-2026-000007",

      confirmedAt:
        "2026-07-30T12:00:00+08:00",

      checkedInAt:
        "2026-07-31T09:35:00+08:00",

      consultationStartedAt: null,
      completedAt: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-26T11:40:00+08:00",

      updatedBy:
        "GalenMed Scheduling Desk",

      updatedAt:
        "2026-07-31T09:35:00+08:00",
    },
    {
      id: "mock-appointment-0008",
      appointmentNumber:
        "GM-APT-2026-000008",

      patientId: "mock-patient-0008",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-pediatrics",

      departmentName:
        "Pediatrics",

      doctorId:
        "doctor-elena-reyes",

      doctorName:
        "Dr. Elena Reyes",

      roomId:
        "appointment-room-03",

      roomName:
        "Consultation Room 3",

      scheduledStartAt:
        "2026-07-31T10:15:00+08:00",

      scheduledEndAt:
        "2026-07-31T10:45:00+08:00",

      durationMinutes: 30,

      mode: "in-person",

      visitType: "follow-up",

      status: "no-show",

      priority: "routine",

      source: "phone",

      chiefComplaint:
        "Synthetic pediatric follow-up",

      patientInstructions: null,

      internalNotes:
        "Synthetic no-show workflow record.",

      linkedConsultationId:
        "mock-consultation-0008",

      linkedConsultationNumber:
        "GM-CON-2026-000008",

      confirmedAt:
        "2026-07-30T13:00:00+08:00",

      checkedInAt: null,
      consultationStartedAt: null,
      completedAt: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt:
        "2026-07-31T10:30:00+08:00",

      noShowMarkedBy:
        "GalenMed Scheduling Desk",

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-24T13:00:00+08:00",

      updatedBy:
        "GalenMed Scheduling Desk",

      updatedAt:
        "2026-07-31T10:30:00+08:00",
    },
    {
      id: "mock-appointment-0009",
      appointmentNumber:
        "GM-APT-2026-000009",

      patientId: "mock-patient-0013",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-family-medicine",

      departmentName:
        "Family Medicine",

      doctorId:
        "doctor-maria-santos",

      doctorName:
        "Dr. Maria Santos",

      roomId:
        "appointment-room-01",

      roomName:
        "Consultation Room 1",

      scheduledStartAt:
        "2026-08-01T09:00:00+08:00",

      scheduledEndAt:
        "2026-08-01T09:30:00+08:00",

      durationMinutes: 30,

      mode: "in-person",

      visitType:
        "new-consultation",

      status: "confirmed",

      priority: "routine",

      source: "patient-portal",

      chiefComplaint:
        "Synthetic wellness assessment",

      patientInstructions:
        "Arrive on August 1, 2026 at 8:45 AM.",

      internalNotes: null,

      linkedConsultationId: null,
      linkedConsultationNumber: null,

      confirmedAt:
        "2026-07-30T15:10:00+08:00",

      checkedInAt: null,
      consultationStartedAt: null,
      completedAt: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-30T15:00:00+08:00",

      updatedBy:
        "GalenMed Scheduling Desk",

      updatedAt:
        "2026-07-30T15:10:00+08:00",
    },
    {
      id: "mock-appointment-0010",
      appointmentNumber:
        "GM-APT-2026-000010",

      patientId: "mock-patient-0014",

      branchId: "branch-makati",
      branchName: "GalenMed Makati",

      departmentId:
        "department-pediatrics",

      departmentName:
        "Pediatrics",

      doctorId:
        "doctor-elena-reyes",

      doctorName:
        "Dr. Elena Reyes",

      roomId: null,
      roomName: null,

      scheduledStartAt:
        "2026-08-03T10:00:00+08:00",

      scheduledEndAt:
        "2026-08-03T10:30:00+08:00",

      durationMinutes: 30,

      mode: "telemedicine",

      visitType: "follow-up",

      status: "scheduled",

      priority: "routine",

      source: "staff",

      chiefComplaint:
        "Synthetic pediatric results review",

      patientInstructions:
        "Join the synthetic telemedicine room on August 3, 2026 at 9:55 AM.",

      internalNotes: null,

      linkedConsultationId: null,
      linkedConsultationNumber: null,

      confirmedAt: null,
      checkedInAt: null,
      consultationStartedAt: null,
      completedAt: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdBy:
        "GalenMed Scheduling Desk",

      createdAt:
        "2026-07-30T16:20:00+08:00",

      updatedBy:
        "GalenMed Scheduling Desk",

      updatedAt:
        "2026-07-30T16:20:00+08:00",
    },
  ]
