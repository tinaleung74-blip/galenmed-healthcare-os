"use client"

import type { ReactNode } from "react"
import {
  Building2,
  CalendarClock,
  ExternalLink,
  FileText,
  MapPin,
  MonitorSmartphone,
  Phone,
  Play,
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
import {
  ConsultationPriorityBadge,
  ConsultationStatusBadge,
} from "@/features/consultations/components/consultation-status-badges"
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_VISIT_TYPE_LABELS,
} from "@/features/consultations/constants/consultation.constants"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import {
  BIOLOGICAL_SEX_LABELS,
} from "@/features/patients/constants/patient.constants"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  calculateAge,
  formatPatientDate,
  formatPatientDateTime,
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface ConsultationDetailsSheetProps {
  consultation: ConsultationEncounter | null
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenEncounter: (
    consultation: ConsultationEncounter
  ) => void
  onOpenPatientProfile: (
    patient: Patient
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

export function ConsultationDetailsSheet({
  consultation,
  patient,
  open,
  onOpenChange,
  onOpenEncounter,
  onOpenPatientProfile,
}: ConsultationDetailsSheetProps) {
  if (!consultation || !patient) {
    return null
  }

  const age = calculateAge(
    patient.dateOfBirth
  )

  const canOpenEncounter =
    consultation.status === "waiting" ||
    consultation.status === "in-progress" ||
    consultation.status === "completed"

  const encounterButtonLabel =
    consultation.status === "waiting"
      ? "Start consultation"
      : consultation.status === "in-progress"
        ? "Resume consultation"
        : "View encounter"

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
              <Stethoscope
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {getPatientFullName(patient)}
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {consultation.consultationNumber}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <ConsultationStatusBadge
                  status={consultation.status}
                />

                <ConsultationPriorityBadge
                  priority={
                    consultation.priority
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
                Patient context
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Patient"
                value={getPatientFullName(patient)}
              />

              <DetailItem
                label="Medical record number"
                value={
                  <span className="font-mono text-xs">
                    {patient.medicalRecordNumber}
                  </span>
                }
              />

              <DetailItem
                label="Date of birth"
                value={formatPatientDate(
                  patient.dateOfBirth
                )}
              />

              <DetailItem
                label="Age"
                value={
                  age === null
                    ? "Unavailable"
                    : `${age} years old`
                }
              />

              <DetailItem
                label="Biological sex"
                value={
                  BIOLOGICAL_SEX_LABELS[
                    patient.biologicalSex
                  ]
                }
              />

              <DetailItem
                label="Mobile"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Phone
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />

                    {patient.mobileNumber ??
                      "Not recorded"}
                  </span>
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
                Consultation schedule
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Scheduled"
                value={formatPatientDateTime(
                  consultation.scheduledAt
                )}
              />

              <DetailItem
                label="Visit type"
                value={
                  CONSULTATION_VISIT_TYPE_LABELS[
                    consultation.visitType
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
                        consultation.mode
                      ]
                    }
                  </span>
                }
              />

              <DetailItem
                label="Queue number"
                value={
                  consultation.queueNumber === null
                    ? "Not assigned"
                    : `#${consultation.queueNumber}`
                }
              />

              <DetailItem
                label="Checked in"
                value={formatPatientDateTime(
                  consultation.checkedInAt
                )}
              />

              <DetailItem
                label="Started"
                value={formatPatientDateTime(
                  consultation.startedAt
                )}
              />

              <DetailItem
                label="Completed"
                value={formatPatientDateTime(
                  consultation.completedAt
                )}
              />

              <DetailItem
                label="Cancelled"
                value={formatPatientDateTime(
                  consultation.cancelledAt
                )}
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
                label="Department"
                value={
                  consultation.departmentName
                }
              />

              <DetailItem
                label="Doctor"
                value={consultation.doctorName}
              />

              <DetailItem
                label="Room"
                value={
                  <span className="inline-flex items-center gap-2">
                    <MapPin
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />

                    {consultation.roomName ??
                      "Not assigned"}
                  </span>
                }
              />

              <DetailItem
                label="Consultation mode"
                value={
                  CONSULTATION_MODE_LABELS[
                    consultation.mode
                  ]
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Consultation reason
              </h3>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">
                {consultation.chiefComplaint}
              </p>

              {consultation.administrativeNotes ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {
                    consultation.administrativeNotes
                  }
                </p>
              ) : null}
            </div>
          </section>

          {consultation.cancellationReason ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-semibold text-rose-800">
                Cancellation reason
              </h3>

              <p className="mt-2 text-sm text-rose-700">
                {
                  consultation.cancellationReason
                }
              </p>
            </section>
          ) : null}
        </div>

        <SheetFooter className="border-t bg-slate-50 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenPatientProfile(patient)
            }
          >
            <ExternalLink aria-hidden="true" />
            Patient profile
          </Button>

          {canOpenEncounter ? (
            <Button
              type="button"
              className="bg-teal-700 text-white hover:bg-teal-800"
              onClick={() =>
                onOpenEncounter(consultation)
              }
            >
              <Play aria-hidden="true" />
              {encounterButtonLabel}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
