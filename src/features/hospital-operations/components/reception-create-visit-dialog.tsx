"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  ClipboardPlus,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createReceptionVisitAction,
} from "@/features/hospital-operations/actions/reception-intake.actions"
import {
  receptionVisitFormSchema,
  type ReceptionVisitFormValues,
} from "@/features/hospital-operations/schemas/reception-intake.schema"
import {
  HOSPITAL_SERVICE_TYPES,
} from "@/features/hospital-operations/types/service-catalog.types"
import {
  RECEPTION_ARRIVAL_MODES,
  type ReceptionBranch,
  type ReceptionPatientRecord,
} from "@/features/hospital-operations/types/reception-intake.types"
import {
  createReceptionIdempotencyKey,
  getReceptionPatientFullName,
  RECEPTION_ARRIVAL_MODE_LABELS,
  RECEPTION_SERVICE_TYPE_LABELS,
} from "@/features/hospital-operations/utils/reception-intake.utils"

interface ReceptionCreateVisitDialogProps {
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
  patient:
    ReceptionPatientRecord
  branches:
    readonly ReceptionBranch[]
}

function getInitialValues({
  patient,
}: {
  patient:
    ReceptionPatientRecord
}): ReceptionVisitFormValues {
  return {
    idempotencyKey:
      createReceptionIdempotencyKey(
        "reception.visit"
      ),
    patientId: patient.id,
    branchId: patient.branchId,
    arrivalMode: "walk_in",
    initialServiceType:
      "consultation",
    chiefConcern: "",
  }
}

export function ReceptionCreateVisitDialog({
  open,
  onOpenChange,
  patient,
  branches,
}: ReceptionCreateVisitDialogProps) {
  const router = useRouter()

  const [
    values,
    setValues,
  ] = useState<ReceptionVisitFormValues>(
    () => getInitialValues({ patient })
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
    Key extends keyof ReceptionVisitFormValues,
  >(
    key: Key,
    value:
      ReceptionVisitFormValues[Key]
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
      receptionVisitFormSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          "The hospital visit details are invalid."
      )
      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await createReceptionVisitAction(
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
            description: `${result.data.visitNumber} · ${result.data.billingNumber}`,
          }
        )

        onOpenChange(false)
        router.refresh()
      })()
    })
  }

  const availableBranches =
    branches.filter(
      (branch) =>
        branch.id ===
          patient.branchId ||
        branch.id ===
          values.branchId
    )

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <ClipboardPlus
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Create hospital visit
          </DialogTitle>

          <DialogDescription>
            {getReceptionPatientFullName(
              patient
            )}
            {" · "}
            {patient.medicalRecordNumber}
          </DialogDescription>
        </DialogHeader>

        <form
          id="reception-visit-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reception-visit-branch">
                Hospital branch
              </Label>

              <select
                id="reception-visit-branch"
                value={values.branchId}
                disabled={isPending}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) =>
                  updateValue(
                    "branchId",
                    event.target.value
                  )
                }
              >
                {availableBranches.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-arrival-mode">
                Arrival mode
              </Label>

              <select
                id="reception-arrival-mode"
                value={values.arrivalMode}
                disabled={isPending}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) =>
                  updateValue(
                    "arrivalMode",
                    event.target.value as
                      ReceptionVisitFormValues["arrivalMode"]
                  )
                }
              >
                {RECEPTION_ARRIVAL_MODES.map(
                  (arrivalMode) => (
                    <option
                      key={arrivalMode}
                      value={arrivalMode}
                    >
                      {
                        RECEPTION_ARRIVAL_MODE_LABELS[
                          arrivalMode
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-initial-service">
                Initial service type
              </Label>

              <select
                id="reception-initial-service"
                value={
                  values.initialServiceType
                }
                disabled={isPending}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) =>
                  updateValue(
                    "initialServiceType",
                    event.target.value as
                      ReceptionVisitFormValues["initialServiceType"]
                  )
                }
              >
                {HOSPITAL_SERVICE_TYPES.map(
                  (serviceType) => (
                    <option
                      key={serviceType}
                      value={serviceType}
                    >
                      {
                        RECEPTION_SERVICE_TYPE_LABELS[
                          serviceType
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reception-chief-concern">
                Chief concern or visit note
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="reception-chief-concern"
                rows={4}
                value={values.chiefConcern}
                disabled={isPending}
                placeholder="Reason for visit or initial concern"
                onChange={(event) =>
                  updateValue(
                    "chiefConcern",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
            A consolidated billing account
            will be opened automatically for
            this visit. No charge is created
            until a service request is added.
          </div>

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
            form="reception-visit-form"
            disabled={isPending}
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Creating visit
              </>
            ) : (
              <>
                <Save aria-hidden="true" />
                Create visit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
