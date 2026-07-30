export const ALLERGY_INTOLERANCE_TYPES = [
  "allergy",
  "intolerance",
] as const

export type AllergyIntoleranceType =
  (typeof ALLERGY_INTOLERANCE_TYPES)[number]

export const ALLERGY_CATEGORIES = [
  "medication",
  "food",
  "environment",
  "biologic",
] as const

export type AllergyCategory =
  (typeof ALLERGY_CATEGORIES)[number]

export const ALLERGY_CLINICAL_STATUSES = [
  "active",
  "inactive",
  "resolved",
] as const

export type AllergyClinicalStatus =
  (typeof ALLERGY_CLINICAL_STATUSES)[number]

export const ALLERGY_VERIFICATION_STATUSES = [
  "unconfirmed",
  "presumed",
  "confirmed",
  "refuted",
] as const

export type AllergyVerificationStatus =
  (typeof ALLERGY_VERIFICATION_STATUSES)[number]

export const ALLERGY_CRITICALITIES = [
  "low",
  "high",
  "unable-to-assess",
] as const

export type AllergyCriticality =
  (typeof ALLERGY_CRITICALITIES)[number]

export const ALLERGY_REACTION_SEVERITIES = [
  "mild",
  "moderate",
  "severe",
] as const

export type AllergyReactionSeverity =
  (typeof ALLERGY_REACTION_SEVERITIES)[number]

export const ALLERGY_INFORMATION_SOURCES = [
  "patient",
  "clinician",
  "external-record",
  "family-member",
] as const

export type AllergyInformationSource =
  (typeof ALLERGY_INFORMATION_SOURCES)[number]

export const ALLERGY_RECORD_STATUSES = [
  "current",
  "archived",
] as const

export type AllergyRecordStatus =
  (typeof ALLERGY_RECORD_STATUSES)[number]

export interface PatientAllergyRecord {
  id: string
  patientId: string

  allergenName: string
  allergenCode: string | null
  codeSystem: string | null

  type: AllergyIntoleranceType
  category: AllergyCategory
  clinicalStatus: AllergyClinicalStatus
  verificationStatus: AllergyVerificationStatus
  criticality: AllergyCriticality

  onsetDate: string | null
  lastOccurrenceDate: string | null

  reactionManifestations: string[]
  reactionSeverity: AllergyReactionSeverity | null
  exposureRoute: string | null

  source: AllergyInformationSource
  sourceDetails: string | null
  notes: string | null

  recordStatus: AllergyRecordStatus

  recordedBy: string
  recordedAt: string
  updatedBy: string
  updatedAt: string

  archivedAt: string | null
  archivedBy: string | null
  archiveReason: string | null
}

export interface PatientAllergyFilters {
  search: string
  category: AllergyCategory | "all"
  clinicalStatus: AllergyClinicalStatus | "all"
  verificationStatus: AllergyVerificationStatus | "all"
  recordStatus: AllergyRecordStatus | "all"
}
