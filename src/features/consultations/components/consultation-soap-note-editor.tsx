"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
} from "react-hook-form"
import {
  Clock3,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConsultationSoapStatusBadge } from "@/features/consultations/components/consultation-soap-status-badge"
import { useConsultationEmr } from "@/features/consultations/providers/consultation-emr-provider"
import {
  consultationSoapNoteFormSchema,
  type ConsultationSoapNoteFormValues,
} from "@/features/consultations/schemas/consultation-soap-note.schema"
import type { ConsultationSoapNote } from "@/features/consultations/types/consultation-emr.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import { formatPatientDateTime } from "@/features/patients/utils/patient.utils"

interface ConsultationSoapNoteEditorProps {
  consultation: ConsultationEncounter
  note: ConsultationSoapNote | null
}

interface ReadOnlySoapSectionProps {
  title: string
  content: string
}

function ReadOnlySoapSection({
  title,
  content,
}: ReadOnlySoapSectionProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {content ||
            "No content was recorded in this section."}
        </p>
      </CardContent>
    </Card>
  )
}

function getSoapFormValues(
  note: ConsultationSoapNote | null
): ConsultationSoapNoteFormValues {
  return {
    subjective: note?.subjective ?? "",
    objective: note?.objective ?? "",
    assessment: note?.assessment ?? "",
    plan: note?.plan ?? "",
  }
}

export function ConsultationSoapNoteEditor({
  consultation,
  note,
}: ConsultationSoapNoteEditorProps) {
  const { saveSoapDraft } =
    useConsultationEmr()

  const isReadOnly =
    consultation.status === "completed" ||
    note?.status === "finalized"

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
      isDirty,
    },
  } = useForm<ConsultationSoapNoteFormValues>({
    resolver: zodResolver(
      consultationSoapNoteFormSchema
    ),
    defaultValues: getSoapFormValues(note),
    mode: "onTouched",
  })

  async function handleSaveDraft(
    values: ConsultationSoapNoteFormValues
  ) {
    try {
      const savedNote = saveSoapDraft(
        consultation.id,
        values
      )

      reset(values)

      toast.success("SOAP draft saved", {
        description: `Version ${savedNote.version} was saved successfully.`,
      })
    } catch {
      setError("root", {
        type: "manual",
        message:
          "The SOAP draft could not be saved. Confirm that the consultation is still in progress.",
      })
    }
  }

  if (isReadOnly) {
    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LockKeyhole
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <h2 className="text-lg font-semibold">
                Finalized SOAP Note
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Finalized clinical documentation is
              read-only.
            </p>
          </div>

          {note ? (
            <div className="flex flex-wrap items-center gap-2">
              <ConsultationSoapStatusBadge
                status={note.status}
              />

              <span className="text-xs text-muted-foreground">
                Version {note.version}
              </span>
            </div>
          ) : null}
        </div>

        {!note ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No finalized SOAP note is available for
              this synthetic completed encounter.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <ReadOnlySoapSection
              title="Subjective"
              content={note.subjective}
            />

            <ReadOnlySoapSection
              title="Objective"
              content={note.objective}
            />

            <ReadOnlySoapSection
              title="Assessment"
              content={note.assessment}
            />

            <ReadOnlySoapSection
              title="Plan"
              content={note.plan}
            />
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText
              className="size-4 text-teal-700"
              aria-hidden="true"
            />

            <h2 className="text-lg font-semibold">
              SOAP Notes
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Structured draft documentation for the
            current encounter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ConsultationSoapStatusBadge
            status={note?.status ?? "draft"}
          />

          <span className="text-xs text-muted-foreground">
            Version {note?.version ?? 0}
          </span>
        </div>
      </div>

      <form
        id="consultation-soap-note-form"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(
          handleSaveDraft
        )}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Subjective
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <Label
                htmlFor="soap-subjective"
                className="sr-only"
              >
                Subjective clinical notes
              </Label>

              <Textarea
                id="soap-subjective"
                rows={10}
                placeholder="Symptoms, history of present illness, patient-reported concerns, and relevant review of systems."
                aria-invalid={Boolean(
                  errors.subjective
                )}
                {...register("subjective")}
              />

              {errors.subjective?.message ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.subjective.message}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Objective
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <Label
                htmlFor="soap-objective"
                className="sr-only"
              >
                Objective clinical notes
              </Label>

              <Textarea
                id="soap-objective"
                rows={10}
                placeholder="Observed findings, examination, measurements, reviewed results, and other objective information."
                aria-invalid={Boolean(
                  errors.objective
                )}
                {...register("objective")}
              />

              {errors.objective?.message ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.objective.message}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Assessment
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <Label
                htmlFor="soap-assessment"
                className="sr-only"
              >
                Assessment clinical notes
              </Label>

              <Textarea
                id="soap-assessment"
                rows={10}
                placeholder="Clinical impression, differential considerations, and assessment narrative."
                aria-invalid={Boolean(
                  errors.assessment
                )}
                {...register("assessment")}
              />

              {errors.assessment?.message ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.assessment.message}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Plan
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <Label
                htmlFor="soap-plan"
                className="sr-only"
              >
                Plan clinical notes
              </Label>

              <Textarea
                id="soap-plan"
                rows={10}
                placeholder="Investigations, treatment, counseling, monitoring, referrals, and follow-up plan."
                aria-invalid={Boolean(
                  errors.plan
                )}
                {...register("plan")}
              />

              {errors.plan?.message ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.plan.message}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-teal-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-medium">
                Draft clinical documentation
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Saving does not finalize or digitally
                sign this encounter.
              </p>

              {note ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3
                    className="size-3"
                    aria-hidden="true"
                  />

                  Last saved{" "}
                  {formatPatientDateTime(
                    note.updatedAt
                  )}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting || !isDirty
            }
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving draft
              </>
            ) : (
              <>
                <Save aria-hidden="true" />
                Save SOAP draft
              </>
            )}
          </Button>
        </div>

        {errors.root?.message ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {errors.root.message}
          </div>
        ) : null}
      </form>
    </section>
  )
}
