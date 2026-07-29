import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ClipboardList,
  Files,
  HeartPulse,
  History,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react"

import {
  PATIENT_PROFILE_SECTIONS,
  type PatientProfileSection,
} from "@/features/patients/constants/patient-profile.constants"
import { cn } from "@/lib/utils"

interface PatientProfileNavigationProps {
  patientReference: string
  activeSection: PatientProfileSection
}

const sectionIcons: Record<
  PatientProfileSection,
  LucideIcon
> = {
  overview: LayoutDashboard,
  "medical-history": ClipboardList,
  "vital-signs": Activity,
  allergies: ShieldAlert,
  insurance: HeartPulse,
  documents: Files,
  timeline: History,
}

export function PatientProfileNavigation({
  patientReference,
  activeSection,
}: PatientProfileNavigationProps) {
  const encodedPatientReference =
    encodeURIComponent(patientReference)

  return (
    <nav
      aria-label="Patient profile sections"
      className="overflow-x-auto rounded-xl border bg-background p-1.5 shadow-sm"
    >
      <div className="flex min-w-max gap-1">
        {PATIENT_PROFILE_SECTIONS.map((section) => {
          const Icon = sectionIcons[section.id]
          const isActive = activeSection === section.id

          return (
            <Link
              key={section.id}
              href={`/patients/${encodedPatientReference}?section=${section.id}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isActive
                  ? "bg-teal-50 text-teal-800"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {section.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
