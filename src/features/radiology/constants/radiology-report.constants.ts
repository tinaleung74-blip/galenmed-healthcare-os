import type {
  RadiologyCriticalCommunicationMethod,
  RadiologyFindingLevel,
  RadiologyReportStatus,
} from "@/features/radiology/types/radiology-report.types"

export const RADIOLOGY_REPORT_STATUS_LABELS: Record<
  RadiologyReportStatus,
  string
> = {
  draft: "Report draft",
  verified: "Radiologist verified",
  released: "Final report released",
}

export const RADIOLOGY_FINDING_LEVEL_LABELS: Record<
  RadiologyFindingLevel,
  string
> = {
  routine: "Routine finding",
  significant: "Significant finding",
  critical: "Critical finding",
}

export const RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS: Record<
  RadiologyCriticalCommunicationMethod,
  string
> = {
  phone: "Telephone",
  "in-person": "In person",
  "secure-message": "Secure clinical message",
  "emergency-escalation":
    "Emergency escalation",
}

export const RADIOLOGY_REPORTING_ACTOR =
  "GalenMed Radiology Reporting"

export const RADIOLOGY_REPORT_SYNTHETIC_NOTICE =
  "Findings, impressions, critical flags, clinicians, registration numbers, and timestamps are synthetic development data."
