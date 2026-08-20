import type {
  StaffContext,
  StaffRoleCode,
} from "@/features/auth/types/staff-auth.types"

const STAFF_ROLE_PRIORITY:
  readonly StaffRoleCode[] = [
  "SYSTEM_ADMIN",
  "RECEPTIONIST",
  "DOCTOR",
  "LABORATORY_VERIFIER",
  "LABORATORY_STAFF",
  "CASHIER",
]

export function getPreferredDashboardPath(
  context: StaffContext
): string {
  for (
    const roleCode of
    STAFF_ROLE_PRIORITY
  ) {
    const matchingRole =
      context.roles.find(
        (role) =>
          role.code === roleCode
      )

    if (matchingRole) {
      return matchingRole.dashboardPath
    }
  }

  return "/staff/login?error=no-role"
}

export function hasStaffRole(
  context: StaffContext,
  allowedRoles:
    readonly StaffRoleCode[]
): boolean {
  return context.roles.some(
    (role) =>
      allowedRoles.includes(
        role.code
      )
  )
}
