import type {
  BillingAdjustment,
  BillingCharge,
  BillingCoverageAllocation,
  BillingPayment,
  BillingRefund,
  BillingStatement,
} from "@/features/billing/types/billing.types"

/**
 * All amounts are synthetic Philippine
 * centavo values for development testing.
 *
 * No real prices, insurance approvals,
 * payments, or official receipts are
 * represented here.
 */
export const MOCK_BILLING_CHARGES: readonly BillingCharge[] =
  [
    {
      id:
        "mock-billing-charge-0001",

      chargeNumber:
        "GM-CHG-2026-000001",

      patientId:
        "mock-patient-0002",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "consultation",

      sourceRecordId:
        "mock-consultation-0002",

      sourceReference:
        "GM-CON-2026-000002",

      catalogCode:
        "BILL-CONSULT-GENERAL",

      description:
        "Synthetic General Outpatient Consultation",

      quantity: 1,

      unitAmountCentavos:
        150000,

      grossAmountCentavos:
        150000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T08:15:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T08:15:00+08:00",

      updatedAt:
        "2026-08-04T08:15:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0002",

      chargeNumber:
        "GM-CHG-2026-000002",

      patientId:
        "mock-patient-0002",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "laboratory",

      sourceRecordId:
        "mock-lab-order-0001",

      sourceReference:
        "GM-LAB-2026-000001",

      catalogCode:
        "BILL-LAB-CBC",

      description:
        "Synthetic Complete Blood Count",

      quantity: 1,

      unitAmountCentavos:
        45000,

      grossAmountCentavos:
        45000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T08:20:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T08:20:00+08:00",

      updatedAt:
        "2026-08-04T08:20:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0003",

      chargeNumber:
        "GM-CHG-2026-000003",

      patientId:
        "mock-patient-0002",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "radiology",

      sourceRecordId:
        "mock-radiology-order-0001",

      sourceReference:
        "GM-RAD-2026-000001",

      catalogCode:
        "BILL-RAD-CT-BRAIN-NC",

      description:
        "Synthetic CT Brain Without Contrast",

      quantity: 1,

      unitAmountCentavos:
        450000,

      grossAmountCentavos:
        450000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T08:30:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T08:30:00+08:00",

      updatedAt:
        "2026-08-04T08:30:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0004",

      chargeNumber:
        "GM-CHG-2026-000004",

      patientId:
        "mock-patient-0004",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "appointment",

      sourceRecordId:
        "mock-appointment-0004",

      sourceReference:
        "GM-APT-2026-000004",

      catalogCode:
        "BILL-APPT-FACILITY",

      description:
        "Synthetic Appointment Facility Service",

      quantity: 1,

      unitAmountCentavos:
        25000,

      grossAmountCentavos:
        25000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T08:45:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T08:45:00+08:00",

      updatedAt:
        "2026-08-04T08:45:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0005",

      chargeNumber:
        "GM-CHG-2026-000005",

      patientId:
        "mock-patient-0004",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "radiology",

      sourceRecordId:
        "mock-radiology-order-0002",

      sourceReference:
        "GM-RAD-2026-000002",

      catalogCode:
        "BILL-RAD-XR-CHEST-2V",

      description:
        "Synthetic Chest Radiograph — PA and Lateral",

      quantity: 1,

      unitAmountCentavos:
        90000,

      grossAmountCentavos:
        90000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T08:50:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T08:50:00+08:00",

      updatedAt:
        "2026-08-04T08:50:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0006",

      chargeNumber:
        "GM-CHG-2026-000006",

      patientId:
        "mock-patient-0004",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "pharmacy",

      sourceRecordId:
        "mock-pharmacy-prescription-0002",

      sourceReference:
        "GM-RX-2026-000002",

      catalogCode:
        "BILL-PHARM-DISPENSING",

      description:
        "Synthetic Pharmacy Dispensing Service",

      quantity: 1,

      unitAmountCentavos:
        5000,

      grossAmountCentavos:
        5000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T09:00:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T09:00:00+08:00",

      updatedAt:
        "2026-08-04T09:00:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0007",

      chargeNumber:
        "GM-CHG-2026-000007",

      patientId:
        "mock-patient-0004",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "pharmacy",

      sourceRecordId:
        "mock-pharmacy-prescription-0002",

      sourceReference:
        "GM-RX-2026-000002",

      catalogCode:
        "BILL-PHARM-PARA-500-TAB",

      description:
        "Synthetic Paracetamol 500 mg Tablet",

      quantity: 10,

      unitAmountCentavos:
        300,

      grossAmountCentavos:
        3000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T09:01:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T09:01:00+08:00",

      updatedAt:
        "2026-08-04T09:01:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0008",

      chargeNumber:
        "GM-CHG-2026-000008",

      patientId:
        "mock-patient-0005",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "laboratory",

      sourceRecordId:
        "mock-lab-order-0002",

      sourceReference:
        "GM-LAB-2026-000002",

      catalogCode:
        "BILL-LAB-CRP",

      description:
        "Synthetic C-Reactive Protein",

      quantity: 1,

      unitAmountCentavos:
        70000,

      grossAmountCentavos:
        70000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T09:15:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T09:15:00+08:00",

      updatedAt:
        "2026-08-04T09:15:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0009",

      chargeNumber:
        "GM-CHG-2026-000009",

      patientId:
        "mock-patient-0005",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "radiology",

      sourceRecordId:
        "mock-radiology-order-0003",

      sourceReference:
        "GM-RAD-2026-000003",

      catalogCode:
        "BILL-RAD-US-ABD-COMPLETE",

      description:
        "Synthetic Complete Abdominal Ultrasound",

      quantity: 1,

      unitAmountCentavos:
        180000,

      grossAmountCentavos:
        180000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T09:20:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T09:20:00+08:00",

      updatedAt:
        "2026-08-04T09:20:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0010",

      chargeNumber:
        "GM-CHG-2026-000010",

      patientId:
        "mock-patient-0001",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "consultation",

      sourceRecordId:
        "mock-consultation-0001",

      sourceReference:
        "GM-CON-2026-000001",

      catalogCode:
        "BILL-CONSULT-GENERAL",

      description:
        "Synthetic General Outpatient Consultation",

      quantity: 1,

      unitAmountCentavos:
        150000,

      grossAmountCentavos:
        150000,

      taxable: false,

      notes: null,

      status: "posted",

      postedAt:
        "2026-08-04T09:30:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T09:30:00+08:00",

      updatedAt:
        "2026-08-04T09:30:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-charge-0011",

      chargeNumber:
        "GM-CHG-2026-000011",

      patientId:
        "mock-patient-0013",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      source: "manual",

      sourceRecordId: null,
      sourceReference: null,

      catalogCode:
        "BILL-MANUAL-MISC",

      description:
        "Synthetic Unassigned Manual Charge",

      quantity: 1,

      unitAmountCentavos:
        50000,

      grossAmountCentavos:
        50000,

      taxable: false,

      notes:
        "Available for draft-statement testing.",

      status: "posted",

      postedAt:
        "2026-08-04T11:30:00+08:00",

      postedBy:
        "GalenMed Billing Desk",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T11:30:00+08:00",

      updatedAt:
        "2026-08-04T11:30:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
  ]

export const MOCK_BILLING_ADJUSTMENTS: readonly BillingAdjustment[] =
  [
    {
      id:
        "mock-billing-adjustment-0001",

      statementId:
        "mock-billing-statement-0001",

      type: "discount",

      description:
        "Synthetic approved patient discount",

      amountCentavos:
        -50000,

      status: "posted",

      postedAt:
        "2026-08-04T09:45:00+08:00",

      postedBy:
        "Synthetic Billing Officer A",

      reversedAt: null,
      reversedBy: null,
      reversalReason: null,
    },
  ]

export const MOCK_BILLING_COVERAGE_ALLOCATIONS: readonly BillingCoverageAllocation[] =
  [
    {
      id:
        "mock-billing-coverage-0001",

      statementId:
        "mock-billing-statement-0001",

      type: "insurance",

      payerName:
        "Synthetic Health Coverage Plan",

      amountCentavos:
        300000,

      referenceNumber:
        "SYN-COV-0001",

      notes:
        "Synthetic coverage allocation.",

      status: "active",

      allocatedAt:
        "2026-08-04T09:50:00+08:00",

      allocatedBy:
        "Synthetic Billing Officer A",

      reversedAt: null,
      reversedBy: null,
      reversalReason: null,
    },
  ]

export const MOCK_BILLING_PAYMENTS: readonly BillingPayment[] =
  [
    {
      id:
        "mock-billing-payment-0001",

      paymentNumber:
        "GM-PAY-2026-000001",

      officialReceiptNumber:
        "GM-OR-2026-000001",

      statementId:
        "mock-billing-statement-0001",

      patientId:
        "mock-patient-0002",

      method: "cash",

      amountCentavos:
        150000,

      externalReference: null,

      notes:
        "Synthetic partial payment.",

      status: "posted",

      postedAt:
        "2026-08-04T10:05:00+08:00",

      postedBy:
        "Synthetic Cashier A",

      reversedAt: null,
      reversedBy: null,
      reversalReason: null,
    },
    {
      id:
        "mock-billing-payment-0002",

      paymentNumber:
        "GM-PAY-2026-000002",

      officialReceiptNumber:
        "GM-OR-2026-000002",

      statementId:
        "mock-billing-statement-0002",

      patientId:
        "mock-patient-0004",

      method: "card",

      amountCentavos:
        123000,

      externalReference:
        "SYN-CARD-0002",

      notes:
        "Synthetic full payment.",

      status: "posted",

      postedAt:
        "2026-08-04T10:30:00+08:00",

      postedBy:
        "Synthetic Cashier B",

      reversedAt: null,
      reversedBy: null,
      reversalReason: null,
    },
    {
      id:
        "mock-billing-payment-0003",

      paymentNumber:
        "GM-PAY-2026-000003",

      officialReceiptNumber:
        "GM-OR-2026-000003",

      statementId:
        "mock-billing-statement-0004",

      patientId:
        "mock-patient-0001",

      method:
        "bank-transfer",

      amountCentavos:
        160000,

      externalReference:
        "SYN-BANK-0003",

      notes:
        "Synthetic payment with credit balance.",

      status: "posted",

      postedAt:
        "2026-08-04T11:15:00+08:00",

      postedBy:
        "Synthetic Cashier C",

      reversedAt: null,
      reversedBy: null,
      reversalReason: null,
    },
  ]

export const MOCK_BILLING_REFUNDS: readonly BillingRefund[] =
  []

export const MOCK_BILLING_STATEMENTS: readonly BillingStatement[] =
  [
    {
      id:
        "mock-billing-statement-0001",

      statementNumber:
        "GM-BILL-2026-000001",

      patientId:
        "mock-patient-0002",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      chargeIds: [
        "mock-billing-charge-0001",
        "mock-billing-charge-0002",
        "mock-billing-charge-0003",
      ],

      adjustmentIds: [
        "mock-billing-adjustment-0001",
      ],

      coverageAllocationIds: [
        "mock-billing-coverage-0001",
      ],

      paymentIds: [
        "mock-billing-payment-0001",
      ],

      refundIds: [],

      status:
        "partially-paid",

      grossAmountCentavos:
        645000,

      adjustmentAmountCentavos:
        -50000,

      netChargeAmountCentavos:
        595000,

      coverageAmountCentavos:
        300000,

      patientResponsibilityCentavos:
        295000,

      amountPaidCentavos:
        150000,

      refundAmountCentavos: 0,

      balanceDueCentavos:
        145000,

      creditBalanceCentavos: 0,

      notes:
        "Synthetic partially paid patient statement.",

      issuedAt:
        "2026-08-04T10:00:00+08:00",

      issuedBy:
        "Synthetic Billing Officer A",

      closedAt: null,
      closedBy: null,

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T09:35:00+08:00",

      updatedAt:
        "2026-08-04T10:05:00+08:00",

      updatedBy:
        "Synthetic Cashier A",
    },
    {
      id:
        "mock-billing-statement-0002",

      statementNumber:
        "GM-BILL-2026-000002",

      patientId:
        "mock-patient-0004",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      chargeIds: [
        "mock-billing-charge-0004",
        "mock-billing-charge-0005",
        "mock-billing-charge-0006",
        "mock-billing-charge-0007",
      ],

      adjustmentIds: [],

      coverageAllocationIds: [],

      paymentIds: [
        "mock-billing-payment-0002",
      ],

      refundIds: [],

      status: "paid",

      grossAmountCentavos:
        123000,

      adjustmentAmountCentavos: 0,

      netChargeAmountCentavos:
        123000,

      coverageAmountCentavos: 0,

      patientResponsibilityCentavos:
        123000,

      amountPaidCentavos:
        123000,

      refundAmountCentavos: 0,

      balanceDueCentavos: 0,
      creditBalanceCentavos: 0,

      notes:
        "Synthetic fully paid statement.",

      issuedAt:
        "2026-08-04T10:15:00+08:00",

      issuedBy:
        "Synthetic Billing Officer B",

      closedAt:
        "2026-08-04T10:30:00+08:00",

      closedBy:
        "Synthetic Cashier B",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T10:00:00+08:00",

      updatedAt:
        "2026-08-04T10:30:00+08:00",

      updatedBy:
        "Synthetic Cashier B",
    },
    {
      id:
        "mock-billing-statement-0003",

      statementNumber:
        "GM-BILL-2026-000003",

      patientId:
        "mock-patient-0005",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      chargeIds: [
        "mock-billing-charge-0008",
        "mock-billing-charge-0009",
      ],

      adjustmentIds: [],

      coverageAllocationIds: [],

      paymentIds: [],
      refundIds: [],

      status: "draft",

      grossAmountCentavos:
        250000,

      adjustmentAmountCentavos: 0,

      netChargeAmountCentavos:
        250000,

      coverageAmountCentavos: 0,

      patientResponsibilityCentavos:
        250000,

      amountPaidCentavos: 0,
      refundAmountCentavos: 0,

      balanceDueCentavos:
        250000,

      creditBalanceCentavos: 0,

      notes:
        "Synthetic draft statement.",

      issuedAt: null,
      issuedBy: null,

      closedAt: null,
      closedBy: null,

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T10:40:00+08:00",

      updatedAt:
        "2026-08-04T10:40:00+08:00",

      updatedBy:
        "GalenMed Billing Desk",
    },
    {
      id:
        "mock-billing-statement-0004",

      statementNumber:
        "GM-BILL-2026-000004",

      patientId:
        "mock-patient-0001",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      chargeIds: [
        "mock-billing-charge-0010",
      ],

      adjustmentIds: [],

      coverageAllocationIds: [],

      paymentIds: [
        "mock-billing-payment-0003",
      ],

      refundIds: [],

      status: "paid",

      grossAmountCentavos:
        150000,

      adjustmentAmountCentavos: 0,

      netChargeAmountCentavos:
        150000,

      coverageAmountCentavos: 0,

      patientResponsibilityCentavos:
        150000,

      amountPaidCentavos:
        160000,

      refundAmountCentavos: 0,

      balanceDueCentavos: 0,

      creditBalanceCentavos:
        10000,

      notes:
        "Synthetic statement with patient credit balance.",

      issuedAt:
        "2026-08-04T11:00:00+08:00",

      issuedBy:
        "Synthetic Billing Officer C",

      closedAt:
        "2026-08-04T11:15:00+08:00",

      closedBy:
        "Synthetic Cashier C",

      voidedAt: null,
      voidedBy: null,
      voidReason: null,

      createdAt:
        "2026-08-04T10:50:00+08:00",

      updatedAt:
        "2026-08-04T11:15:00+08:00",

      updatedBy:
        "Synthetic Cashier C",
    },
  ]
