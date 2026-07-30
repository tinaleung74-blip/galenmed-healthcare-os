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
import type { PatientDocumentRecord } from "@/features/patients/types/patient-document.types"

interface PatientDocumentArchiveDialogProps {
  record: PatientDocumentRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmArchive: (
    archiveReason: string
  ) => void
}

export function PatientDocumentArchiveDialog({
  record,
  open,
  onOpenChange,
  onConfirmArchive,
}: PatientDocumentArchiveDialogProps) {
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
            Archive patient document?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The metadata record for{" "}
            <strong>{record.title}</strong>{" "}
            will remain available for audit and
            historical reference. It will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="document-archive-reason">
            Archive reason
          </Label>

          <Textarea
            id="document-archive-reason"
            rows={4}
            value={archiveReason}
            placeholder="Example: Superseded or duplicate document"
            aria-invalid={
              archiveReason.length > 0 &&
              !reasonIsValid
            }
            aria-describedby="document-archive-reason-help"
            onChange={(event) =>
              setArchiveReason(
                event.target.value
              )
            }
          />

          <p
            id="document-archive-reason-help"
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
            Archive document
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
