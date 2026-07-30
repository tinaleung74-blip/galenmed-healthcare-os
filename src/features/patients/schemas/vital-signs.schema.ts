import { z } from "zod"

import {
  BLOOD_PRESSURE_POSITIONS,
  OXYGEN_SUPPORT_TYPES,
  TEMPERATURE_SITES,
  VITAL_SIGNS_MEASUREMENT_CONTEXTS,
} from "@/features/patients/types/vital-signs.types"

function optionalNumericMeasurement(
  label: string,
  minimum: number,
  maximum: number
) {
  return z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") {
        return true
      }

      const numericValue = Number(value)

      return (
        Number.isFinite(numericValue) &&
        numericValue >= minimum &&
        numericValue <= maximum
      )
    }, `${label} must be between ${minimum} and ${maximum}.`)
}

function isValidDateTime(value: string): boolean {
  const date = new Date(value)

  return (
    value.trim().length > 0 &&
    !Number.isNaN(date.getTime())
  )
}

function isNotFutureDateTime(
  value: string
): boolean {
  if (!isValidDateTime(value)) {
    return false
  }

  const allowedClockSkewMilliseconds =
    5 * 60 * 1000

  return (
    new Date(value).getTime() <=
    Date.now() + allowedClockSkewMilliseconds
  )
}

export const vitalSignsFormSchema = z
  .object({
    measuredAt: z
      .string()
      .trim()
      .min(1, "Measurement date and time are required.")
      .refine(
        isValidDateTime,
        "Enter a valid measurement date and time."
      )
      .refine(
        isNotFutureDateTime,
        "Measurement time cannot be in the future."
      ),

    context: z.enum(
      VITAL_SIGNS_MEASUREMENT_CONTEXTS,
      {
        required_error:
          "Measurement context is required.",
      }
    ),

    systolicBloodPressure: optionalNumericMeasurement(
      "Systolic blood pressure",
      1,
      400
    ),

    diastolicBloodPressure:
      optionalNumericMeasurement(
        "Diastolic blood pressure",
        1,
        300
      ),

    bloodPressurePosition: z.enum(
      BLOOD_PRESSURE_POSITIONS
    ),

    heartRate: optionalNumericMeasurement(
      "Heart rate",
      1,
      400
    ),

    respiratoryRate: optionalNumericMeasurement(
      "Respiratory rate",
      1,
      200
    ),

    temperatureCelsius:
      optionalNumericMeasurement(
        "Temperature",
        1,
        60
      ),

    temperatureSite: z.enum(TEMPERATURE_SITES),

    oxygenSaturation:
      optionalNumericMeasurement(
        "Oxygen saturation",
        0,
        100
      ),

    oxygenSupport: z.enum(
      OXYGEN_SUPPORT_TYPES
    ),

    supplementalOxygenLitersPerMinute:
      optionalNumericMeasurement(
        "Supplemental oxygen flow",
        0.1,
        100
      ),

    heightCm: optionalNumericMeasurement(
      "Height",
      1,
      300
    ),

    weightKg: optionalNumericMeasurement(
      "Weight",
      0.1,
      1000
    ),

    painScore: optionalNumericMeasurement(
      "Pain score",
      0,
      10
    ),

    notes: z
      .string()
      .trim()
      .max(
        2000,
        "Notes must not exceed 2,000 characters."
      ),
  })
  .superRefine((values, context) => {
    const hasSystolic =
      values.systolicBloodPressure !== ""

    const hasDiastolic =
      values.diastolicBloodPressure !== ""

    if (hasSystolic !== hasDiastolic) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasSystolic
          ? ["diastolicBloodPressure"]
          : ["systolicBloodPressure"],
        message:
          "Both systolic and diastolic blood pressure are required together.",
      })
    }

    if (hasSystolic && hasDiastolic) {
      const systolic = Number(
        values.systolicBloodPressure
      )

      const diastolic = Number(
        values.diastolicBloodPressure
      )

      if (systolic <= diastolic) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["systolicBloodPressure"],
          message:
            "Systolic pressure must be greater than diastolic pressure.",
        })
      }
    }

    if (
      values.temperatureCelsius !== "" &&
      values.temperatureSite ===
        "not-recorded"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["temperatureSite"],
        message:
          "Temperature site is required when temperature is recorded.",
      })
    }

    if (
      values.oxygenSaturation !== "" &&
      values.oxygenSupport === "not-recorded"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["oxygenSupport"],
        message:
          "Record whether the patient was on room air or supplemental oxygen.",
      })
    }

    if (
      values.oxygenSupport ===
        "supplemental-oxygen" &&
      values
        .supplementalOxygenLitersPerMinute === ""
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [
          "supplementalOxygenLitersPerMinute",
        ],
        message:
          "Oxygen flow rate is required when supplemental oxygen is used.",
      })
    }

    if (
      values.oxygenSupport !==
        "supplemental-oxygen" &&
      values
        .supplementalOxygenLitersPerMinute !== ""
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [
          "supplementalOxygenLitersPerMinute",
        ],
        message:
          "Select Supplemental oxygen before entering a flow rate.",
      })
    }

    if (
      values.painScore !== "" &&
      !Number.isInteger(
        Number(values.painScore)
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["painScore"],
        message:
          "Pain score must be a whole number from 0 to 10.",
      })
    }

    const hasAtLeastOneMeasurement = [
      values.systolicBloodPressure,
      values.diastolicBloodPressure,
      values.heartRate,
      values.respiratoryRate,
      values.temperatureCelsius,
      values.oxygenSaturation,
      values.heightCm,
      values.weightKg,
      values.painScore,
    ].some((value) => value !== "")

    if (!hasAtLeastOneMeasurement) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["systolicBloodPressure"],
        message:
          "Record at least one vital-sign measurement.",
      })
    }
  })

export type VitalSignsFormValues = z.infer<
  typeof vitalSignsFormSchema
>
