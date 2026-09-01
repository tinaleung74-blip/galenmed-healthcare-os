export const PATIENT_PORTAL_ACCOUNT_STATUSES = [
  "invited",
  "active",
  "locked",
  "suspended",
  "archived",
] as const

export type PatientPortalAccountStatus =
  (typeof PATIENT_PORTAL_ACCOUNT_STATUSES)[number]

export interface PatientPortalAccountSummary {
  id: string
  authUserId: string
  loginEmail: string
  status: PatientPortalAccountStatus
  mustChangePassword: boolean
  invitedAt: string
  activatedAt: string | null
  lastLoginAt: string | null
  updatedAt: string
}

export interface PatientPortalPatientRecord {
  patientId: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  mobileNumber: string | null
  emailAddress: string | null
  patientStatus: string
  branchId: string
  branchName: string
  portalAccount: PatientPortalAccountSummary | null
}

export interface PatientPortalManagementData {
  patients: PatientPortalPatientRecord[]
}

export interface CreatePatientPortalAccountValues {
  patientId: string
  loginEmail: string
  temporaryPassword: string
  confirmTemporaryPassword: string
  reason: string
}

export interface SetPatientPortalAccountStatusValues {
  accountId: string
  status: Exclude<
    PatientPortalAccountStatus,
    "invited"
  >
  reason: string
}

export interface PatientPortalManagementActionResult {
  success: boolean
  message: string
  accountId?: string
  authUserId?: string
}

export interface PatientPortalContextPatient {
  id: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex: string
  mobileNumber: string | null
  emailAddress: string | null
  branchId: string
  status: string
}

export interface PatientPortalContextBranch {
  id: string
  code: string
  name: string
}

export interface PatientPortalContext {
  accountId: string
  authUserId: string
  accountStatus: PatientPortalAccountStatus
  mustChangePassword: boolean
  loginEmail: string
  lastLoginAt: string | null
  patient: PatientPortalContextPatient
  branch: PatientPortalContextBranch | null
}

export interface PatientLoginValues {
  email: string
  password: string
}

export interface ChangePatientPasswordValues {
  newPassword: string
  confirmNewPassword: string
}

export interface PatientPortalAuthActionResult {
  success: boolean
  message: string
  dashboardPath?: string
}
