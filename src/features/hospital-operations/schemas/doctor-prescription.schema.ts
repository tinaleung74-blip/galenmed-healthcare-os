import { z } from "zod"

const optionalShortText = z
  .string()
  .trim()
  .max(500)

export const doctorPrescriptionItemFormSchema = z.object({
  id: z.string(),
  genericName: z.string().trim().min(2, "Generic medicine name is required.").max(200),
  brandName: optionalShortText,
  dosageForm: z.string().trim().min(1, "Dosage form is required.").max(100),
  strength: z.string().trim().min(1, "Strength is required.").max(100),
  dose: z.string().trim().min(1, "Dose is required.").max(150),
  route: z.string().trim().min(1, "Route is required.").max(100),
  frequency: z.string().trim().min(1, "Frequency is required.").max(150),
  duration: z.string().trim().min(1, "Duration is required.").max(150),
  quantity: z.string().trim().refine(
    (value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed > 0
    },
    "Quantity must be greater than zero."
  ),
  quantityUnit: z.string().trim().min(1, "Quantity unit is required.").max(100),
  instructions: z.string().trim().max(1000),
})

export const doctorPrescriptionDraftSchema = z.object({
  consultationId: z.string().uuid(),
  prescriptionId: z.string().uuid().or(z.literal("")),
  generalInstructions: z.string().trim().max(2000),
  items: z.array(doctorPrescriptionItemFormSchema).min(1, "Add at least one medicine item."),
})

export const doctorPrescriptionSubmitSchema = z.object({
  prescriptionId: z.string().uuid(),
})

export const receptionPrescriptionReturnSchema = z.object({
  prescriptionId: z.string().uuid(),
  reason: z.string().trim().min(3, "Correction reason is required.").max(1000),
})

export const receptionPrescriptionApproveSchema = z.object({
  prescriptionId: z.string().uuid(),
  reviewNotes: z.string().trim().max(1000),
})

export type DoctorPrescriptionDraftValues = z.infer<typeof doctorPrescriptionDraftSchema>
export type DoctorPrescriptionSubmitValues = z.infer<typeof doctorPrescriptionSubmitSchema>
export type ReceptionPrescriptionReturnValues = z.infer<typeof receptionPrescriptionReturnSchema>
export type ReceptionPrescriptionApproveValues = z.infer<typeof receptionPrescriptionApproveSchema>
