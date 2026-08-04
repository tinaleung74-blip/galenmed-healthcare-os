"use client"

import type {
  ReactNode,
} from "react"
import {
  BadgeCheck,
  CalendarClock,
  LockKeyhole,
  MessageSquare,
  PackageCheck,
  Pill,
  Send,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  PHARMACY_DOSAGE_FORM_LABELS,
  PHARMACY_MEDICATION_ROUTE_LABELS,
  PHARMACY_PRESCRIPTION_ITEM_STATUS_LABELS,
  PHARMACY_PRESCRIPTION_SOURCE_LABELS,
} from "@/features/pharmacy/constants/pharmacy.constants"
import type {
  PatientReleasedMedicationRecord,
} from "@/features/patients/types/patient-pharmacy-history.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface PatientMedicationDetailsSheetProps {
  record:
    | PatientReleasedMedicationRecord
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void
}

interface DetailItemProps {
  label: string
  value: ReactNode
  className?: string
}

function DetailItem({
  label,
  value,
  className,
}: DetailItemProps) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm">
        {value}
      </dd>
    </div>
  )
}

export function PatientMedicationDetailsSheet({
  record,
  open,
  onOpenChange,
}: PatientMedicationDetailsSheetProps) {
  if (!record) {
    return null
  }

  const { prescription } =
    record

  const activeItems =
    prescription.items.filter(
      (item) =>
        item.status !==
        "cancelled"
    )

  const dispensingRecords =
    prescription.dispensingRecords ??
    []

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-4xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <Pill
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle>
                Released Medication Record
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {
                  prescription.prescriptionNumber
                }
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <PharmacyPrescriptionStatusBadge
                  status={
                    prescription.status
                  }
                />

                <PharmacyPrescriptionPriorityBadge
                  priority={
                    prescription.priority
                  }
                />

                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                  <LockKeyhole
                    className="size-3"
                    aria-hidden="true"
                  />
                  Released / Read-only
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Pill
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Prescription information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Prescription reference"
                value={
                  <span className="font-mono text-xs">
                    {
                      prescription.prescriptionNumber
                    }
                  </span>
                }
              />

              <DetailItem
                label="Prescriber"
                value={
                  prescription.prescriberName
                }
              />

              <DetailItem
                label="Prescription source"
                value={
                  PHARMACY_PRESCRIPTION_SOURCE_LABELS[
                    prescription.source
                  ]
                }
              />

              <DetailItem
                label="Pharmacy branch"
                value={
                  prescription.branchName
                }
              />

              <DetailItem
                label="Consultation reference"
                value={
                  prescription.consultationNumber ??
                  "Not linked"
                }
              />

              <DetailItem
                label="Created"
                value={formatPatientDateTime(
                  prescription.createdAt
                )}
              />

              <DetailItem
                label="Clinical notes"
                className="sm:col-span-2"
                value={
                  prescription.clinicalNotes ??
                  "No clinical notes recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Released medication items
            </h3>

            <div className="overflow-hidden rounded-xl border">
              <Table className="min-w-[1150px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Medication
                    </TableHead>

                    <TableHead>
                      Dose and route
                    </TableHead>

                    <TableHead>
                      Frequency / Duration
                    </TableHead>

                    <TableHead>
                      Quantity
                    </TableHead>

                    <TableHead>
                      Instructions
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {activeItems.map(
                    (item) => (
                      <TableRow
                        key={item.id}
                      >
                        <TableCell>
                          <p className="font-medium">
                            {
                              item.genericName
                            }{" "}
                            {item.strength}
                          </p>

                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {
                              item.medicationSku
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              PHARMACY_DOSAGE_FORM_LABELS[
                                item.dosageForm
                              ]
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            {item.dose}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              PHARMACY_MEDICATION_ROUTE_LABELS[
                                item.route
                              ]
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            {item.frequency}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.durationDays
                              ? `${item.durationDays} day(s)`
                              : "Duration not recorded"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            Prescribed:{" "}
                            {
                              item.quantityPrescribed
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Dispensed:{" "}
                            {
                              item.quantityDispensed
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="max-w-sm whitespace-pre-wrap text-sm">
                            {
                              item.instructions
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Substitution:{" "}
                            {item.substitutionAllowed
                              ? "Allowed"
                              : "Not allowed"}
                          </p>
                        </TableCell>

                        <TableCell>
                          {
                            PHARMACY_PRESCRIPTION_ITEM_STATUS_LABELS[
                              item.status
                            ]
                          }
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="size-4 text-amber-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Pharmacy safety review
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Allergy review"
                value={
                  <PharmacyReviewStatusBadge
                    status={
                      prescription
                        .allergyReviewStatus
                    }
                  />
                }
              />

              <DetailItem
                label="Interaction review"
                value={
                  <PharmacyReviewStatusBadge
                    status={
                      prescription
                        .interactionReviewStatus
                    }
                  />
                }
              />

              <DetailItem
                label="Allergy reviewed by"
                value={
                  prescription
                    .allergyReviewBy ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Allergy reviewed at"
                value={formatPatientDateTime(
                  prescription
                    .allergyReviewAt
                )}
              />

              <DetailItem
                label="Allergy-review notes"
                value={
                  prescription
                    .allergyReviewNotes ??
                  "No notes recorded"
                }
              />

              <DetailItem
                label="Interaction-review notes"
                value={
                  prescription
                    .interactionReviewNotes ??
                  "No notes recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <PackageCheck
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Dispensing ledger
              </h3>
            </div>

            {dispensingRecords.length >
            0 ? (
              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[950px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Medication
                      </TableHead>

                      <TableHead>
                        Quantity
                      </TableHead>

                      <TableHead>
                        Inventory batch
                      </TableHead>

                      <TableHead>
                        Dispensed
                      </TableHead>

                      <TableHead>
                        Label review
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {dispensingRecords.map(
                      (record) => (
                        <TableRow
                          key={record.id}
                        >
                          <TableCell>
                            <p className="font-medium">
                              {
                                record.genericName
                              }{" "}
                              {record.strength}
                            </p>

                            <p className="font-mono text-xs text-muted-foreground">
                              {
                                record.medicationSku
                              }
                            </p>
                          </TableCell>

                          <TableCell>
                            {
                              record.quantityDispensed
                            }
                          </TableCell>

                          <TableCell>
                            <span className="font-mono text-xs">
                              {
                                record.batchNumber
                              }
                            </span>
                          </TableCell>

                          <TableCell>
                            <p>
                              {formatPatientDateTime(
                                record.dispensedAt
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                record.dispensedBy
                              }
                            </p>
                          </TableCell>

                          <TableCell>
                            {record
                              .labelReviewConfirmed
                              ? "Confirmed"
                              : "Not confirmed"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Historical dispensing totals
                are available, but the
                inventory-batch ledger was
                not recorded for this seeded
                development prescription.
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Verification, counseling, and release
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Pharmacist verified by"
                value={
                  <span className="inline-flex items-center gap-2">
                    <BadgeCheck
                      className="size-3.5 text-emerald-700"
                      aria-hidden="true"
                    />

                    {prescription
                      .pharmacistVerifiedBy ??
                      "Not recorded"}
                  </span>
                }
              />

              <DetailItem
                label="Pharmacist verified at"
                value={formatPatientDateTime(
                  prescription
                    .pharmacistVerifiedAt
                )}
              />

              <DetailItem
                label="Verification notes"
                className="sm:col-span-2"
                value={
                  prescription
                    .pharmacistVerificationNotes ??
                  "No notes recorded"
                }
              />

              <DetailItem
                label="Counseling completed by"
                value={
                  <span className="inline-flex items-center gap-2">
                    <MessageSquare
                      className="size-3.5 text-cyan-700"
                      aria-hidden="true"
                    />

                    {prescription
                      .counselingCompletedBy ??
                      "Not recorded"}
                  </span>
                }
              />

              <DetailItem
                label="Counseling completed at"
                value={formatPatientDateTime(
                  prescription
                    .counselingCompletedAt
                )}
              />

              <DetailItem
                label="Counseling notes"
                className="sm:col-span-2"
                value={
                  prescription
                    .counselingNotes ??
                  "No counseling notes recorded"
                }
              />

              <DetailItem
                label="Released by"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Send
                      className="size-3.5 text-teal-700"
                      aria-hidden="true"
                    />

                    {prescription.releasedBy ??
                      "Not recorded"}
                  </span>
                }
              />

              <DetailItem
                label="Released at"
                value={formatPatientDateTime(
                  prescription.releasedAt
                )}
              />
            </dl>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-teal-800">
            <LockKeyhole
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This released medication record
              is read-only. Medication,
              dispensing, safety-review,
              counseling, and staff records
              remain synthetic development
              data.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
