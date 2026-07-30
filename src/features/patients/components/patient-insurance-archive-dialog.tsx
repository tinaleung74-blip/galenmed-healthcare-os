"use client"

import { useState } from "react"
import {
  Archive,
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
import type { PatientInsuranceRecord } from "@/features/patients/types/patient-insurance.types"

interface PatientInsuranceArchiveDialogProps {
  record: PatientInsuranceRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmArchive: (
    archiveReason: string
  ) => void
}

export function PatientInsuranceArchiveDialog({
  record,
  open,
  onOpenChange,
  onConfirmArchive,
}: PatientInsuranceArchiveDialogProps) {
  const [archiveReason, setArchiveReason] =
    useState("")

  if (!record) {
    return null
  }

  const normalizedReason =
    archiveReason.trim()

  const reasonIsValid =
    normalizedReason.length >= 5

  function handleOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen) {
      setArchiveReason("")
    }

    onOpenChange(nextOpen)
  }

  function handleConfirmArchive() {
    if (!reasonIsValid) {
      return
    }

    onConfirmArchive(normalizedReason)
    setArchiveReason("")
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-50 text-amber-700">
            <ShieldAlert aria-hidden="true" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Archive insurance coverage?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The coverage record for{" "}
            <strong>{record.payerName}</strong>
            {" — "}
            <strong>{record.planName}</strong>{" "}
            will remain available for audit and historical
            reference. It will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="insurance-archive-reason">
            Archive reason
          </Label>

          <Textarea
            id="insurance-archive-reason"
            rows={4}
            value={archiveReason}
            placeholder="Example: Duplicate or replaced coverage"
            aria-invalid={
              archiveReason.length > 0 &&
              !reasonIsValid
            }
            aria-describedby="insurance-archive-reason-help"
            onChange={(event) =>
              setArchiveReason(
                event.target.value
              )
            }
          />

          <p
            id="insurance-archive-reason-help"
            className="text-xs text-muted-foreground"
          >
            Enter at least five characters. The reason
            will remain attached to the archived record.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={!reasonIsValid}
            onClick={handleConfirmArchive}
          >
            <Archive aria-hidden="true" />
            Archive coverage
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
