"use client"

import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  ClipboardList,
  LoaderCircle,
  Save,
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
  createReceptionServiceRequestAction,
} from "@/features/hospital-operations/actions/reception-intake.actions"
import {
  receptionServiceRequestFormSchema,
  type ReceptionServiceRequestFormValues,
} from "@/features/hospital-operations/schemas/reception-intake.schema"
import {
  RECEPTION_SERVICE_PRIORITIES,
  type ReceptionPatientRecord,
  type ReceptionServiceCatalogItem,
  type ReceptionVisitRecord,
} from "@/features/hospital-operations/types/reception-intake.types"
import {
  createReceptionIdempotencyKey,
  formatReceptionAmount,
  getReceptionPatientFullName,
  RECEPTION_PRIORITY_LABELS,
  RECEPTION_SERVICE_TYPE_LABELS,
} from "@/features/hospital-operations/utils/reception-intake.utils"

interface ReceptionCreateServiceRequestDialogProps {
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
  patient:
    ReceptionPatientRecord
  visit:
    ReceptionVisitRecord
  catalogItems:
    readonly ReceptionServiceCatalogItem[]
}

function getInitialValues(
  visit:
    ReceptionVisitRecord,
  catalogItems:
    readonly ReceptionServiceCatalogItem[]
): ReceptionServiceRequestFormValues {
  const firstService =
    catalogItems.find(
      (item) =>
        item.branchId === null ||
        item.branchId ===
          visit.branchId
    ) ?? null

  return {
    idempotencyKey:
      createReceptionIdempotencyKey(
        "reception.service"
      ),
    visitId: visit.id,
    serviceCatalogItemId:
      firstService?.id ?? "",
    priority: "routine",
    doctorOrderReference: "",
    requestNotes: "",
    createQueue: true,
  }
}

export function ReceptionCreateServiceRequestDialog({
  open,
  onOpenChange,
  patient,
  visit,
  catalogItems,
}: ReceptionCreateServiceRequestDialogProps) {
  const router = useRouter()

  const availableCatalogItems =
    useMemo(
      () =>
        catalogItems.filter(
          (item) =>
            item.branchId === null ||
            item.branchId ===
              visit.branchId
        ),
      [
        catalogItems,
        visit.branchId,
      ]
    )

  const [
    values,
    setValues,
  ] =
    useState<ReceptionServiceRequestFormValues>(
      () =>
        getInitialValues(
          visit,
          availableCatalogItems
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

  const selectedService =
    availableCatalogItems.find(
      (item) =>
        item.id ===
        values.serviceCatalogItemId
    ) ?? null

  function updateValue<
    Key extends keyof ReceptionServiceRequestFormValues,
  >(
    key: Key,
    value:
      ReceptionServiceRequestFormValues[Key]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }))
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)

    const parsedValues =
      receptionServiceRequestFormSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          "The hospital service request details are invalid."
      )
      return
    }

    if (
      selectedService
        ?.doctorOrderRequired &&
      !parsedValues.data
        .doctorOrderReference
    ) {
      setErrorMessage(
        "A doctor-order reference is required for the selected service."
      )
      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await createReceptionServiceRequestAction(
            parsedValues.data
          )

        if (
          !result.success ||
          !result.data
        ) {
          setErrorMessage(
            result.message
          )
          return
        }

        toast.success(
          result.message,
          {
            description: [
              result.data.requestNumber,
              result.data.queueNumber,
              formatReceptionAmount(
                result.data
                  .requiredAmountCentavos
              ),
            ]
              .filter(Boolean)
              .join(" · "),
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ClipboardList
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Add hospital service request
          </DialogTitle>

          <DialogDescription>
            {getReceptionPatientFullName(
              patient
            )}
            {" · "}
            {visit.visitNumber}
          </DialogDescription>
        </DialogHeader>

        <form
          id="reception-service-request-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          {availableCatalogItems.length ===
          0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              No active hospital service is
              available for this branch.
              Ask the System Administrator to
              configure the Service Catalog.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="reception-service-item">
                  Hospital service
                </Label>

                <select
                  id="reception-service-item"
                  value={
                    values.serviceCatalogItemId
                  }
                  disabled={isPending}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  onChange={(event) =>
                    updateValue(
                      "serviceCatalogItemId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select service
                  </option>

                  {availableCatalogItems.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.code}
                        {" — "}
                        {item.name}
                        {" — "}
                        {formatReceptionAmount(
                          item.defaultPriceCentavos
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              {selectedService ? (
                <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Service type
                    </p>
                    <p className="mt-1 font-medium">
                      {
                        RECEPTION_SERVICE_TYPE_LABELS[
                          selectedService
                            .serviceType
                        ]
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Department
                    </p>
                    <p className="mt-1 font-medium">
                      {
                        selectedService
                          .departmentName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Default charge
                    </p>
                    <p className="mt-1 font-semibold text-emerald-700">
                      {formatReceptionAmount(
                        selectedService
                          .defaultPriceCentavos
                      )}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reception-service-priority">
                    Priority
                  </Label>

                  <select
                    id="reception-service-priority"
                    value={values.priority}
                    disabled={isPending}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    onChange={(event) =>
                      updateValue(
                        "priority",
                        event.target.value as
                          ReceptionServiceRequestFormValues["priority"]
                      )
                    }
                  >
                    {RECEPTION_SERVICE_PRIORITIES.map(
                      (priority) => (
                        <option
                          key={priority}
                          value={priority}
                        >
                          {
                            RECEPTION_PRIORITY_LABELS[
                              priority
                            ]
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reception-doctor-order">
                    Doctor-order reference
                    {selectedService
                      ?.doctorOrderRequired ? (
                      <span className="ml-1 text-rose-700">
                        Required
                      </span>
                    ) : (
                      <span className="ml-1 font-normal text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </Label>

                  <Input
                    id="reception-doctor-order"
                    value={
                      values.doctorOrderReference
                    }
                    disabled={isPending}
                    placeholder="Order or prescription reference"
                    onChange={(event) =>
                      updateValue(
                        "doctorOrderReference",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="reception-request-notes">
                    Request notes
                    <span className="ml-1 font-normal text-muted-foreground">
                      Optional
                    </span>
                  </Label>

                  <Textarea
                    id="reception-request-notes"
                    rows={4}
                    value={values.requestNotes}
                    disabled={isPending}
                    onChange={(event) =>
                      updateValue(
                        "requestNotes",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
                <input
                  type="checkbox"
                  checked={values.createQueue}
                  disabled={isPending}
                  className="mt-1 size-4 accent-teal-700"
                  onChange={(event) =>
                    updateValue(
                      "createQueue",
                      event.target.checked
                    )
                  }
                />

                <span className="text-sm leading-6 text-teal-900">
                  Create a department queue
                  entry immediately. The service
                  charge and payment clearance
                  will be created automatically.
                </span>
              </label>
            </>
          )}

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
            form="reception-service-request-form"
            disabled={
              isPending ||
              availableCatalogItems.length ===
                0
            }
            className="bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Creating request
              </>
            ) : (
              <>
                <Save aria-hidden="true" />
                Create service request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
