import {
  SETTINGS_AUDIT_ACTION_LABELS,
} from "@/features/settings/constants/settings.constants"
import type {
  SettingsAuditAction,
} from "@/features/settings/types/settings.types"
import { cn } from "@/lib/utils"

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

const auditActionStyles: Record<
  SettingsAuditAction,
  string
> = {
  created:
    "border-sky-200 bg-sky-50 text-sky-700",

  updated:
    "border-amber-200 bg-amber-50 text-amber-700",

  activated:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  deactivated:
    "border-slate-200 bg-slate-100 text-slate-600",

  "permission-changed":
    "border-violet-200 bg-violet-50 text-violet-700",

  "security-changed":
    "border-rose-200 bg-rose-50 text-rose-700",

  reset:
    "border-indigo-200 bg-indigo-50 text-indigo-700",
}

export function SettingsActiveStatusBadge({
  active,
}: {
  active: boolean
}) {
  return (
    <span
      className={cn(
        baseClassName,
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      )}
    >
      {active
        ? "Active"
        : "Inactive"}
    </span>
  )
}

export function SettingsSystemRoleBadge({
  systemRole,
}: {
  systemRole: boolean
}) {
  if (!systemRole) {
    return (
      <span
        className={cn(
          baseClassName,
          "border-sky-200 bg-sky-50 text-sky-700"
        )}
      >
        Custom Role
      </span>
    )
  }

  return (
    <span
      className={cn(
        baseClassName,
        "border-violet-200 bg-violet-50 text-violet-700"
      )}
    >
      System Role
    </span>
  )
}

export function SettingsAuditActionBadge({
  action,
}: {
  action: SettingsAuditAction
}) {
  return (
    <span
      className={cn(
        baseClassName,
        auditActionStyles[action]
      )}
    >
      {
        SETTINGS_AUDIT_ACTION_LABELS[
          action
        ]
      }
    </span>
  )
}
