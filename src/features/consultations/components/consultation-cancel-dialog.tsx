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
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"

interface ConsultationCancelDialogProps {
  consultation: ConsultationEncounter | null
  patientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmCancel: (
    cancellationReason: string
  ) => void
}

export function ConsultationCancelDialog({
  consultation,
  patientName,
  open,
  onOpenChange,
  onConfirmCancel,
}: ConsultationCancelDialogProps) {
  const [
    cancellationReason,
    setCancellationReason,
  ] = useState("")

  if (!consultation) {
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

    onConfirmCancel(normalizedReason)
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
            <ShieldAlert aria-hidden="true" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Cancel consultation?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The consultation for{" "}
            <strong>{patientName}</strong>{" "}
            under reference{" "}
            <strong>
              {consultation.consultationNumber}
            </strong>{" "}
            will be marked as cancelled and retained for
            operational history.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="consultation-cancellation-reason">
            Cancellation reason
          </Label>

          <Textarea
            id="consultation-cancellation-reason"
            rows={4}
            value={cancellationReason}
            placeholder="Example: Patient requested rescheduling"
            aria-invalid={
              cancellationReason.length > 0 &&
              !reasonIsValid
            }
            aria-describedby="consultation-cancellation-reason-help"
            onChange={(event) =>
              setCancellationReason(
                event.target.value
              )
            }
          />

          <p
            id="consultation-cancellation-reason-help"
            className="text-xs text-muted-foreground"
          >
            Enter at least five characters. The reason
            will remain attached to the consultation
            record.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Keep consultation
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={!reasonIsValid}
            onClick={handleConfirmCancel}
          >
            <Ban aria-hidden="true" />
            Cancel consultation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
