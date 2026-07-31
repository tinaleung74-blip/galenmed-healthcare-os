"use client"

import {
  Activity,
  ClipboardList,
  ShieldAlert,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AllergyCriticalityBadge } from "@/features/patients/components/patient-allergy-status-badges"
import { MedicalConditionStatusBadge } from "@/features/patients/components/medical-history-status-badges"
import { usePatientAllergies } from "@/features/patients/providers/patient-allergy-provider"
import { usePatientMedicalHistory } from "@/features/patients/providers/patient-medical-history-provider"
import { usePatientVitalSigns } from "@/features/patients/providers/patient-vital-signs-provider"
import type { Patient } from "@/features/patients/types/patient.types"
import { formatPatientDateTime } from "@/features/patients/utils/patient.utils"
import {
  formatBloodPressure,
  formatVitalMeasurement,
} from "@/features/patients/utils/vital-signs.utils"

interface ConsultationClinicalContextProps {
  patient: Patient
}

export function ConsultationClinicalContext({
  patient,
}: ConsultationClinicalContextProps) {
  const { medicalHistoryRecords } =
    usePatientMedicalHistory()

  const { allergyRecords } =
    usePatientAllergies()

  const { vitalSignsRecords } =
    usePatientVitalSigns()

  const activeConditions =
    medicalHistoryRecords
      .filter(
        (record) =>
          record.patientId === patient.id &&
          record.recordStatus === "current" &&
          record.clinicalStatus === "active"
      )
      .slice(0, 4)

  const activeAllergies =
    allergyRecords
      .filter(
        (record) =>
          record.patientId === patient.id &&
          record.recordStatus === "current" &&
          record.clinicalStatus === "active"
      )
      .sort(
        (firstRecord, secondRecord) =>
          Number(
            secondRecord.criticality ===
              "high"
          ) -
          Number(
            firstRecord.criticality ===
              "high"
          )
      )
      .slice(0, 4)

  const latestVitalSigns =
    vitalSignsRecords
      .filter(
        (record) =>
          record.patientId === patient.id &&
          record.recordStatus === "current"
      )
      .sort(
        (firstRecord, secondRecord) =>
          new Date(
            secondRecord.measuredAt
          ).getTime() -
          new Date(
            firstRecord.measuredAt
          ).getTime()
      )[0] ?? null

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList
              className="size-4 text-violet-700"
              aria-hidden="true"
            />
            Active conditions
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {activeConditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active structured conditions recorded.
            </p>
          ) : (
            activeConditions.map((record) => (
              <div
                key={record.id}
                className="rounded-lg border p-3"
              >
                <p className="text-sm font-medium">
                  {record.conditionName}
                </p>

                <div className="mt-2">
                  <MedicalConditionStatusBadge
                    status={
                      record.clinicalStatus
                    }
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card
        className={
          activeAllergies.some(
            (record) =>
              record.criticality === "high"
          )
            ? "border-rose-200 bg-rose-50/30 shadow-none"
            : "shadow-none"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert
              className="size-4 text-rose-700"
              aria-hidden="true"
            />
            Active allergies
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {activeAllergies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active allergy or intolerance records.
            </p>
          ) : (
            activeAllergies.map((record) => (
              <div
                key={record.id}
                className="rounded-lg border bg-background p-3"
              >
                <p className="text-sm font-medium">
                  {record.allergenName}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {record.reactionManifestations
                    .length > 0
                    ? record.reactionManifestations.join(
                        ", "
                      )
                    : "Reaction not recorded"}
                </p>

                <div className="mt-2">
                  <AllergyCriticalityBadge
                    criticality={
                      record.criticality
                    }
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity
              className="size-4 text-sky-700"
              aria-hidden="true"
            />
            Latest vital signs
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!latestVitalSigns ? (
            <p className="text-sm text-muted-foreground">
              No current vital-sign measurement set.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {formatPatientDateTime(
                  latestVitalSigns.measuredAt
                )}
              </p>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Blood pressure
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatBloodPressure(
                      latestVitalSigns
                        .systolicBloodPressureMmHg,
                      latestVitalSigns
                        .diastolicBloodPressureMmHg
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Heart rate
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatVitalMeasurement(
                      latestVitalSigns
                        .heartRateBpm,
                      "bpm"
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Temperature
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatVitalMeasurement(
                      latestVitalSigns
                        .temperatureCelsius,
                      "°C"
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Oxygen saturation
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatVitalMeasurement(
                      latestVitalSigns
                        .oxygenSaturationPercent,
                      "%"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
