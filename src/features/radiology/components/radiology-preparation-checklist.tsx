"use client"

import {
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
} from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import type {
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface RadiologyPreparationChecklistProps {
  order: RadiologyOrder

  onToggleItem: (
    order: RadiologyOrder,
    checklistItemId: string,
    completed: boolean
  ) => void
}

export function RadiologyPreparationChecklist({
  order,
  onToggleItem,
}: RadiologyPreparationChecklistProps) {
  const requiredItems =
    order.preparationChecklist.filter(
      (item) => item.required
    )

  const completedRequired =
    requiredItems.filter(
      (item) => item.completed
    ).length

  const allRequiredComplete =
    requiredItems.length > 0 &&
    completedRequired ===
      requiredItems.length

  const canEdit =
    order.status === "scheduled" ||
    order.status === "checked-in" ||
    order.status === "ready"

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-cyan-50 p-2 text-cyan-700">
            <ClipboardCheck
              className="size-4"
              aria-hidden="true"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              Patient Preparation Checklist
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Complete every required
              preparation item before the
              patient can be marked ready.
            </p>
          </div>
        </div>

        <span
          className={
            allRequiredComplete
              ? "inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"
              : "text-xs font-medium text-amber-700"
          }
        >
          {allRequiredComplete ? (
            <CheckCircle2
              className="size-3.5"
              aria-hidden="true"
            />
          ) : null}

          {completedRequired}
          {" / "}
          {requiredItems.length}
          {" required completed"}
        </span>
      </div>

      <div className="space-y-3">
        {order.preparationChecklist.map(
          (item) => (
            <Card
              key={item.id}
              className={
                item.completed
                  ? "border-emerald-200 bg-emerald-50/40 shadow-none"
                  : "shadow-none"
              }
            >
              <CardContent className="flex items-start gap-3 p-4">
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={!canEdit}
                  className="mt-0.5 size-4 accent-teal-700"
                  onChange={(event) =>
                    onToggleItem(
                      order,
                      item.id,
                      event.target.checked
                    )
                  }
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {item.label}
                    </p>

                    {item.required ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        Required
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                        Optional
                      </span>
                    )}
                  </div>

                  {item.completed ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Completed{" "}
                      {formatPatientDateTime(
                        item.completedAt
                      )}
                      {" by "}
                      {item.completedBy ??
                        "Not recorded"}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pending preparation
                    </p>
                  )}

                  {item.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {!canEdit ? (
        <div className="flex items-start gap-2 rounded-xl border bg-slate-50 p-4 text-xs text-muted-foreground">
          <LockKeyhole
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            Preparation editing is locked
            after imaging begins or the
            order reaches a terminal status.
          </p>
        </div>
      ) : null}
    </section>
  )
}
