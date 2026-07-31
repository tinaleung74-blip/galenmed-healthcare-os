"use client"

import {
  ShieldAlert,
  UserX,
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
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"

interface ConsultationNoShowDialogProps {
  consultation: ConsultationEncounter | null
  patientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmNoShow: () => void
}

export function ConsultationNoShowDialog({
  consultation,
  patientName,
  open,
  onOpenChange,
  onConfirmNoShow,
}: ConsultationNoShowDialogProps) {
  if (!consultation) {
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
            Mark patient as no-show?
          </AlertDialogTitle>

          <AlertDialogDescription>
            {patientName} will be marked as a no-show
            for consultation{" "}
            {consultation.consultationNumber}. This
            status will remain in the operational record.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={onConfirmNoShow}
          >
            <UserX aria-hidden="true" />
            Mark no-show
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
