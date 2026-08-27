"use client"

import {
  useMemo,
  useState,
  useTransition,
} from "react"
import {
  ArrowLeft,
  Eye,
  FileCheck2,
  KeyRound,
  LoaderCircle,
  LogOut,
  PackageCheck,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"

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
  ReceptionDocumentStatusBadge,
  ReceptionPaymentStatusBadge,
  ReceptionReleaseStatusBadge,
} from "@/features/hospital-operations/components/reception-release-badges"
import {
  ReceptionReleaseDetailsSheet,
} from "@/features/hospital-operations/components/reception-release-details-sheet"
import {
  ReceptionReleaseDialog,
} from "@/features/hospital-operations/components/reception-release-dialog"
import {
  RECEPTION_DOCUMENT_TYPES,
  RECEPTION_RELEASE_STATUSES,
  type ReceptionDocumentType,
  type ReceptionReleaseCenterPageData,
  type ReceptionReleaseStatus,
} from "@/features/hospital-operations/types/reception-release.types"
import {
  canPrintReceptionDocument,
  canReleaseReceptionDocument,
  formatReceptionDateTime,
  getReceptionPatientFullName,
  normalizeReceptionReleaseSearch,
  RECEPTION_DOCUMENT_TYPE_LABELS,
  RECEPTION_RELEASE_STATUS_LABELS,
} from "@/features/hospital-operations/utils/reception-release.utils"
import { cn } from "@/lib/utils"

interface ReceptionReleaseWorkspaceProps {
  context: StaffContext
  data: ReceptionReleaseCenterPageData
}

export function ReceptionReleaseWorkspace({
  context,
  data,
}: ReceptionReleaseWorkspaceProps) {
  const router = useRouter()

  const [search, setSearch] =
    useState("")

  const [
    releaseStatusFilter,
    setReleaseStatusFilter,
  ] = useState<
    ReceptionReleaseStatus | "all"
  >("all")

  const [
    documentTypeFilter,
    setDocumentTypeFilter,
  ] = useState<
    ReceptionDocumentType | "all"
  >("all")

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("all")

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] = useState<string | null>(
    null
  )

  const [
    releaseDocumentId,
    setReleaseDocumentId,
  ] = useState<string | null>(
    null
  )

  const [
    isRefreshing,
    startRefresh,
  ] = useTransition()

  const selectedItem =
    selectedDocumentId
      ? data.items.find(
          (item) =>
            item.documentId ===
            selectedDocumentId
        ) ?? null
      : null

  const releaseItem =
    releaseDocumentId
      ? data.items.find(
          (item) =>
            item.documentId ===
            releaseDocumentId
        ) ?? null
      : null

  const availableBranches =
    useMemo(
      () =>
        Array.from(
          new Map(
            data.items.map(
              (item) => [
                item.branchId,
                item.branchName,
              ]
            )
          )
        ).sort(
          (
            firstEntry,
            secondEntry
          ) =>
            firstEntry[1].localeCompare(
              secondEntry[1],
              "en-PH"
            )
        ),
      [data.items]
    )

  const filteredItems =
    useMemo(
      () =>
        data.items.filter(
          (item) => {
            const matchesSearch =
              normalizeReceptionReleaseSearch(
                item.documentNumber,
                item.title,
                item.patient
                  .medicalRecordNumber,
                getReceptionPatientFullName(
                  item
                ),
                item.visitNumber,
                item.requestNumber,
                item.serviceName,
                item.branchName
              ).includes(
                normalizeReceptionReleaseSearch(
                  search
                )
              )

            const matchesStatus =
              releaseStatusFilter ===
                "all" ||
              item.releaseStatus ===
                releaseStatusFilter

            const matchesType =
              documentTypeFilter ===
                "all" ||
              item.documentType ===
                documentTypeFilter

            const matchesBranch =
              branchFilter ===
                "all" ||
              item.branchId ===
                branchFilter

            return (
              matchesSearch &&
              matchesStatus &&
              matchesType &&
              matchesBranch
            )
          }
        ),
      [
        branchFilter,
        data.items,
        documentTypeFilter,
        releaseStatusFilter,
        search,
      ]
    )

  const pendingCount =
    data.items.filter(
      (item) =>
        item.releaseStatus ===
        "payment_pending"
    ).length

  const readyCount =
    data.items.filter(
      (item) =>
        item.releaseStatus ===
        "ready"
    ).length

  const releasedCount =
    data.items.filter(
      (item) =>
        item.releaseStatus ===
        "released"
    ).length

  const blockedCount =
    data.items.filter(
      (item) =>
        item.releaseStatus ===
          "blocked" ||
        item.releaseStatus ===
          "voided"
    ).length

  function refreshPage() {
    startRefresh(() => {
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
                Reception Release Center · {context.fullName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/reception/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <ArrowLeft
                aria-hidden="true"
              />
              Reception dashboard
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

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
              <PackageCheck
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-teal-700">
                Clinically finalized + payment controlled
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Patient Document Release Center
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Review finalized clinical
                documents, confirm Cashier
                clearance, print eligible
                patient copies, and retain an
                append-only release history.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isRefreshing}
            onClick={refreshPage}
          >
            {isRefreshing ? (
              <LoaderCircle
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw
                aria-hidden="true"
              />
            )}
            Refresh
          </Button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-amber-700">
                Payment pending
              </p>
              <p className="mt-1 text-xl font-semibold text-amber-800">
                {pendingCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">
                Ready for release
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">
                {readyCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-200 bg-teal-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-teal-700">
                Released
              </p>
              <p className="mt-1 text-xl font-semibold text-teal-800">
                {releasedCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-rose-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-rose-700">
                Blocked / voided
              </p>
              <p className="mt-1 text-xl font-semibold text-rose-800">
                {blockedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_220px_220px_220px_auto]">
            <div className="relative min-w-0">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                className="pl-8"
                placeholder="Search patient, MRN, document, visit, request, service, or branch"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={releaseStatusFilter}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setReleaseStatusFilter(
                  event.target.value as
                    | ReceptionReleaseStatus
                    | "all"
                )
              }
            >
              <option value="all">
                All release statuses
              </option>
              {RECEPTION_RELEASE_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {
                      RECEPTION_RELEASE_STATUS_LABELS[
                        status
                      ]
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={documentTypeFilter}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setDocumentTypeFilter(
                  event.target.value as
                    | ReceptionDocumentType
                    | "all"
                )
              }
            >
              <option value="all">
                All document types
              </option>
              {RECEPTION_DOCUMENT_TYPES.map(
                (documentType) => (
                  <option
                    key={documentType}
                    value={documentType}
                  >
                    {
                      RECEPTION_DOCUMENT_TYPE_LABELS[
                        documentType
                      ]
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={branchFilter}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setBranchFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All assigned branches
              </option>
              {availableBranches.map(
                ([branchId, branchName]) => (
                  <option
                    key={branchId}
                    value={branchId}
                  >
                    {branchName}
                  </option>
                )
              )}
            </select>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("")
                setReleaseStatusFilter(
                  "all"
                )
                setDocumentTypeFilter(
                  "all"
                )
                setBranchFilter("all")
              }}
            >
              Clear filters
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white">
          {filteredItems.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <FileCheck2
                className="size-9 text-slate-400"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-lg font-semibold">
                No release-center records found
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Finalized documents will appear
                here after a clinical module
                completes verification. Payment
                clearance controls whether a
                patient copy can be printed and
                released.
              </p>
            </div>
          ) : (
            <Table className="min-w-[1450px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Patient
                  </TableHead>
                  <TableHead>
                    Document
                  </TableHead>
                  <TableHead>
                    Visit / service
                  </TableHead>
                  <TableHead>
                    Clinical
                  </TableHead>
                  <TableHead>
                    Payment
                  </TableHead>
                  <TableHead>
                    Release
                  </TableHead>
                  <TableHead>
                    Finalized
                  </TableHead>
                  <TableHead>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredItems.map(
                  (item) => {
                    const canPrint =
                      canPrintReceptionDocument(
                        item
                      )
                    const canRelease =
                      canReleaseReceptionDocument(
                        item
                      )

                    return (
                      <TableRow
                        key={item.documentId}
                      >
                        <TableCell>
                          <p className="font-medium">
                            {getReceptionPatientFullName(
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
                            {item.title}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {item.documentNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              RECEPTION_DOCUMENT_TYPE_LABELS[
                                item.documentType
                              ]
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-mono text-xs">
                            {item.visitNumber}
                          </p>
                          <p className="mt-1 text-sm">
                            {item.serviceName ??
                              item.serviceType ??
                              "Not linked"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.branchName}
                          </p>
                        </TableCell>

                        <TableCell>
                          <ReceptionDocumentStatusBadge
                            status={
                              item.documentStatus
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <ReceptionPaymentStatusBadge
                            status={
                              item.paymentStatus
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <ReceptionReleaseStatusBadge
                            status={
                              item.releaseStatus
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {formatReceptionDateTime(
                            item.finalizedAt
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-80 flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedDocumentId(
                                  item.documentId
                                )
                              }
                            >
                              <Eye
                                aria-hidden="true"
                              />
                              Details
                            </Button>

                            {canPrint ? (
                              <Link
                                href={`/reception/releases/${item.documentId}/print`}
                                className={cn(
                                  buttonVariants({
                                    size: "sm",
                                    variant:
                                      "outline",
                                  })
                                )}
                              >
                                <Printer
                                  aria-hidden="true"
                                />
                                Print
                              </Link>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled
                              >
                                <Printer
                                  aria-hidden="true"
                                />
                                Locked
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              disabled={!canRelease}
                              className="bg-emerald-700 text-white hover:bg-emerald-800"
                              onClick={() =>
                                setReleaseDocumentId(
                                  item.documentId
                                )
                              }
                            >
                              <PackageCheck
                                aria-hidden="true"
                              />
                              Release
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          )}
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            Reception cannot change clinical
            content or payment status. It can
            only print and release documents
            that the database marks ready.
          </p>
        </div>
      </div>

      <ReceptionReleaseDetailsSheet
        item={selectedItem}
        open={Boolean(selectedItem)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedDocumentId(
              null
            )
          }
        }}
        onRelease={(item) => {
          setSelectedDocumentId(null)
          setReleaseDocumentId(
            item.documentId
          )
        }}
      />

      {releaseItem ? (
        <ReceptionReleaseDialog
          key={`${releaseItem.documentId}-${releaseItem.releaseRecords.length}`}
          item={releaseItem}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setReleaseDocumentId(
                null
              )
            }
          }}
        />
      ) : null}
    </main>
  )
}
