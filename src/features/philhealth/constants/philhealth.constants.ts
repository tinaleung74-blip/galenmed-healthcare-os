import type {
  PhilHealthAuditAction,
  PhilHealthClaimStatus,
  PhilHealthConnectionMode,
  PhilHealthEligibilityStatus,
  PhilHealthIntegrationStatus,
  PhilHealthMemberRelationship,
  PhilHealthModuleSettings,
  PhilHealthPermission,
  PhilHealthRequirementStatus,
  PhilHealthStaffRole,
  PhilHealthStaffRoleDefinition,
  PhilHealthSubmissionChannel,
} from "@/features/philhealth/types/philhealth.types"

export const PHILHEALTH_CONNECTION_MODE_LABELS: Record<
  PhilHealthConnectionMode,
  string
> = {
  manual:
    "Manual / Semi-integrated",

  certification:
    "Certification and Testing",

  live:
    "Live eClaims Integration",
}

export const PHILHEALTH_INTEGRATION_STATUS_LABELS: Record<
  PhilHealthIntegrationStatus,
  string
> = {
  "not-configured":
    "Not Configured",

  "awaiting-credentials":
    "Awaiting Credentials",

  testing:
    "Testing",

  certification:
    "Certification in Progress",

  ready:
    "Ready",

  blocked:
    "Blocked",
}

export const PHILHEALTH_CLAIM_STATUS_LABELS: Record<
  PhilHealthClaimStatus,
  string
> = {
  draft:
    "Draft",

  "eligibility-pending":
    "Eligibility Pending",

  "requirements-incomplete":
    "Requirements Incomplete",

  "ready-for-review":
    "Ready for Review",

  "under-review":
    "Under Review",

  "approved-for-submission":
    "Approved for Submission",

  "submitted-manually":
    "Submitted Manually",

  "submitted-electronically":
    "Submitted Electronically",

  returned:
    "Returned",

  denied:
    "Denied",

  paid:
    "Paid",

  reconciled:
    "Reconciled",

  voided:
    "Voided",
}

export const PHILHEALTH_ELIGIBILITY_STATUS_LABELS: Record<
  PhilHealthEligibilityStatus,
  string
> = {
  "not-checked":
    "Not Checked",

  pending:
    "Pending",

  eligible:
    "Eligible",

  "not-eligible":
    "Not Eligible",

  mismatch:
    "Member Data Mismatch",

  error:
    "Verification Error",
}

export const PHILHEALTH_MEMBER_RELATIONSHIP_LABELS: Record<
  PhilHealthMemberRelationship,
  string
> = {
  member:
    "Member",

  spouse:
    "Spouse / Dependent",

  child:
    "Child / Dependent",

  parent:
    "Parent / Dependent",

  "other-dependent":
    "Other Dependent",
}

export const PHILHEALTH_SUBMISSION_CHANNEL_LABELS: Record<
  PhilHealthSubmissionChannel,
  string
> = {
  "not-submitted":
    "Not Submitted",

  "official-portal-manual":
    "Official Portal — Manual",

  "eclaims-integration":
    "eClaims Integration",
}

export const PHILHEALTH_REQUIREMENT_STATUS_LABELS: Record<
  PhilHealthRequirementStatus,
  string
> = {
  missing:
    "Missing",

  provided:
    "Provided",

  verified:
    "Verified",

  rejected:
    "Rejected",

  "not-required":
    "Not Required",
}

export const PHILHEALTH_AUDIT_ACTION_LABELS: Record<
  PhilHealthAuditAction,
  string
> = {
  "profile-created":
    "Profile Created",

  "profile-updated":
    "Profile Updated",

  "eligibility-recorded":
    "Eligibility Recorded",

  "claim-created":
    "Claim Created",

  "claim-updated":
    "Claim Updated",

  "requirement-updated":
    "Requirement Updated",

  "review-started":
    "Review Started",

  "claim-approved":
    "Claim Approved",

  "claim-submitted":
    "Claim Submitted",

  "claim-returned":
    "Claim Returned",

  "claim-denied":
    "Claim Denied",

  "payment-recorded":
    "Payment Recorded",

  "claim-reconciled":
    "Claim Reconciled",

  "claim-voided":
    "Claim Voided",

  "integration-status-changed":
    "Integration Status Changed",
}

export const PHILHEALTH_PERMISSION_LABELS: Record<
  PhilHealthPermission,
  string
> = {
  "philhealth.view":
    "View PhilHealth Workspace",

  "philhealth.profile-manage":
    "Manage Patient PhilHealth Profiles",

  "philhealth.eligibility-record":
    "Record Eligibility Results",

  "philhealth.claim-create":
    "Create Claim Drafts",

  "philhealth.claim-review":
    "Review Claims",

  "philhealth.claim-approve":
    "Approve Claims for Submission",

  "philhealth.claim-submit":
    "Record or Perform Submission",

  "philhealth.payment-reconcile":
    "Record Payments and Reconcile Claims",

  "philhealth.settings-manage":
    "Manage PhilHealth Integration Settings",

  "philhealth.audit-view":
    "View PhilHealth Audit History",
}

export const PHILHEALTH_STAFF_ROLE_DEFINITIONS: Record<
  PhilHealthStaffRole,
  PhilHealthStaffRoleDefinition
> = {
  admission: {
    role: "admission",

    name:
      "Admission Staff",

    description:
      "Creates or updates patient PhilHealth profiles and initial claim details.",

    permissions: [
      "philhealth.view",
      "philhealth.profile-manage",
      "philhealth.claim-create",
    ],
  },

  "philhealth-officer": {
    role:
      "philhealth-officer",

    name:
      "PhilHealth Officer",

    description:
      "Records eligibility results, manages requirements, and prepares claims.",

    permissions: [
      "philhealth.view",
      "philhealth.profile-manage",
      "philhealth.eligibility-record",
      "philhealth.claim-create",
      "philhealth.claim-review",
      "philhealth.audit-view",
    ],
  },

  billing: {
    role: "billing",

    name:
      "Billing Staff",

    description:
      "Records hospital charges, estimated benefits, patient responsibility, and payments.",

    permissions: [
      "philhealth.view",
      "philhealth.claim-create",
      "philhealth.claim-review",
      "philhealth.payment-reconcile",
    ],
  },

  "claims-reviewer": {
    role:
      "claims-reviewer",

    name:
      "Claims Reviewer",

    description:
      "Performs final completeness review and approves claims for submission.",

    permissions: [
      "philhealth.view",
      "philhealth.claim-review",
      "philhealth.claim-approve",
      "philhealth.audit-view",
    ],
  },

  administrator: {
    role:
      "administrator",

    name:
      "PhilHealth Administrator",

    description:
      "Manages all PhilHealth workspace functions and integration configuration.",

    permissions: [
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
    ],
  },
}

export const DEFAULT_PHILHEALTH_MODULE_SETTINGS:
  PhilHealthModuleSettings = {
  connectionMode:
    "manual",

  integrationStatus:
    "not-configured",

  liveIntegrationEnabled:
    false,

  facilityAccreditationNumber:
    null,

  certifiedServiceProvider:
    null,

  testEnvironmentConfigured:
    false,

  productionEnvironmentConfigured:
    false,

  lastConnectivityCheckAt:
    null,

  lastConnectivityCheckResult:
    null,
}

export const PHILHEALTH_MANUAL_MODE_NOTICE =
  "This GalenMed workspace is not connected to PhilHealth. Eligibility and submission results must be obtained through authorized official channels and recorded manually."

export const PHILHEALTH_SECURITY_NOTICE =
  "Do not enter PhilHealth Member Portal passwords, OTPs, or personal login credentials in GalenMed."

export const PHILHEALTH_DEVELOPMENT_NOTICE =
  "Do not use real member PINs or real claim documents while this module is using development browser storage."
