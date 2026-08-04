"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  useRouter,
} from "next/navigation"
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  MoreHorizontal,
  Play,
  Plus,
  RotateCcw,
  ScanLine,
  Search,
  UserCheck,
  UserX,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RadiologyCancelDialog } from "@/features/radiology/components/radiology-cancel-dialog"
import { RadiologyNoShowDialog } from "@/features/radiology/components/radiology-no-show-dialog"
import { RadiologyOrderDetailsSheet } from "@/features/radiology/components/radiology-order-details-sheet"
import { RadiologyOrderFormDialog } from "@/features/radiology/components/radiology-order-form-dialog"
import { RadiologyScheduleDialog } from "@/features/radiology/components/radiology-schedule-dialog"
import {
  RadiologyOrderPriorityBadge,
  RadiologyOrderStatusBadge,
} from "@/features/radiology/components/radiology-status-badges"
import {
  DEFAULT_RADIOLOGY_ORDER_FILTERS,
  RADIOLOGY_DATE_VIEW_LABELS,
  RADIOLOGY_MODALITY_LABELS,
  RADIOLOGY_ORDER_PRIORITY_LABELS,
  RADIOLOGY_ORDER_SOURCE_LABELS,
  RADIOLOGY_ORDER_STATUS_LABELS,
} from "@/features/radiology/constants/radiology.constants"
import {
  useRadiology,
} from "@/features/radiology/providers/radiology-provider"
import type {
  RadiologyOrderFormValues,
} from "@/features/radiology/schemas/radiology-order.schema"
import type {
  RadiologyScheduleFormValues,
} from "@/features/radiology/schemas/radiology-schedule.schema"
import {
  RADIOLOGY_DATE_VIEWS,
  RADIOLOGY_MODALITIES,
  RADIOLOGY_ORDER_PRIORITIES,
  RADIOLOGY_ORDER_SOURCES,
  RADIOLOGY_ORDER_STATUSES,
  type RadiologyDateView,
  type RadiologyModality,
  type RadiologyOrder,
  type RadiologyOrderFilters,
  type RadiologyOrderPriority,
  type RadiologyOrderSource,
  type RadiologyOrderStatus,
} from "@/features/radiology/types/radiology.types"
import {
  formatRadiologyScheduleRange,
} from "@/features/radiology/utils/radiology.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  getPatientFullName,
  getPatientInitials,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import {
  cn,
} from "@/lib/utils"

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"

const priorityOrder: Record<
  RadiologyOrderPriority,
  number
> = {
  stat: 0,
  urgent: 1,
  routine: 2,
}

const statusOrder: Record<
  RadiologyOrderStatus,
  number
> = {
  "in-progress": 0,
  "images-acquired": 1,
  ready: 2,
  "checked-in": 3,
  scheduled: 4,
  ordered: 5,
  "technically-completed": 6,
  "report-draft": 7,
  verified: 8,
  released: 9,
  cancelled: 10,
  "no-show": 11,
}

function getLocalDateKey(
  value: string
): string {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

function getOrderDateKey(
  order: RadiologyOrder
): string {
  return getLocalDateKey(
    order.scheduledStartAt ??
      order.createdAt
  )
}

function matchesDateView(
  order: RadiologyOrder,
  dateView: RadiologyDateView,
  selectedDate: string
): boolean {
  if (dateView === "all") {
    return true
  }

  const orderDate =
    getOrderDateKey(order)

  if (dateView === "day") {
    return (
      orderDate === selectedDate
    )
  }

  const startDate =
    new Date(
      `${selectedDate}T00:00:00`
    )

  if (
    Number.isNaN(
      startDate.getTime()
    )
  ) {
    return false
  }

  const endDate =
    new Date(startDate)

  endDate.setDate(
    endDate.getDate() + 6
  )

  endDate.setHours(
    23,
    59,
    59,
    999
  )

  const timestamp =
    new Date(
      `${orderDate}T00:00:00`
    ).getTime()

  return (
    timestamp >=
      startDate.getTime() &&
    timestamp <=
      endDate.getTime()
  )
}

function findPatient(
  patients:
    readonly Patient[],
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
  order: RadiologyOrder,
  patient: Patient | null,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  return normalizePatientSearch(
    order.orderNumber,
    order.consultationNumber,
    order.procedureCode,
    order.procedureName,
    order.bodyRegion,
    order.roomName,
    order.orderedByName,
    order.clinicalIndication,
    order.specialInstructions,
    patient
      ? getPatientFullName(
          patient
        )
      : null,
    patient?.medicalRecordNumber
  ).includes(normalizedSearch)
}

function isStatusFilter(
  value: string
): value is
  | RadiologyOrderStatus
  | "all" {
  return (
    value === "all" ||
    RADIOLOGY_ORDER_STATUSES.some(
      (status) =>
        status === value
    )
  )
}

function isPriorityFilter(
  value: string
): value is
  | RadiologyOrderPriority
  | "all" {
  return (
    value === "all" ||
    RADIOLOGY_ORDER_PRIORITIES.some(
      (priority) =>
        priority === value
    )
  )
}

function isModalityFilter(
  value: string
): value is
  | RadiologyModality
  | "all" {
  return (
    value === "all" ||
    RADIOLOGY_MODALITIES.some(
      (modality) =>
        modality === value
    )
  )
}

function isSourceFilter(
  value: string
): value is
  | RadiologyOrderSource
  | "all" {
  return (
    value === "all" ||
    RADIOLOGY_ORDER_SOURCES.some(
      (source) =>
        source === value
    )
  )
}

function isDateView(
  value: string
): value is RadiologyDateView {
  return RADIOLOGY_DATE_VIEWS.some(
    (dateView) =>
      dateView === value
  )
}

export function RadiologyDashboardWorkspace() {
  const router = useRouter()

  const { patients } =
    usePatients()

  const {
    radiologyOrders,
    createRadiologyOrder,
    scheduleRadiologyOrder,
    updateRadiologyPreparationItem,
    checkInRadiologyOrder,
    markRadiologyReady,
    startRadiologyImaging,
    markRadiologyImagesAcquired,
    technicallyCompleteRadiologyOrder,
    cancelRadiologyOrder,
    markRadiologyNoShow,
  } = useRadiology()

  const [
    filters,
    setFilters,
  ] =
    useState<RadiologyOrderFilters>(
      () => ({
        ...DEFAULT_RADIOLOGY_ORDER_FILTERS,
      })
    )

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    viewingOrderId,
    setViewingOrderId,
  ] = useState<string | null>(
    null
  )

  const [
    schedulingOrderId,
    setSchedulingOrderId,
  ] = useState<string | null>(
    null
  )

  const [
    cancellingOrderId,
    setCancellingOrderId,
  ] = useState<string | null>(
    null
  )

  const [
    noShowOrderId,
    setNoShowOrderId,
  ] = useState<string | null>(
    null
  )

  const filteredOrders =
    useMemo(
      () =>
        radiologyOrders
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
                filters.modality ===
                  "all" ||
                order.modality ===
                  filters.modality
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
              statusOrder[
                firstOrder.status
              ] -
                statusOrder[
                  secondOrder.status
                ] ||
              new Date(
                firstOrder.scheduledStartAt ??
                  firstOrder.createdAt
              ).getTime() -
                new Date(
                  secondOrder.scheduledStartAt ??
                    secondOrder.createdAt
                ).getTime()
          ),
      [
        filters,
        patients,
        radiologyOrders,
      ]
    )

  const selectedDayOrders =
    radiologyOrders.filter(
      (order) =>
        getOrderDateKey(order) ===
        filters.selectedDate
    )

  const unscheduledCount =
    selectedDayOrders.filter(
      (order) =>
        order.status ===
        "ordered"
    ).length

  const waitingCount =
    selectedDayOrders.filter(
      (order) =>
        order.status ===
          "scheduled" ||
        order.status ===
          "checked-in" ||
        order.status === "ready"
    ).length

  const activeImagingCount =
    selectedDayOrders.filter(
      (order) =>
        order.status ===
          "in-progress" ||
        order.status ===
          "images-acquired"
    ).length

  const technicallyCompletedCount =
    selectedDayOrders.filter(
      (order) =>
        order.status ===
          "technically-completed" ||
        order.status ===
          "report-draft" ||
        order.status ===
          "verified" ||
        order.status ===
          "released"
    ).length

  const viewingOrder =
    radiologyOrders.find(
      (order) =>
        order.id ===
        viewingOrderId
    ) ?? null

  const schedulingOrder =
    radiologyOrders.find(
      (order) =>
        order.id ===
        schedulingOrderId
    ) ?? null

  const cancellingOrder =
    radiologyOrders.find(
      (order) =>
        order.id ===
        cancellingOrderId
    ) ?? null

  const noShowOrder =
    radiologyOrders.find(
      (order) =>
        order.id ===
        noShowOrderId
    ) ?? null

  const viewingPatient =
    viewingOrder
      ? findPatient(
          patients,
          viewingOrder.patientId
        )
      : null

  const cancellingPatient =
    cancellingOrder
      ? findPatient(
          patients,
          cancellingOrder.patientId
        )
      : null

  const noShowPatient =
    noShowOrder
      ? findPatient(
          patients,
          noShowOrder.patientId
        )
      : null

  const hasActiveFilters =
    filters.search.trim().length >
      0 ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.modality !== "all" ||
    filters.source !== "all" ||
    filters.branchId !== "all" ||
    filters.dateView !== "day" ||
    filters.selectedDate !==
      "2026-08-04"

  function updateFilter<
    Key extends keyof RadiologyOrderFilters,
  >(
    key: Key,
    value:
      RadiologyOrderFilters[Key]
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
      ...DEFAULT_RADIOLOGY_ORDER_FILTERS,
    })
  }

  async function handleCreateOrder(
    values:
      RadiologyOrderFormValues
  ) {
    const newOrder =
      createRadiologyOrder(values)

    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        search: "",
        status: "all",
        dateView: "all",
      })
    )

    toast.success(
      "Radiology order created",
      {
        description: `${newOrder.orderNumber} was created successfully.`,
      }
    )
  }

  async function handleSaveSchedule(
    values:
      RadiologyScheduleFormValues
  ) {
    if (!schedulingOrder) {
      throw new Error(
        "No radiology order was selected."
      )
    }

    const updatedOrder =
      scheduleRadiologyOrder(
        schedulingOrder.id,
        values
      )

    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        selectedDate:
          getOrderDateKey(
            updatedOrder
          ),
        dateView: "day",
        status: "all",
      })
    )

    toast.success(
      "Radiology schedule saved",
      {
        description: `${updatedOrder.orderNumber} was scheduled successfully.`,
      }
    )
  }

  function handleTogglePreparationItem(
    order: RadiologyOrder,
    checklistItemId: string,
    completed: boolean
  ) {
    try {
      updateRadiologyPreparationItem(
        order.id,
        checklistItemId,
        completed
      )
    } catch (error) {
      toast.error(
        "Unable to update preparation",
        {
          description:
            error instanceof Error
              ? error.message
              : "The preparation item could not be updated.",
        }
      )
    }
  }

  function handleCheckIn(
    order: RadiologyOrder
  ) {
    try {
      const updatedOrder =
        checkInRadiologyOrder(
          order.id
        )

      toast.success(
        "Patient checked in",
        {
          description: `${updatedOrder.orderNumber} is ready for preparation review.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to check in patient",
        {
          description:
            error instanceof Error
              ? error.message
              : "Radiology check-in failed.",
        }
      )
    }
  }

  function handleMarkReady(
    order: RadiologyOrder
  ) {
    try {
      const updatedOrder =
        markRadiologyReady(
          order.id
        )

      toast.success(
        "Patient ready for imaging",
        {
          description: `${updatedOrder.orderNumber} is ready to begin imaging.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to mark patient ready",
        {
          description:
            error instanceof Error
              ? error.message
              : "Preparation requirements are incomplete.",
        }
      )
    }
  }

  function handleStartImaging(
    order: RadiologyOrder
  ) {
    try {
      const updatedOrder =
        startRadiologyImaging(
          order.id
        )

      toast.success(
        "Imaging started",
        {
          description: `${updatedOrder.orderNumber} is now in progress.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to start imaging",
        {
          description:
            error instanceof Error
              ? error.message
              : "Imaging could not begin.",
        }
      )
    }
  }

  function handleImagesAcquired(
    order: RadiologyOrder
  ) {
    try {
      const updatedOrder =
        markRadiologyImagesAcquired(
          order.id
        )

      toast.success(
        "Images acquired",
        {
          description: `${updatedOrder.orderNumber} image acquisition was completed.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to complete image acquisition",
        {
          description:
            error instanceof Error
              ? error.message
              : "Image acquisition could not be completed.",
        }
      )
    }
  }

  function handleTechnicalCompletion(
    order: RadiologyOrder
  ) {
    try {
      const updatedOrder =
        technicallyCompleteRadiologyOrder(
          order.id
        )

      toast.success(
        "Technical completion recorded",
        {
          description: `${updatedOrder.orderNumber} is ready for radiologist reporting.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to complete imaging study",
        {
          description:
            error instanceof Error
              ? error.message
              : "Technical completion failed.",
        }
      )
    }
  }

  function handleConfirmCancel(
    cancellationReason: string
  ) {
    if (!cancellingOrder) {
      return
    }

    try {
      const updatedOrder =
        cancelRadiologyOrder(
          cancellingOrder.id,
          cancellationReason
        )

      toast.success(
        "Radiology order cancelled",
        {
          description: `${updatedOrder.orderNumber} was cancelled.`,
        }
      )

      setCancellingOrderId(null)
    } catch (error) {
      toast.error(
        "Unable to cancel radiology order",
        {
          description:
            error instanceof Error
              ? error.message
              : "The order could not be cancelled.",
        }
      )
    }
  }

  function handleConfirmNoShow() {
    if (!noShowOrder) {
      return
    }

    try {
      const updatedOrder =
        markRadiologyNoShow(
          noShowOrder.id
        )

      toast.success(
        "Radiology schedule marked no-show",
        {
          description: `${updatedOrder.orderNumber} was updated.`,
        }
      )

      setNoShowOrderId(null)
    } catch (error) {
      toast.error(
        "Unable to mark no-show",
        {
          description:
            error instanceof Error
              ? error.message
              : "The radiology order could not be updated.",
        }
      )
    }
  }

  function openSchedule(
    order: RadiologyOrder
  ) {
    setViewingOrderId(null)

    setSchedulingOrderId(
      order.id
    )
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
              <ScanLine
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Diagnostic imaging operations
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Radiology Order Queue
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage imaging requests,
                schedules, preparation,
                acquisition, and technical
                completion.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() =>
              setIsCreateDialogOpen(
                true
              )
            }
          >
            <Plus aria-hidden="true" />
            Create radiology order
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <CalendarClock
                className="size-4 text-slate-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Unscheduled
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {unscheduledCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <UserCheck
                className="size-4 text-amber-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Scheduled / Waiting
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {waitingCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <ImageIcon
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-violet-700">
                  Imaging active
                </p>

                <p className="mt-1 text-xl font-semibold text-violet-800">
                  {activeImagingCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <CheckCircle2
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Technical / Reports
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {
                    technicallyCompletedCount
                  }
                </p>
              </div>
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
                  placeholder="Search patient, MRN, order, procedure, room, or clinician"
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
                  {RADIOLOGY_DATE_VIEWS.map(
                    (dateView) => (
                      <option
                        key={dateView}
                        value={dateView}
                      >
                        {
                          RADIOLOGY_DATE_VIEW_LABELS[
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
                      isStatusFilter(
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

                  {RADIOLOGY_ORDER_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          RADIOLOGY_ORDER_STATUS_LABELS[
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

                  {RADIOLOGY_ORDER_PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {
                          RADIOLOGY_ORDER_PRIORITY_LABELS[
                            priority
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.modality}
                  className={selectClassName}
                  onChange={(event) => {
                    const nextModality =
                      event.target.value

                    if (
                      isModalityFilter(
                        nextModality
                      )
                    ) {
                      updateFilter(
                        "modality",
                        nextModality
                      )
                    }
                  }}
                >
                  <option value="all">
                    All modalities
                  </option>

                  {RADIOLOGY_MODALITIES.map(
                    (modality) => (
                      <option
                        key={modality}
                        value={modality}
                      >
                        {
                          RADIOLOGY_MODALITY_LABELS[
                            modality
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

                  {RADIOLOGY_ORDER_SOURCES.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {
                          RADIOLOGY_ORDER_SOURCE_LABELS[
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
              Showing{" "}
              {filteredOrders.length} of{" "}
              {radiologyOrders.length} radiology
              orders
            </p>
          </div>

          {filteredOrders.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <ScanLine
                className="size-8 text-teal-700"
                aria-hidden="true"
              />

              <h2 className="mt-4 font-semibold">
                No matching radiology orders
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
            <Table className="min-w-[1550px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Order
                  </TableHead>

                  <TableHead>
                    Patient
                  </TableHead>

                  <TableHead>
                    Procedure
                  </TableHead>

                  <TableHead>
                    Schedule
                  </TableHead>

                  <TableHead>
                    Room
                  </TableHead>

                  <TableHead>
                    Source
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Primary action
                  </TableHead>

                  <TableHead>
                    <span className="sr-only">
                      More actions
                    </span>
                  </TableHead>
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

                    const patientName =
                      patient
                        ? getPatientFullName(
                            patient
                          )
                        : "Patient unavailable"

                    const canSchedule =
                      order.status ===
                        "ordered" ||
                      order.status ===
                        "scheduled"

                    const canCancel =
                      [
                        "ordered",
                        "scheduled",
                        "checked-in",
                        "ready",
                      ].includes(
                        order.status
                      )

                    const canMarkNoShow =
                      order.status ===
                      "scheduled"

                    return (
                      <TableRow
                        key={order.id}
                        className={cn(
                          order.priority ===
                            "stat" &&
                            "bg-rose-50/40",

                          (
                            order.status ===
                              "cancelled" ||
                            order.status ===
                              "no-show"
                          ) &&
                            "bg-slate-50/70"
                        )}
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {
                              order.orderNumber
                            }
                          </p>

                          <div className="mt-2">
                            <RadiologyOrderPriorityBadge
                              priority={
                                order.priority
                              }
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-60 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                              {patient
                                ? getPatientInitials(
                                    patient
                                  )
                                : "PT"}
                            </div>

                            <div>
                              <p className="font-medium">
                                {patientName}
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
                          <p className="max-w-xs whitespace-normal font-medium">
                            {
                              order.procedureName
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              RADIOLOGY_MODALITY_LABELS[
                                order.modality
                              ]
                            }
                            {" · "}
                            {order.bodyRegion}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="max-w-72 whitespace-normal">
                            {formatRadiologyScheduleRange(
                              order
                            )}
                          </p>
                        </TableCell>

                        <TableCell>
                          {order.roomName ??
                            "Not assigned"}
                        </TableCell>

                        <TableCell>
                          {
                            RADIOLOGY_ORDER_SOURCE_LABELS[
                              order.source
                            ]
                          }

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              order.orderedByName
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <RadiologyOrderStatusBadge
                            status={
                              order.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {order.status ===
                          "ordered" ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                setSchedulingOrderId(
                                  order.id
                                )
                              }
                            >
                              <CalendarClock
                                aria-hidden="true"
                              />
                              Schedule
                            </Button>
                          ) : order.status ===
                            "scheduled" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-teal-700 text-white hover:bg-teal-800"
                              onClick={() =>
                                handleCheckIn(
                                  order
                                )
                              }
                            >
                              <UserCheck
                                aria-hidden="true"
                              />
                              Check in
                            </Button>
                          ) : order.status ===
                            "ready" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-violet-700 text-white hover:bg-violet-800"
                              onClick={() =>
                                handleStartImaging(
                                  order
                                )
                              }
                            >
                              <Play
                                aria-hidden="true"
                              />
                              Start imaging
                            </Button>
                          ) : order.status ===
                            "in-progress" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-indigo-700 text-white hover:bg-indigo-800"
                              onClick={() =>
                                handleImagesAcquired(
                                  order
                                )
                              }
                            >
                              <ImageIcon
                                aria-hidden="true"
                              />
                              Images acquired
                            </Button>
                          ) : order.status ===
                            "images-acquired" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-emerald-700 text-white hover:bg-emerald-800"
                              onClick={() =>
                                handleTechnicalCompletion(
                                  order
                                )
                              }
                            >
                              <CheckCircle2
                                aria-hidden="true"
                              />
                              Technical complete
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

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Open actions for ${patientName}`}
                                >
                                  <MoreHorizontal
                                    aria-hidden="true"
                                  />
                                </Button>
                              }
                            />

                            <DropdownMenuContent
                              align="end"
                              className="w-56"
                            >
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                  Radiology actions
                                </DropdownMenuLabel>

                                <DropdownMenuItem
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
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  disabled={
                                    !canSchedule
                                  }
                                  onClick={() =>
                                    setSchedulingOrderId(
                                      order.id
                                    )
                                  }
                                >
                                  <CalendarClock
                                    aria-hidden="true"
                                  />

                                  {order.status ===
                                  "scheduled"
                                    ? "Reschedule"
                                    : "Schedule imaging"}
                                </DropdownMenuItem>
                              </DropdownMenuGroup>

                              {canMarkNoShow ? (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      setNoShowOrderId(
                                        order.id
                                      )
                                    }
                                  >
                                    <UserX
                                      aria-hidden="true"
                                    />
                                    Mark no-show
                                  </DropdownMenuItem>
                                </>
                              ) : null}

                              {canCancel ? (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      setCancellingOrderId(
                                        order.id
                                      )
                                    }
                                  >
                                    <Ban
                                      aria-hidden="true"
                                    />
                                    Cancel order
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <RadiologyOrderFormDialog
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        onSubmitOrder={
          handleCreateOrder
        }
      />

      <RadiologyScheduleDialog
        order={schedulingOrder}
        defaultDate={
          filters.selectedDate
        }
        open={Boolean(
          schedulingOrder
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSchedulingOrderId(
              null
            )
          }
        }}
        onSubmitSchedule={
          handleSaveSchedule
        }
      />

      <RadiologyOrderDetailsSheet
        order={viewingOrder}
        patient={viewingPatient}
        open={Boolean(
          viewingOrder &&
            viewingPatient
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingOrderId(
              null
            )
          }
        }}
        onScheduleOrder={
          openSchedule
        }
        onTogglePreparationItem={
          handleTogglePreparationItem
        }
        onCheckIn={handleCheckIn}
        onMarkReady={
          handleMarkReady
        }
        onStartImaging={
          handleStartImaging
        }
        onMarkImagesAcquired={
          handleImagesAcquired
        }
        onTechnicallyComplete={
          handleTechnicalCompletion
        }
        onOpenPatientProfile={
          openPatientProfile
        }
        onOpenConsultation={
          openConsultation
        }
      />

      <RadiologyCancelDialog
        order={cancellingOrder}
        patientName={
          cancellingPatient
            ? getPatientFullName(
                cancellingPatient
              )
            : "Selected patient"
        }
        open={Boolean(
          cancellingOrder
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCancellingOrderId(
              null
            )
          }
        }}
        onConfirmCancel={
          handleConfirmCancel
        }
      />

      <RadiologyNoShowDialog
        order={noShowOrder}
        patientName={
          noShowPatient
            ? getPatientFullName(
                noShowPatient
              )
            : "Selected patient"
        }
        open={Boolean(
          noShowOrder
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setNoShowOrderId(null)
          }
        }}
        onConfirmNoShow={
          handleConfirmNoShow
        }
      />
    </>
  )
}
