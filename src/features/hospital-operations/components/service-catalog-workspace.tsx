"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Tags,
} from "lucide-react"
import Link from "next/link"

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
  ServiceCatalogDialog,
} from "@/features/hospital-operations/components/service-catalog-dialog"
import {
  HOSPITAL_SERVICE_TYPES,
  type HospitalServiceType,
  type ServiceCatalogItem,
  type ServiceCatalogPageData,
} from "@/features/hospital-operations/types/service-catalog.types"
import {
  formatServicePrice,
  normalizeServiceSearch,
  SERVICE_TYPE_LABELS,
} from "@/features/hospital-operations/utils/service-catalog.utils"
import { cn } from "@/lib/utils"

interface ServiceCatalogWorkspaceProps {
  context: StaffContext
  data: ServiceCatalogPageData
}

export function ServiceCatalogWorkspace({
  context,
  data,
}: ServiceCatalogWorkspaceProps) {
  const [search, setSearch] =
    useState("")

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<
    HospitalServiceType | "all"
  >("all")

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | "active" | "inactive"
  >("all")

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("all")

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState<string | null>(
    null
  )

  const [
    isDialogOpen,
    setIsDialogOpen,
  ] = useState(false)

  const [
    dialogSession,
    setDialogSession,
  ] = useState(0)

  const selectedItem =
    selectedItemId
      ? data.items.find(
          (item) =>
            item.id ===
            selectedItemId
        ) ?? null
      : null

  const filteredItems =
    useMemo(
      () =>
        data.items.filter(
          (item) => {
            const matchesSearch =
              normalizeServiceSearch(
                item.code,
                item.name,
                item.description,
                SERVICE_TYPE_LABELS[
                  item.serviceType
                ],
                item.departmentCode,
                item.departmentName,
                item.branchCode,
                item.branchName
              ).includes(
                normalizeServiceSearch(
                  search
                )
              )

            const matchesType =
              typeFilter === "all" ||
              item.serviceType ===
                typeFilter

            const matchesStatus =
              statusFilter === "all" ||
              (
                statusFilter ===
                  "active" &&
                item.active
              ) ||
              (
                statusFilter ===
                  "inactive" &&
                !item.active
              )

            const matchesBranch =
              branchFilter === "all" ||
              (
                branchFilter ===
                  "global" &&
                item.branchId === null
              ) ||
              item.branchId ===
                branchFilter

            return (
              matchesSearch &&
              matchesType &&
              matchesStatus &&
              matchesBranch
            )
          }
        ),
      [
        branchFilter,
        data.items,
        search,
        statusFilter,
        typeFilter,
      ]
    )

  const activeCount =
    data.items.filter(
      (item) => item.active
    ).length

  const laboratoryCount =
    data.items.filter(
      (item) =>
        item.serviceType ===
        "laboratory" &&
        item.active
    ).length

  const globalCount =
    data.items.filter(
      (item) =>
        item.branchId === null &&
        item.active
    ).length

  function openCreateDialog() {
    setSelectedItemId(null)
    setDialogSession(
      (currentSession) =>
        currentSession + 1
    )
    setIsDialogOpen(true)
  }

  function openEditDialog(
    item: ServiceCatalogItem
  ) {
    setSelectedItemId(item.id)
    setDialogSession(
      (currentSession) =>
        currentSession + 1
    )
    setIsDialogOpen(true)
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
                System Administration · {context.fullName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/admin/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <ArrowLeft
                aria-hidden="true"
              />
              Admin dashboard
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
        <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
              <Tags
                className="size-6"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-teal-700">
                Approved hospital services
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Service Catalog Management
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Configure consultation,
                laboratory, radiology,
                pharmacy, procedure, and
                other services used by
                Receptionist intake, queues,
                and automatic billing.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={openCreateDialog}
          >
            <Plus aria-hidden="true" />
            Create service
          </Button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Stethoscope
                className="size-4 text-sky-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Total services
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {data.items.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <CheckCircle2
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-emerald-700">
                  Active services
                </p>
                <p className="mt-1 text-xl font-semibold text-emerald-800">
                  {activeCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Tags
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-violet-700">
                  Laboratory services
                </p>
                <p className="mt-1 text-xl font-semibold text-violet-800">
                  {laboratoryCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Building2
                className="size-4 text-amber-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-amber-700">
                  All-branch services
                </p>
                <p className="mt-1 text-xl font-semibold text-amber-800">
                  {globalCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                placeholder="Search code, service, department, branch, or type"
                className="pl-8"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={typeFilter}
              className="h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as
                    | HospitalServiceType
                    | "all"
                )
              }
            >
              <option value="all">
                All service types
              </option>

              {HOSPITAL_SERVICE_TYPES.map(
                (serviceType) => (
                  <option
                    key={serviceType}
                    value={serviceType}
                  >
                    {
                      SERVICE_TYPE_LABELS[
                        serviceType
                      ]
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={branchFilter}
              className="h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setBranchFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All branch scopes
              </option>
              <option value="global">
                All branches
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
              className="h-8 min-w-36 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | "active"
                    | "inactive"
                )
              }
            >
              <option value="all">
                All statuses
              </option>
              <option value="active">
                Active
              </option>
              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filteredItems.length} of{" "}
            {data.items.length} services
          </p>
        </section>

        {filteredItems.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-white p-8 text-center">
            <Tags
              className="size-9 text-muted-foreground"
              aria-hidden="true"
            />

            <h2 className="mt-4 text-lg font-semibold">
              No matching services
            </h2>

            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Create the approved hospital
              services that Receptionist intake
              can route to departments and bill
              automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table className="min-w-[1250px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Service
                  </TableHead>
                  <TableHead>
                    Type
                  </TableHead>
                  <TableHead>
                    Department
                  </TableHead>
                  <TableHead>
                    Branch scope
                  </TableHead>
                  <TableHead>
                    Default price
                  </TableHead>
                  <TableHead>
                    Rules
                  </TableHead>
                  <TableHead>
                    Status
                  </TableHead>
                  <TableHead>
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredItems.map(
                  (item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">
                          {item.name}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {item.code}
                        </p>
                        {item.description ? (
                          <p className="mt-2 max-w-sm whitespace-normal text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </TableCell>

                      <TableCell>
                        {
                          SERVICE_TYPE_LABELS[
                            item.serviceType
                          ]
                        }
                      </TableCell>

                      <TableCell>
                        <p>
                          {item.departmentName}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {item.departmentCode}
                        </p>
                      </TableCell>

                      <TableCell>
                        {item.branchName ??
                          "All active branches"}
                      </TableCell>

                      <TableCell className="font-semibold tabular-nums">
                        {formatServicePrice(
                          item.defaultPriceCentavos
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <p>
                            Doctor order:{" "}
                            {item.doctorOrderRequired
                              ? "Required"
                              : "Not required"}
                          </p>
                          <p>
                            Patient request:{" "}
                            {item.allowsPatientRequest
                              ? "Allowed"
                              : "Not allowed"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                            item.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          )}
                        >
                          {item.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openEditDialog(
                              item
                            )
                          }
                        >
                          <Pencil
                            aria-hidden="true"
                          />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-teal-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            Service changes are written through
            the guarded System Administrator RPC
            and retained in the hospital
            operations audit ledger. No direct
            browser table writes are used.
          </p>
        </div>
      </div>

      <ServiceCatalogDialog
        key={`${selectedItemId ?? "new"}-${dialogSession}`}
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          setIsDialogOpen(nextOpen)

          if (!nextOpen) {
            setSelectedItemId(null)
          }
        }}
        item={selectedItem}
        departments={data.departments}
        branches={data.branches}
      />
    </main>
  )
}
