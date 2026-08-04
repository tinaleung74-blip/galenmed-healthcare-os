"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  AlertTriangle,
  Eye,
  Pill,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react"

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
import {
  PharmacyPrescriptionPriorityBadge,
  PharmacyPrescriptionStatusBadge,
  PharmacyReviewStatusBadge,
} from "@/features/pharmacy/components/pharmacy-status-badges"
import {
  PHARMACY_PRESCRIPTION_PRIORITY_LABELS,
  PHARMACY_PRESCRIPTION_SOURCE_LABELS,
} from "@/features/pharmacy/constants/pharmacy.constants"
import {
  usePharmacy,
} from "@/features/pharmacy/providers/pharmacy-provider"
import { PatientMedicationDetailsSheet } from "@/features/patients/components/patient-medication-details-sheet"
import {
  PATIENT_PHARMACY_HISTORY_FILTERS,
  type PatientPharmacyHistoryFilter,
  type PatientReleasedMedicationRecord,
} from "@/features/patients/types/patient-pharmacy-history.types"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface PatientMedicationHistoryProps {
  patientId: string
}

const historyFilterLabels: Record<
  PatientPharmacyHistoryFilter,
  string
> = {
  all: "All released medications",
  routine: "Routine priority",
  urgent: "Urgent priority",
  stat: "STAT priority",
}

const selectClassName =
  "h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"

function isHistoryFilter(
  value: string
): value is PatientPharmacyHistoryFilter {
  return PATIENT_PHARMACY_HISTORY_FILTERS.some(
    (filter) =>
      filter === value
  )
}

function hasSafetyWarning(
  record:
    PatientReleasedMedicationRecord
): boolean {
  const { prescription } =
    record

  return (
    prescription.allergyReviewStatus ===
      "warning" ||
    prescription.allergyReviewStatus ===
      "blocked" ||
    prescription
      .interactionReviewStatus ===
      "warning" ||
    prescription
      .interactionReviewStatus ===
      "blocked"
  )
}

function matchesHistorySearch(
  record:
    PatientReleasedMedicationRecord,

  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const { prescription } =
    record

  return normalizePatientSearch(
    prescription.prescriptionNumber,
    prescription.consultationNumber,
    prescription.prescriberName,
    prescription.branchName,
    prescription.clinicalNotes,
    prescription.pharmacistVerifiedBy,
    prescription.counselingCompletedBy,
    prescription.releasedBy,
    prescription.items
      .map(
        (item) =>
          `${item.medicationSku} ${item.genericName} ${item.strength}`
      )
      .join(" ")
  ).includes(normalizedSearch)
}

export function PatientMedicationHistory({
  patientId,
}: PatientMedicationHistoryProps) {
  const { prescriptions } =
    usePharmacy()

  const [search, setSearch] =
    useState("")

  const [
    historyFilter,
    setHistoryFilter,
  ] =
    useState<PatientPharmacyHistoryFilter>(
      "all"
    )

  const [
    viewingRecordId,
    setViewingRecordId,
  ] = useState<string | null>(
    null
  )

  const releasedRecords =
    useMemo(() => {
      const records:
        PatientReleasedMedicationRecord[] =
        prescriptions
          .filter(
            (prescription) =>
              prescription.patientId ===
                patientId &&
              Boolean(
                prescription.releasedAt
              )
          )
          .map(
            (prescription) => ({
              id: prescription.id,
              prescription,
            })
          )

      return records.sort(
        (
          firstRecord,
          secondRecord
        ) =>
          new Date(
            secondRecord.prescription
              .releasedAt ??
              secondRecord.prescription
                .updatedAt
          ).getTime() -
          new Date(
            firstRecord.prescription
              .releasedAt ??
              firstRecord.prescription
                .updatedAt
          ).getTime()
      )
    }, [
      patientId,
      prescriptions,
    ])

  const filteredRecords =
    useMemo(
      () =>
        releasedRecords.filter(
          (record) =>
            matchesHistorySearch(
              record,
              search
            ) &&
            (
              historyFilter ===
                "all" ||
              record.prescription
                .priority ===
                historyFilter
            )
        ),
      [
        historyFilter,
        releasedRecords,
        search,
      ]
    )

  const viewingRecord =
    releasedRecords.find(
      (record) =>
        record.id ===
        viewingRecordId
    ) ?? null

  const releasedMedicationItemCount =
    releasedRecords.reduce(
      (
        count,
        record
      ) =>
        count +
        record.prescription.items.filter(
          (item) =>
            item.status !==
            "cancelled"
        ).length,
      0
    )

  const safetyWarningCount =
    releasedRecords.filter(
      hasSafetyWarning
    ).length

  const latestReleaseAt =
    releasedRecords[0]
      ?.prescription.releasedAt ??
    null

  const hasActiveFilters =
    search.trim().length > 0 ||
    historyFilter !== "all"

  function resetFilters() {
    setSearch("")
    setHistoryFilter("all")
  }

  return (
    <>
      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
            <Pill
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Released Medication History
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Read-only prescriptions that
              completed dispensing,
              pharmacist verification,
              counseling, and medication
              release.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Released prescriptions
              </p>

              <p className="mt-1 text-xl font-semibold">
                {releasedRecords.length}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Medication items
              </p>

              <p className="mt-1 text-xl font-semibold">
                {
                  releasedMedicationItemCount
                }
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              safetyWarningCount > 0
                ? "border-amber-200 bg-amber-50/40 shadow-none"
                : "shadow-none"
            }
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                With safety warnings
              </p>

              <p className="mt-1 text-xl font-semibold">
                {safetyWarningCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Latest release
              </p>

              <p className="mt-1 text-sm font-semibold">
                {formatPatientDateTime(
                  latestReleaseAt,
                  "No released medication"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="space-y-3 border-b p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  value={search}
                  placeholder="Search medication, prescription, prescriber, or pharmacist"
                  className="pl-8"
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={historyFilter}
                className={selectClassName}
                onChange={(event) => {
                  const nextFilter =
                    event.target.value

                  if (
                    isHistoryFilter(
                      nextFilter
                    )
                  ) {
                    setHistoryFilter(
                      nextFilter
                    )
                  }
                }}
              >
                {PATIENT_PHARMACY_HISTORY_FILTERS.map(
                  (filter) => (
                    <option
                      key={filter}
                      value={filter}
                    >
                      {
                        historyFilterLabels[
                          filter
                        ]
                      }
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

            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {filteredRecords.length} of{" "}
              {releasedRecords.length} released
              prescriptions
            </p>
          </div>

          {releasedRecords.length ===
          0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Pill
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold">
                No released medication
                history
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Prescriptions appear here
                only after dispensing,
                pharmacist verification,
                counseling, and release.
              </p>
            </div>
          ) : filteredRecords.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold">
                No matching released
                medication records
              </h3>

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
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Prescription
                  </TableHead>

                  <TableHead>
                    Medications
                  </TableHead>

                  <TableHead>
                    Released
                  </TableHead>

                  <TableHead>
                    Safety review
                  </TableHead>

                  <TableHead>
                    Priority
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    <span className="sr-only">
                      Medication action
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map(
                  (record) => {
                    const {
                      prescription,
                    } = record

                    const hasWarning =
                      hasSafetyWarning(
                        record
                      )

                    return (
                      <TableRow
                        key={record.id}
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {
                              prescription.prescriptionNumber
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              PHARMACY_PRESCRIPTION_SOURCE_LABELS[
                                prescription.source
                              ]
                            }
                            {" · "}
                            {
                              prescription.prescriberName
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="max-w-xs space-y-1">
                            {prescription.items
                              .filter(
                                (item) =>
                                  item.status !==
                                  "cancelled"
                              )
                              .map(
                                (item) => (
                                  <p
                                    key={
                                      item.id
                                    }
                                    className="text-sm"
                                  >
                                    {
                                      item.genericName
                                    }{" "}
                                    {
                                      item.strength
                                    }
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
                          <p>
                            {formatPatientDateTime(
                              prescription.releasedAt
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              prescription.releasedBy
                            }
                          </p>
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

                            {hasWarning ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                <AlertTriangle
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                                Warning retained
                              </span>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell>
                          <PharmacyPrescriptionPriorityBadge
                            priority={
                              prescription.priority
                            }
                          />

                          <p className="mt-2 text-xs text-muted-foreground">
                            {
                              PHARMACY_PRESCRIPTION_PRIORITY_LABELS[
                                prescription.priority
                              ]
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <PharmacyPrescriptionStatusBadge
                            status={
                              prescription.status
                            }
                          />

                          <p className="mt-2 text-xs font-medium text-teal-700">
                            Released
                          </p>
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setViewingRecordId(
                                record.id
                              )
                            }
                          >
                            <Eye
                              aria-hidden="true"
                            />
                            View medication
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            Medication, dose, instructions,
            allergy and interaction reviews,
            dispensing, counseling, and
            staff records are synthetic
            development data. This is not
            medication advice.
          </p>
        </div>
      </section>

      <PatientMedicationDetailsSheet
        record={viewingRecord}
        open={Boolean(
          viewingRecord
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
      />
    </>
  )
}
