"use client"

import {
  useEffect,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form"
import {
  ClipboardPlus,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LaboratoryResultFlagBadge } from "@/features/laboratory/components/laboratory-result-badges"
import {
  getLaboratoryAnalytesForTest,
} from "@/features/laboratory/constants/laboratory-result.constants"
import type {
  LaboratoryResultPanelFormValues,
} from "@/features/laboratory/schemas/laboratory-result.schema"
import {
  laboratoryResultPanelFormSchema,
} from "@/features/laboratory/schemas/laboratory-result.schema"
import type {
  LaboratoryResultSet,
} from "@/features/laboratory/types/laboratory-result.types"
import type {
  LaboratoryOrder,
  LaboratoryOrderItem,
} from "@/features/laboratory/types/laboratory.types"
import {
  calculateLaboratoryResultFlag,
  formatLaboratoryReferenceRange,
} from "@/features/laboratory/utils/laboratory-result.utils"

interface LaboratoryResultEntryDialogProps {
  order: LaboratoryOrder | null
  orderItem: LaboratoryOrderItem | null

  resultSet:
    | LaboratoryResultSet
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSaveDraft: (
    values:
      LaboratoryResultPanelFormValues
  ) => Promise<void>

  onCompleteResults: (
    values:
      LaboratoryResultPanelFormValues
  ) => Promise<void>
}

function getDefaultValues(
  orderItem:
    | LaboratoryOrderItem
    | null,

  resultSet:
    | LaboratoryResultSet
    | null
): LaboratoryResultPanelFormValues {
  const analytes = orderItem
    ? getLaboratoryAnalytesForTest(
        orderItem.testCode
      )
    : []

  return {
    performedBy:
      resultSet?.performedBy ?? "",

    entries: analytes.map(
      (analyte) => {
        const existingEntry =
          resultSet?.entries.find(
            (entry) =>
              entry.analyteCode ===
              analyte.code
          )

        return {
          analyteCode:
            analyte.code,

          valueType:
            analyte.valueType,

          numericValue:
            existingEntry
              ?.numericValue !==
              null &&
            existingEntry
              ?.numericValue !==
              undefined
              ? String(
                  existingEntry.numericValue
                )
              : "",

          textValue:
            existingEntry?.textValue ??
            "",

          comment:
            existingEntry?.comment ??
            "",
        }
      }
    ),
  }
}

export function LaboratoryResultEntryDialog({
  order,
  orderItem,
  resultSet,
  open,
  onOpenChange,
  onSaveDraft,
  onCompleteResults,
}: LaboratoryResultEntryDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<LaboratoryResultPanelFormValues>(
      {
        resolver: zodResolver(
          laboratoryResultPanelFormSchema
        ),

        defaultValues:
          getDefaultValues(
            orderItem,
            resultSet
          ),

        mode: "onTouched",
      }
    )

  const { fields } =
    useFieldArray({
      control,
      name: "entries",
    })

  const watchedEntries =
    useWatch({
      control,
      name: "entries",
    }) ?? []

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(
          orderItem,
          resultSet
        )
      )
    }
  }, [
    open,
    orderItem,
    resultSet,
    reset,
  ])

  if (!order || !orderItem) {
    return null
  }

  const analytes =
    getLaboratoryAnalytesForTest(
      orderItem.testCode
    )

  async function handleSaveDraft(
    values:
      LaboratoryResultPanelFormValues
  ) {
    try {
      await onSaveDraft(values)
      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The result draft could not be saved.",
      })
    }
  }

  async function handleComplete(
    values:
      LaboratoryResultPanelFormValues
  ) {
    try {
      await onCompleteResults(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The laboratory results could not be completed.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <ClipboardPlus
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Enter laboratory results
          </DialogTitle>

          <DialogDescription>
            {order.orderNumber}
            {" · "}
            {orderItem.testName}
          </DialogDescription>
        </DialogHeader>

        <form
          id="laboratory-result-entry-form"
          noValidate
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="laboratory-performed-by">
              Laboratory analyst
            </Label>

            <Input
              id="laboratory-performed-by"
              placeholder="Synthetic Laboratory Analyst"
              {...register(
                "performedBy"
              )}
            />

            {errors.performedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.performedBy
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            {fields.map(
              (field, index) => {
                const analyte =
                  analytes.find(
                    (
                      candidateAnalyte
                    ) =>
                      candidateAnalyte.code ===
                      field.analyteCode
                  )

                if (!analyte) {
                  return null
                }

                const watchedEntry =
                  watchedEntries[index]

                const numericValue =
                  watchedEntry
                    ?.numericValue
                    ? Number(
                        watchedEntry.numericValue
                      )
                    : null

                const textValue =
                  watchedEntry
                    ?.textValue
                    ?.trim() || null

                const flag =
                  calculateLaboratoryResultFlag(
                    analyte,
                    numericValue,
                    textValue
                  )

                const numericStep =
                  analyte.decimalPlaces ===
                  0
                    ? 1
                    : Math.pow(
                        10,
                        -analyte.decimalPlaces
                      )

                return (
                  <section
                    key={field.id}
                    className="rounded-xl border p-4"
                  >
                    <input
                      type="hidden"
                      {...register(
                        `entries.${index}.analyteCode`
                      )}
                    />

                    <input
                      type="hidden"
                      {...register(
                        `entries.${index}.valueType`
                      )}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">
                          {analyte.name}
                        </p>

                        <p className="mt-1 font-mono text-xs text-teal-700">
                          {analyte.code}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Reference:{" "}
                          {formatLaboratoryReferenceRange(
                            analyte
                          )}
                        </p>
                      </div>

                      <LaboratoryResultFlagBadge
                        flag={flag}
                      />
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          Result
                        </Label>

                        {analyte.valueType ===
                        "numeric" ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step={
                                numericStep
                              }
                              inputMode="decimal"
                              {...register(
                                `entries.${index}.numericValue`
                              )}
                            />

                            {analyte.unit ? (
                              <span className="shrink-0 text-sm text-muted-foreground">
                                {analyte.unit}
                              </span>
                            ) : null}
                          </div>
                        ) : analyte.valueType ===
                          "qualitative" ? (
                          <select
                            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                            {...register(
                              `entries.${index}.textValue`
                            )}
                          >
                            <option value="">
                              Select result
                            </option>

                            {analyte.qualitativeOptions.map(
                              (option) => (
                                <option
                                  key={option}
                                  value={option}
                                >
                                  {option}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <Input
                            placeholder="Enter descriptive result"
                            {...register(
                              `entries.${index}.textValue`
                            )}
                          />
                        )}

                        {errors.entries?.[
                          index
                        ]?.numericValue
                          ?.message ? (
                          <p className="text-xs font-medium text-destructive">
                            {
                              errors.entries[
                                index
                              ]?.numericValue
                                ?.message
                            }
                          </p>
                        ) : null}

                        {errors.entries?.[
                          index
                        ]?.textValue
                          ?.message ? (
                          <p className="text-xs font-medium text-destructive">
                            {
                              errors.entries[
                                index
                              ]?.textValue
                                ?.message
                            }
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Result comment
                          <span className="ml-1 font-normal text-muted-foreground">
                            Optional
                          </span>
                        </Label>

                        <Textarea
                          rows={3}
                          {...register(
                            `entries.${index}.comment`
                          )}
                        />
                      </div>
                    </div>
                  </section>
                )
              }
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Reference limits and result
              flags are synthetic development
              configuration. They are not
              approved for real clinical use.
            </p>
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() =>
              void handleSubmit(
                handleSaveDraft
              )()
            }
          >
            <Save aria-hidden="true" />
            Save draft
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            className="bg-violet-700 text-white hover:bg-violet-800"
            onClick={() =>
              void handleSubmit(
                handleComplete
              )()
            }
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving results
              </>
            ) : (
              <>
                <ClipboardPlus
                  aria-hidden="true"
                />
                Complete results
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
