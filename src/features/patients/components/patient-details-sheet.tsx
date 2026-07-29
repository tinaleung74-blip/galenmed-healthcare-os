"use client"

import type { ReactNode } from "react"
import {
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
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
import { PatientStatusBadge } from "@/features/patients/components/patient-status-badge"
import {
  BIOLOGICAL_SEX_LABELS,
} from "@/features/patients/constants/patient.constants"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  calculateAge,
  formatPatientDate,
  formatPatientDateTime,
  getPatientFullName,
  getPatientInitials,
} from "@/features/patients/utils/patient.utils"

interface PatientDetailsSheetProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditPatient: (patient: Patient) => void
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

export function PatientDetailsSheet({
  patient,
  open,
  onOpenChange,
  onEditPatient,
}: PatientDetailsSheetProps) {
  if (!patient) {
    return null
  }

  const age = calculateAge(patient.dateOfBirth)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
              {getPatientInitials(patient)}
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-lg">
                {getPatientFullName(patient)}
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {patient.medicalRecordNumber}
              </SheetDescription>

              <div className="mt-2">
                <PatientStatusBadge
                  status={patient.status}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Demographic and registration information only.
            Clinical records are managed through separate
            authorized workflows.
          </p>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Patient identity
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Full name"
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
                label="Registration branch"
                value={patient.branchName}
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Contact information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Mobile number"
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

              <DetailItem
                label="Email address"
                value={
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Mail
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="break-all">
                      {patient.emailAddress ??
                        "Not recorded"}
                    </span>
                  </span>
                }
              />

              <DetailItem
                label="Complete address"
                className="sm:col-span-2"
                value={
                  <span className="inline-flex items-start gap-2">
                    <MapPin
                      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="whitespace-normal">
                      {patient.address}
                    </span>
                  </span>
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Emergency contact
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Contact name"
                value={patient.emergencyContactName}
              />

              <DetailItem
                label="Contact number"
                value={
                  patient.emergencyContactNumber
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Record history
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Last visit"
                value={formatPatientDateTime(
                  patient.lastVisitAt
                )}
              />

              <DetailItem
                label="Registered"
                value={formatPatientDateTime(
                  patient.createdAt
                )}
              />

              <DetailItem
                label="Last updated"
                className="sm:col-span-2"
                value={formatPatientDateTime(
                  patient.updatedAt
                )}
              />
            </dl>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              The patient&apos;s internal identifier is
              intentionally hidden. Staff should use the
              medical record number for authorized operational
              reference.
            </p>
          </div>
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
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() => onEditPatient(patient)}
          >
            <Pencil aria-hidden="true" />
            Edit demographics
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
