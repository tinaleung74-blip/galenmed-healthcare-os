export const PHILHEALTH_CONNECTION_MODES = [
  "manual",
  "certification",
  "live",
] as const

export type PhilHealthConnectionMode =
  (typeof PHILHEALTH_CONNECTION_MODES)[number]

export const PHILHEALTH_INTEGRATION_STATUSES = [
  "not-configured",
  "awaiting-credentials",
  "testing",
  "certification",
  "ready",
  "blocked",
] as const

export type PhilHealthIntegrationStatus =
  (typeof PHILHEALTH_INTEGRATION_STATUSES)[number]

export const PHILHEALTH_STAFF_ROLES = [
  "admission",
  "philhealth-officer",
  "billing",
  "claims-reviewer",
  "administrator",
] as const

export type PhilHealthStaffRole =
  (typeof PHILHEALTH_STAFF_ROLES)[number]

export const PHILHEALTH_PERMISSIONS = [
  "philhealth.view",
  "philhealth.profile-manage",
  "philhealth.eligibility-record",
  "philhealth.claim-create",
  "philhealth.claim-review",
  "philhealth.claim-approve",
  "philhealth.claim-submit",
  "philhealth.payment-reconcile",
  "philhealth.settings-manage",
  "philhealth.audit-view",
] as const

export type PhilHealthPermission =
  (typeof PHILHEALTH_PERMISSIONS)[number]

export const PHILHEALTH_MEMBER_RELATIONSHIPS = [
  "member",
  "spouse",
  "child",
  "parent",
  "other-dependent",
] as const

export type PhilHealthMemberRelationship =
  (typeof PHILHEALTH_MEMBER_RELATIONSHIPS)[number]

export const PHILHEALTH_ELIGIBILITY_STATUSES = [
  "not-checked",
  "pending",
  "eligible",
  "not-eligible",
  "mismatch",
  "error",
] as const

export type PhilHealthEligibilityStatus =
  (typeof PHILHEALTH_ELIGIBILITY_STATUSES)[number]

export const PHILHEALTH_ELIGIBILITY_SOURCES = [
  "not-checked",
  "official-portal-manual",
  "integration",
] as const

export type PhilHealthEligibilitySource =
  (typeof PHILHEALTH_ELIGIBILITY_SOURCES)[number]

export const PHILHEALTH_ENCOUNTER_TYPES = [
  "inpatient",
  "outpatient",
  "emergency",
  "consultation",
  "procedure",
  "other",
] as const

export type PhilHealthEncounterType =
  (typeof PHILHEALTH_ENCOUNTER_TYPES)[number]

export const PHILHEALTH_CLAIM_STATUSES = [
  "draft",
  "eligibility-pending",
  "requirements-incomplete",
  "ready-for-review",
  "under-review",
  "approved-for-submission",
  "submitted-manually",
  "submitted-electronically",
  "returned",
  "denied",
  "paid",
  "reconciled",
  "voided",
] as const

export type PhilHealthClaimStatus =
  (typeof PHILHEALTH_CLAIM_STATUSES)[number]

export const PHILHEALTH_SUBMISSION_CHANNELS = [
  "not-submitted",
  "official-portal-manual",
  "eclaims-integration",
] as const

export type PhilHealthSubmissionChannel =
  (typeof PHILHEALTH_SUBMISSION_CHANNELS)[number]

export const PHILHEALTH_REQUIREMENT_STATUSES = [
  "missing",
  "provided",
  "verified",
  "rejected",
  "not-required",
] as const

export type PhilHealthRequirementStatus =
  (typeof PHILHEALTH_REQUIREMENT_STATUSES)[number]

export const PHILHEALTH_AUDIT_ACTIONS = [
  "profile-created",
  "profile-updated",
  "eligibility-recorded",
  "claim-created",
  "claim-updated",
  "requirement-updated",
  "review-started",
  "claim-approved",
  "claim-submitted",
  "claim-returned",
  "claim-denied",
  "payment-recorded",
  "claim-reconciled",
  "claim-voided",
  "integration-status-changed",
] as const

export type PhilHealthAuditAction =
  (typeof PHILHEALTH_AUDIT_ACTIONS)[number]

export interface PhilHealthStaffRoleDefinition {
  role: PhilHealthStaffRole

  name: string
  description: string

  permissions: PhilHealthPermission[]
}

export interface PhilHealthPatientProfile {
  id: string
  patientId: string

  philHealthIdentificationNumber:
    string | null

  memberRelationship:
    PhilHealthMemberRelationship

  principalMemberName:
    string | null

  principalMemberPin:
    string | null

  membershipCategory:
    string | null

  consentAcknowledgedAt:
    string | null

  consentAcknowledgedBy:
    string | null

  eligibilityStatus:
    PhilHealthEligibilityStatus

  eligibilitySource:
    PhilHealthEligibilitySource

  eligibilityCheckedAt:
    string | null

  eligibilityCheckedBy:
    string | null

  pbefReference:
    string | null

  eligibilityNotes:
    string | null

  createdAt: string
  createdBy: string

  updatedAt: string
  updatedBy: string
}

export interface PhilHealthClaimRequirement {
  id: string
  claimId: string

  code: string
  label: string

  required: boolean

  status:
    PhilHealthRequirementStatus

  patientDocumentId:
    string | null

  remarks:
    string | null

  reviewedAt:
    string | null

  reviewedBy:
    string | null
}

export interface PhilHealthClaim {
  id: string

  internalClaimNumber: string

  patientId: string
  profileId: string

  branchId: string
  branchName: string

  encounterType:
    PhilHealthEncounterType

  encounterRecordId:
    string | null

  encounterReference:
    string | null

  admissionAt:
    string | null

  dischargeAt:
    string | null

  primaryDiagnosisCode:
    string | null

  primaryDiagnosisName:
    string | null

  benefitPackageCode:
    string | null

  benefitPackageName:
    string | null

  status:
    PhilHealthClaimStatus

  submissionChannel:
    PhilHealthSubmissionChannel

  requirements:
    PhilHealthClaimRequirement[]

  completenessPercent: number

  grossHospitalChargesCentavos:
    number

  estimatedPhilHealthBenefitCentavos:
    number

  patientResponsibilityCentavos:
    number

  officialClaimNumber:
    string | null

  transmittalControlNumber:
    string | null

  submittedAt:
    string | null

  submittedBy:
    string | null

  returnedAt:
    string | null

  returnedReason:
    string | null

  deniedAt:
    string | null

  deniedReason:
    string | null

  paidAt:
    string | null

  paidAmountCentavos:
    number

  reconciledAt:
    string | null

  reconciledBy:
    string | null

  notes:
    string | null

  createdAt: string
  createdBy: string

  updatedAt: string
  updatedBy: string

  voidedAt:
    string | null

  voidedBy:
    string | null

  voidReason:
    string | null
}

export interface PhilHealthAuditRecord {
  id: string

  patientId:
    string | null

  claimId:
    string | null

  action:
    PhilHealthAuditAction

  summary: string

  actor: string
  actorRole:
    PhilHealthStaffRole | null

  occurredAt: string

  beforeSnapshot:
    string | null

  afterSnapshot:
    string | null

  sensitiveFieldsRedacted:
    boolean
}

export interface PhilHealthModuleSettings {
  connectionMode:
    PhilHealthConnectionMode

  integrationStatus:
    PhilHealthIntegrationStatus

  liveIntegrationEnabled:
    boolean

  facilityAccreditationNumber:
    string | null

  certifiedServiceProvider:
    string | null

  testEnvironmentConfigured:
    boolean

  productionEnvironmentConfigured:
    boolean

  lastConnectivityCheckAt:
    string | null

  lastConnectivityCheckResult:
    string | null
}

export interface PhilHealthState {
  schemaVersion: 1
  revision: number

  profiles:
    PhilHealthPatientProfile[]

  claims:
    PhilHealthClaim[]

  auditRecords:
    PhilHealthAuditRecord[]

  settings:
    PhilHealthModuleSettings

  updatedAt: string
  updatedBy: string
}

export interface PhilHealthDashboardFilters {
  search: string

  branchId:
    string | "all"

  claimStatus:
    PhilHealthClaimStatus | "all"

  eligibilityStatus:
    PhilHealthEligibilityStatus | "all"
}
