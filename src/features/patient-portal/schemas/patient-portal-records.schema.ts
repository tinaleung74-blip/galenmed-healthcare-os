import { z } from "zod"

import {
  PATIENT_PORTAL_DOCUMENT_TYPES,
} from "@/features/patient-portal/types/patient-portal-records.types"

const nullableStringSchema =
  z.string().nullable()

const rawPrescriptionItemSchema =
  z.object({
    id:
      z
        .string()
        .uuid()
        .nullable()
        .optional(),

    sequence:
      z.coerce.number(),

    generic_name:
      z.string(),

    brand_name:
      nullableStringSchema
        .optional(),

    dosage_form:
      z.string(),

    strength:
      z.string(),

    dose:
      z.string(),

    route:
      z.string(),

    frequency:
      z.string(),

    duration:
      z.string(),

    quantity:
      z.coerce.number(),

    quantity_unit:
      z.string(),

    instructions:
      nullableStringSchema
        .optional(),
  })

const rawPrescriptionContentSchema =
  z.object({
    kind:
      z.literal(
        "prescription"
      ),

    prescription_number:
      nullableStringSchema,

    diagnosis_code:
      nullableStringSchema,

    diagnosis_text:
      nullableStringSchema,

    general_instructions:
      nullableStringSchema,

    doctor:
      z
        .object({
          full_name:
            nullableStringSchema
              .optional(),

          employee_id:
            nullableStringSchema
              .optional(),

          job_title:
            nullableStringSchema
              .optional(),
        })
        .default({}),

    items:
      z
        .array(
          rawPrescriptionItemSchema
        )
        .default([]),
  })

const rawLaboratoryResultItemSchema =
  z
    .object({
      test_name:
        z.string(),

      result_value:
        z.string(),

      unit:
        nullableStringSchema
          .optional(),

      reference_range:
        nullableStringSchema
          .optional(),

      flag:
        z
          .string()
          .optional(),
    })
    .passthrough()

const rawLaboratoryContentSchema =
  z.object({
    kind:
      z.literal(
        "laboratory_result"
      ),

    specimen_type:
      nullableStringSchema,

    collection_reference:
      nullableStringSchema,

    result_items:
      z
        .array(
          rawLaboratoryResultItemSchema
        )
        .default([]),

    interpretation:
      nullableStringSchema,
  })

const rawGenericContentSchema =
  z.object({
    kind:
      z.literal(
        "generic"
      ),

    summary:
      nullableStringSchema,
  })

const rawDocumentContentSchema =
  z.discriminatedUnion(
    "kind",
    [
      rawPrescriptionContentSchema,
      rawLaboratoryContentSchema,
      rawGenericContentSchema,
    ]
  )

const rawReleasedDocumentSchema =
  z.object({
    id:
      z.string().uuid(),

    document_number:
      z.string(),

    document_type:
      z.enum(
        PATIENT_PORTAL_DOCUMENT_TYPES
      ),

    title:
      z.string(),

    version_number:
      z.coerce.number(),

    status:
      z.string(),

    payment_required:
      z.boolean(),

    payment_status:
      z.string(),

    release_status:
      z.string(),

    release_number:
      z.string(),

    release_method:
      z.string(),

    released_at:
      z.string(),

    finalized_at:
      nullableStringSchema,

    finalized_by_name:
      nullableStringSchema,

    visit_number:
      z.string(),

    service_request_number:
      nullableStringSchema,

    branch_name:
      z.string(),

    content:
      rawDocumentContentSchema,
  })

function mapDocument(
  document:
    z.infer<
      typeof rawReleasedDocumentSchema
    >
) {
  const rawContent =
    document.content

  const content =
    rawContent.kind ===
      "prescription"
      ? {
          kind:
            rawContent.kind,

          prescriptionNumber:
            rawContent
              .prescription_number,

          diagnosisCode:
            rawContent
              .diagnosis_code,

          diagnosisText:
            rawContent
              .diagnosis_text,

          generalInstructions:
            rawContent
              .general_instructions,

          doctor: {
            fullName:
              rawContent.doctor
                .full_name ??
              null,

            employeeId:
              rawContent.doctor
                .employee_id ??
              null,

            jobTitle:
              rawContent.doctor
                .job_title ??
              null,
          },

          items:
            rawContent.items.map(
              (item) => ({
                id:
                  item.id ??
                  null,

                sequence:
                  item.sequence,

                genericName:
                  item.generic_name,

                brandName:
                  item.brand_name ??
                  null,

                dosageForm:
                  item.dosage_form,

                strength:
                  item.strength,

                dose:
                  item.dose,

                route:
                  item.route,

                frequency:
                  item.frequency,

                duration:
                  item.duration,

                quantity:
                  item.quantity,

                quantityUnit:
                  item.quantity_unit,

                instructions:
                  item.instructions ??
                  null,
              })
            ),
        }
      : rawContent.kind ===
          "laboratory_result"
        ? {
            kind:
              rawContent.kind,

            specimenType:
              rawContent
                .specimen_type,

            collectionReference:
              rawContent
                .collection_reference,

            resultItems:
              rawContent
                .result_items
                .map(
                  (item) => ({
                    testName:
                      item.test_name,

                    resultValue:
                      item.result_value,

                    unit:
                      item.unit ??
                      null,

                    referenceRange:
                      item.reference_range ??
                      null,

                    flag:
                      item.flag ??
                      "not_applicable",
                  })
                ),

            interpretation:
              rawContent
                .interpretation,
          }
        : {
            kind:
              rawContent.kind,

            summary:
              rawContent.summary,
          }

  return {
    id:
      document.id,

    documentNumber:
      document.document_number,

    documentType:
      document.document_type,

    title:
      document.title,

    versionNumber:
      document.version_number,

    status:
      document.status,

    paymentRequired:
      document.payment_required,

    paymentStatus:
      document.payment_status,

    releaseStatus:
      document.release_status,

    releaseNumber:
      document.release_number,

    releaseMethod:
      document.release_method,

    releasedAt:
      document.released_at,

    finalizedAt:
      document.finalized_at,

    finalizedByName:
      document.finalized_by_name,

    visitNumber:
      document.visit_number,

    serviceRequestNumber:
      document.service_request_number,

    branchName:
      document.branch_name,

    content,
  }
}

export const patientPortalReleasedDocumentSchema =
  rawReleasedDocumentSchema
    .transform(
      mapDocument
    )

export const patientPortalReleasedDocumentsDataSchema =
  z
    .object({
      documents:
        z
          .array(
            rawReleasedDocumentSchema
          )
          .default([]),
    })
    .transform(
      (data) => ({
        documents:
          data.documents.map(
            mapDocument
          ),
      })
    )

const rawBillingChargeSchema =
  z.object({
    id:
      z.string().uuid(),

    description:
      z.string(),

    quantity:
      z.coerce.number(),

    unit_amount_centavos:
      z.coerce.number(),

    total_amount_centavos:
      z.coerce.number(),

    status:
      z.string(),

    posted_at:
      z.string(),

    service_request_number:
      nullableStringSchema,

    service_name:
      nullableStringSchema,
  })

const rawPaymentSchema =
  z.object({
    id:
      z.string().uuid(),

    payment_number:
      z.string(),

    amount_centavos:
      z.coerce.number(),

    payment_method:
      z.string(),

    status:
      z.string(),

    external_reference:
      nullableStringSchema,

    official_receipt_number:
      nullableStringSchema,

    posted_at:
      z.string(),
  })

const rawClearanceSchema =
  z.object({
    id:
      z.string().uuid(),

    service_request_number:
      z.string(),

    service_name:
      nullableStringSchema,

    clearance_status:
      z.string(),

    required_amount_centavos:
      z.coerce.number(),

    cleared_amount_centavos:
      z.coerce.number(),

    cleared_at:
      nullableStringSchema,
  })

const rawBillingAccountSchema =
  z.object({
    id:
      z.string().uuid(),

    billing_number:
      z.string(),

    status:
      z.string(),

    currency_code:
      z.string(),

    gross_amount_centavos:
      z.coerce.number(),

    discount_amount_centavos:
      z.coerce.number(),

    coverage_amount_centavos:
      z.coerce.number(),

    paid_amount_centavos:
      z.coerce.number(),

    refunded_amount_centavos:
      z.coerce.number(),

    balance_amount_centavos:
      z.coerce.number(),

    created_at:
      z.string(),

    updated_at:
      z.string(),

    visit:
      z.object({
        id:
          z.string().uuid(),

        visit_number:
          z.string(),

        status:
          z.string(),

        registered_at:
          z.string(),
      }),

    branch:
      z.object({
        id:
          z.string(),

        code:
          z.string(),

        name:
          z.string(),
      }),

    charges:
      z
        .array(
          rawBillingChargeSchema
        )
        .default([]),

    payments:
      z
        .array(
          rawPaymentSchema
        )
        .default([]),

    clearances:
      z
        .array(
          rawClearanceSchema
        )
        .default([]),
  })

export const patientPortalBillingDataSchema =
  z
    .object({
      total_outstanding_centavos:
        z.coerce.number(),

      total_paid_centavos:
        z.coerce.number(),

      accounts:
        z
          .array(
            rawBillingAccountSchema
          )
          .default([]),
    })
    .transform(
      (data) => ({
        totalOutstandingCentavos:
          data.total_outstanding_centavos,

        totalPaidCentavos:
          data.total_paid_centavos,

        accounts:
          data.accounts.map(
            (account) => ({
              id:
                account.id,

              billingNumber:
                account.billing_number,

              status:
                account.status,

              currencyCode:
                account.currency_code,

              grossAmountCentavos:
                account.gross_amount_centavos,

              discountAmountCentavos:
                account.discount_amount_centavos,

              coverageAmountCentavos:
                account.coverage_amount_centavos,

              paidAmountCentavos:
                account.paid_amount_centavos,

              refundedAmountCentavos:
                account.refunded_amount_centavos,

              balanceAmountCentavos:
                account.balance_amount_centavos,

              createdAt:
                account.created_at,

              updatedAt:
                account.updated_at,

              visit: {
                id:
                  account.visit.id,

                visitNumber:
                  account.visit
                    .visit_number,

                status:
                  account.visit.status,

                registeredAt:
                  account.visit
                    .registered_at,
              },

              branch: {
                id:
                  account.branch.id,

                code:
                  account.branch.code,

                name:
                  account.branch.name,
              },

              charges:
                account.charges.map(
                  (charge) => ({
                    id:
                      charge.id,

                    description:
                      charge.description,

                    quantity:
                      charge.quantity,

                    unitAmountCentavos:
                      charge
                        .unit_amount_centavos,

                    totalAmountCentavos:
                      charge
                        .total_amount_centavos,

                    status:
                      charge.status,

                    postedAt:
                      charge.posted_at,

                    serviceRequestNumber:
                      charge
                        .service_request_number,

                    serviceName:
                      charge.service_name,
                  })
                ),

              payments:
                account.payments.map(
                  (payment) => ({
                    id:
                      payment.id,

                    paymentNumber:
                      payment
                        .payment_number,

                    amountCentavos:
                      payment
                        .amount_centavos,

                    paymentMethod:
                      payment
                        .payment_method,

                    status:
                      payment.status,

                    externalReference:
                      payment
                        .external_reference,

                    officialReceiptNumber:
                      payment
                        .official_receipt_number,

                    postedAt:
                      payment.posted_at,
                  })
                ),

              clearances:
                account.clearances.map(
                  (clearance) => ({
                    id:
                      clearance.id,

                    serviceRequestNumber:
                      clearance
                        .service_request_number,

                    serviceName:
                      clearance.service_name,

                    clearanceStatus:
                      clearance
                        .clearance_status,

                    requiredAmountCentavos:
                      clearance
                        .required_amount_centavos,

                    clearedAmountCentavos:
                      clearance
                        .cleared_amount_centavos,

                    clearedAt:
                      clearance.cleared_at,
                  })
                ),
            })
          ),
      })
    )
