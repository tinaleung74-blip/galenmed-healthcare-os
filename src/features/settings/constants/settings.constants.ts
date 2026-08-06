import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import type {
  BranchSettings,
  DepartmentSettings,
  GalenMedSettingsState,
  RoleSettings,
  SettingsAuditAction,
  SettingsFilters,
  SettingsNotificationChannel,
  SettingsNotificationEvent,
  SettingsPermissionKey,
  SettingsSection,
} from "@/features/settings/types/settings.types"
import {
  SETTINGS_PERMISSION_KEYS,
} from "@/features/settings/types/settings.types"

export const SETTINGS_SECTION_LABELS: Record<
  SettingsSection,
  string
> = {
  organization:
    "Organization Profile",

  branches:
    "Branches",

  departments:
    "Departments",

  "roles-permissions":
    "Roles and Permissions",

  appointments:
    "Appointment Configuration",

  clinical:
    "Clinical Defaults",

  laboratory:
    "Laboratory Configuration",

  radiology:
    "Radiology Configuration",

  pharmacy:
    "Pharmacy Configuration",

  billing:
    "Billing Configuration",

  notifications:
    "Notification Preferences",

  security:
    "Security and Sessions",

  "audit-history":
    "Configuration Audit History",
}

export const SETTINGS_PERMISSION_LABELS: Record<
  SettingsPermissionKey,
  string
> = {
  "dashboard.view":
    "View Dashboard",

  "patients.view":
    "View Patients",

  "patients.manage":
    "Manage Patients",

  "appointments.view":
    "View Appointments",

  "appointments.manage":
    "Manage Appointments",

  "consultations.view":
    "View Consultations",

  "consultations.manage":
    "Manage Consultations",

  "laboratory.view":
    "View Laboratory",

  "laboratory.manage":
    "Manage Laboratory",

  "laboratory.release":
    "Release Laboratory Results",

  "radiology.view":
    "View Radiology",

  "radiology.manage":
    "Manage Radiology",

  "radiology.release":
    "Release Radiology Reports",

  "pharmacy.view":
    "View Pharmacy",

  "pharmacy.manage":
    "Manage Pharmacy",

  "pharmacy.release":
    "Release Medications",

  "billing.view":
    "View Billing",

  "billing.manage":
    "Manage Billing",

  "billing.refund":
    "Process Billing Refunds",

  "reports.view":
    "View Reports",

  "reports.export":
    "Export Reports",

  "settings.view":
    "View Settings",

  "settings.manage":
    "Manage Settings",

  "audit.view":
    "View Audit History",
}

export const SETTINGS_NOTIFICATION_CHANNEL_LABELS: Record<
  SettingsNotificationChannel,
  string
> = {
  "in-app":
    "In-app",

  email:
    "Email",

  sms:
    "SMS",
}

export const SETTINGS_NOTIFICATION_EVENT_LABELS: Record<
  SettingsNotificationEvent,
  string
> = {
  "appointment-reminder":
    "Appointment Reminder",

  "appointment-cancelled":
    "Appointment Cancelled",

  "critical-laboratory-result":
    "Critical Laboratory Result",

  "critical-radiology-finding":
    "Critical Radiology Finding",

  "pharmacy-prescription-ready":
    "Prescription Ready",

  "billing-payment-posted":
    "Billing Payment Posted",

  "billing-refund-posted":
    "Billing Refund Posted",

  "security-alert":
    "Security Alert",
}

export const SETTINGS_AUDIT_ACTION_LABELS: Record<
  SettingsAuditAction,
  string
> = {
  created:
    "Created",

  updated:
    "Updated",

  activated:
    "Activated",

  deactivated:
    "Deactivated",

  "permission-changed":
    "Permissions Changed",

  "security-changed":
    "Security Changed",

  reset:
    "Reset",
}

export const SETTINGS_SYSTEM_ACTOR =
  "GalenMed System"

export const SETTINGS_SYNTHETIC_NOTICE =
  "Organization, branch, department, role, notification, security, and operational configuration values are synthetic development settings."

export const SETTINGS_AUDIT_NOTICE =
  "Configuration changes must be recorded as append-only audit events in production."

export const DEFAULT_SETTINGS_FILTERS:
  SettingsFilters = {
  search: "",
  section: "all",
  status: "all",
}

export const DEFAULT_BRANCH_SETTINGS:
  BranchSettings[] =
  GALENMED_BRANCHES.map(
    (branch, index) => ({
      branchId:
        branch.id,

      displayName:
        branch.name,

      code:
        `GM-${String(
          index + 1
        ).padStart(3, "0")}`,

      address: "",

      phoneNumber: null,
      emailAddress: null,

      timezone:
        "Asia/Manila",

      active: true,
    })
  )

const allBranchIds =
  GALENMED_BRANCHES.map(
    (branch) =>
      branch.id
  )

export const DEFAULT_DEPARTMENT_SETTINGS:
  DepartmentSettings[] = [
  {
    id:
      "department-administration",

    code: "ADMIN",

    name:
      "Administration",

    description:
      "Organization and administrative operations.",

    branchIds: [
      ...allBranchIds,
    ],

    active: true,
  },
  {
    id:
      "department-outpatient",

    code: "OPD",

    name:
      "Outpatient Services",

    description:
      "Appointments, reception, and consultation operations.",

    branchIds: [
      ...allBranchIds,
    ],

    active: true,
  },
  {
    id:
      "department-laboratory",

    code: "LAB",

    name:
      "Laboratory",

    description:
      "Laboratory requests, specimens, processing, and results.",

    branchIds: [
      ...allBranchIds,
    ],

    active: true,
  },
  {
    id:
      "department-radiology",

    code: "RAD",

    name:
      "Radiology",

    description:
      "Imaging requests, acquisition, reporting, and release.",

    branchIds: [
      ...allBranchIds,
    ],

    active: true,
  },
  {
    id:
      "department-pharmacy",

    code: "PHARM",

    name:
      "Pharmacy",

    description:
      "Prescription review, dispensing, verification, counseling, and release.",

    branchIds: [
      ...allBranchIds,
    ],

    active: true,
  },
  {
    id:
      "department-billing",

    code: "BILL",

    name:
      "Billing and Collections",

    description:
      "Patient charges, statements, payments, receipts, refunds, and balances.",

    branchIds: [
      ...allBranchIds,
    ],

    active: true,
  },
]

const allPermissions:
  SettingsPermissionKey[] = [
  ...SETTINGS_PERMISSION_KEYS,
]

export const DEFAULT_ROLE_SETTINGS:
  RoleSettings[] = [
  {
    id:
      "role-super-admin",

    code:
      "SUPER_ADMIN",

    name:
      "Super Administrator",

    description:
      "Full development access to every module and configuration area.",

    permissions: [
      ...allPermissions,
    ],

    systemRole: true,
    active: true,
  },
  {
    id:
      "role-physician",

    code:
      "PHYSICIAN",

    name:
      "Physician",

    description:
      "Clinical patient and consultation access with diagnostic-result visibility.",

    permissions: [
      "dashboard.view",

      "patients.view",
      "patients.manage",

      "appointments.view",

      "consultations.view",
      "consultations.manage",

      "laboratory.view",
      "radiology.view",
      "pharmacy.view",

      "reports.view",
    ],

    systemRole: true,
    active: true,
  },
  {
    id:
      "role-nurse",

    code:
      "NURSE",

    name:
      "Nurse",

    description:
      "Patient, appointment, consultation, and clinical-support access.",

    permissions: [
      "dashboard.view",

      "patients.view",
      "patients.manage",

      "appointments.view",
      "appointments.manage",

      "consultations.view",

      "laboratory.view",
      "radiology.view",

      "reports.view",
    ],

    systemRole: true,
    active: true,
  },
  {
    id:
      "role-receptionist",

    code:
      "RECEPTION",

    name:
      "Receptionist",

    description:
      "Patient registration and appointment-management access.",

    permissions: [
      "dashboard.view",

      "patients.view",
      "patients.manage",

      "appointments.view",
      "appointments.manage",

      "consultations.view",

      "billing.view",
    ],

    systemRole: true,
    active: true,
  },
  {
    id:
      "role-laboratory",

    code:
      "LABORATORY",

    name:
      "Laboratory Professional",

    description:
      "Laboratory processing, verification, and result-release access.",

    permissions: [
      "dashboard.view",

      "patients.view",

      "laboratory.view",
      "laboratory.manage",
      "laboratory.release",

      "reports.view",
    ],

    systemRole: true,
    active: true,
  },
  {
    id:
      "role-radiology",

    code:
      "RADIOLOGY",

    name:
      "Radiology Professional",

    description:
      "Radiology imaging, reporting, verification, and release access.",

    permissions: [
      "dashboard.view",

      "patients.view",

      "radiology.view",
      "radiology.manage",
      "radiology.release",

      "reports.view",
    ],

    systemRole: true,
    active: true,
  },
  {
    id:
      "role-pharmacist",

    code:
      "PHARMACIST",

    name:
      "Pharmacist",

    description:
      "Prescription safety review, dispensing, verification, counseling, and release access.",

    permissions: [
      "dashboard.view",

      "patients.view",

      "pharmacy.view",
      "pharmacy.manage",
      "pharmacy.release",

      "reports.view",
    ],

    systemRole: true,
    active: true,
  },
  {
    id:
      "role-billing",

    code:
      "BILLING",

    name:
      "Billing Officer",

    description:
      "Billing, collection, receipt, refund, and financial-history access.",

    permissions: [
      "dashboard.view",

      "patients.view",

      "billing.view",
      "billing.manage",
      "billing.refund",

      "reports.view",
      "reports.export",
    ],

    systemRole: true,
    active: true,
  },
  {
    id:
      "role-reports-viewer",

    code:
      "REPORTS_VIEWER",

    name:
      "Reports Viewer",

    description:
      "Read-only operational-report and export access.",

    permissions: [
      "dashboard.view",
      "reports.view",
      "reports.export",
    ],

    systemRole: true,
    active: true,
  },
]

export const DEFAULT_GALENMED_SETTINGS:
  GalenMedSettingsState = {
  schemaVersion: 1,
  revision: 1,

  organization: {
    legalName:
      "GalenMed Healthcare",

    displayName:
      "GalenMed",

    registrationNumber:
      null,

    taxIdentificationNumber:
      null,

    phoneNumber: null,
    emailAddress: null,
    website: null,

    address: "",

    timezone:
      "Asia/Manila",

    currency: "PHP",
    locale: "en-PH",
  },

  branches:
    DEFAULT_BRANCH_SETTINGS.map(
      (branch) => ({
        ...branch,
      })
    ),

  departments:
    DEFAULT_DEPARTMENT_SETTINGS.map(
      (department) => ({
        ...department,

        branchIds: [
          ...department.branchIds,
        ],
      })
    ),

  roles:
    DEFAULT_ROLE_SETTINGS.map(
      (role) => ({
        ...role,

        permissions: [
          ...role.permissions,
        ],
      })
    ),

  operations: {
    appointments: {
      defaultDurationMinutes:
        30,

      allowSameDayBooking:
        true,

      requireConfirmation:
        true,

      checkInGraceMinutes:
        15,

      noShowAfterMinutes:
        30,
    },

    clinical: {
      requireAllergyReview:
        true,

      requireVitalSignsBeforeConsultation:
        false,

      allowConsultationWithoutAppointment:
        true,

      defaultFollowUpDays:
        7,
    },

    laboratory: {
      requireSpecimenCollection:
        true,

      requireResultVerification:
        true,

      requireCriticalResultAcknowledgement:
        true,

      criticalResultEscalationMinutes:
        15,
    },

    radiology: {
      requirePreparationChecklist:
        true,

      requireTechnicalCompletion:
        true,

      requireReportVerification:
        true,

      requireCriticalFindingCommunication:
        true,
    },

    pharmacy: {
      requireAllergyReview:
        true,

      requireInteractionReview:
        true,

      allowPartialDispensing:
        true,

      requirePharmacistVerification:
        true,

      requireCounselingBeforeRelease:
        true,
    },

    billing: {
      currency: "PHP",

      allowOverpayment:
        true,

      requireCoverageReference:
        true,

      requireAdjustmentReason:
        true,

      requireReversalReason:
        true,

      maxUnapprovedDiscountCentavos:
        50000,
    },
  },

  notifications: {
    channels: {
      "in-app": true,
      email: false,
      sms: false,
    },

    events: {
      "appointment-reminder":
        true,

      "appointment-cancelled":
        true,

      "critical-laboratory-result":
        true,

      "critical-radiology-finding":
        true,

      "pharmacy-prescription-ready":
        true,

      "billing-payment-posted":
        true,

      "billing-refund-posted":
        true,

      "security-alert":
        true,
    },
  },

  security: {
    sessionTimeoutMinutes:
      60,

    idleWarningMinutes:
      50,

    maxFailedSignInAttempts:
      5,

    requireMfaForPrivilegedRoles:
      true,

    passwordMinimumLength:
      12,

    passwordRequireNumber:
      true,

    passwordRequireSpecialCharacter:
      true,
  },

  updatedAt:
    "2026-08-05T08:00:00+08:00",

  updatedBy:
    SETTINGS_SYSTEM_ACTOR,
}
