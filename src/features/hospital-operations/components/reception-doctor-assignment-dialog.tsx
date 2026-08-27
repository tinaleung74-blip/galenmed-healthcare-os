"use client"

import {
  useMemo,
  useState,
  useTransition,
} from "react"
import {
  LoaderCircle,
  Save,
  Stethoscope,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  assignConsultationDoctorAction,
} from "@/features/hospital-operations/actions/doctor-consultation.actions"
import type {
  DoctorAssignmentOption,
  ReceptionDoctorAssignmentRequest,
} from "@/features/hospital-operations/types/doctor-consultation.types"
import {
  createDoctorIdempotencyKey,
} from "@/features/hospital-operations/utils/doctor-consultation.utils"

interface ReceptionDoctorAssignmentDialogProps {
  request:
    ReceptionDoctorAssignmentRequest
  doctors: DoctorAssignmentOption[]
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

export function ReceptionDoctorAssignmentDialog({
  request,
  doctors,
  open,
  onOpenChange,
}: ReceptionDoctorAssignmentDialogProps) {
  const availableDoctors =
    useMemo(
      () =>
        doctors.filter(
          (doctor) =>
            doctor.branches.some(
              (branch) =>
                branch.id ===
                request.branchId
            )
        ),
      [
        doctors,
        request.branchId,
      ]
    )

  const [
    doctorId,
    setDoctorId,
  ] = useState(
    () =>
      request.assignedDoctorId ??
      availableDoctors[0]?.id ??
      ""
  )

  const [reason, setReason] =
    useState(
      () =>
        request.assignedDoctorId
          ? "Doctor reassignment requested by Reception."
          : "Doctor assigned by Reception."
    )

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  function submitAssignment() {
    setErrorMessage(null)

    startTransition(
      async () => {
        const result =
          await assignConsultationDoctorAction(
            {
              idempotencyKey:
                createDoctorIdempotencyKey(
                  "doctor-assign"
                ),
              serviceRequestId:
                request.serviceRequestId,
              doctorId,
              reason,
            }
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        onOpenChange(false)
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Stethoscope
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Assign consultation Doctor
          </DialogTitle>

          <DialogDescription>
            {request.patientName}
            {" · "}
            {request.medicalRecordNumber}
            {" · "}
            {request.requestNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {availableDoctors.length ===
          0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              No active Doctor is assigned to
              this branch and Medical Services
              department.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="doctor-assignment-select">
                Assigned Doctor
              </Label>

              <select
                id="doctor-assignment-select"
                value={doctorId}
                disabled={isPending}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) =>
                  setDoctorId(
                    event.target.value
                  )
                }
              >
                {availableDoctors.map(
                  (doctor) => (
                    <option
                      key={doctor.id}
                      value={doctor.id}
                    >
                      {doctor.fullName}
                      {doctor.employeeId
                        ? ` — ${doctor.employeeId}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="doctor-assignment-reason">
              Assignment reason
            </Label>

            <Textarea
              id="doctor-assignment-reason"
              rows={4}
              value={reason}
              disabled={isPending}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
            />
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {errorMessage}
            </div>
          ) : null}
        </div>

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
            type="button"
            disabled={
              isPending ||
              !doctorId ||
              !reason.trim()
            }
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={
              submitAssignment
            }
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Assigning
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save assignment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
