"use client"

import {
  useMemo,
  useState,
  useTransition,
} from "react"
import {
  ArrowLeft,
  Beaker,
  ClipboardCheck,
  Edit3,
  Eye,
  FileCheck2,
  KeyRound,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"
import { toast } from "sonner"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  signOutStaff,
} from "@/features/auth/actions/staff-auth.actions"
import type {
  StaffContext,
} from "@/features/auth/types/staff-auth.types"
import {
  submitLaboratoryResultForVerificationAction,
} from "@/features/hospital-operations/actions/laboratory-result.actions"
import {
  LaboratoryDocumentStatusBadge,
  LaboratoryPaymentStatusBadge,
  LaboratoryReleaseStatusBadge,
} from "@/features/hospital-operations/components/laboratory-result-badges"
import {
  LaboratoryResultEntryDialog,
} from "@/features/hospital-operations/components/laboratory-result-entry-dialog"
import {
  LaboratoryResultReviewDialog,
} from "@/features/hospital-operations/components/laboratory-result-review-dialog"
import {
  LABORATORY_DOCUMENT_STATUSES,
  type LaboratoryDocumentStatus,
  type LaboratoryResultWorkItem,
  type LaboratoryResultsPageData,
} from "@/features/hospital-operations/types/laboratory-result.types"
import {
  createLaboratoryResultIdempotencyKey,
  formatLaboratoryAmount,
  formatLaboratoryDateTime,
  getLaboratoryPatientFullName,
  LABORATORY_DOCUMENT_STATUS_LABELS,
  normalizeLaboratoryResultSearch,
} from "@/features/hospital-operations/utils/laboratory-result.utils"
import { cn } from "@/lib/utils"

interface LaboratoryResultsWorkspaceProps {
  context: StaffContext
  data: LaboratoryResultsPageData
}

export function LaboratoryResultsWorkspace({
  context,
  data,
}: LaboratoryResultsWorkspaceProps) {
  const router = useRouter()

  const [search, setSearch] =
    useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    LaboratoryDocumentStatus |
      "no_result" |
      "all"
  >("all")

  const [
    selectedEntry,
    setSelectedEntry,
  ] = useState<
    LaboratoryResultWorkItem | null
  >(null)

  const [
    selectedReview,
    setSelectedReview,
  ] = useState<
    LaboratoryResultWorkItem | null
  >(null)

  const [
    pendingDocumentId,
    setPendingDocumentId,
  ] = useState<string | null>(
    null
  )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const isSystemAdmin =
    context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )

  const canEnterResults =
    isSystemAdmin ||
    context.permissions.includes(
      "laboratory.result.enter"
    )

  const canVerifyResults =
    isSystemAdmin ||
    context.permissions.includes(
      "laboratory.result.verify"
    )

  const filteredItems =
    useMemo(
      () =>
        data.workItems.filter(
          (item) => {
            const matchesSearch =
              normalizeLaboratoryResultSearch(
                item.requestNumber,
                item.visitNumber,
                item.queueNumber,
                item.patient
                  .medicalRecordNumber,
                getLaboratoryPatientFullName(
                  item
                ),
                item.serviceCode,
                item.serviceName,
                item.documentNumber,
                item.documentTitle,
                item.branchName
              ).includes(
                normalizeLaboratoryResultSearch(
                  search
                )
              )

            const matchesStatus =
              statusFilter === "all" ||
              (
                statusFilter ===
                  "no_result" &&
                item.documentStatus ===
                  null
              ) ||
              item.documentStatus ===
                statusFilter

            return (
              matchesSearch &&
              matchesStatus
            )
          }
        ),
      [
        data.workItems,
        search,
        statusFilter,
      ]
    )

  const draftCount =
    data.workItems.filter(
      (item) =>
        item.documentStatus ===
        "draft"
    ).length

  const verificationCount =
    data.workItems.filter(
      (item) =>
        item.documentStatus ===
        "for_review"
    ).length

  const finalizedCount =
    data.workItems.filter(
      (item) =>
        item.documentStatus ===
        "finalized"
    ).length

  const readyCount =
    data.workItems.filter(
      (item) =>
        item.releaseStatus ===
        "ready"
    ).length

  function handleSubmitForVerification(
    item: LaboratoryResultWorkItem
  ) {
    if (!item.documentId) {
      return
    }

    setPendingDocumentId(
      item.documentId
    )

    startTransition(() => {
      void (async () => {
        const result =
          await submitLaboratoryResultForVerificationAction(
            {
              idempotencyKey:
                createLaboratoryResultIdempotencyKey(
                  "laboratory.result.submit"
                ),
              documentId:
                item.documentId as string,
            }
          )

        setPendingDocumentId(null)

        if (!result.success) {
          toast.error(
            result.message
          )
          return
        }

        toast.success(
          result.message
        )

        router.refresh()
      })()
    })
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <GalenMedLogo
              size="md"
              priority
              className="rounded-xl bg-white p-1 ring-1 ring-slate-200"
            />

            <div>
              <p className="font-semibold tracking-tight">
                GalenMed
              </p>
              <p className="text-xs text-muted-foreground">
                Laboratory Results
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/laboratory/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <ArrowLeft
                aria-hidden="true"
              />
              Dashboard
            </Link>

            <Link
              href="/staff/account/change-password"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <KeyRound
                aria-hidden="true"
              />
              Change password
            </Link>

            <form action={signOutStaff}>
              <Button
                type="submit"
                variant="outline"
              >
                <LogOut
                  aria-hidden="true"
                />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
              <Beaker
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-violet-700">
                Protected Laboratory workflow
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Result Entry and Verification
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Enter structured Laboratory results, submit drafts for verification, finalize verified results, and monitor payment-controlled release status.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              router.refresh()
            }
          >
            <RefreshCw
              className={cn(
                isPending &&
                  "animate-spin"
              )}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Draft results
              </p>
              <p className="mt-1 text-xl font-semibold">
                {draftCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-violet-700">
                For verification
              </p>
              <p className="mt-1 text-xl font-semibold text-violet-800">
                {verificationCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">
                Verified results
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">
                {finalizedCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-200 bg-teal-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-teal-700">
                Ready for Reception release
              </p>
              <p className="mt-1 text-xl font-semibold text-teal-800">
                {readyCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={search}
              className="pl-8"
              placeholder="Search patient, MRN, request, queue, service, or document"
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={statusFilter}
            className="h-8 min-w-52 rounded-lg border border-input bg-background px-2.5 text-sm"
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | LaboratoryDocumentStatus
                  | "no_result"
                  | "all"
              )
            }
          >
            <option value="all">
              All result statuses
            </option>
            <option value="no_result">
              No result yet
            </option>
            {LABORATORY_DOCUMENT_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {
                    LABORATORY_DOCUMENT_STATUS_LABELS[
                      status
                    ]
                  }
                </option>
              )
            )}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <Table className="min-w-[1500px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Patient
                </TableHead>
                <TableHead>
                  Laboratory request
                </TableHead>
                <TableHead>
                  Queue / Service
                </TableHead>
                <TableHead>
                  Result status
                </TableHead>
                <TableHead>
                  Payment
                </TableHead>
                <TableHead>
                  Release
                </TableHead>
                <TableHead>
                  Last updated
                </TableHead>
                <TableHead>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredItems.map(
                (item) => {
                  const canEditDraft =
                    canEnterResults &&
                    item.documentStatus ===
                      "draft" &&
                    (
                      item.createdBy ===
                        context.userId ||
                      isSystemAdmin
                    )

                  const canCreate =
                    canEnterResults &&
                    item.documentId ===
                      null

                  const canSubmit =
                    canEditDraft &&
                    item.metadata !== null

                  const canReview =
                    canVerifyResults &&
                    item.documentStatus ===
                      "for_review"

                  const canView =
                    item.documentId !==
                      null &&
                    item.metadata !== null

                  return (
                    <TableRow
                      key={
                        item.serviceRequestId
                      }
                    >
                      <TableCell>
                        <p className="font-medium">
                          {getLaboratoryPatientFullName(
                            item
                          )}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {
                            item.patient
                              .medicalRecordNumber
                          }
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium">
                          {item.serviceName}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {item.requestNumber}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p>
                          {item.queueNumber ??
                            "No queue"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.requestStatus}
                        </p>
                      </TableCell>

                      <TableCell>
                        {item.documentStatus ? (
                          <div className="space-y-2">
                            <LaboratoryDocumentStatusBadge
                              status={
                                item.documentStatus
                              }
                            />
                            <p className="font-mono text-xs text-muted-foreground">
                              {item.documentNumber}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No result entered
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {item.paymentStatus ? (
                          <div className="space-y-2">
                            <LaboratoryPaymentStatusBadge
                              status={
                                item.paymentStatus
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              {formatLaboratoryAmount(
                                item.clearedAmountCentavos
                              )}
                              {" / "}
                              {formatLaboratoryAmount(
                                item.requiredAmountCentavos
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No clearance record
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {item.releaseStatus ? (
                          <LaboratoryReleaseStatusBadge
                            status={
                              item.releaseStatus
                            }
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not available
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {formatLaboratoryDateTime(
                          item.documentUpdatedAt,
                          "Not entered"
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex min-w-80 flex-wrap gap-2">
                          {canCreate ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                setSelectedEntry(
                                  item
                                )
                              }
                            >
                              <Edit3
                                aria-hidden="true"
                              />
                              Enter result
                            </Button>
                          ) : null}

                          {canEditDraft ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedEntry(
                                  item
                                )
                              }
                            >
                              <Edit3
                                aria-hidden="true"
                              />
                              Edit draft
                            </Button>
                          ) : null}

                          {canSubmit ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                isPending &&
                                pendingDocumentId ===
                                  item.documentId
                              }
                              onClick={() =>
                                handleSubmitForVerification(
                                  item
                                )
                              }
                            >
                              {isPending &&
                              pendingDocumentId ===
                                item.documentId ? (
                                <LoaderCircle
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Send
                                  aria-hidden="true"
                                />
                              )}
                              Submit
                            </Button>
                          ) : null}

                          {canReview ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-emerald-700 text-white hover:bg-emerald-800"
                              onClick={() =>
                                setSelectedReview(
                                  item
                                )
                              }
                            >
                              <ClipboardCheck
                                aria-hidden="true"
                              />
                              Verify
                            </Button>
                          ) : null}

                          {!canReview &&
                          canView ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedReview(
                                  item
                                )
                              }
                            >
                              <Eye
                                aria-hidden="true"
                              />
                              View
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }
              )}
            </TableBody>
          </Table>

          {filteredItems.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <FileCheck2
                className="size-9 text-slate-300"
                aria-hidden="true"
              />
              <h2 className="mt-4 font-semibold">
                No Laboratory result work items
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Results appear after a Reception Laboratory request enters the active or completed Laboratory service workflow.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            Laboratory staff can view payment status but cannot mark a bill paid. A finalized result becomes printable or releasable only after Cashier clearance and Reception release authorization.
          </p>
        </div>
      </div>

      {selectedEntry ? (
        <LaboratoryResultEntryDialog
          key={`entry-${selectedEntry.serviceRequestId}-${selectedEntry.documentUpdatedAt ?? "new"}`}
          workItem={selectedEntry}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedEntry(null)
            }
          }}
        />
      ) : null}

      {selectedReview ? (
        <LaboratoryResultReviewDialog
          key={`review-${selectedReview.documentId}-${selectedReview.documentUpdatedAt}`}
          workItem={selectedReview}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedReview(null)
            }
          }}
        />
      ) : null}
    </main>
  )
}
