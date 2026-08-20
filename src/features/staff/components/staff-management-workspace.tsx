"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  ArrowLeft,
  Building2,
  KeyRound,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  UsersRound,
} from "lucide-react"
import Link from "next/link"

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
import { signOutStaff } from "@/features/auth/actions/staff-auth.actions"
import type {
  StaffContext,
  StaffRoleCode,
} from "@/features/auth/types/staff-auth.types"
import { StaffAccountStatusDialog } from "@/features/staff/components/staff-account-status-dialog"
import { CreateStaffAccountDialog } from "@/features/staff/components/create-staff-account-dialog"
import { StaffAccountStatusBadge } from "@/features/staff/components/staff-management-badges"
import type {
  StaffManagementData,
} from "@/features/staff/types/staff-management.types"
import { cn } from "@/lib/utils"

interface StaffManagementWorkspaceProps {
  context: StaffContext
  data: StaffManagementData
}

function normalizeSearch(
  ...values: Array<
    string | null | undefined
  >
): string {
  return values
    .filter(
      (value): value is string =>
        typeof value === "string"
    )
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-PH")
}

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "Never"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not recorded"
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date)
}

function getRoleLabel(
  roleCode: StaffRoleCode
): string {
  return roleCode
    .replace(/_/g, " ")
    .toLocaleLowerCase("en-PH")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}

export function StaffManagementWorkspace({
  context,
  data,
}: StaffManagementWorkspaceProps) {
  const [search, setSearch] =
    useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all")

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("all")

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    statusStaffId,
    setStatusStaffId,
  ] = useState<string | null>(
    null
  )

  const filteredStaff =
    useMemo(
      () =>
        data.staff.filter(
          (staff) => {
            const roleCodes =
              staff.roles.map(
                (role) => role.code
              )

            const matchesSearch =
              normalizeSearch(
                staff.fullName,
                staff.employeeId,
                staff.workEmail,
                staff.mobileNumber,
                staff.jobTitle,
                ...staff.roles.map(
                  (role) => role.name
                ),
                ...staff.branches.map(
                  (branch) => branch.name
                ),
                ...staff.departments.map(
                  (department) =>
                    department.name
                )
              ).includes(
                normalizeSearch(search)
              )

            const matchesStatus =
              statusFilter === "all" ||
              staff.accountStatus ===
                statusFilter

            const matchesRole =
              roleFilter === "all" ||
              roleCodes.includes(
                roleFilter as StaffRoleCode
              )

            return (
              matchesSearch &&
              matchesStatus &&
              matchesRole
            )
          }
        ),
      [
        data.staff,
        roleFilter,
        search,
        statusFilter,
      ]
    )

  const activeCount =
    data.staff.filter(
      (staff) =>
        staff.accountStatus ===
        "active"
    ).length

  const restrictedCount =
    data.staff.filter(
      (staff) =>
        staff.accountStatus ===
          "locked" ||
        staff.accountStatus ===
          "suspended"
    ).length

  const operationalCount =
    data.staff.filter(
      (staff) =>
        staff.roles.some(
          (role) =>
            role.code !==
            "SYSTEM_ADMIN"
        )
    ).length

  const selectedStatusStaff =
    statusStaffId
      ? data.staff.find(
          (staff) =>
            staff.id ===
            statusStaffId
        ) ?? null
      : null

  const availableRoleCodes =
    Array.from(
      new Set(
        data.staff.flatMap(
          (staff) =>
            staff.roles.map(
              (role) => role.code
            )
        )
      )
    )

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <ShieldCheck
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="font-semibold tracking-tight">
                GalenMed
              </p>
              <p className="text-xs text-muted-foreground">
                System Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              Dashboard
            </Link>

            <form action={signOutStaff}>
              <Button
                type="submit"
                variant="outline"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Protected administrator workspace
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Staff Account Management
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Create operational staff accounts,
              assign one role, configure branch and
              department access, and control account
              status. Every sensitive change is
              recorded in the GalenMed security
              ledger.
            </p>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() =>
              setIsCreateDialogOpen(true)
            }
          >
            <UserPlus
              aria-hidden="true"
            />
            Create staff account
          </Button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UsersRound
                className="size-5 text-sky-700"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-muted-foreground">
                  Total staff profiles
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {data.staff.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <ShieldCheck
                className="size-5 text-emerald-700"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-emerald-700">
                  Active accounts
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-900">
                  {activeCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UserCog
                className="size-5 text-violet-700"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-violet-700">
                  Operational accounts
                </p>
                <p className="mt-1 text-2xl font-semibold text-violet-900">
                  {operationalCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <KeyRound
                className="size-5 text-amber-700"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-amber-700">
                  Locked or suspended
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-900">
                  {restrictedCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                placeholder="Search name, email, employee ID, role, branch, or department"
                className="pl-9"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={statusFilter}
              className="h-9 min-w-44 rounded-lg border border-input bg-background px-3 text-sm"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All statuses
              </option>
              <option value="invited">
                Invited
              </option>
              <option value="active">
                Active
              </option>
              <option value="locked">
                Locked
              </option>
              <option value="suspended">
                Suspended
              </option>
              <option value="archived">
                Archived
              </option>
            </select>

            <select
              value={roleFilter}
              className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm"
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All roles
              </option>
              {availableRoleCodes.map(
                (roleCode) => (
                  <option
                    key={roleCode}
                    value={roleCode}
                  >
                    {getRoleLabel(roleCode)}
                  </option>
                )
              )}
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filteredStaff.length} of{" "}
            {data.staff.length} staff profiles
          </p>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white">
          <Table className="min-w-[1450px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Staff member
                </TableHead>
                <TableHead>
                  Role
                </TableHead>
                <TableHead>
                  Branch access
                </TableHead>
                <TableHead>
                  Department
                </TableHead>
                <TableHead>
                  Status
                </TableHead>
                <TableHead>
                  Last login
                </TableHead>
                <TableHead>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center text-muted-foreground"
                  >
                    No staff profiles match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map(
                  (staff) => {
                    const isCurrentUser =
                      staff.id ===
                      context.userId

                    return (
                      <TableRow
                        key={staff.id}
                      >
                        <TableCell>
                          <div className="min-w-64">
                            <p className="font-medium">
                              {staff.fullName}
                            </p>
                            <p className="mt-1 break-all text-xs text-muted-foreground">
                              {staff.workEmail}
                            </p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              {staff.employeeId ??
                                "Employee ID pending"}
                            </p>
                            {staff.jobTitle ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {staff.jobTitle}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-48 flex-wrap gap-2">
                            {staff.roles.length > 0 ? (
                              staff.roles.map(
                                (role) => (
                                  <span
                                    key={role.code}
                                    className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                                  >
                                    {role.name}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No active role
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="min-w-56 space-y-1">
                            {staff.branches.map(
                              (branch) => (
                                <p
                                  key={branch.id}
                                  className="text-sm"
                                >
                                  {branch.name}
                                  {branch.isPrimary ? (
                                    <span className="ml-2 text-xs font-medium text-teal-700">
                                      Primary
                                    </span>
                                  ) : null}
                                </p>
                              )
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="min-w-44 space-y-1">
                            {staff.departments.map(
                              (department) => (
                                <p
                                  key={department.id}
                                  className="text-sm"
                                >
                                  {department.name}
                                </p>
                              )
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <StaffAccountStatusBadge
                            status={staff.accountStatus}
                          />
                        </TableCell>

                        <TableCell>
                          <p className="min-w-44 text-sm">
                            {formatDateTime(
                              staff.lastLoginAt
                            )}
                          </p>
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isCurrentUser}
                            title={
                              isCurrentUser
                                ? "Use the dedicated administrator profile flow for your own account."
                                : undefined
                            }
                            onClick={() =>
                              setStatusStaffId(
                                staff.id
                              )
                            }
                          >
                            <UserCog
                              aria-hidden="true"
                            />
                            Change status
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )
              )}
            </TableBody>
          </Table>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-800">
          <Building2
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            Staff access is restricted by active account status,
            assigned role, hospital branch, department, and
            database permissions. Creating an account here does
            not grant SYSTEM_ADMIN access.
          </p>
        </div>
      </div>

      <CreateStaffAccountDialog
        key={
          isCreateDialogOpen
            ? "create-staff-open"
            : "create-staff-closed"
        }
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        roles={data.roles}
        branches={data.branches}
        departments={data.departments}
      />

      <StaffAccountStatusDialog
        key={
          selectedStatusStaff?.id ??
          "staff-status-closed"
        }
        staff={selectedStatusStaff}
        open={Boolean(
          selectedStatusStaff
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setStatusStaffId(null)
          }
        }}
      />
    </main>
  )
}
