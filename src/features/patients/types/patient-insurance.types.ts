export const INSURANCE_COVERAGE_TYPES = [
  "hmo",
  "private-insurance",
  "government",
  "employer-sponsored",
  "other",
] as const

export type InsuranceCoverageType =
  (typeof INSURANCE_COVERAGE_TYPES)[number]

export const INSURANCE_COVERAGE_STATUSES = [
  "active",
  "pending",
  "inactive",
  "expired",
  "cancelled",
] as const

export type InsuranceCoverageStatus =
  (typeof INSURANCE_COVERAGE_STATUSES)[number]

export const INSURANCE_VERIFICATION_STATUSES = [
  "unverified",
  "verified",
  "needs-review",
  "rejected",
] as const

export type InsuranceVerificationStatus =
  (typeof INSURANCE_VERIFICATION_STATUSES)[number]

export const INSURANCE_PRIORITIES = [
  "primary",
  "secondary",
  "tertiary",
] as const

export type InsurancePriority =
  (typeof INSURANCE_PRIORITIES)[number]

export const INSURANCE_SUBSCRIBER_RELATIONSHIPS = [
  "self",
  "spouse",
  "child",
  "parent",
  "guardian",
  "other",
] as const

export type InsuranceSubscriberRelationship =
  (typeof INSURANCE_SUBSCRIBER_RELATIONSHIPS)[number]

export const INSURANCE_INFORMATION_SOURCES = [
  "patient",
  "insurance-card",
  "payer-portal",
  "employer",
  "external-record",
] as const

export type InsuranceInformationSource =
  (typeof INSURANCE_INFORMATION_SOURCES)[number]

export const INSURANCE_RECORD_STATUSES = [
  "current",
  "archived",
] as const

export type InsuranceRecordStatus =
  (typeof INSURANCE_RECORD_STATUSES)[number]

export interface PatientInsuranceRecord {
  id: string
  patientId: string

  payerName: string
  planName: string
  coverageType: InsuranceCoverageType
  coverageStatus: InsuranceCoverageStatus
  verificationStatus: InsuranceVerificationStatus
  priority: InsurancePriority

  memberNumber: string
  policyNumber: string | null
  groupNumber: string | null

  subscriberName: string
  subscriberRelationship: InsuranceSubscriberRelationship
  subscriberDateOfBirth: string | null

  effectiveFrom: string
  effectiveTo: string | null

  employerName: string | null
  payerContactNumber: string | null

  authorizationRequired: boolean
  coveredServices: string[]

  source: InsuranceInformationSource
  sourceDetails: string | null
  verificationReference: string | null
  notes: string | null

  verifiedBy: string | null
  verifiedAt: string | null

  recordStatus: InsuranceRecordStatus

  recordedBy: string
  recordedAt: string
  updatedBy: string
  updatedAt: string

  archivedAt: string | null
  archivedBy: string | null
  archiveReason: string | null
}

export interface PatientInsuranceFilters {
  search: string
  coverageType: InsuranceCoverageType | "all"
  coverageStatus: InsuranceCoverageStatus | "all"
  verificationStatus: InsuranceVerificationStatus | "all"
  recordStatus: InsuranceRecordStatus | "all"
}
