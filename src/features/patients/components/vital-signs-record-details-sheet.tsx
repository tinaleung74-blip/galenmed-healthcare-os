"use client"

import type { ReactNode } from "react"
import {
  Activity,
  Archive,
  CalendarDays,
  HeartPulse,
  Pencil,
  ShieldCheck,
  Thermometer,
  Weight,
  Wind,
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
  VitalSignInterpretationBadge,
  VitalSignsRecordStatusBadge,
} from "@/features/patients/components/vital-signs-status-badges"
import {
  BLOOD_PRESSURE_POSITION_LABELS,
  OXYGEN_SUPPORT_LABELS,
  TEMPERATURE_SITE_LABELS,
  VITAL_SIGNS_CONTEXT_LABELS,
} from "@/features/patients/constants/vital-signs.constants"
import type {
  VitalSignInterpretation,
  VitalSignsRecord,
} from "@/features/patients/types/vital-signs.types"
import { formatPatientDateTime } from "@/features/patients/utils/patient.utils"
import {
  formatBloodPressure,
  formatVitalMeasurement,
} from "@/features/patients/utils/vital-signs.utils"

interface VitalSignsRecordDetailsSheetProps {
  record: VitalSignsRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditRecord: (record: VitalSignsRecord) => void
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

      <dd className="mt-1 text-sm text-foreground">
        {value}
      </dd>
    </div>
  )
}

interface MeasurementItemProps {
  label: string
  value: string
  interpretation?: VitalSignInterpretation
}

function MeasurementItem({
  label,
  value,
  interpretation,
}: MeasurementItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium text-foreground">
        {value}
      </dd>

      {interpretation ? (
        <div className="mt-2">
          <VitalSignInterpretationBadge
            interpretation={interpretation}
          />
        </div>
      ) : null}
    </div>
  )
}

export function VitalSignsRecordDetailsSheet({
  record,
  open,
  onOpenChange,
  onEditRecord,
}: VitalSignsRecordDetailsSheetProps) {
  if (!record) {
    return null
  }

  const isArchived =
    record.recordStatus === "archived"

  const oxygenSupportDescription =
    record.oxygenSupport ===
      "supplemental-oxygen" &&
    record.supplementalOxygenLitersPerMinute !== null
      ? `${OXYGEN_SUPPORT_LABELS[record.oxygenSupport]} · ${record.supplementalOxygenLitersPerMinute} L/min`
      : OXYGEN_SUPPORT_LABELS[
          record.oxygenSupport
        ]

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <Activity
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                Vital-sign measurement set
              </SheetTitle>

              <SheetDescription className="mt-1">
                {formatPatientDateTime(
                  record.measuredAt
                )}
                {" · "}
                {
                  VITAL_SIGNS_CONTEXT_LABELS[
                    record.context
                  ]
                }
              </SheetDescription>

              <div className="mt-3">
                <VitalSignsRecordStatusBadge
                  status={record.recordStatus}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <HeartPulse
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Circulation
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <MeasurementItem
                label="Blood pressure"
                value={formatBloodPressure(
                  record.systolicBloodPressureMmHg,
                  record.diastolicBloodPressureMmHg
                )}
                interpretation={
                  record.interpretations
                    .bloodPressure
                }
              />

              <DetailItem
                label="Measurement position"
                value={
                  BLOOD_PRESSURE_POSITION_LABELS[
                    record.bloodPressurePosition
                  ]
                }
              />

              <MeasurementItem
                label="Heart rate"
                value={formatVitalMeasurement(
                  record.heartRateBpm,
                  "bpm"
                )}
                interpretation={
                  record.interpretations.heartRate
                }
              />

              <MeasurementItem
                label="Pain score"
                value={
                  record.painScore === null
                    ? "Not recorded"
                    : `${record.painScore}/10`
                }
                interpretation={
                  record.interpretations.painScore
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Wind
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Respiration and oxygenation
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <MeasurementItem
                label="Respiratory rate"
                value={formatVitalMeasurement(
                  record.respiratoryRatePerMinute,
                  "breaths/min"
                )}
                interpretation={
                  record.interpretations
                    .respiratoryRate
                }
              />

              <MeasurementItem
                label="Oxygen saturation"
                value={formatVitalMeasurement(
                  record.oxygenSaturationPercent,
                  "%"
                )}
                interpretation={
                  record.interpretations
                    .oxygenSaturation
                }
              />

              <DetailItem
                label="Oxygen support"
                className="sm:col-span-2"
                value={oxygenSupportDescription}
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Thermometer
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Temperature
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <MeasurementItem
                label="Temperature"
                value={formatVitalMeasurement(
                  record.temperatureCelsius,
                  "°C"
                )}
                interpretation={
                  record.interpretations.temperature
                }
              />

              <DetailItem
                label="Temperature site"
                value={
                  TEMPERATURE_SITE_LABELS[
                    record.temperatureSite
                  ]
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Weight
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Anthropometrics
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
              <MeasurementItem
                label="Height"
                value={formatVitalMeasurement(
                  record.heightCm,
                  "cm"
                )}
                interpretation={
                  record.interpretations.height
                }
              />

              <MeasurementItem
                label="Weight"
                value={formatVitalMeasurement(
                  record.weightKg,
                  "kg"
                )}
                interpretation={
                  record.interpretations.weight
                }
              />

              <MeasurementItem
                label="Calculated BMI"
                value={formatVitalMeasurement(
                  record.bmi,
                  "kg/m²"
                )}
                interpretation={
                  record.interpretations.bmi
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Measurement notes
            </h3>

            <div className="rounded-xl border p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {record.notes ??
                  "No additional measurement notes were recorded."}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Record audit information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Measured at"
                value={formatPatientDateTime(
                  record.measuredAt
                )}
              />

              <DetailItem
                label="Measurement context"
                value={
                  VITAL_SIGNS_CONTEXT_LABELS[
                    record.context
                  ]
                }
              />

              <DetailItem
                label="Recorded by"
                value={record.recordedBy}
              />

              <DetailItem
                label="Recorded at"
                value={formatPatientDateTime(
                  record.recordedAt
                )}
              />

              <DetailItem
                label="Last updated by"
                value={record.updatedBy}
              />

              <DetailItem
                label="Last updated at"
                value={formatPatientDateTime(
                  record.updatedAt
                )}
              />
            </dl>
          </section>

          {isArchived ? (
            <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Archive
                  className="size-4"
                  aria-hidden="true"
                />

                <h3 className="text-sm font-semibold">
                  Archived record
                </h3>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Archived by"
                  value={
                    record.archivedBy ??
                    "Not recorded"
                  }
                />

                <DetailItem
                  label="Archived at"
                  value={formatPatientDateTime(
                    record.archivedAt
                  )}
                />

                <DetailItem
                  label="Archive reason"
                  className="sm:col-span-2"
                  value={
                    record.archiveReason ??
                    "Not recorded"
                  }
                />
              </dl>
            </section>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              These measurements have not been
              automatically classified as normal,
              abnormal, or critical. Clinical
              interpretation remains a separate
              authorized workflow.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t bg-slate-50 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            disabled={isArchived}
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() => onEditRecord(record)}
          >
            <Pencil aria-hidden="true" />
            {isArchived
              ? "Archived record"
              : "Edit measurement"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
