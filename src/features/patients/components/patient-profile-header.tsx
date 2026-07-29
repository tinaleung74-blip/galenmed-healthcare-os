import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { PatientStatusBadge } from "@/features/patients/components/patient-status-badge"
import {
  BIOLOGICAL_SEX_LABELS,
} from "@/features/patients/constants/patient.constants"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  calculateAge,
  formatPatientDate,
  getPatientFullName,
  getPatientInitials,
} from "@/features/patients/utils/patient.utils"

interface PatientProfileHeaderProps {
  patient: Patient
  onEditPatient: () => void
}

export function PatientProfileHeader({
  patient,
  onEditPatient,
}: PatientProfileHeaderProps) {
  const age = calculateAge(patient.dateOfBirth)

  return (
    <section className="space-y-4">
      <Link
        href="/patients"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        Back to patients
      </Link>

      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-base font-semibold text-teal-700">
              {getPatientInitials(patient)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  {getPatientFullName(patient)}
                </h1>

                <PatientStatusBadge status={patient.status} />
              </div>

              <p className="mt-1 font-mono text-sm font-medium text-teal-700">
                {patient.medicalRecordNumber}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Patient demographic and longitudinal record
                workspace
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={onEditPatient}
          >
            <Pencil aria-hidden="true" />
            Edit demographics
          </Button>
        </div>

        <div className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-start gap-2">
            <Building2
              className="mt-0.5 size-4 shrink-0 text-teal-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Branch
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {patient.branchName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CalendarDays
              className="mt-0.5 size-4 shrink-0 text-teal-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Date of birth
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {formatPatientDate(patient.dateOfBirth)}
                {age === null ? "" : ` · ${age} years old`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <UserRound
              className="mt-0.5 size-4 shrink-0 text-teal-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Biological sex
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {
                  BIOLOGICAL_SEX_LABELS[
                    patient.biologicalSex
                  ]
                }
              </p>
            </div>
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <Phone
                className="size-4 shrink-0 text-teal-700"
                aria-hidden="true"
              />

              <p className="truncate text-sm">
                {patient.mobileNumber ?? "No mobile number"}
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <Mail
                className="size-4 shrink-0 text-teal-700"
                aria-hidden="true"
              />

              <p className="truncate text-sm text-muted-foreground">
                {patient.emailAddress ?? "No email address"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
