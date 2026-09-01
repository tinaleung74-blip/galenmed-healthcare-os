"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  createPatientPortalAccountSchema,
  setPatientPortalAccountStatusSchema,
} from "@/features/patient-portal/schemas/patient-portal.schema"
import type {
  CreatePatientPortalAccountValues,
  PatientPortalManagementActionResult,
  SetPatientPortalAccountStatusValues,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  createAdminClient,
} from "@/lib/supabase/admin"
import {
  createClient,
} from "@/lib/supabase/server"

function getAuthCreationErrorMessage(
  message: string
): string {
  const normalized =
    message.toLocaleLowerCase(
      "en-PH"
    )

  if (
    normalized.includes(
      "already"
    ) ||
    normalized.includes(
      "registered"
    )
  ) {
    return "A Supabase Auth user already exists for this patient login email."
  }

  if (
    normalized.includes(
      "password"
    )
  ) {
    return "The temporary password was rejected by the authentication service."
  }

  return "The Patient Portal Auth user could not be created."
}

function hasPatientPortalManagePermission(
  permissions:
    readonly string[],
  roleCodes:
    readonly string[]
): boolean {
  return (
    permissions.includes(
      "patient.portal.manage"
    ) ||
    roleCodes.includes(
      "SYSTEM_ADMIN"
    )
  )
}

export async function createPatientPortalAccountAction(
  values:
    CreatePatientPortalAccountValues
): Promise<
  PatientPortalManagementActionResult
> {
  const parsedValues =
    createPatientPortalAccountSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The Patient Portal account details are invalid.",
    }
  }

  const context =
    await requireStaffRole([
      "SYSTEM_ADMIN",
      "RECEPTIONIST",
    ])

  const roleCodes =
    context.roles.map(
      (role) =>
        role.code
    )

  if (
    !hasPatientPortalManagePermission(
      context.permissions,
      roleCodes
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot create Patient Portal accounts.",
    }
  }

  const input =
    parsedValues.data

  const adminClient =
    createAdminClient()

  const {
    data: patient,
    error: patientError,
  } =
    await adminClient
      .from("patients")
      .select(
        "id, medical_record_number, first_name, middle_name, last_name, status"
      )
      .eq(
        "id",
        input.patientId
      )
      .maybeSingle()

  if (
    patientError ||
    !patient
  ) {
    return {
      success: false,
      message:
        "The selected patient record could not be loaded.",
    }
  }

  if (
    patient.status !==
    "active"
  ) {
    return {
      success: false,
      message:
        "Only an active patient record can receive Patient Portal access.",
    }
  }

  const fullName = [
    patient.first_name,
    patient.middle_name,
    patient.last_name,
  ]
    .filter(
      (
        value
      ): value is string =>
        typeof value === "string" &&
        value.trim().length > 0
    )
    .join(" ")

  const {
    data: authData,
    error: authError,
  } =
    await adminClient.auth.admin.createUser(
      {
        email:
          input.loginEmail,
        password:
          input.temporaryPassword,
        email_confirm:
          false,

        app_metadata: {
          account_type:
            "patient",
          must_change_password:
            true,
        },

        user_metadata: {
          account_type:
            "patient",
          full_name:
            fullName,
          medical_record_number:
            patient.medical_record_number,
          patient_id:
            patient.id,
          must_change_password:
            true,
          provisioned_by:
            context.userId,
        },
      }
    )

  if (
    authError ||
    !authData.user
  ) {
    return {
      success: false,
      message:
        getAuthCreationErrorMessage(
          authError?.message ??
            "Unknown Auth error"
        ),
    }
  }

  const authUserId =
    authData.user.id

  const supabase =
    await createClient()

  const {
    data: linkedAccountId,
    error: linkError,
  } = await supabase.rpc(
    "staff_link_patient_portal_account",
    {
      p_patient_id:
        patient.id,
      p_auth_user_id:
        authUserId,
      p_login_email:
        input.loginEmail,
      p_reason:
        input.reason,
    }
  )

  if (
    linkError ||
    typeof linkedAccountId !==
      "string"
  ) {
    await adminClient.auth.admin.deleteUser(
      authUserId
    )

    return {
      success: false,
      authUserId,
      message:
        "The Auth identity was created, but it could not be linked to the selected patient. The new Auth identity was removed.",
    }
  }

  const accountId =
    linkedAccountId

  const {
    error: activationError,
  } = await supabase.rpc(
    "staff_set_patient_portal_account_status",
    {
      p_account_id:
        accountId,
      p_status:
        "active",
      p_reason:
        "Patient Portal account activated after verified receptionist-controlled patient linking.",
    }
  )

  if (activationError) {
    return {
      success: false,
      accountId,
      authUserId,
      message:
        "The patient identity was linked, but account activation failed. The Auth identity remains unconfirmed for administrator review.",
    }
  }

  const {
    error: confirmationError,
  } =
    await adminClient.auth.admin.updateUserById(
      authUserId,
      {
        email_confirm:
          true,
      }
    )

  if (confirmationError) {
    await supabase.rpc(
      "staff_set_patient_portal_account_status",
      {
        p_account_id:
          accountId,
        p_status:
          "locked",
        p_reason:
          "Automatic safety lock because Patient Portal Auth confirmation failed.",
      }
    )

    return {
      success: false,
      accountId,
      authUserId,
      message:
        "The Patient Portal account was linked but Auth activation failed. The account was safety-locked.",
    }
  }

  revalidatePath(
    "/reception/patient-portal-accounts"
  )

  return {
    success: true,
    accountId,
    authUserId,
    message:
      "Patient Portal login created and linked successfully.",
  }
}

export async function setPatientPortalAccountStatusAction(
  values:
    SetPatientPortalAccountStatusValues
): Promise<
  PatientPortalManagementActionResult
> {
  const parsedValues =
    setPatientPortalAccountStatusSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The Patient Portal status request is invalid.",
    }
  }

  const context =
    await requireStaffRole([
      "SYSTEM_ADMIN",
      "RECEPTIONIST",
    ])

  const roleCodes =
    context.roles.map(
      (role) =>
        role.code
    )

  if (
    !hasPatientPortalManagePermission(
      context.permissions,
      roleCodes
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot change Patient Portal account status.",
    }
  }

  const {
    accountId,
    status,
    reason,
  } = parsedValues.data

  const supabase =
    await createClient()

  const {
    error,
  } = await supabase.rpc(
    "staff_set_patient_portal_account_status",
    {
      p_account_id:
        accountId,
      p_status:
        status,
      p_reason:
        reason,
    }
  )

  if (error) {
    return {
      success: false,
      accountId,
      message:
        "The Patient Portal account status could not be changed.",
    }
  }

  revalidatePath(
    "/reception/patient-portal-accounts"
  )

  return {
    success: true,
    accountId,
    message:
      "Patient Portal account status updated successfully.",
  }
}
