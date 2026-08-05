import {
  BILLING_ADJUSTMENT_TYPE_LABELS,
  BILLING_CHARGE_SOURCE_LABELS,
  BILLING_CHARGE_STATUS_LABELS,
  BILLING_COVERAGE_TYPE_LABELS,
  BILLING_PAYMENT_METHOD_LABELS,
  BILLING_STATEMENT_STATUS_LABELS,
} from "@/features/billing/constants/billing.constants"
import type {
  BillingAuditEvent,
} from "@/features/billing/types/billing-audit.types"
import type {
  BillingAdjustment,
  BillingCharge,
  BillingCoverageAllocation,
  BillingPayment,
  BillingRefund,
  BillingStatement,
} from "@/features/billing/types/billing.types"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"

interface BuildBillingAuditEventsInput {
  statement: BillingStatement

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
}

function createAuditEventId(
  source: string,
  recordId: string,
  action: string
): string {
  return `billing-audit-${source}-${recordId}-${action}`
}

function getTimestamp(
  value: string
): number {
  const timestamp =
    new Date(value).getTime()

  return Number.isNaN(timestamp)
    ? 0
    : timestamp
}

export function buildBillingAuditEvents({
  statement,
  charges,
  adjustments,
  coverageAllocations,
  payments,
  refunds,
}: BuildBillingAuditEventsInput): BillingAuditEvent[] {
  const events:
    BillingAuditEvent[] = []

  const statementCharges =
    charges.filter((charge) =>
      statement.chargeIds.includes(
        charge.id
      )
    )

  const statementAdjustments =
    adjustments.filter(
      (adjustment) =>
        statement.adjustmentIds.includes(
          adjustment.id
        )
    )

  const statementCoverage =
    coverageAllocations.filter(
      (coverage) =>
        statement.coverageAllocationIds.includes(
          coverage.id
        )
    )

  const statementPayments =
    payments.filter((payment) =>
      statement.paymentIds.includes(
        payment.id
      )
    )

  const statementRefunds =
    refunds.filter((refund) =>
      statement.refundIds.includes(
        refund.id
      )
    )

  events.push({
    id: createAuditEventId(
      "statement",
      statement.id,
      "created"
    ),

    statementId:
      statement.id,

    patientId:
      statement.patientId,

    occurredAt:
      statement.createdAt,

    category: "statement",
    action: "created",

    title:
      "Billing statement created",

    summary: `${statement.statementNumber} was created with ${statement.chargeIds.length} patient charge${
      statement.chargeIds.length === 1
        ? ""
        : "s"
    }.`,

    actor: null,

    reference:
      statement.statementNumber,

    details: [
      {
        label:
          "Statement number",

        value:
          statement.statementNumber,
      },
      {
        label:
          "Billing branch",

        value:
          statement.branchName,
      },
      {
        label:
          "Initial charge count",

        value: String(
          statement.chargeIds.length
        ),
      },
      {
        label:
          "Gross charges",

        value:
          formatBillingAmount(
            statement.grossAmountCentavos
          ),
      },
      {
        label:
          "Current statement status",

        value:
          BILLING_STATEMENT_STATUS_LABELS[
            statement.status
          ],
      },
      {
        label:
          "Statement notes",

        value:
          statement.notes ??
          "No notes recorded",

        sensitive:
          Boolean(statement.notes),
      },
    ],
  })

  statementCharges.forEach(
    (charge) => {
      const occurredAt =
        charge.postedAt ??
        charge.createdAt

      events.push({
        id: createAuditEventId(
          "charge",
          charge.id,
          "charge-posted"
        ),

        statementId:
          statement.id,

        patientId:
          statement.patientId,

        occurredAt,

        category: "charge",

        action:
          "charge-posted",

        title:
          "Patient charge posted",

        summary: `${charge.description} was posted for ${formatBillingAmount(
          charge.grossAmountCentavos
        )}.`,

        actor:
          charge.postedBy,

        reference:
          charge.chargeNumber,

        details: [
          {
            label:
              "Charge number",

            value:
              charge.chargeNumber,
          },
          {
            label:
              "Charge source",

            value:
              BILLING_CHARGE_SOURCE_LABELS[
                charge.source
              ],
          },
          {
            label:
              "Description",

            value:
              charge.description,
          },
          {
            label:
              "Quantity",

            value: String(
              charge.quantity
            ),
          },
          {
            label:
              "Unit amount",

            value:
              formatBillingAmount(
                charge.unitAmountCentavos
              ),
          },
          {
            label:
              "Gross amount",

            value:
              formatBillingAmount(
                charge.grossAmountCentavos
              ),
          },
          {
            label:
              "Charge status",

            value:
              BILLING_CHARGE_STATUS_LABELS[
                charge.status
              ],
          },
          {
            label:
              "Source reference",

            value:
              charge.sourceReference ??
              "Not recorded",

            sensitive:
              Boolean(
                charge.sourceReference
              ),
          },
          {
            label:
              "Charge notes",

            value:
              charge.notes ??
              "No notes recorded",

            sensitive:
              Boolean(charge.notes),
          },
        ],
      })
    }
  )

  if (statement.issuedAt) {
    events.push({
      id: createAuditEventId(
        "statement",
        statement.id,
        "issued"
      ),

      statementId:
        statement.id,

      patientId:
        statement.patientId,

      occurredAt:
        statement.issuedAt,

      category: "statement",
      action: "issued",

      title:
        "Billing statement issued",

      summary: `${statement.statementNumber} was issued and became eligible for payment.`,

      actor:
        statement.issuedBy,

      reference:
        statement.statementNumber,

      details: [
        {
          label:
            "Issued by",

          value:
            statement.issuedBy ??
            "Not recorded",
        },
        {
          label:
            "Net charges",

          value:
            formatBillingAmount(
              statement.netChargeAmountCentavos
            ),
        },
        {
          label:
            "Coverage amount",

          value:
            formatBillingAmount(
              statement.coverageAmountCentavos
            ),
        },
        {
          label:
            "Patient responsibility",

          value:
            formatBillingAmount(
              statement.patientResponsibilityCentavos
            ),
        },
      ],
    })
  }

  statementAdjustments.forEach(
    (adjustment) => {
      events.push({
        id: createAuditEventId(
          "adjustment",
          adjustment.id,
          "adjustment-posted"
        ),

        statementId:
          statement.id,

        patientId:
          statement.patientId,

        occurredAt:
          adjustment.postedAt,

        category:
          "adjustment",

        action:
          "adjustment-posted",

        title:
          "Billing adjustment posted",

        summary: `${BILLING_ADJUSTMENT_TYPE_LABELS[
          adjustment.type
        ]} of ${formatBillingAmount(
          adjustment.amountCentavos
        )} was posted.`,

        actor:
          adjustment.postedBy,

        reference:
          adjustment.description,

        details: [
          {
            label:
              "Adjustment type",

            value:
              BILLING_ADJUSTMENT_TYPE_LABELS[
                adjustment.type
              ],
          },
          {
            label:
              "Description",

            value:
              adjustment.description,
          },
          {
            label:
              "Signed amount",

            value:
              formatBillingAmount(
                adjustment.amountCentavos
              ),
          },
          {
            label:
              "Posted by",

            value:
              adjustment.postedBy,
          },
        ],
      })

      if (
        adjustment.reversedAt
      ) {
        events.push({
          id: createAuditEventId(
            "adjustment",
            adjustment.id,
            "adjustment-reversed"
          ),

          statementId:
            statement.id,

          patientId:
            statement.patientId,

          occurredAt:
            adjustment.reversedAt,

          category:
            "adjustment",

          action:
            "adjustment-reversed",

          title:
            "Billing adjustment reversed",

          summary: `${adjustment.description} was reversed and excluded from active statement totals.`,

          actor:
            adjustment.reversedBy,

          reference:
            adjustment.description,

          details: [
            {
              label:
                "Original amount",

              value:
                formatBillingAmount(
                  adjustment.amountCentavos
                ),
            },
            {
              label:
                "Reversed by",

              value:
                adjustment.reversedBy ??
                "Not recorded",
            },
            {
              label:
                "Reversal reason",

              value:
                adjustment.reversalReason ??
                "Not recorded",

              sensitive: true,
            },
          ],
        })
      }
    }
  )

  statementCoverage.forEach(
    (coverage) => {
      events.push({
        id: createAuditEventId(
          "coverage",
          coverage.id,
          "coverage-allocated"
        ),

        statementId:
          statement.id,

        patientId:
          statement.patientId,

        occurredAt:
          coverage.allocatedAt,

        category: "coverage",

        action:
          "coverage-allocated",

        title:
          "Coverage allocation posted",

        summary: `${coverage.payerName} was allocated ${formatBillingAmount(
          coverage.amountCentavos
        )}.`,

        actor:
          coverage.allocatedBy,

        reference:
          coverage.payerName,

        details: [
          {
            label:
              "Coverage type",

            value:
              BILLING_COVERAGE_TYPE_LABELS[
                coverage.type
              ],
          },
          {
            label:
              "Payer name",

            value:
              coverage.payerName,
          },
          {
            label:
              "Coverage amount",

            value:
              formatBillingAmount(
                coverage.amountCentavos
              ),
          },
          {
            label:
              "Coverage reference",

            value:
              coverage.referenceNumber ??
              "Not recorded",

            sensitive:
              Boolean(
                coverage.referenceNumber
              ),
          },
          {
            label:
              "Coverage notes",

            value:
              coverage.notes ??
              "No notes recorded",

            sensitive:
              Boolean(coverage.notes),
          },
        ],
      })

      if (coverage.reversedAt) {
        events.push({
          id: createAuditEventId(
            "coverage",
            coverage.id,
            "coverage-reversed"
          ),

          statementId:
            statement.id,

          patientId:
            statement.patientId,

          occurredAt:
            coverage.reversedAt,

          category: "coverage",

          action:
            "coverage-reversed",

          title:
            "Coverage allocation reversed",

          summary: `${coverage.payerName} coverage allocation was reversed.`,

          actor:
            coverage.reversedBy,

          reference:
            coverage.payerName,

          details: [
            {
              label:
                "Original coverage amount",

              value:
                formatBillingAmount(
                  coverage.amountCentavos
                ),
            },
            {
              label:
                "Reversed by",

              value:
                coverage.reversedBy ??
                "Not recorded",
            },
            {
              label:
                "Reversal reason",

              value:
                coverage.reversalReason ??
                "Not recorded",

              sensitive: true,
            },
          ],
        })
      }
    }
  )

  statementPayments.forEach(
    (payment) => {
      events.push({
        id: createAuditEventId(
          "payment",
          payment.id,
          "payment-posted"
        ),

        statementId:
          statement.id,

        patientId:
          statement.patientId,

        occurredAt:
          payment.postedAt,

        category: "payment",

        action:
          "payment-posted",

        title:
          "Billing payment posted",

        summary: `${payment.officialReceiptNumber} was generated for ${formatBillingAmount(
          payment.amountCentavos
        )}.`,

        actor:
          payment.postedBy,

        reference:
          payment.officialReceiptNumber,

        details: [
          {
            label:
              "Payment number",

            value:
              payment.paymentNumber,
          },
          {
            label:
              "Official receipt",

            value:
              payment.officialReceiptNumber,
          },
          {
            label:
              "Payment method",

            value:
              BILLING_PAYMENT_METHOD_LABELS[
                payment.method
              ],
          },
          {
            label:
              "Payment amount",

            value:
              formatBillingAmount(
                payment.amountCentavos
              ),
          },
          {
            label:
              "External reference",

            value:
              payment.externalReference ??
              "Not recorded",

            sensitive:
              Boolean(
                payment.externalReference
              ),
          },
          {
            label:
              "Payment notes",

            value:
              payment.notes ??
              "No notes recorded",

            sensitive:
              Boolean(payment.notes),
          },
        ],
      })

      if (payment.reversedAt) {
        events.push({
          id: createAuditEventId(
            "payment",
            payment.id,
            "payment-reversed"
          ),

          statementId:
            statement.id,

          patientId:
            statement.patientId,

          occurredAt:
            payment.reversedAt,

          category: "payment",

          action:
            "payment-reversed",

          title:
            "Billing payment reversed",

          summary: `${payment.officialReceiptNumber} was reversed and excluded from active payment totals.`,

          actor:
            payment.reversedBy,

          reference:
            payment.officialReceiptNumber,

          details: [
            {
              label:
                "Reversed payment amount",

              value:
                formatBillingAmount(
                  payment.amountCentavos
                ),
            },
            {
              label:
                "Reversed by",

              value:
                payment.reversedBy ??
                "Not recorded",
            },
            {
              label:
                "Reversal reason",

              value:
                payment.reversalReason ??
                "Not recorded",

              sensitive: true,
            },
          ],
        })
      }
    }
  )

  statementRefunds.forEach(
    (refund) => {
      const linkedPayment =
        refund.paymentId
          ? statementPayments.find(
              (payment) =>
                payment.id ===
                refund.paymentId
            ) ?? null
          : null

      events.push({
        id: createAuditEventId(
          "refund",
          refund.id,
          "refund-posted"
        ),

        statementId:
          statement.id,

        patientId:
          statement.patientId,

        occurredAt:
          refund.postedAt,

        category: "refund",

        action:
          "refund-posted",

        title:
          "Billing refund posted",

        summary: `${refund.refundNumber} was posted for ${formatBillingAmount(
          refund.amountCentavos
        )}.`,

        actor:
          refund.postedBy,

        reference:
          refund.refundNumber,

        details: [
          {
            label:
              "Refund number",

            value:
              refund.refundNumber,
          },
          {
            label:
              "Refund amount",

            value:
              formatBillingAmount(
                refund.amountCentavos
              ),
          },
          {
            label:
              "Related official receipt",

            value:
              linkedPayment
                ?.officialReceiptNumber ??
              "Statement-level refund",
          },
          {
            label:
              "Refund reason",

            value:
              refund.reason,

            sensitive: true,
          },
          {
            label:
              "Recorded by",

            value:
              refund.postedBy,
          },
        ],
      })

      if (refund.reversedAt) {
        events.push({
          id: createAuditEventId(
            "refund",
            refund.id,
            "refund-reversed"
          ),

          statementId:
            statement.id,

          patientId:
            statement.patientId,

          occurredAt:
            refund.reversedAt,

          category: "refund",

          action:
            "refund-reversed",

          title:
            "Billing refund reversed",

          summary: `${refund.refundNumber} was reversed and excluded from active refund totals.`,

          actor:
            refund.reversedBy,

          reference:
            refund.refundNumber,

          details: [
            {
              label:
                "Reversed refund amount",

              value:
                formatBillingAmount(
                  refund.amountCentavos
                ),
            },
            {
              label:
                "Reversed by",

              value:
                refund.reversedBy ??
                "Not recorded",
            },
            {
              label:
                "Reversal reason",

              value:
                refund.reversalReason ??
                "Not recorded",

              sensitive: true,
            },
          ],
        })
      }
    }
  )

  if (statement.closedAt) {
    events.push({
      id: createAuditEventId(
        "statement",
        statement.id,
        "closed"
      ),

      statementId:
        statement.id,

      patientId:
        statement.patientId,

      occurredAt:
        statement.closedAt,

      category: "statement",
      action: "closed",

      title:
        "Billing statement fully settled",

      summary: `${statement.statementNumber} reached a zero balance due.`,

      actor:
        statement.closedBy,

      reference:
        statement.statementNumber,

      details: [
        {
          label:
            "Closed by",

          value:
            statement.closedBy ??
            "Not recorded",
        },
        {
          label:
            "Patient responsibility",

          value:
            formatBillingAmount(
              statement.patientResponsibilityCentavos
            ),
        },
        {
          label:
            "Payments posted",

          value:
            formatBillingAmount(
              statement.amountPaidCentavos
            ),
        },
        {
          label:
            "Refunds posted",

          value:
            formatBillingAmount(
              statement.refundAmountCentavos
            ),
        },
        {
          label:
            "Credit balance",

          value:
            formatBillingAmount(
              statement.creditBalanceCentavos
            ),
        },
      ],
    })
  }

  if (statement.voidedAt) {
    events.push({
      id: createAuditEventId(
        "statement",
        statement.id,
        "voided"
      ),

      statementId:
        statement.id,

      patientId:
        statement.patientId,

      occurredAt:
        statement.voidedAt,

      category: "statement",
      action: "voided",

      title:
        "Billing statement voided",

      summary: `${statement.statementNumber} was voided and made read-only.`,

      actor:
        statement.voidedBy,

      reference:
        statement.statementNumber,

      details: [
        {
          label:
            "Voided by",

          value:
            statement.voidedBy ??
            "Not recorded",
        },
        {
          label:
            "Void reason",

          value:
            statement.voidReason ??
            "Not recorded",

          sensitive: true,
        },
      ],
    })
  }

  return events.sort(
    (firstEvent, secondEvent) =>
      getTimestamp(
        secondEvent.occurredAt
      ) -
      getTimestamp(
        firstEvent.occurredAt
      )
  )
}
