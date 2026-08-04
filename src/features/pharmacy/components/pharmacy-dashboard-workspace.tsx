"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  useRouter,
} from "next/navigation"
import {
  BadgeCheck,
  Eye,
  MessageSquare,
  PackageCheck,
  Pill,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
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
import { PharmacyCancelDialog } from "@/features/pharmacy/components/pharmacy-cancel-dialog"
import { PharmacyCounselingDialog } from "@/features/pharmacy/components/pharmacy-counseling-dialog"
import { PharmacyDispenseDialog } from "@/features/pharmacy/components/pharmacy-dispense-dialog"
import { PharmacyDispensingVerificationDialog } from "@/features/pharmacy/components/pharmacy-dispensing-verification-dialog"
import { PharmacyPrescriptionDetailsSheet } from "@/features/pharmacy/components/pharmacy-prescription-details-sheet"
import { PharmacyPrescriptionFormDialog } from "@/features/pharmacy/components/pharmacy-prescription-form-dialog"
import { PharmacyReleaseDialog } from "@/features/pharmacy/components/pharmacy-release-dialog"
import { PharmacySafetyReviewDialog } from "@/features/pharmacy/components/pharmacy-safety-review-dialog"
import {
  PharmacyInventoryStatusBadge,
  PharmacyPrescriptionPriorityBadge,
  PharmacyPrescriptionStatusBadge,
  PharmacyReviewStatusBadge,
} from "@/features/pharmacy/components/pharmacy-status-badges"
import {
  PHARMACY_DATE_VIEW_LABELS,
  PHARMACY_DEFAULT_FILTERS,
  PHARMACY_INVENTORY_STATUS_LABELS,
  PHARMACY_PRESCRIPTION_PRIORITY_LABELS,
  PHARMACY_PRESCRIPTION_SOURCE_LABELS,
  PHARMACY_PRESCRIPTION_STATUS_LABELS,
  PHARMACY_REVIEW_STATUS_LABELS,
} from "@/features/pharmacy/constants/pharmacy.constants"
import {
  usePharmacy,
} from "@/features/pharmacy/providers/pharmacy-provider"
import type {
  PharmacyDispenseFormValues,
} from "@/features/pharmacy/schemas/pharmacy-dispense.schema"
import type {
  PharmacyPrescriptionFormValues,
} from "@/features/pharmacy/schemas/pharmacy-prescription.schema"
import type {
  PharmacyCounselingValues,
  PharmacyDispensingVerificationValues,
  PharmacyPrescriptionReviewValues,
  PharmacyReleaseValues,
} from "@/features/pharmacy/schemas/pharmacy-review.schema"
import {
  PHARMACY_DATE_VIEWS,
  PHARMACY_INVENTORY_STATUSES,
  PHARMACY_PRESCRIPTION_PRIORITIES,
  PHARMACY_PRESCRIPTION_SOURCES,
  PHARMACY_PRESCRIPTION_STATUSES,
  PHARMACY_REVIEW_STATUSES,
  type PharmacyDateView,
  type PharmacyInventoryItem,
  type PharmacyInventoryStatus,
  type PharmacyPrescription,
  type PharmacyPrescriptionFilters,
  type PharmacyPrescriptionPriority,
  type PharmacyPrescriptionSource,
  type PharmacyPrescriptionStatus,
  type PharmacyReviewStatus,
} from "@/features/pharmacy/types/pharmacy.types"
import {
  derivePharmacyInventoryStatus,
  findAvailableInventoryForMedication,
  getPrescriptionItemRemainingQuantity,
} from "@/features/pharmacy/utils/pharmacy.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatientAllergies,
} from "@/features/patients/providers/patient-allergy-provider"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
  getPatientInitials,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"

const priorityOrder: Record<
  PharmacyPrescriptionPriority,
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

function matchesDateView(
  prescription:
    PharmacyPrescription,

  dateView:
    PharmacyDateView,

  selectedDate: string
): boolean {
  if (dateView === "all") {
    return true
  }

  const prescriptionDate =
    getLocalDateKey(
      prescription.createdAt
    )

  if (dateView === "day") {
    return (
      prescriptionDate ===
      selectedDate
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
      prescription.createdAt
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

function getPrescriptionInventoryStatus(
  prescription:
    PharmacyPrescription,

  inventoryItems:
    readonly PharmacyInventoryItem[]
): PharmacyInventoryStatus {
  const remainingItems =
    prescription.items.filter(
      (item) =>
        item.status !==
          "cancelled" &&
        getPrescriptionItemRemainingQuantity(
          item
        ) > 0
    )

  if (
    remainingItems.length === 0
  ) {
    return "available"
  }

  let hasLowStock = false

  for (
    const item of remainingItems
  ) {
    const batches =
      findAvailableInventoryForMedication(
        inventoryItems,
        item.medicationId,
        prescription.branchId
      )

    if (batches.length === 0) {
      return "out-of-stock"
    }

    if (
      batches.some(
        (batch) =>
          derivePharmacyInventoryStatus(
            batch
          ) === "low-stock"
      )
    ) {
      hasLowStock = true
    }
  }

  return hasLowStock
    ? "low-stock"
    : "available"
}

function matchesPrescriptionSearch(
  prescription:
    PharmacyPrescription,

  patient: Patient | null,

  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  return normalizePatientSearch(
    prescription.prescriptionNumber,
    prescription.consultationNumber,
    prescription.prescriberName,
    prescription.branchName,
    prescription.clinicalNotes,
    prescription.items
      .map(
        (item) =>
          `${item.medicationSku} ${item.genericName} ${item.strength}`
      )
      .join(" "),
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
  | PharmacyPrescriptionStatus
  | "all" {
  return (
    value === "all" ||
    PHARMACY_PRESCRIPTION_STATUSES.some(
      (status) =>
        status === value
    )
  )
}

function isPriorityFilter(
  value: string
): value is
  | PharmacyPrescriptionPriority
  | "all" {
  return (
    value === "all" ||
    PHARMACY_PRESCRIPTION_PRIORITIES.some(
      (priority) =>
        priority === value
    )
  )
}

function isSourceFilter(
  value: string
): value is
  | PharmacyPrescriptionSource
  | "all" {
  return (
    value === "all" ||
    PHARMACY_PRESCRIPTION_SOURCES.some(
      (source) =>
        source === value
    )
  )
}

function isReviewFilter(
  value: string
): value is
  | PharmacyReviewStatus
  | "all" {
  return (
    value === "all" ||
    PHARMACY_REVIEW_STATUSES.some(
      (status) =>
        status === value
    )
  )
}

function isInventoryFilter(
  value: string
): value is
  | PharmacyInventoryStatus
  | "all" {
  return (
    value === "all" ||
    PHARMACY_INVENTORY_STATUSES.some(
      (status) =>
        status === value
    )
  )
}

function isDateView(
  value: string
): value is PharmacyDateView {
  return PHARMACY_DATE_VIEWS.some(
    (dateView) =>
      dateView === value
  )
}

export function PharmacyDashboardWorkspace() {
  const router = useRouter()

  const { patients } =
    usePatients()

  const { allergyRecords } =
    usePatientAllergies()

  const {
    prescriptions,
    inventoryItems,
    createPharmacyPrescription,
    reviewPharmacyPrescription,
    dispensePharmacyPrescriptionItem,
    verifyPharmacyDispensing,
    completePharmacyCounseling,
    releasePharmacyPrescription,
    cancelPharmacyPrescription,
  } = usePharmacy()

  const [
    filters,
    setFilters,
  ] =
    useState<PharmacyPrescriptionFilters>(
      () => ({
        ...PHARMACY_DEFAULT_FILTERS,
      })
    )

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    viewingPrescriptionId,
    setViewingPrescriptionId,
  ] = useState<string | null>(
    null
  )

  const [
    reviewingPrescriptionId,
    setReviewingPrescriptionId,
  ] = useState<string | null>(
    null
  )

  const [
    dispensingPrescriptionId,
    setDispensingPrescriptionId,
  ] = useState<string | null>(
    null
  )

  const [
    verifyingPrescriptionId,
    setVerifyingPrescriptionId,
  ] = useState<string | null>(
    null
  )

  const [
    counselingPrescriptionId,
    setCounselingPrescriptionId,
  ] = useState<string | null>(
    null
  )

  const [
    releasingPrescriptionId,
    setReleasingPrescriptionId,
  ] = useState<string | null>(
    null
  )

  const [
    cancellingPrescriptionId,
    setCancellingPrescriptionId,
  ] = useState<string | null>(
    null
  )

  function getAllergySummary(
    patientId: string
  ): string[] {
    return allergyRecords
      .filter(
        (record) =>
          record.patientId ===
            patientId &&
          record.recordStatus !==
            "archived"
      )
      .map((record) => {
        const reactions =
          record.reactionManifestations
            .length > 0
            ? ` — ${record.reactionManifestations.join(
                ", "
              )}`
            : ""

        return `${record.allergenName}${reactions}`
      })
  }

  const filteredPrescriptions =
    useMemo(
      () =>
        prescriptions
          .filter(
            (prescription) => {
              const patient =
                findPatient(
                  patients,
                  prescription.patientId
                )

              const inventoryStatus =
                getPrescriptionInventoryStatus(
                  prescription,
                  inventoryItems
                )

              return (
                matchesPrescriptionSearch(
                  prescription,
                  patient,
                  filters.search
                ) &&
                (
                  filters.status ===
                    "all" ||
                  prescription.status ===
                    filters.status
                ) &&
                (
                  filters.priority ===
                    "all" ||
                  prescription.priority ===
                    filters.priority
                ) &&
                (
                  filters.source ===
                    "all" ||
                  prescription.source ===
                    filters.source
                ) &&
                (
                  filters
                    .allergyReviewStatus ===
                    "all" ||
                  prescription
                    .allergyReviewStatus ===
                    filters
                      .allergyReviewStatus
                ) &&
                (
                  filters
                    .inventoryStatus ===
                    "all" ||
                  inventoryStatus ===
                    filters
                      .inventoryStatus
                ) &&
                (
                  filters.branchId ===
                    "all" ||
                  prescription.branchId ===
                    filters.branchId
                ) &&
                matchesDateView(
                  prescription,
                  filters.dateView,
                  filters.selectedDate
                )
              )
            }
          )
          .sort(
            (
              firstPrescription,
              secondPrescription
            ) =>
              priorityOrder[
                firstPrescription.priority
              ] -
                priorityOrder[
                  secondPrescription.priority
                ] ||
              new Date(
                secondPrescription.createdAt
              ).getTime() -
                new Date(
                  firstPrescription.createdAt
                ).getTime()
          ),
      [
        filters,
        inventoryItems,
        patients,
        prescriptions,
      ]
    )

  const selectedDayPrescriptions =
    prescriptions.filter(
      (prescription) =>
        getLocalDateKey(
          prescription.createdAt
        ) === filters.selectedDate
    )

  const pendingReviewCount =
    selectedDayPrescriptions.filter(
      (prescription) =>
        prescription.status ===
          "received" ||
        prescription.status ===
          "pending-review" ||
        prescription.status ===
          "on-hold"
    ).length

  const readyToDispenseCount =
    selectedDayPrescriptions.filter(
      (prescription) =>
        prescription.status ===
          "approved" ||
        prescription.status ===
          "partially-dispensed"
    ).length

  const postDispensingCount =
    selectedDayPrescriptions.filter(
      (prescription) =>
        prescription.status ===
          "dispensed" &&
        !prescription.releasedAt
    ).length

  const releasedCount =
    selectedDayPrescriptions.filter(
      (prescription) =>
        Boolean(
          prescription.releasedAt
        )
    ).length

  const viewingPrescription =
    prescriptions.find(
      (prescription) =>
        prescription.id ===
        viewingPrescriptionId
    ) ?? null

  const reviewingPrescription =
    prescriptions.find(
      (prescription) =>
        prescription.id ===
        reviewingPrescriptionId
    ) ?? null

  const dispensingPrescription =
    prescriptions.find(
      (prescription) =>
        prescription.id ===
        dispensingPrescriptionId
    ) ?? null

  const verifyingPrescription =
    prescriptions.find(
      (prescription) =>
        prescription.id ===
        verifyingPrescriptionId
    ) ?? null

  const counselingPrescription =
    prescriptions.find(
      (prescription) =>
        prescription.id ===
        counselingPrescriptionId
    ) ?? null

  const releasingPrescription =
    prescriptions.find(
      (prescription) =>
        prescription.id ===
        releasingPrescriptionId
    ) ?? null

  const cancellingPrescription =
    prescriptions.find(
      (prescription) =>
        prescription.id ===
        cancellingPrescriptionId
    ) ?? null

  const viewingPatient =
    viewingPrescription
      ? findPatient(
          patients,
          viewingPrescription.patientId
        )
      : null

  const cancellingPatient =
    cancellingPrescription
      ? findPatient(
          patients,
          cancellingPrescription.patientId
        )
      : null

  const hasActiveFilters =
    filters.search.trim().length >
      0 ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.source !== "all" ||
    filters.allergyReviewStatus !==
      "all" ||
    filters.inventoryStatus !==
      "all" ||
    filters.branchId !== "all" ||
    filters.dateView !== "day" ||
    filters.selectedDate !==
      "2026-08-04"

  function updateFilter<
    Key extends keyof PharmacyPrescriptionFilters,
  >(
    key: Key,
    value:
      PharmacyPrescriptionFilters[Key]
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
      ...PHARMACY_DEFAULT_FILTERS,
    })
  }

  async function handleCreatePrescription(
    values:
      PharmacyPrescriptionFormValues
  ) {
    const newPrescription =
      createPharmacyPrescription(
        values
      )

    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        search: "",
        status: "all",
        dateView: "all",
      })
    )

    toast.success(
      "Pharmacy prescription created",
      {
        description: `${newPrescription.prescriptionNumber} was created successfully.`,
      }
    )
  }

  async function handleSafetyReview(
    values:
      PharmacyPrescriptionReviewValues
  ) {
    if (!reviewingPrescription) {
      throw new Error(
        "No prescription was selected."
      )
    }

    const updatedPrescription =
      reviewPharmacyPrescription(
        reviewingPrescription.id,
        values
      )

    toast.success(
      "Pharmacy safety review saved",
      {
        description: `${updatedPrescription.prescriptionNumber} is now ${PHARMACY_PRESCRIPTION_STATUS_LABELS[
          updatedPrescription.status
        ].toLowerCase()}.`,
      }
    )
  }

  async function handleDispense(
    values:
      PharmacyDispenseFormValues
  ) {
    if (!dispensingPrescription) {
      throw new Error(
        "No prescription was selected."
      )
    }

    const updatedPrescription =
      dispensePharmacyPrescriptionItem(
        dispensingPrescription.id,
        values
      )

    toast.success(
      "Medication dispensing recorded",
      {
        description: `${updatedPrescription.prescriptionNumber} was updated successfully.`,
      }
    )
  }

  async function handleVerify(
    values:
      PharmacyDispensingVerificationValues
  ) {
    if (!verifyingPrescription) {
      throw new Error(
        "No prescription was selected."
      )
    }

    const updatedPrescription =
      verifyPharmacyDispensing(
        verifyingPrescription.id,
        values
      )

    toast.success(
      "Dispensing verified",
      {
        description: `${updatedPrescription.prescriptionNumber} is ready for medication counseling.`,
      }
    )
  }

  async function handleCounseling(
    values:
      PharmacyCounselingValues
  ) {
    if (!counselingPrescription) {
      throw new Error(
        "No prescription was selected."
      )
    }

    const updatedPrescription =
      completePharmacyCounseling(
        counselingPrescription.id,
        values
      )

    toast.success(
      "Medication counseling completed",
      {
        description: `${updatedPrescription.prescriptionNumber} is ready for release.`,
      }
    )
  }

  async function handleRelease(
    values:
      PharmacyReleaseValues
  ) {
    if (!releasingPrescription) {
      throw new Error(
        "No prescription was selected."
      )
    }

    const updatedPrescription =
      releasePharmacyPrescription(
        releasingPrescription.id,
        values
      )

    toast.success(
      "Medication released",
      {
        description: `${updatedPrescription.prescriptionNumber} is now released and read-only.`,
      }
    )
  }

  function handleCancel(
    cancellationReason: string
  ) {
    if (!cancellingPrescription) {
      return
    }

    try {
      const updatedPrescription =
        cancelPharmacyPrescription(
          cancellingPrescription.id,
          cancellationReason
        )

      toast.success(
        "Prescription cancelled",
        {
          description: `${updatedPrescription.prescriptionNumber} was cancelled.`,
        }
      )

      setCancellingPrescriptionId(
        null
      )
    } catch (error) {
      toast.error(
        "Unable to cancel prescription",
        {
          description:
            error instanceof Error
              ? error.message
              : "Prescription cancellation failed.",
        }
      )
    }
  }

  function openPatientProfile(
    patient: Patient
  ) {
    setViewingPrescriptionId(
      null
    )

    router.push(
      `/patients/${encodeURIComponent(
        patient.medicalRecordNumber
      )}`
    )
  }

  function openConsultation(
    consultationId: string
  ) {
    setViewingPrescriptionId(
      null
    )

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
              <Pill
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Medication dispensing operations
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Pharmacy Prescription Queue
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage prescription review,
                stock availability,
                dispensing, verification,
                counseling, and release.
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
            Create prescription
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Pending safety review
              </p>

              <p className="mt-1 text-xl font-semibold">
                {pendingReviewCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Ready to dispense
              </p>

              <p className="mt-1 text-xl font-semibold">
                {readyToDispenseCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-violet-700">
                Verification / Counseling
              </p>

              <p className="mt-1 text-xl font-semibold text-violet-800">
                {postDispensingCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Released
              </p>

              <p className="mt-1 text-xl font-semibold">
                {releasedCount}
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
                  placeholder="Search patient, MRN, prescription, medication, or prescriber"
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
                    const nextValue =
                      event.target.value

                    if (
                      isDateView(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "dateView",
                        nextValue
                      )
                    }
                  }}
                >
                  {PHARMACY_DATE_VIEWS.map(
                    (dateView) => (
                      <option
                        key={dateView}
                        value={dateView}
                      >
                        {
                          PHARMACY_DATE_VIEW_LABELS[
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
                    const nextValue =
                      event.target.value

                    if (
                      isStatusFilter(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "status",
                        nextValue
                      )
                    }
                  }}
                >
                  <option value="all">
                    All statuses
                  </option>

                  {PHARMACY_PRESCRIPTION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          PHARMACY_PRESCRIPTION_STATUS_LABELS[
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
                    const nextValue =
                      event.target.value

                    if (
                      isPriorityFilter(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "priority",
                        nextValue
                      )
                    }
                  }}
                >
                  <option value="all">
                    All priorities
                  </option>

                  {PHARMACY_PRESCRIPTION_PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {
                          PHARMACY_PRESCRIPTION_PRIORITY_LABELS[
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
                    const nextValue =
                      event.target.value

                    if (
                      isSourceFilter(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "source",
                        nextValue
                      )
                    }
                  }}
                >
                  <option value="all">
                    All sources
                  </option>

                  {PHARMACY_PRESCRIPTION_SOURCES.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {
                          PHARMACY_PRESCRIPTION_SOURCE_LABELS[
                            source
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filters.allergyReviewStatus
                  }
                  className={selectClassName}
                  onChange={(event) => {
                    const nextValue =
                      event.target.value

                    if (
                      isReviewFilter(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "allergyReviewStatus",
                        nextValue
                      )
                    }
                  }}
                >
                  <option value="all">
                    All allergy reviews
                  </option>

                  {PHARMACY_REVIEW_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          PHARMACY_REVIEW_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filters.inventoryStatus
                  }
                  className={selectClassName}
                  onChange={(event) => {
                    const nextValue =
                      event.target.value

                    if (
                      isInventoryFilter(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "inventoryStatus",
                        nextValue
                      )
                    }
                  }}
                >
                  <option value="all">
                    All inventory statuses
                  </option>

                  {PHARMACY_INVENTORY_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          PHARMACY_INVENTORY_STATUS_LABELS[
                            status
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
              {filteredPrescriptions.length}
              {" of "}
              {prescriptions.length} pharmacy
              prescriptions
            </p>
          </div>

          {filteredPrescriptions.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Pill
                className="size-8 text-teal-700"
                aria-hidden="true"
              />

              <h2 className="mt-4 font-semibold">
                No matching prescriptions
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
            <Table className="min-w-[1450px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Prescription
                  </TableHead>

                  <TableHead>
                    Patient
                  </TableHead>

                  <TableHead>
                    Medications
                  </TableHead>

                  <TableHead>
                    Safety review
                  </TableHead>

                  <TableHead>
                    Inventory
                  </TableHead>

                  <TableHead>
                    Source
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
                {filteredPrescriptions.map(
                  (prescription) => {
                    const patient =
                      findPatient(
                        patients,
                        prescription.patientId
                      )

                    const inventoryStatus =
                      getPrescriptionInventoryStatus(
                        prescription,
                        inventoryItems
                      )

                    const needsReview =
                      !prescription.releasedAt &&
                      [
                        "received",
                        "pending-review",
                        "on-hold",
                      ].includes(
                        prescription.status
                      )

                    const needsDispensing =
                      !prescription.releasedAt &&
                      (
                        prescription.status ===
                          "approved" ||
                        prescription.status ===
                          "partially-dispensed"
                      )

                    const needsVerification =
                      !prescription.releasedAt &&
                      prescription.status ===
                        "dispensed" &&
                      !prescription
                        .pharmacistVerifiedAt

                    const needsCounseling =
                      !prescription.releasedAt &&
                      prescription.status ===
                        "dispensed" &&
                      Boolean(
                        prescription
                          .pharmacistVerifiedAt
                      ) &&
                      !prescription
                        .counselingCompletedAt

                    const needsRelease =
                      !prescription.releasedAt &&
                      prescription.status ===
                        "dispensed" &&
                      Boolean(
                        prescription
                          .pharmacistVerifiedAt
                      ) &&
                      Boolean(
                        prescription
                          .counselingCompletedAt
                      )

                    return (
                      <TableRow
                        key={
                          prescription.id
                        }
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {
                              prescription.prescriptionNumber
                            }
                          </p>

                          <div className="mt-2">
                            <PharmacyPrescriptionPriorityBadge
                              priority={
                                prescription.priority
                              }
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-56 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
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
                            {prescription.items.map(
                              (item) => (
                                <p
                                  key={item.id}
                                  className="text-sm"
                                >
                                  {
                                    item.genericName
                                  }{" "}
                                  {item.strength}
                                  {" · "}
                                  {
                                    item.quantityDispensed
                                  }
                                  /
                                  {
                                    item.quantityPrescribed
                                  }
                                </p>
                              )
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Allergy
                              </span>

                              <PharmacyReviewStatusBadge
                                status={
                                  prescription
                                    .allergyReviewStatus
                                }
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Interaction
                              </span>

                              <PharmacyReviewStatusBadge
                                status={
                                  prescription
                                    .interactionReviewStatus
                                }
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <PharmacyInventoryStatusBadge
                            status={
                              inventoryStatus
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {
                            PHARMACY_PRESCRIPTION_SOURCE_LABELS[
                              prescription.source
                            ]
                          }

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              prescription.prescriberName
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <PharmacyPrescriptionStatusBadge
                            status={
                              prescription.status
                            }
                          />

                          {prescription.releasedAt ? (
                            <p className="mt-2 text-xs font-medium text-teal-700">
                              Released{" "}
                              {formatPatientDateTime(
                                prescription.releasedAt
                              )}
                            </p>
                          ) : null}
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-56 flex-wrap gap-2">
                            {needsReview ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  setReviewingPrescriptionId(
                                    prescription.id
                                  )
                                }
                              >
                                <ShieldCheck
                                  aria-hidden="true"
                                />
                                Review
                              </Button>
                            ) : needsDispensing ? (
                              <Button
                                type="button"
                                size="sm"
                                className="bg-violet-700 text-white hover:bg-violet-800"
                                onClick={() =>
                                  setDispensingPrescriptionId(
                                    prescription.id
                                  )
                                }
                              >
                                <PackageCheck
                                  aria-hidden="true"
                                />
                                Dispense
                              </Button>
                            ) : needsVerification ? (
                              <Button
                                type="button"
                                size="sm"
                                className="bg-emerald-700 text-white hover:bg-emerald-800"
                                onClick={() =>
                                  setVerifyingPrescriptionId(
                                    prescription.id
                                  )
                                }
                              >
                                <BadgeCheck
                                  aria-hidden="true"
                                />
                                Verify
                              </Button>
                            ) : needsCounseling ? (
                              <Button
                                type="button"
                                size="sm"
                                className="bg-cyan-700 text-white hover:bg-cyan-800"
                                onClick={() =>
                                  setCounselingPrescriptionId(
                                    prescription.id
                                  )
                                }
                              >
                                <MessageSquare
                                  aria-hidden="true"
                                />
                                Counsel
                              </Button>
                            ) : needsRelease ? (
                              <Button
                                type="button"
                                size="sm"
                                className="bg-teal-700 text-white hover:bg-teal-800"
                                onClick={() =>
                                  setReleasingPrescriptionId(
                                    prescription.id
                                  )
                                }
                              >
                                <Send
                                  aria-hidden="true"
                                />
                                Release
                              </Button>
                            ) : null}

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setViewingPrescriptionId(
                                  prescription.id
                                )
                              }
                            >
                              <Eye
                                aria-hidden="true"
                              />
                              Details
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
        </div>
      </section>

      <PharmacyPrescriptionFormDialog
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        onSubmitPrescription={
          handleCreatePrescription
        }
      />

      <PharmacySafetyReviewDialog
        prescription={
          reviewingPrescription
        }
        patientAllergySummary={
          reviewingPrescription
            ? getAllergySummary(
                reviewingPrescription.patientId
              )
            : []
        }
        open={Boolean(
          reviewingPrescription
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setReviewingPrescriptionId(
              null
            )
          }
        }}
        onSubmitReview={
          handleSafetyReview
        }
      />

      <PharmacyDispenseDialog
        prescription={
          dispensingPrescription
        }
        inventoryItems={
          inventoryItems
        }
        open={Boolean(
          dispensingPrescription
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDispensingPrescriptionId(
              null
            )
          }
        }}
        onSubmitDispense={
          handleDispense
        }
      />

      <PharmacyDispensingVerificationDialog
        prescription={
          verifyingPrescription
        }
        open={Boolean(
          verifyingPrescription
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setVerifyingPrescriptionId(
              null
            )
          }
        }}
        onSubmitVerification={
          handleVerify
        }
      />

      <PharmacyCounselingDialog
        prescription={
          counselingPrescription
        }
        open={Boolean(
          counselingPrescription
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCounselingPrescriptionId(
              null
            )
          }
        }}
        onSubmitCounseling={
          handleCounseling
        }
      />

      <PharmacyReleaseDialog
        prescription={
          releasingPrescription
        }
        open={Boolean(
          releasingPrescription
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setReleasingPrescriptionId(
              null
            )
          }
        }}
        onSubmitRelease={
          handleRelease
        }
      />

      <PharmacyPrescriptionDetailsSheet
        prescription={
          viewingPrescription
        }
        patient={viewingPatient}
        inventoryItems={
          inventoryItems
        }
        patientAllergySummary={
          viewingPrescription
            ? getAllergySummary(
                viewingPrescription.patientId
              )
            : []
        }
        open={Boolean(
          viewingPrescription &&
            viewingPatient
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingPrescriptionId(
              null
            )
          }
        }}
        onReviewSafety={(
          prescription
        ) => {
          setViewingPrescriptionId(
            null
          )

          setReviewingPrescriptionId(
            prescription.id
          )
        }}
        onDispense={(
          prescription
        ) => {
          setViewingPrescriptionId(
            null
          )

          setDispensingPrescriptionId(
            prescription.id
          )
        }}
        onVerify={(
          prescription
        ) => {
          setViewingPrescriptionId(
            null
          )

          setVerifyingPrescriptionId(
            prescription.id
          )
        }}
        onCounsel={(
          prescription
        ) => {
          setViewingPrescriptionId(
            null
          )

          setCounselingPrescriptionId(
            prescription.id
          )
        }}
        onRelease={(
          prescription
        ) => {
          setViewingPrescriptionId(
            null
          )

          setReleasingPrescriptionId(
            prescription.id
          )
        }}
        onCancel={(
          prescription
        ) => {
          setViewingPrescriptionId(
            null
          )

          setCancellingPrescriptionId(
            prescription.id
          )
        }}
        onOpenPatientProfile={
          openPatientProfile
        }
        onOpenConsultation={
          openConsultation
        }
      />

      <PharmacyCancelDialog
        prescription={
          cancellingPrescription
        }
        patientName={
          cancellingPatient
            ? getPatientFullName(
                cancellingPatient
              )
            : "Selected patient"
        }
        open={Boolean(
          cancellingPrescription
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCancellingPrescriptionId(
              null
            )
          }
        }}
        onConfirmCancel={
          handleCancel
        }
      />
    </>
  )
}
