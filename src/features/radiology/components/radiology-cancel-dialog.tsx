"use client"

import {
  useState,
} from "react"
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
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"

interface RadiologyCancelDialogProps {
  order:
    | RadiologyOrder
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

export function RadiologyCancelDialog({
  order,
  patientName,
  open,
  onOpenChange,
  onConfirmCancel,
}: RadiologyCancelDialogProps) {
  const [
    cancellationReason,
    setCancellationReason,
  ] = useState("")

  if (!order) {
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
            Cancel radiology order?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The radiology order for{" "}
            <strong>{patientName}</strong>{" "}
            under reference{" "}
            <strong>
              {order.orderNumber}
            </strong>{" "}
            will be marked as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="radiology-cancellation-reason">
            Cancellation reason
          </Label>

          <Textarea
            id="radiology-cancellation-reason"
            rows={4}
            value={cancellationReason}
            placeholder="Example: Imaging request withdrawn by the ordering clinician"
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
            Keep order
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
            Cancel radiology order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
