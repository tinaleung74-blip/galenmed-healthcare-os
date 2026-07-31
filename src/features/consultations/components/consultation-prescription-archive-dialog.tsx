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
import type { ConsultationPrescriptionRecord } from "@/features/consultations/types/consultation-prescription.types"

interface ConsultationPrescriptionArchiveDialogProps {
  record:
    | ConsultationPrescriptionRecord
    | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmArchive: (
    archiveReason: string
  ) => void
}

export function ConsultationPrescriptionArchiveDialog({
  record,
  open,
  onOpenChange,
  onConfirmArchive,
}: ConsultationPrescriptionArchiveDialogProps) {
  const [
    archiveReason,
    setArchiveReason,
  ] = useState("")

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

    onConfirmArchive(
      normalizedReason
    )

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
            <ShieldAlert
              aria-hidden="true"
            />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Archive prescription draft?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The draft for{" "}
            <strong>
              {record.medicationName}
            </strong>{" "}
            will remain available for clinical audit
            and historical reference. It will not be
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="prescription-archive-reason">
            Archive reason
          </Label>

          <Textarea
            id="prescription-archive-reason"
            rows={4}
            value={archiveReason}
            placeholder="Example: Duplicate or replaced draft order"
            aria-invalid={
              archiveReason.length > 0 &&
              !reasonIsValid
            }
            aria-describedby="prescription-archive-reason-help"
            onChange={(event) =>
              setArchiveReason(
                event.target.value
              )
            }
          />

          <p
            id="prescription-archive-reason-help"
            className="text-xs text-muted-foreground"
          >
            Enter at least five characters. The
            reason remains attached to the archived
            prescription.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Keep draft
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={!reasonIsValid}
            onClick={handleConfirmArchive}
          >
            <Archive aria-hidden="true" />
            Archive draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
