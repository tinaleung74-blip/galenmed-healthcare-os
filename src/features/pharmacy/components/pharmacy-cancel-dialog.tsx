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
import type {
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"

interface PharmacyCancelDialogProps {
  prescription:
    | PharmacyPrescription
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

export function PharmacyCancelDialog({
  prescription,
  patientName,
  open,
  onOpenChange,
  onConfirmCancel,
}: PharmacyCancelDialogProps) {
  const [
    cancellationReason,
    setCancellationReason,
  ] = useState("")

  if (!prescription) {
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

  function handleCancel() {
    if (!reasonIsValid) {
      return
    }

    onConfirmCancel(
      normalizedReason
    )

    setCancellationReason("")
    onOpenChange(false)
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-rose-50 text-rose-700">
            <ShieldAlert
              aria-hidden="true"
            />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Cancel pharmacy prescription?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The prescription for{" "}
            <strong>{patientName}</strong>{" "}
            under reference{" "}
            <strong>
              {
                prescription.prescriptionNumber
              }
            </strong>{" "}
            will be marked as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="pharmacy-cancellation-reason">
            Cancellation reason
          </Label>

          <Textarea
            id="pharmacy-cancellation-reason"
            rows={4}
            value={cancellationReason}
            placeholder="Example: Prescription withdrawn before dispensing"
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
            Keep prescription
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={!reasonIsValid}
            onClick={handleCancel}
          >
            <Ban aria-hidden="true" />
            Cancel prescription
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
