import "server-only"

import {
  notFound,
} from "next/navigation"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  CASHIER_BILLING_ACCOUNT_STATUSES,
  CASHIER_PAYMENT_CLEARANCE_STATUSES,
  CASHIER_PAYMENT_METHODS,
  CASHIER_PAYMENT_TRANSACTION_STATUSES,
  CASHIER_RECEIPT_PRINT_TYPES,
  type CashierBillingAccount,
  type CashierBillingAccountStatus,
  type CashierBillingPageData,
  type CashierChargeItem,
  type CashierPaymentClearance,
  type CashierPaymentClearanceStatus,
  type CashierPaymentMethod,
  type CashierPaymentTransaction,
  type CashierPaymentTransactionStatus,
  type CashierReceiptPageData,
  type CashierReceiptPrintLog,
  type CashierReceiptPrintType,
} from "@/features/hospital-operations/types/cashier-billing.types"
import {
  createClient,
} from "@/lib/supabase/server"

interface RawBillingAccount {
  id: string
  billing_number: string
  patient_id: string
  visit_id: string
  branch_id: string
  currency_code: string
  status: string
  gross_amount_centavos: number
  discount_amount_centavos: number
  coverage_amount_centavos: number
  paid_amount_centavos: number
  refunded_amount_centavos: number
  balance_amount_centavos: number
  created_at: string
  updated_at: string
}

interface RawPatient {
  id: string
  medical_record_number: string
  first_name: string
  middle_name: string | null
  last_name: string
  date_of_birth: string
  biological_sex: string
  mobile_number: string | null
  email_address: string | null
}

interface RawVisit {
  id: string
  visit_number: string
  arrival_mode: string
  initial_service_type: string
  status: string
  registered_at: string
  checked_in_at: string | null
}

interface RawBranch {
  id: string
  name: string
}

interface RawChargeItem {
  id: string
  billing_account_id: string
  service_request_id: string | null
  source_module: string
  source_record_id: string | null
  description: string
  quantity: number
  unit_amount_centavos: number
  total_amount_centavos: number
  status: string
  posted_at: string
}

interface RawPaymentTransaction {
  id: string
  billing_account_id: string
  payment_number: string
  amount_centavos: number
  payment_method: string
  status: string
  external_reference: string | null
  official_receipt_number: string | null
  posted_at: string
}

interface RawPaymentClearance {
  id: string
  billing_account_id: string
  service_request_id: string
  clearance_status: string
  required_amount_centavos: number
  cleared_amount_centavos: number
  clearance_reason: string | null
  cleared_at: string | null
}

interface RawServiceRequest {
  id: string
  request_number: string
  service_type: string
  service_catalog_item_id: string | null
  status: string
}

interface RawCatalogItem {
  id: string
  name: string
}

interface RawReleaseClearance {
  payment_clearance_id: string | null
  release_status: string
}

interface RawReceiptPrintLog {
  id: number
  payment_transaction_id: string
  print_type: string
  copy_number: number
  print_reason: string | null
  printed_at: string
}

function includesValue<
  Value extends string,
>(
  values: readonly Value[],
  candidate: string
): candidate is Value {
  return values.some(
    (value) =>
      value === candidate
  )
}

function readBillingStatus(
  value: string
): CashierBillingAccountStatus {
  if (
    !includesValue(
      CASHIER_BILLING_ACCOUNT_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported billing-account status: ${value}`
    )
  }

  return value
}

function readPaymentMethod(
  value: string
): CashierPaymentMethod {
  if (
    !includesValue(
      CASHIER_PAYMENT_METHODS,
      value
    )
  ) {
    throw new Error(
      `Unsupported payment method: ${value}`
    )
  }

  return value
}

function readPaymentStatus(
  value: string
): CashierPaymentTransactionStatus {
  if (
    !includesValue(
      CASHIER_PAYMENT_TRANSACTION_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported payment status: ${value}`
    )
  }

  return value
}

function readClearanceStatus(
  value: string
): CashierPaymentClearanceStatus {
  if (
    !includesValue(
      CASHIER_PAYMENT_CLEARANCE_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported payment-clearance status: ${value}`
    )
  }

  return value
}

function readReceiptPrintType(
  value: string
): CashierReceiptPrintType {
  if (
    !includesValue(
      CASHIER_RECEIPT_PRINT_TYPES,
      value
    )
  ) {
    throw new Error(
      `Unsupported receipt print type: ${value}`
    )
  }

  return value
}

function toSafeNumber(
  value: number
): number {
  const parsed = Number(value)

  if (
    !Number.isFinite(parsed)
  ) {
    return 0
  }

  return parsed
}

async function loadBillingAccounts(): Promise<{
  context: Awaited<
    ReturnType<
      typeof requireStaffRole
    >
  >
  data: CashierBillingPageData
}> {
  const context =
    await requireStaffRole([
      "CASHIER",
      "SYSTEM_ADMIN",
    ])

  const branchIds =
    context.branches.map(
      (branch) => branch.id
    )

  if (
    branchIds.length === 0
  ) {
    return {
      context,
      data: {
        accounts: [],
      },
    }
  }

  const supabase =
    await createClient()

  const {
    data: accountData,
    error: accountError,
  } = await supabase
    .from("billing_accounts")
    .select(
      "id, billing_number, patient_id, visit_id, branch_id, currency_code, status, gross_amount_centavos, discount_amount_centavos, coverage_amount_centavos, paid_amount_centavos, refunded_amount_centavos, balance_amount_centavos, created_at, updated_at"
    )
    .in("branch_id", branchIds)
    .order("updated_at", {
      ascending: false,
    })
    .limit(500)

  if (accountError) {
    throw new Error(
      "Unable to load Cashier billing accounts."
    )
  }

  const accounts =
    (accountData ?? []) as
      RawBillingAccount[]

  if (
    accounts.length === 0
  ) {
    return {
      context,
      data: {
        accounts: [],
      },
    }
  }

  const accountIds =
    accounts.map(
      (account) => account.id
    )

  const patientIds =
    Array.from(
      new Set(
        accounts.map(
          (account) =>
            account.patient_id
        )
      )
    )

  const visitIds =
    Array.from(
      new Set(
        accounts.map(
          (account) =>
            account.visit_id
        )
      )
    )

  const [
    patientResult,
    visitResult,
    branchResult,
    chargeResult,
    paymentResult,
    clearanceResult,
  ] = await Promise.all([
    supabase
      .from("patients")
      .select(
        "id, medical_record_number, first_name, middle_name, last_name, date_of_birth, biological_sex, mobile_number, email_address"
      )
      .in("id", patientIds),

    supabase
      .from("hospital_visits")
      .select(
        "id, visit_number, arrival_mode, initial_service_type, status, registered_at, checked_in_at"
      )
      .in("id", visitIds),

    supabase
      .from("hospital_branches")
      .select("id, name")
      .in("id", branchIds),

    supabase
      .from("billing_charge_items")
      .select(
        "id, billing_account_id, service_request_id, source_module, source_record_id, description, quantity, unit_amount_centavos, total_amount_centavos, status, posted_at"
      )
      .in(
        "billing_account_id",
        accountIds
      )
      .order("posted_at", {
        ascending: true,
      }),

    supabase
      .from("payment_transactions")
      .select(
        "id, billing_account_id, payment_number, amount_centavos, payment_method, status, external_reference, official_receipt_number, posted_at"
      )
      .in(
        "billing_account_id",
        accountIds
      )
      .order("posted_at", {
        ascending: false,
      }),

    supabase
      .from("payment_clearances")
      .select(
        "id, billing_account_id, service_request_id, clearance_status, required_amount_centavos, cleared_amount_centavos, clearance_reason, cleared_at"
      )
      .in(
        "billing_account_id",
        accountIds
      )
      .order("updated_at", {
        ascending: false,
      }),
  ])

  const queryError =
    patientResult.error ??
    visitResult.error ??
    branchResult.error ??
    chargeResult.error ??
    paymentResult.error ??
    clearanceResult.error

  if (queryError) {
    throw new Error(
      "Unable to load complete Cashier billing details."
    )
  }

  const patients =
    (patientResult.data ?? []) as
      RawPatient[]

  const visits =
    (visitResult.data ?? []) as
      RawVisit[]

  const branches =
    (branchResult.data ?? []) as
      RawBranch[]

  const charges =
    (chargeResult.data ?? []) as
      RawChargeItem[]

  const payments =
    (paymentResult.data ?? []) as
      RawPaymentTransaction[]

  const clearances =
    (clearanceResult.data ?? []) as
      RawPaymentClearance[]

  const clearanceRequestIds =
    Array.from(
      new Set(
        clearances.map(
          (clearance) =>
            clearance.service_request_id
        )
      )
    )

  const clearanceIds =
    clearances.map(
      (clearance) => clearance.id
    )

  const [
    requestResult,
    releaseResult,
  ] = await Promise.all([
    clearanceRequestIds.length > 0
      ? supabase
          .from("service_requests")
          .select(
            "id, request_number, service_type, service_catalog_item_id, status"
          )
          .in("id", clearanceRequestIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    clearanceIds.length > 0
      ? supabase
          .from(
            "document_release_clearances"
          )
          .select(
            "payment_clearance_id, release_status"
          )
          .in(
            "payment_clearance_id",
            clearanceIds
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ])

  if (
    requestResult.error ||
    releaseResult.error
  ) {
    throw new Error(
      "Unable to load payment-clearance context."
    )
  }

  const requests =
    (requestResult.data ?? []) as
      RawServiceRequest[]

  const releaseClearances =
    (releaseResult.data ?? []) as
      RawReleaseClearance[]

  const catalogIds =
    Array.from(
      new Set(
        requests
          .map(
            (request) =>
              request.service_catalog_item_id
          )
          .filter(
            (
              value
            ): value is string =>
              value !== null
          )
      )
    )

  const catalogResult =
    catalogIds.length > 0
      ? await supabase
          .from("service_catalog_items")
          .select("id, name")
          .in("id", catalogIds)
      : {
          data: [],
          error: null,
        }

  if (catalogResult.error) {
    throw new Error(
      "Unable to load billing service names."
    )
  }

  const catalogItems =
    (catalogResult.data ?? []) as
      RawCatalogItem[]

  const patientById =
    new Map(
      patients.map(
        (patient) => [
          patient.id,
          patient,
        ]
      )
    )

  const visitById =
    new Map(
      visits.map(
        (visit) => [
          visit.id,
          visit,
        ]
      )
    )

  const branchById =
    new Map(
      branches.map(
        (branch) => [
          branch.id,
          branch,
        ]
      )
    )

  const requestById =
    new Map(
      requests.map(
        (request) => [
          request.id,
          request,
        ]
      )
    )

  const catalogById =
    new Map(
      catalogItems.map(
        (item) => [
          item.id,
          item,
        ]
      )
    )

  const mappedAccounts:
    CashierBillingAccount[] =
    accounts.map((account) => {
      const patient =
        patientById.get(
          account.patient_id
        )

      const visit =
        visitById.get(
          account.visit_id
        )

      const branch =
        branchById.get(
          account.branch_id
        )

      if (
        !patient ||
        !visit ||
        !branch
      ) {
        throw new Error(
          `Incomplete billing context for ${account.billing_number}.`
        )
      }

      const accountCharges:
        CashierChargeItem[] =
        charges
          .filter(
            (charge) =>
              charge.billing_account_id ===
              account.id
          )
          .map((charge) => ({
            id: charge.id,
            serviceRequestId:
              charge.service_request_id,
            sourceModule:
              charge.source_module,
            sourceRecordId:
              charge.source_record_id,
            description:
              charge.description,
            quantity:
              toSafeNumber(
                charge.quantity
              ),
            unitAmountCentavos:
              toSafeNumber(
                charge.unit_amount_centavos
              ),
            totalAmountCentavos:
              toSafeNumber(
                charge.total_amount_centavos
              ),
            status: charge.status,
            postedAt:
              charge.posted_at,
          }))

      const accountPayments:
        CashierPaymentTransaction[] =
        payments
          .filter(
            (payment) =>
              payment.billing_account_id ===
              account.id
          )
          .map((payment) => ({
            id: payment.id,
            paymentNumber:
              payment.payment_number,
            amountCentavos:
              toSafeNumber(
                payment.amount_centavos
              ),
            paymentMethod:
              readPaymentMethod(
                payment.payment_method
              ),
            status:
              readPaymentStatus(
                payment.status
              ),
            externalReference:
              payment.external_reference,
            officialReceiptNumber:
              payment.official_receipt_number,
            postedAt:
              payment.posted_at,
          }))

      const accountClearances:
        CashierPaymentClearance[] =
        clearances
          .filter(
            (clearance) =>
              clearance.billing_account_id ===
              account.id
          )
          .map((clearance) => {
            const request =
              requestById.get(
                clearance.service_request_id
              )

            const catalogItem =
              request
                ?.service_catalog_item_id
              ? catalogById.get(
                  request
                    .service_catalog_item_id
                )
              : null

            const relatedReleases =
              releaseClearances.filter(
                (release) =>
                  release.payment_clearance_id ===
                  clearance.id
              )

            return {
              id: clearance.id,
              serviceRequestId:
                clearance.service_request_id,
              requestNumber:
                request?.request_number ??
                "Request unavailable",
              serviceType:
                request?.service_type ??
                "other",
              serviceName:
                catalogItem?.name ??
                request?.service_type ??
                "Hospital service",
              requestStatus:
                request?.status ??
                "unknown",
              clearanceStatus:
                readClearanceStatus(
                  clearance.clearance_status
                ),
              requiredAmountCentavos:
                toSafeNumber(
                  clearance.required_amount_centavos
                ),
              clearedAmountCentavos:
                toSafeNumber(
                  clearance.cleared_amount_centavos
                ),
              clearanceReason:
                clearance.clearance_reason,
              clearedAt:
                clearance.cleared_at,
              releaseReadyCount:
                relatedReleases.filter(
                  (release) =>
                    release.release_status ===
                    "ready"
                ).length,
              releasePendingCount:
                relatedReleases.filter(
                  (release) =>
                    release.release_status ===
                    "payment_pending"
                ).length,
              releaseReleasedCount:
                relatedReleases.filter(
                  (release) =>
                    release.release_status ===
                    "released"
                ).length,
            }
          })

      return {
        id: account.id,
        billingNumber:
          account.billing_number,
        branchId:
          account.branch_id,
        branchName:
          branch.name,
        currencyCode:
          account.currency_code,
        status:
          readBillingStatus(
            account.status
          ),
        grossAmountCentavos:
          toSafeNumber(
            account.gross_amount_centavos
          ),
        discountAmountCentavos:
          toSafeNumber(
            account.discount_amount_centavos
          ),
        coverageAmountCentavos:
          toSafeNumber(
            account.coverage_amount_centavos
          ),
        paidAmountCentavos:
          toSafeNumber(
            account.paid_amount_centavos
          ),
        refundedAmountCentavos:
          toSafeNumber(
            account.refunded_amount_centavos
          ),
        balanceAmountCentavos:
          toSafeNumber(
            account.balance_amount_centavos
          ),
        createdAt:
          account.created_at,
        updatedAt:
          account.updated_at,
        patient: {
          id: patient.id,
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
          biologicalSex:
            patient.biological_sex,
          mobileNumber:
            patient.mobile_number,
          emailAddress:
            patient.email_address,
        },
        visit: {
          id: visit.id,
          visitNumber:
            visit.visit_number,
          arrivalMode:
            visit.arrival_mode,
          initialServiceType:
            visit.initial_service_type,
          status: visit.status,
          registeredAt:
            visit.registered_at,
          checkedInAt:
            visit.checked_in_at,
        },
        chargeItems:
          accountCharges,
        paymentTransactions:
          accountPayments,
        paymentClearances:
          accountClearances,
      }
    })

  return {
    context,
    data: {
      accounts:
        mappedAccounts,
    },
  }
}

export async function getCashierBillingPageData() {
  return loadBillingAccounts()
}

export async function getCashierReceiptPageData(
  paymentId: string
): Promise<{
  context: Awaited<
    ReturnType<
      typeof requireStaffRole
    >
  >
  data: CashierReceiptPageData
}> {
  const {
    context,
    data,
  } = await loadBillingAccounts()

  const account =
    data.accounts.find(
      (candidateAccount) =>
        candidateAccount.paymentTransactions.some(
          (payment) =>
            payment.id === paymentId
        )
    )

  if (!account) {
    notFound()
  }

  const payment =
    account.paymentTransactions.find(
      (candidatePayment) =>
        candidatePayment.id ===
        paymentId
    )

  if (
    !payment ||
    payment.status !== "posted" ||
    !payment.officialReceiptNumber
  ) {
    notFound()
  }

  const supabase =
    await createClient()

  const {
    data: printData,
    error: printError,
  } = await supabase
    .from(
      "cashier_receipt_print_logs"
    )
    .select(
      "id, payment_transaction_id, print_type, copy_number, print_reason, printed_at"
    )
    .eq(
      "payment_transaction_id",
      paymentId
    )
    .order("copy_number", {
      ascending: true,
    })

  if (printError) {
    throw new Error(
      "Unable to load receipt print history."
    )
  }

  const printLogs:
    CashierReceiptPrintLog[] =
    (
      (printData ?? []) as
        RawReceiptPrintLog[]
    ).map((log) => ({
      id: log.id,
      printType:
        readReceiptPrintType(
          log.print_type
        ),
      copyNumber:
        log.copy_number,
      printReason:
        log.print_reason,
      printedAt:
        log.printed_at,
    }))

  return {
    context,
    data: {
      payment,
      account,
      printLogs,
    },
  }
}
