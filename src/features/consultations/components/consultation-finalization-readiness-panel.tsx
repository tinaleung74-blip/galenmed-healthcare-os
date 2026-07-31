import {
  CheckCircle2,
  ClipboardCheck,
  XCircle,
} from "lucide-react"

import type { ConsultationFinalizationReadiness } from "@/features/consultations/utils/consultation-finalization.utils"

interface ConsultationFinalizationReadinessPanelProps {
  readiness:
    ConsultationFinalizationReadiness
}

export function ConsultationFinalizationReadinessPanel({
  readiness,
}: ConsultationFinalizationReadinessPanelProps) {
  return (
    <section className="rounded-xl border bg-background p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
          <ClipboardCheck
            className="size-4"
            aria-hidden="true"
          />
        </div>

        <div>
          <h3 className="font-semibold">
            Finalization readiness
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            All requirements must be completed
            before clinical attestation.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {readiness.requirements.map(
          (requirement) => (
            <div
              key={requirement.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              {requirement.met ? (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="mt-0.5 size-4 shrink-0 text-rose-700"
                  aria-hidden="true"
                />
              )}

              <div>
                <p className="text-sm font-medium">
                  {requirement.label}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {requirement.description}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      <div
        className={
          readiness.ready
            ? "mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            : "mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        }
      >
        {readiness.ready
          ? "All clinical documentation requirements are complete."
          : "Resolve the incomplete items before finalizing this encounter."}
      </div>
    </section>
  )
}
