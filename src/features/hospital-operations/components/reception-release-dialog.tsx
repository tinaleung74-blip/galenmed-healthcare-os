"use client"

import {
  useState,
  useTransition,
} from "react"
import {
  LoaderCircle,
  PackageCheck,
  ShieldCheck,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  releaseReceptionDocumentAction,
} from "@/features/hospital-operations/actions/reception-release.actions"
import type {
  ReceptionReleaseItem,
  ReceptionReleaseMethod,
} from "@/features/hospital-operations/types/reception-release.types"
import {
  createReceptionReleaseIdempotencyKey,
  getReceptionPatientFullName,
  RECEPTION_RELEASE_METHOD_LABELS,
} from "@/features/hospital-operations/utils/reception-release.utils"

interface ReceptionReleaseDialogProps {
  item: ReceptionReleaseItem
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

export function ReceptionReleaseDialog({
  item,
  open,
  onOpenChange,
}: ReceptionReleaseDialogProps) {
  const router = useRouter()

  const [
    releaseMethod,
    setReleaseMethod,
  ] = useState<ReceptionReleaseMethod>(
    "physical_print"
  )

  const [
    recipientName,
    setRecipientName,
  ] = useState("")

  const [
    recipientRelationship,
    setRecipientRelationship,
  ] = useState("")

  const [
    recipientIdentifierMasked,
    setRecipientIdentifierMasked,
  ] = useState("")

  const [notes, setNotes] =
    useState("")

  const [
    idempotencyKey,
    setIdempotencyKey,
  ] = useState(() =>
    createReceptionReleaseIdempotencyKey(
      "document-release"
    )
  )

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  function submitRelease() {
    setErrorMessage(null)

    startTransition(() => {
      void (async () => {
        const result =
          await releaseReceptionDocumentAction(
            {
              documentId:
                item.documentId,
              releaseMethod,
              recipientName,
              recipientRelationship,
              recipientIdentifierMasked,
              notes,
              idempotencyKey,
            }
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        toast.success(
          result.message,
          {
            description:
              result.data
                ?.releaseNumber,
          }
        )

        setIdempotencyKey(
          createReceptionReleaseIdempotencyKey(
            "document-release"
          )
        )

        onOpenChange(false)
        router.refresh()
      })()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <PackageCheck
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Record patient document release
          </DialogTitle>

          <DialogDescription>
            {item.documentNumber}
            {" · "}
            {getReceptionPatientFullName(
              item
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            This document has passed clinical
            finalization and payment-release
            checks. Confirm the recipient
            before recording release.
          </div>

          <div className="space-y-2">
            <Label htmlFor="reception-release-method">
              Release method
            </Label>

            <select
              id="reception-release-method"
              value={releaseMethod}
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              onChange={(event) =>
                setReleaseMethod(
                  event.target.value as
                    ReceptionReleaseMethod
                )
              }
            >
              {Object.entries(
                RECEPTION_RELEASE_METHOD_LABELS
              ).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reception-recipient-name">
                Recipient full name
              </Label>

              <Input
                id="reception-recipient-name"
                value={recipientName}
                disabled={isPending}
                placeholder="Patient or authorized representative"
                onChange={(event) =>
                  setRecipientName(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-recipient-relationship">
                Relationship to patient
              </Label>

              <Input
                id="reception-recipient-relationship"
                value={
                  recipientRelationship
                }
                disabled={isPending}
                placeholder="Patient, spouse, parent, representative"
                onChange={(event) =>
                  setRecipientRelationship(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-recipient-id">
                Identifier reference
              </Label>

              <Input
                id="reception-recipient-id"
                value={
                  recipientIdentifierMasked
                }
                disabled={isPending}
                placeholder="Masked only, e.g. ID ending 1234"
                onChange={(event) =>
                  setRecipientIdentifierMasked(
                    event.target.value
                  )
                }
              />

              <p className="text-xs text-muted-foreground">
                Do not enter a full government
                ID number.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reception-release-notes">
              Release notes
            </Label>

            <Textarea
              id="reception-release-notes"
              rows={4}
              value={notes}
              disabled={isPending}
              placeholder="Optional receiving or handoff notes"
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Release records are append-only.
              Releasing another copy creates a
              new numbered record instead of
              altering prior evidence.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {errorMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={
              isPending ||
              recipientName.trim()
                .length < 2
            }
            className="bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={submitRelease}
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Recording release
              </>
            ) : (
              <>
                <PackageCheck
                  aria-hidden="true"
                />
                Record release
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
