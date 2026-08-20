"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  createStaffAccountSchema,
  setStaffAccountStatusSchema,
} from "@/features/staff/schemas/staff-management.schema"
import type {
  CreateStaffAccountValues,
  SetStaffAccountStatusValues,
  StaffManagementActionResult,
} from "@/features/staff/types/staff-management.types"
import {
  createAdminClient,
} from "@/lib/supabase/admin"
import {
  createClient,
} from "@/lib/supabase/server"

const REQUIRED_MANAGEMENT_PERMISSIONS = [
  "staff.accounts.manage",
  "staff.roles.manage",
  "staff.assignments.manage",
] as const

function hasRequiredPermissions(
  permissions: readonly string[]
): boolean {
  return REQUIRED_MANAGEMENT_PERMISSIONS.every(
    (permission) =>
      permissions.includes(
        permission
      )
  )
}

function getAuthCreationErrorMessage(
  message: string
): string {
  const normalizedMessage =
    message.toLocaleLowerCase(
      "en-PH"
    )

  if (
    normalizedMessage.includes(
      "already"
    ) ||
    normalizedMessage.includes(
      "registered"
    )
  ) {
    return "A Supabase Auth user already exists for this work email."
  }

  if (
    normalizedMessage.includes(
      "password"
    )
  ) {
    return "The temporary password was rejected by the authentication service."
  }

  return "The Supabase Auth user could not be created."
}

export async function createOperationalStaffAccountAction(
  values: CreateStaffAccountValues
): Promise<StaffManagementActionResult> {
  const parsedValues =
    createStaffAccountSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The staff account details are invalid.",
    }
  }

  const context =
    await requireStaffRole([
      "SYSTEM_ADMIN",
    ])

  if (
    !hasRequiredPermissions(
      context.permissions
    )
  ) {
    return {
      success: false,
      message:
        "The current administrator does not have all required staff-management permissions.",
    }
  }

  const input =
    parsedValues.data

  const adminClient =
    createAdminClient()

  const {
    data: authData,
    error: authError,
  } =
    await adminClient.auth.admin.createUser(
      {
        email:
          input.workEmail,
        password:
          input.temporaryPassword,
        email_confirm: false,
        app_metadata: {
          account_type: "staff",
          must_change_password:
            true,
        },
        user_metadata: {
          account_type: "staff",
          full_name:
            input.fullName,
          employee_id:
            input.employeeId.toUpperCase(),
          job_title:
            input.jobTitle || null,
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

  const staffId =
    authData.user.id

  const supabase =
    await createClient()

  const {
    error: provisionError,
  } = await supabase.rpc(
    "provision_staff_account",
    {
      p_staff_id: staffId,
      p_employee_id:
        input.employeeId,
      p_full_name:
        input.fullName,
      p_work_email:
        input.workEmail,
      p_mobile_number:
        input.mobileNumber,
      p_job_title:
        input.jobTitle,
      p_role_code:
        input.roleCode,
      p_branch_ids:
        input.branchIds,
      p_primary_branch_id:
        input.primaryBranchId,
      p_department_codes:
        input.departmentCodes,
      p_reason:
        input.reason,
    }
  )

  if (provisionError) {
    await supabase.rpc(
      "set_staff_account_status",
      {
        p_staff_id: staffId,
        p_status: "locked",
        p_reason:
          "Automatic safety lock after staff provisioning failed.",
      }
    )

    return {
      success: false,
      staffId,
      message:
        "The Auth identity was created but staff provisioning failed. The account remains unconfirmed and safety-locked for administrator review.",
    }
  }

  const {
    error: confirmationError,
  } =
    await adminClient.auth.admin.updateUserById(
      staffId,
      {
        email_confirm: true,
      }
    )

  if (confirmationError) {
    await supabase.rpc(
      "set_staff_account_status",
      {
        p_staff_id: staffId,
        p_status: "locked",
        p_reason:
          "Automatic safety lock because Auth email confirmation failed.",
      }
    )

    return {
      success: false,
      staffId,
      message:
        "The staff profile was created but Auth activation failed. The account was safety-locked.",
    }
  }

  revalidatePath(
    "/admin/staff"
  )

  return {
    success: true,
    staffId,
    message:
      "Staff account created and activated successfully.",
  }
}

export async function setStaffAccountStatusAction(
  values: SetStaffAccountStatusValues
): Promise<StaffManagementActionResult> {
  const parsedValues =
    setStaffAccountStatusSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The account status request is invalid.",
    }
  }

  const context =
    await requireStaffRole([
      "SYSTEM_ADMIN",
    ])

  if (
    !context.permissions.includes(
      "staff.accounts.manage"
    )
  ) {
    return {
      success: false,
      message:
        "The current administrator cannot change staff account status.",
    }
  }

  const supabase =
    await createClient()

  const {
    error,
  } = await supabase.rpc(
    "set_staff_account_status",
    {
      p_staff_id:
        parsedValues.data.staffId,
      p_status:
        parsedValues.data.status,
      p_reason:
        parsedValues.data.reason,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        "The staff account status could not be changed.",
    }
  }

  revalidatePath(
    "/admin/staff"
  )

  return {
    success: true,
    staffId:
      parsedValues.data.staffId,
    message:
      "Staff account status updated successfully.",
  }
}
