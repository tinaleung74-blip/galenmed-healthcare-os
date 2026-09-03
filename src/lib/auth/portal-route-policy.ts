export const STAFF_ROLE_ROUTE_PREFIXES = [
  "/admin",
  "/reception",
  "/doctor",
  "/laboratory",
  "/cashier",
] as const

export const QUARANTINED_LEGACY_ROUTE_PREFIXES = [
  "/appointments",
  "/billing",
  "/consultations",
  "/dashboard",
  "/patients",
  "/pharmacy",
  "/radiology",
  "/reports",
  "/settings",
] as const

const PUBLIC_STAFF_PATHS = [
  "/staff/login",
  "/staff/reset-password",
] as const

const PUBLIC_PATIENT_PATHS = [
  "/patient/login",
  "/patient/reset-password",
] as const

export type PortalRouteKind =
  | "public"
  | "staff-protected"
  | "patient-protected"
  | "legacy-staff-quarantine"

function normalizePathname(
  pathname: string
): string {
  if (
    pathname.length <= 1
  ) {
    return pathname
  }

  return pathname.replace(
    /\/+$/,
    ""
  )
}

function matchesPathOrChild(
  pathname: string,
  route: string
): boolean {
  return (
    pathname === route ||
    pathname.startsWith(
      `${route}/`
    )
  )
}

function matchesAnyRoute(
  pathname: string,
  routes:
    readonly string[]
): boolean {
  return routes.some(
    (route) =>
      matchesPathOrChild(
        pathname,
        route
      )
  )
}

export function classifyPortalRoute(
  rawPathname: string
): PortalRouteKind {
  const pathname =
    normalizePathname(
      rawPathname
    )

  if (
    matchesAnyRoute(
      pathname,
      QUARANTINED_LEGACY_ROUTE_PREFIXES
    )
  ) {
    return "legacy-staff-quarantine"
  }

  if (
    matchesAnyRoute(
      pathname,
      STAFF_ROLE_ROUTE_PREFIXES
    )
  ) {
    return "staff-protected"
  }

  if (
    pathname === "/staff"
  ) {
    return "staff-protected"
  }

  if (
    pathname.startsWith(
      "/staff/"
    )
  ) {
    return matchesAnyRoute(
      pathname,
      PUBLIC_STAFF_PATHS
    )
      ? "public"
      : "staff-protected"
  }

  if (
    pathname === "/patient"
  ) {
    return "public"
  }

  if (
    pathname.startsWith(
      "/patient/"
    )
  ) {
    return matchesAnyRoute(
      pathname,
      PUBLIC_PATIENT_PATHS
    )
      ? "public"
      : "patient-protected"
  }

  return "public"
}
