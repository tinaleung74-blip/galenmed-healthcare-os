import type {
  StaffRoleCode,
} from "@/features/auth/types/staff-auth.types"

export const STAFF_PORTAL_CODES = [
  "admin",
  "reception",
  "doctor",
  "laboratory",
  "cashier",
] as const

export type StaffPortalCode =
  (typeof STAFF_PORTAL_CODES)[number]

export interface StaffPortalDefinition {
  code: StaffPortalCode
  label: string
  shortLabel: string
  description: string
  dashboardPath: string
  allowedRoles:
    readonly StaffRoleCode[]
}

export const STAFF_PORTALS = [
  {
    code: "admin",
    label: "System Admin Portal",
    shortLabel: "System Admin",
    description:
      "Staff accounts, roles, security, and system configuration.",
    dashboardPath:
      "/admin/dashboard",
    allowedRoles: [
      "SYSTEM_ADMIN",
    ],
  },
  {
    code: "reception",
    label: "Reception Portal",
    shortLabel: "Receptionist",
    description:
      "Patient intake, service routing, printing, and document release.",
    dashboardPath:
      "/reception/dashboard",
    allowedRoles: [
      "RECEPTIONIST",
    ],
  },
  {
    code: "doctor",
    label: "Doctor Portal",
    shortLabel: "Doctor",
    description:
      "Assigned patient queue, consultations, diagnosis, and prescriptions.",
    dashboardPath:
      "/doctor/dashboard",
    allowedRoles: [
      "DOCTOR",
    ],
  },
  {
    code: "laboratory",
    label: "Laboratory Portal",
    shortLabel: "Laboratory",
    description:
      "Laboratory queue, specimen workflow, result entry, and verification.",
    dashboardPath:
      "/laboratory/dashboard",
    allowedRoles: [
      "LABORATORY_STAFF",
      "LABORATORY_VERIFIER",
    ],
  },
  {
    code: "cashier",
    label: "Cashier Portal",
    shortLabel: "Cashier",
    description:
      "Patient billing, payments, receipts, and payment clearance.",
    dashboardPath:
      "/cashier/dashboard",
    allowedRoles: [
      "CASHIER",
    ],
  },
] as const satisfies
  readonly StaffPortalDefinition[]

export function getStaffPortalDefinition(
  portalCode: StaffPortalCode
): StaffPortalDefinition {
  const portal =
    STAFF_PORTALS.find(
      (candidatePortal) =>
        candidatePortal.code ===
        portalCode
    )

  if (!portal) {
    throw new Error(
      "Unknown GalenMed staff portal."
    )
  }

  return portal
}

export function staffPortalAllowsRoles(
  portal: StaffPortalDefinition,
  roleCodes:
    readonly StaffRoleCode[]
): boolean {
  return portal.allowedRoles.some(
    (allowedRole) =>
      roleCodes.includes(
        allowedRole
      )
  )
}

export function getAssignedPortalLabel(
  roleCodes:
    readonly StaffRoleCode[]
): string {
  const portalLabels =
    STAFF_PORTALS
      .filter(
        (portal) =>
          staffPortalAllowsRoles(
            portal,
            roleCodes
          )
      )
      .map(
        (portal) =>
          portal.label
      )

  if (
    portalLabels.length === 0
  ) {
    return "another authorized portal"
  }

  return portalLabels.join(
    " or "
  )
}
