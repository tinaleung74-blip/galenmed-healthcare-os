"use server"

import {
  getPreferredDashboardPath,
} from "@/features/auth/utils/staff-auth.utils"
import {
  requireStaffPasswordChange,
} from "@/features/auth/utils/staff-auth.server"
import {
  changeStaffPasswordSchema,
  type ChangeStaffPasswordValues,
} from "@/features/auth/schemas/change-staff-password.schema"
import {
  createAdminClient,
} from "@/lib/supabase/admin"
import {
  createClient,
} from "@/lib/supabase/server"

export interface ChangeStaffPasswordActionResult {
  success: boolean
  message: string
  dashboardPath?: string
}

export async function changeRequiredStaffPasswordAction(
  values: ChangeStaffPasswordValues
): Promise<ChangeStaffPasswordActionResult> {
  const parsedValues =
    changeStaffPasswordSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The new password is invalid.",
    }
  }

  const context =
    await requireStaffPasswordChange()

  const adminClient =
    createAdminClient()

  const {
    data: userData,
    error: userError,
  } =
    await adminClient.auth.admin.getUserById(
      context.userId
    )

  if (
    userError ||
    !userData.user
  ) {
    return {
      success: false,
      message:
        "The authenticated staff identity could not be loaded.",
    }
  }

  const currentAppMetadata =
    userData.user.app_metadata ??
    {}

  const currentUserMetadata =
    userData.user.user_metadata ??
    {}

  const passwordChangeRequired =
    currentAppMetadata
      .must_change_password ===
      true ||
    currentUserMetadata
      .must_change_password ===
      true

  if (!passwordChangeRequired) {
    return {
      success: false,
      message:
        "This staff account no longer requires a first-login password change.",
    }
  }

  const changedAt =
    new Date().toISOString()

  const {
    error: updateError,
  } =
    await adminClient.auth.admin.updateUserById(
      context.userId,
      {
        password:
          parsedValues.data
            .newPassword,

        app_metadata: {
          ...currentAppMetadata,

          must_change_password:
            false,

          password_changed_at:
            changedAt,
        },

        user_metadata: {
          ...currentUserMetadata,

          must_change_password:
            false,
        },
      }
    )

  if (updateError) {
    return {
      success: false,
      message:
        "The new password could not be saved by the authentication service.",
    }
  }

  const supabase =
    await createClient()

  const {
    error: auditError,
  } = await supabase.rpc(
    "record_staff_session_event",
    {
      p_event_type:
        "password_changed",

      p_session_id:
        null,

      p_user_agent:
        null,

      p_metadata: {
        source:
          "required_first_login_password_change",

        changed_at:
          changedAt,
      },
    }
  )

  const dashboardPath =
    getPreferredDashboardPath(
      context
    )

  return {
    success: true,
    dashboardPath,
    message: auditError
      ? "Password changed successfully. The audit confirmation could not be verified; notify the System Administrator."
      : "Password changed successfully. Opening your authorized dashboard.",
  }
}
