"use client"

import {
  useEffect,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  CalendarCheck2,
  Clock3,
  LoaderCircle,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConsultationFinalizationStatusBadge } from "@/features/consultations/components/consultation-finalization-status-badge"
import {
  CONSULTATION_FOLLOW_UP_DISPOSITION_LABELS,
  CONSULTATION_FOLLOW_UP_MODE_LABELS,
} from "@/features/consultations/constants/consultation-finalization.constants"
import { useConsultationFinalization } from "@/features/consultations/providers/consultation-finalization-provider"
import {
  consultationFollowUpFormSchema,
  type ConsultationFollowUpFormValues,
} from "@/features/consultations/schemas/consultation-follow-up.schema"
import {
  CONSULTATION_FOLLOW_UP_DISPOSITIONS,
  CONSULTATION_FOLLOW_UP_MODES,
  type ConsultationFinalizationRecord,
  type ConsultationFollowUpDisposition,
} from "@/features/consultations/types/consultation-finalization.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import {
  formatPatientDate,
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface ConsultationFollowUpEditorProps {
  consultation: ConsultationEncounter
  record:
    | ConsultationFinalizationRecord
    | null
}

interface ReadOnlyItemProps {
  label: string
  value: string
}

function ReadOnlyItem({
  label,
  value,
}: ReadOnlyItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 whitespace-pre-wrap text-sm">
        {value}
      </dd>
    </div>
  )
}

function getFollowUpValues(
  record:
    | ConsultationFinalizationRecord
    | null
): ConsultationFollowUpFormValues {
  return {
    followUpDisposition:
      record?.followUpDisposition ??
      "none",

    followUpDate:
      record?.followUpDate ?? "",

    followUpMode:
      record?.followUpMode ?? "",

    followUpReason:
      record?.followUpReason ?? "",

    patientInstructions:
      record?.patientInstructions ?? "",

    returnPrecautions:
      record?.returnPrecautions ?? "",

    referralFacility:
      record?.referralFacility ?? "",

    referralProvider:
      record?.referralProvider ?? "",

    referralReason:
      record?.referralReason ?? "",
  }
}

export function ConsultationFollowUpEditor({
  consultation,
  record,
}: ConsultationFollowUpEditorProps) {
  const { saveFollowUpDraft } =
    useConsultationFinalization()

  const isReadOnly =
    consultation.status === "completed" ||
    record?.status === "finalized"

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: {
      errors,
      isSubmitting,
      isDirty,
    },
  } =
    useForm<ConsultationFollowUpFormValues>(
      {
        resolver: zodResolver(
          consultationFollowUpFormSchema
        ),
        defaultValues:
          getFollowUpValues(record),
        mode: "onTouched",
      }
    )

  const disposition = useWatch({
    control,
    name: "followUpDisposition",
  })

  useEffect(() => {
    reset(getFollowUpValues(record))
  }, [record, reset])

  const dispositionRegistration =
    register("followUpDisposition")

  function handleDispositionChange(
    event:
      React.ChangeEvent<HTMLSelectElement>
  ) {
    dispositionRegistration.onChange(
      event
    )

    const nextDisposition =
      event.target
        .value as ConsultationFollowUpDisposition

    if (
      nextDisposition !== "scheduled"
    ) {
      setValue("followUpDate", "", {
        shouldDirty: true,
      })

      setValue("followUpMode", "", {
        shouldDirty: true,
      })
    }

    if (
      nextDisposition !==
      "external-referral"
    ) {
      setValue(
        "referralFacility",
        "",
        {
          shouldDirty: true,
        }
      )

      setValue(
        "referralProvider",
        "",
        {
          shouldDirty: true,
        }
      )

      setValue(
        "referralReason",
        "",
        {
          shouldDirty: true,
        }
      )
    }
  }

  async function handleSaveDraft(
    values:
      ConsultationFollowUpFormValues
  ) {
    try {
      const savedRecord =
        saveFollowUpDraft(
          consultation.id,
          values
        )

      reset(values)

      toast.success(
        "Follow-up draft saved",
        {
          description: `Version ${savedRecord.version} was saved successfully.`,
        }
      )
    } catch (error) {
      setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "The follow-up draft could not be saved.",
      })
    }
  }

  if (isReadOnly) {
    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck2
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-lg font-semibold">
                Follow-up &amp; Discharge Plan
              </h3>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Finalized patient-facing follow-up
              information.
            </p>
          </div>

          {record ? (
            <ConsultationFinalizationStatusBadge
              status={record.status}
            />
          ) : null}
        </div>

        {!record ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No finalized follow-up plan is
              available for this encounter.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Follow-up
                </CardTitle>
              </CardHeader>

              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyItem
                    label="Disposition"
                    value={
                      CONSULTATION_FOLLOW_UP_DISPOSITION_LABELS[
                        record.followUpDisposition
                      ]
                    }
                  />

                  <ReadOnlyItem
                    label="Follow-up date"
                    value={formatPatientDate(
                      record.followUpDate,
                      "Not scheduled"
                    )}
                  />

                  <ReadOnlyItem
                    label="Follow-up mode"
                    value={
                      record.followUpMode
                        ? CONSULTATION_FOLLOW_UP_MODE_LABELS[
                            record.followUpMode
                          ]
                        : "Not applicable"
                    }
                  />

                  <ReadOnlyItem
                    label="Reason"
                    value={
                      record.followUpReason ??
                      "Not recorded"
                    }
                  />
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  External referral
                </CardTitle>
              </CardHeader>

              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyItem
                    label="Facility"
                    value={
                      record.referralFacility ??
                      "Not applicable"
                    }
                  />

                  <ReadOnlyItem
                    label="Provider"
                    value={
                      record.referralProvider ??
                      "Not recorded"
                    }
                  />

                  <div className="sm:col-span-2">
                    <ReadOnlyItem
                      label="Referral reason"
                      value={
                        record.referralReason ??
                        "Not applicable"
                      }
                    />
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-none lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Patient instructions
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {record.patientInstructions ||
                    "No patient instructions were recorded."}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Return precautions
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {record.returnPrecautions ||
                    "No return precautions were recorded."}
                </p>
              </CardContent>
            </Card>
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
            <CalendarCheck2
              className="size-4 text-teal-700"
              aria-hidden="true"
            />

            <h3 className="text-lg font-semibold">
              Follow-up &amp; Discharge Plan
            </h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Record follow-up disposition,
            patient instructions, and return
            precautions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ConsultationFinalizationStatusBadge
            status={
              record?.status ?? "draft"
            }
          />

          <span className="text-xs text-muted-foreground">
            Version {record?.version ?? 0}
          </span>
        </div>
      </div>

      <form
        id="consultation-follow-up-form"
        noValidate
        className="space-y-5 rounded-xl border bg-background p-5"
        onSubmit={handleSubmit(
          handleSaveDraft
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="follow-up-disposition">
              Follow-up disposition
            </Label>

            <select
              id="follow-up-disposition"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              {...dispositionRegistration}
              onChange={
                handleDispositionChange
              }
            >
              {CONSULTATION_FOLLOW_UP_DISPOSITIONS.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {
                      CONSULTATION_FOLLOW_UP_DISPOSITION_LABELS[
                        value
                      ]
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {disposition === "scheduled" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="follow-up-date">
                  Follow-up date
                </Label>

                <Input
                  id="follow-up-date"
                  type="date"
                  aria-invalid={Boolean(
                    errors.followUpDate
                  )}
                  {...register(
                    "followUpDate"
                  )}
                />

                {errors.followUpDate
                  ?.message ? (
                  <p
                    role="alert"
                    className="text-xs font-medium text-destructive"
                  >
                    {
                      errors.followUpDate
                        .message
                    }
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow-up-mode">
                  Follow-up mode
                </Label>

                <select
                  id="follow-up-mode"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register(
                    "followUpMode"
                  )}
                >
                  <option value="">
                    Select mode
                  </option>

                  {CONSULTATION_FOLLOW_UP_MODES.map(
                    (mode) => (
                      <option
                        key={mode}
                        value={mode}
                      >
                        {
                          CONSULTATION_FOLLOW_UP_MODE_LABELS[
                            mode
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                {errors.followUpMode
                  ?.message ? (
                  <p
                    role="alert"
                    className="text-xs font-medium text-destructive"
                  >
                    {
                      errors.followUpMode
                        .message
                    }
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        {(disposition === "scheduled" ||
          disposition === "as-needed") ? (
          <div className="space-y-2">
            <Label htmlFor="follow-up-reason">
              Follow-up reason
            </Label>

            <Textarea
              id="follow-up-reason"
              rows={3}
              aria-invalid={Boolean(
                errors.followUpReason
              )}
              {...register(
                "followUpReason"
              )}
            />

            {errors.followUpReason
              ?.message ? (
              <p
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {
                  errors.followUpReason
                    .message
                }
              </p>
            ) : null}
          </div>
        ) : null}

        {disposition ===
        "external-referral" ? (
          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="referral-facility">
                Referral facility
              </Label>

              <Input
                id="referral-facility"
                aria-invalid={Boolean(
                  errors.referralFacility
                )}
                {...register(
                  "referralFacility"
                )}
              />

              {errors.referralFacility
                ?.message ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {
                    errors.referralFacility
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral-provider">
                Referral provider
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="referral-provider"
                {...register(
                  "referralProvider"
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="referral-reason">
                Referral reason
              </Label>

              <Textarea
                id="referral-reason"
                rows={3}
                aria-invalid={Boolean(
                  errors.referralReason
                )}
                {...register(
                  "referralReason"
                )}
              />

              {errors.referralReason
                ?.message ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {
                    errors.referralReason
                      .message
                  }
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 border-t pt-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="patient-instructions">
              Patient instructions
            </Label>

            <Textarea
              id="patient-instructions"
              rows={6}
              placeholder="Document instructions provided to the patient."
              aria-invalid={Boolean(
                errors.patientInstructions
              )}
              {...register(
                "patientInstructions"
              )}
            />

            {errors.patientInstructions
              ?.message ? (
              <p
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {
                  errors.patientInstructions
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="return-precautions">
              Return precautions
            </Label>

            <Textarea
              id="return-precautions"
              rows={6}
              placeholder="Document when the patient should seek reassessment or urgent care."
              aria-invalid={Boolean(
                errors.returnPrecautions
              )}
              {...register(
                "returnPrecautions"
              )}
            />

            {errors.returnPrecautions
              ?.message ? (
              <p
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {
                  errors.returnPrecautions
                    .message
                }
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <ShieldCheck
              className="mt-0.5 size-4 text-teal-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-medium">
                Draft follow-up plan
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Saving does not finalize or
                sign the encounter.
              </p>

              {record ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3
                    className="size-3"
                    aria-hidden="true"
                  />

                  Last saved{" "}
                  {formatPatientDateTime(
                    record.updatedAt
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
                Save follow-up draft
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
