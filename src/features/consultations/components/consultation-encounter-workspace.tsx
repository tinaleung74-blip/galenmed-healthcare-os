"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ClipboardList,
  FileSignature,
  HeartPulse,
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
import {
  ConsultationPriorityBadge,
  ConsultationStatusBadge,
} from "@/features/consultations/components/consultation-status-badges"
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_VISIT_TYPE_LABELS,
} from "@/features/consultations/constants/consultation.constants"
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
        consultation.patientId
    ) ?? null

  function handleStartConsultation() {
    try {
      startConsultation(currentConsultation.id)

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
    consultation.status === "completed"

  const isUnavailable =
    consultation.status === "cancelled" ||
    consultation.status === "no-show"

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
                status={consultation.status}
              />

              <ConsultationPriorityBadge
                priority={consultation.priority}
              />
            </div>

            <p className="mt-2 font-mono text-sm text-teal-700">
              {
                consultation.consultationNumber
              }
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {
                CONSULTATION_VISIT_TYPE_LABELS[
                  consultation.visitType
                ]
              }
              {" · "}
              {
                CONSULTATION_MODE_LABELS[
                  consultation.mode
                ]
              }
            </p>
          </div>

          {consultation.status ===
          "waiting" ? (
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
                consultation.scheduledAt
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Doctor
            </p>
            <p className="mt-1 text-sm font-medium">
              {consultation.doctorName}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Department
            </p>
            <p className="mt-1 text-sm font-medium">
              {consultation.departmentName}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Chief complaint
            </p>
            <p className="mt-1 text-sm font-medium">
              {consultation.chiefComplaint}
            </p>
          </div>
        </div>
      </section>

      {isUnavailable ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          This consultation is{" "}
          {consultation.status === "cancelled"
            ? "cancelled"
            : "marked as no-show"}
          . Clinical documentation cannot be entered.
        </div>
      ) : (
        <>
          {isCompleted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
              This is a completed encounter. The future
              EMR workspace will open in read-only mode
              unless an authorized amendment workflow is
              used.
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "SOAP Notes",
                description:
                  "Subjective, Objective, Assessment, and Plan.",
                icon: ClipboardList,
              },
              {
                title: "Diagnosis & ICD-10",
                description:
                  "Structured diagnoses and clinical coding.",
                icon: HeartPulse,
              },
              {
                title: "Prescriptions",
                description:
                  "Medication orders, instructions, and safety checks.",
                icon: Pill,
              },
              {
                title: "Follow-up & Signature",
                description:
                  "Follow-up plan, finalization, and digital signature.",
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
                      EMR workspace will be implemented in
                      the next Consultation increment.
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </section>
        </>
      )}
    </div>
  )
}
