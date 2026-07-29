export const PATIENT_PROFILE_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    description:
      "Demographic, contact, registration, and record summary.",
  },
  {
    id: "medical-history",
    label: "Medical History",
    description:
      "Past conditions, procedures, family history, and social history.",
  },
  {
    id: "vital-signs",
    label: "Vital Signs",
    description:
      "Recorded blood pressure, temperature, pulse, respiration, and measurements.",
  },
  {
    id: "allergies",
    label: "Allergies",
    description:
      "Medication, food, environmental, and other documented allergies.",
  },
  {
    id: "insurance",
    label: "Insurance",
    description:
      "Coverage, policy, guarantor, authorization, and benefit information.",
  },
  {
    id: "documents",
    label: "Documents",
    description:
      "Consent forms, identification, referrals, and uploaded patient files.",
  },
  {
    id: "timeline",
    label: "Timeline",
    description:
      "Chronological patient activity, encounters, updates, and audited events.",
  },
] as const

export type PatientProfileSection =
  (typeof PATIENT_PROFILE_SECTIONS)[number]["id"]

export function isPatientProfileSection(
  value: string | undefined
): value is PatientProfileSection {
  return PATIENT_PROFILE_SECTIONS.some(
    (section) => section.id === value
  )
}
