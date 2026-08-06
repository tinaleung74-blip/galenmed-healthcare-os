export const SETTINGS_SECTIONS = [
  "organization",
  "branches",
  "departments",
  "roles-permissions",
  "appointments",
  "clinical",
  "laboratory",
  "radiology",
  "pharmacy",
  "billing",
  "notifications",
  "security",
  "audit-history",
] as const

export type SettingsSection =
  (typeof SETTINGS_SECTIONS)[number]

export const SETTINGS_PERMISSION_KEYS = [
  "dashboard.view",

  "patients.view",
  "patients.manage",

  "appointments.view",
  "appointments.manage",

  "consultations.view",
  "consultations.manage",

  "laboratory.view",
  "laboratory.manage",
  "laboratory.release",

  "radiology.view",
  "radiology.manage",
  "radiology.release",

  "pharmacy.view",
  "pharmacy.manage",
  "pharmacy.release",

  "billing.view",
  "billing.manage",
  "billing.refund",

  "reports.view",
  "reports.export",

  "settings.view",
  "settings.manage",

  "audit.view",
] as const

export type SettingsPermissionKey =
  (typeof SETTINGS_PERMISSION_KEYS)[number]

export const SETTINGS_NOTIFICATION_CHANNELS = [
  "in-app",
  "email",
  "sms",
] as const

export type SettingsNotificationChannel =
  (typeof SETTINGS_NOTIFICATION_CHANNELS)[number]

export const SETTINGS_NOTIFICATION_EVENTS = [
  "appointment-reminder",
  "appointment-cancelled",
  "critical-laboratory-result",
  "critical-radiology-finding",
  "pharmacy-prescription-ready",
  "billing-payment-posted",
  "billing-refund-posted",
  "security-alert",
] as const

export type SettingsNotificationEvent =
  (typeof SETTINGS_NOTIFICATION_EVENTS)[number]

export const SETTINGS_AUDIT_ACTIONS = [
  "created",
  "updated",
  "activated",
  "deactivated",
  "permission-changed",
  "security-changed",
  "reset",
] as const

export type SettingsAuditAction =
  (typeof SETTINGS_AUDIT_ACTIONS)[number]

export interface OrganizationSettings {
  legalName: string
  displayName: string

  registrationNumber: string | null
  taxIdentificationNumber: string | null

  phoneNumber: string | null
  emailAddress: string | null
  website: string | null

  address: string

  timezone: string
  currency: "PHP"
  locale: "en-PH"
}

export interface BranchSettings {
  branchId: string

  displayName: string
  code: string

  address: string

  phoneNumber: string | null
  emailAddress: string | null

  timezone: string

  active: boolean
}

export interface DepartmentSettings {
  id: string
  code: string

  name: string
  description: string | null

  branchIds: string[]

  active: boolean
}

export interface RoleSettings {
  id: string
  code: string

  name: string
  description: string | null

  permissions:
    SettingsPermissionKey[]

  systemRole: boolean
  active: boolean
}

export interface AppointmentConfiguration {
  defaultDurationMinutes: number

  allowSameDayBooking: boolean
  requireConfirmation: boolean

  checkInGraceMinutes: number
  noShowAfterMinutes: number
}

export interface ClinicalConfiguration {
  requireAllergyReview: boolean
  requireVitalSignsBeforeConsultation: boolean

  allowConsultationWithoutAppointment: boolean

  defaultFollowUpDays: number
}

export interface LaboratoryConfiguration {
  requireSpecimenCollection: boolean
  requireResultVerification: boolean

  requireCriticalResultAcknowledgement:
    boolean

  criticalResultEscalationMinutes:
    number
}

export interface RadiologyConfiguration {
  requirePreparationChecklist: boolean
  requireTechnicalCompletion: boolean

  requireReportVerification: boolean

  requireCriticalFindingCommunication:
    boolean
}

export interface PharmacyConfiguration {
  requireAllergyReview: boolean
  requireInteractionReview: boolean

  allowPartialDispensing: boolean

  requirePharmacistVerification:
    boolean

  requireCounselingBeforeRelease:
    boolean
}

export interface BillingConfiguration {
  currency: "PHP"

  allowOverpayment: boolean

  requireCoverageReference: boolean
  requireAdjustmentReason: boolean
  requireReversalReason: boolean

  maxUnapprovedDiscountCentavos:
    number
}

export interface OperationalSettings {
  appointments:
    AppointmentConfiguration

  clinical:
    ClinicalConfiguration

  laboratory:
    LaboratoryConfiguration

  radiology:
    RadiologyConfiguration

  pharmacy:
    PharmacyConfiguration

  billing:
    BillingConfiguration
}

export interface NotificationSettings {
  channels: Record<
    SettingsNotificationChannel,
    boolean
  >

  events: Record<
    SettingsNotificationEvent,
    boolean
  >
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number
  idleWarningMinutes: number

  maxFailedSignInAttempts: number

  requireMfaForPrivilegedRoles:
    boolean

  passwordMinimumLength: number

  passwordRequireNumber: boolean

  passwordRequireSpecialCharacter:
    boolean
}

export interface SettingsAuditRecord {
  id: string

  section: SettingsSection
  action: SettingsAuditAction

  recordId: string | null

  summary: string

  beforeSnapshot: string | null
  afterSnapshot: string | null

  actor: string
  occurredAt: string
}

export interface GalenMedSettingsState {
  schemaVersion: 1
  revision: number

  organization:
    OrganizationSettings

  branches:
    BranchSettings[]

  departments:
    DepartmentSettings[]

  roles:
    RoleSettings[]

  operations:
    OperationalSettings

  notifications:
    NotificationSettings

  security:
    SecuritySettings

  updatedAt: string
  updatedBy: string
}

export interface SettingsFilters {
  search: string

  section:
    | SettingsSection
    | "all"

  status:
    | "all"
    | "active"
    | "inactive"
}
