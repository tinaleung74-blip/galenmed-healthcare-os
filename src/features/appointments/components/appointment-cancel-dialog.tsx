"use client"

import { useState } from "react"
import {
  Ban,
  ShieldAlert,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AppointmentRecord } from "@/features/appointments/types/appointment.types"

interface AppointmentCancelDialogProps {
  appointment:
    | AppointmentRecord
    | null

  patientName: string

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onConfirmCancel: (
    cancellationReason: string
  ) => void
}

export function AppointmentCancelDialog({
  appointment,
  patientName,
  open,
  onOpenChange,
  onConfirmCancel,
}: AppointmentCancelDialogProps) {
  const [
    cancellationReason,
    setCancellationReason,
  ] = useState("")

  if (!appointment) {
    return null
  }

  const normalizedReason =
    cancellationReason.trim()

  const reasonIsValid =
    normalizedReason.length >= 5

  function handleOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen) {
      setCancellationReason("")
    }

    onOpenChange(nextOpen)
  }

  function handleConfirmCancel() {
    if (!reasonIsValid) {
      return
    }

    onConfirmCancel(
      normalizedReason
    )

    setCancellationReason("")
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-rose-50 text-rose-700">
            <ShieldAlert
              aria-hidden="true"
            />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Cancel appointment?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The appointment for{" "}
            <strong>{patientName}</strong>{" "}
            under reference{" "}
            <strong>
              {
                appointment.appointmentNumber
              }
            </strong>{" "}
            will be marked as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="appointment-cancellation-reason">
            Cancellation reason
          </Label>

          <Textarea
            id="appointment-cancellation-reason"
            rows={4}
            value={cancellationReason}
            placeholder="Example: Patient requested rescheduling"
            aria-invalid={
              cancellationReason.length >
                0 &&
              !reasonIsValid
            }
            onChange={(event) =>
              setCancellationReason(
                event.target.value
              )
            }
          />

          <p className="text-xs text-muted-foreground">
            Enter at least five characters.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Keep appointment
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={!reasonIsValid}
            onClick={
              handleConfirmCancel
            }
          >
            <Ban aria-hidden="true" />
            Cancel appointment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
