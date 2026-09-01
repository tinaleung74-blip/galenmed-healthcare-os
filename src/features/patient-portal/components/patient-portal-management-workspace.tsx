"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  ArrowLeft,
  KeyRound,
  LogOut,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react"
import Link from "next/link"

import {
  GalenMedLogo,
} from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Input,
} from "@/components/ui/input"
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
  CreatePatientPortalAccountDialog,
} from "@/features/patient-portal/components/create-patient-portal-account-dialog"
import {
  PatientPortalStatusBadge,
} from "@/features/patient-portal/components/patient-portal-status-badge"
import {
  PatientPortalStatusDialog,
} from "@/features/patient-portal/components/patient-portal-status-dialog"
import type {
  PatientPortalManagementData,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  formatPatientPortalDateTime,
  getPatientPortalFullName,
  normalizePatientPortalSearch,
} from "@/features/patient-portal/utils/patient-portal.utils"
import {
  cn,
} from "@/lib/utils"

interface PatientPortalManagementWorkspaceProps {
  context:
    StaffContext
  data:
    PatientPortalManagementData
}

export function PatientPortalManagementWorkspace({
  context,
  data,
}: PatientPortalManagementWorkspaceProps) {
  const [
    search,
    setSearch,
  ] = useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all")

  const [
    createPatientId,
    setCreatePatientId,
  ] = useState<
    string | null
  >(null)

  const [
    statusPatientId,
    setStatusPatientId,
  ] = useState<
    string | null
  >(null)

  const filteredPatients =
    useMemo(
      () =>
        data.patients.filter(
          (patient) => {
            const searchable =
              normalizePatientPortalSearch(
                patient.medicalRecordNumber,
                patient.firstName,
                patient.middleName,
                patient.lastName,
                patient.emailAddress,
                patient.mobileNumber,
                patient.branchName,
                patient.portalAccount
                  ?.loginEmail
              )

            const matchesSearch =
              searchable.includes(
                normalizePatientPortalSearch(
                  search
                )
              )

            const accountStatus =
              patient.portalAccount
                ?.status ??
              "not-created"

            const matchesStatus =
              statusFilter ===
                "all" ||
              accountStatus ===
                statusFilter

            return (
              matchesSearch &&
              matchesStatus
            )
          }
        ),
      [
        data.patients,
        search,
        statusFilter,
      ]
    )

  const createdCount =
    data.patients.filter(
      (patient) =>
        patient.portalAccount
    ).length

  const activeCount =
    data.patients.filter(
      (patient) =>
        patient.portalAccount
          ?.status ===
        "active"
    ).length

  const restrictedCount =
    data.patients.filter(
      (patient) =>
        patient.portalAccount
          ?.status ===
          "locked" ||
        patient.portalAccount
          ?.status ===
          "suspended"
    ).length

  const createPatient =
    createPatientId
      ? data.patients.find(
          (patient) =>
            patient.patientId ===
            createPatientId
        ) ?? null
      : null

  const statusPatient =
    statusPatientId
      ? data.patients.find(
          (patient) =>
            patient.patientId ===
            statusPatientId
        ) ?? null
      : null

  const primaryRole =
    context.roles[0]?.name ??
    "Authorized Staff"

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
                Patient Portal Administration
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/reception/dashboard"
              className={cn(
                buttonVariants({
                  variant:
                    "outline",
                })
              )}
            >
              <ArrowLeft
                aria-hidden="true"
              />
              Reception Dashboard
            </Link>

            <Link
              href="/reception/intake"
              className={cn(
                buttonVariants({
                  variant:
                    "default",
                })
              )}
            >
              <UserPlus
                aria-hidden="true"
              />
              Register patient
            </Link>

            <Link
              href="/staff/account/change-password"
              className={cn(
                buttonVariants({
                  variant:
                    "outline",
                })
              )}
            >
              <KeyRound
                aria-hidden="true"
              />
              Change password
            </Link>

            <form
              action={
                signOutStaff
              }
            >
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
        <section>
          <p className="text-sm font-semibold text-teal-700">
            Protected identity-linking workspace
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Patient Portal Account Management
          </h1>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Create one Patient Portal
            login for one verified
            GalenMed patient record.
            Manage access without exposing
            staff roles or hospital-wide
            records.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Registered patients
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {
                  data.patients.length
                }
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Portal accounts
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {createdCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Active accounts
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {activeCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Restricted accounts
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {restrictedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-xl">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <Input
                  value={search}
                  placeholder="Search patient, MRN, email, mobile, or branch"
                  className="pl-9"
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <select
                value={
                  statusFilter
                }
                className="h-9 rounded-lg border bg-background px-3 text-sm"
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  All portal statuses
                </option>
                <option value="not-created">
                  Not created
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
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Patient
                    </TableHead>
                    <TableHead>
                      Branch
                    </TableHead>
                    <TableHead>
                      Portal login
                    </TableHead>
                    <TableHead>
                      Status
                    </TableHead>
                    <TableHead>
                      Last login
                    </TableHead>
                    <TableHead className="text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredPatients.length >
                  0 ? (
                    filteredPatients.map(
                      (patient) => {
                        const fullName =
                          getPatientPortalFullName(
                            patient
                          )

                        return (
                          <TableRow
                            key={
                              patient.patientId
                            }
                          >
                            <TableCell>
                              <p className="font-semibold">
                                {fullName}
                              </p>

                              <p className="mt-1 font-mono text-xs text-muted-foreground">
                                {
                                  patient.medicalRecordNumber
                                }
                              </p>
                            </TableCell>

                            <TableCell>
                              {
                                patient.branchName
                              }
                            </TableCell>

                            <TableCell>
                              <p className="max-w-xs break-all text-sm">
                                {
                                  patient.portalAccount
                                    ?.loginEmail ??
                                  "Not created"
                                }
                              </p>
                            </TableCell>

                            <TableCell>
                              {patient.portalAccount ? (
                                <PatientPortalStatusBadge
                                  status={
                                    patient.portalAccount.status
                                  }
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No account
                                </span>
                              )}
                            </TableCell>

                            <TableCell>
                              {
                                formatPatientPortalDateTime(
                                  patient
                                    .portalAccount
                                    ?.lastLoginAt ??
                                    null
                                )
                              }
                            </TableCell>

                            <TableCell className="text-right">
                              {patient.portalAccount ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setStatusPatientId(
                                      patient.patientId
                                    )
                                  }
                                >
                                  <ShieldCheck
                                    aria-hidden="true"
                                  />
                                  Manage
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={
                                    patient.patientStatus !==
                                    "active"
                                  }
                                  onClick={() =>
                                    setCreatePatientId(
                                      patient.patientId
                                    )
                                  }
                                >
                                  <UserPlus
                                    aria-hidden="true"
                                  />
                                  Create login
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      }
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-40 text-center"
                      >
                        <UsersRound
                          className="mx-auto size-7 text-slate-400"
                          aria-hidden="true"
                        />

                        <p className="mt-3 font-semibold">
                          No matching patients
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Adjust the search or
                          status filter.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Signed in as {
                context.fullName
              } — {primaryRole}
            </p>
          </CardContent>
        </Card>
      </div>

      {createPatient ? (
        <CreatePatientPortalAccountDialog
          key={
            createPatient.patientId
          }
          patient={
            createPatient
          }
          open
          onOpenChange={(
            nextOpen
          ) => {
            if (!nextOpen) {
              setCreatePatientId(
                null
              )
            }
          }}
        />
      ) : null}

      {statusPatient ? (
        <PatientPortalStatusDialog
          key={
            `${statusPatient.patientId}-${statusPatient.portalAccount?.status ?? "none"}`
          }
          patient={
            statusPatient
          }
          open
          onOpenChange={(
            nextOpen
          ) => {
            if (!nextOpen) {
              setStatusPatientId(
                null
              )
            }
          }}
        />
      ) : null}
    </main>
  )
}
