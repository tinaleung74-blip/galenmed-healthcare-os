"use client"

import {
  useState,
} from "react"
import {
  LoaderCircle,
  TriangleAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  LaboratoryQueueEntryRecord,
} from "@/features/hospital-operations/types/laboratory-queue.types"

interface LaboratoryQueueCancelDialogProps {
  entry: LaboratoryQueueEntryRecord
  open: boolean
  isSubmitting: boolean
  onOpenChange: (
    open: boolean
  ) => void
  onConfirm: (
    reason: string
  ) => void
}

export function LaboratoryQueueCancelDialog({
  entry,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: LaboratoryQueueCancelDialogProps) {
  const [reason, setReason] =
    useState("")

  const normalizedReason =
    reason.trim()

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <TriangleAlert
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Cancel Laboratory queue entry
          </DialogTitle>

          <DialogDescription>
            {entry.queueNumber}
            {" · "}
            {entry.serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="laboratory-queue-cancel-reason">
            Cancellation reason
          </Label>

          <Textarea
            id="laboratory-queue-cancel-reason"
            rows={4}
            value={reason}
            disabled={isSubmitting}
            placeholder="Explain why this Laboratory queue entry is being cancelled."
            onChange={(event) =>
              setReason(
                event.target.value
              )
            }
          />

          <p className="text-xs text-muted-foreground">
            The reason is retained in the
            hospital operations audit trail.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Keep queue entry
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={
              isSubmitting ||
              normalizedReason.length < 3
            }
            onClick={() =>
              onConfirm(
                normalizedReason
              )
            }
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Cancelling
              </>
            ) : (
              "Cancel queue entry"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
