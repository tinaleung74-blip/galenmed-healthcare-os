"use client"

import type { ReactNode } from "react"
import {
  Building2,
  CalendarClock,
  ExternalLink,
  MapPin,
  MonitorSmartphone,
  Pencil,
  Stethoscope,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AppointmentAuditHistory } from "@/features/appointments/components/appointment-audit-history"
import {
  AppointmentPriorityBadge,
  AppointmentStatusBadge,
} from "@/features/appointments/components/appointment-status-badges"
import {
  APPOINTMENT_SOURCE_LABELS,
} from "@/features/appointments/constants/appointment.constants"
import type { AppointmentRecord } from "@/features/appointments/types/appointment.types"
import {
  formatAppointmentRange,
} from "@/features/appointments/utils/appointment.utils"
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_VISIT_TYPE_LABELS,
} from "@/features/consultations/constants/consultation.constants"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface AppointmentDetailsSheetProps {
  appointment:
    | AppointmentRecord
    | null

  patient: Patient | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onEditAppointment: (
    appointment: AppointmentRecord
  ) => void

  onOpenPatientProfile: (
    patient: Patient
  ) => void

  onOpenConsultation: (
    consultationId: string
  ) => void
}

interface DetailItemProps {
  label: string
  value: ReactNode
  className?: string
}

function DetailItem({
  label,
  value,
  className,
}: DetailItemProps) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 text-sm text-foreground">
        {value}
      </dd>
    </div>
  )
}

export function AppointmentDetailsSheet({
  appointment,
  patient,
  open,
  onOpenChange,
  onEditAppointment,
  onOpenPatientProfile,
  onOpenConsultation,
}: AppointmentDetailsSheetProps) {
  if (!appointment || !patient) {
    return null
  }

  const canEdit =
    appointment.status ===
      "scheduled" ||
    appointment.status ===
      "confirmed"

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <CalendarClock
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {getPatientFullName(
                  patient
                )}
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {
                  appointment.appointmentNumber
                }
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <AppointmentStatusBadge
                  status={
                    appointment.status
                  }
                />

                <AppointmentPriorityBadge
                  priority={
                    appointment.priority
                  }
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Patient
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Patient name"
                value={getPatientFullName(
                  patient
                )}
              />

              <DetailItem
                label="Medical record number"
                value={
                  <span className="font-mono text-xs">
                    {
                      patient.medicalRecordNumber
                    }
                  </span>
                }
              />

              <DetailItem
                label="Mobile"
                value={
                  patient.mobileNumber ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Email"
                value={
                  patient.emailAddress ??
                  "Not recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Schedule
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Appointment schedule"
                className="sm:col-span-2"
                value={formatAppointmentRange(
                  appointment
                )}
              />

              <DetailItem
                label="Duration"
                value={`${appointment.durationMinutes} minutes`}
              />

              <DetailItem
                label="Visit type"
                value={
                  CONSULTATION_VISIT_TYPE_LABELS[
                    appointment.visitType
                  ]
                }
              />

              <DetailItem
                label="Mode"
                value={
                  <span className="inline-flex items-center gap-2">
                    <MonitorSmartphone
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />

                    {
                      CONSULTATION_MODE_LABELS[
                        appointment.mode
                      ]
                    }
                  </span>
                }
              />

              <DetailItem
                label="Booking source"
                value={
                  APPOINTMENT_SOURCE_LABELS[
                    appointment.source
                  ]
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Care assignment
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Branch"
                value={
                  appointment.branchName
                }
              />

              <DetailItem
                label="Department"
                value={
                  appointment.departmentName
                }
              />

              <DetailItem
                label="Doctor"
                value={
                  appointment.doctorName
                }
              />

              <DetailItem
                label="Room"
                value={
                  <span className="inline-flex items-center gap-2">
                    <MapPin
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />

                    {appointment.roomName ??
                      "Telemedicine"}
                  </span>
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Appointment information
            </h3>

            <dl className="space-y-4 rounded-xl border p-4">
              <DetailItem
                label="Chief complaint"
                value={
                  appointment.chiefComplaint
                }
              />

              <DetailItem
                label="Patient instructions"
                value={
                  appointment.patientInstructions ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Internal notes"
                value={
                  appointment.internalNotes ??
                  "Not recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Operational timestamps
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Confirmed"
                value={formatPatientDateTime(
                  appointment.confirmedAt
                )}
              />

              <DetailItem
                label="Checked in"
                value={formatPatientDateTime(
                  appointment.checkedInAt
                )}
              />

              <DetailItem
                label="Consultation started"
                value={formatPatientDateTime(
                  appointment.consultationStartedAt
                )}
              />

              <DetailItem
                label="Completed"
                value={formatPatientDateTime(
                  appointment.completedAt
                )}
              />
            </dl>
          </section>

          <AppointmentAuditHistory
            appointment={appointment}
          />

          {appointment.cancellationReason ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-semibold text-rose-800">
                Cancellation reason
              </h3>

              <p className="mt-2 text-sm text-rose-700">
                {
                  appointment.cancellationReason
                }
              </p>
            </section>
          ) : null}
        </div>

        <SheetFooter className="gap-3 border-t bg-slate-50 p-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {appointment.linkedConsultationId ? (
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 whitespace-nowrap sm:w-auto"
                onClick={() =>
                  onOpenConsultation(appointment.linkedConsultationId!)
                }
              >
                <Stethoscope aria-hidden="true" />
                Open consultation
              </Button>
            ) : null}

            <Button
              type="button"
              disabled={!canEdit}
              className="w-full shrink-0 whitespace-nowrap bg-teal-700 text-white hover:bg-teal-800 sm:w-auto"
              onClick={() =>
                onEditAppointment(
                  appointment
                )
              }
            >
              <Pencil aria-hidden="true" />

              {canEdit
                ? "Edit appointment"
                : "Read-only appointment"}
            </Button>
          </div>

          <div className="flex w-full flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 whitespace-nowrap sm:w-auto"
              onClick={() =>
                onOpenChange(false)
              }
            >
              Close
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 whitespace-nowrap sm:w-auto"
              onClick={() =>
                onOpenPatientProfile(
                  patient
                )
              }
            >
              <ExternalLink aria-hidden="true" />
              Patient profile
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
