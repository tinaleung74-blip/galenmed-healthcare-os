"use client"

import {
  useMemo,
  useState,
  useTransition,
} from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  LogIn,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  UsersRound,
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
  checkInReceptionVisitAction,
} from "@/features/hospital-operations/actions/reception-intake.actions"
import {
  ReceptionCreateServiceRequestDialog,
} from "@/features/hospital-operations/components/reception-create-service-request-dialog"
import {
  ReceptionCreateVisitDialog,
} from "@/features/hospital-operations/components/reception-create-visit-dialog"
import {
  ReceptionRegisterPatientDialog,
} from "@/features/hospital-operations/components/reception-register-patient-dialog"
import type {
  ReceptionIntakePageData,
  ReceptionVisitRecord,
} from "@/features/hospital-operations/types/reception-intake.types"
import {
  formatReceptionAmount,
  formatReceptionDate,
  formatReceptionDateTime,
  getReceptionPatientFullName,
  getReceptionPatientInitials,
  normalizeReceptionSearch,
  RECEPTION_PRIORITY_LABELS,
  RECEPTION_QUEUE_STATUS_LABELS,
  RECEPTION_REQUEST_STATUS_LABELS,
  RECEPTION_SERVICE_TYPE_LABELS,
  RECEPTION_VISIT_STATUS_LABELS,
} from "@/features/hospital-operations/utils/reception-intake.utils"
import { cn } from "@/lib/utils"

interface ReceptionIntakeWorkspaceProps {
  context: StaffContext
  data: ReceptionIntakePageData
}

type WorkspaceView =
  | "patients"
  | "requests"

function statusClassName(
  status: string
): string {
  if (
    status === "active" ||
    status === "checked_in" ||
    status === "cleared" ||
    status === "completed"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (
    status === "waiting" ||
    status === "queued" ||
    status === "registered" ||
    status === "pending"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (
    status === "urgent" ||
    status === "stat" ||
    status === "emergency" ||
    status === "blocked"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-700"
}

function StatusBadge({
  label,
  status,
}: {
  label: string
  status: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        statusClassName(status)
      )}
    >
      {label}
    </span>
  )
}

export function ReceptionIntakeWorkspace({
  context,
  data,
}: ReceptionIntakeWorkspaceProps) {
  const router = useRouter()

  const [
    workspaceView,
    setWorkspaceView,
  ] =
    useState<WorkspaceView>(
      "patients"
    )

  const [search, setSearch] =
    useState("")

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("all")

  const [
    isRegisterDialogOpen,
    setIsRegisterDialogOpen,
  ] = useState(false)

  const [
    registerDialogSession,
    setRegisterDialogSession,
  ] = useState(0)

  const [
    visitPatientId,
    setVisitPatientId,
  ] = useState<string | null>(
    null
  )

  const [
    serviceVisitId,
    setServiceVisitId,
  ] = useState<string | null>(
    null
  )

  const [
    pendingCheckInVisitId,
    setPendingCheckInVisitId,
  ] = useState<string | null>(
    null
  )

  const [
    isCheckInPending,
    startCheckInTransition,
  ] = useTransition()

  const patientById =
    useMemo(
      () =>
        new Map(
          data.patients.map(
            (patient) => [
              patient.id,
              patient,
            ]
          )
        ),
      [data.patients]
    )

  const activeVisitByPatientId =
    useMemo(
      () => {
        const visitMap =
          new Map<
            string,
            ReceptionVisitRecord
          >()

        data.activeVisits.forEach(
          (visit) => {
            if (
              !visitMap.has(
                visit.patientId
              )
            ) {
              visitMap.set(
                visit.patientId,
                visit
              )
            }
          }
        )

        return visitMap
      },
      [data.activeVisits]
    )

  const requestCountByPatientId =
    useMemo(() => {
      const countMap =
        new Map<string, number>()

      data.activeRequests.forEach(
        (request) => {
          countMap.set(
            request.patientId,
            (
              countMap.get(
                request.patientId
              ) ?? 0
            ) + 1
          )
        }
      )

      return countMap
    }, [data.activeRequests])

  const filteredPatients =
    useMemo(
      () =>
        data.patients.filter(
          (patient) => {
            const visit =
              activeVisitByPatientId.get(
                patient.id
              ) ?? null

            const matchesSearch =
              normalizeReceptionSearch(
                patient.medicalRecordNumber,
                getReceptionPatientFullName(
                  patient
                ),
                patient.mobileNumber,
                patient.emailAddress,
                patient.branchName,
                visit?.visitNumber,
                visit?.chiefConcern
              ).includes(
                normalizeReceptionSearch(
                  search
                )
              )

            const matchesBranch =
              branchFilter === "all" ||
              patient.branchId ===
                branchFilter

            return (
              matchesSearch &&
              matchesBranch
            )
          }
        ),
      [
        activeVisitByPatientId,
        branchFilter,
        data.patients,
        search,
      ]
    )

  const filteredRequests =
    useMemo(
      () =>
        data.activeRequests.filter(
          (request) => {
            const patient =
              patientById.get(
                request.patientId
              )

            const matchesSearch =
              normalizeReceptionSearch(
                request.requestNumber,
                request.queueNumber,
                request.serviceName,
                request.departmentName,
                patient
                  ? getReceptionPatientFullName(
                      patient
                    )
                  : null,
                patient
                  ?.medicalRecordNumber
              ).includes(
                normalizeReceptionSearch(
                  search
                )
              )

            const matchesBranch =
              branchFilter === "all" ||
              request.branchId ===
                branchFilter

            return (
              matchesSearch &&
              matchesBranch
            )
          }
        ),
      [
        branchFilter,
        data.activeRequests,
        patientById,
        search,
      ]
    )

  const selectedVisitPatient =
    visitPatientId
      ? patientById.get(
          visitPatientId
        ) ?? null
      : null

  const selectedServiceVisit =
    serviceVisitId
      ? data.activeVisits.find(
          (visit) =>
            visit.id ===
            serviceVisitId
        ) ?? null
      : null

  const selectedServicePatient =
    selectedServiceVisit
      ? patientById.get(
          selectedServiceVisit.patientId
        ) ?? null
      : null

  const waitingQueueCount =
    data.activeRequests.filter(
      (request) =>
        request.queueStatus ===
          "waiting" ||
        request.queueStatus ===
          "called" ||
        request.queueStatus ===
          "in_service"
    ).length

  function openRegisterDialog() {
    setRegisterDialogSession(
      (currentSession) =>
        currentSession + 1
    )
    setIsRegisterDialogOpen(true)
  }

  function handleCheckIn(
    visit:
      ReceptionVisitRecord
  ) {
    setPendingCheckInVisitId(
      visit.id
    )

    startCheckInTransition(() => {
      void (async () => {
        const result =
          await checkInReceptionVisitAction(
            {
              visitId: visit.id,
            }
          )

        setPendingCheckInVisitId(
          null
        )

        if (!result.success) {
          toast.error(
            result.message
          )
          return
        }

        toast.success(
          result.message,
          {
            description:
              visit.visitNumber,
          }
        )

        router.refresh()
      })()
    })
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1550px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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
                Reception Intake · {context.fullName}
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
              <ArrowLeft aria-hidden="true" />
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

      <div className="mx-auto max-w-[1550px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
              <UsersRound
                className="size-6"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-teal-700">
                Front-desk hospital workflow
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Patient Intake and Service Routing
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Search or register patients,
                open hospital visits, check in
                arrivals, and route approved
                services into department queues
                with automatic billing charges.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={openRegisterDialog}
          >
            <UserPlus aria-hidden="true" />
            Register patient
          </Button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UsersRound
                className="size-4 text-sky-700"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-muted-foreground">
                  Visible patients
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {data.patients.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <LogIn
                className="size-4 text-violet-700"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-muted-foreground">
                  Active visits
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {data.activeVisits.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <ClipboardList
                className="size-4 text-amber-700"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-muted-foreground">
                  Active requests
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {data.activeRequests.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Stethoscope
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-muted-foreground">
                  Queue in progress
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {waitingQueueCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {data.catalogItems.length ===
        0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            No active hospital services are
            configured. A System Administrator
            must add services in the Service
            Catalog before Reception can create
            a service request or queue entry.
          </div>
        ) : null}

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={
                  workspaceView ===
                  "patients"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setWorkspaceView(
                    "patients"
                  )
                }
              >
                <UsersRound aria-hidden="true" />
                Patients
              </Button>

              <Button
                type="button"
                variant={
                  workspaceView ===
                  "requests"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setWorkspaceView(
                    "requests"
                  )
                }
              >
                <ClipboardList aria-hidden="true" />
                Active requests
              </Button>
            </div>

            <div className="relative min-w-0 flex-1 xl:max-w-xl">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                className="pl-8"
                placeholder="Search patient, MRN, visit, request, queue, service, or department"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={branchFilter}
              className="h-8 min-w-52 rounded-lg border border-input bg-background px-2.5 text-sm"
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
          </div>
        </section>

        {workspaceView ===
        "patients" ? (
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table className="min-w-[1320px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Patient
                  </TableHead>
                  <TableHead>
                    Branch
                  </TableHead>
                  <TableHead>
                    Active visit
                  </TableHead>
                  <TableHead>
                    Status
                  </TableHead>
                  <TableHead>
                    Requests
                  </TableHead>
                  <TableHead>
                    Registered
                  </TableHead>
                  <TableHead>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredPatients.length ===
                0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No patient matched the
                      current search and branch
                      filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map(
                    (patient) => {
                      const visit =
                        activeVisitByPatientId.get(
                          patient.id
                        ) ?? null

                      const requestCount =
                        requestCountByPatientId.get(
                          patient.id
                        ) ?? 0

                      return (
                        <TableRow
                          key={patient.id}
                        >
                          <TableCell>
                            <div className="flex min-w-64 items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700">
                                {getReceptionPatientInitials(
                                  patient
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {getReceptionPatientFullName(
                                    patient
                                  )}
                                </p>
                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                  {patient.medicalRecordNumber}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  DOB: {formatReceptionDate(
                                    patient.dateOfBirth
                                  )}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {patient.branchName}
                          </TableCell>

                          <TableCell>
                            {visit ? (
                              <div>
                                <p className="font-mono text-xs font-medium">
                                  {visit.visitNumber}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatReceptionDateTime(
                                    visit.registeredAt
                                  )}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No active visit
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            {visit ? (
                              <StatusBadge
                                status={visit.status}
                                label={
                                  RECEPTION_VISIT_STATUS_LABELS[
                                    visit.status
                                  ]
                                }
                              />
                            ) : (
                              <StatusBadge
                                status={patient.status}
                                label={patient.status}
                              />
                            )}
                          </TableCell>

                          <TableCell>
                            {requestCount}
                          </TableCell>

                          <TableCell>
                            {formatReceptionDateTime(
                              patient.createdAt
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex min-w-[430px] flex-wrap gap-2">
                              {!visit ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    patient.status !==
                                    "active"
                                  }
                                  onClick={() =>
                                    setVisitPatientId(
                                      patient.id
                                    )
                                  }
                                >
                                  <Plus aria-hidden="true" />
                                  Create visit
                                </Button>
                              ) : null}

                              {visit?.status ===
                              "registered" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    isCheckInPending &&
                                    pendingCheckInVisitId ===
                                      visit.id
                                  }
                                  onClick={() =>
                                    handleCheckIn(
                                      visit
                                    )
                                  }
                                >
                                  <CheckCircle2 aria-hidden="true" />
                                  {isCheckInPending &&
                                  pendingCheckInVisitId ===
                                    visit.id
                                    ? "Checking in"
                                    : "Check in"}
                                </Button>
                              ) : null}

                              {visit ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={
                                    data.catalogItems.length ===
                                    0
                                  }
                                  onClick={() =>
                                    setServiceVisitId(
                                      visit.id
                                    )
                                  }
                                >
                                  <ClipboardList aria-hidden="true" />
                                  Add service
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }
                  )
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table className="min-w-[1380px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Request
                  </TableHead>
                  <TableHead>
                    Patient
                  </TableHead>
                  <TableHead>
                    Service
                  </TableHead>
                  <TableHead>
                    Department
                  </TableHead>
                  <TableHead>
                    Priority
                  </TableHead>
                  <TableHead>
                    Queue
                  </TableHead>
                  <TableHead>
                    Payment clearance
                  </TableHead>
                  <TableHead>
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRequests.length ===
                0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No active service request
                      matched the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map(
                    (request) => {
                      const patient =
                        patientById.get(
                          request.patientId
                        ) ?? null

                      return (
                        <TableRow
                          key={request.id}
                        >
                          <TableCell>
                            <p className="font-mono text-xs font-medium">
                              {request.requestNumber}
                            </p>
                            <div className="mt-2">
                              <StatusBadge
                                status={request.status}
                                label={
                                  RECEPTION_REQUEST_STATUS_LABELS[
                                    request.status
                                  ]
                                }
                              />
                            </div>
                          </TableCell>

                          <TableCell>
                            <p className="font-medium">
                              {patient
                                ? getReceptionPatientFullName(
                                    patient
                                  )
                                : "Patient unavailable"}
                            </p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              {patient
                                ?.medicalRecordNumber ??
                                "MRN unavailable"}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p className="font-medium">
                              {request.serviceName}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                RECEPTION_SERVICE_TYPE_LABELS[
                                  request.serviceType
                                ]
                              }
                            </p>
                          </TableCell>

                          <TableCell>
                            {request.departmentName}
                          </TableCell>

                          <TableCell>
                            <StatusBadge
                              status={request.priority}
                              label={
                                RECEPTION_PRIORITY_LABELS[
                                  request.priority
                                ]
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <p className="font-mono text-xs font-medium">
                              {request.queueNumber ??
                                "No queue"}
                            </p>
                            {request.queueStatus ? (
                              <div className="mt-2">
                                <StatusBadge
                                  status={request.queueStatus}
                                  label={
                                    RECEPTION_QUEUE_STATUS_LABELS[
                                      request.queueStatus
                                    ]
                                  }
                                />
                              </div>
                            ) : null}
                          </TableCell>

                          <TableCell>
                            <p className="font-semibold tabular-nums">
                              {formatReceptionAmount(
                                request.requiredAmountCentavos
                              )}
                            </p>
                            <div className="mt-2">
                              <StatusBadge
                                status={
                                  request.clearanceStatus ??
                                  "pending"
                                }
                                label={
                                  request.clearanceStatus ??
                                  "Pending"
                                }
                              />
                            </div>
                          </TableCell>

                          <TableCell>
                            {formatReceptionDateTime(
                              request.createdAt
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    }
                  )
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-900">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            Patient, visit, request, queue,
            charge, payment-clearance, and
            audit records are created through
            guarded Supabase RPCs. The
            receptionist cannot mark a bill as
            paid or release a clinical result
            from this intake page.
          </p>
        </div>
      </div>

      {isRegisterDialogOpen ? (
        <ReceptionRegisterPatientDialog
          key={registerDialogSession}
          open
          branches={data.branches}
          onOpenChange={
            setIsRegisterDialogOpen
          }
        />
      ) : null}

      {selectedVisitPatient ? (
        <ReceptionCreateVisitDialog
          key={selectedVisitPatient.id}
          open
          patient={selectedVisitPatient}
          branches={data.branches}
          onOpenChange={(open) => {
            if (!open) {
              setVisitPatientId(null)
            }
          }}
        />
      ) : null}

      {selectedServiceVisit &&
      selectedServicePatient ? (
        <ReceptionCreateServiceRequestDialog
          key={selectedServiceVisit.id}
          open
          visit={selectedServiceVisit}
          patient={selectedServicePatient}
          catalogItems={
            data.catalogItems
          }
          onOpenChange={(open) => {
            if (!open) {
              setServiceVisitId(null)
            }
          }}
        />
      ) : null}
    </main>
  )
}
