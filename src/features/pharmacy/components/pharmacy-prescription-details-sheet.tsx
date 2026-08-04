"use client"

import type {
  ReactNode,
} from "react"
import {
  BadgeCheck,
  ExternalLink,
  LockKeyhole,
  MessageSquare,
  PackageCheck,
  Pill,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { PharmacyAuditHistory } from "@/features/pharmacy/components/pharmacy-audit-history"
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
  PharmacyInventoryStatusBadge,
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
  PharmacyInventoryItem,
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"
import {
  derivePharmacyInventoryStatus,
  findAvailableInventoryForMedication,
  getPharmacyInventoryAvailableQuantity,
  getPrescriptionItemRemainingQuantity,
} from "@/features/pharmacy/utils/pharmacy.utils"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface PharmacyPrescriptionDetailsSheetProps {
  prescription:
    | PharmacyPrescription
    | null

  patient:
    | Patient
    | null

  inventoryItems:
    readonly PharmacyInventoryItem[]

  patientAllergySummary:
    readonly string[]

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onReviewSafety: (
    prescription:
      PharmacyPrescription
  ) => void

  onDispense: (
    prescription:
      PharmacyPrescription
  ) => void

  onVerify: (
    prescription:
      PharmacyPrescription
  ) => void

  onCounsel: (
    prescription:
      PharmacyPrescription
  ) => void

  onRelease: (
    prescription:
      PharmacyPrescription
  ) => void

  onCancel: (
    prescription:
      PharmacyPrescription
  ) => void

  onOpenPatientProfile: (
    patient: Patient
  ) => void

  onOpenConsultation: (
    consultationId: string
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

export function PharmacyPrescriptionDetailsSheet({
  prescription,
  patient,
  inventoryItems,
  patientAllergySummary,
  open,
  onOpenChange,
  onReviewSafety,
  onDispense,
  onVerify,
  onCounsel,
  onRelease,
  onCancel,
  onOpenPatientProfile,
  onOpenConsultation,
}: PharmacyPrescriptionDetailsSheetProps) {
  if (!prescription || !patient) {
    return null
  }

  const canReview =
    !prescription.releasedAt &&
    [
      "received",
      "pending-review",
      "on-hold",
    ].includes(
      prescription.status
    )

  const canDispense =
    !prescription.releasedAt &&
    (
      prescription.status ===
        "approved" ||
      prescription.status ===
        "partially-dispensed"
    )

  const canVerify =
    !prescription.releasedAt &&
    prescription.status ===
      "dispensed" &&
    !prescription
      .pharmacistVerifiedAt

  const canCounsel =
    !prescription.releasedAt &&
    prescription.status ===
      "dispensed" &&
    Boolean(
      prescription
        .pharmacistVerifiedAt
    ) &&
    !prescription
      .counselingCompletedAt

  const canRelease =
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

  const canCancel =
    prescription.status !==
      "cancelled" &&
    !prescription.releasedAt &&
    prescription.items.every(
      (item) =>
        item.quantityDispensed ===
        0
    )

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
                {
                  prescription.prescriptionNumber
                }
              </SheetTitle>

              <SheetDescription className="mt-1">
                {getPatientFullName(
                  patient
                )}
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

                {prescription.releasedAt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    <LockKeyhole
                      className="size-3"
                      aria-hidden="true"
                    />
                    Released
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section>
            <h3 className="text-sm font-semibold">
              Prescription information
            </h3>

            <dl className="mt-4 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Patient"
                value={getPatientFullName(
                  patient
                )}
              />

              <DetailItem
                label="Medical record number"
                value={
                  <span className="font-mono text-xs">
                    {
                      patient.medicalRecordNumber
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
                label="Source"
                value={
                  PHARMACY_PRESCRIPTION_SOURCE_LABELS[
                    prescription.source
                  ]
                }
              />

              <DetailItem
                label="Branch"
                value={
                  prescription.branchName
                }
              />

              <DetailItem
                label="Created"
                value={formatPatientDateTime(
                  prescription.createdAt
                )}
              />

              <DetailItem
                label="Consultation reference"
                value={
                  prescription.consultationNumber ??
                  "Not linked"
                }
              />

              <DetailItem
                label="Clinical notes"
                value={
                  prescription.clinicalNotes ??
                  "Not recorded"
                }
              />
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold">
              Patient allergy summary
            </h3>

            {patientAllergySummary.length ===
            0 ? (
              <div className="mt-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No active allergy summary
                was supplied.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {patientAllergySummary.map(
                  (allergy) => (
                    <div
                      key={allergy}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                    >
                      {allergy}
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold">
              Medication items
            </h3>

            <div className="mt-3 overflow-hidden rounded-xl border">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Medication
                    </TableHead>

                    <TableHead>
                      Prescription
                    </TableHead>

                    <TableHead>
                      Quantity
                    </TableHead>

                    <TableHead>
                      Inventory
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {prescription.items.map(
                    (item) => {
                      const batches =
                        findAvailableInventoryForMedication(
                          inventoryItems,
                          item.medicationId,
                          prescription.branchId
                        )

                      const availableQuantity =
                        batches.reduce(
                          (
                            total,
                            batch
                          ) =>
                            total +
                            getPharmacyInventoryAvailableQuantity(
                              batch
                            ),
                          0
                        )

                      const inventoryStatus =
                        batches.length ===
                        0
                          ? "out-of-stock"
                          : batches.some(
                                (batch) =>
                                  derivePharmacyInventoryStatus(
                                    batch
                                  ) ===
                                  "low-stock"
                              )
                            ? "low-stock"
                            : "available"

                      return (
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

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                PHARMACY_DOSAGE_FORM_LABELS[
                                  item.dosageForm
                                ]
                              }
                              {" · "}
                              {
                                PHARMACY_MEDICATION_ROUTE_LABELS[
                                  item.route
                                ]
                              }
                            </p>
                          </TableCell>

                          <TableCell>
                            <p>
                              {item.dose}
                              {" · "}
                              {
                                item.frequency
                              }
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                item.instructions
                              }
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
                              {" · "}
                              Remaining:{" "}
                              {getPrescriptionItemRemainingQuantity(
                                item
                              )}
                            </p>
                          </TableCell>

                          <TableCell>
                            <PharmacyInventoryStatusBadge
                              status={
                                inventoryStatus
                              }
                            />

                            <p className="mt-2 text-xs text-muted-foreground">
                              Available:{" "}
                              {
                                availableQuantity
                              }
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
                    }
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">
              Pharmacy safety review
            </h3>

            <dl className="mt-3 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
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
                label="Allergy-review notes"
                value={
                  prescription
                    .allergyReviewNotes ??
                  "No note recorded"
                }
              />

              <DetailItem
                label="Interaction-review notes"
                value={
                  prescription
                    .interactionReviewNotes ??
                  "No note recorded"
                }
              />

              <DetailItem
                label="Allergy review by"
                value={
                  prescription
                    .allergyReviewBy ??
                  "Not reviewed"
                }
              />

              <DetailItem
                label="Interaction review by"
                value={
                  prescription
                    .interactionReviewBy ??
                  "Not reviewed"
                }
              />
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold">
              Dispensing lifecycle
            </h3>

            <dl className="mt-3 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Pharmacist verified"
                value={
                  prescription
                    .pharmacistVerifiedAt
                    ? (
                      <span className="inline-flex items-center gap-2">
                        <BadgeCheck
                          className="size-3.5 text-emerald-700"
                          aria-hidden="true"
                        />

                        {formatPatientDateTime(
                          prescription
                            .pharmacistVerifiedAt
                        )}
                      </span>
                    )
                    : "Not verified"
                }
              />

              <DetailItem
                label="Verified by"
                value={
                  prescription
                    .pharmacistVerifiedBy ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Counseling completed"
                value={
                  prescription
                    .counselingCompletedAt
                    ? (
                      <span className="inline-flex items-center gap-2">
                        <MessageSquare
                          className="size-3.5 text-cyan-700"
                          aria-hidden="true"
                        />

                        {formatPatientDateTime(
                          prescription
                            .counselingCompletedAt
                        )}
                      </span>
                    )
                    : "Not completed"
                }
              />

              <DetailItem
                label="Counseling by"
                value={
                  prescription
                    .counselingCompletedBy ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Released"
                value={
                  prescription.releasedAt
                    ? (
                      <span className="inline-flex items-center gap-2">
                        <Send
                          className="size-3.5 text-teal-700"
                          aria-hidden="true"
                        />

                        {formatPatientDateTime(
                          prescription.releasedAt
                        )}
                      </span>
                    )
                    : "Not released"
                }
              />

              <DetailItem
                label="Released by"
                value={
                  prescription.releasedBy ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Verification notes"
                value={
                  prescription
                    .pharmacistVerificationNotes ??
                  "No note recorded"
                }
              />

              <DetailItem
                label="Counseling notes"
                value={
                  prescription.counselingNotes ??
                  "No note recorded"
                }
              />
            </dl>
          </section>

          <PharmacyAuditHistory
            prescription={prescription}
          />

          {prescription.cancellationReason ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-semibold text-rose-800">
                Cancellation reason
              </h3>

              <p className="mt-2 text-sm text-rose-700">
                {
                  prescription.cancellationReason
                }
              </p>
            </section>
          ) : null}

          {prescription.releasedAt ? (
            <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-teal-800">
              <LockKeyhole
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                This released synthetic
                prescription is read-only.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                Medication, inventory,
                safety-review, and dispensing
                records remain synthetic
                development data.
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="gap-3 border-t bg-slate-50 p-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {canReview ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onReviewSafety(
                    prescription
                  )
                }
              >
                <ShieldCheck
                  aria-hidden="true"
                />
                Safety review
              </Button>
            ) : null}

            {canDispense ? (
              <Button
                type="button"
                className="bg-violet-700 text-white hover:bg-violet-800"
                onClick={() =>
                  onDispense(
                    prescription
                  )
                }
              >
                <PackageCheck
                  aria-hidden="true"
                />
                Dispense
              </Button>
            ) : null}

            {canVerify ? (
              <Button
                type="button"
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={() =>
                  onVerify(
                    prescription
                  )
                }
              >
                <BadgeCheck
                  aria-hidden="true"
                />
                Verify dispensing
              </Button>
            ) : null}

            {canCounsel ? (
              <Button
                type="button"
                className="bg-cyan-700 text-white hover:bg-cyan-800"
                onClick={() =>
                  onCounsel(
                    prescription
                  )
                }
              >
                <MessageSquare
                  aria-hidden="true"
                />
                Counseling
              </Button>
            ) : null}

            {canRelease ? (
              <Button
                type="button"
                className="bg-teal-700 text-white hover:bg-teal-800"
                onClick={() =>
                  onRelease(
                    prescription
                  )
                }
              >
                <Send aria-hidden="true" />
                Release medication
              </Button>
            ) : null}

            {canCancel ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  onCancel(
                    prescription
                  )
                }
              >
                Cancel prescription
              </Button>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 border-t pt-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
            >
              Close
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onOpenPatientProfile(
                    patient
                  )
                }
              >
                <UserRound
                  aria-hidden="true"
                />
                Patient profile
              </Button>

              {prescription.consultationId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onOpenConsultation(
                      prescription
                        .consultationId!
                    )
                  }
                >
                  <ExternalLink
                    aria-hidden="true"
                  />
                  Consultation
                </Button>
              ) : null}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
