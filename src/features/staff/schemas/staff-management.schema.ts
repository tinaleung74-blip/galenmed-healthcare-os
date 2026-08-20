import { z } from "zod"

import {
  STAFF_ACCOUNT_STATUSES,
  STAFF_ROLE_CODES,
} from "@/features/auth/types/staff-auth.types"
import {
  MANAGEABLE_STAFF_ACCOUNT_STATUSES,
  OPERATIONAL_STAFF_ROLE_CODES,
} from "@/features/staff/types/staff-management.types"

export const REQUIRED_DEPARTMENT_BY_ROLE = {
  RECEPTIONIST: "FRONT_DESK",
  DOCTOR: "MEDICINE",
  LABORATORY_STAFF: "LABORATORY",
  LABORATORY_VERIFIER: "LABORATORY",
  CASHIER: "CASHIER",
} as const

const rawRoleSchema =
  z.object({
    code: z.enum(
      STAFF_ROLE_CODES
    ),
    name: z.string(),
    description: z
      .string()
      .nullable()
      .optional(),
    dashboard_path: z.string(),
  })

const rawBranchSchema =
  z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    short_name: z
      .string()
      .nullable()
      .optional(),
    city: z
      .string()
      .nullable()
      .optional(),
    is_primary: z
      .boolean()
      .optional(),
  })

const rawDepartmentSchema =
  z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    description: z
      .string()
      .nullable()
      .optional(),
  })

const rawStaffRecordSchema =
  z.object({
    id: z.string().uuid(),
    employee_id: z
      .string()
      .nullable(),
    full_name: z.string(),
    work_email: z
      .string()
      .email(),
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
    invited_at: z
      .string()
      .nullable(),
    activated_at: z
      .string()
      .nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    roles: z.array(
      rawRoleSchema
    ),
    branches: z.array(
      rawBranchSchema
    ),
    departments: z.array(
      rawDepartmentSchema
    ),
  })

const rawOperationalRoleSchema =
  rawRoleSchema.extend({
    code: z.enum(
      OPERATIONAL_STAFF_ROLE_CODES
    ),
  })

export const staffManagementDataSchema =
  z
    .object({
      staff: z.array(
        rawStaffRecordSchema
      ),
      roles: z.array(
        rawOperationalRoleSchema
      ),
      branches: z.array(
        rawBranchSchema
      ),
      departments: z.array(
        rawDepartmentSchema
      ),
    })
    .transform(
      (rawData) => ({
        staff:
          rawData.staff.map(
            (record) => ({
              id: record.id,
              employeeId:
                record.employee_id,
              fullName:
                record.full_name,
              workEmail:
                record.work_email,
              mobileNumber:
                record.mobile_number,
              jobTitle:
                record.job_title,
              accountStatus:
                record.account_status,
              lastLoginAt:
                record.last_login_at,
              invitedAt:
                record.invited_at,
              activatedAt:
                record.activated_at,
              createdAt:
                record.created_at,
              updatedAt:
                record.updated_at,
              roles:
                record.roles.map(
                  (role) => ({
                    code: role.code,
                    name: role.name,
                    description:
                      role.description ??
                      null,
                    dashboardPath:
                      role.dashboard_path,
                  })
                ),
              branches:
                record.branches.map(
                  (branch) => ({
                    id: branch.id,
                    code: branch.code,
                    name: branch.name,
                    shortName:
                      branch.short_name ??
                      null,
                    city:
                      branch.city ??
                      null,
                    isPrimary:
                      branch.is_primary ??
                      false,
                  })
                ),
              departments:
                record.departments.map(
                  (department) => ({
                    id: department.id,
                    code: department.code,
                    name: department.name,
                    description:
                      department.description ??
                      null,
                  })
                ),
            })
          ),
        roles:
          rawData.roles.map(
            (role) => ({
              code: role.code,
              name: role.name,
              description:
                role.description ??
                null,
              dashboardPath:
                role.dashboard_path,
            })
          ),
        branches:
          rawData.branches.map(
            (branch) => ({
              id: branch.id,
              code: branch.code,
              name: branch.name,
              shortName:
                branch.short_name ??
                null,
              city:
                branch.city ??
                null,
            })
          ),
        departments:
          rawData.departments.map(
            (department) => ({
              id: department.id,
              code: department.code,
              name: department.name,
              description:
                department.description ??
                null,
            })
          ),
      })
    )

const passwordSchema =
  z
    .string()
    .min(
      12,
      "Temporary password must contain at least 12 characters."
    )
    .max(
      128,
      "Temporary password is too long."
    )
    .regex(
      /[a-z]/,
      "Temporary password must contain a lowercase letter."
    )
    .regex(
      /[A-Z]/,
      "Temporary password must contain an uppercase letter."
    )
    .regex(
      /\d/,
      "Temporary password must contain a number."
    )
    .regex(
      /[^A-Za-z0-9]/,
      "Temporary password must contain a special character."
    )

export const createStaffAccountSchema =
  z
    .object({
      employeeId: z
        .string()
        .trim()
        .min(
          2,
          "Employee ID is required."
        )
        .max(
          50,
          "Employee ID is too long."
        )
        .regex(
          /^[A-Za-z0-9_-]+$/,
          "Employee ID may contain letters, numbers, underscores, and hyphens only."
        ),
      fullName: z
        .string()
        .trim()
        .min(
          2,
          "Full name is required."
        )
        .max(
          200,
          "Full name is too long."
        ),
      workEmail: z
        .string()
        .trim()
        .toLowerCase()
        .email(
          "Enter a valid work email address."
        ),
      mobileNumber: z
        .string()
        .trim()
        .max(
          40,
          "Mobile number is too long."
        ),
      jobTitle: z
        .string()
        .trim()
        .max(
          120,
          "Job title is too long."
        ),
      roleCode: z.enum(
        OPERATIONAL_STAFF_ROLE_CODES
      ),
      branchIds: z
        .array(z.string())
        .min(
          1,
          "Assign at least one hospital branch."
        ),
      primaryBranchId: z
        .string()
        .min(
          1,
          "Select a primary branch."
        ),
      departmentCodes: z
        .array(z.string())
        .min(
          1,
          "Assign at least one department."
        ),
      temporaryPassword:
        passwordSchema,
      confirmTemporaryPassword:
        z.string(),
      reason: z
        .string()
        .trim()
        .min(
          5,
          "Add a short provisioning reason."
        )
        .max(
          500,
          "Provisioning reason is too long."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.temporaryPassword !==
          values.confirmTemporaryPassword
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "confirmTemporaryPassword",
            ],
            message:
              "Temporary passwords do not match.",
          })
        }

        if (
          !values.branchIds.includes(
            values.primaryBranchId
          )
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "primaryBranchId",
            ],
            message:
              "Primary branch must be included in assigned branches.",
          })
        }

        if (
          new Set(values.branchIds)
            .size !==
          values.branchIds.length
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["branchIds"],
            message:
              "Duplicate branch assignments are not allowed.",
          })
        }

        if (
          new Set(
            values.departmentCodes.map(
              (code) =>
                code.toUpperCase()
            )
          ).size !==
          values.departmentCodes.length
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "departmentCodes",
            ],
            message:
              "Duplicate department assignments are not allowed.",
          })
        }

        const requiredDepartment =
          REQUIRED_DEPARTMENT_BY_ROLE[
            values.roleCode
          ]

        if (
          !values.departmentCodes.includes(
            requiredDepartment
          )
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "departmentCodes",
            ],
            message:
              `The selected role requires the ${requiredDepartment} department.`,
          })
        }
      }
    )

export const setStaffAccountStatusSchema =
  z.object({
    staffId: z
      .string()
      .uuid(),
    status: z.enum(
      MANAGEABLE_STAFF_ACCOUNT_STATUSES
    ),
    reason: z
      .string()
      .trim()
      .min(
        5,
        "A status-change reason is required."
      )
      .max(
        500,
        "Status-change reason is too long."
      ),
  })
