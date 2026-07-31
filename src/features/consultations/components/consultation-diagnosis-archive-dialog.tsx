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
import type { ConsultationDiagnosisRecord } from "@/features/consultations/types/consultation-diagnosis.types"

interface ConsultationDiagnosisArchiveDialogProps {
  record:
    | ConsultationDiagnosisRecord
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onConfirmArchive: (
    archiveReason: string
  ) => void
}

export function ConsultationDiagnosisArchiveDialog({
  record,
  open,
  onOpenChange,
  onConfirmArchive,
}: ConsultationDiagnosisArchiveDialogProps) {
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
            Archive diagnosis?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The diagnosis record for{" "}
            <strong>
              {record.diagnosisName}
            </strong>{" "}
            will remain available for
            clinical audit and historical
            reference. It will not be
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="diagnosis-archive-reason">
            Archive reason
          </Label>

          <Textarea
            id="diagnosis-archive-reason"
            rows={4}
            value={archiveReason}
            placeholder="Example: Duplicate or clinically refuted diagnosis"
            aria-invalid={
              archiveReason.length > 0 &&
              !reasonIsValid
            }
            aria-describedby="diagnosis-archive-reason-help"
            onChange={(event) =>
              setArchiveReason(
                event.target.value
              )
            }
          />

          <p
            id="diagnosis-archive-reason-help"
            className="text-xs text-muted-foreground"
          >
            Enter at least five characters.
            The reason remains attached to
            the archived diagnosis.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Keep diagnosis
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={!reasonIsValid}
            onClick={
              handleConfirmArchive
            }
          >
            <Archive aria-hidden="true" />
            Archive diagnosis
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
