export const PORTAL_ACCOUNT_TYPES = [
  "staff",
  "patient",
] as const

export type PortalAccountType =
  (typeof PORTAL_ACCOUNT_TYPES)[number]

function getMetadataRecord(
  value: unknown
): Record<string, unknown> | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null
  }

  return value as
    Record<string, unknown>
}

function normalizeAccountType(
  value: unknown
): PortalAccountType | null {
  if (
    value === "staff" ||
    value === "patient"
  ) {
    return value
  }

  return null
}

export function readPortalAccountType(
  claims: unknown
): PortalAccountType | null {
  const claimRecord =
    getMetadataRecord(
      claims
    )

  if (!claimRecord) {
    return null
  }

  const appMetadata =
    getMetadataRecord(
      claimRecord.app_metadata
    )

  const userMetadata =
    getMetadataRecord(
      claimRecord.user_metadata
    )

  return (
    normalizeAccountType(
      appMetadata?.account_type
    ) ??
    normalizeAccountType(
      userMetadata?.account_type
    )
  )
}
