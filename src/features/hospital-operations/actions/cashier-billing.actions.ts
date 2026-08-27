"use server"

import {
  revalidatePath,
} from "next/cache"
import { z } from "zod"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  cashierReceiptPrintSchema,
  cashierRecordPaymentSchema,
  cashierSetClearanceSchema,
  type CashierReceiptPrintValues,
  type CashierRecordPaymentValues,
  type CashierSetClearanceValues,
} from "@/features/hospital-operations/schemas/cashier-billing.schema"
import {
  CASHIER_PAYMENT_CLEARANCE_STATUSES,
  CASHIER_RECEIPT_PRINT_TYPES,
  type CashierActionResult,
  type CashierClearanceMutationResponse,
  type CashierPaymentMutationResponse,
  type CashierReceiptPrintResponse,
} from "@/features/hospital-operations/types/cashier-billing.types"
import {
  parsePhpToCentavos,
} from "@/features/hospital-operations/utils/cashier-billing.utils"
import {
  createClient,
} from "@/lib/supabase/server"

const paymentResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    payment_id:
      z.string().uuid(),
    payment_number:
      z.string().min(1),
    official_receipt_number:
      z.string().min(1),
    amount_centavos:
      z.number(),
    status:
      z.string().min(1),
  })

const clearanceResponseSchema =
  z.object({
    payment_clearance_id:
      z.string().uuid(),
    service_request_id:
      z.string().uuid(),
    clearance_status:
      z.enum(
        CASHIER_PAYMENT_CLEARANCE_STATUSES
      ),
    required_amount_centavos:
      z.number(),
    cleared_amount_centavos:
      z.number(),
    cleared_at:
      z.string().nullable(),
  })

const receiptPrintResponseSchema =
  z.object({
    idempotent_replay:
      z.boolean(),
    print_log_id:
      z.number().int().positive(),
    payment_transaction_id:
      z.string().uuid(),
    official_receipt_number:
      z.string().min(1),
    print_type:
      z.enum(
        CASHIER_RECEIPT_PRINT_TYPES
      ),
    copy_number:
      z.number().int().positive(),
    printed_at:
      z.string().min(1),
  })

async function requireCashierContext() {
  return requireStaffRole([
    "CASHIER",
    "SYSTEM_ADMIN",
  ])
}

function hasPermission(
  permissions: readonly string[],
  permission: string
): boolean {
  return permissions.includes(
    permission
  )
}

function revalidateCashierPages() {
  revalidatePath(
    "/cashier/billing"
  )

  revalidatePath(
    "/cashier/dashboard"
  )

  revalidatePath(
    "/reception/dashboard"
  )

  revalidatePath(
    "/laboratory/results"
  )
}

export async function recordCashierPaymentAction(
  values: CashierRecordPaymentValues
): Promise<
  CashierActionResult<
    CashierPaymentMutationResponse
  >
> {
  const parsedValues =
    cashierRecordPaymentSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The payment details are invalid.",
    }
  }

  const context =
    await requireCashierContext()

  if (
    !hasPermission(
      context.permissions,
      "cashier.payment.record"
    ) &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot record payments.",
    }
  }

  let amountCentavos: number

  try {
    amountCentavos =
      parsePhpToCentavos(
        parsedValues.data
          .amountPhp
      )
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The payment amount is invalid.",
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "cashier_record_payment",
    {
      p_idempotency_key:
        parsedValues.data
          .idempotencyKey,
      p_billing_account_id:
        parsedValues.data
          .billingAccountId,
      p_amount_centavos:
        amountCentavos,
      p_payment_method:
        parsedValues.data
          .paymentMethod,
      p_external_reference:
        parsedValues.data
          .externalReference ||
        null,
      p_metadata: {
        source:
          "cashier_billing_workspace",
      },
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The payment could not be recorded.",
    }
  }

  const parsedResponse =
    paymentResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The payment was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidateCashierPages()

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The existing payment record was restored safely."
        : "Payment recorded and receipt number generated.",
    data: {
      paymentId:
        response.payment_id,
      paymentNumber:
        response.payment_number,
      officialReceiptNumber:
        response.official_receipt_number,
      amountCentavos:
        response.amount_centavos,
      status:
        response.status,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}

export async function setCashierPaymentClearanceAction(
  values: CashierSetClearanceValues
): Promise<
  CashierActionResult<
    CashierClearanceMutationResponse
  >
> {
  const parsedValues =
    cashierSetClearanceSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The payment-clearance details are invalid.",
    }
  }

  const context =
    await requireCashierContext()

  if (
    !hasPermission(
      context.permissions,
      "cashier.clearance.manage"
    ) &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot manage payment clearance.",
    }
  }

  if (
    parsedValues.data
      .clearanceStatus ===
      "waived" &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    return {
      success: false,
      message:
        "Only a System Administrator can waive payment clearance.",
    }
  }

  let clearedAmountCentavos = 0

  if (
    parsedValues.data
      .clearanceStatus ===
      "partially_cleared"
  ) {
    try {
      clearedAmountCentavos =
        parsePhpToCentavos(
          parsedValues.data
            .clearedAmountPhp
        )
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The partial-clearance amount is invalid.",
      }
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "cashier_set_payment_clearance",
    {
      p_service_request_id:
        parsedValues.data
          .serviceRequestId,
      p_clearance_status:
        parsedValues.data
          .clearanceStatus,
      p_cleared_amount_centavos:
        clearedAmountCentavos,
      p_clearance_reason:
        parsedValues.data
          .clearanceReason,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The payment clearance could not be updated.",
    }
  }

  const parsedResponse =
    clearanceResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The clearance was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidateCashierPages()

  return {
    success: true,
    message:
      "Payment clearance updated successfully.",
    data: {
      paymentClearanceId:
        response.payment_clearance_id,
      serviceRequestId:
        response.service_request_id,
      clearanceStatus:
        response.clearance_status,
      requiredAmountCentavos:
        response.required_amount_centavos,
      clearedAmountCentavos:
        response.cleared_amount_centavos,
      clearedAt:
        response.cleared_at,
    },
  }
}

export async function recordCashierReceiptPrintAction(
  values: CashierReceiptPrintValues
): Promise<
  CashierActionResult<
    CashierReceiptPrintResponse
  >
> {
  const parsedValues =
    cashierReceiptPrintSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The receipt print request is invalid.",
    }
  }

  const context =
    await requireCashierContext()

  const requiredPermission =
    parsedValues.data.printType ===
    "original"
      ? "cashier.receipt.issue"
      : "cashier.receipt.reprint"

  if (
    !hasPermission(
      context.permissions,
      requiredPermission
    ) &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    return {
      success: false,
      message:
        "The current staff account cannot perform this receipt print action.",
    }
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "cashier_record_receipt_print",
    {
      p_idempotency_key:
        parsedValues.data
          .idempotencyKey,
      p_payment_transaction_id:
        parsedValues.data
          .paymentTransactionId,
      p_print_type:
        parsedValues.data
          .printType,
      p_print_reason:
        parsedValues.data
          .printReason ||
        null,
      p_metadata: {
        source:
          "cashier_receipt_page",
      },
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The receipt print could not be recorded.",
    }
  }

  const parsedResponse =
    receiptPrintResponseSchema.safeParse(
      data
    )

  if (!parsedResponse.success) {
    return {
      success: false,
      message:
        "The receipt print was processed, but the server response was invalid. Refresh before trying again.",
    }
  }

  const response =
    parsedResponse.data

  revalidatePath(
    `/cashier/receipts/${response.payment_transaction_id}/print`
  )

  revalidateCashierPages()

  return {
    success: true,
    message:
      response.idempotent_replay
        ? "The existing receipt print record was restored safely."
        : response.print_type ===
          "original"
          ? "Original receipt print recorded."
          : "Receipt reprint recorded.",
    data: {
      printLogId:
        response.print_log_id,
      paymentTransactionId:
        response.payment_transaction_id,
      officialReceiptNumber:
        response.official_receipt_number,
      printType:
        response.print_type,
      copyNumber:
        response.copy_number,
      printedAt:
        response.printed_at,
      idempotentReplay:
        response.idempotent_replay,
    },
  }
}
