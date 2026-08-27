"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  LoaderCircle,
  Save,
  UserPlus,
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
  registerReceptionPatientAction,
} from "@/features/hospital-operations/actions/reception-intake.actions"
import {
  receptionPatientFormSchema,
  type ReceptionPatientFormValues,
} from "@/features/hospital-operations/schemas/reception-intake.schema"
import type {
  ReceptionBranch,
} from "@/features/hospital-operations/types/reception-intake.types"
import {
  createReceptionIdempotencyKey,
} from "@/features/hospital-operations/utils/reception-intake.utils"

interface ReceptionRegisterPatientDialogProps {
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
  branches:
    readonly ReceptionBranch[]
}

function getInitialValues(
  branches:
    readonly ReceptionBranch[]
): ReceptionPatientFormValues {
  const defaultBranch =
    branches.find(
      (branch) =>
        branch.isPrimary
    ) ?? branches[0] ?? null

  return {
    idempotencyKey:
      createReceptionIdempotencyKey(
        "reception.patient"
      ),
    branchId:
      defaultBranch?.id ?? "",
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    biologicalSex: "unknown",
    mobileNumber: "",
    emailAddress: "",
    address: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    consentAcknowledged: false,
  }
}

export function ReceptionRegisterPatientDialog({
  open,
  onOpenChange,
  branches,
}: ReceptionRegisterPatientDialogProps) {
  const router = useRouter()

  const [
    values,
    setValues,
  ] = useState<ReceptionPatientFormValues>(
    () => getInitialValues(branches)
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
    Key extends keyof ReceptionPatientFormValues,
  >(
    key: Key,
    value:
      ReceptionPatientFormValues[Key]
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
      receptionPatientFormSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          "The patient registration details are invalid."
      )
      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await registerReceptionPatientAction(
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
            description:
              result.data
                .medicalRecordNumber,
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <UserPlus
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Register hospital patient
          </DialogTitle>

          <DialogDescription>
            Create the canonical GalenMed
            hospital patient record before
            opening a visit and routing a
            service request.
          </DialogDescription>
        </DialogHeader>

        <form
          id="reception-patient-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reception-patient-branch">
                Registration branch
              </Label>

              <select
                id="reception-patient-branch"
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
                <option value="">
                  Select branch
                </option>

                {branches.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                      {branch.isPrimary
                        ? " — Primary"
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-first-name">
                First name
              </Label>

              <Input
                id="reception-first-name"
                value={values.firstName}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "firstName",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-middle-name">
                Middle name
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="reception-middle-name"
                value={values.middleName}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "middleName",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-last-name">
                Last name
              </Label>

              <Input
                id="reception-last-name"
                value={values.lastName}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "lastName",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-date-of-birth">
                Date of birth
              </Label>

              <Input
                id="reception-date-of-birth"
                type="date"
                value={values.dateOfBirth}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "dateOfBirth",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-biological-sex">
                Biological sex
              </Label>

              <select
                id="reception-biological-sex"
                value={values.biologicalSex}
                disabled={isPending}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) =>
                  updateValue(
                    "biologicalSex",
                    event.target.value as
                      ReceptionPatientFormValues["biologicalSex"]
                  )
                }
              >
                <option value="unknown">
                  Not specified
                </option>
                <option value="male">
                  Male
                </option>
                <option value="female">
                  Female
                </option>
                <option value="intersex">
                  Intersex
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-mobile-number">
                Mobile number
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="reception-mobile-number"
                inputMode="tel"
                value={values.mobileNumber}
                disabled={isPending}
                placeholder="09171234567"
                onChange={(event) =>
                  updateValue(
                    "mobileNumber",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reception-email-address">
                Email address
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="reception-email-address"
                type="email"
                value={values.emailAddress}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "emailAddress",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reception-address">
                Complete address
              </Label>

              <Textarea
                id="reception-address"
                rows={3}
                value={values.address}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "address",
                    event.target.value
                  )
                }
              />
            </div>
          </section>

          <section className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reception-emergency-name">
                Emergency contact name
              </Label>

              <Input
                id="reception-emergency-name"
                value={values.emergencyContactName}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "emergencyContactName",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-emergency-number">
                Emergency contact number
              </Label>

              <Input
                id="reception-emergency-number"
                inputMode="tel"
                value={values.emergencyContactNumber}
                disabled={isPending}
                placeholder="09171234567"
                onChange={(event) =>
                  updateValue(
                    "emergencyContactNumber",
                    event.target.value
                  )
                }
              />
            </div>
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <input
              type="checkbox"
              checked={values.consentAcknowledged}
              disabled={isPending}
              className="mt-1 size-4 accent-teal-700"
              onChange={(event) =>
                updateValue(
                  "consentAcknowledged",
                  event.target.checked
                )
              }
            />

            <span className="text-sm leading-6 text-teal-900">
              Patient or authorized
              representative consent was
              acknowledged for hospital
              registration and operational
              processing.
            </span>
          </label>

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
            form="reception-patient-form"
            disabled={isPending}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Registering patient
              </>
            ) : (
              <>
                <Save aria-hidden="true" />
                Register patient
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
