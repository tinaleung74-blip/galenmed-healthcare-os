"use client"

import {
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { AllergyCriticalityBadge } from "@/features/patients/components/patient-allergy-status-badges"
import {
  ALLERGY_CATEGORY_LABELS,
} from "@/features/patients/constants/patient-allergy.constants"
import { usePatientAllergies } from "@/features/patients/providers/patient-allergy-provider"
import { cn } from "@/lib/utils"

interface ConsultationPrescriptionAllergyPanelProps {
  patientId: string
  compact?: boolean
}

export function ConsultationPrescriptionAllergyPanel({
  patientId,
  compact = false,
}: ConsultationPrescriptionAllergyPanelProps) {
  const { allergyRecords } =
    usePatientAllergies()

  const activeAllergies = allergyRecords
    .filter(
      (record) =>
        record.patientId === patientId &&
        record.recordStatus === "current" &&
        record.clinicalStatus === "active"
    )
    .sort(
      (firstRecord, secondRecord) =>
        Number(
          secondRecord.criticality === "high"
        ) -
        Number(
          firstRecord.criticality === "high"
        )
    )

  const hasHighCriticality =
    activeAllergies.some(
      (record) =>
        record.criticality === "high"
    )

  if (activeAllergies.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />

        <div>
          <p className="font-medium">
            No active allergy record found
          </p>

          {!compact ? (
            <p className="mt-1 text-xs">
              This does not confirm that the patient has
              no allergies. Complete the clinical allergy
              review before prescribing.
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        hasHighCriticality
          ? "border-rose-200 bg-rose-50"
          : "border-amber-200 bg-amber-50"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2",
          hasHighCriticality
            ? "text-rose-800"
            : "text-amber-800"
        )}
      >
        <ShieldAlert
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {activeAllergies.length} active allergy
            {activeAllergies.length === 1
              ? ""
              : " records"}{" "}
            require review
          </p>

          {!compact ? (
            <p className="mt-1 text-xs">
              The system does not automatically determine
              whether a medication conflicts with these
              records.
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-2",
          compact
            ? "mt-3 sm:grid-cols-2 xl:grid-cols-3"
            : "mt-4"
        )}
      >
        {activeAllergies
          .slice(0, compact ? 3 : 8)
          .map((record) => (
            <div
              key={record.id}
              className="rounded-lg border bg-background p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {record.allergenName}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {
                      ALLERGY_CATEGORY_LABELS[
                        record.category
                      ]
                    }
                  </p>
                </div>

                <AllergyCriticalityBadge
                  criticality={record.criticality}
                />
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {record.reactionManifestations.length >
                0
                  ? record.reactionManifestations.join(
                      ", "
                    )
                  : "Reaction not recorded"}
              </p>
            </div>
          ))}
      </div>
    </section>
  )
}
