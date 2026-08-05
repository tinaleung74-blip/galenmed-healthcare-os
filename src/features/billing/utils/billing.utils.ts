import type {
  BillingAdjustment,
  BillingCharge,
  BillingCoverageAllocation,
  BillingPayment,
  BillingRefund,
  BillingStatement,
} from "@/features/billing/types/billing.types"

export interface BillingStatementTotals {
  grossAmountCentavos: number

  adjustmentAmountCentavos:
    number

  netChargeAmountCentavos:
    number

  coverageAmountCentavos:
    number

  patientResponsibilityCentavos:
    number

  amountPaidCentavos: number
  refundAmountCentavos: number

  netPaymentCentavos: number

  balanceDueCentavos: number
  creditBalanceCentavos: number
}

const billingCurrencyFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",

      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )

function assertSafeCentavos(
  value: number,
  label: string
): number {
  if (
    !Number.isSafeInteger(value)
  ) {
    throw new Error(
      `${label} must be a safe integer amount in centavos.`
    )
  }

  return value
}

function sumCentavos(
  values: readonly number[]
): number {
  const total =
    values.reduce(
      (
        runningTotal,
        value
      ) =>
        runningTotal +
        assertSafeCentavos(
          value,
          "Billing amount"
        ),
      0
    )

  return assertSafeCentavos(
    total,
    "Billing total"
  )
}

function generateSequenceNumber(
  existingValues:
    readonly string[],

  prefix: string
): string {
  const highestSequence =
    existingValues.reduce(
      (
        highest,
        value
      ) => {
        if (
          !value.startsWith(
            prefix
          )
        ) {
          return highest
        }

        const sequence =
          Number(
            value.slice(
              prefix.length
            )
          )

        return (
          Number.isInteger(
            sequence
          ) &&
          sequence > highest
            ? sequence
            : highest
        )
      },
      0
    )

  return `${prefix}${String(
    highestSequence + 1
  ).padStart(6, "0")}`
}

export function createTemporaryBillingId(
  prefix: string
): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in
      globalThis.crypto
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function parsePhilippinePesoToCentavos(
  value: string
): number {
  const normalizedValue =
    value
      .trim()
      .replace(/[₱,\s]/g, "")

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalizedValue
    )
  ) {
    throw new Error(
      "Enter a valid PHP amount with up to two decimal places."
    )
  }

  const [
    wholePesoValue,
    fractionalValue = "",
  ] = normalizedValue.split(".")

  const wholePesos =
    Number(wholePesoValue)

  if (
    !Number.isSafeInteger(
      wholePesos
    )
  ) {
    throw new Error(
      "The PHP amount is too large."
    )
  }

  const centavoText =
    fractionalValue
      .padEnd(2, "0")
      .slice(0, 2)

  const centavos =
    Number(centavoText)

  const totalCentavos =
    wholePesos * 100 +
    centavos

  return assertSafeCentavos(
    totalCentavos,
    "PHP amount"
  )
}

export function formatBillingAmount(
  amountCentavos: number
): string {
  return billingCurrencyFormatter.format(
    assertSafeCentavos(
      amountCentavos,
      "Billing amount"
    ) / 100
  )
}

export function calculateBillingChargeGrossAmount(
  quantity: number,
  unitAmountCentavos: number
): number {
  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      "Billing quantity must be a positive whole number."
    )
  }

  if (
    !Number.isSafeInteger(
      unitAmountCentavos
    ) ||
    unitAmountCentavos < 0
  ) {
    throw new Error(
      "Billing unit amount must be a non-negative centavo value."
    )
  }

  return assertSafeCentavos(
    quantity *
      unitAmountCentavos,
    "Charge gross amount"
  )
}

export function generateBillingChargeNumber(
  charges:
    readonly Pick<
      BillingCharge,
      "chargeNumber"
    >[],

  year =
    new Date().getFullYear()
): string {
  return generateSequenceNumber(
    charges.map(
      (charge) =>
        charge.chargeNumber
    ),

    `GM-CHG-${year}-`
  )
}

export function generateBillingStatementNumber(
  statements:
    readonly Pick<
      BillingStatement,
      "statementNumber"
    >[],

  year =
    new Date().getFullYear()
): string {
  return generateSequenceNumber(
    statements.map(
      (statement) =>
        statement.statementNumber
    ),

    `GM-BILL-${year}-`
  )
}

export function generateBillingPaymentNumber(
  payments:
    readonly Pick<
      BillingPayment,
      "paymentNumber"
    >[],

  year =
    new Date().getFullYear()
): string {
  return generateSequenceNumber(
    payments.map(
      (payment) =>
        payment.paymentNumber
    ),

    `GM-PAY-${year}-`
  )
}

export function generateOfficialReceiptNumber(
  payments:
    readonly Pick<
      BillingPayment,
      "officialReceiptNumber"
    >[],

  year =
    new Date().getFullYear()
): string {
  return generateSequenceNumber(
    payments.map(
      (payment) =>
        payment.officialReceiptNumber
    ),

    `GM-OR-${year}-`
  )
}

export function generateBillingRefundNumber(
  refunds:
    readonly Pick<
      BillingRefund,
      "refundNumber"
    >[],

  year =
    new Date().getFullYear()
): string {
  return generateSequenceNumber(
    refunds.map(
      (refund) =>
        refund.refundNumber
    ),

    `GM-RFD-${year}-`
  )
}

export function computeBillingStatementTotals({
  charges,
  adjustments,
  coverageAllocations,
  payments,
  refunds,
}: {
  charges:
    readonly BillingCharge[]

  adjustments:
    readonly BillingAdjustment[]

  coverageAllocations:
    readonly BillingCoverageAllocation[]

  payments:
    readonly BillingPayment[]

  refunds:
    readonly BillingRefund[]
}): BillingStatementTotals {
  const grossAmountCentavos =
    sumCentavos(
      charges
        .filter(
          (charge) =>
            charge.status ===
            "posted"
        )
        .map(
          (charge) =>
            charge.grossAmountCentavos
        )
    )

  const adjustmentAmountCentavos =
    sumCentavos(
      adjustments
        .filter(
          (adjustment) =>
            adjustment.status ===
            "posted"
        )
        .map(
          (adjustment) =>
            adjustment.amountCentavos
        )
    )

  const netChargeAmountCentavos =
    Math.max(
      0,
      grossAmountCentavos +
        adjustmentAmountCentavos
    )

  const requestedCoverageCentavos =
    sumCentavos(
      coverageAllocations
        .filter(
          (allocation) =>
            allocation.status ===
            "active"
        )
        .map(
          (allocation) =>
            Math.max(
              0,
              allocation.amountCentavos
            )
        )
    )

  const coverageAmountCentavos =
    Math.min(
      requestedCoverageCentavos,
      netChargeAmountCentavos
    )

  const patientResponsibilityCentavos =
    Math.max(
      0,
      netChargeAmountCentavos -
        coverageAmountCentavos
    )

  const amountPaidCentavos =
    sumCentavos(
      payments
        .filter(
          (payment) =>
            payment.status ===
            "posted"
        )
        .map(
          (payment) =>
            Math.max(
              0,
              payment.amountCentavos
            )
        )
    )

  const refundAmountCentavos =
    sumCentavos(
      refunds
        .filter(
          (refund) =>
            refund.status ===
            "posted"
        )
        .map(
          (refund) =>
            Math.max(
              0,
              refund.amountCentavos
            )
        )
    )

  const netPaymentCentavos =
    Math.max(
      0,
      amountPaidCentavos -
        refundAmountCentavos
    )

  const balanceDueCentavos =
    Math.max(
      0,
      patientResponsibilityCentavos -
        netPaymentCentavos
    )

  const creditBalanceCentavos =
    Math.max(
      0,
      netPaymentCentavos -
        patientResponsibilityCentavos
    )

  return {
    grossAmountCentavos,

    adjustmentAmountCentavos,

    netChargeAmountCentavos,

    coverageAmountCentavos,

    patientResponsibilityCentavos,

    amountPaidCentavos,
    refundAmountCentavos,

    netPaymentCentavos,

    balanceDueCentavos,
    creditBalanceCentavos,
  }
}
