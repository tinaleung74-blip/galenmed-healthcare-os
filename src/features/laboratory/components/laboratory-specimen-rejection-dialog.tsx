"use client"

import { useState } from "react"
import {
  ShieldAlert,
  TestTube2,
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
  LaboratoryOrder,
  LaboratorySpecimenRecord,
} from "@/features/laboratory/types/laboratory.types"

interface LaboratorySpecimenRejectionDialogProps {
  order: LaboratoryOrder | null
  specimen:
    | LaboratorySpecimenRecord
    | null

  open: boolean
  onOpenChange: (open: boolean) => void

  onConfirmReject: (
    rejectionReason: string
  ) => void
}

export function LaboratorySpecimenRejectionDialog({
  order,
  specimen,
  open,
  onOpenChange,
  onConfirmReject,
}: LaboratorySpecimenRejectionDialogProps) {
  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("")

  if (!order || !specimen) {
    return null
  }

  const normalizedReason =
    rejectionReason.trim()

  const reasonIsValid =
    normalizedReason.length >= 5

  function handleOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen) {
      setRejectionReason("")
    }

    onOpenChange(nextOpen)
  }

  function handleReject() {
    if (!reasonIsValid) {
      return
    }

    onConfirmReject(
      normalizedReason
    )

    setRejectionReason("")
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
            Reject laboratory specimen?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Accession{" "}
            <strong>
              {
                specimen.accessionNumber
              }
            </strong>{" "}
            under order{" "}
            <strong>
              {order.orderNumber}
            </strong>{" "}
            will be marked as rejected.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="specimen-rejection-reason">
            Rejection reason
          </Label>

          <Textarea
            id="specimen-rejection-reason"
            rows={4}
            value={rejectionReason}
            placeholder="Example: Clotted, hemolyzed, leaking, or insufficient specimen"
            onChange={(event) =>
              setRejectionReason(
                event.target.value
              )
            }
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Keep specimen
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={!reasonIsValid}
            onClick={handleReject}
          >
            <TestTube2
              aria-hidden="true"
            />
            Reject specimen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
