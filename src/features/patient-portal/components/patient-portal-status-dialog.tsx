"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  LoaderCircle,
  ShieldAlert,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"
import {
  toast,
} from "sonner"

import {
  Button,
} from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Label,
} from "@/components/ui/label"
import {
  Textarea,
} from "@/components/ui/textarea"
import {
  setPatientPortalAccountStatusAction,
} from "@/features/patient-portal/actions/patient-portal-management.actions"
import {
  setPatientPortalAccountStatusSchema,
} from "@/features/patient-portal/schemas/patient-portal.schema"
import type {
  PatientPortalPatientRecord,
  SetPatientPortalAccountStatusValues,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  getPatientPortalFullName,
} from "@/features/patient-portal/utils/patient-portal.utils"

interface PatientPortalStatusDialogProps {
  patient:
    PatientPortalPatientRecord
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

export function PatientPortalStatusDialog({
  patient,
  open,
  onOpenChange,
}: PatientPortalStatusDialogProps) {
  const router =
    useRouter()

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const account =
    patient.portalAccount

  const [
    values,
    setValues,
  ] = useState<
    SetPatientPortalAccountStatusValues
  >({
    accountId:
      account?.id ?? "",
    status:
      account?.status ===
        "active"
        ? "locked"
        : "active",
    reason:
      "Patient Portal account status updated after authorized staff review.",
  })

  if (!account) {
    return null
  }

  const patientName =
    getPatientPortalFullName(
      patient
    )

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const parsedValues =
      setPatientPortalAccountStatusSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      toast.error(
        parsedValues.error.issues[0]
          ?.message ??
        "The status request is invalid."
      )

      return
    }

    startTransition(
      async () => {
        const result =
          await setPatientPortalAccountStatusAction(
            parsedValues.data
          )

        if (!result.success) {
          toast.error(
            result.message
          )

          return
        }

        toast.success(
          result.message
        )

        onOpenChange(
          false
        )

        router.refresh()
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Change Patient Portal Status
          </DialogTitle>

          <DialogDescription>
            Apply a controlled access
            restriction or reactivate the
            patient login.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={
            handleSubmit
          }
        >
          <div className="rounded-2xl border bg-slate-50 p-4 text-sm">
            <p className="font-semibold">
              {patientName}
            </p>

            <p className="mt-1 font-mono text-xs text-slate-600">
              {
                patient.medicalRecordNumber
              }
            </p>

            <p className="mt-2 break-all text-xs text-slate-500">
              {account.loginEmail}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="patient-portal-next-status"
            >
              New account status
            </Label>

            <select
              id="patient-portal-next-status"
              value={
                values.status
              }
              disabled={
                isPending ||
                account.status ===
                  "archived"
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              onChange={(
                event
              ) =>
                setValues(
                  (
                    currentValues
                  ) => ({
                    ...currentValues,
                    status:
                      event.target
                        .value as
                        SetPatientPortalAccountStatusValues[
                          "status"
                        ],
                  })
                )
              }
            >
              <option value="active">
                Active
              </option>
              <option value="locked">
                Locked
              </option>
              <option value="suspended">
                Suspended
              </option>
              <option value="archived">
                Archived
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="patient-portal-status-reason"
            >
              Reason
            </Label>

            <Textarea
              id="patient-portal-status-reason"
              rows={4}
              value={
                values.reason
              }
              disabled={
                isPending
              }
              onChange={(
                event
              ) =>
                setValues(
                  (
                    currentValues
                  ) => ({
                    ...currentValues,
                    reason:
                      event.target
                        .value,
                  })
                )
              }
            />
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert
                className="mt-0.5 size-4 shrink-0 text-rose-700"
                aria-hidden="true"
              />

              <p className="text-xs leading-5 text-rose-900">
                Archived accounts cannot be
                reactivated. Use Archive only
                for a final access shutdown.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={
                isPending
              }
              onClick={() =>
                onOpenChange(
                  false
                )
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                isPending ||
                account.status ===
                  "archived"
              }
            >
              {isPending ? (
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  aria-hidden="true"
                />
              )}

              Save status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
