import { z } from "zod"

import {
  SETTINGS_NOTIFICATION_CHANNELS,
  SETTINGS_NOTIFICATION_EVENTS,
  SETTINGS_PERMISSION_KEYS,
} from "@/features/settings/types/settings.types"

const optionalTextSchema =
  z
    .string()
    .trim()
    .max(
      500,
      "Value must not exceed 500 characters."
    )

const optionalEmailSchema =
  z.union([
    z.literal(""),

    z
      .string()
      .trim()
      .email(
        "Enter a valid email address."
      )
      .max(
        254,
        "Email address must not exceed 254 characters."
      ),
  ])

const optionalWebsiteSchema =
  z.union([
    z.literal(""),

    z
      .string()
      .trim()
      .url(
        "Enter a valid website URL."
      )
      .max(
        500,
        "Website URL must not exceed 500 characters."
      ),
  ])

export const organizationSettingsFormSchema =
  z.object({
    legalName: z
      .string()
      .trim()
      .min(
        2,
        "Organization legal name is required."
      )
      .max(
        250,
        "Legal name must not exceed 250 characters."
      ),

    displayName: z
      .string()
      .trim()
      .min(
        2,
        "Organization display name is required."
      )
      .max(
        150,
        "Display name must not exceed 150 characters."
      ),

    registrationNumber:
      optionalTextSchema,

    taxIdentificationNumber:
      optionalTextSchema,

    phoneNumber:
      optionalTextSchema,

    emailAddress:
      optionalEmailSchema,

    website:
      optionalWebsiteSchema,

    address: z
      .string()
      .trim()
      .min(
        5,
        "Organization address is required."
      )
      .max(
        1000,
        "Address must not exceed 1,000 characters."
      ),

    timezone: z
      .string()
      .trim()
      .min(
        1,
        "Timezone is required."
      )
      .max(
        100,
        "Timezone must not exceed 100 characters."
      ),

    currency:
      z.literal("PHP"),

    locale:
      z.literal("en-PH"),

    updatedBy: z
      .string()
      .trim()
      .min(
        2,
        "Responsible staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters."
      ),
  })

export type OrganizationSettingsFormValues =
  z.infer<
    typeof organizationSettingsFormSchema
  >

export const branchSettingsFormSchema =
  z.object({
    branchId: z
      .string()
      .trim()
      .min(
        1,
        "Branch identifier is required."
      ),

    displayName: z
      .string()
      .trim()
      .min(
        2,
        "Branch display name is required."
      )
      .max(
        200,
        "Branch name must not exceed 200 characters."
      ),

    code: z
      .string()
      .trim()
      .min(
        2,
        "Branch code is required."
      )
      .max(
        30,
        "Branch code must not exceed 30 characters."
      )
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Branch code may contain only letters, numbers, underscores, and hyphens."
      ),

    address: z
      .string()
      .trim()
      .min(
        5,
        "Branch address is required."
      )
      .max(
        1000,
        "Branch address must not exceed 1,000 characters."
      ),

    phoneNumber:
      optionalTextSchema,

    emailAddress:
      optionalEmailSchema,

    timezone: z
      .string()
      .trim()
      .min(
        1,
        "Branch timezone is required."
      ),

    active:
      z.boolean(),

    updatedBy: z
      .string()
      .trim()
      .min(
        2,
        "Responsible staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters."
      ),
  })

export type BranchSettingsFormValues =
  z.infer<
    typeof branchSettingsFormSchema
  >

export const departmentSettingsFormSchema =
  z.object({
    id: z
      .string()
      .trim(),

    code: z
      .string()
      .trim()
      .min(
        2,
        "Department code is required."
      )
      .max(
        30,
        "Department code must not exceed 30 characters."
      )
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Department code may contain only letters, numbers, underscores, and hyphens."
      ),

    name: z
      .string()
      .trim()
      .min(
        2,
        "Department name is required."
      )
      .max(
        200,
        "Department name must not exceed 200 characters."
      ),

    description: z
      .string()
      .trim()
      .max(
        1000,
        "Department description must not exceed 1,000 characters."
      ),

    branchIds: z
      .array(
        z
          .string()
          .trim()
          .min(
            1,
            "Branch identifier is required."
          )
      )
      .min(
        1,
        "Select at least one branch."
      )
      .refine(
        (branchIds) =>
          new Set(
            branchIds
          ).size ===
          branchIds.length,
        "Duplicate branch assignments are not allowed."
      ),

    active:
      z.boolean(),

    updatedBy: z
      .string()
      .trim()
      .min(
        2,
        "Responsible staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters."
      ),
  })

export type DepartmentSettingsFormValues =
  z.infer<
    typeof departmentSettingsFormSchema
  >

export const roleSettingsFormSchema =
  z.object({
    id: z
      .string()
      .trim(),

    code: z
      .string()
      .trim()
      .min(
        2,
        "Role code is required."
      )
      .max(
        50,
        "Role code must not exceed 50 characters."
      )
      .regex(
        /^[A-Za-z0-9_]+$/,
        "Role code may contain only letters, numbers, and underscores."
      ),

    name: z
      .string()
      .trim()
      .min(
        2,
        "Role name is required."
      )
      .max(
        200,
        "Role name must not exceed 200 characters."
      ),

    description: z
      .string()
      .trim()
      .max(
        1000,
        "Role description must not exceed 1,000 characters."
      ),

    permissions: z
      .array(
        z.enum(
          SETTINGS_PERMISSION_KEYS
        )
      )
      .min(
        1,
        "Select at least one permission."
      )
      .refine(
        (permissions) =>
          new Set(
            permissions
          ).size ===
          permissions.length,
        "Duplicate permissions are not allowed."
      ),

    systemRole:
      z.boolean(),

    active:
      z.boolean(),

    updatedBy: z
      .string()
      .trim()
      .min(
        2,
        "Responsible staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters."
      ),
  })

export type RoleSettingsFormValues =
  z.infer<
    typeof roleSettingsFormSchema
  >

export const operationalSettingsFormSchema =
  z.object({
    appointments: z.object({
      defaultDurationMinutes:
        z.coerce
          .number()
          .int()
          .min(5)
          .max(480),

      allowSameDayBooking:
        z.boolean(),

      requireConfirmation:
        z.boolean(),

      checkInGraceMinutes:
        z.coerce
          .number()
          .int()
          .min(0)
          .max(240),

      noShowAfterMinutes:
        z.coerce
          .number()
          .int()
          .min(0)
          .max(480),
    }),

    clinical: z.object({
      requireAllergyReview:
        z.boolean(),

      requireVitalSignsBeforeConsultation:
        z.boolean(),

      allowConsultationWithoutAppointment:
        z.boolean(),

      defaultFollowUpDays:
        z.coerce
          .number()
          .int()
          .min(0)
          .max(365),
    }),

    laboratory: z.object({
      requireSpecimenCollection:
        z.boolean(),

      requireResultVerification:
        z.boolean(),

      requireCriticalResultAcknowledgement:
        z.boolean(),

      criticalResultEscalationMinutes:
        z.coerce
          .number()
          .int()
          .min(1)
          .max(1440),
    }),

    radiology: z.object({
      requirePreparationChecklist:
        z.boolean(),

      requireTechnicalCompletion:
        z.boolean(),

      requireReportVerification:
        z.boolean(),

      requireCriticalFindingCommunication:
        z.boolean(),
    }),

    pharmacy: z.object({
      requireAllergyReview:
        z.boolean(),

      requireInteractionReview:
        z.boolean(),

      allowPartialDispensing:
        z.boolean(),

      requirePharmacistVerification:
        z.boolean(),

      requireCounselingBeforeRelease:
        z.boolean(),
    }),

    billing: z.object({
      currency:
        z.literal("PHP"),

      allowOverpayment:
        z.boolean(),

      requireCoverageReference:
        z.boolean(),

      requireAdjustmentReason:
        z.boolean(),

      requireReversalReason:
        z.boolean(),

      maxUnapprovedDiscountCentavos:
        z.coerce
          .number()
          .int()
          .min(0)
          .max(
            100000000
          ),
    }),

    updatedBy: z
      .string()
      .trim()
      .min(
        2,
        "Responsible staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters."
      ),
  })

export type OperationalSettingsFormValues =
  z.infer<
    typeof operationalSettingsFormSchema
  >

export const notificationSettingsFormSchema =
  z.object({
    channels: z.object({
      "in-app":
        z.boolean(),

      email:
        z.boolean(),

      sms:
        z.boolean(),
    }),

    events: z.object({
      "appointment-reminder":
        z.boolean(),

      "appointment-cancelled":
        z.boolean(),

      "critical-laboratory-result":
        z.boolean(),

      "critical-radiology-finding":
        z.boolean(),

      "pharmacy-prescription-ready":
        z.boolean(),

      "billing-payment-posted":
        z.boolean(),

      "billing-refund-posted":
        z.boolean(),

      "security-alert":
        z.boolean(),
    }),

    updatedBy: z
      .string()
      .trim()
      .min(
        2,
        "Responsible staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters.",
      ),
  })
  .superRefine(
    (values, context) => {
      const selectedChannels =
        SETTINGS_NOTIFICATION_CHANNELS.filter(
          (channel) =>
            values.channels[
              channel
            ]
        )

      const selectedEvents =
        SETTINGS_NOTIFICATION_EVENTS.filter(
          (eventName) =>
            values.events[
              eventName
            ]
        )

      if (
        selectedEvents.length >
          0 &&
        selectedChannels.length ===
          0
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: ["channels"],

          message:
            "Enable at least one notification channel when notification events are active.",
        })
      }
    }
  )

export type NotificationSettingsFormValues =
  z.infer<
    typeof notificationSettingsFormSchema
  >

export const securitySettingsFormSchema =
  z
    .object({
      sessionTimeoutMinutes:
        z.coerce
          .number()
          .int()
          .min(5)
          .max(1440),

      idleWarningMinutes:
        z.coerce
          .number()
          .int()
          .min(1)
          .max(1439),

      maxFailedSignInAttempts:
        z.coerce
          .number()
          .int()
          .min(1)
          .max(20),

      requireMfaForPrivilegedRoles:
        z.boolean(),

      passwordMinimumLength:
        z.coerce
          .number()
          .int()
          .min(8)
          .max(128),

      passwordRequireNumber:
        z.boolean(),

      passwordRequireSpecialCharacter:
        z.boolean(),

      updatedBy: z
        .string()
        .trim()
        .min(
          2,
          "Responsible staff member is required."
        )
        .max(
          200,
          "Staff name must not exceed 200 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.idleWarningMinutes >=
          values.sessionTimeoutMinutes
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "idleWarningMinutes",
            ],

            message:
              "Idle warning must occur before the session timeout.",
          })
        }
      }
    )

export type SecuritySettingsFormValues =
  z.infer<
    typeof securitySettingsFormSchema
  >
