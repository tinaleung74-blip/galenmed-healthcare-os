"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react"

import {
  BILLING_CHARGE_CATALOG,
  BILLING_OPERATIONS_ACTOR,
} from "@/features/billing/constants/billing.constants"
import {
  MOCK_BILLING_ADJUSTMENTS,
  MOCK_BILLING_CHARGES,
  MOCK_BILLING_COVERAGE_ALLOCATIONS,
  MOCK_BILLING_PAYMENTS,
  MOCK_BILLING_REFUNDS,
  MOCK_BILLING_STATEMENTS,
} from "@/features/billing/data/billing.mock-data"
import type {
  BillingAdjustmentFormValues,
} from "@/features/billing/schemas/billing-adjustment.schema"
import type {
  BillingChargeFormValues,
} from "@/features/billing/schemas/billing-charge.schema"
import type {
  BillingCoverageFormValues,
} from "@/features/billing/schemas/billing-coverage.schema"
import type {
  BillingPaymentFormValues,
  BillingRefundFormValues,
  BillingReversalValues,
} from "@/features/billing/schemas/billing-payment.schema"
import type {
  BillingStatementFormValues,
  BillingStatementIssueValues,
} from "@/features/billing/schemas/billing-statement.schema"
import type {
  BillingAdjustment,
  BillingCharge,
  BillingChargeCatalogItem,
  BillingCoverageAllocation,
  BillingPayment,
  BillingRefund,
  BillingStatement,
  BillingStatementStatus,
} from "@/features/billing/types/billing.types"
import {
  calculateBillingChargeGrossAmount,
  computeBillingStatementTotals,
  createTemporaryBillingId,
  generateBillingChargeNumber,
  generateBillingPaymentNumber,
  generateBillingRefundNumber,
  generateBillingStatementNumber,
  generateOfficialReceiptNumber,
  parsePhilippinePesoToCentavos,
  type BillingStatementTotals,
} from "@/features/billing/utils/billing.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import {
  usePersistentDevelopmentState,
} from "@/hooks/use-persistent-development-state"

const BILLING_CHARGE_STORAGE_KEY =
  "galenmed:development:billing-charges:v1"

const BILLING_STATEMENT_STORAGE_KEY =
  "galenmed:development:billing-statements:v1"

const BILLING_ADJUSTMENT_STORAGE_KEY =
  "galenmed:development:billing-adjustments:v1"

const BILLING_COVERAGE_STORAGE_KEY =
  "galenmed:development:billing-coverage:v1"

const BILLING_PAYMENT_STORAGE_KEY =
  "galenmed:development:billing-payments:v1"

const BILLING_REFUND_STORAGE_KEY =
  "galenmed:development:billing-refunds:v1"

interface BillingPaymentResult {
  statement: BillingStatement
  payment: BillingPayment
}

interface BillingRefundResult {
  statement: BillingStatement
  refund: BillingRefund
}

interface BillingContextValue {
  charges: BillingCharge[]
  statements: BillingStatement[]

  adjustments:
    BillingAdjustment[]

  coverageAllocations:
    BillingCoverageAllocation[]

  payments: BillingPayment[]
  refunds: BillingRefund[]

  createBillingCharge: (
    values: BillingChargeFormValues
  ) => BillingCharge

  createBillingStatement: (
    values:
      BillingStatementFormValues
  ) => BillingStatement

  issueBillingStatement: (
    statementId: string,
    values:
      BillingStatementIssueValues
  ) => BillingStatement

  addBillingAdjustment: (
    statementId: string,
    values:
      BillingAdjustmentFormValues
  ) => BillingStatement

  addBillingCoverage: (
    statementId: string,
    values:
      BillingCoverageFormValues
  ) => BillingStatement

  recordBillingPayment: (
    statementId: string,
    values:
      BillingPaymentFormValues
  ) => BillingPaymentResult

  recordBillingRefund: (
    statementId: string,
    values:
      BillingRefundFormValues
  ) => BillingRefundResult

  reverseBillingAdjustment: (
    adjustmentId: string,
    values:
      BillingReversalValues
  ) => BillingStatement

  reverseBillingCoverage: (
    coverageId: string,
    values:
      BillingReversalValues
  ) => BillingStatement

  reverseBillingPayment: (
    paymentId: string,
    values:
      BillingReversalValues
  ) => BillingStatement

  reverseBillingRefund: (
    refundId: string,
    values:
      BillingReversalValues
  ) => BillingStatement

  voidBillingCharge: (
    chargeId: string,
    values:
      BillingReversalValues
  ) => BillingCharge

  voidBillingStatement: (
    statementId: string,
    values:
      BillingReversalValues
  ) => BillingStatement
}

const BillingContext =
  createContext<BillingContextValue | null>(
    null
  )

interface BillingProviderProps {
  children: ReactNode
}

function replaceRecord<
  RecordType extends {
    id: string
  },
>(
  records: readonly RecordType[],
  updatedRecord: RecordType
): RecordType[] {
  return records.map((record) =>
    record.id === updatedRecord.id
      ? updatedRecord
      : record
  )
}

function getRecordOrThrow<
  RecordType extends {
    id: string
  },
>(
  records: readonly RecordType[],
  recordId: string,
  label: string
): RecordType {
  const record =
    records.find(
      (candidateRecord) =>
        candidateRecord.id ===
        recordId
    )

  if (!record) {
    throw new Error(
      `${label} was not found.`
    )
  }

  return record
}

function normalizeActor(
  value: string,
  fallback =
    BILLING_OPERATIONS_ACTOR
): string {
  return value.trim() || fallback
}

function getCatalogItemOrThrow(
  catalogCode: string
): BillingChargeCatalogItem {
  const item =
    BILLING_CHARGE_CATALOG.find(
      (candidateItem) =>
        candidateItem.code ===
        catalogCode
    )

  if (!item) {
    throw new Error(
      "The selected billing catalog item was not found."
    )
  }

  if (!item.active) {
    throw new Error(
      "The selected billing catalog item is inactive."
    )
  }

  return item
}

function deriveStatementStatus(
  statement: BillingStatement,
  totals: BillingStatementTotals
): BillingStatementStatus {
  if (
    statement.status === "voided"
  ) {
    return "voided"
  }

  if (!statement.issuedAt) {
    return "draft"
  }

  if (
    totals.amountPaidCentavos > 0 &&
    totals.refundAmountCentavos >=
      totals.amountPaidCentavos
  ) {
    return "refunded"
  }

  if (
    totals.balanceDueCentavos === 0
  ) {
    return "paid"
  }

  if (
    totals.netPaymentCentavos > 0
  ) {
    return "partially-paid"
  }

  return "issued"
}

export function BillingProvider({
  children,
}: BillingProviderProps) {
  const { patients } =
    usePatients()

  const [
    charges,
    setCharges,
  ] =
    usePersistentDevelopmentState<
      BillingCharge[]
    >(
      BILLING_CHARGE_STORAGE_KEY,
      [...MOCK_BILLING_CHARGES]
    )

  const [
    statements,
    setStatements,
  ] =
    usePersistentDevelopmentState<
      BillingStatement[]
    >(
      BILLING_STATEMENT_STORAGE_KEY,
      [...MOCK_BILLING_STATEMENTS]
    )

  const [
    adjustments,
    setAdjustments,
  ] =
    usePersistentDevelopmentState<
      BillingAdjustment[]
    >(
      BILLING_ADJUSTMENT_STORAGE_KEY,
      [...MOCK_BILLING_ADJUSTMENTS]
    )

  const [
    coverageAllocations,
    setCoverageAllocations,
  ] =
    usePersistentDevelopmentState<
      BillingCoverageAllocation[]
    >(
      BILLING_COVERAGE_STORAGE_KEY,
      [
        ...MOCK_BILLING_COVERAGE_ALLOCATIONS,
      ]
    )

  const [
    payments,
    setPayments,
  ] =
    usePersistentDevelopmentState<
      BillingPayment[]
    >(
      BILLING_PAYMENT_STORAGE_KEY,
      [...MOCK_BILLING_PAYMENTS]
    )

  const [
    refunds,
    setRefunds,
  ] =
    usePersistentDevelopmentState<
      BillingRefund[]
    >(
      BILLING_REFUND_STORAGE_KEY,
      [...MOCK_BILLING_REFUNDS]
    )

  const chargesRef =
    useRef(charges)

  const statementsRef =
    useRef(statements)

  const adjustmentsRef =
    useRef(adjustments)

  const coverageRef =
    useRef(coverageAllocations)

  const paymentsRef =
    useRef(payments)

  const refundsRef =
    useRef(refunds)

  useEffect(() => {
    chargesRef.current = charges
  }, [charges])

  useEffect(() => {
    statementsRef.current =
      statements
  }, [statements])

  useEffect(() => {
    adjustmentsRef.current =
      adjustments
  }, [adjustments])

  useEffect(() => {
    coverageRef.current =
      coverageAllocations
  }, [coverageAllocations])

  useEffect(() => {
    paymentsRef.current =
      payments
  }, [payments])

  useEffect(() => {
    refundsRef.current =
      refunds
  }, [refunds])

  const saveStatement =
    useCallback(
      (
        updatedStatement:
          BillingStatement
      ): BillingStatement => {
        const nextStatements =
          replaceRecord(
            statementsRef.current,
            updatedStatement
          )

        statementsRef.current =
          nextStatements

        setStatements(
          nextStatements
        )

        return updatedStatement
      },
      [setStatements]
    )

  const recalculateStatement =
    useCallback(
      (
        statement:
          BillingStatement,

        updatedBy: string,

        updatedAt =
          new Date().toISOString()
      ): BillingStatement => {
        const statementCharges =
          chargesRef.current.filter(
            (charge) =>
              statement.chargeIds.includes(
                charge.id
              )
          )

        const statementAdjustments =
          adjustmentsRef.current.filter(
            (adjustment) =>
              statement.adjustmentIds.includes(
                adjustment.id
              )
          )

        const statementCoverage =
          coverageRef.current.filter(
            (coverage) =>
              statement.coverageAllocationIds.includes(
                coverage.id
              )
          )

        const statementPayments =
          paymentsRef.current.filter(
            (payment) =>
              statement.paymentIds.includes(
                payment.id
              )
          )

        const statementRefunds =
          refundsRef.current.filter(
            (refund) =>
              statement.refundIds.includes(
                refund.id
              )
          )

        const totals =
          computeBillingStatementTotals({
            charges:
              statementCharges,

            adjustments:
              statementAdjustments,

            coverageAllocations:
              statementCoverage,

            payments:
              statementPayments,

            refunds:
              statementRefunds,
          })

        const nextStatus =
          deriveStatementStatus(
            statement,
            totals
          )

        const actor =
          normalizeActor(updatedBy)

        const updatedStatement:
          BillingStatement = {
          ...statement,

          ...totals,

          status: nextStatus,

          closedAt:
            nextStatus === "paid"
              ? statement.closedAt ??
                updatedAt
              : null,

          closedBy:
            nextStatus === "paid"
              ? statement.closedBy ??
                actor
              : null,

          updatedAt,
          updatedBy: actor,
        }

        return saveStatement(
          updatedStatement
        )
      },
      [saveStatement]
    )

  const createBillingCharge =
    useCallback(
      (
        values:
          BillingChargeFormValues
      ): BillingCharge => {
        const patient =
          patients.find(
            (candidatePatient) =>
              candidatePatient.id ===
              values.patientId
          )

        if (!patient) {
          throw new Error(
            "The selected patient record was not found."
          )
        }

        const branch =
          GALENMED_BRANCHES.find(
            (candidateBranch) =>
              candidateBranch.id ===
              values.branchId
          )

        if (!branch) {
          throw new Error(
            "The selected billing branch was not found."
          )
        }

        const catalogItem =
          getCatalogItemOrThrow(
            values.catalogCode
          )

        if (
          catalogItem.source !==
          values.source
        ) {
          throw new Error(
            "The charge source does not match the selected catalog item."
          )
        }

        const sourceRecordId =
          values.sourceRecordId.trim()

        if (
          values.source !== "manual"
        ) {
          const duplicateCharge =
            chargesRef.current.find(
              (charge) =>
                charge.status !==
                  "voided" &&
                charge.source ===
                  values.source &&
                charge.sourceRecordId ===
                  sourceRecordId &&
                charge.catalogCode ===
                  catalogItem.code
            )

          if (duplicateCharge) {
            throw new Error(
              `This linked service was already billed under ${duplicateCharge.chargeNumber}.`
            )
          }
        }

        const enteredUnitAmount =
          parsePhilippinePesoToCentavos(
            values.unitAmountPhp
          )

        const unitAmountCentavos =
          catalogItem.allowCustomUnitAmount
            ? enteredUnitAmount
            : catalogItem.defaultUnitAmountCentavos

        if (
          unitAmountCentavos === null
        ) {
          throw new Error(
            "A custom unit amount is required for this billing item."
          )
        }

        if (
          !catalogItem.allowCustomUnitAmount &&
          enteredUnitAmount !==
            unitAmountCentavos
        ) {
          throw new Error(
            "The entered unit amount does not match the fixed synthetic catalog amount."
          )
        }

        const quantity =
          Number(values.quantity)

        const grossAmountCentavos =
          calculateBillingChargeGrossAmount(
            quantity,
            unitAmountCentavos
          )

        const postedBy =
          normalizeActor(
            values.postedBy
          )

        const now =
          new Date().toISOString()

        const newCharge:
          BillingCharge = {
          id:
            createTemporaryBillingId(
              "billing-charge"
            ),

          chargeNumber:
            generateBillingChargeNumber(
              chargesRef.current
            ),

          patientId:
            patient.id,

          branchId:
            branch.id,

          branchName:
            branch.name,

          source:
            values.source,

          sourceRecordId:
            sourceRecordId ||
            null,

          sourceReference:
            values.sourceReference
              .trim() || null,

          catalogCode:
            catalogItem.code,

          description:
            values.description.trim(),

          quantity,

          unitAmountCentavos,

          grossAmountCentavos,

          taxable:
            catalogItem.taxable,

          notes:
            values.notes.trim() ||
            null,

          status: "posted",

          postedAt: now,
          postedBy,

          voidedAt: null,
          voidedBy: null,
          voidReason: null,

          createdAt: now,
          updatedAt: now,
          updatedBy: postedBy,
        }

        const nextCharges = [
          newCharge,
          ...chargesRef.current,
        ]

        chargesRef.current =
          nextCharges

        setCharges(nextCharges)

        return newCharge
      },
      [
        patients,
        setCharges,
      ]
    )

  const createBillingStatement =
    useCallback(
      (
        values:
          BillingStatementFormValues
      ): BillingStatement => {
        const patient =
          patients.find(
            (candidatePatient) =>
              candidatePatient.id ===
              values.patientId
          )

        if (!patient) {
          throw new Error(
            "The selected patient record was not found."
          )
        }

        const branch =
          GALENMED_BRANCHES.find(
            (candidateBranch) =>
              candidateBranch.id ===
              values.branchId
          )

        if (!branch) {
          throw new Error(
            "The selected billing branch was not found."
          )
        }

        const selectedCharges =
          values.chargeIds.map(
            (chargeId) =>
              getRecordOrThrow(
                chargesRef.current,
                chargeId,
                "Billing charge"
              )
          )

        const usedChargeIds =
          new Set(
            statementsRef.current
              .filter(
                (statement) =>
                  statement.status !==
                  "voided"
              )
              .flatMap(
                (statement) =>
                  statement.chargeIds
              )
          )

        selectedCharges.forEach(
          (charge) => {
            if (
              charge.status !==
              "posted"
            ) {
              throw new Error(
                `${charge.chargeNumber} is not an active posted charge.`
              )
            }

            if (
              charge.patientId !==
              patient.id
            ) {
              throw new Error(
                "All selected charges must belong to the same patient."
              )
            }

            if (
              charge.branchId !==
              branch.id
            ) {
              throw new Error(
                "All selected charges must belong to the selected branch."
              )
            }

            if (
              usedChargeIds.has(
                charge.id
              )
            ) {
              throw new Error(
                `${charge.chargeNumber} is already assigned to another active statement.`
              )
            }
          }
        )

        const totals =
          computeBillingStatementTotals({
            charges:
              selectedCharges,

            adjustments: [],

            coverageAllocations:
              [],

            payments: [],
            refunds: [],
          })

        const createdBy =
          normalizeActor(
            values.createdBy
          )

        const now =
          new Date().toISOString()

        const newStatement:
          BillingStatement = {
          id:
            createTemporaryBillingId(
              "billing-statement"
            ),

          statementNumber:
            generateBillingStatementNumber(
              statementsRef.current
            ),

          patientId:
            patient.id,

          branchId:
            branch.id,

          branchName:
            branch.name,

          chargeIds:
            selectedCharges.map(
              (charge) => charge.id
            ),

          adjustmentIds: [],

          coverageAllocationIds:
            [],

          paymentIds: [],
          refundIds: [],

          status: "draft",

          ...totals,

          notes:
            values.notes.trim() ||
            null,

          issuedAt: null,
          issuedBy: null,

          closedAt: null,
          closedBy: null,

          voidedAt: null,
          voidedBy: null,
          voidReason: null,

          createdAt: now,
          updatedAt: now,
          updatedBy: createdBy,
        }

        const nextStatements = [
          newStatement,
          ...statementsRef.current,
        ]

        statementsRef.current =
          nextStatements

        setStatements(
          nextStatements
        )

        return newStatement
      },
      [
        patients,
        setStatements,
      ]
    )

  const issueBillingStatement =
    useCallback(
      (
        statementId: string,

        values:
          BillingStatementIssueValues
      ): BillingStatement => {
        const statement =
          getRecordOrThrow(
            statementsRef.current,
            statementId,
            "Billing statement"
          )

        if (
          statement.issuedAt
        ) {
          return statement
        }

        if (
          statement.status !==
          "draft"
        ) {
          throw new Error(
            "Only a draft billing statement can be issued."
          )
        }

        if (
          statement.chargeIds.length ===
          0
        ) {
          throw new Error(
            "The statement has no posted charges."
          )
        }

        const issuedBy =
          normalizeActor(
            values.issuedBy
          )

        const now =
          new Date().toISOString()

        return recalculateStatement(
          {
            ...statement,

            issuedAt: now,
            issuedBy,
          },
          issuedBy,
          now
        )
      },
      [recalculateStatement]
    )

  const addBillingAdjustment =
    useCallback(
      (
        statementId: string,

        values:
          BillingAdjustmentFormValues
      ): BillingStatement => {
        const statement =
          getRecordOrThrow(
            statementsRef.current,
            statementId,
            "Billing statement"
          )

        if (
          statement.status ===
          "voided"
        ) {
          throw new Error(
            "A voided statement cannot receive adjustments."
          )
        }

        const magnitudeCentavos =
          parsePhilippinePesoToCentavos(
            values.amountPhp
          )

        const amountCentavos =
          values.direction ===
          "decrease"
            ? -magnitudeCentavos
            : magnitudeCentavos

        if (
          amountCentavos < 0 &&
          magnitudeCentavos >
            statement.netChargeAmountCentavos
        ) {
          throw new Error(
            "The decrease cannot exceed the current net charge amount."
          )
        }

        const postedBy =
          normalizeActor(
            values.postedBy
          )

        const now =
          new Date().toISOString()

        const adjustment:
          BillingAdjustment = {
          id:
            createTemporaryBillingId(
              "billing-adjustment"
            ),

          statementId:
            statement.id,

          type:
            values.adjustmentType,

          description:
            values.description.trim(),

          amountCentavos,

          status: "posted",

          postedAt: now,
          postedBy,

          reversedAt: null,
          reversedBy: null,
          reversalReason: null,
        }

        const nextAdjustments = [
          adjustment,
          ...adjustmentsRef.current,
        ]

        adjustmentsRef.current =
          nextAdjustments

        setAdjustments(
          nextAdjustments
        )

        return recalculateStatement(
          {
            ...statement,

            adjustmentIds: [
              ...statement.adjustmentIds,
              adjustment.id,
            ],
          },
          postedBy,
          now
        )
      },
      [
        recalculateStatement,
        setAdjustments,
      ]
    )

  const addBillingCoverage =
    useCallback(
      (
        statementId: string,

        values:
          BillingCoverageFormValues
      ): BillingStatement => {
        const statement =
          getRecordOrThrow(
            statementsRef.current,
            statementId,
            "Billing statement"
          )

        if (
          statement.status ===
          "voided"
        ) {
          throw new Error(
            "A voided statement cannot receive coverage allocation."
          )
        }

        const amountCentavos =
          parsePhilippinePesoToCentavos(
            values.amountPhp
          )

        const remainingCoverageCapacity =
          Math.max(
            0,
            statement.netChargeAmountCentavos -
              statement.coverageAmountCentavos
          )

        if (
          amountCentavos >
          remainingCoverageCapacity
        ) {
          throw new Error(
            "Coverage allocation cannot exceed the uncovered net charge amount."
          )
        }

        const allocatedBy =
          normalizeActor(
            values.allocatedBy
          )

        const now =
          new Date().toISOString()

        const allocation:
          BillingCoverageAllocation = {
          id:
            createTemporaryBillingId(
              "billing-coverage"
            ),

          statementId:
            statement.id,

          type:
            values.coverageType,

          payerName:
            values.payerName.trim(),

          amountCentavos,

          referenceNumber:
            values.referenceNumber
              .trim() || null,

          notes:
            values.notes.trim() ||
            null,

          status: "active",

          allocatedAt: now,
          allocatedBy,

          reversedAt: null,
          reversedBy: null,
          reversalReason: null,
        }

        const nextCoverage = [
          allocation,
          ...coverageRef.current,
        ]

        coverageRef.current =
          nextCoverage

        setCoverageAllocations(
          nextCoverage
        )

        return recalculateStatement(
          {
            ...statement,

            coverageAllocationIds:
              [
                ...statement.coverageAllocationIds,
                allocation.id,
              ],
          },
          allocatedBy,
          now
        )
      },
      [
        recalculateStatement,
        setCoverageAllocations,
      ]
    )

  const recordBillingPayment =
    useCallback(
      (
        statementId: string,

        values:
          BillingPaymentFormValues
      ): BillingPaymentResult => {
        const statement =
          getRecordOrThrow(
            statementsRef.current,
            statementId,
            "Billing statement"
          )

        if (
          !statement.issuedAt ||
          statement.status ===
            "draft" ||
          statement.status ===
            "voided"
        ) {
          throw new Error(
            "Only an issued, non-voided statement can receive payment."
          )
        }

        const amountCentavos =
          parsePhilippinePesoToCentavos(
            values.amountPhp
          )

        const postedBy =
          normalizeActor(
            values.postedBy
          )

        const now =
          new Date().toISOString()

        const payment:
          BillingPayment = {
          id:
            createTemporaryBillingId(
              "billing-payment"
            ),

          paymentNumber:
            generateBillingPaymentNumber(
              paymentsRef.current
            ),

          officialReceiptNumber:
            generateOfficialReceiptNumber(
              paymentsRef.current
            ),

          statementId:
            statement.id,

          patientId:
            statement.patientId,

          method:
            values.method,

          amountCentavos,

          externalReference:
            values.externalReference
              .trim() || null,

          notes:
            values.notes.trim() ||
            null,

          status: "posted",

          postedAt: now,
          postedBy,

          reversedAt: null,
          reversedBy: null,
          reversalReason: null,
        }

        const nextPayments = [
          payment,
          ...paymentsRef.current,
        ]

        paymentsRef.current =
          nextPayments

        setPayments(nextPayments)

        const updatedStatement =
          recalculateStatement(
            {
              ...statement,

              paymentIds: [
                ...statement.paymentIds,
                payment.id,
              ],
            },
            postedBy,
            now
          )

        return {
          statement:
            updatedStatement,

          payment,
        }
      },
      [
        recalculateStatement,
        setPayments,
      ]
    )

  const recordBillingRefund =
    useCallback(
      (
        statementId: string,

        values:
          BillingRefundFormValues
      ): BillingRefundResult => {
        const statement =
          getRecordOrThrow(
            statementsRef.current,
            statementId,
            "Billing statement"
          )

        if (
          statement.status ===
            "draft" ||
          statement.status ===
            "voided"
        ) {
          throw new Error(
            "A draft or voided statement cannot receive a refund."
          )
        }

        const amountCentavos =
          parsePhilippinePesoToCentavos(
            values.amountPhp
          )

        const refundableStatementAmount =
          Math.max(
            0,
            statement.amountPaidCentavos -
              statement.refundAmountCentavos
          )

        if (
          amountCentavos >
          refundableStatementAmount
        ) {
          throw new Error(
            "Refund amount exceeds the remaining posted payment amount."
          )
        }

        const paymentId =
          values.paymentId.trim() ||
          null

        if (paymentId) {
          const payment =
            getRecordOrThrow(
              paymentsRef.current,
              paymentId,
              "Billing payment"
            )

          if (
            payment.statementId !==
            statement.id
          ) {
            throw new Error(
              "The selected payment belongs to a different statement."
            )
          }

          if (
            payment.status !==
            "posted"
          ) {
            throw new Error(
              "The selected payment is reversed."
            )
          }

          const priorPaymentRefunds =
            refundsRef.current
              .filter(
                (refund) =>
                  refund.paymentId ===
                    payment.id &&
                  refund.status ===
                    "posted"
              )
              .reduce(
                (
                  total,
                  refund
                ) =>
                  total +
                  refund.amountCentavos,
                0
              )

          const remainingPaymentAmount =
            Math.max(
              0,
              payment.amountCentavos -
                priorPaymentRefunds
            )

          if (
            amountCentavos >
            remainingPaymentAmount
          ) {
            throw new Error(
              "Refund amount exceeds the remaining amount of the selected payment."
            )
          }
        }

        const postedBy =
          normalizeActor(
            values.postedBy
          )

        const now =
          new Date().toISOString()

        const refund:
          BillingRefund = {
          id:
            createTemporaryBillingId(
              "billing-refund"
            ),

          refundNumber:
            generateBillingRefundNumber(
              refundsRef.current
            ),

          statementId:
            statement.id,

          patientId:
            statement.patientId,

          paymentId,

          amountCentavos,

          reason:
            values.reason.trim(),

          status: "posted",

          postedAt: now,
          postedBy,

          reversedAt: null,
          reversedBy: null,
          reversalReason: null,
        }

        const nextRefunds = [
          refund,
          ...refundsRef.current,
        ]

        refundsRef.current =
          nextRefunds

        setRefunds(nextRefunds)

        const updatedStatement =
          recalculateStatement(
            {
              ...statement,

              refundIds: [
                ...statement.refundIds,
                refund.id,
              ],
            },
            postedBy,
            now
          )

        return {
          statement:
            updatedStatement,

          refund,
        }
      },
      [
        recalculateStatement,
        setRefunds,
      ]
    )

  const reverseBillingAdjustment =
    useCallback(
      (
        adjustmentId: string,

        values:
          BillingReversalValues
      ): BillingStatement => {
        const adjustment =
          getRecordOrThrow(
            adjustmentsRef.current,
            adjustmentId,
            "Billing adjustment"
          )

        if (
          adjustment.status ===
          "reversed"
        ) {
          return getRecordOrThrow(
            statementsRef.current,
            adjustment.statementId,
            "Billing statement"
          )
        }

        const actor =
          normalizeActor(
            values.performedBy
          )

        const now =
          new Date().toISOString()

        const reversedAdjustment:
          BillingAdjustment = {
          ...adjustment,

          status: "reversed",

          reversedAt: now,
          reversedBy: actor,

          reversalReason:
            values.reason.trim(),
        }

        const nextAdjustments =
          replaceRecord(
            adjustmentsRef.current,
            reversedAdjustment
          )

        adjustmentsRef.current =
          nextAdjustments

        setAdjustments(
          nextAdjustments
        )

        const statement =
          getRecordOrThrow(
            statementsRef.current,
            adjustment.statementId,
            "Billing statement"
          )

        return recalculateStatement(
          statement,
          actor,
          now
        )
      },
      [
        recalculateStatement,
        setAdjustments,
      ]
    )

  const reverseBillingCoverage =
    useCallback(
      (
        coverageId: string,

        values:
          BillingReversalValues
      ): BillingStatement => {
        const coverage =
          getRecordOrThrow(
            coverageRef.current,
            coverageId,
            "Billing coverage allocation"
          )

        if (
          coverage.status ===
          "reversed"
        ) {
          return getRecordOrThrow(
            statementsRef.current,
            coverage.statementId,
            "Billing statement"
          )
        }

        const actor =
          normalizeActor(
            values.performedBy
          )

        const now =
          new Date().toISOString()

        const reversedCoverage:
          BillingCoverageAllocation = {
          ...coverage,

          status: "reversed",

          reversedAt: now,
          reversedBy: actor,

          reversalReason:
            values.reason.trim(),
        }

        const nextCoverage =
          replaceRecord(
            coverageRef.current,
            reversedCoverage
          )

        coverageRef.current =
          nextCoverage

        setCoverageAllocations(
          nextCoverage
        )

        const statement =
          getRecordOrThrow(
            statementsRef.current,
            coverage.statementId,
            "Billing statement"
          )

        return recalculateStatement(
          statement,
          actor,
          now
        )
      },
      [
        recalculateStatement,
        setCoverageAllocations,
      ]
    )

  const reverseBillingPayment =
    useCallback(
      (
        paymentId: string,

        values:
          BillingReversalValues
      ): BillingStatement => {
        const payment =
          getRecordOrThrow(
            paymentsRef.current,
            paymentId,
            "Billing payment"
          )

        if (
          payment.status ===
          "reversed"
        ) {
          return getRecordOrThrow(
            statementsRef.current,
            payment.statementId,
            "Billing statement"
          )
        }

        const activeRefundExists =
          refundsRef.current.some(
            (refund) =>
              refund.paymentId ===
                payment.id &&
              refund.status ===
                "posted"
          )

        if (activeRefundExists) {
          throw new Error(
            "Reverse the active refund linked to this payment before reversing the payment."
          )
        }

        const actor =
          normalizeActor(
            values.performedBy
          )

        const now =
          new Date().toISOString()

        const reversedPayment:
          BillingPayment = {
          ...payment,

          status: "reversed",

          reversedAt: now,
          reversedBy: actor,

          reversalReason:
            values.reason.trim(),
        }

        const nextPayments =
          replaceRecord(
            paymentsRef.current,
            reversedPayment
          )

        paymentsRef.current =
          nextPayments

        setPayments(nextPayments)

        const statement =
          getRecordOrThrow(
            statementsRef.current,
            payment.statementId,
            "Billing statement"
          )

        return recalculateStatement(
          statement,
          actor,
          now
        )
      },
      [
        recalculateStatement,
        setPayments,
      ]
    )

  const reverseBillingRefund =
    useCallback(
      (
        refundId: string,

        values:
          BillingReversalValues
      ): BillingStatement => {
        const refund =
          getRecordOrThrow(
            refundsRef.current,
            refundId,
            "Billing refund"
          )

        if (
          refund.status ===
          "reversed"
        ) {
          return getRecordOrThrow(
            statementsRef.current,
            refund.statementId,
            "Billing statement"
          )
        }

        const actor =
          normalizeActor(
            values.performedBy
          )

        const now =
          new Date().toISOString()

        const reversedRefund:
          BillingRefund = {
          ...refund,

          status: "reversed",

          reversedAt: now,
          reversedBy: actor,

          reversalReason:
            values.reason.trim(),
        }

        const nextRefunds =
          replaceRecord(
            refundsRef.current,
            reversedRefund
          )

        refundsRef.current =
          nextRefunds

        setRefunds(nextRefunds)

        const statement =
          getRecordOrThrow(
            statementsRef.current,
            refund.statementId,
            "Billing statement"
          )

        return recalculateStatement(
          statement,
          actor,
          now
        )
      },
      [
        recalculateStatement,
        setRefunds,
      ]
    )

  const voidBillingCharge =
    useCallback(
      (
        chargeId: string,

        values:
          BillingReversalValues
      ): BillingCharge => {
        const charge =
          getRecordOrThrow(
            chargesRef.current,
            chargeId,
            "Billing charge"
          )

        if (
          charge.status ===
          "voided"
        ) {
          return charge
        }

        const assignedStatement =
          statementsRef.current.find(
            (statement) =>
              statement.status !==
                "voided" &&
              statement.chargeIds.includes(
                charge.id
              )
          )

        if (assignedStatement) {
          throw new Error(
            `The charge is assigned to ${assignedStatement.statementNumber} and cannot be voided directly.`
          )
        }

        const actor =
          normalizeActor(
            values.performedBy
          )

        const now =
          new Date().toISOString()

        const voidedCharge:
          BillingCharge = {
          ...charge,

          status: "voided",

          voidedAt: now,
          voidedBy: actor,

          voidReason:
            values.reason.trim(),

          updatedAt: now,
          updatedBy: actor,
        }

        const nextCharges =
          replaceRecord(
            chargesRef.current,
            voidedCharge
          )

        chargesRef.current =
          nextCharges

        setCharges(nextCharges)

        return voidedCharge
      },
      [setCharges]
    )

  const voidBillingStatement =
    useCallback(
      (
        statementId: string,

        values:
          BillingReversalValues
      ): BillingStatement => {
        const statement =
          getRecordOrThrow(
            statementsRef.current,
            statementId,
            "Billing statement"
          )

        if (
          statement.status ===
          "voided"
        ) {
          return statement
        }

        const hasPostedPayments =
          paymentsRef.current.some(
            (payment) =>
              statement.paymentIds.includes(
                payment.id
              ) &&
              payment.status ===
                "posted"
          )

        const hasPostedRefunds =
          refundsRef.current.some(
            (refund) =>
              statement.refundIds.includes(
                refund.id
              ) &&
              refund.status ===
                "posted"
          )

        if (
          hasPostedPayments ||
          hasPostedRefunds
        ) {
          throw new Error(
            "Reverse posted payments and refunds before voiding the statement."
          )
        }

        const actor =
          normalizeActor(
            values.performedBy
          )

        const now =
          new Date().toISOString()

        const voidedStatement:
          BillingStatement = {
          ...statement,

          status: "voided",

          voidedAt: now,
          voidedBy: actor,

          voidReason:
            values.reason.trim(),

          closedAt: null,
          closedBy: null,

          updatedAt: now,
          updatedBy: actor,
        }

        return saveStatement(
          voidedStatement
        )
      },
      [saveStatement]
    )

  const contextValue =
    useMemo<BillingContextValue>(
      () => ({
        charges,
        statements,
        adjustments,
        coverageAllocations,
        payments,
        refunds,

        createBillingCharge,
        createBillingStatement,
        issueBillingStatement,

        addBillingAdjustment,
        addBillingCoverage,

        recordBillingPayment,
        recordBillingRefund,

        reverseBillingAdjustment,
        reverseBillingCoverage,
        reverseBillingPayment,
        reverseBillingRefund,

        voidBillingCharge,
        voidBillingStatement,
      }),
      [
        charges,
        statements,
        adjustments,
        coverageAllocations,
        payments,
        refunds,

        createBillingCharge,
        createBillingStatement,
        issueBillingStatement,

        addBillingAdjustment,
        addBillingCoverage,

        recordBillingPayment,
        recordBillingRefund,

        reverseBillingAdjustment,
        reverseBillingCoverage,
        reverseBillingPayment,
        reverseBillingRefund,

        voidBillingCharge,
        voidBillingStatement,
      ]
    )

  return (
    <BillingContext.Provider
      value={contextValue}
    >
      {children}
    </BillingContext.Provider>
  )
}

export function useBilling(): BillingContextValue {
  const context =
    useContext(BillingContext)

  if (!context) {
    throw new Error(
      "useBilling must be used inside BillingProvider."
    )
  }

  return context
}
