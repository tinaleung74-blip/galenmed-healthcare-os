"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  ArrowLeft,
  ClipboardList,
  Search,
  Stethoscope,
  UsersRound,
} from "lucide-react"
import Link from "next/link"

import {
  GalenMedLogo,
} from "@/components/brand/galenmed-logo"
import {
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
  DoctorConsultationStatusBadge,
  DoctorPriorityBadge,
  DoctorQueueStatusBadge,
} from "@/features/hospital-operations/components/doctor-consultation-badges"
import type {
  DoctorQueueRecord,
} from "@/features/hospital-operations/types/doctor-consultation.types"
import {
  calculateDoctorPatientAge,
  formatDoctorDateTime,
  normalizeDoctorSearch,
} from "@/features/hospital-operations/utils/doctor-consultation.utils"
import { cn } from "@/lib/utils"

interface DoctorQueueWorkspaceProps {
  context: StaffContext
  queue: DoctorQueueRecord[]
}

export function DoctorQueueWorkspace({
  context,
  queue,
}: DoctorQueueWorkspaceProps) {
  const [search, setSearch] =
    useState("")

  const filteredQueue =
    useMemo(
      () =>
        queue.filter(
          (record) =>
            normalizeDoctorSearch(
              record.patientName,
              record.medicalRecordNumber,
              record.requestNumber,
              record.visitNumber,
              record.queueNumber,
              record.branchName,
              record.chiefConcern,
              record.consultationNumber
            ).includes(
              normalizeDoctorSearch(
                search
              )
            )
        ),
      [
        queue,
        search,
      ]
    )

  const waitingCount =
    queue.filter(
      (record) =>
        record.queueStatus ===
          "waiting" ||
        record.queueStatus ===
          "called"
    ).length

  const activeCount =
    queue.filter(
      (record) =>
        record.consultationStatus ===
        "in_progress"
    ).length

  const completedCount =
    queue.filter(
      (record) =>
        record.consultationStatus ===
        "completed"
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
                Doctor Assigned Queue
              </p>
            </div>
          </div>

          <Link
            href="/doctor/dashboard"
            className={cn(
              buttonVariants({
                variant: "outline",
              })
            )}
          >
            <ArrowLeft
              aria-hidden="true"
            />
            Doctor Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Assigned consultations
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Patient Queue
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Open only patients assigned to
              your Doctor account, review the
              clinical context, and document
              the consultation.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            Doctor:{" "}
            <span className="font-medium text-foreground">
              {context.fullName}
            </span>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UsersRound
                className="size-5 text-sky-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Assigned
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {queue.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-amber-700">
                Waiting
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-800">
                {waitingCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-200 bg-teal-50/40 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-teal-700">
                In consultation
              </p>
              <p className="mt-1 text-2xl font-semibold text-teal-800">
                {activeCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-emerald-700">
                Completed
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">
                {completedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="rounded-xl border bg-white p-4">
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={search}
              placeholder="Search patient, MRN, visit, queue, or concern"
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
          <Table className="min-w-[1350px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Patient
                </TableHead>
                <TableHead>
                  Visit / Concern
                </TableHead>
                <TableHead>
                  Queue
                </TableHead>
                <TableHead>
                  Priority
                </TableHead>
                <TableHead>
                  Consultation
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
              {filteredQueue.length ===
              0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center text-muted-foreground"
                  >
                    No assigned consultation
                    matches the current search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map(
                  (record) => {
                    const age =
                      calculateDoctorPatientAge(
                        record.dateOfBirth
                      )

                    return (
                      <TableRow
                        key={
                          record.serviceRequestId
                        }
                      >
                        <TableCell>
                          <p className="font-medium">
                            {record.patientName}
                          </p>

                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {
                              record.medicalRecordNumber
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {age !== null
                              ? `${age} years`
                              : "Age unavailable"}
                            {" · "}
                            {
                              record.biologicalSex
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-mono text-xs">
                            {
                              record.visitNumber
                            }
                          </p>

                          <p className="mt-1 max-w-xs whitespace-normal text-sm text-muted-foreground">
                            {record.chiefConcern ??
                              "No chief concern recorded"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-mono text-xs">
                            {record.queueNumber ??
                              "No queue"}
                          </p>

                          <div className="mt-2">
                            {record.queueStatus ? (
                              <DoctorQueueStatusBadge
                                status={
                                  record.queueStatus
                                }
                              />
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell>
                          <DoctorPriorityBadge
                            priority={
                              record.priority
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {record.consultationStatus ? (
                            <div>
                              <DoctorConsultationStatusBadge
                                status={
                                  record.consultationStatus
                                }
                              />

                              {record.consultationNumber ? (
                                <p className="mt-2 font-mono text-xs text-muted-foreground">
                                  {
                                    record.consultationNumber
                                  }
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Not started
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {formatDoctorDateTime(
                            record.requestedAt
                          )}
                        </TableCell>

                        <TableCell>
                          <Link
                            href={`/doctor/consultations/${record.serviceRequestId}`}
                            className={cn(
                              buttonVariants({
                                size: "sm",
                              })
                            )}
                          >
                            <ClipboardList
                              aria-hidden="true"
                            />
                            Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <Stethoscope
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          Only consultation requests assigned
          to the signed-in Doctor are shown.
        </div>
      </div>
    </main>
  )
}
