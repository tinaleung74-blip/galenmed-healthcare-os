"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  ArrowLeft,
  Search,
  Stethoscope,
  UserCheck,
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  StaffContext,
} from "@/features/auth/types/staff-auth.types"
import {
  ReceptionDoctorAssignmentDialog,
} from "@/features/hospital-operations/components/reception-doctor-assignment-dialog"
import {
  DoctorPriorityBadge,
  DoctorQueueStatusBadge,
} from "@/features/hospital-operations/components/doctor-consultation-badges"
import type {
  ReceptionDoctorAssignmentPageData,
} from "@/features/hospital-operations/types/doctor-consultation.types"
import {
  formatDoctorDateTime,
  normalizeDoctorSearch,
} from "@/features/hospital-operations/utils/doctor-consultation.utils"
import { cn } from "@/lib/utils"

interface ReceptionDoctorAssignmentWorkspaceProps {
  context: StaffContext
  data:
    ReceptionDoctorAssignmentPageData
}

export function ReceptionDoctorAssignmentWorkspace({
  context,
  data,
}: ReceptionDoctorAssignmentWorkspaceProps) {
  const [search, setSearch] =
    useState("")

  const [
    selectedRequestId,
    setSelectedRequestId,
  ] = useState<string | null>(
    null
  )

  const filteredRequests =
    useMemo(
      () =>
        data.requests.filter(
          (request) =>
            normalizeDoctorSearch(
              request.patientName,
              request.medicalRecordNumber,
              request.requestNumber,
              request.visitNumber,
              request.branchName,
              request.queueNumber,
              request.assignedDoctorName
            ).includes(
              normalizeDoctorSearch(
                search
              )
            )
        ),
      [
        data.requests,
        search,
      ]
    )

  const selectedRequest =
    selectedRequestId
      ? data.requests.find(
          (request) =>
            request.serviceRequestId ===
            selectedRequestId
        ) ?? null
      : null

  const unassignedCount =
    data.requests.filter(
      (request) =>
        !request.assignedDoctorId
    ).length

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
                Reception Doctor Assignment
              </p>
            </div>
          </div>

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
            Reception Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Consultation routing
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Doctor Assignment Queue
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Assign an active Doctor to each
              consultation request before the
              Doctor opens the patient queue.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {context.fullName}
            </span>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UsersRound
                className="size-5 text-sky-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Consultation requests
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {data.requests.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Stethoscope
                className="size-5 text-amber-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-amber-700">
                  Unassigned
                </p>

                <p className="mt-1 text-2xl font-semibold text-amber-800">
                  {unassignedCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UserCheck
                className="size-5 text-emerald-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-emerald-700">
                  Active Doctors
                </p>

                <p className="mt-1 text-2xl font-semibold text-emerald-800">
                  {data.doctors.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={search}
              placeholder="Search patient, MRN, request, queue, branch, or Doctor"
              className="pl-9"
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border bg-white">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Patient
                </TableHead>

                <TableHead>
                  Request / Visit
                </TableHead>

                <TableHead>
                  Branch / Queue
                </TableHead>

                <TableHead>
                  Priority
                </TableHead>

                <TableHead>
                  Assigned Doctor
                </TableHead>

                <TableHead>
                  Requested
                </TableHead>

                <TableHead>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRequests.length ===
              0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center text-muted-foreground"
                  >
                    No consultation request
                    matches the current search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map(
                  (request) => (
                    <TableRow
                      key={
                        request.serviceRequestId
                      }
                    >
                      <TableCell>
                        <p className="font-medium">
                          {request.patientName}
                        </p>

                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {
                            request.medicalRecordNumber
                          }
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-mono text-xs">
                          {
                            request.requestNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            request.visitNumber
                          }
                        </p>
                      </TableCell>

                      <TableCell>
                        <p>
                          {request.branchName}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {request.queueNumber ? (
                            <span className="font-mono text-xs">
                              {
                                request.queueNumber
                              }
                            </span>
                          ) : null}

                          {request.queueStatus ? (
                            <DoctorQueueStatusBadge
                              status={
                                request.queueStatus
                              }
                            />
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DoctorPriorityBadge
                          priority={
                            request.priority
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {request.assignedDoctorName ? (
                          <p className="font-medium">
                            {
                              request.assignedDoctorName
                            }
                          </p>
                        ) : (
                          <span className="text-sm font-medium text-amber-700">
                            Not assigned
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDoctorDateTime(
                          request.requestedAt
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedRequestId(
                              request.serviceRequestId
                            )
                          }
                        >
                          <Stethoscope
                            aria-hidden="true"
                          />
                          {request.assignedDoctorId
                            ? "Reassign"
                            : "Assign Doctor"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedRequest ? (
        <ReceptionDoctorAssignmentDialog
          key={
            selectedRequest.serviceRequestId
          }
          request={selectedRequest}
          doctors={data.doctors}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedRequestId(
                null
              )
            }
          }}
        />
      ) : null}
    </main>
  )
}
