"use client"

import type {
  LucideIcon,
} from "lucide-react"
import {
  BellRing,
  Blocks,
  Building2,
  History,
  CalendarDays,
  CreditCard,
  FlaskConical,
  LockKeyhole,
  MapPin,
  Pill,
  ScanLine,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"

import {
  SETTINGS_SECTION_LABELS,
} from "@/features/settings/constants/settings.constants"
import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "@/features/settings/types/settings.types"
import { cn } from "@/lib/utils"

interface SettingsSectionNavigationProps {
  selectedSection:
    SettingsSection

  onSelectSection: (
    section: SettingsSection
  ) => void

  counts?: Partial<
    Record<
      SettingsSection,
      number
    >
  >
}

const sectionIcons: Record<
  SettingsSection,
  LucideIcon
> = {
  organization: Building2,
  branches: MapPin,
  departments: Blocks,
  "roles-permissions":
    ShieldCheck,
  appointments: CalendarDays,
  clinical: Stethoscope,
  laboratory: FlaskConical,
  radiology: ScanLine,
  pharmacy: Pill,
  billing: CreditCard,
  notifications: BellRing,
  security: LockKeyhole,
  "audit-history": History,
}

export function SettingsSectionNavigation({
  selectedSection,
  onSelectSection,
  counts = {},
}: SettingsSectionNavigationProps) {
  return (
    <nav
      aria-label="Settings sections"
      className="space-y-1 rounded-xl border bg-background p-2"
    >
      {SETTINGS_SECTIONS.map(
        (section) => {
          const Icon =
            sectionIcons[section]

          const selected =
            selectedSection ===
            section

          const count =
            counts[section]

          return (
            <button
              key={section}
              type="button"
              aria-pressed={selected}
              className={cn(
                "flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                selected
                  ? "bg-sky-50 font-medium text-sky-900"
                  : "text-slate-700 hover:bg-slate-50"
              )}
              onClick={() =>
                onSelectSection(
                  section
                )
              }
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  selected
                    ? "text-sky-700"
                    : "text-slate-500"
                )}
                aria-hidden="true"
              />

              <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                {
                  SETTINGS_SECTION_LABELS[
                    section
                  ]
                }
              </span>

              {typeof count ===
              "number" ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-xs",
                    selected
                      ? "border-sky-200 bg-white text-sky-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        }
      )}
    </nav>
  )
}
