import { z } from "zod"

const professionalRegistrationPattern =
  /^[A-Z0-9][A-Z0-9-]{3,49}$/i

export const consultationFinalizeFormSchema =
  z.object({
    signerName: z
      .string()
      .trim()
      .min(
        2,
        "Type the signing clinician's full name."
      )
      .max(
        200,
        "Signer name must not exceed 200 characters."
      ),

    signerRole: z
      .string()
      .trim()
      .min(
        2,
        "Signer role is required."
      )
      .max(
        100,
        "Signer role must not exceed 100 characters."
      ),

    professionalRegistrationNumber: z
      .string()
      .trim()
      .min(
        4,
        "Professional registration number is required."
      )
      .max(
        50,
        "Professional registration number must not exceed 50 characters."
      )
      .regex(
        professionalRegistrationPattern,
        "Use letters, numbers, and hyphens only."
      ),

    attestationAccepted: z
      .boolean()
      .refine(
        (accepted) => accepted,
        "Clinical attestation must be accepted before finalization."
      ),
  })

export type ConsultationFinalizeFormValues =
  z.infer<
    typeof consultationFinalizeFormSchema
  >
