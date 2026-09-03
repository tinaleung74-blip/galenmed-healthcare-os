import {
  redirect,
} from "next/navigation"

import {
  staffContextSchema,
} from "@/features/auth/schemas/staff-auth.schema"
import type {
  StaffContext,
  StaffRoleCode,
} from "@/features/auth/types/staff-auth.types"
import {
  getPreferredDashboardPath,
  hasStaffRole,
} from "@/features/auth/utils/staff-auth.utils"
import {
  readPortalAccountType,
} from "@/lib/auth/portal-account-type"
import {
  createClient,
} from "@/lib/supabase/server"

interface CurrentStaffAuthState {
  context:
    StaffContext | null

  mustChangePassword:
    boolean
}

function readMustChangePassword(
  claims: unknown
): boolean {
  if (
    typeof claims !==
      "object" ||
    claims === null
  ) {
    return false
  }

  const claimRecord =
    claims as {
      app_metadata?: unknown
      user_metadata?: unknown
    }

  const appMetadata =
    claimRecord.app_metadata

  const userMetadata =
    claimRecord.user_metadata

  const appMetadataRequiresChange =
    typeof appMetadata ===
      "object" &&
    appMetadata !== null &&
    (
      appMetadata as {
        must_change_password?:
          unknown
      }
    ).must_change_password ===
      true

  const legacyUserMetadataRequiresChange =
    typeof userMetadata ===
      "object" &&
    userMetadata !== null &&
    (
      userMetadata as {
        must_change_password?:
          unknown
      }
    ).must_change_password ===
      true

  return (
    appMetadataRequiresChange ||
    legacyUserMetadataRequiresChange
  )
}

async function getCurrentStaffAuthState(): Promise<
  CurrentStaffAuthState
> {
  const supabase =
    await createClient()

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims()

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      context:
        null,

      mustChangePassword:
        false,
    }
  }

  if (
    readPortalAccountType(
      claimsData.claims
    ) === "patient"
  ) {
    return {
      context:
        null,

      mustChangePassword:
        false,
    }
  }

  const {
    data: contextData,
    error: contextError,
  } = await supabase.rpc(
    "get_current_staff_context"
  )

  if (contextError) {
    return {
      context:
        null,

      mustChangePassword:
        false,
    }
  }

  const parsedContext =
    staffContextSchema.safeParse(
      contextData
    )

  return {
    context:
      parsedContext.success
        ? parsedContext.data
        : null,

    mustChangePassword:
      readMustChangePassword(
        claimsData.claims
      ),
  }
}

export async function getCurrentStaffContext(): Promise<
  StaffContext | null
> {
  const authState =
    await getCurrentStaffAuthState()

  return authState.context
}

function validateActiveStaffContext(
  context:
    StaffContext | null
): StaffContext {
  if (!context) {
    redirect(
      "/staff/login"
    )
  }

  if (
    context.accountStatus !==
    "active"
  ) {
    redirect(
      "/staff/login?error=inactive"
    )
  }

  if (
    context.roles.length === 0
  ) {
    redirect(
      "/staff/login?error=no-role"
    )
  }

  return context
}

export async function requireAnyStaff(): Promise<
  StaffContext
> {
  const authState =
    await getCurrentStaffAuthState()

  const context =
    validateActiveStaffContext(
      authState.context
    )

  if (
    authState.mustChangePassword
  ) {
    redirect(
      "/staff/change-password"
    )
  }

  return context
}

export async function requireStaffPasswordChange(): Promise<
  StaffContext
> {
  const authState =
    await getCurrentStaffAuthState()

  const context =
    validateActiveStaffContext(
      authState.context
    )

  if (
    !authState.mustChangePassword
  ) {
    redirect(
      getPreferredDashboardPath(
        context
      )
    )
  }

  return context
}

export async function requireStaffRole(
  allowedRoles:
    readonly StaffRoleCode[]
): Promise<StaffContext> {
  const context =
    await requireAnyStaff()

  if (
    !hasStaffRole(
      context,
      allowedRoles
    )
  ) {
    redirect(
      getPreferredDashboardPath(
        context
      )
    )
  }

  return context
}
