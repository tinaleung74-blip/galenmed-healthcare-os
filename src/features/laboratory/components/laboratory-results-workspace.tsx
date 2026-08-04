"use client"

import {
  useState,
} from "react"
import {
  BadgeCheck,
  ClipboardPlus,
  LockKeyhole,
  Send,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LaboratoryResultFlagBadge,
  LaboratoryResultStatusBadge,
} from "@/features/laboratory/components/laboratory-result-badges"
import { LaboratoryResultEntryDialog } from "@/features/laboratory/components/laboratory-result-entry-dialog"
import { LaboratoryResultReleaseDialog } from "@/features/laboratory/components/laboratory-result-release-dialog"
import { LaboratoryResultVerificationDialog } from "@/features/laboratory/components/laboratory-result-verification-dialog"
import { useLaboratoryResults } from "@/features/laboratory/providers/laboratory-result-provider"
import type {
  LaboratoryResultPanelFormValues,
  LaboratoryResultReleaseValues,
  LaboratoryResultVerificationValues,
} from "@/features/laboratory/schemas/laboratory-result.schema"
import type {
  LaboratoryResultEntry,
} from "@/features/laboratory/types/laboratory-result.types"
import type {
  LaboratoryOrder,
} from "@/features/laboratory/types/laboratory.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface LaboratoryResultsWorkspaceProps {
  order: LaboratoryOrder
}

function formatResultValue(
  entry: LaboratoryResultEntry
): string {
  if (
    entry.numericValue !== null
  ) {
    return `${entry.numericValue}${
      entry.unit
        ? ` ${entry.unit}`
        : ""
    }`
  }

  return (
    entry.textValue ??
    "Not recorded"
  )
}

function formatReferenceRange(
  entry: LaboratoryResultEntry
): string {
  if (entry.referenceText) {
    return entry.referenceText
  }

  if (
    entry.referenceLow !== null &&
    entry.referenceHigh !== null
  ) {
    return `${entry.referenceLow}–${entry.referenceHigh}${
      entry.unit
        ? ` ${entry.unit}`
        : ""
    }`
  }

  if (
    entry.referenceLow !== null
  ) {
    return `≥ ${entry.referenceLow}${
      entry.unit
        ? ` ${entry.unit}`
        : ""
    }`
  }

  if (
    entry.referenceHigh !== null
  ) {
    return `≤ ${entry.referenceHigh}${
      entry.unit
        ? ` ${entry.unit}`
        : ""
    }`
  }

  return "Not configured"
}

export function LaboratoryResultsWorkspace({
  order,
}: LaboratoryResultsWorkspaceProps) {
  const {
    resultSets,
    saveLaboratoryResultDraft,
    completeLaboratoryResultSet,
    verifyLaboratoryResultSet,
    releaseLaboratoryResultSet,
  } = useLaboratoryResults()

  const [
    editingOrderItemId,
    setEditingOrderItemId,
  ] = useState<string | null>(null)

  const [
    verifyingResultSetId,
    setVerifyingResultSetId,
  ] = useState<string | null>(null)

  const [
    releasingResultSetId,
    setReleasingResultSetId,
  ] = useState<string | null>(null)

  const editingOrderItem =
    order.items.find(
      (item) =>
        item.id ===
        editingOrderItemId
    ) ?? null

  const editingResultSet =
    editingOrderItem
      ? resultSets.find(
          (resultSet) =>
            resultSet.orderItemId ===
            editingOrderItem.id
        ) ?? null
      : null

  const verifyingResultSet =
    resultSets.find(
      (resultSet) =>
        resultSet.id ===
        verifyingResultSetId
    ) ?? null

  const releasingResultSet =
    resultSets.find(
      (resultSet) =>
        resultSet.id ===
        releasingResultSetId
    ) ?? null

  async function handleSaveDraft(
    values:
      LaboratoryResultPanelFormValues
  ) {
    if (!editingOrderItem) {
      throw new Error(
        "No laboratory test was selected."
      )
    }

    const savedResultSet =
      saveLaboratoryResultDraft(
        order.id,
        editingOrderItem.id,
        values
      )

    toast.success(
      "Laboratory result draft saved",
      {
        description: `${savedResultSet.testName} version ${savedResultSet.version} was saved.`,
      }
    )
  }

  async function handleCompleteResults(
    values:
      LaboratoryResultPanelFormValues
  ) {
    if (!editingOrderItem) {
      throw new Error(
        "No laboratory test was selected."
      )
    }

    const savedResultSet =
      saveLaboratoryResultDraft(
        order.id,
        editingOrderItem.id,
        values
      )

    const completedResultSet =
      completeLaboratoryResultSet(
        savedResultSet.id,
        values.performedBy
      )

    toast.success(
      "Laboratory results completed",
      {
        description: `${completedResultSet.testName} is ready for technical verification.`,
      }
    )
  }

  async function handleVerify(
    values:
      LaboratoryResultVerificationValues
  ) {
    if (!verifyingResultSet) {
      throw new Error(
        "No result set was selected."
      )
    }

    const verifiedResultSet =
      verifyLaboratoryResultSet(
        verifyingResultSet.id,
        values
      )

    toast.success(
      "Laboratory results verified",
      {
        description: `${verifiedResultSet.testName} was technically verified.`,
      }
    )
  }

  async function handleRelease(
    values:
      LaboratoryResultReleaseValues
  ) {
    if (!releasingResultSet) {
      throw new Error(
        "No result set was selected."
      )
    }

    const releasedResultSet =
      releaseLaboratoryResultSet(
        releasingResultSet.id,
        values
      )

    toast.success(
      "Laboratory results released",
      {
        description: `${releasedResultSet.testName} is now released and read-only.`,
      }
    )
  }

  return (
    <>
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">
            Laboratory results
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Enter, complete, technically
            verify, and release structured
            result panels.
          </p>
        </div>

        <div className="space-y-4">
          {order.items.map(
            (orderItem) => {
              const resultSet =
                resultSets.find(
                  (candidateResultSet) =>
                    candidateResultSet.orderItemId ===
                    orderItem.id
                ) ?? null

              const canEnterResults =
                order.status ===
                  "in-process" &&
                orderItem.status ===
                  "in-process" &&
                (
                  !resultSet ||
                  resultSet.status ===
                    "draft"
                )

              return (
                <article
                  key={orderItem.id}
                  className="overflow-hidden rounded-xl border"
                >
                  <div className="flex flex-col gap-3 bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {
                          orderItem.testName
                        }
                      </p>

                      <p className="mt-1 font-mono text-xs text-teal-700">
                        {
                          orderItem.testCode
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {resultSet ? (
                        <LaboratoryResultStatusBadge
                          status={
                            resultSet.status
                          }
                        />
                      ) : null}

                      {canEnterResults ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            setEditingOrderItemId(
                              orderItem.id
                            )
                          }
                        >
                          <ClipboardPlus
                            aria-hidden="true"
                          />

                          {resultSet
                            ? "Edit results"
                            : "Enter results"}
                        </Button>
                      ) : null}

                      {resultSet?.status ===
                      "completed" ? (
                        <Button
                          type="button"
                          size="sm"
                          className="bg-emerald-700 text-white hover:bg-emerald-800"
                          onClick={() =>
                            setVerifyingResultSetId(
                              resultSet.id
                            )
                          }
                        >
                          <BadgeCheck
                            aria-hidden="true"
                          />
                          Verify
                        </Button>
                      ) : null}

                      {resultSet?.status ===
                      "verified" ? (
                        <Button
                          type="button"
                          size="sm"
                          className="bg-teal-700 text-white hover:bg-teal-800"
                          onClick={() =>
                            setReleasingResultSetId(
                              resultSet.id
                            )
                          }
                        >
                          <Send
                            aria-hidden="true"
                          />
                          Release
                        </Button>
                      ) : null}

                      {resultSet?.status ===
                      "released" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                          <LockKeyhole
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Read-only
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {!resultSet ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No structured results
                      have been entered.
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              Analyte
                            </TableHead>

                            <TableHead>
                              Result
                            </TableHead>

                            <TableHead>
                              Reference
                            </TableHead>

                            <TableHead>
                              Flag
                            </TableHead>

                            <TableHead>
                              Comment
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {resultSet.entries.map(
                            (entry) => (
                              <TableRow
                                key={
                                  entry.id
                                }
                              >
                                <TableCell className="font-medium">
                                  {
                                    entry.analyteName
                                  }
                                </TableCell>

                                <TableCell>
                                  {formatResultValue(
                                    entry
                                  )}
                                </TableCell>

                                <TableCell>
                                  {formatReferenceRange(
                                    entry
                                  )}
                                </TableCell>

                                <TableCell>
                                  <LaboratoryResultFlagBadge
                                    flag={
                                      entry.flag
                                    }
                                  />
                                </TableCell>

                                <TableCell>
                                  {entry.comment ??
                                    "—"}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>

                      <div className="grid gap-3 border-t bg-slate-50 p-4 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>
                          Performed by:{" "}
                          {
                            resultSet.performedBy
                          }
                        </p>

                        <p>
                          Performed at:{" "}
                          {formatPatientDateTime(
                            resultSet.performedAt
                          )}
                        </p>

                        {resultSet.verifiedAt ? (
                          <p>
                            Verified by:{" "}
                            {
                              resultSet.verifiedBy
                            }
                            {" · "}
                            {formatPatientDateTime(
                              resultSet.verifiedAt
                            )}
                          </p>
                        ) : null}

                        {resultSet.releasedAt ? (
                          <p>
                            Released by:{" "}
                            {
                              resultSet.releasedBy
                            }
                            {" · "}
                            {formatPatientDateTime(
                              resultSet.releasedAt
                            )}
                          </p>
                        ) : null}
                      </div>
                    </>
                  )}
                </article>
              )
            }
          )}
        </div>
      </section>

      <LaboratoryResultEntryDialog
        order={
          editingOrderItem
            ? order
            : null
        }
        orderItem={
          editingOrderItem
        }
        resultSet={
          editingResultSet
        }
        open={Boolean(
          editingOrderItem
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingOrderItemId(
              null
            )
          }
        }}
        onSaveDraft={
          handleSaveDraft
        }
        onCompleteResults={
          handleCompleteResults
        }
      />

      <LaboratoryResultVerificationDialog
        resultSet={
          verifyingResultSet
        }
        open={Boolean(
          verifyingResultSet
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setVerifyingResultSetId(
              null
            )
          }
        }}
        onSubmitVerification={
          handleVerify
        }
      />

      <LaboratoryResultReleaseDialog
        resultSet={
          releasingResultSet
        }
        open={Boolean(
          releasingResultSet
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setReleasingResultSetId(
              null
            )
          }
        }}
        onSubmitRelease={
          handleRelease
        }
      />
    </>
  )
}
