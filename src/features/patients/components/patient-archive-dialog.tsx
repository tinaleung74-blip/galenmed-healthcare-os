"use client"

import {
  Archive as ArchiveIcon,
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
import type { Patient } from "@/features/patients/types/patient.types"
import { getPatientFullName } from "@/features/patients/utils/patient.utils"

interface PatientArchiveDialogProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmArchive: () => void
}

export function PatientArchiveDialog({
  patient,
  open,
  onOpenChange,
  onConfirmArchive,
}: PatientArchiveDialogProps) {
  if (!patient) {
    return null
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-50 text-amber-700">
            <ShieldAlert aria-hidden="true" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Archive patient record?
          </AlertDialogTitle>

          <AlertDialogDescription>
            {getPatientFullName(patient)} (
            {patient.medicalRecordNumber}) will be marked as
            archived. The record will remain historically
            available and searchable, but it will no longer be
            treated as an active patient record.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          This action does not delete demographic, clinical,
          laboratory, billing, prescription, or audit history.
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={onConfirmArchive}
          >
            <ArchiveIcon aria-hidden="true" />
            Archive patient
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
