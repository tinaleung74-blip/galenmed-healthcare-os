import { z } from "zod"

import {
  STAFF_ACCOUNT_STATUSES,
  STAFF_ROLE_CODES,
} from "@/features/auth/types/staff-auth.types"

export const staffLoginFormSchema =
  z.object({
    email: z
      .string()
      .trim()
      .min(
        1,
        "Work email is required."
      )
      .email(
        "Enter a valid work email address."
      ),

    password: z
      .string()
      .min(
        1,
        "Password is required."
      ),
  })

export type StaffLoginFormValues =
  z.infer<
    typeof staffLoginFormSchema
  >

const rawStaffRoleSchema =
  z.object({
    code: z.enum(
      STAFF_ROLE_CODES
    ),

    name: z.string(),

    dashboard_path: z
      .string()
      .startsWith("/"),
  })

const rawStaffBranchSchema =
  z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    is_primary: z.boolean(),
  })

const rawStaffDepartmentSchema =
  z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  })

export const staffContextSchema =
  z
    .object({
      user_id: z.string().uuid(),

      employee_id: z
        .string()
        .nullable(),

      full_name: z.string(),
      work_email: z.string(),

      mobile_number: z
        .string()
        .nullable(),

      job_title: z
        .string()
        .nullable(),

      account_status: z.enum(
        STAFF_ACCOUNT_STATUSES
      ),

      last_login_at: z
        .string()
        .nullable(),

      roles: z.array(
        rawStaffRoleSchema
      ),

      permissions: z.array(
        z.string()
      ),

      branches: z.array(
        rawStaffBranchSchema
      ),

      departments: z.array(
        rawStaffDepartmentSchema
      ),
    })
    .transform(
      (rawContext) => ({
        userId:
          rawContext.user_id,

        employeeId:
          rawContext.employee_id,

        fullName:
          rawContext.full_name,

        workEmail:
          rawContext.work_email,

        mobileNumber:
          rawContext.mobile_number,

        jobTitle:
          rawContext.job_title,

        accountStatus:
          rawContext.account_status,

        lastLoginAt:
          rawContext.last_login_at,

        roles:
          rawContext.roles.map(
            (role) => ({
              code: role.code,
              name: role.name,
              dashboardPath:
                role.dashboard_path,
            })
          ),

        permissions:
          rawContext.permissions,

        branches:
          rawContext.branches.map(
            (branch) => ({
              id: branch.id,
              code: branch.code,
              name: branch.name,
              isPrimary:
                branch.is_primary,
            })
          ),

        departments:
          rawContext.departments.map(
            (department) => ({
              id: department.id,
              code: department.code,
              name: department.name,
            })
          ),
      })
    )

export type ParsedStaffContext =
  z.infer<
    typeof staffContextSchema
  >
