"use client"

import {
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  FlaskConical,
  Play,
  Plus,
  RotateCcw,
  Search,
  TestTube2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { LaboratoryOrderDetailsSheet } from "@/features/laboratory/components/laboratory-order-details-sheet"
import { LaboratoryOrderFormDialog } from "@/features/laboratory/components/laboratory-order-form-dialog"
import { LaboratorySpecimenCollectionDialog } from "@/features/laboratory/components/laboratory-specimen-collection-dialog"
import { LaboratorySpecimenRejectionDialog } from "@/features/laboratory/components/laboratory-specimen-rejection-dialog"
import {
  LaboratoryOrderPriorityBadge,
  LaboratoryOrderStatusBadge,
} from "@/features/laboratory/components/laboratory-status-badges"
import {
  DEFAULT_LABORATORY_ORDER_FILTERS,
  LABORATORY_DATE_VIEW_LABELS,
  LABORATORY_ORDER_PRIORITY_LABELS,
  LABORATORY_ORDER_SOURCE_LABELS,
  LABORATORY_ORDER_STATUS_LABELS,
} from "@/features/laboratory/constants/laboratory.constants"
import { useLaboratory } from "@/features/laboratory/providers/laboratory-provider"
import type { LaboratoryOrderFormValues } from "@/features/laboratory/schemas/laboratory-order.schema"
import type { LaboratorySpecimenCollectionFormValues } from "@/features/laboratory/schemas/laboratory-specimen.schema"
import {
  LABORATORY_DATE_VIEWS,
  LABORATORY_ORDER_PRIORITIES,
  LABORATORY_ORDER_SOURCES,
  LABORATORY_ORDER_STATUSES,
  type LaboratoryDateView,
  type LaboratoryOrder,
  type LaboratoryOrderFilters,
  type LaboratoryOrderPriority,
  type LaboratoryOrderSource,
  type LaboratoryOrderStatus,
} from "@/features/laboratory/types/laboratory.types"
import {
  getLaboratorySpecimenProgress,
} from "@/features/laboratory/utils/laboratory.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
  getPatientInitials,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"

const priorityOrder: Record<
  LaboratoryOrderPriority,
  number
> = {
  stat: 0,
  urgent: 1,
  routine: 2,
}

function getLocalDateKey(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-")
}

function matchesDateView(
  order: LaboratoryOrder,
  dateView: LaboratoryDateView,
  selectedDate: string
): boolean {
  if (dateView === "all") {
    return true
  }

  const orderDate =
    getLocalDateKey(
      order.createdAt
    )

  if (dateView === "day") {
    return (
      orderDate === selectedDate
    )
  }

  const endDate =
    new Date(
      `${selectedDate}T23:59:59`
    )

  const startDate =
    new Date(
      `${selectedDate}T00:00:00`
    )

  startDate.setDate(
    startDate.getDate() - 6
  )

  const timestamp =
    new Date(
      order.createdAt
    ).getTime()

  return (
    timestamp >= startDate.getTime() &&
    timestamp <= endDate.getTime()
  )
}

function findPatient(
  patients: readonly Patient[],
  patientId: string
): Patient | null {
  return (
    patients.find(
      (patient) =>
        patient.id === patientId
    ) ?? null
  )
}

function matchesOrderSearch(
  order: LaboratoryOrder,
  patient: Patient | null,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableOrder =
    normalizePatientSearch(
      order.orderNumber,
      order.consultationNumber,
      order.orderedByName,
      order.clinicalIndication,
      order.branchName,
      order.items
        .map(
          (item) =>
            `${item.testCode} ${item.testName}`
        )
        .join(" "),
      order.specimens
        .map(
          (specimen) =>
            specimen.accessionNumber
        )
        .join(" "),
      patient
        ? getPatientFullName(patient)
        : null,
      patient?.medicalRecordNumber
    )

  return searchableOrder.includes(
    normalizedSearch
  )
}

function isOrderStatusFilter(
  value: string
): value is
  | LaboratoryOrderStatus
  | "all" {
  return (
    value === "all" ||
    LABORATORY_ORDER_STATUSES.some(
      (status) => status === value
    )
  )
}

function isPriorityFilter(
  value: string
): value is
  | LaboratoryOrderPriority
  | "all" {
  return (
    value === "all" ||
    LABORATORY_ORDER_PRIORITIES.some(
      (priority) =>
        priority === value
    )
  )
}

function isSourceFilter(
  value: string
): value is
  | LaboratoryOrderSource
  | "all" {
  return (
    value === "all" ||
    LABORATORY_ORDER_SOURCES.some(
      (source) => source === value
    )
  )
}

function isDateView(
  value: string
): value is LaboratoryDateView {
  return LABORATORY_DATE_VIEWS.some(
    (dateView) =>
      dateView === value
  )
}

export function LaboratoryDashboardWorkspace() {
  const router = useRouter()

  const { patients } = usePatients()

  const {
    laboratoryOrders,
    createLaboratoryOrder,
    collectLaboratorySpecimen,
    receiveLaboratorySpecimen,
    startLaboratoryProcessing,
    rejectLaboratorySpecimen,
  } = useLaboratory()

  const [filters, setFilters] =
    useState<LaboratoryOrderFilters>(
      () => ({
        ...DEFAULT_LABORATORY_ORDER_FILTERS,
      })
    )

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    viewingOrderId,
    setViewingOrderId,
  ] = useState<string | null>(null)

  const [
    collectingOrderId,
    setCollectingOrderId,
  ] = useState<string | null>(null)

  const [
    rejectionTarget,
    setRejectionTarget,
  ] = useState<{
    orderId: string
    specimenId: string
  } | null>(null)

  const filteredOrders = useMemo(
    () =>
      laboratoryOrders
        .filter((order) => {
          const patient =
            findPatient(
              patients,
              order.patientId
            )

          return (
            matchesOrderSearch(
              order,
              patient,
              filters.search
            ) &&
            (
              filters.status ===
                "all" ||
              order.status ===
                filters.status
            ) &&
            (
              filters.priority ===
                "all" ||
              order.priority ===
                filters.priority
            ) &&
            (
              filters.source ===
                "all" ||
              order.source ===
                filters.source
            ) &&
            (
              filters.branchId ===
                "all" ||
              order.branchId ===
                filters.branchId
            ) &&
            matchesDateView(
              order,
              filters.dateView,
              filters.selectedDate
            )
          )
        })
        .sort(
          (
            firstOrder,
            secondOrder
          ) =>
            priorityOrder[
              firstOrder.priority
            ] -
              priorityOrder[
                secondOrder.priority
              ] ||
            new Date(
              secondOrder.createdAt
            ).getTime() -
              new Date(
                firstOrder.createdAt
              ).getTime()
        ),
    [
      laboratoryOrders,
      patients,
      filters,
    ]
  )

  const selectedDayOrders =
    laboratoryOrders.filter(
      (order) =>
        getLocalDateKey(
          order.createdAt
        ) === filters.selectedDate
    )

  const awaitingSpecimenCount =
    selectedDayOrders.filter(
      (order) =>
        order.status === "ordered" ||
        order.status ===
          "specimen-collected"
    ).length

  const receivedCount =
    selectedDayOrders.filter(
      (order) =>
        order.status === "received"
    ).length

  const processingCount =
    selectedDayOrders.filter(
      (order) =>
        order.status ===
        "in-process"
    ).length

  const completedCount =
    selectedDayOrders.filter(
      (order) =>
        order.status === "completed" ||
        order.status === "verified" ||
        order.status === "released"
    ).length

  const viewingOrder =
    laboratoryOrders.find(
      (order) =>
        order.id === viewingOrderId
    ) ?? null

  const collectingOrder =
    laboratoryOrders.find(
      (order) =>
        order.id === collectingOrderId
    ) ?? null

  const rejectionOrder =
    rejectionTarget
      ? laboratoryOrders.find(
          (order) =>
            order.id ===
            rejectionTarget.orderId
        ) ?? null
      : null

  const rejectionSpecimen =
    rejectionOrder &&
    rejectionTarget
      ? rejectionOrder.specimens.find(
          (specimen) =>
            specimen.id ===
            rejectionTarget.specimenId
        ) ?? null
      : null

  const viewingPatient =
    viewingOrder
      ? findPatient(
          patients,
          viewingOrder.patientId
        )
      : null

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.source !== "all" ||
    filters.branchId !== "all" ||
    filters.dateView !== "day" ||
    filters.selectedDate !==
      "2026-08-01"

  function updateFilter<
    Key extends keyof LaboratoryOrderFilters,
  >(
    key: Key,
    value:
      LaboratoryOrderFilters[Key]
  ) {
    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        [key]: value,
      })
    )
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_LABORATORY_ORDER_FILTERS,
    })
  }

  async function handleCreateOrder(
    values: LaboratoryOrderFormValues
  ) {
    const newOrder =
      createLaboratoryOrder(values)

    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        selectedDate:
          getLocalDateKey(
            newOrder.createdAt
          ),
        dateView: "day",
      })
    )

    toast.success(
      "Laboratory order created",
      {
        description: `${newOrder.orderNumber} was created successfully.`,
      }
    )
  }

  async function handleCollectSpecimen(
    values:
      LaboratorySpecimenCollectionFormValues
  ) {
    if (!collectingOrder) {
      throw new Error(
        "No laboratory order was selected."
      )
    }

    const updatedOrder =
      collectLaboratorySpecimen(
        collectingOrder.id,
        values
      )

    toast.success(
      "Specimen collected",
      {
        description: `${updatedOrder.orderNumber} was updated.`,
      }
    )

    setCollectingOrderId(null)
    setViewingOrderId(
      updatedOrder.id
    )
  }

  function handleReceiveSpecimen(
    order: LaboratoryOrder,
    specimenId: string
  ) {
    try {
      const updatedOrder =
        receiveLaboratorySpecimen(
          order.id,
          specimenId
        )

      toast.success(
        "Specimen received",
        {
          description: `${updatedOrder.orderNumber} specimen receipt was recorded.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to receive specimen",
        {
          description:
            error instanceof Error
              ? error.message
              : "Specimen receipt failed.",
        }
      )
    }
  }

  function handleStartProcessing(
    order: LaboratoryOrder
  ) {
    try {
      const updatedOrder =
        startLaboratoryProcessing(
          order.id
        )

      toast.success(
        "Laboratory processing started",
        {
          description: `${updatedOrder.orderNumber} is now in process.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to start processing",
        {
          description:
            error instanceof Error
              ? error.message
              : "Processing could not begin.",
        }
      )
    }
  }

  function handleConfirmReject(
    rejectionReason: string
  ) {
    if (
      !rejectionOrder ||
      !rejectionSpecimen
    ) {
      return
    }

    try {
      const updatedOrder =
        rejectLaboratorySpecimen(
          rejectionOrder.id,
          rejectionSpecimen.id,
          rejectionReason
        )

      toast.success(
        "Specimen rejected",
        {
          description: `${updatedOrder.orderNumber} requires recollection.`,
        }
      )

      setRejectionTarget(null)
    } catch (error) {
      toast.error(
        "Unable to reject specimen",
        {
          description:
            error instanceof Error
              ? error.message
              : "Specimen rejection failed.",
        }
      )
    }
  }

  function openPatientProfile(
    patient: Patient
  ) {
    setViewingOrderId(null)

    router.push(
      `/patients/${encodeURIComponent(
        patient.medicalRecordNumber
      )}`
    )
  }

  function openConsultation(
    consultationId: string
  ) {
    setViewingOrderId(null)

    router.push(
      `/consultations/${encodeURIComponent(
        consultationId
      )}`
    )
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
              <FlaskConical
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Laboratory operations
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Laboratory Order Queue
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage test requests,
                specimen collection, receipt,
                rejection, and processing.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() =>
              setIsCreateDialogOpen(true)
            }
          >
            <Plus aria-hidden="true" />
            Create laboratory order
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Awaiting specimen
              </p>

              <p className="mt-1 text-xl font-semibold">
                {awaitingSpecimenCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Received
              </p>

              <p className="mt-1 text-xl font-semibold">
                {receivedCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-sky-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-sky-700">
                In process
              </p>

              <p className="mt-1 text-xl font-semibold text-sky-800">
                {processingCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Completed / Released
              </p>

              <p className="mt-1 text-xl font-semibold">
                {completedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="space-y-4 border-b p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1 xl:max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  value={filters.search}
                  placeholder="Search patient, MRN, order, accession, or test"
                  className="pl-8"
                  onChange={(event) =>
                    updateFilter(
                      "search",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Input
                  type="date"
                  value={
                    filters.selectedDate
                  }
                  className="w-auto"
                  onChange={(event) =>
                    updateFilter(
                      "selectedDate",
                      event.target.value
                    )
                  }
                />

                <select
                  value={filters.dateView}
                  className={selectClassName}
                  onChange={(event) => {
                    const nextDateView =
                      event.target.value

                    if (
                      isDateView(
                        nextDateView
                      )
                    ) {
                      updateFilter(
                        "dateView",
                        nextDateView
                      )
                    }
                  }}
                >
                  {LABORATORY_DATE_VIEWS.map(
                    (dateView) => (
                      <option
                        key={dateView}
                        value={dateView}
                      >
                        {
                          LABORATORY_DATE_VIEW_LABELS[
                            dateView
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.status}
                  className={selectClassName}
                  onChange={(event) => {
                    const nextStatus =
                      event.target.value

                    if (
                      isOrderStatusFilter(
                        nextStatus
                      )
                    ) {
                      updateFilter(
                        "status",
                        nextStatus
                      )
                    }
                  }}
                >
                  <option value="all">
                    All statuses
                  </option>

                  {LABORATORY_ORDER_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          LABORATORY_ORDER_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.priority}
                  className={selectClassName}
                  onChange={(event) => {
                    const nextPriority =
                      event.target.value

                    if (
                      isPriorityFilter(
                        nextPriority
                      )
                    ) {
                      updateFilter(
                        "priority",
                        nextPriority
                      )
                    }
                  }}
                >
                  <option value="all">
                    All priorities
                  </option>

                  {LABORATORY_ORDER_PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {
                          LABORATORY_ORDER_PRIORITY_LABELS[
                            priority
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.source}
                  className={selectClassName}
                  onChange={(event) => {
                    const nextSource =
                      event.target.value

                    if (
                      isSourceFilter(
                        nextSource
                      )
                    ) {
                      updateFilter(
                        "source",
                        nextSource
                      )
                    }
                  }}
                >
                  <option value="all">
                    All sources
                  </option>

                  {LABORATORY_ORDER_SOURCES.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {
                          LABORATORY_ORDER_SOURCE_LABELS[
                            source
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.branchId}
                  className={selectClassName}
                  onChange={(event) =>
                    updateFilter(
                      "branchId",
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All branches
                  </option>

                  {GALENMED_BRANCHES.map(
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

                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetFilters}
                  >
                    <RotateCcw
                      aria-hidden="true"
                    />
                    Reset
                  </Button>
                ) : null}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {filteredOrders.length} of{" "}
              {laboratoryOrders.length} laboratory
              orders
            </p>
          </div>

          {filteredOrders.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <FlaskConical
                className="size-8 text-teal-700"
                aria-hidden="true"
              />

              <h2 className="mt-4 font-semibold">
                No matching laboratory orders
              </h2>

              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <Table className="min-w-[1350px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Specimens</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Ordered by</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primary action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map(
                  (order) => {
                    const patient =
                      findPatient(
                        patients,
                        order.patientId
                      )

                    const progress =
                      getLaboratorySpecimenProgress(
                        order
                      )

                    const canCollect =
                      [
                        "ordered",
                        "specimen-collected",
                        "rejected",
                      ].includes(
                        order.status
                      ) &&
                      progress.collected <
                        progress.required

                    const canStart =
                      order.status ===
                      "received"

                    return (
                      <TableRow
                        key={order.id}
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {
                              order.orderNumber
                            }
                          </p>

                          <div className="mt-2">
                            <LaboratoryOrderPriorityBadge
                              priority={
                                order.priority
                              }
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-56 items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                              {patient
                                ? getPatientInitials(
                                    patient
                                  )
                                : "PT"}
                            </div>

                            <div>
                              <p className="font-medium">
                                {patient
                                  ? getPatientFullName(
                                      patient
                                    )
                                  : "Patient unavailable"}
                              </p>

                              <p className="font-mono text-xs text-muted-foreground">
                                {patient
                                  ?.medicalRecordNumber ??
                                  "MRN unavailable"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="max-w-xs">
                            {order.items.map(
                              (item) => (
                                <p
                                  key={item.id}
                                  className="text-sm"
                                >
                                  {item.testName}
                                </p>
                              )
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="text-sm">
                            {progress.received}
                            {" / "}
                            {progress.required}
                            {" received"}
                          </p>

                          {progress.rejected >
                          0 ? (
                            <p className="mt-1 text-xs text-rose-700">
                              {
                                progress.rejected
                              }{" "}
                              rejected
                            </p>
                          ) : null}
                        </TableCell>

                        <TableCell>
                          {
                            LABORATORY_ORDER_SOURCE_LABELS[
                              order.source
                            ]
                          }

                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.branchName}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            {
                              order.orderedByName
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatPatientDateTime(
                              order.createdAt
                            )}
                          </p>
                        </TableCell>

                        <TableCell>
                          <LaboratoryOrderStatusBadge
                            status={
                              order.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {canCollect ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                setCollectingOrderId(
                                  order.id
                                )
                              }
                            >
                              <TestTube2
                                aria-hidden="true"
                              />
                              Collect
                            </Button>
                          ) : canStart ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-teal-700 text-white hover:bg-teal-800"
                              onClick={() =>
                                handleStartProcessing(
                                  order
                                )
                              }
                            >
                              <Play
                                aria-hidden="true"
                              />
                              Start processing
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setViewingOrderId(
                                  order.id
                                )
                              }
                            >
                              <Eye
                                aria-hidden="true"
                              />
                              View details
                            </Button>
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
      </section>

      <LaboratoryOrderFormDialog
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        onSubmitOrder={
          handleCreateOrder
        }
      />

      <LaboratorySpecimenCollectionDialog
        order={collectingOrder}
        open={Boolean(
          collectingOrder
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCollectingOrderId(null)
          }
        }}
        onSubmitSpecimen={
          handleCollectSpecimen
        }
      />

      <LaboratoryOrderDetailsSheet
        order={viewingOrder}
        patient={viewingPatient}
        open={Boolean(
          viewingOrder &&
            viewingPatient
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingOrderId(null)
          }
        }}
        onCollectSpecimen={(order) => {
          setViewingOrderId(null)
          setCollectingOrderId(order.id)
        }}
        onReceiveSpecimen={
          handleReceiveSpecimen
        }
        onRejectSpecimen={(
          order,
          specimen
        ) => {
          setRejectionTarget({
            orderId: order.id,
            specimenId: specimen.id,
          })
        }}
        onStartProcessing={
          handleStartProcessing
        }
        onOpenPatientProfile={
          openPatientProfile
        }
        onOpenConsultation={
          openConsultation
        }
      />

      <LaboratorySpecimenRejectionDialog
        order={rejectionOrder}
        specimen={
          rejectionSpecimen
        }
        open={Boolean(
          rejectionOrder &&
            rejectionSpecimen
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRejectionTarget(null)
          }
        }}
        onConfirmReject={
          handleConfirmReject
        }
      />
    </>
  )
}
