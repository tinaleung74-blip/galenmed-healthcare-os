"use client"

import {
  useState,
  useTransition,
} from "react"
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  LoaderCircle,
  Save,
  Stethoscope,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"

import {
  GalenMedLogo,
} from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  StaffContext,
} from "@/features/auth/types/staff-auth.types"
import {
  completeDoctorConsultationAction,
  saveDoctorConsultationAction,
  startDoctorConsultationAction,
} from "@/features/hospital-operations/actions/doctor-consultation.actions"
import {
  DoctorConsultationStatusBadge,
  DoctorPriorityBadge,
  DoctorQueueStatusBadge,
} from "@/features/hospital-operations/components/doctor-consultation-badges"
import type {
  DoctorConsultationWorkspaceData,
} from "@/features/hospital-operations/types/doctor-consultation.types"
import {
  calculateDoctorPatientAge,
  createDoctorIdempotencyKey,
  formatDoctorDate,
  formatDoctorDateTime,
  formatDoctorDocumentType,
} from "@/features/hospital-operations/utils/doctor-consultation.utils"
import { cn } from "@/lib/utils"

interface DoctorConsultationWorkspaceProps {
  context: StaffContext
  data:
    DoctorConsultationWorkspaceData
}

interface ConsultationFormState {
  chiefComplaint: string
  historyOfPresentIllness: string
  physicalExamination: string
  assessment: string
  diagnosisCode: string
  diagnosisText: string
  treatmentPlan: string
  clinicalNotes: string
}

function getInitialFormState(
  data:
    DoctorConsultationWorkspaceData
): ConsultationFormState {
  return {
    chiefComplaint:
      data.consultation
        ?.chiefComplaint ??
      data.visit.chiefConcern ??
      "",

    historyOfPresentIllness:
      data.consultation
        ?.historyOfPresentIllness ??
      "",

    physicalExamination:
      data.consultation
        ?.physicalExamination ??
      "",

    assessment:
      data.consultation
        ?.assessment ??
      "",

    diagnosisCode:
      data.consultation
        ?.diagnosisCode ??
      "",

    diagnosisText:
      data.consultation
        ?.diagnosisText ??
      "",

    treatmentPlan:
      data.consultation
        ?.treatmentPlan ??
      "",

    clinicalNotes:
      data.consultation
        ?.clinicalNotes ??
      "",
  }
}

export function DoctorConsultationWorkspace({
  context,
  data,
}: DoctorConsultationWorkspaceProps) {
  const router =
    useRouter()

  const [values, setValues] =
    useState<
      ConsultationFormState
    >(
      () =>
        getInitialFormState(data)
    )

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    )

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null
    )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const patientName = [
    data.patient.firstName,
    data.patient.middleName,
    data.patient.lastName,
  ]
    .filter(Boolean)
    .join(" ")

  const age =
    calculateDoctorPatientAge(
      data.patient.dateOfBirth
    )

  const isCompleted =
    data.consultation?.status ===
    "completed"

  function updateValue(
    key:
      keyof ConsultationFormState,
    value: string
  ) {
    setValues(
      (currentValues) => ({
        ...currentValues,
        [key]: value,
      })
    )
  }

  function startConsultation() {
    setErrorMessage(null)
    setSuccessMessage(null)

    startTransition(
      async () => {
        const result =
          await startDoctorConsultationAction(
            data.request.id
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        setSuccessMessage(
          result.message
        )

        router.refresh()
      }
    )
  }

  function saveDraft() {
    if (!data.consultation) {
      setErrorMessage(
        "Start the consultation before saving clinical documentation."
      )
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    startTransition(
      async () => {
        const result =
          await saveDoctorConsultationAction(
            {
              consultationId:
                data.consultation!.id,
              ...values,
            }
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        setSuccessMessage(
          result.message
        )

        router.refresh()
      }
    )
  }

  function completeConsultation() {
    if (!data.consultation) {
      setErrorMessage(
        "Start the consultation before completion."
      )
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    startTransition(
      async () => {
        const result =
          await completeDoctorConsultationAction(
            {
              idempotencyKey:
                createDoctorIdempotencyKey(
                  "doctor-complete"
                ),
              consultationId:
                data.consultation!.id,
              ...values,
            }
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        setSuccessMessage(
          result.message
        )

        router.refresh()
      }
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <GalenMedLogo
              size="md"
              priority
              className="rounded-xl bg-white p-1 ring-1 ring-slate-200"
            />

            <div>
              <p className="font-semibold tracking-tight">
                GalenMed
              </p>

              <p className="text-xs text-muted-foreground">
                Doctor Consultation Workspace
              </p>
            </div>
          </div>

          <Link
            href="/doctor/queue"
            className={cn(
              buttonVariants({
                variant: "outline",
              })
            )}
          >
            <ArrowLeft
              aria-hidden="true"
            />
            Patient Queue
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Assigned clinical encounter
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {patientName}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {data.patient.medicalRecordNumber}
              {" · "}
              {data.visit.visitNumber}
              {" · "}
              {data.request.requestNumber}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <DoctorPriorityBadge
              priority={
                data.request.priority
              }
            />

            <DoctorQueueStatusBadge
              status={
                data.queue.status
              }
            />

            {data.consultation ? (
              <DoctorConsultationStatusBadge
                status={
                  data.consultation.status
                }
              />
            ) : null}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UserRound
                className="size-5 text-sky-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Patient
                </p>

                <p className="mt-1 font-semibold">
                  {age !== null
                    ? `${age} years old`
                    : "Age unavailable"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {data.patient.biologicalSex}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Date of birth
              </p>

              <p className="mt-1 font-semibold">
                {formatDoctorDate(
                  data.patient.dateOfBirth
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Branch
              </p>

              <p className="mt-1 font-semibold">
                {data.branch.name}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Assigned Doctor
              </p>

              <p className="mt-1 font-semibold">
                {context.fullName}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-none">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-semibold">
                Visit and concern
              </h2>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Chief concern
                  </dt>
                  <dd className="mt-1">
                    {data.visit.chiefConcern ??
                      "Not recorded"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Arrival mode
                  </dt>
                  <dd className="mt-1">
                    {data.visit.arrivalMode}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Registered
                  </dt>
                  <dd className="mt-1">
                    {formatDoctorDateTime(
                      data.visit.registeredAt
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Checked in
                  </dt>
                  <dd className="mt-1">
                    {formatDoctorDateTime(
                      data.visit.checkedInAt
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-semibold">
                Contact and emergency details
              </h2>

              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Mobile / Email
                  </dt>
                  <dd className="mt-1 break-words">
                    {data.patient.mobileNumber ??
                      "No mobile"}
                    {" · "}
                    {data.patient.emailAddress ??
                      "No email"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Address
                  </dt>
                  <dd className="mt-1">
                    {data.patient.address}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Emergency contact
                  </dt>
                  <dd className="mt-1">
                    {
                      data.patient
                        .emergencyContactName
                    }
                    {" · "}
                    {
                      data.patient
                        .emergencyContactNumber
                    }
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </section>

        {!data.consultation ? (
          <Card className="border-teal-200 bg-teal-50/40 shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <Stethoscope
                className="size-9 text-teal-700"
                aria-hidden="true"
              />

              <h2 className="mt-4 text-lg font-semibold">
                Consultation not started
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Starting the consultation will
                move the assigned queue entry
                into service and open the
                clinical documentation form.
              </p>

              <Button
                type="button"
                size="lg"
                disabled={isPending}
                className="mt-5 bg-teal-700 text-white hover:bg-teal-800"
                onClick={
                  startConsultation
                }
              >
                {isPending ? (
                  <>
                    <LoaderCircle
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Starting
                  </>
                ) : (
                  <>
                    <Stethoscope
                      aria-hidden="true"
                    />
                    Start consultation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-5 rounded-xl border bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Clinical documentation
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {
                    data.consultation
                      .consultationNumber
                  }
                  {" · Revision "}
                  {
                    data.consultation
                      .revisionNumber
                  }
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Last update:{" "}
                {formatDoctorDateTime(
                  data.consultation.updatedAt
                )}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doctor-chief-complaint">
                  Chief complaint
                </Label>

                <Textarea
                  id="doctor-chief-complaint"
                  rows={3}
                  value={
                    values.chiefComplaint
                  }
                  disabled={
                    isPending ||
                    isCompleted
                  }
                  onChange={(event) =>
                    updateValue(
                      "chiefComplaint",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-hpi">
                  History of present illness
                </Label>

                <Textarea
                  id="doctor-hpi"
                  rows={3}
                  value={
                    values
                      .historyOfPresentIllness
                  }
                  disabled={
                    isPending ||
                    isCompleted
                  }
                  onChange={(event) =>
                    updateValue(
                      "historyOfPresentIllness",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="doctor-examination">
                  Physical examination
                </Label>

                <Textarea
                  id="doctor-examination"
                  rows={4}
                  value={
                    values.physicalExamination
                  }
                  disabled={
                    isPending ||
                    isCompleted
                  }
                  onChange={(event) =>
                    updateValue(
                      "physicalExamination",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="doctor-assessment">
                  Assessment
                  <span className="ml-1 text-rose-700">
                    Required to complete
                  </span>
                </Label>

                <Textarea
                  id="doctor-assessment"
                  rows={4}
                  value={
                    values.assessment
                  }
                  disabled={
                    isPending ||
                    isCompleted
                  }
                  onChange={(event) =>
                    updateValue(
                      "assessment",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-diagnosis-code">
                  Diagnosis code
                </Label>

                <Input
                  id="doctor-diagnosis-code"
                  value={
                    values.diagnosisCode
                  }
                  disabled={
                    isPending ||
                    isCompleted
                  }
                  placeholder="Example: ICD-10 code"
                  onChange={(event) =>
                    updateValue(
                      "diagnosisCode",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-diagnosis-text">
                  Diagnosis
                  <span className="ml-1 text-rose-700">
                    Required to complete
                  </span>
                </Label>

                <Input
                  id="doctor-diagnosis-text"
                  value={
                    values.diagnosisText
                  }
                  disabled={
                    isPending ||
                    isCompleted
                  }
                  onChange={(event) =>
                    updateValue(
                      "diagnosisText",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="doctor-treatment-plan">
                  Treatment plan
                  <span className="ml-1 text-rose-700">
                    Required to complete
                  </span>
                </Label>

                <Textarea
                  id="doctor-treatment-plan"
                  rows={4}
                  value={
                    values.treatmentPlan
                  }
                  disabled={
                    isPending ||
                    isCompleted
                  }
                  onChange={(event) =>
                    updateValue(
                      "treatmentPlan",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="doctor-clinical-notes">
                  Additional clinical notes
                </Label>

                <Textarea
                  id="doctor-clinical-notes"
                  rows={4}
                  value={
                    values.clinicalNotes
                  }
                  disabled={
                    isPending ||
                    isCompleted
                  }
                  onChange={(event) =>
                    updateValue(
                      "clinicalNotes",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              >
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              >
                {successMessage}
              </div>
            ) : null}

            {!isCompleted ? (
              <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={saveDraft}
                >
                  {isPending ? (
                    <LoaderCircle
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save
                      aria-hidden="true"
                    />
                  )}
                  Save draft
                </Button>

                <Button
                  type="button"
                  disabled={isPending}
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                  onClick={
                    completeConsultation
                  }
                >
                  {isPending ? (
                    <>
                      <LoaderCircle
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      Completing
                    </>
                  ) : (
                    <>
                      <ClipboardCheck
                        aria-hidden="true"
                      />
                      Complete consultation
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Consultation completed. The
                finalized consultation summary
                is now subject to Cashier
                clearance before patient
                release.
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText
              className="size-5 text-violet-700"
              aria-hidden="true"
            />

            <h2 className="text-lg font-semibold">
              Available clinical documents
            </h2>
          </div>

          {data.clinicalDocuments.length ===
          0 ? (
            <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
              No finalized clinical document
              is available for this assigned
              patient.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.clinicalDocuments.map(
                (document) => (
                  <Card
                    key={document.id}
                    className="shadow-none"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {document.title}
                          </p>

                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {
                              document.documentNumber
                            }
                          </p>
                        </div>

                        <span className="rounded-full border bg-slate-50 px-2 py-0.5 text-xs font-medium">
                          {formatDoctorDocumentType(
                            document.documentType
                          )}
                        </span>
                      </div>

                      <p className="mt-4 text-xs text-muted-foreground">
                        Finalized:{" "}
                        {formatDoctorDateTime(
                          document.finalizedAt
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
