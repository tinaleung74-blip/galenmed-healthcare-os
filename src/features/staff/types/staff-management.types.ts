import type {
  StaffAccountStatus,
  StaffRoleCode,
} from "@/features/auth/types/staff-auth.types"

export const OPERATIONAL_STAFF_ROLE_CODES = [
  "RECEPTIONIST",
  "DOCTOR",
  "LABORATORY_STAFF",
  "LABORATORY_VERIFIER",
  "CASHIER",
] as const

export type OperationalStaffRoleCode =
  (typeof OPERATIONAL_STAFF_ROLE_CODES)[number]

export const MANAGEABLE_STAFF_ACCOUNT_STATUSES = [
  "active",
  "locked",
  "suspended",
  "archived",
] as const

export type ManageableStaffAccountStatus =
  (typeof MANAGEABLE_STAFF_ACCOUNT_STATUSES)[number]

export interface StaffManagementRole {
  code: StaffRoleCode
  name: string
  description: string | null
  dashboardPath: string
}

export interface StaffManagementBranch {
  id: string
  code: string
  name: string
  shortName: string | null
  city: string | null
  isPrimary?: boolean
}

export interface StaffManagementDepartment {
  id: string
  code: string
  name: string
  description: string | null
}

export interface StaffManagementRecord {
  id: string
  employeeId: string | null
  fullName: string
  workEmail: string
  mobileNumber: string | null
  jobTitle: string | null
  accountStatus: StaffAccountStatus
  lastLoginAt: string | null
  invitedAt: string | null
  activatedAt: string | null
  createdAt: string
  updatedAt: string
  roles: StaffManagementRole[]
  branches: StaffManagementBranch[]
  departments: StaffManagementDepartment[]
}

export interface StaffManagementData {
  staff: StaffManagementRecord[]
  roles: Array<
    StaffManagementRole & {
      code: OperationalStaffRoleCode
    }
  >
  branches: StaffManagementBranch[]
  departments: StaffManagementDepartment[]
}

export interface CreateStaffAccountValues {
  employeeId: string
  fullName: string
  workEmail: string
  mobileNumber: string
  jobTitle: string
  roleCode: OperationalStaffRoleCode
  branchIds: string[]
  primaryBranchId: string
  departmentCodes: string[]
  temporaryPassword: string
  confirmTemporaryPassword: string
  reason: string
}

export interface SetStaffAccountStatusValues {
  staffId: string
  status: ManageableStaffAccountStatus
  reason: string
}

export interface StaffManagementActionResult {
  success: boolean
  message: string
  staffId?: string
}
