"use server"

import {
  redirect,
} from "next/navigation"

import {
  changePatientPasswordSchema,
} from "@/features/patient-portal/schemas/patient-portal.schema"
import type {
  ChangePatientPasswordValues,
  PatientPortalAuthActionResult,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  requirePatientPasswordChange,
} from "@/features/patient-portal/utils/patient-auth.server"
import {
  createAdminClient,
} from "@/lib/supabase/admin"
import {
  createClient,
} from "@/lib/supabase/server"

export async function changeRequiredPatientPasswordAction(
  values:
    ChangePatientPasswordValues
): Promise<
  PatientPortalAuthActionResult
> {
  const parsedValues =
    changePatientPasswordSchema.safeParse(
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
    await requirePatientPasswordChange()

  const adminClient =
    createAdminClient()

  const {
    data: userData,
    error: userError,
  } =
    await adminClient.auth.admin.getUserById(
      context.authUserId
    )

  if (
    userError ||
    !userData.user
  ) {
    return {
      success: false,
      message:
        "The authenticated patient identity could not be loaded.",
    }
  }

  const changedAt =
    new Date().toISOString()

  const {
    error: updateError,
  } =
    await adminClient.auth.admin.updateUserById(
      context.authUserId,
      {
        password:
          parsedValues.data
            .newPassword,

        app_metadata: {
          ...(
            userData.user
              .app_metadata ??
            {}
          ),

          account_type:
            "patient",

          must_change_password:
            false,

          password_changed_at:
            changedAt,
        },

        user_metadata: {
          ...(
            userData.user
              .user_metadata ??
            {}
          ),

          account_type:
            "patient",

          must_change_password:
            false,
        },
      }
    )

  if (updateError) {
    return {
      success: false,
      message:
        "The new Patient Portal password could not be saved.",
    }
  }

  const supabase =
    await createClient()

  const {
    error: auditError,
  } = await supabase.rpc(
    "record_patient_portal_session_event",
    {
      p_event_type:
        "password_changed",
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

  return {
    success: true,
    dashboardPath:
      "/patient/dashboard",
    message:
      auditError
        ? "Password changed. The audit confirmation could not be verified; contact GalenMed support."
        : "Password changed successfully. Opening your Patient Portal.",
  }
}

export async function signOutPatientPortal() {
  const supabase =
    await createClient()

  await supabase.rpc(
    "record_patient_portal_session_event",
    {
      p_event_type:
        "logout",
      p_user_agent:
        null,
      p_metadata: {
        source:
          "patient_portal",
      },
    }
  )

  await supabase.auth.signOut()

  redirect(
    "/patient/login"
  )
}
