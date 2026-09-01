import { z } from "zod"

import {
  PATIENT_PORTAL_ACCOUNT_STATUSES,
} from "@/features/patient-portal/types/patient-portal.types"

const strongPatientPasswordSchema =
  z
    .string()
    .min(
      12,
      "Password must contain at least 12 characters."
    )
    .max(
      128,
      "Password is too long."
    )
    .regex(
      /[a-z]/,
      "Password must contain a lowercase letter."
    )
    .regex(
      /[A-Z]/,
      "Password must contain an uppercase letter."
    )
    .regex(
      /\d/,
      "Password must contain a number."
    )
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain a special character."
    )

const rawPatientPortalAccountSchema =
  z.object({
    id: z.string().uuid(),
    auth_user_id: z.string().uuid(),
    login_email: z.string().email(),
    status: z.enum(
      PATIENT_PORTAL_ACCOUNT_STATUSES
    ),
    must_change_password:
      z.boolean(),
    invited_at: z.string(),
    activated_at:
      z.string().nullable(),
    last_login_at:
      z.string().nullable(),
    updated_at: z.string(),
  })

const rawPatientPortalPatientSchema =
  z.object({
    patient_id: z.string().uuid(),
    medical_record_number:
      z.string(),
    first_name: z.string(),
    middle_name:
      z.string().nullable(),
    last_name: z.string(),
    date_of_birth: z.string(),
    mobile_number:
      z.string().nullable(),
    email_address:
      z.string().nullable(),
    patient_status: z.string(),
    branch_id: z.string(),
    branch_name: z.string(),
    portal_account:
      rawPatientPortalAccountSchema
        .nullable(),
  })

export const patientPortalManagementDataSchema =
  z
    .object({
      patients: z.array(
        rawPatientPortalPatientSchema
      ),
    })
    .transform(
      (rawData) => ({
        patients:
          rawData.patients.map(
            (patient) => ({
              patientId:
                patient.patient_id,
              medicalRecordNumber:
                patient.medical_record_number,
              firstName:
                patient.first_name,
              middleName:
                patient.middle_name,
              lastName:
                patient.last_name,
              dateOfBirth:
                patient.date_of_birth,
              mobileNumber:
                patient.mobile_number,
              emailAddress:
                patient.email_address,
              patientStatus:
                patient.patient_status,
              branchId:
                patient.branch_id,
              branchName:
                patient.branch_name,
              portalAccount:
                patient.portal_account
                  ? {
                      id:
                        patient
                          .portal_account
                          .id,
                      authUserId:
                        patient
                          .portal_account
                          .auth_user_id,
                      loginEmail:
                        patient
                          .portal_account
                          .login_email,
                      status:
                        patient
                          .portal_account
                          .status,
                      mustChangePassword:
                        patient
                          .portal_account
                          .must_change_password,
                      invitedAt:
                        patient
                          .portal_account
                          .invited_at,
                      activatedAt:
                        patient
                          .portal_account
                          .activated_at,
                      lastLoginAt:
                        patient
                          .portal_account
                          .last_login_at,
                      updatedAt:
                        patient
                          .portal_account
                          .updated_at,
                    }
                  : null,
            })
          ),
      })
    )

export const createPatientPortalAccountSchema =
  z
    .object({
      patientId:
        z.string().uuid(),

      loginEmail:
        z
          .string()
          .trim()
          .email(
            "Enter a valid patient login email."
          ),

      temporaryPassword:
        strongPatientPasswordSchema,

      confirmTemporaryPassword:
        z.string(),

      reason:
        z
          .string()
          .trim()
          .min(
            10,
            "Enter a reason with at least 10 characters."
          )
          .max(
            500,
            "Reason must not exceed 500 characters."
          ),
    })
    .refine(
      (values) =>
        values.temporaryPassword ===
        values.confirmTemporaryPassword,
      {
        path: [
          "confirmTemporaryPassword",
        ],
        message:
          "Temporary password confirmation does not match.",
      }
    )

export const setPatientPortalAccountStatusSchema =
  z.object({
    accountId:
      z.string().uuid(),

    status:
      z.enum([
        "active",
        "locked",
        "suspended",
        "archived",
      ]),

    reason:
      z
        .string()
        .trim()
        .min(
          10,
          "Enter a reason with at least 10 characters."
        )
        .max(
          500,
          "Reason must not exceed 500 characters."
        ),
  })

export const patientLoginSchema =
  z.object({
    email:
      z
        .string()
        .trim()
        .email(
          "Enter a valid patient login email."
        ),

    password:
      z
        .string()
        .min(
          1,
          "Password is required."
        ),
  })

export const changePatientPasswordSchema =
  z
    .object({
      newPassword:
        strongPatientPasswordSchema,

      confirmNewPassword:
        z.string(),
    })
    .refine(
      (values) =>
        values.newPassword ===
        values.confirmNewPassword,
      {
        path: [
          "confirmNewPassword",
        ],
        message:
          "Password confirmation does not match.",
      }
    )

const rawPatientPortalContextSchema =
  z.object({
    account_id:
      z.string().uuid(),
    auth_user_id:
      z.string().uuid(),
    account_status:
      z.enum(
        PATIENT_PORTAL_ACCOUNT_STATUSES
      ),
    must_change_password:
      z.boolean(),
    login_email:
      z.string().email(),
    last_login_at:
      z.string().nullable(),

    patient:
      z.object({
        id:
          z.string().uuid(),
        medical_record_number:
          z.string(),
        first_name:
          z.string(),
        middle_name:
          z.string().nullable(),
        last_name:
          z.string(),
        date_of_birth:
          z.string(),
        biological_sex:
          z.string(),
        mobile_number:
          z.string().nullable(),
        email_address:
          z.string().nullable(),
        branch_id:
          z.string(),
        status:
          z.string(),
      }),

    branch:
      z
        .object({
          id: z.string(),
          code: z.string(),
          name: z.string(),
        })
        .nullable(),
  })

export const patientPortalContextSchema =
  rawPatientPortalContextSchema
    .transform(
      (rawContext) => ({
        accountId:
          rawContext.account_id,
        authUserId:
          rawContext.auth_user_id,
        accountStatus:
          rawContext.account_status,
        mustChangePassword:
          rawContext
            .must_change_password,
        loginEmail:
          rawContext.login_email,
        lastLoginAt:
          rawContext.last_login_at,

        patient: {
          id:
            rawContext.patient.id,
          medicalRecordNumber:
            rawContext.patient
              .medical_record_number,
          firstName:
            rawContext.patient
              .first_name,
          middleName:
            rawContext.patient
              .middle_name,
          lastName:
            rawContext.patient
              .last_name,
          dateOfBirth:
            rawContext.patient
              .date_of_birth,
          biologicalSex:
            rawContext.patient
              .biological_sex,
          mobileNumber:
            rawContext.patient
              .mobile_number,
          emailAddress:
            rawContext.patient
              .email_address,
          branchId:
            rawContext.patient
              .branch_id,
          status:
            rawContext.patient.status,
        },

        branch:
          rawContext.branch
            ? {
                id:
                  rawContext.branch.id,
                code:
                  rawContext.branch.code,
                name:
                  rawContext.branch.name,
              }
            : null,
      })
    )
