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
  setStaffAccountStatusAction,
} from "@/features/staff/actions/staff-management.actions"
import {
  setStaffAccountStatusSchema,
} from "@/features/staff/schemas/staff-management.schema"
import type {
  ManageableStaffAccountStatus,
  StaffManagementRecord,
} from "@/features/staff/types/staff-management.types"

interface StaffAccountStatusDialogProps {
  staff:
    | StaffManagementRecord
    | null
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

const statusLabels: Record<
  ManageableStaffAccountStatus,
  string
> = {
  active: "Active",
  locked: "Locked",
  suspended: "Suspended",
  archived: "Archived",
}

function getInitialStatus(
  staff:
    | StaffManagementRecord
    | null
): ManageableStaffAccountStatus {
  if (
    !staff ||
    staff.accountStatus ===
      "invited"
  ) {
    return "active"
  }

  return staff.accountStatus
}

export function StaffAccountStatusDialog({
  staff,
  open,
  onOpenChange,
}: StaffAccountStatusDialogProps) {
  const router = useRouter()

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const [
    status,
    setStatus,
  ] = useState<
    ManageableStaffAccountStatus
  >(() =>
    getInitialStatus(staff)
  )

  const [reason, setReason] =
    useState("")

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  )

  if (!staff) {
    return null
  }

  const selectedStaff = staff

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)

    const parsedValues =
      setStaffAccountStatusSchema.safeParse({
        staffId: selectedStaff.id,
        status,
        reason,
      })

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          "The account status request is invalid."
      )

      return
    }

    startTransition(async () => {
      const result =
        await setStaffAccountStatusAction(
          parsedValues.data
        )

      if (!result.success) {
        setErrorMessage(
          result.message
        )

        return
      }

      toast.success(
        "Staff account status updated"
      )

      onOpenChange(false)
      router.refresh()
    })
  }

  const cannotReactivateArchived =
    selectedStaff.accountStatus ===
      "archived" &&
    status === "active"

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Change staff account status
          </DialogTitle>

          <DialogDescription>
            {selectedStaff.fullName}
            {" · "}
            {selectedStaff.employeeId ??
              "Employee ID pending"}
          </DialogDescription>
        </DialogHeader>

        <form
          id="staff-account-status-form"
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="staff-account-status">
              New account status
            </Label>

            <select
              id="staff-account-status"
              value={status}
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    ManageableStaffAccountStatus
                )
              }
            >
              {(
                [
                  "active",
                  "locked",
                  "suspended",
                  "archived",
                ] as const
              ).map((statusOption) => (
                <option
                  key={statusOption}
                  value={statusOption}
                >
                  {statusLabels[statusOption]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-status-reason">
              Reason
            </Label>

            <Textarea
              id="staff-status-reason"
              rows={4}
              value={reason}
              disabled={isPending}
              placeholder="Document why this account status is being changed."
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
            />
          </div>

          {cannotReactivateArchived ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              <ShieldAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                Archived accounts cannot be
                reactivated from this control.
                Reprovision the account with role,
                branch, and department assignments.
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
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
            form="staff-account-status-form"
            disabled={
              isPending ||
              cannotReactivateArchived
            }
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving status
              </>
            ) : (
              "Save status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
