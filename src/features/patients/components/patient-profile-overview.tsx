import type { ReactNode } from "react"
import {
  Building2,
  CalendarCheck,
  Clock3,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
} from "@/features/patients/utils/patient.utils"

interface PatientProfileOverviewProps {
  patient: Patient
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

export function PatientProfileOverview({
  patient,
}: PatientProfileOverviewProps) {
  const age = calculateAge(patient.dateOfBirth)

  return (
    <div className="space-y-6">
      <section
        aria-label="Patient record summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <ShieldCheck
                className="size-4"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Record status
              </p>
              <div className="mt-2">
                <PatientStatusBadge
                  status={patient.status}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <Building2
                className="size-4"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Registration branch
              </p>
              <p className="mt-1 text-sm font-medium">
                {patient.branchName}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <CalendarCheck
                className="size-4"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Last recorded visit
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatPatientDateTime(
                  patient.lastVisitAt
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <Clock3
                className="size-4"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Record last updated
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatPatientDateTime(patient.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound
                className="size-4 text-teal-700"
                aria-hidden="true"
              />
              Demographic information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
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
                label="Current age"
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
                label="Registered"
                value={formatPatientDateTime(
                  patient.createdAt
                )}
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone
                className="size-4 text-teal-700"
                aria-hidden="true"
              />
              Contact and emergency information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
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
                    <span>{patient.address}</span>
                  </span>
                }
              />

              <DetailItem
                label="Emergency contact"
                value={patient.emergencyContactName}
              />

              <DetailItem
                label="Emergency contact number"
                value={patient.emergencyContactNumber}
              />
            </dl>
          </CardContent>
        </Card>
      </section>

      <Card className="border-teal-100 bg-teal-50/50 shadow-none">
        <CardContent className="flex items-start gap-3 p-5">
          <div className="rounded-lg bg-white p-2 text-teal-700">
            <FileCheck2
              className="size-4"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-teal-950">
              Clinical modules remain separate and auditable
            </h2>

            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-teal-800">
              Medical history, vital signs, allergies,
              insurance, documents, and the longitudinal
              timeline will be implemented as separate patient
              modules. No clinical information is inferred from
              demographic data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
