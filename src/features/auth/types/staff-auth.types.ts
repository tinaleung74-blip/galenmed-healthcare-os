export const STAFF_ROLE_CODES = [
  "SYSTEM_ADMIN",
  "RECEPTIONIST",
  "DOCTOR",
  "LABORATORY_STAFF",
  "LABORATORY_VERIFIER",
  "CASHIER",
] as const

export type StaffRoleCode =
  (typeof STAFF_ROLE_CODES)[number]

export const STAFF_ACCOUNT_STATUSES = [
  "invited",
  "active",
  "locked",
  "suspended",
  "archived",
] as const

export type StaffAccountStatus =
  (typeof STAFF_ACCOUNT_STATUSES)[number]

export interface StaffRoleContext {
  code: StaffRoleCode
  name: string
  dashboardPath: string
}

export interface StaffBranchContext {
  id: string
  code: string
  name: string
  isPrimary: boolean
}

export interface StaffDepartmentContext {
  id: string
  code: string
  name: string
}

export interface StaffContext {
  userId: string
  employeeId: string | null
  fullName: string
  workEmail: string
  mobileNumber: string | null
  jobTitle: string | null
  accountStatus: StaffAccountStatus
  lastLoginAt: string | null
  roles: StaffRoleContext[]
  permissions: string[]
  branches: StaffBranchContext[]
  departments: StaffDepartmentContext[]
}
