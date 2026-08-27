"use client"

import {
  useMemo,
  useState,
  useTransition,
} from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FlaskConical,
  KeyRound,
  LoaderCircle,
  LogOut,
  Megaphone,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserRoundX,
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
  advanceLaboratoryQueueAction,
} from "@/features/hospital-operations/actions/laboratory-queue.actions"
import {
  LaboratoryQueueCancelDialog,
} from "@/features/hospital-operations/components/laboratory-queue-cancel-dialog"
import {
  LABORATORY_QUEUE_PRIORITIES,
  LABORATORY_QUEUE_STATUSES,
  type LaboratoryQueueAction,
  type LaboratoryQueueEntryRecord,
  type LaboratoryQueuePageData,
  type LaboratoryQueuePriority,
  type LaboratoryQueueStatus,
} from "@/features/hospital-operations/types/laboratory-queue.types"
import {
  formatLaboratoryAmount,
  formatLaboratoryDateTime,
  getAvailableLaboratoryQueueActions,
  getLaboratoryPatientFullName,
  getLaboratoryPatientInitials,
  LABORATORY_PAYMENT_CLEARANCE_LABELS,
  LABORATORY_QUEUE_ACTION_LABELS,
  LABORATORY_QUEUE_PRIORITY_LABELS,
  LABORATORY_QUEUE_STATUS_LABELS,
  normalizeLaboratoryQueueSearch,
} from "@/features/hospital-operations/utils/laboratory-queue.utils"
import { cn } from "@/lib/utils"

interface LaboratoryQueueWorkspaceProps {
  context: StaffContext
  data: LaboratoryQueuePageData
}

function queueStatusClassName(
  status: LaboratoryQueueStatus
): string {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (
    status === "called" ||
    status === "in_service"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-700"
  }

  if (status === "waiting") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  return "border-rose-200 bg-rose-50 text-rose-700"
}

function priorityClassName(
  priority: LaboratoryQueuePriority
): string {
  if (
    priority === "emergency" ||
    priority === "stat"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (priority === "urgent") {
    return "border-orange-200 bg-orange-50 text-orange-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-700"
}

function clearanceClassName(
  status: string | null
): string {
  if (
    status === "cleared" ||
    status === "waived"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (
    status === "blocked" ||
    status === "revoked"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
}

function StatusBadge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  )
}

function getActionIcon(
  action: LaboratoryQueueAction
) {
  if (action === "call") {
    return Megaphone
  }

  if (action === "start") {
    return Play
  }

  if (action === "complete") {
    return CheckCircle2
  }

  if (action === "no_show") {
    return UserRoundX
  }

  return TriangleAlert
}

export function LaboratoryQueueWorkspace({
  context,
  data,
}: LaboratoryQueueWorkspaceProps) {
  const router = useRouter()

  const [search, setSearch] =
    useState("")

  const [branchFilter, setBranchFilter] =
    useState("all")

  const [statusFilter, setStatusFilter] =
    useState<
      LaboratoryQueueStatus | "all"
    >("all")

  const [priorityFilter, setPriorityFilter] =
    useState<
      LaboratoryQueuePriority | "all"
    >("all")

  const [pendingQueueEntryId, setPendingQueueEntryId] =
    useState<string | null>(null)

  const [cancelEntry, setCancelEntry] =
    useState<LaboratoryQueueEntryRecord | null>(
      null
    )

  const [isPending, startTransition] =
    useTransition()

  const filteredEntries =
    useMemo(
      () =>
        data.queueEntries.filter(
          (entry) => {
            const matchesSearch =
              normalizeLaboratoryQueueSearch(
                entry.queueNumber,
                entry.requestNumber,
                entry.visitNumber,
                entry.patient.medicalRecordNumber,
                getLaboratoryPatientFullName(
                  entry
                ),
                entry.serviceCode,
                entry.serviceName,
                entry.doctorOrderReference,
                entry.branchName
              ).includes(
                normalizeLaboratoryQueueSearch(
                  search
                )
              )

            const matchesBranch =
              branchFilter === "all" ||
              entry.branchId === branchFilter

            const matchesStatus =
              statusFilter === "all" ||
              entry.status === statusFilter

            const matchesPriority =
              priorityFilter === "all" ||
              entry.priority === priorityFilter

            return (
              matchesSearch &&
              matchesBranch &&
              matchesStatus &&
              matchesPriority
            )
          }
        ),
      [
        branchFilter,
        data.queueEntries,
        priorityFilter,
        search,
        statusFilter,
      ]
    )

  const waitingCount =
    data.queueEntries.filter(
      (entry) =>
        entry.status === "waiting"
    ).length

  const calledCount =
    data.queueEntries.filter(
      (entry) =>
        entry.status === "called"
    ).length

  const inServiceCount =
    data.queueEntries.filter(
      (entry) =>
        entry.status === "in_service"
    ).length

  const completedCount =
    data.queueEntries.filter(
      (entry) =>
        entry.status === "completed"
    ).length

  function runQueueAction(
    entry: LaboratoryQueueEntryRecord,
    action: LaboratoryQueueAction,
    reason = ""
  ) {
    if (
      action === "no_show" &&
      !window.confirm(
        `Mark ${entry.queueNumber} as no-show?`
      )
    ) {
      return
    }

    setPendingQueueEntryId(entry.id)

    startTransition(async () => {
      const result =
        await advanceLaboratoryQueueAction({
          queueEntryId: entry.id,
          action,
          reason,
        })

      if (!result.success) {
        toast.error(
          "Laboratory queue update failed",
          {
            description:
              result.message,
          }
        )

        setPendingQueueEntryId(null)
        return
      }

      toast.success(
        LABORATORY_QUEUE_ACTION_LABELS[
          action
        ],
        {
          description:
            result.message,
        }
      )

      setCancelEntry(null)
      setPendingQueueEntryId(null)
      router.refresh()
    })
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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
                Laboratory Operations
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
              <ArrowLeft aria-hidden="true" />
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
              <KeyRound aria-hidden="true" />
              Change password
            </Link>

            <form action={signOutStaff}>
              <Button
                type="submit"
                variant="outline"
              >
                <LogOut aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
              <FlaskConical
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-violet-700">
                Today&apos;s department queue
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Laboratory Patient Queue
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                View queued patients and requested tests, call patients, start service, and complete the queue workflow. Payment status is read-only here and does not allow Laboratory staff to mark a bill as paid.
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
            Refresh queue
          </Button>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-amber-700"
            aria-hidden="true"
          />

          <div>
            <p className="font-semibold">
              Clinical processing and payment release are separate controls
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              Laboratory staff may process the requested service according to hospital policy. Patient-facing results remain locked until a verifier finalizes the result and the Cashier clears payment in the later release workflow.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-amber-700">
                Waiting
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-800">
                {waitingCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-sky-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-sky-700">
                Called
              </p>
              <p className="mt-1 text-2xl font-semibold text-sky-800">
                {calledCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-violet-700">
                In service
              </p>
              <p className="mt-1 text-2xl font-semibold text-violet-800">
                {inServiceCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">
                Completed today
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">
                {completedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1 xl:max-w-xl">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                placeholder="Search queue, patient, MRN, request, visit, or test"
                className="pl-9"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={branchFilter}
              className="h-8 min-w-48 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setBranchFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All assigned branches
              </option>

              {data.branches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                  </option>
                )
              )}
            </select>

            <select
              value={statusFilter}
              className="h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | LaboratoryQueueStatus
                    | "all"
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              {LABORATORY_QUEUE_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {
                      LABORATORY_QUEUE_STATUS_LABELS[
                        status
                      ]
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={priorityFilter}
              className="h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as
                    | LaboratoryQueuePriority
                    | "all"
                )
              }
            >
              <option value="all">
                All priorities
              </option>

              {LABORATORY_QUEUE_PRIORITIES.map(
                (priority) => (
                  <option
                    key={priority}
                    value={priority}
                  >
                    {
                      LABORATORY_QUEUE_PRIORITY_LABELS[
                        priority
                      ]
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filteredEntries.length} of {data.queueEntries.length} queue entries for the current Manila date.
          </p>
        </section>

        <div className="overflow-hidden rounded-xl border bg-white">
          {filteredEntries.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <Clock3
                className="size-10 text-slate-300"
                aria-hidden="true"
              />

              <h2 className="mt-4 text-lg font-semibold">
                No Laboratory queue entries found
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Laboratory requests created by Reception will appear here after the patient is routed to an active Laboratory service with a queue entry.
              </p>
            </div>
          ) : (
            <Table className="min-w-[1700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Queue</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Requested test</TableHead>
                  <TableHead>Request / Visit</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Queue status</TableHead>
                  <TableHead>Payment status</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredEntries.map(
                  (entry) => {
                    const actions =
                      getAvailableLaboratoryQueueActions(
                        entry.status
                      )

                    const isEntryPending =
                      isPending &&
                      pendingQueueEntryId ===
                        entry.id

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <p className="font-mono text-sm font-semibold">
                            {entry.queueNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Sequence {entry.queueSequence}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {entry.branchName}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-64 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-violet-700">
                              {getLaboratoryPatientInitials(
                                entry
                              )}
                            </div>

                            <div>
                              <p className="font-medium">
                                {getLaboratoryPatientFullName(
                                  entry
                                )}
                              </p>
                              <p className="mt-1 font-mono text-xs text-muted-foreground">
                                {entry.patient.medicalRecordNumber}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {entry.patient.biologicalSex}
                                {" · DOB "}
                                {entry.patient.dateOfBirth}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="max-w-sm whitespace-normal">
                            <p className="font-medium">
                              {entry.serviceName}
                            </p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              {entry.serviceCode ?? "No catalog code"}
                            </p>

                            {entry.doctorOrderRequired ? (
                              <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs text-sky-800">
                                Doctor order: {entry.doctorOrderReference ?? "Required reference unavailable"}
                              </div>
                            ) : null}

                            {entry.requestNotes ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {entry.requestNotes}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {entry.requestNumber}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {entry.visitNumber}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Request: {entry.requestStatus}
                          </p>
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            label={LABORATORY_QUEUE_PRIORITY_LABELS[entry.priority]}
                            className={priorityClassName(
                              entry.priority
                            )}
                          />
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            label={LABORATORY_QUEUE_STATUS_LABELS[entry.status]}
                            className={queueStatusClassName(
                              entry.status
                            )}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="min-w-48">
                            <StatusBadge
                              label={
                                entry.paymentClearanceStatus
                                  ? LABORATORY_PAYMENT_CLEARANCE_LABELS[
                                      entry.paymentClearanceStatus
                                    ]
                                  : "Not available"
                              }
                              className={clearanceClassName(
                                entry.paymentClearanceStatus
                              )}
                            />

                            <p className="mt-2 text-xs text-muted-foreground">
                              Cleared {formatLaboratoryAmount(entry.clearedAmountCentavos)} of {formatLaboratoryAmount(entry.requiredAmountCentavos)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="min-w-52 text-xs text-muted-foreground">
                            <p>
                              Created: {formatLaboratoryDateTime(entry.createdAt)}
                            </p>
                            <p className="mt-1">
                              Called: {formatLaboratoryDateTime(entry.calledAt, "Not called")}
                            </p>
                            <p className="mt-1">
                              Started: {formatLaboratoryDateTime(entry.serviceStartedAt, "Not started")}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {actions.length === 0 ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Eye
                                className="size-4"
                                aria-hidden="true"
                              />
                              No queue action available
                            </div>
                          ) : (
                            <div className="flex min-w-[420px] flex-wrap gap-2">
                              {actions.map(
                                (action) => {
                                  const Icon =
                                    getActionIcon(
                                      action
                                    )

                                  return (
                                    <Button
                                      key={action}
                                      type="button"
                                      size="sm"
                                      variant={
                                        action === "cancel" ||
                                        action === "no_show"
                                          ? "outline"
                                          : "default"
                                      }
                                      disabled={isPending}
                                      onClick={() => {
                                        if (action === "cancel") {
                                          setCancelEntry(entry)
                                          return
                                        }

                                        runQueueAction(
                                          entry,
                                          action
                                        )
                                      }}
                                    >
                                      {isEntryPending ? (
                                        <LoaderCircle
                                          className="animate-spin"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <Icon aria-hidden="true" />
                                      )}
                                      {
                                        LABORATORY_QUEUE_ACTION_LABELS[
                                          action
                                        ]
                                      }
                                    </Button>
                                  )
                                }
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-xl border border-dashed bg-white p-5 text-sm text-muted-foreground">
          Signed in as {context.fullName}. Laboratory result entry, result verification, internal transmission to Reception, and payment-gated patient release will be added in the next Laboratory Results phase.
        </div>
      </div>

      {cancelEntry ? (
        <LaboratoryQueueCancelDialog
          key={cancelEntry.id}
          entry={cancelEntry}
          open
          isSubmitting={
            isPending &&
            pendingQueueEntryId ===
              cancelEntry.id
          }
          onOpenChange={(open) => {
            if (!open && !isPending) {
              setCancelEntry(null)
            }
          }}
          onConfirm={(reason) =>
            runQueueAction(
              cancelEntry,
              "cancel",
              reason
            )
          }
        />
      ) : null}
    </main>
  )
}
