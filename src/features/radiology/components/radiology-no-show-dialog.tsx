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
import type {
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"

interface RadiologyNoShowDialogProps {
  order:
    | RadiologyOrder
    | null

  patientName: string

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onConfirmNoShow: () => void
}

export function RadiologyNoShowDialog({
  order,
  patientName,
  open,
  onOpenChange,
  onConfirmNoShow,
}: RadiologyNoShowDialogProps) {
  if (!order) {
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
            <ShieldAlert
              aria-hidden="true"
            />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Mark radiology schedule as no-show?
          </AlertDialogTitle>

          <AlertDialogDescription>
            {patientName} will be marked
            as no-show for{" "}
            {order.orderNumber}.
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
