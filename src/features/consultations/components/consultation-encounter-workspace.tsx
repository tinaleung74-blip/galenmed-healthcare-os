"use client"

import Link from "next/link"
import {
  ArrowLeft,
  FileSignature,
  Pill,
  Play,
  Stethoscope,
} from "lucide-react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConsultationClinicalContext } from "@/features/consultations/components/consultation-clinical-context"
import { ConsultationDiagnosisWorkspace } from "@/features/consultations/components/consultation-diagnosis-workspace"
import { ConsultationSoapNoteEditor } from "@/features/consultations/components/consultation-soap-note-editor"
import {
  ConsultationPriorityBadge,
  ConsultationStatusBadge,
} from "@/features/consultations/components/consultation-status-badges"
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_VISIT_TYPE_LABELS,
} from "@/features/consultations/constants/consultation.constants"
import { useConsultationEmr } from "@/features/consultations/providers/consultation-emr-provider"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import { usePatients } from "@/features/patients/providers/patient-provider"
import {
  formatPatientDateTime,
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface ConsultationEncounterWorkspaceProps {
  consultationReference: string
}

export function ConsultationEncounterWorkspace({
  consultationReference,
}: ConsultationEncounterWorkspaceProps) {
  const {
    consultations,
    startConsultation,
  } = useConsultations()

  const { soapNotes } =
    useConsultationEmr()

  const { patients } = usePatients()

  const consultation =
    consultations.find(
      (candidateConsultation) =>
        candidateConsultation.consultationNumber ===
          consultationReference ||
        candidateConsultation.id ===
          consultationReference
    ) ?? null

  if (!consultation) {
    return (
      <section className="flex min-h-[65vh] flex-col items-center justify-center rounded-xl border bg-background px-6 py-12 text-center">
        <Stethoscope
          className="size-9 text-muted-foreground"
          aria-hidden="true"
        />

        <h1 className="mt-5 text-xl font-semibold">
          Consultation unavailable
        </h1>

        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          The requested consultation could not be found
          in the current development session.
        </p>

        <Link
          href="/consultations"
          className={buttonVariants({
            variant: "default",
            className:
              "mt-6 bg-teal-700 text-white hover:bg-teal-800",
          })}
        >
          Return to consultation queue
        </Link>
      </section>
    )
  }

  const currentConsultation = consultation

  const patient =
    patients.find(
      (candidatePatient) =>
        candidatePatient.id ===
        currentConsultation.patientId
    ) ?? null

  const soapNote =
    soapNotes.find(
      (note) =>
        note.consultationId ===
        currentConsultation.id
    ) ?? null

  function handleStartConsultation() {
    try {
      startConsultation(
        currentConsultation.id
      )

      toast.success(
        "Consultation started",
        {
          description: `${currentConsultation.consultationNumber} is now in progress.`,
        }
      )
    } catch {
      toast.error(
        "Unable to start consultation",
        {
          description:
            "The consultation status could not be updated.",
        }
      )
    }
  }

  const isCompleted =
    currentConsultation.status ===
    "completed"

  const isUnavailable =
    currentConsultation.status ===
      "cancelled" ||
    currentConsultation.status ===
      "no-show"

  const isWaiting =
    currentConsultation.status ===
    "waiting"

  const canShowClinicalWorkspace =
    currentConsultation.status ===
      "in-progress" ||
    isCompleted

  return (
    <div className="space-y-6">
      <Link
        href="/consultations"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        Back to consultation queue
      </Link>

      <section className="rounded-xl border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {patient
                  ? getPatientFullName(patient)
                  : "Patient unavailable"}
              </h1>

              <ConsultationStatusBadge
                status={
                  currentConsultation.status
                }
              />

              <ConsultationPriorityBadge
                priority={
                  currentConsultation.priority
                }
              />
            </div>

            <p className="mt-2 font-mono text-sm text-teal-700">
              {
                currentConsultation.consultationNumber
              }
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {
                CONSULTATION_VISIT_TYPE_LABELS[
                  currentConsultation.visitType
                ]
              }
              {" · "}
              {
                CONSULTATION_MODE_LABELS[
                  currentConsultation.mode
                ]
              }
            </p>
          </div>

          {isWaiting ? (
            <Button
              type="button"
              className="bg-teal-700 text-white hover:bg-teal-800"
              onClick={handleStartConsultation}
            >
              <Play aria-hidden="true" />
              Start consultation
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Scheduled
            </p>

            <p className="mt-1 text-sm font-medium">
              {formatPatientDateTime(
                currentConsultation.scheduledAt
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Doctor
            </p>

            <p className="mt-1 text-sm font-medium">
              {currentConsultation.doctorName}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Department
            </p>

            <p className="mt-1 text-sm font-medium">
              {
                currentConsultation.departmentName
              }
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Chief complaint
            </p>

            <p className="mt-1 text-sm font-medium">
              {
                currentConsultation.chiefComplaint
              }
            </p>
          </div>
        </div>
      </section>

      {isUnavailable ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          This consultation is{" "}
          {currentConsultation.status ===
          "cancelled"
            ? "cancelled"
            : "marked as no-show"}
          . Clinical documentation cannot be entered.
        </div>
      ) : null}

      {isWaiting ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Start the consultation before entering or
          saving clinical documentation.
        </div>
      ) : null}

      {isCompleted ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          This completed encounter is read-only. A future
          authorized amendment workflow will be required
          for post-finalization changes.
        </div>
      ) : null}

      {canShowClinicalWorkspace &&
      patient ? (
        <>
          <ConsultationClinicalContext
            patient={patient}
          />

          <ConsultationSoapNoteEditor
            key={`${soapNote?.id ?? currentConsultation.id}-${soapNote?.version ?? 0}`}
            consultation={
              currentConsultation
            }
            note={soapNote}
          />

          <ConsultationDiagnosisWorkspace
            consultation={currentConsultation}
          />

          <section className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Prescriptions",
                description:
                  "Medication orders, instructions, and safety checks.",
                icon: Pill,
              },
              {
                title:
                  "Follow-up & Signature",
                description:
                  "Follow-up plan, digital signature, and encounter finalization.",
                icon: FileSignature,
              },
            ].map((section) => {
              const Icon = section.icon

              return (
                <Card
                  key={section.title}
                  className="border-dashed shadow-none"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon
                        className="size-4 text-teal-700"
                        aria-hidden="true"
                      />
                      {section.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>

                    <p className="mt-4 text-xs font-medium text-teal-700">
                      Next Consultation increment
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </section>
        </>
      ) : null}

      {canShowClinicalWorkspace &&
      !patient ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          Clinical documentation is unavailable because
          the linked patient record could not be found.
        </div>
      ) : null}
    </div>
  )
}
