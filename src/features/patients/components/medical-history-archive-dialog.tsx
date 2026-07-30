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
import type { MedicalHistoryRecord } from "@/features/patients/types/medical-history.types"

interface MedicalHistoryArchiveDialogProps {
  record: MedicalHistoryRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmArchive: (
    archiveReason: string
  ) => void
}

export function MedicalHistoryArchiveDialog({
  record,
  open,
  onOpenChange,
  onConfirmArchive,
}: MedicalHistoryArchiveDialogProps) {
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
            Archive medical-history record?
          </AlertDialogTitle>

          <AlertDialogDescription>
            The condition record for{" "}
            <strong>{record.conditionName}</strong>
            {record.icd10Code
              ? ` (${record.icd10Code})`
              : ""}{" "}
            will remain available for historical and
            audit reference. It will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="medical-history-archive-reason">
            Archive reason
          </Label>

          <Textarea
            id="medical-history-archive-reason"
            rows={4}
            value={archiveReason}
            placeholder="Example: Duplicate condition record"
            aria-invalid={
              archiveReason.length > 0 &&
              !reasonIsValid
            }
            aria-describedby="medical-history-archive-reason-help"
            onChange={(event) =>
              setArchiveReason(
                event.target.value
              )
            }
          />

          <p
            id="medical-history-archive-reason-help"
            className="text-xs text-muted-foreground"
          >
            Enter at least five characters. The reason
            will be retained with the archived record.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Archived clinical history cannot be edited
          unless a future authorized restoration workflow
          is completed.
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
            Archive record
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
