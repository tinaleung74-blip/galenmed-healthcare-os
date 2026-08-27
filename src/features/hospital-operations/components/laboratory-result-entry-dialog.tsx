"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  Beaker,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"
import { toast } from "sonner"

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
import {
  saveLaboratoryResultDraftAction,
} from "@/features/hospital-operations/actions/laboratory-result.actions"
import {
  laboratoryResultDraftSchema,
  type LaboratoryResultDraftValues,
} from "@/features/hospital-operations/schemas/laboratory-result.schema"
import {
  LABORATORY_RESULT_FLAGS,
  type LaboratoryResultItem,
  type LaboratoryResultWorkItem,
} from "@/features/hospital-operations/types/laboratory-result.types"
import {
  createLaboratoryResultIdempotencyKey,
  createLaboratoryResultItem,
  getLaboratoryPatientFullName,
  LABORATORY_RESULT_FLAG_LABELS,
} from "@/features/hospital-operations/utils/laboratory-result.utils"

interface LaboratoryResultEntryDialogProps {
  workItem: LaboratoryResultWorkItem
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

function getInitialValues(
  workItem: LaboratoryResultWorkItem
): LaboratoryResultDraftValues {
  return {
    idempotencyKey:
      createLaboratoryResultIdempotencyKey(
        "laboratory.result.save"
      ),
    serviceRequestId:
      workItem.serviceRequestId,
    documentId:
      workItem.documentId,
    title:
      workItem.documentTitle ??
      `${workItem.serviceName} Result`,
    specimenType:
      workItem.metadata
        ?.specimenType ?? "",
    collectionReference:
      workItem.metadata
        ?.collectionReference ??
      "",
    resultItems:
      workItem.metadata
        ?.resultItems.length
        ? workItem.metadata.resultItems
        : [
            createLaboratoryResultItem(),
          ],
    interpretation:
      workItem.metadata
        ?.interpretation ?? "",
    notes:
      workItem.metadata?.notes ??
      "",
  }
}

export function LaboratoryResultEntryDialog({
  workItem,
  open,
  onOpenChange,
}: LaboratoryResultEntryDialogProps) {
  const router = useRouter()

  const [
    values,
    setValues,
  ] =
    useState<LaboratoryResultDraftValues>(
      () =>
        getInitialValues(
          workItem
        )
    )

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  function updateValue<
    Key extends keyof LaboratoryResultDraftValues,
  >(
    key: Key,
    value:
      LaboratoryResultDraftValues[Key]
  ) {
    setValues(
      (currentValues) => ({
        ...currentValues,
        [key]: value,
      })
    )
  }

  function updateResultItem<
    Key extends keyof LaboratoryResultItem,
  >(
    itemId: string,
    key: Key,
    value:
      LaboratoryResultItem[Key]
  ) {
    updateValue(
      "resultItems",
      values.resultItems.map(
        (item) =>
          item.id === itemId
            ? {
                ...item,
                [key]: value,
              }
            : item
      )
    )
  }

  function addResultItem() {
    updateValue(
      "resultItems",
      [
        ...values.resultItems,
        createLaboratoryResultItem(),
      ]
    )
  }

  function removeResultItem(
    itemId: string
  ) {
    if (
      values.resultItems.length ===
      1
    ) {
      return
    }

    updateValue(
      "resultItems",
      values.resultItems.filter(
        (item) =>
          item.id !== itemId
      )
    )
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)

    const parsedValues =
      laboratoryResultDraftSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
        "The Laboratory result draft is invalid."
      )
      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await saveLaboratoryResultDraftAction(
            parsedValues.data
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        toast.success(
          result.message,
          {
            description:
              result.data
                ?.documentNumber,
          }
        )

        onOpenChange(false)
        router.refresh()
      })()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Beaker
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            {workItem.documentId
              ? "Edit Laboratory result draft"
              : "Enter Laboratory result"}
          </DialogTitle>

          <DialogDescription>
            {getLaboratoryPatientFullName(
              workItem
            )}
            {" · "}
            {
              workItem.patient
                .medicalRecordNumber
            }
            {" · "}
            {workItem.serviceName}
          </DialogDescription>
        </DialogHeader>

        <form
          id="laboratory-result-entry-form"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="laboratory-result-title">
                Result title
              </Label>

              <Input
                id="laboratory-result-title"
                value={values.title}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "title",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="laboratory-specimen-type">
                Specimen type
              </Label>

              <Input
                id="laboratory-specimen-type"
                value={
                  values.specimenType
                }
                disabled={isPending}
                placeholder="Example: Whole blood"
                onChange={(event) =>
                  updateValue(
                    "specimenType",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="laboratory-collection-reference">
                Collection reference
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="laboratory-collection-reference"
                value={
                  values.collectionReference
                }
                disabled={isPending}
                placeholder="Specimen or accession reference"
                onChange={(event) =>
                  updateValue(
                    "collectionReference",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Result items
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the verified measurement text exactly as produced by the Laboratory workflow.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={addResultItem}
              >
                <Plus
                  aria-hidden="true"
                />
                Add result item
              </Button>
            </div>

            <div className="space-y-4">
              {values.resultItems.map(
                (
                  item,
                  index
                ) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border bg-slate-50/60 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Result item {index + 1}
                      </p>

                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={
                          isPending ||
                          values.resultItems
                            .length === 1
                        }
                        aria-label={`Remove result item ${index + 1}`}
                        onClick={() =>
                          removeResultItem(
                            item.id
                          )
                        }
                      >
                        <Trash2
                          aria-hidden="true"
                        />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="space-y-2">
                        <Label>
                          Test name
                        </Label>

                        <Input
                          value={
                            item.testName
                          }
                          disabled={isPending}
                          onChange={(event) =>
                            updateResultItem(
                              item.id,
                              "testName",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Result value
                        </Label>

                        <Input
                          value={
                            item.resultValue
                          }
                          disabled={isPending}
                          onChange={(event) =>
                            updateResultItem(
                              item.id,
                              "resultValue",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Unit
                        </Label>

                        <Input
                          value={item.unit}
                          disabled={isPending}
                          placeholder="Optional"
                          onChange={(event) =>
                            updateResultItem(
                              item.id,
                              "unit",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Reference range
                        </Label>

                        <Input
                          value={
                            item.referenceRange
                          }
                          disabled={isPending}
                          placeholder="Optional"
                          onChange={(event) =>
                            updateResultItem(
                              item.id,
                              "referenceRange",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Flag
                        </Label>

                        <select
                          value={item.flag}
                          disabled={isPending}
                          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                          onChange={(event) =>
                            updateResultItem(
                              item.id,
                              "flag",
                              event.target.value as LaboratoryResultItem["flag"]
                            )
                          }
                        >
                          {LABORATORY_RESULT_FLAGS.map(
                            (flag) => (
                              <option
                                key={flag}
                                value={flag}
                              >
                                {
                                  LABORATORY_RESULT_FLAG_LABELS[
                                    flag
                                  ]
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Remarks
                        </Label>

                        <Input
                          value={
                            item.remarks
                          }
                          disabled={isPending}
                          placeholder="Optional"
                          onChange={(event) =>
                            updateResultItem(
                              item.id,
                              "remarks",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="laboratory-result-interpretation">
                Interpretation
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="laboratory-result-interpretation"
                rows={4}
                value={
                  values.interpretation
                }
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "interpretation",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="laboratory-result-notes">
                Internal notes
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="laboratory-result-notes"
                rows={4}
                value={values.notes}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "notes",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          {workItem.metadata
            ?.correctionReason ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">
                Returned for correction
              </p>

              <p className="mt-1">
                {
                  workItem.metadata
                    .correctionReason
                }
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {errorMessage}
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="laboratory-result-entry-form"
            disabled={isPending}
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving result
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save result draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
