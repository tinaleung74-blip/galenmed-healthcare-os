"use client"

import {
  useState,
  useTransition,
} from "react"
import {
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  finalizeLaboratoryResultAction,
  returnLaboratoryResultForCorrectionAction,
} from "@/features/hospital-operations/actions/laboratory-result.actions"
import {
  LaboratoryResultFlagBadge,
} from "@/features/hospital-operations/components/laboratory-result-badges"
import type {
  LaboratoryResultWorkItem,
} from "@/features/hospital-operations/types/laboratory-result.types"
import {
  createLaboratoryResultIdempotencyKey,
  getLaboratoryPatientFullName,
} from "@/features/hospital-operations/utils/laboratory-result.utils"

interface LaboratoryResultReviewDialogProps {
  workItem: LaboratoryResultWorkItem
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

export function LaboratoryResultReviewDialog({
  workItem,
  open,
  onOpenChange,
}: LaboratoryResultReviewDialogProps) {
  const router = useRouter()

  const [
    verificationNotes,
    setVerificationNotes,
  ] = useState("")

  const [
    correctionReason,
    setCorrectionReason,
  ] = useState("")

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

  const metadata =
    workItem.metadata

  const canReturn =
    workItem.documentId !== null &&
    workItem.documentStatus ===
      "for_review"

  const canFinalize =
    workItem.documentId !== null &&
    workItem.documentStatus ===
      "for_review" &&
    workItem.requestStatus ===
      "completed" &&
    metadata !== null

  function handleReturn() {
    setErrorMessage(null)

    if (!workItem.documentId) {
      setErrorMessage(
        "Laboratory result document is missing."
      )
      return
    }

    if (
      correctionReason.trim()
        .length < 3
    ) {
      setErrorMessage(
        "Enter a correction reason with at least three characters."
      )
      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await returnLaboratoryResultForCorrectionAction(
            {
              idempotencyKey:
                createLaboratoryResultIdempotencyKey(
                  "laboratory.result.return"
                ),
              documentId:
                workItem.documentId as string,
              correctionReason:
                correctionReason.trim(),
            }
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        toast.success(
          result.message
        )

        onOpenChange(false)
        router.refresh()
      })()
    })
  }

  function handleFinalize() {
    setErrorMessage(null)

    if (
      !workItem.documentId ||
      !canFinalize
    ) {
      setErrorMessage(
        "The Laboratory service must be completed and the result must be awaiting verification before finalization."
      )
      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await finalizeLaboratoryResultAction(
            {
              idempotencyKey:
                createLaboratoryResultIdempotencyKey(
                  "laboratory.result.finalize"
                ),
              documentId:
                workItem.documentId as string,
              verificationNotes:
                verificationNotes.trim(),
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
                ?.releaseStatus ??
              undefined,
          }
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
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Verify Laboratory result
          </DialogTitle>

          <DialogDescription>
            {getLaboratoryPatientFullName(
              workItem
            )}
            {" · "}
            {
              workItem.patient
                .medicalRecordNumber
            }
            {" · "}
            {workItem.documentNumber}
          </DialogDescription>
        </DialogHeader>

        {!metadata ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            The Laboratory result metadata is missing or invalid. Return the record for correction.
          </div>
        ) : (
          <div className="space-y-6">
            <dl className="grid gap-4 rounded-xl border bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Service
                </dt>
                <dd className="mt-1 font-medium">
                  {workItem.serviceName}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Specimen
                </dt>
                <dd className="mt-1 font-medium">
                  {metadata.specimenType}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Collection reference
                </dt>
                <dd className="mt-1 font-mono text-xs">
                  {metadata.collectionReference ??
                    "Not recorded"}
                </dd>
              </div>
            </dl>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                Result items
              </h3>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">
                        Test
                      </th>
                      <th className="px-4 py-3">
                        Result
                      </th>
                      <th className="px-4 py-3">
                        Unit
                      </th>
                      <th className="px-4 py-3">
                        Reference range
                      </th>
                      <th className="px-4 py-3">
                        Flag
                      </th>
                      <th className="px-4 py-3">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {metadata.resultItems.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-t"
                        >
                          <td className="px-4 py-3 font-medium">
                            {item.testName}
                          </td>
                          <td className="px-4 py-3 font-semibold tabular-nums">
                            {item.resultValue}
                          </td>
                          <td className="px-4 py-3">
                            {item.unit || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {item.referenceRange ||
                              "—"}
                          </td>
                          <td className="px-4 py-3">
                            <LaboratoryResultFlagBadge
                              flag={item.flag}
                            />
                          </td>
                          <td className="max-w-xs whitespace-normal px-4 py-3">
                            {item.remarks || "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Interpretation
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {metadata.interpretation ??
                    "Not recorded"}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Internal notes
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {metadata.notes ??
                    "Not recorded"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="laboratory-correction-reason">
              Correction reason
            </Label>

            <Textarea
              id="laboratory-correction-reason"
              rows={4}
              value={correctionReason}
              disabled={isPending}
              placeholder="Required only when returning the result for correction."
              onChange={(event) =>
                setCorrectionReason(
                  event.target.value
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="laboratory-verification-notes">
              Verification notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="laboratory-verification-notes"
              rows={4}
              value={verificationNotes}
              disabled={isPending}
              onChange={(event) =>
                setVerificationNotes(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {workItem.requestStatus !==
        "completed" ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Complete the Laboratory queue/service workflow before final verification.
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {errorMessage}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={
              isPending ||
              !canReturn ||
              correctionReason.trim()
                .length < 3
            }
            onClick={handleReturn}
          >
            {isPending ? (
              <LoaderCircle
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RotateCcw
                aria-hidden="true"
              />
            )}
            Return for correction
          </Button>

          <Button
            type="button"
            disabled={
              isPending ||
              !canFinalize
            }
            className="bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={handleFinalize}
          >
            {isPending ? (
              <LoaderCircle
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                aria-hidden="true"
              />
            )}
            Verify and finalize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
